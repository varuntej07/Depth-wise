import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateBranches } from '@/lib/claude';
import { LAYOUT_CONFIG } from '@/lib/layout';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Generate initial branches using Claude
    const { answer, branches } = await generateBranches({
      rootQuery: query,
      path: [query],
      depth: 1,
      coveredTopics: [],
    });

    // Create session with root node and child nodes in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create session
      const session = await tx.graphSession.create({
        data: {
          rootQuery: query,
          title: query.slice(0, 100),
          nodeCount: 1 + branches.length,
          maxDepth: 2,
        },
      });

      // Create root node
      const rootNode = await tx.node.create({
        data: {
          sessionId: session.id,
          title: query,
          content: answer,
          depth: 1,
          positionX: 0,
          positionY: 0,
          explored: true,
        },
      });

      // Create child nodes for branches
      // Use centralized layout configuration to prevent node overlap
      const { horizontalSpacing, verticalSpacing } = LAYOUT_CONFIG.level1;

      const childNodes = await Promise.all(
        branches.map((branch, index) =>
          tx.node.create({
            data: {
              sessionId: session.id,
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
              sessionId: session.id,
              sourceId: rootNode.id,
              targetId: childNode.id,
              animated: true,
            },
          })
        )
      );

      return { session, rootNode, childNodes };
    });

    return NextResponse.json({
      sessionId: result.session.id,
      createdAt: result.session.createdAt.toISOString(),
      rootNode: {
        id: result.rootNode.id,
        title: result.rootNode.title,
        content: result.rootNode.content,
        depth: result.rootNode.depth,
        position: { x: result.rootNode.positionX, y: result.rootNode.positionY },
      },
      branches: result.childNodes.map((node) => ({
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
