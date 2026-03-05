import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isValidUUID } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { getRequestContext } from '@/lib/request-context';
import { recordUsageEventSafe, touchUserLastSeenSafe } from '@/lib/usage-tracking';

interface AnonymousSessionForMigration {
  id: string;
  rootQuery: string;
  title: string | null;
  nodeCount: number;
  maxDepth: number;
  clientId: string | null;
  ipAddress: string | null;
  ipHash: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  userAgent: string | null;
  nodes: Array<{
    id: string;
    parentId: string | null;
    title: string;
    content: string | null;
    summary: string | null;
    depth: number;
    positionX: number;
    positionY: number;
    explored: boolean;
  }>;
  edges: Array<{
    sourceId: string;
    targetId: string;
    animated: boolean;
  }>;
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8);
  try {
    logger.apiStart('POST /api/session/migrate', { requestId });

    // Get authenticated user
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { anonymousSessionId } = body;
    const requestContext = getRequestContext(request);

    // Validate anonymousSessionId
    if (!anonymousSessionId) {
      return NextResponse.json(
        { error: 'Anonymous session ID required', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }
    if (!isValidUUID(anonymousSessionId)) {
      return NextResponse.json(
        { error: 'Invalid anonymous session ID format', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // Migrate anonymous session to user's account
    const result = await prisma.$transaction(async (tx) => {
      // Get anonymous session with all related data
      const anonymousSession = (await tx.anonymousSession.findUnique({
        where: { id: anonymousSessionId },
        include: {
          nodes: true,
          edges: true,
        },
      })) as unknown as AnonymousSessionForMigration | null;

      if (!anonymousSession) {
        throw new Error('Anonymous session not found');
      }

      // Create new GraphSession for the user
      const graphSession = await tx.graphSession.create({
        data: {
          rootQuery: anonymousSession.rootQuery,
          title: anonymousSession.title,
          nodeCount: anonymousSession.nodeCount,
          maxDepth: anonymousSession.maxDepth,
          userId: user.id,
          clientId: anonymousSession.clientId || requestContext.clientId,
          ipAddress: anonymousSession.ipAddress || requestContext.ipAddress,
          ipHash: anonymousSession.ipHash || requestContext.ipHash,
          country: anonymousSession.country || requestContext.country,
          region: anonymousSession.region || requestContext.region,
          city: anonymousSession.city || requestContext.city,
          userAgent: anonymousSession.userAgent || requestContext.userAgent,
        } as unknown as never,
      });

      // Create a mapping of old node IDs to new node IDs
      const nodeIdMap: Record<string, string> = {};

      // Migrate nodes (need to do this in order of depth to handle parent relationships)
      const sortedNodes = anonymousSession.nodes.sort(
        (a: { depth: number }, b: { depth: number }) => a.depth - b.depth
      );

      for (const anonNode of sortedNodes) {
        const newNode = await tx.node.create({
          data: {
            sessionId: graphSession.id,
            parentId: anonNode.parentId ? nodeIdMap[anonNode.parentId] : null,
            title: anonNode.title,
            content: anonNode.content,
            summary: anonNode.summary,
            depth: anonNode.depth,
            positionX: anonNode.positionX,
            positionY: anonNode.positionY,
            explored: anonNode.explored,
          },
        });

        nodeIdMap[anonNode.id] = newNode.id;
      }

      // Migrate edges
      for (const anonEdge of anonymousSession.edges) {
        await tx.edge.create({
          data: {
            sessionId: graphSession.id,
            sourceId: nodeIdMap[anonEdge.sourceId],
            targetId: nodeIdMap[anonEdge.targetId],
            animated: anonEdge.animated,
          },
        });
      }

      // Delete the anonymous session and all related data (cascades automatically)
      await tx.anonymousSession.delete({
        where: { id: anonymousSessionId },
      });

      return { graphSession, nodeIdMap };
    });

    await touchUserLastSeenSafe(prisma, user.id, { route: 'POST /api/session/migrate', requestId });
    await recordUsageEventSafe(
      prisma,
      {
        eventName: 'session_migrated',
        userId: user.id,
        graphSessionId: result.graphSession.id,
        anonymousSessionId,
        requestId,
        route: 'POST /api/session/migrate',
        success: true,
        statusCode: 200,
        metadata: {
          nodeCount: result.graphSession.nodeCount,
          maxDepth: result.graphSession.maxDepth,
        },
      },
      requestContext
    );

    return NextResponse.json({
      success: true,
      sessionId: result.graphSession.id,
      message: 'Session migrated successfully',
    });
  } catch (error) {
    logger.apiError('POST /api/session/migrate', error, { requestId });
    return NextResponse.json(
      { error: 'Failed to migrate session' },
      { status: 500 }
    );
  } finally {
    logger.info('api.complete:POST /api/session/migrate', { requestId });
  }
}
