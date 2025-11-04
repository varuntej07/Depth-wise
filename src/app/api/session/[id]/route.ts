import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
        edges: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!graphSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify the session belongs to the authenticated user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || graphSession.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized access to session' }, { status: 403 });
    }

    // Format nodes for React Flow
    const formattedNodes = graphSession.nodes.map((node: typeof graphSession.nodes[0]) => ({
      id: node.id,
      type: 'knowledgeNode',
      position: { x: node.positionX, y: node.positionY },
      data: {
        title: node.title,
        content: node.content || '',
        summary: node.summary || '',
        depth: node.depth,
        explored: node.explored,
        sessionId: graphSession.id,
        parentId: node.parentId,
      },
    }));

    // Format edges for React Flow
    const formattedEdges = graphSession.edges.map((edge: typeof graphSession.edges[0]) => ({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      type: 'smoothstep',
      animated: edge.animated,
    }));

    return NextResponse.json({
      sessionId: graphSession.id,
      rootQuery: graphSession.rootQuery,
      title: graphSession.title,
      nodes: formattedNodes,
      edges: formattedEdges,
      nodeCount: graphSession.nodeCount,
      maxDepth: graphSession.maxDepth,
      createdAt: graphSession.createdAt.toISOString(),
      updatedAt: graphSession.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error loading session:', error);
    return NextResponse.json(
      { error: 'Failed to load session' },
      { status: 500 }
    );
  }
}
