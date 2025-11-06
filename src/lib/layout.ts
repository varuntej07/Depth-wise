/**
 * Centralized layout configuration for React Flow Knowledge Graph
 *
 * Spacing calculations:
 * - Root nodes: 320px (mobile), 400px (tablet), 500px (desktop)
 * - Child nodes: 280px (mobile), 340px (tablet), 420px (desktop)
 * - Spacing must accommodate largest node width + comfortable gap
 *
 * Level 1 spacing: 500px root + 420px child + 140px gap = 560px
 * Level 2+ spacing: 420px + 200px gap = 620px (for visual hierarchy)
 */
export const LAYOUT_CONFIG = {
  // Level 1: Root to first children
  level1: {
    horizontalSpacing: 560,  // Accommodates wider root node + child node + gap
    verticalSpacing: 320,    // Slightly increased for adaptive height
  },

  // Level 2+: Deeper exploration (more space for visual clarity)
  level2Plus: {
    horizontalSpacing: 620,  // Accommodates 420px node + 200px gap
    verticalSpacing: 450,    // Maintains current vertical spacing
  },
} as const;
