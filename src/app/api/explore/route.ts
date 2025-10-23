import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/mock-db';
import { generateBranches } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, parentId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    if (!parentId) {
      return NextResponse.json({ error: 'Parent node ID required' }, { status: 400 });
    }

    // Get session and parent node
    const session = mockDb.findSession(sessionId);

    if (!session) {
      return NextResponse.json(
        {
          error: 'Session expired or not found. The server may have restarted. Please start a new search.',
          code: 'SESSION_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const parentNode = mockDb.findNode(parentId);

    if (!parentNode) {
      return NextResponse.json({ error: 'Parent node not found' }, { status: 404 });
    }

    // Check if already explored
    if (parentNode.explored) {
      // Return existing children
      const existingChildren = mockDb.findNodesByParent(parentNode.id);

      const existingEdges = mockDb.findEdgesBySource(parentNode.id);

      return NextResponse.json({
        parentId: parentNode.id,
        branches: existingChildren.map((node) => ({
          id: node.id,
          title: node.title,
          summary: node.summary,
          content: node.content,
          depth: node.depth,
          position: { x: node.positionX, y: node.positionY },
        })),
        edges: existingEdges.map((edge) => ({
          id: edge.id,
          source: edge.sourceId,
          target: edge.targetId,
        })),
      });
    }

    // Build exploration path
    let currentNode = parentNode;
    const nodeChain = [currentNode];

    // Build parent chain
    while (currentNode.parentId) {
      const parent = mockDb.findNode(currentNode.parentId);
      if (parent) {
        nodeChain.unshift(parent);
        currentNode = parent;
      } else {
        break;
      }
    }

    const pathTitles = nodeChain.map((n) => n.title);

    // Get sibling nodes for context
    const siblings = mockDb.findNodesByParent(parentNode.parentId || '');

    const coveredTopics = siblings.map((s) => s.title);

    // Generate new branches
    const { branches } = await generateBranches({
      rootQuery: session.rootQuery,
      currentNode: {
        title: parentNode.title,
        content: parentNode.content || parentNode.summary || '',
      },
      path: pathTitles,
      depth: parentNode.depth,
      coveredTopics,
    });

    // Spaces for new nodes
    const horizontalSpacing = 600;
    const verticalSpacing = 450;

    const baseX = parentNode.positionX - ((branches.length - 1) / 2) * horizontalSpacing;       // Calculates a proper left-edge baseline 

    const newNodes = branches.map((branch, index) =>
      mockDb.createNode({
        sessionId: session.id,
        parentId: parentNode.id,
        title: branch.title,
        summary: branch.summary,
        content: branch.summary,
        depth: parentNode.depth + 1,
        positionX: baseX + index * horizontalSpacing,       // Spaces each node sequentially from that baseline using index * horizontalSpacing
        positionY: parentNode.positionY + verticalSpacing,
        explored: false,
      })
    );

    // Create edges
    const newEdges = newNodes.map((childNode) =>
      mockDb.createEdge({
        sessionId: session.id,
        sourceId: parentNode.id,
        targetId: childNode.id,
        animated: true,
      })
    );

    // Update parent node as explored
    mockDb.updateNode(parentNode.id, { explored: true });

    // Update session stats
    const nodeCount = mockDb.countNodesBySession(session.id);
    const maxDepthNode = mockDb.getMaxDepthNode(session.id);

    mockDb.updateSession(session.id, {
      nodeCount,
      maxDepth: maxDepthNode?.depth || 0,
    });

    return NextResponse.json({
      parentId: parentNode.id,
      branches: newNodes.map((node) => ({
        id: node.id,
        title: node.title,
        summary: node.summary,
        content: node.content,
        depth: node.depth,
        position: { x: node.positionX, y: node.positionY },
      })),
      edges: newEdges.map((edge) => ({
        id: edge.id,
        source: edge.sourceId,
        target: edge.targetId,
      })),
    });
  } catch (error) {
    console.error('Explore API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
