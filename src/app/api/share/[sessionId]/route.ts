import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/share/[sessionId]
 *
 * Retrieves a public graph session for read-only viewing.
 * No authentication required - anyone with the link can view.
 *
 * This endpoint only returns data if the session is marked as public.
 * Private sessions will return a 404 to avoid revealing their existence.
 *
 * Response:
 * {
 *   "session": { id, rootQuery, title, createdAt, nodeCount, maxDepth },
 *   "nodes": [ array of all nodes in the graph ],
 *   "edges": [ array of all edges/connections ],
 *   "creator": { name: string } or null
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    // Step 1: Get the session ID from the URL
    const sessionId = params.sessionId;

    // Step 2: Find the graph session in the database
    // We include the user relation to get creator information for attribution
    const graphSession = await prisma.graphSession.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          // Only select the name for attribution, not sensitive data
          select: {
            name: true,
          },
        },
      },
    });

    // Step 3: Check if the session exists and is public
    // We return 404 for both "doesn't exist" and "is private" to avoid
    // revealing which sessions exist in the database (security practice)
    if (!graphSession || !graphSession.isPublic) {
      return NextResponse.json(
        {
          error: 'Graph not found or is not public',
          message: 'This graph may be private, deleted, or never existed.',
        },
        { status: 404 }
      );
    }

    // Step 4: Fetch all nodes for this session
    // These contain the knowledge graph content
    const nodes = await prisma.node.findMany({
      where: { sessionId },
      orderBy: [
        { depth: 'asc' },      // Order by depth first (root, then children, etc.)
        { createdAt: 'asc' },  // Then by creation time
      ],
    });

    // Step 5: Fetch all edges (connections between nodes)
    const edges = await prisma.edge.findMany({
      where: { sessionId },
    });

    // Step 6: Transform the data into the format expected by the frontend
    // This matches the same format used in the main app for consistency
    const response = {
      // Session metadata
      session: {
        id: graphSession.id,
        rootQuery: graphSession.rootQuery,
        title: graphSession.title,
        createdAt: graphSession.createdAt.toISOString(),
        nodeCount: graphSession.nodeCount,
        maxDepth: graphSession.maxDepth,
      },

      // All nodes in the graph
      nodes: nodes.map((node) => ({
        id: node.id,
        title: node.title,
        content: node.content,
        summary: node.summary,
        depth: node.depth,
        explored: node.explored,
        parentId: node.parentId,
        position: {
          x: node.positionX,
          y: node.positionY,
        },
      })),

      // All edges (connections)
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.sourceId,
        target: edge.targetId,
        animated: edge.animated,
      })),

      // Creator attribution (or null if anonymous/deleted)
      creator: graphSession.user
        ? { name: graphSession.user.name }
        : null,
    };

    // Step 7: Return the complete graph data
    return NextResponse.json(response);

  } catch (error) {
    // Log the error for debugging
    console.error('Public share fetch error:', error);

    // Return a generic error message
    return NextResponse.json(
      {
        error: 'Failed to load shared graph',
        message: 'An unexpected error occurred. Please try again later.',
      },
      { status: 500 }
    );
  }
}
