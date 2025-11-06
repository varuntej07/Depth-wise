/**
 * Centralized layout configuration for React Flow Knowledge Graph
 *
 * Spacing calculations:
 * - Root nodes: 320px (mobile), 400px (tablet), 500px (desktop)
 * - Child nodes: 280px (mobile), 340px (tablet), 420px (desktop)
 * - Spacing must accommodate largest node width + comfortable gap
 *
 * Level 1 spacing: 420px node + 280px gap = 700px (clean, professional spacing)
 * Level 2+ spacing: 420px node + 280px gap = 700px (consistent spacing throughout)
 */
export const LAYOUT_CONFIG = {
  // Level 1: Root to first children
  level1: {
    horizontalSpacing: 620,  // spacing for cleaner initial layout
    verticalSpacing: 420,    // vertical spacing for better tier separation
  },

  // Level 2+: Deeper exploration
  level2Plus: {
    horizontalSpacing: 620,  // Consistent spacing with level 1
    verticalSpacing: 420,    // Maintains current vertical spacing
  },
} as const;
