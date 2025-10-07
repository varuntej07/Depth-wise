import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/mock-db';
import { generateBranches } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Create session
    const session = mockDb.createSession({
      rootQuery: query,
      title: query.slice(0, 100),
    });

    // Generate initial branches using Claude
    const { answer, branches } = await generateBranches({
      rootQuery: query,
      path: [query],
      depth: 1,
      coveredTopics: [],
    });

    // Create root node
    const rootNode = mockDb.createNode({
      sessionId: session.id,
      title: query,
      content: answer,
      depth: 1,
      positionX: 0,
      positionY: 0,
      explored: true,
    });

    // Create child nodes for branches
    // Node width is 360px, so we use 440px spacing to ensure proper gaps
    const horizontalSpacing = 440;
    const verticalSpacing = 300;

    const childNodes = branches.map((branch, index) =>
      mockDb.createNode({
        sessionId: session.id,
        parentId: rootNode.id,
        title: branch.title,
        summary: branch.summary,
        content: branch.summary,
        depth: 2,
        positionX: (index - (branches.length - 1) / 2) * horizontalSpacing,
        positionY: verticalSpacing,
        explored: false,
      })
    );

    // Create edges
    childNodes.forEach((childNode) =>
      mockDb.createEdge({
        sessionId: session.id,
        sourceId: rootNode.id,
        targetId: childNode.id,
        animated: true,
      })
    );

    // Update session stats
    mockDb.updateSession(session.id, {
      nodeCount: 1 + childNodes.length,
      maxDepth: 2,
    });

    return NextResponse.json({
      sessionId: session.id,
      createdAt: session.createdAt.toISOString(),
      rootNode: {
        id: rootNode.id,
        title: rootNode.title,
        content: rootNode.content,
        depth: rootNode.depth,
        position: { x: rootNode.positionX, y: rootNode.positionY },
      },
      branches: childNodes.map((node) => ({
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
