import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
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

    if (!anonymousSessionId) {
      return NextResponse.json({ error: 'Anonymous session ID required' }, { status: 400 });
    }

    // Migrate anonymous session to user's account
    const result = await prisma.$transaction(async (tx) => {
      // Get anonymous session with all related data
      const anonymousSession = await tx.anonymousSession.findUnique({
        where: { id: anonymousSessionId },
        include: {
          nodes: true,
          edges: true,
        },
      });

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
        },
      });

      // Create a mapping of old node IDs to new node IDs
      const nodeIdMap: Record<string, string> = {};

      // Migrate nodes (need to do this in order of depth to handle parent relationships)
      const sortedNodes = anonymousSession.nodes.sort((a, b) => a.depth - b.depth);

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

    return NextResponse.json({
      success: true,
      sessionId: result.graphSession.id,
      message: 'Session migrated successfully',
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Failed to migrate session' },
      { status: 500 }
    );
  }
}
