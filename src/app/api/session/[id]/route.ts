import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getRequestContext } from '@/lib/request-context';
import { recordUsageEventSafe, touchUserLastSeenSafe } from '@/lib/usage-tracking';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID().slice(0, 8);
  try {
    logger.apiStart('GET /api/session/[id]', { requestId });
    const requestContext = getRequestContext(request);
    const session = await auth();

    const { id: sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Fetch the GraphSession with all nodes and edges
    const graphSession = await prisma.graphSession.findUnique({
      where: { id: sessionId },
      include: {
        nodes: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        edges: true,
      },
    });

    if (!graphSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Access policy:
    // - Owner can always load.
    // - Non-owner can only load if graph is public (read-only on client).
    // This aligns sidebar/session loading behavior with shared-link behavior.
    let isOwner = false;
    let authenticatedUserId: string | null = null;
    const hasAuthenticatedEmail = Boolean(session?.user?.email);

    if (hasAuthenticatedEmail) {
      const user = await prisma.user.findUnique({
        where: { email: session!.user!.email! },
        select: { id: true },
      });

      if (user) {
        authenticatedUserId = user.id;
        await touchUserLastSeenSafe(prisma, user.id, { route: 'GET /api/session/[id]', requestId });
      }

      isOwner = Boolean(user && graphSession.userId === user.id);
    }

    if (!isOwner && !graphSession.isPublic) {
      // Avoid leaking the existence of private sessions to unauthenticated callers.
      if (!hasAuthenticatedEmail) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      return NextResponse.json(
        {
          error: 'Unauthorized access to session',
        },
        { status: 403 }
      );
    }

    // Format nodes for React Flow
    const formattedNodes = graphSession.nodes.map((node: typeof graphSession.nodes[0]) => ({
      id: node.id,
      type: 'knowledge',
      position: { x: node.positionX, y: node.positionY },
      data: {
        title: node.title,
        content: node.content || '',
        summary: node.summary || '',
        depth: node.depth,
        explored: node.explored,
        sessionId: graphSession.id,
        parentId: node.parentId || undefined,
        followUpType: node.followUpType || undefined,
      },
    }));

    // Format edges for React Flow
    const formattedEdges = graphSession.edges.map((edge: typeof graphSession.edges[0]) => ({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      animated: edge.animated,
    }));

    await recordUsageEventSafe(
      prisma,
      {
        eventName: 'session_viewed',
        userId: authenticatedUserId,
        graphSessionId: graphSession.id,
        requestId,
        route: 'GET /api/session/[id]',
        success: true,
        statusCode: 200,
        metadata: {
          isOwner,
          isPublic: graphSession.isPublic,
          isReadOnly: !isOwner,
          nodeCount: graphSession.nodeCount,
          maxDepth: graphSession.maxDepth,
        },
      },
      requestContext
    );

    return NextResponse.json({
      sessionId: graphSession.id,
      rootQuery: graphSession.rootQuery,
      title: graphSession.title,
      isPublic: graphSession.isPublic,
      isAnonymous: graphSession.userId === null,
      isReadOnly: !isOwner,
      nodes: formattedNodes,
      edges: formattedEdges,
      nodeCount: graphSession.nodeCount,
      maxDepth: graphSession.maxDepth,
      createdAt: graphSession.createdAt.toISOString(),
      updatedAt: graphSession.updatedAt.toISOString(),
    });
  } catch (error) {
    logger.apiError('GET /api/session/[id]', error, { requestId });
    return NextResponse.json(
      { error: 'Failed to load session' },
      { status: 500 }
    );
  } finally {
    logger.info('api.complete:GET /api/session/[id]', { requestId });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID().slice(0, 8);
  try {
    logger.apiStart('DELETE /api/session/[id]', { requestId });
    const requestContext = getRequestContext(request);
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Verify the session exists and belongs to the user
    const graphSession = await prisma.graphSession.findUnique({
      where: { id: sessionId },
    });

    if (!graphSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || graphSession.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized access to session' }, { status: 403 });
    }

    await touchUserLastSeenSafe(prisma, user.id, { route: 'DELETE /api/session/[id]', requestId });

    // Delete the session (cascade handles nodes/edges/history per schema)
    await prisma.graphSession.delete({
      where: { id: sessionId },
    });

    await recordUsageEventSafe(
      prisma,
      {
        eventName: 'session_deleted',
        userId: user.id,
        graphSessionId: sessionId,
        requestId,
        route: 'DELETE /api/session/[id]',
        success: true,
        statusCode: 200,
      },
      requestContext
    );

    return NextResponse.json({ success: true, deletedId: sessionId });
  } catch (error) {
    logger.apiError('DELETE /api/session/[id]', error, { requestId });
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  } finally {
    logger.info('api.complete:DELETE /api/session/[id]', { requestId });
  }
}
