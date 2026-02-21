/**
 * Centralized node dimensions and spacing for the exploration graph.
 * Keep this in sync with the fixed card sizing used by node components.
 */
export const NODE_CARD_DIMENSIONS = {
  mobile: { width: 300, height: 280 },
  tablet: { width: 340, height: 304 },
  desktop: { width: 360, height: 320 },
} as const;

const DESKTOP_COLUMN_GAP = 200;
const DESKTOP_ROW_GAP = 76;
const MOBILE_COLUMN_GAP = 96;
const MOBILE_ROW_GAP = 44;

export const LAYOUT_CONFIG = {
  level1: {
    horizontalSpacing: NODE_CARD_DIMENSIONS.desktop.width + DESKTOP_COLUMN_GAP,
    verticalSpacing: NODE_CARD_DIMENSIONS.desktop.height + DESKTOP_ROW_GAP,
  },
  level2Plus: {
    horizontalSpacing: NODE_CARD_DIMENSIONS.desktop.width + DESKTOP_COLUMN_GAP,
    verticalSpacing: NODE_CARD_DIMENSIONS.desktop.height + DESKTOP_ROW_GAP,
  },
} as const;

export const getResponsiveLayoutConfig = (isMobile: boolean) => {
  if (!isMobile) {
    return LAYOUT_CONFIG;
  }

  return {
    level1: {
      horizontalSpacing: NODE_CARD_DIMENSIONS.mobile.width + MOBILE_COLUMN_GAP,
      verticalSpacing: NODE_CARD_DIMENSIONS.mobile.height + MOBILE_ROW_GAP,
    },
    level2Plus: {
      horizontalSpacing: NODE_CARD_DIMENSIONS.mobile.width + MOBILE_COLUMN_GAP,
      verticalSpacing: NODE_CARD_DIMENSIONS.mobile.height + MOBILE_ROW_GAP,
    },
  } as const;
};
