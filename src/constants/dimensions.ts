/**
 * Layout and spacing (px unless noted).
 */
export const dimensions = {
  cardWidth: 72,
  cardHeight: 100,
  tableauColumnCardOffset: 28,
  /** Vertical step between stacked stock backs (horizontal alignment only). */
  stockCardOffset: 10,
  /** Max face-down layers drawn in the stock; stock stack area height stays fixed at this count. */
  stockMaxVisibleLayers: 8,
  /** Shelf/stock panel width; flank regions in the top row are at least this wide each (see GameShell grid). */
  shelfWidth: 240,
  /**
   * Intended horizontal overlap in px between each shelf card and the one to its **left**.
   * Layout uses step `max(0, cardWidth − shelfOverlap)` so the first card stays flush left; if this value is
   * ≥ card width, cards stack in one column (step 0) and later cards paint on top.
   */
  shelfOverlap: 50,
  /** Horizontal gap between tableau columns and between foundation slots (px). */
  columnSpacing: 8,
  /** Inner vertical padding of the shelf panel; foundation and stock use the same top inset so card tops align with jokers. */
  shelfVerticalPad: 8,
  /** Inner horizontal padding of the shelf panel (joker strip inset from the shelf border). */
  shelfHorizontalPad: 8,
} as const;

/** Fixed vertical pixel height of the stock card-stack region (does not shrink as deals run). */
export const stockStackMaxHeightPx =
  dimensions.cardHeight + (dimensions.stockMaxVisibleLayers - 1) * dimensions.stockCardOffset;

/** Shelf panel height: **shelfVerticalPad** above and below the card row (border-box). */
export const shelfPanelHeightPx =
  dimensions.cardHeight + 2 * dimensions.shelfVerticalPad;

/** Horizontal offset from one shelf card’s left edge to the next’s (never negative). */
export function shelfHorizontalStepPx(): number {
  return Math.max(0, dimensions.cardWidth - dimensions.shelfOverlap);
}
