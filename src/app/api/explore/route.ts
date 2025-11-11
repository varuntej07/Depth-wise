import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateBranches } from '@/lib/claude';
import { LAYOUT_CONFIG } from '@/lib/layout';
import { auth } from '@/lib/auth';
import { getMaxDepth } from '@/lib/subscription-config';

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
    const session = await prisma.graphSession.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            subscriptionTier: true,
          },
        },
      },
    });

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

    // Check depth limits for authenticated users
    if (session.user) {
      const maxAllowedDepth = getMaxDepth(session.user.subscriptionTier);
      const nextDepth = parentNode.depth + 1;

      if (nextDepth > maxAllowedDepth) {
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
    }

    // Check if already explored
    if (parentNode.explored) {
      // Return existing children
      const existingChildren = await prisma.node.findMany({
        where: { parentId: parentNode.id },
      });

      const existingEdges = await prisma.edge.findMany({
        where: { sourceId: parentNode.id },
      });

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

    // Build exploration path by traversing up parent chain
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

    const pathTitles = nodeChain.map((n) => n.title);

    // Get sibling nodes for context
    const siblings = await prisma.node.findMany({
      where: { parentId: parentNode.parentId || undefined },
    });

    const coveredTopics = siblings.map((s) => s.title);

    // Generate new branches
    const { answer, branches } = await generateBranches({
      rootQuery: session.rootQuery,
      currentNode: {
        title: parentNode.title,
        content: parentNode.content || parentNode.summary || '',
      },
      path: pathTitles,
      depth: parentNode.depth,
      coveredTopics,
    });

    // Create new nodes and edges in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Use centralized layout configuration for consistent spacing
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
            },
          })
        )
      );

      // Create edges
      const newEdges = await Promise.all(
        newNodes.map((childNode) =>
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

      // Update parent node as explored and add the full answer
      await tx.node.update({
        where: { id: parentNode.id },
        data: {
          explored: true,
          content: answer, // Add the full generated answer to the parent node
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
        },
      });

      return { newNodes, newEdges };
    });

    return NextResponse.json({
      parentId: parentNode.id,
      parentContent: answer, // Include the full answer for the parent node
      branches: result.newNodes.map((node) => ({
        id: node.id,
        title: node.title,
        summary: node.summary,
        content: node.content,
        depth: node.depth,
        position: { x: node.positionX, y: node.positionY },
      })),
      edges: result.newEdges.map((edge) => ({
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
