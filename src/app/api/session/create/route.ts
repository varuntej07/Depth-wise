import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateBranches } from "@/lib/claude";
import { LAYOUT_CONFIG } from "@/lib/layout";
import { canUserExplore } from "@/lib/subscription-config";
import { sanitizeQuery } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { getRequestContext } from "@/lib/request-context";
import { buildUserUsageUpdate, recordUsageEventSafe, touchUserLastSeenSafe } from "@/lib/usage-tracking";
import { normalizeQuestionForStorage } from "@/lib/suggestions";

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8);
  const requestStart = logger.startTimer();

  try {
    // Get authenticated user
    const session = await auth();
    const isAuthenticated = !!session?.user?.email;
    let userId: string | null = null;
    let user = null;

    const body = await request.json();
    const { query, clientId, source } = body;
    const requestContext = getRequestContext(request, clientId);
    const querySource = source === "suggestion" ? "SUGGESTION" : "TYPED";

    logger.apiStart("POST /api/session/create", {
      requestId,
      isAuthenticated,
      clientId: requestContext.clientId?.slice(0, 8),
      queryLength: query?.length,
      source: querySource,
    });

    if (isAuthenticated) {
      user = await prisma.user.findUnique({
        where: { email: session.user!.email! },
        select: {
          id: true,
          subscriptionTier: true,
          explorationsUsed: true,
          explorationsReset: true,
        },
      });
      userId = user?.id || null;
    }

    // Sanitize query input
    const sanitizationResult = sanitizeQuery(query);
    if (!sanitizationResult.isValid) {
      return NextResponse.json(
        {
          error: sanitizationResult.error || "Invalid query",
          code: "INVALID_INPUT",
        },
        { status: 400 }
      );
    }

    // Use sanitized query
    const sanitizedQuery = sanitizationResult.sanitized;

    // Check exploration limits for authenticated users
    if (user) {
      // Check if usage should be reset (30+ days since last reset)
      const now = new Date();
      const resetDate = new Date(user.explorationsReset);
      const daysSinceReset = Math.floor((now.getTime() - resetDate.getTime()) / (1000 * 60 * 60 * 24));

      // Reset usage if 30+ days have passed
      if (daysSinceReset >= 30) {
        const newResetDate = new Date(now);
        newResetDate.setDate(newResetDate.getDate() + 30);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            explorationsUsed: 0,
            explorationsReset: newResetDate,
          },
        });

        user.explorationsUsed = 0;
        user.explorationsReset = newResetDate;
      }

      // Check if user can explore
      const explorationCheck = canUserExplore({
        subscriptionTier: user.subscriptionTier,
        explorationsUsed: user.explorationsUsed,
        explorationsReset: user.explorationsReset,
      });

      if (!explorationCheck.allowed) {
        await touchUserLastSeenSafe(prisma, user.id, { route: "POST /api/session/create", requestId });
        await recordUsageEventSafe(
          prisma,
          {
            eventName: "exploration_limit_reached",
            userId: user.id,
            requestId,
            clientId: requestContext.clientId,
            route: "POST /api/session/create",
            success: false,
            statusCode: 429,
            metadata: {
              tier: user.subscriptionTier,
              reason: explorationCheck.reason || null,
              phase: "session_create",
            },
          },
          requestContext
        );

        return NextResponse.json(
          {
            error: explorationCheck.reason || "Exploration limit reached",
            code: "LIMIT_REACHED",
            tier: user.subscriptionTier,
          },
          { status: 429 }
        );
      }
    }

    // Single AI call: answer + branches + key terms
    logger.external("Claude", "generateBranches", { requestId, depth: 1 });
    const { answer, branches, keyTerms, usage } = await generateBranches({
      rootQuery: sanitizedQuery,
      path: [sanitizedQuery],
      depth: 1,
      coveredTopics: [],
    });
    logger.info("Claude response received", {
      requestId,
      branchCount: branches.length,
      keyTermCount: keyTerms.length,
      answerLength: answer?.length,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      estimatedCostUsd: usage.estimatedCostUsd,
    });

    // Create session with root node and child nodes in a transaction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await prisma.$transaction(async (tx: any) => {
      if (isAuthenticated) {
        // AUTHENTICATED USER - use GraphSession
        const graphSession = await tx.graphSession.create({
          data: {
            rootQuery: sanitizedQuery,
            title: sanitizedQuery.slice(0, 100),
            nodeCount: 1 + branches.length,
            maxDepth: 2,
            userId,
            clientId: requestContext.clientId,
            ipAddress: requestContext.ipAddress,
            ipHash: requestContext.ipHash,
            country: requestContext.country,
            region: requestContext.region,
            city: requestContext.city,
            userAgent: requestContext.userAgent,
          },
        });

        // Create root node
        const rootNode = await tx.node.create({
          data: {
            sessionId: graphSession.id,
            title: sanitizedQuery,
            content: answer,
            depth: 1,
            positionX: 0,
            positionY: 0,
            explored: true,
          },
        });

        // Create child nodes for branches
        const { horizontalSpacing, verticalSpacing } = LAYOUT_CONFIG.level1;

        const childNodes = await Promise.all(
          branches.map((branch: (typeof branches)[0], index: number) =>
            tx.node.create({
              data: {
                sessionId: graphSession.id,
                parentId: rootNode.id,
                title: branch.title,
                summary: branch.summary,
                content: branch.summary,
                depth: 2,
                positionX: (index - (branches.length - 1) / 2) * horizontalSpacing,
                positionY: verticalSpacing,
                explored: false,
                followUpType: branch.followUpType || null,
              },
            })
          )
        );

        // Create edges
        await Promise.all(
          childNodes.map((childNode: { id: string }) =>
            tx.edge.create({
              data: {
                sessionId: graphSession.id,
                sourceId: rootNode.id,
                targetId: childNode.id,
                animated: true,
              },
            })
          )
        );

        return { session: graphSession, rootNode, childNodes, isAnonymous: false };
      }

      // ANONYMOUS USER - use AnonymousSession
      const anonymousSession = await tx.anonymousSession.create({
        data: {
          rootQuery: sanitizedQuery,
          title: sanitizedQuery.slice(0, 100),
          nodeCount: 1 + branches.length,
          maxDepth: 2,
          clientId: requestContext.clientId,
          ipAddress: requestContext.ipAddress,
          ipHash: requestContext.ipHash,
          country: requestContext.country,
          region: requestContext.region,
          city: requestContext.city,
          userAgent: requestContext.userAgent,
          lastActivityAt: new Date(),
        },
      });

      // Create root node
      const rootNode = await tx.anonymousNode.create({
        data: {
          sessionId: anonymousSession.id,
          title: sanitizedQuery,
          content: answer,
          depth: 1,
          positionX: 0,
          positionY: 0,
          explored: true,
        },
      });

      // Create child nodes for branches
      const { horizontalSpacing, verticalSpacing } = LAYOUT_CONFIG.level1;

      const childNodes = await Promise.all(
        branches.map((branch: (typeof branches)[0], index: number) =>
          tx.anonymousNode.create({
            data: {
              sessionId: anonymousSession.id,
              parentId: rootNode.id,
              title: branch.title,
              summary: branch.summary,
              content: branch.summary,
              depth: 2,
              positionX: (index - (branches.length - 1) / 2) * horizontalSpacing,
              positionY: verticalSpacing,
              explored: false,
              followUpType: branch.followUpType || null,
            },
          })
        )
      );

      // Create edges
      await Promise.all(
        childNodes.map((childNode: { id: string }) =>
          tx.anonymousEdge.create({
            data: {
              sessionId: anonymousSession.id,
              sourceId: rootNode.id,
              targetId: childNode.id,
              animated: true,
            },
          })
        )
      );

      return { session: anonymousSession, rootNode, childNodes, isAnonymous: true };
    });

    // Increment exploration counter for authenticated users and persist lifetime usage aggregates
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: buildUserUsageUpdate({
          incrementExplorations: true,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          estimatedCostUsd: usage.estimatedCostUsd,
        }),
      });
    }

    const normalizedQuestionText = normalizeQuestionForStorage(sanitizedQuery);

    try {
      if (normalizedQuestionText) {
        await prisma.questionEvent.create({
          data: {
            questionText: sanitizedQuery,
            normalizedText: normalizedQuestionText,
            source: querySource,
            userId: user?.id ?? null,
            graphSessionId: result.isAnonymous ? null : result.session.id,
            anonymousSessionId: result.isAnonymous ? result.session.id : null,
            clientId: requestContext.clientId,
            country: requestContext.country,
            region: requestContext.region,
            userAgent: requestContext.userAgent,
            metadata: {
              isAuthenticated,
              source: querySource,
            },
          },
        });
      } else {
        logger.warn("question_event_write_skipped", {
          requestId,
          userId: user?.id ?? null,
          isAnonymous: result.isAnonymous,
          reason: "empty_normalized_text",
        });
      }
    } catch (error) {
      logger.warn("question_event_write_failed", {
        requestId,
        userId: user?.id ?? null,
        isAnonymous: result.isAnonymous,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    await recordUsageEventSafe(
      prisma,
      {
        eventName: result.isAnonymous ? "session_created_anonymous" : "session_created",
        userId: user?.id ?? null,
        graphSessionId: result.isAnonymous ? null : result.session.id,
        anonymousSessionId: result.isAnonymous ? result.session.id : null,
        requestId,
        clientId: requestContext.clientId,
        route: "POST /api/session/create",
        success: true,
        statusCode: 200,
        latencyMs: logger.durationMs(requestStart),
        model: usage.model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        estimatedCostUsd: usage.estimatedCostUsd,
        metadata: {
          branchCount: branches.length,
          keyTermCount: keyTerms.length,
          isAuthenticated,
        },
      },
      requestContext
    );

    return NextResponse.json({
      sessionId: result.session.id,
      isAnonymous: result.isAnonymous,
      createdAt: result.session.createdAt.toISOString(),
      rootNode: {
        id: result.rootNode.id,
        title: result.rootNode.title,
        content: result.rootNode.content,
        exploreTerms: keyTerms,
        depth: result.rootNode.depth,
        position: { x: result.rootNode.positionX, y: result.rootNode.positionY },
      },
      branches: result.childNodes.map((node: (typeof result.childNodes)[0]) => ({
        id: node.id,
        title: node.title,
        summary: node.summary,
        content: node.content,
        depth: node.depth,
        position: { x: node.positionX, y: node.positionY },
        followUpType: node.followUpType,
      })),
    });
  } catch (error) {
    logger.apiError("POST /api/session/create", error, { requestId });

    // Provide more specific error messages based on error type
    let errorMessage = "Failed to create session";
    let statusCode = 500;

    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes("timeout") || error.message.includes("ETIMEDOUT")) {
        errorMessage = "Request timed out. Please try again.";
        statusCode = 504;
      } else if (error.message.includes("rate") || error.message.includes("429")) {
        errorMessage = "Service is busy. Please try again in a moment.";
        statusCode = 429;
      } else if (error.message.includes("API") || error.message.includes("Claude")) {
        errorMessage = "AI service temporarily unavailable. Please try again.";
        statusCode = 503;
      }
    }

    return NextResponse.json({ error: errorMessage, code: "SERVER_ERROR" }, { status: statusCode });
  } finally {
    logger.info("api.complete:POST /api/session/create", {
      requestId,
      durationMs: logger.durationMs(requestStart),
    });
  }
}
