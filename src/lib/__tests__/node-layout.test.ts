import { describe, it, expect } from 'vitest';
import { applyNonOverlappingDepthLayout } from '../node-layout';
import type { Node } from '@xyflow/react';

const DEFAULT_OPTIONS = {
  minHorizontalGap: 40,
  minVerticalGap: 60,
  fallbackWidth: 200,
  fallbackHeight: 100,
};

function makeNode(
  id: string,
  x: number,
  y: number,
  depth: number,
  width = 200,
): Node {
  return {
    id,
    position: { x, y },
    data: { depth } as Record<string, unknown>,
    type: 'knowledge',
    width,
  } as Node;
}

describe('applyNonOverlappingDepthLayout', () => {
  // --- Single node ---
  it('returns the same array reference for a single node', () => {
    const nodes = [makeNode('a', 0, 0, 1)];
    const result = applyNonOverlappingDepthLayout(nodes, DEFAULT_OPTIONS);
    expect(result).toBe(nodes); // same reference
  });

  it('returns the same array reference for an empty array', () => {
    const nodes: Node[] = [];
    const result = applyNonOverlappingDepthLayout(nodes, DEFAULT_OPTIONS);
    expect(result).toBe(nodes);
  });

  // --- Non-overlapping nodes stay unchanged ---
  it('returns the same reference when nodes do not overlap', () => {
    const nodes = [
      makeNode('a', 0, 0, 1, 200),
      makeNode('b', 500, 0, 1, 200), // 500 - (0+200) = 300 gap, well above 40
    ];
    const result = applyNonOverlappingDepthLayout(nodes, DEFAULT_OPTIONS);
    expect(result).toBe(nodes);
  });

  // --- Overlapping nodes are pushed apart ---
  it('pushes overlapping same-depth nodes apart by at least minHorizontalGap', () => {
    // Two nodes at depth 1, both at x=0 → they overlap
    const nodes = [
      makeNode('a', 0, 0, 1, 200),
      makeNode('b', 50, 0, 1, 200), // overlaps: 50 < 0+200+40
    ];
    const result = applyNonOverlappingDepthLayout(nodes, DEFAULT_OPTIONS);

    expect(result).not.toBe(nodes); // new array

    const nodeA = result.find((n) => n.id === 'a')!;
    const nodeB = result.find((n) => n.id === 'b')!;

    // B's left edge should be >= A's right edge + minHorizontalGap
    const aRight = nodeA.position.x + 200;
    expect(nodeB.position.x).toBeGreaterThanOrEqual(aRight + DEFAULT_OPTIONS.minHorizontalGap - 1);
  });

  // --- Stability: second call returns same reference ---
  it('is stable — a second call on the adjusted output returns the same reference', () => {
    const nodes = [
      makeNode('a', 0, 0, 1, 200),
      makeNode('b', 50, 0, 1, 200),
    ];
    const first = applyNonOverlappingDepthLayout(nodes, DEFAULT_OPTIONS);
    const second = applyNonOverlappingDepthLayout(first, DEFAULT_OPTIONS);
    expect(second).toBe(first);
  });

  // --- Multiple depths ---
  it('handles nodes at multiple depths independently', () => {
    const nodes = [
      // Depth 1 — non-overlapping
      makeNode('d1a', 0, 0, 1, 200),
      makeNode('d1b', 500, 0, 1, 200),
      // Depth 2 — overlapping
      makeNode('d2a', 100, 200, 2, 200),
      makeNode('d2b', 120, 200, 2, 200),
      makeNode('d2c', 140, 200, 2, 200),
    ];

    const result = applyNonOverlappingDepthLayout(nodes, DEFAULT_OPTIONS);

    // Depth 2 nodes should be spread out
    const d2Nodes = result
      .filter((n) => (n.data as { depth: number }).depth === 2)
      .sort((a, b) => a.position.x - b.position.x);

    for (let i = 1; i < d2Nodes.length; i++) {
      const prevRight = d2Nodes[i - 1].position.x + 200;
      expect(d2Nodes[i].position.x).toBeGreaterThanOrEqual(
        prevRight + DEFAULT_OPTIONS.minHorizontalGap - 1,
      );
    }
  });

  // --- Two non-overlapping nodes at different depths ---
  it('does not modify nodes at different depths that are spatially close', () => {
    const nodes = [
      makeNode('a', 0, 0, 1, 200),
      makeNode('b', 0, 200, 2, 200), // same x, different depth row
    ];
    const result = applyNonOverlappingDepthLayout(nodes, DEFAULT_OPTIONS);
    // Only one node per depth — no horizontal overlap possible within a row
    expect(result).toBe(nodes);
  });

  // --- Respects minVerticalGap between depth rows ---
  it('enforces minVerticalGap between depth rows', () => {
    const nodes = [
      makeNode('a', 0, 0, 1, 200),
      makeNode('b', 0, 50, 2, 200), // y=50, but depth-1 row bottom is 0+100=100
    ];
    const result = applyNonOverlappingDepthLayout(nodes, DEFAULT_OPTIONS);
    const nodeB = result.find((n) => n.id === 'b')!;
    // Depth-1 bottom = 0 + 100 (fallbackHeight). Depth-2 y should be >= 100 + 60
    expect(nodeB.position.y).toBeGreaterThanOrEqual(100 + DEFAULT_OPTIONS.minVerticalGap - 1);
  });

  // --- Per-parent centering ---
  it('centers each parent subtree under its own parent, not the row centroid', () => {
    // Parent A is at x=0, parent B is at x=800. Each has two children.
    // With row-centroid centering, all four children would shift toward x=400
    // and edges would cross. With per-parent centering, A's children stay near
    // x=0 and B's children stay near x=800.
    const nodes = [
      makeNode('A', 0, 0, 1, 200),
      makeNode('B', 800, 0, 1, 200),
      { ...makeNode('A1', 0, 200, 2, 200), data: { depth: 2, parentId: 'A' } as Record<string, unknown> },
      { ...makeNode('A2', 50, 200, 2, 200), data: { depth: 2, parentId: 'A' } as Record<string, unknown> },
      { ...makeNode('B1', 750, 200, 2, 200), data: { depth: 2, parentId: 'B' } as Record<string, unknown> },
      { ...makeNode('B2', 800, 200, 2, 200), data: { depth: 2, parentId: 'B' } as Record<string, unknown> },
    ];

    const result = applyNonOverlappingDepthLayout(nodes, DEFAULT_OPTIONS);

    const a1 = result.find((n) => n.id === 'A1')!;
    const a2 = result.find((n) => n.id === 'A2')!;
    const b1 = result.find((n) => n.id === 'B1')!;
    const b2 = result.find((n) => n.id === 'B2')!;

    // A's children should be centered under A (midpoint x=100), so their center ≈ 100
    const aGroupCenter = (a1.position.x + 200 / 2 + a2.position.x + 200 / 2) / 2;
    expect(aGroupCenter).toBeCloseTo(100, 0);

    // B's children should be centered under B (midpoint x=900), so their center ≈ 900
    const bGroupCenter = (b1.position.x + 200 / 2 + b2.position.x + 200 / 2) / 2;
    expect(bGroupCenter).toBeCloseTo(900, 0);

    // A's children must not cross into B's territory and vice versa
    expect(a2.position.x + 200).toBeLessThan(b1.position.x);
  });

  // --- Three overlapping nodes ---
  it('spreads three overlapping nodes correctly', () => {
    const nodes = [
      makeNode('a', 0, 0, 1, 200),
      makeNode('b', 10, 0, 1, 200),
      makeNode('c', 20, 0, 1, 200),
    ];

    const result = applyNonOverlappingDepthLayout(nodes, DEFAULT_OPTIONS);
    const sorted = [...result].sort((a, b) => a.position.x - b.position.x);

    for (let i = 1; i < sorted.length; i++) {
      const prevRight = sorted[i - 1].position.x + 200;
      expect(sorted[i].position.x).toBeGreaterThanOrEqual(
        prevRight + DEFAULT_OPTIONS.minHorizontalGap - 1,
      );
    }
  });
});
