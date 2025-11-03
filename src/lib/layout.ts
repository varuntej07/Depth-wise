/**
 * Centralized layout configuration for React Flow Knowledge Graph
 *
 * Spacing calculations:
 * - Skeleton nodes are 360px wide
 * - Actual nodes are 280px (mobile), 320px (tablet), 400px (desktop)
 * - Spacing must accommodate skeleton width (360px) + comfortable gap
 *
 * Level 1 spacing: 360px + 120px gap = 480px
 * Level 2+ spacing: 360px + 260px gap = 620px (increased for visual hierarchy)
 */
export const LAYOUT_CONFIG = {
  // Level 1: Root to first children
  level1: {
    horizontalSpacing: 480,  // Accommodates 360px skeleton + 120px gap
    verticalSpacing: 300,    // Slightly increased for better vertical spacing
  },

  // Level 2+: Deeper exploration (more space for visual clarity)
  level2Plus: {
    horizontalSpacing: 620,  // Accommodates 360px skeleton + 260px gap
    verticalSpacing: 450,    // Maintains current vertical spacing
  },
} as const;
