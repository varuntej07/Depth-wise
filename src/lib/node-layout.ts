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

  const nodeById = new Map(inputNodes.map((n) => [n.id, n as SizedNode]));
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
    const sizeById = new Map(rowNodeSizes.map((s) => [s.id, s]));

    // Group nodes in this row by their parentId so each subtree is centered under its parent.
    const byParent = new Map<string, SizedNode[]>();
    for (const node of rowNodes) {
      const parentKey = (node.data as GraphNode['data'] | undefined)?.parentId ?? node.id;
      if (!byParent.has(parentKey)) byParent.set(parentKey, []);
      byParent.get(parentKey)!.push(node);
    }

    // Sort groups left to right by parent X midpoint so the cursor pass stays ordered.
    const sortedGroups = [...byParent.entries()].sort(([aKey], [bKey]) => {
      const aParent = nodeById.get(aKey);
      const bParent = nodeById.get(bKey);
      const aX = aParent ? (nextPositionByNodeId.get(aKey)?.x ?? aParent.position.x) + getNodeSize(aParent, options).width / 2 : 0;
      const bX = bParent ? (nextPositionByNodeId.get(bKey)?.x ?? bParent.position.x) + getNodeSize(bParent, options).width / 2 : 0;
      return aX - bX;
    });

    // Place each group centered under its parent, then resolve inter-group overlaps.
    const groupSpans: Array<{ right: number; entries: Array<{ id: string; x: number }> }> = [];
    for (const [parentKey, groupNodes] of sortedGroups) {
      const parentNode = nodeById.get(parentKey);
      const parentCenterX = parentNode
        ? (nextPositionByNodeId.get(parentKey)?.x ?? parentNode.position.x) + getNodeSize(parentNode, options).width / 2
        : groupNodes.reduce((s, n) => s + n.position.x + sizeById.get(n.id)!.width / 2, 0) / groupNodes.length;

      const totalWidth = groupNodes.reduce(
        (s, n, i) => s + sizeById.get(n.id)!.width + (i > 0 ? options.minHorizontalGap : 0),
        0,
      );
      let curX = parentCenterX - totalWidth / 2;
      const entries: Array<{ id: string; x: number }> = [];
      for (const node of groupNodes) {
        entries.push({ id: node.id, x: curX });
        curX += sizeById.get(node.id)!.width + options.minHorizontalGap;
      }
      groupSpans.push({ right: curX - options.minHorizontalGap, entries });
    }

    // Push groups apart left to right if they overlap.
    for (let g = 1; g < groupSpans.length; g++) {
      const prev = groupSpans[g - 1];
      const curr = groupSpans[g];
      const overlap = prev.right + options.minHorizontalGap - curr.entries[0].x;
      if (overlap > 0) {
        for (const e of curr.entries) e.x += overlap;
        curr.right += overlap;
      }
    }

    let rowMaxHeight = 0;
    for (const size of rowNodeSizes) rowMaxHeight = Math.max(rowMaxHeight, size.height);
    for (const { entries } of groupSpans) {
      for (const { id, x } of entries) nextPositionByNodeId.set(id, { x, y: rowY });
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
