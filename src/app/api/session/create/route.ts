import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateBranches } from '@/lib/claude';
import { LAYOUT_CONFIG } from '@/lib/layout';
import { canUserExplore, getSavedGraphsLimit } from '@/lib/subscription-config';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth();
    const isAuthenticated = !!session?.user?.email;
    let userId: string | null = null;
    let user = null;

    if (isAuthenticated) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          subscriptionTier: true,
          explorationsUsed: true,
          explorationsReset: true,
          _count: {
            select: {
              graphSessions: true,
            },
          },
        },
      });
      userId = user?.id || null;
    }

    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Check exploration limits for authenticated users
    if (user) {
      // Check if usage should be reset (30+ days since last reset)
      const now = new Date();
      const resetDate = new Date(user.explorationsReset);
      const daysSinceReset = Math.floor(
        (now.getTime() - resetDate.getTime()) / (1000 * 60 * 60 * 24)
      );

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
        return NextResponse.json(
          {
            error: explorationCheck.reason || 'Exploration limit reached',
            code: 'LIMIT_REACHED',
            tier: user.subscriptionTier,
          },
          { status: 429 }
        );
      }

      // Check saved graphs limit
      const savedGraphsLimit = getSavedGraphsLimit(user.subscriptionTier);
      if (savedGraphsLimit !== null && user._count.graphSessions >= savedGraphsLimit) {
        return NextResponse.json(
          {
            error: `You've reached your saved graphs limit of ${savedGraphsLimit}. Delete old graphs or upgrade to save more!`,
            code: 'SAVED_GRAPHS_LIMIT_REACHED',
            tier: user.subscriptionTier,
            currentCount: user._count.graphSessions,
            limit: savedGraphsLimit,
          },
          { status: 429 }
        );
      }
    }

    // Generate initial branches using Claude
    const { answer, branches } = await generateBranches({
      rootQuery: query,
      path: [query],
      depth: 1,
      coveredTopics: [],
    });

    // Create session with root node and child nodes in a transaction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await prisma.$transaction(async (tx: any) => {
      if (isAuthenticated) {
        // AUTHENTICATED USER - use GraphSession
        const graphSession = await tx.graphSession.create({
          data: {
            rootQuery: query,
            title: query.slice(0, 100),
            nodeCount: 1 + branches.length,
            maxDepth: 2,
            userId: userId,
          },
        });

        // Create root node
        const rootNode = await tx.node.create({
          data: {
            sessionId: graphSession.id,
            title: query,
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
          branches.map((branch: typeof branches[0], index: number) =>
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
              },
            })
          )
        );

        // Create edges
        await Promise.all(
          childNodes.map((childNode) =>
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
      } else {
        // ANONYMOUS USER - use AnonymousSession
        const anonymousSession = await tx.anonymousSession.create({
          data: {
            rootQuery: query,
            title: query.slice(0, 100),
            nodeCount: 1 + branches.length,
            maxDepth: 2,
          },
        });

        // Create root node
        const rootNode = await tx.anonymousNode.create({
          data: {
            sessionId: anonymousSession.id,
            title: query,
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
          branches.map((branch: typeof branches[0], index: number) =>
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
              },
            })
          )
        );

        // Create edges
        await Promise.all(
          childNodes.map((childNode) =>
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
      }
    });

    // Increment exploration counter for authenticated users
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          explorationsUsed: { increment: 1 },
        },
      });
    }

    return NextResponse.json({
      sessionId: result.session.id,
      isAnonymous: result.isAnonymous,
      createdAt: result.session.createdAt.toISOString(),
      rootNode: {
        id: result.rootNode.id,
        title: result.rootNode.title,
        content: result.rootNode.content,
        depth: result.rootNode.depth,
        position: { x: result.rootNode.positionX, y: result.rootNode.positionY },
      },
      branches: result.childNodes.map((node: typeof result.childNodes[0]) => ({
        id: node.id,
        title: node.title,
        summary: node.summary,
        content: node.content,
        depth: node.depth,
        position: { x: node.positionX, y: node.positionY },
      })),
    });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
