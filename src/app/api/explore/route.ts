import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateBranches } from '@/lib/claude';
import { LAYOUT_CONFIG } from '@/lib/layout';
import { getMaxDepth, canUserExplore } from '@/lib/subscription-config';
import { isValidUUID, sanitizeBoolean, sanitizeQuery } from '@/lib/utils';
import { FollowUpType } from '@/types/graph';
import { logger } from '@/lib/logger';
import { getRequestContext } from '@/lib/request-context';
import { buildUserUsageUpdate, recordUsageEventSafe, touchUserLastSeenSafe } from '@/lib/usage-tracking';
import type { AnonymousNode, AnonymousEdge, Node, Edge, SubscriptionTier } from '@prisma/client';

interface AnonymousSessionTelemetry {
  id: string;
  rootQuery: string;
  ipAddress: string | null;
  userAgent: string | null;
  clientId: string | null;
  ipHash: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
}

interface GraphSessionTelemetry {
  id: string;
  userId: string | null;
  rootQuery: string;
  clientId: string | null;
  ipAddress: string | null;
  ipHash: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  userAgent: string | null;
  user: { subscriptionTier: SubscriptionTier } | null;
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8);
  const requestStart = logger.startTimer();

  try {
    const body = await request.json();
    const { sessionId, parentId, isAnonymous, exploreType, focusTerm, clientId } = body;
    const requestContext = getRequestContext(request, clientId);

    logger.apiStart('POST /api/explore', {
      requestId,
      sessionId: sessionId?.slice(0, 8),
      parentId: parentId?.slice(0, 8),
      clientId: requestContext.clientId?.slice(0, 8),
      isAnonymous,
      exploreType,
      focusTerm,
    });

    let validatedFocusTerm: string | undefined;
    if (typeof focusTerm === 'string' && focusTerm.trim().length > 0) {
      const sanitizedFocusTerm = sanitizeQuery(focusTerm, 120);
      if (!sanitizedFocusTerm.isValid) {
        return NextResponse.json(
          { error: sanitizedFocusTerm.error || 'Invalid focus term', code: 'INVALID_INPUT' },
          { status: 400 }
        );
      }
      validatedFocusTerm = sanitizedFocusTerm.sanitized;
    }

    // Validate exploreType if provided
    const validExploreTypes: FollowUpType[] = ['why', 'how', 'what', 'example', 'compare'];
    const validatedExploreType = exploreType && validExploreTypes.includes(exploreType)
      ? exploreType as FollowUpType
      : undefined;

    // Validate sessionId
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }
    if (!isValidUUID(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID format', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // Validate parentId
    if (!parentId) {
      return NextResponse.json(
        { error: 'Parent node ID required', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }
    if (!isValidUUID(parentId)) {
      return NextResponse.json(
        { error: 'Invalid parent node ID format', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // Validate isAnonymous
    const anonymousResult = sanitizeBoolean(isAnonymous);
    if (!anonymousResult.isValid) {
      return NextResponse.json(
        { error: anonymousResult.error, code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }
    const validatedIsAnonymous = anonymousResult.value!;

    // Handle ANONYMOUS sessions
    if (validatedIsAnonymous) {
      // Get anonymous session and parent node
      const session = (await prisma.anonymousSession.findUnique({
        where: { id: sessionId },
      })) as unknown as AnonymousSessionTelemetry | null;

      if (!session) {
        return NextResponse.json(
          {
            error: 'Session expired or not found. Please start a new search.',
            code: 'SESSION_NOT_FOUND'
          },
          { status: 404 }
        );
      }

      const parentNode = await prisma.anonymousNode.findUnique({
        where: { id: parentId },
      });

      if (!parentNode) {
        return NextResponse.json({ error: 'Parent node not found' }, { status: 404 });
      }

      // CRITICAL: Anonymous users can only explore to depth 2
      // When trying to go to depth 3, require sign-in
      const nextDepth = parentNode.depth + 1;
      if (nextDepth > 2) {
        await prisma.anonymousSession.update({
          where: { id: session.id },
          data: {
            lastActivityAt: new Date(),
            clientId: session.clientId || requestContext.clientId,
            ipAddress: session.ipAddress || requestContext.ipAddress,
            ipHash: session.ipHash || requestContext.ipHash,
            country: session.country || requestContext.country,
            region: session.region || requestContext.region,
            city: session.city || requestContext.city,
            userAgent: session.userAgent || requestContext.userAgent,
          } as unknown as Record<string, unknown>,
        });

        await recordUsageEventSafe(
          prisma,
          {
            eventName: 'anonymous_depth_limit_reached',
            anonymousSessionId: session.id,
            requestId,
            clientId: requestContext.clientId,
            route: 'POST /api/explore',
            success: false,
            statusCode: 401,
            metadata: {
              parentDepth: parentNode.depth,
              requestedDepth: nextDepth,
              maxDepth: 2,
            },
          },
          requestContext
        );
        return NextResponse.json(
          {
            error: 'Sign in to continue exploring deeper!',
            code: 'ANONYMOUS_DEPTH_LIMIT',
            requiresAuth: true,
            currentDepth: parentNode.depth,
            maxDepth: 2,
          },
          { status: 401 }
        );
      }

      // Check if already explored
      if (parentNode.explored && !validatedFocusTerm) {
        const existingChildren = await prisma.anonymousNode.findMany({
          where: { parentId: parentNode.id },
        });

        const existingEdges = await prisma.anonymousEdge.findMany({
          where: { sourceId: parentNode.id },
        });

        await recordUsageEventSafe(
          prisma,
          {
            eventName: 'node_explore_cache_hit_anonymous',
            anonymousSessionId: session.id,
            requestId,
            clientId: requestContext.clientId,
            route: 'POST /api/explore',
            success: true,
            statusCode: 200,
            metadata: {
              parentId: parentNode.id,
              parentDepth: parentNode.depth,
              branchCount: existingChildren.length,
            },
          },
          requestContext
        );
        await prisma.anonymousSession.update({
          where: { id: session.id },
          data: {
            lastActivityAt: new Date(),
            clientId: session.clientId || requestContext.clientId,
            ipAddress: session.ipAddress || requestContext.ipAddress,
            ipHash: session.ipHash || requestContext.ipHash,
            country: session.country || requestContext.country,
            region: session.region || requestContext.region,
            city: session.city || requestContext.city,
            userAgent: session.userAgent || requestContext.userAgent,
          } as unknown as Record<string, unknown>,
        });

        return NextResponse.json({
          parentId: parentNode.id,
          branches: existingChildren.map((node: AnonymousNode) => ({
            id: node.id,
            title: node.title,
            summary: node.summary,
            content: node.content,
            depth: node.depth,
            position: { x: node.positionX, y: node.positionY },
          })),
          edges: existingEdges.map((edge: AnonymousEdge) => ({
            id: edge.id,
            source: edge.sourceId,
            target: edge.targetId,
          })),
        });
      }

      // Build exploration path
      const nodeChain = [parentNode];
      let currentNode = parentNode;

      while (currentNode.parentId) {
        const parent = await prisma.anonymousNode.findUnique({
          where: { id: currentNode.parentId },
        });
        if (parent) {
          nodeChain.unshift(parent);
          currentNode = parent;
        } else {
          break;
        }
      }

      const pathTitles = nodeChain.map((n: AnonymousNode) => n.title);

      // Get sibling nodes for context
      const siblings = await prisma.anonymousNode.findMany({
        where: { parentId: parentNode.parentId || undefined },
      });

      const coveredTopics = siblings.map((s: AnonymousNode) => s.title);

      // Generate new branches
      const { answer, branches, keyTerms, usage } = await generateBranches({
        rootQuery: session.rootQuery,
        currentNode: {
          title: parentNode.title,
          content: parentNode.content || parentNode.summary || '',
        },
        path: pathTitles,
        depth: parentNode.depth,
        coveredTopics,
        exploreType: validatedExploreType, // Pass user's exploration intent
        focusTerm: validatedFocusTerm,
      });
      logger.aiUsage('anthropic', {
        requestId,
        route: 'POST /api/explore',
        mode: 'anonymous',
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        estimatedCostUsd: usage.estimatedCostUsd,
      });

      // Create new nodes and edges in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const { horizontalSpacing, verticalSpacing } = LAYOUT_CONFIG.level2Plus;
        const baseX = parentNode.positionX - ((branches.length - 1) / 2) * horizontalSpacing;

        // Create new nodes
        const newNodes = await Promise.all(
          branches.map((branch, index) =>
            tx.anonymousNode.create({
              data: {
                sessionId: session.id,
                parentId: parentNode.id,
                title: branch.title,
                summary: branch.summary,
                content: branch.summary,
                depth: parentNode.depth + 1,
                positionX: baseX + index * horizontalSpacing,
                positionY: parentNode.positionY + verticalSpacing,
                explored: false,
                followUpType: branch.followUpType || null, // Store follow-up type
              },
            })
          )
        );

        // Create edges
        const newEdges = await Promise.all(
          newNodes.map((childNode: AnonymousNode) =>
            tx.anonymousEdge.create({
              data: {
                sessionId: session.id,
                sourceId: parentNode.id,
                targetId: childNode.id,
                animated: true,
              },
            })
          )
        );

        // Update parent node as explored
        await tx.anonymousNode.update({
          where: { id: parentNode.id },
          data: {
            explored: true,
            content: answer,
          },
        });

        // Update session stats
        const nodeCount = await tx.anonymousNode.count({
          where: { sessionId: session.id },
        });

        const maxDepthNode = await tx.anonymousNode.findFirst({
          where: { sessionId: session.id },
          orderBy: { depth: 'desc' },
        });

        await tx.anonymousSession.update({
          where: { id: session.id },
          data: {
            nodeCount,
            maxDepth: maxDepthNode?.depth || 0,
            lastActivityAt: new Date(),
            clientId: session.clientId || requestContext.clientId,
            ipAddress: session.ipAddress || requestContext.ipAddress,
            ipHash: session.ipHash || requestContext.ipHash,
            country: session.country || requestContext.country,
            region: session.region || requestContext.region,
            city: session.city || requestContext.city,
            userAgent: session.userAgent || requestContext.userAgent,
          } as unknown as Record<string, unknown>,
        });

        return { newNodes, newEdges };
      });

      await recordUsageEventSafe(
        prisma,
        {
          eventName: 'node_explored_anonymous',
          anonymousSessionId: session.id,
          requestId,
          clientId: requestContext.clientId,
          route: 'POST /api/explore',
          success: true,
          statusCode: 200,
          latencyMs: logger.durationMs(requestStart),
          model: usage.model,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          estimatedCostUsd: usage.estimatedCostUsd,
          metadata: {
            parentId: parentNode.id,
            parentDepth: parentNode.depth,
            branchCount: result.newNodes.length,
            focusTerm: validatedFocusTerm ?? null,
            exploreType: validatedExploreType ?? null,
          },
        },
        requestContext
      );
      return NextResponse.json({
        parentId: parentNode.id,
        parentContent: answer,
        parentTerms: keyTerms,
        branches: result.newNodes.map((node: AnonymousNode) => ({
          id: node.id,
          title: node.title,
          summary: node.summary,
          content: node.content,
          depth: node.depth,
          position: { x: node.positionX, y: node.positionY },
          followUpType: node.followUpType, // Include follow-up type
        })),
        edges: result.newEdges.map((edge: AnonymousEdge) => ({
          id: edge.id,
          source: edge.sourceId,
          target: edge.targetId,
        })),
      });
    }

    // Handle AUTHENTICATED USER sessions
    const session = (await prisma.graphSession.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            subscriptionTier: true,
          },
        },
      },
    })) as unknown as GraphSessionTelemetry | null;

    if (!session) {
      return NextResponse.json(
        {
          error: 'Session expired or not found. Please start a new search.',
          code: 'SESSION_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const parentNode = await prisma.node.findUnique({
      where: { id: parentId },
    });

    if (!parentNode) {
      return NextResponse.json({ error: 'Parent node not found' }, { status: 404 });
    }

    // Check depth limits and exploration limits for authenticated users
    if (session.user) {
      const maxAllowedDepth = getMaxDepth(session.user.subscriptionTier);
      const nextDepth = parentNode.depth + 1;

      if (nextDepth > maxAllowedDepth) {
        await recordUsageEventSafe(
          prisma,
          {
            eventName: 'depth_limit_reached',
            userId: session.userId,
            graphSessionId: session.id,
            requestId,
            clientId: requestContext.clientId,
            route: 'POST /api/explore',
            success: false,
            statusCode: 429,
            metadata: {
              tier: session.user.subscriptionTier,
              currentDepth: parentNode.depth,
              requestedDepth: nextDepth,
              maxDepth: maxAllowedDepth,
            },
          },
          requestContext
        );

        return NextResponse.json(
          {
            error: `You've reached your maximum depth of ${maxAllowedDepth} levels. Upgrade to explore deeper!`,
            code: 'DEPTH_LIMIT_REACHED',
            tier: session.user.subscriptionTier,
            currentDepth: parentNode.depth,
            maxDepth: maxAllowedDepth,
          },
          { status: 429 }
        );
      }

      // Check exploration usage limit
      const user = session.userId ? await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          subscriptionTier: true,
          explorationsUsed: true,
          explorationsReset: true,
        },
      }) : null;

      if (user) {
        const explorationCheck = canUserExplore({
          subscriptionTier: user.subscriptionTier,
          explorationsUsed: user.explorationsUsed,
          explorationsReset: user.explorationsReset,
        });

        if (!explorationCheck.allowed) {
          await recordUsageEventSafe(
            prisma,
            {
              eventName: 'exploration_limit_reached',
              userId: user.id,
              graphSessionId: session.id,
              requestId,
              clientId: requestContext.clientId,
              route: 'POST /api/explore',
              success: false,
              statusCode: 429,
              metadata: {
                tier: user.subscriptionTier,
                reason: explorationCheck.reason || null,
                phase: 'node_explore',
              },
            },
            requestContext
          );
          await touchUserLastSeenSafe(prisma, user.id, { route: 'POST /api/explore', requestId });

          return NextResponse.json(
            {
              error: explorationCheck.reason || 'Exploration limit reached',
              code: 'LIMIT_REACHED',
              tier: user.subscriptionTier,
            },
            { status: 429 }
          );
        }
      }
    }

    // Check if already explored
    if (parentNode.explored && !validatedFocusTerm) {
      const existingChildren = await prisma.node.findMany({
        where: { parentId: parentNode.id },
      });

      const existingEdges = await prisma.edge.findMany({
        where: { sourceId: parentNode.id },
      });

      await recordUsageEventSafe(
        prisma,
        {
          eventName: 'node_explore_cache_hit',
          userId: session.userId,
          graphSessionId: session.id,
          requestId,
          clientId: requestContext.clientId,
          route: 'POST /api/explore',
          success: true,
          statusCode: 200,
          metadata: {
            parentId: parentNode.id,
            parentDepth: parentNode.depth,
            branchCount: existingChildren.length,
          },
        },
        requestContext
      );

      return NextResponse.json({
        parentId: parentNode.id,
        branches: existingChildren.map((node: Node) => ({
          id: node.id,
          title: node.title,
          summary: node.summary,
          content: node.content,
          depth: node.depth,
          position: { x: node.positionX, y: node.positionY },
        })),
        edges: existingEdges.map((edge: Edge) => ({
          id: edge.id,
          source: edge.sourceId,
          target: edge.targetId,
        })),
      });
    }

    // Build exploration path
    const nodeChain = [parentNode];
    let currentNode = parentNode;

    while (currentNode.parentId) {
      const parent = await prisma.node.findUnique({
        where: { id: currentNode.parentId },
      });
      if (parent) {
        nodeChain.unshift(parent);
        currentNode = parent;
      } else {
        break;
      }
    }

    const pathTitles = nodeChain.map((n: Node) => n.title);

    // Get sibling nodes for context
    const siblings = await prisma.node.findMany({
      where: { parentId: parentNode.parentId || undefined },
    });

    const coveredTopics = siblings.map((s: Node) => s.title);

    // Generate new branches
    const { answer, branches, keyTerms, usage } = await generateBranches({
      rootQuery: session.rootQuery,
      currentNode: {
        title: parentNode.title,
        content: parentNode.content || parentNode.summary || '',
      },
      path: pathTitles,
      depth: parentNode.depth,
      coveredTopics,
      exploreType: validatedExploreType, // Pass user's exploration intent
      focusTerm: validatedFocusTerm,
    });
    logger.aiUsage('anthropic', {
      requestId,
      route: 'POST /api/explore',
      mode: 'authenticated',
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      estimatedCostUsd: usage.estimatedCostUsd,
    });

    // Create new nodes and edges in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const { horizontalSpacing, verticalSpacing } = LAYOUT_CONFIG.level2Plus;
      const baseX = parentNode.positionX - ((branches.length - 1) / 2) * horizontalSpacing;

      // Create new nodes
      const newNodes = await Promise.all(
        branches.map((branch, index) =>
          tx.node.create({
            data: {
              sessionId: session.id,
              parentId: parentNode.id,
              title: branch.title,
              summary: branch.summary,
              content: branch.summary,
              depth: parentNode.depth + 1,
              positionX: baseX + index * horizontalSpacing,
              positionY: parentNode.positionY + verticalSpacing,
              explored: false,
              followUpType: branch.followUpType || null, // Store follow-up type
            },
          })
        )
      );

      // Create edges
      const newEdges = await Promise.all(
        newNodes.map((childNode: Node) =>
          tx.edge.create({
            data: {
              sessionId: session.id,
              sourceId: parentNode.id,
              targetId: childNode.id,
              animated: true,
            },
          })
        )
      );

      // Update parent node as explored
      await tx.node.update({
        where: { id: parentNode.id },
        data: {
          explored: true,
          content: answer,
        },
      });

      // Update session stats
      const nodeCount = await tx.node.count({
        where: { sessionId: session.id },
      });

      const maxDepthNode = await tx.node.findFirst({
        where: { sessionId: session.id },
        orderBy: { depth: 'desc' },
      });

      await tx.graphSession.update({
        where: { id: session.id },
        data: {
          nodeCount,
          maxDepth: maxDepthNode?.depth || 0,
          clientId: session.clientId || requestContext.clientId,
          ipAddress: session.ipAddress || requestContext.ipAddress,
          ipHash: session.ipHash || requestContext.ipHash,
          country: session.country || requestContext.country,
          region: session.region || requestContext.region,
          city: session.city || requestContext.city,
          userAgent: session.userAgent || requestContext.userAgent,
        } as unknown as Record<string, unknown>,
      });

      return { newNodes, newEdges };
    });

    // Increment exploration counter for authenticated users
    if (session.userId) {
      await prisma.user.update({
        where: { id: session.userId },
        data: buildUserUsageUpdate({
          incrementExplorations: true,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          estimatedCostUsd: usage.estimatedCostUsd,
        }),
      });
    }

    await recordUsageEventSafe(
      prisma,
      {
        eventName: 'node_explored',
        userId: session.userId,
        graphSessionId: session.id,
        requestId,
        clientId: requestContext.clientId,
        route: 'POST /api/explore',
        success: true,
        statusCode: 200,
        latencyMs: logger.durationMs(requestStart),
        model: usage.model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        estimatedCostUsd: usage.estimatedCostUsd,
        metadata: {
          parentId: parentNode.id,
          parentDepth: parentNode.depth,
          branchCount: result.newNodes.length,
          focusTerm: validatedFocusTerm ?? null,
          exploreType: validatedExploreType ?? null,
        },
      },
      requestContext
    );

    return NextResponse.json({
      parentId: parentNode.id,
      parentContent: answer,
      parentTerms: keyTerms,
      branches: result.newNodes.map((node: Node) => ({
        id: node.id,
        title: node.title,
        summary: node.summary,
        content: node.content,
        depth: node.depth,
        position: { x: node.positionX, y: node.positionY },
        followUpType: node.followUpType, // Include follow-up type
      })),
      edges: result.newEdges.map((edge: Edge) => ({
        id: edge.id,
        source: edge.sourceId,
        target: edge.targetId,
      })),
    });
  } catch (error) {
    logger.apiError('POST /api/explore', error, { requestId });

    // Provide more specific error messages based on error type
    let errorMessage = 'An unexpected error occurred';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        errorMessage = 'Request timed out. Please try again.';
        statusCode = 504;
      } else if (error.message.includes('rate') || error.message.includes('429')) {
        errorMessage = 'Service is busy. Please try again in a moment.';
        statusCode = 429;
      } else if (error.message.includes('API') || error.message.includes('Claude')) {
        errorMessage = 'AI service temporarily unavailable. Please try again.';
        statusCode = 503;
      }
    }

    return NextResponse.json(
      { error: errorMessage, code: 'SERVER_ERROR' },
      { status: statusCode }
    );
  } finally {
    logger.info('api.complete:POST /api/explore', {
      requestId,
      durationMs: logger.durationMs(requestStart),
    });
  }
}
