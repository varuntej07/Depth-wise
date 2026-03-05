import { Node } from '@xyflow/react';
import { GraphNode } from '@/types/graph';

interface LayoutOptions {
  minHorizontalGap: number;
  minVerticalGap: number;
  fallbackWidth: number;
  fallbackHeight: number;
  baselineDepthY?: Map<number, number>;
}

type SizedNode = Node & { measured?: { width?: number; height?: number } };

const POSITION_EPSILON = 0.5;

const getNodeDepth = (node: Node): number => {
  const data = node.data as GraphNode['data'] | undefined;
  return Math.max(1, data?.depth || 1);
};

const getNodeSize = (node: SizedNode, options: LayoutOptions) => {
  const width = Math.max(node.width ?? node.measured?.width ?? options.fallbackWidth, 80);
  const height = Math.max(node.height ?? node.measured?.height ?? options.fallbackHeight, 80);
  return { width, height };
};

const getSortedDepths = (groupedNodes: Map<number, SizedNode[]>) =>
  Array.from(groupedNodes.keys()).sort((a, b) => a - b);

const byStableXOrder = (left: SizedNode, right: SizedNode) =>
  left.position.x - right.position.x || left.id.localeCompare(right.id);

const hasPositionChange = (from: Node, to: { x: number; y: number }) =>
  Math.abs(from.position.x - to.x) > POSITION_EPSILON || Math.abs(from.position.y - to.y) > POSITION_EPSILON;

export const applyNonOverlappingDepthLayout = (
  inputNodes: Node[],
  options: LayoutOptions
): Node[] => {
  if (inputNodes.length < 2) {
    return inputNodes;
  }

  const groupedByDepth = new Map<number, SizedNode[]>();
  for (const node of inputNodes) {
    const depth = getNodeDepth(node);
    if (!groupedByDepth.has(depth)) {
      groupedByDepth.set(depth, []);
    }
    groupedByDepth.get(depth)!.push(node as SizedNode);
  }

  const sortedDepths = getSortedDepths(groupedByDepth);
  if (sortedDepths.length === 0) {
    return inputNodes;
  }

  const nextPositionByNodeId = new Map<string, { x: number; y: number }>();
  let previousRowBottom: number | null = null;

  for (const depth of sortedDepths) {
    const rowNodes = groupedByDepth.get(depth)!;
    rowNodes.sort(byStableXOrder);

    const rowBaseY: number =
      options.baselineDepthY?.get(depth) ??
      Math.min(...rowNodes.map((node) => node.position.y));

    const rowY: number =
      previousRowBottom === null
        ? rowBaseY
        : Math.max(rowBaseY, previousRowBottom + options.minVerticalGap);

    const rowNodeSizes = rowNodes.map((node) => ({
      id: node.id,
      ...getNodeSize(node, options),
    }));

    let cursorRightEdge: number | null = null;
    const provisionalXById = new Map<string, number>();
    let desiredRowCenter = 0;

    for (let index = 0; index < rowNodes.length; index += 1) {
      const node = rowNodes[index];
      const { width } = rowNodeSizes[index];
      const desiredX: number = node.position.x;
      const x: number =
        cursorRightEdge === null
          ? desiredX
          : Math.max(desiredX, cursorRightEdge + options.minHorizontalGap);

      provisionalXById.set(node.id, x);
      cursorRightEdge = x + width;
      desiredRowCenter += desiredX + width / 2;
    }

    desiredRowCenter /= rowNodes.length;

    const firstNode = rowNodes[0];
    const lastNode = rowNodes[rowNodes.length - 1];
    const firstX = provisionalXById.get(firstNode.id)!;
    const lastX = provisionalXById.get(lastNode.id)!;
    const lastWidth = rowNodeSizes[rowNodeSizes.length - 1].width;
    const provisionalCenter = (firstX + (lastX + lastWidth)) / 2;
    const centerShift = desiredRowCenter - provisionalCenter;

    let rowMaxHeight = 0;
    for (let index = 0; index < rowNodes.length; index += 1) {
      const node = rowNodes[index];
      const { height } = rowNodeSizes[index];
      const finalX = provisionalXById.get(node.id)! + centerShift;

      nextPositionByNodeId.set(node.id, { x: finalX, y: rowY });
      rowMaxHeight = Math.max(rowMaxHeight, height);
    }

    previousRowBottom = rowY + rowMaxHeight;
  }

  let hasChanges = false;
  const nextNodes = inputNodes.map((node) => {
    const nextPosition = nextPositionByNodeId.get(node.id);
    if (!nextPosition || !hasPositionChange(node, nextPosition)) {
      return node;
    }

    hasChanges = true;
    return {
      ...node,
      position: {
        ...node.position,
        x: nextPosition.x,
        y: nextPosition.y,
      },
    };
  });

  return hasChanges ? nextNodes : inputNodes;
};
