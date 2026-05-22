import type { PlacedCard } from "@/engine/types";

/**
 * Layout and spacing (px unless noted).
 */
export const dimensions = {
  cardWidth: 72,
  cardHeight: 100,
  /** Inset around shared A–10 pip face SVGs inside the card (px). */
  cardPipFacePaddingPx: 2,
  /** Inset around court and joker portrait bitmaps/SVGs before the frame overlay (px). */
  courtJokerPortraitPaddingPx: 10,
  /**
   * Vertical step to the next card when the **current** (upper) tableau card is face **down**
   * (smaller overlap — buried cards).
   */
  tableauColumnFaceDownCardOffset: 25,
  /**
   * Vertical step to the next card when the **current** (upper) tableau card is face **up**
   * (larger overlap — readable tail).
   */
  tableauColumnFaceUpCardOffset: 22,
  /** Vertical step between stacked stock backs (horizontal alignment only). */
  stockCardOffset: 15,
  /**
   * Upper bound on how many upcoming deals the UI may reserve space for (stack backs / lead preview).
   * Actual layout height uses {@link stockStackRegionHeightPx} with the current game's **deals** (capped here).
   */
  stockMaxVisibleDeals: 8,
  /** Shelf/stock panel width; flank regions in the top row are at least this wide each (see GameShell grid). */
  shelfWidth: 260,
  /**
   * Intended horizontal overlap in px between each shelf card and the one to its **left**.
   * Layout uses step `max(0, cardWidth − shelfOverlap)` so the first card stays flush left; if this value is
   * ≥ card width, cards stack in one column (step 0) and later cards paint on top.
   */
  shelfOverlap: 50,
  /** Horizontal gap between tableau columns and between foundation slots (px). */
  columnSpacing: 8,
  /** Height of the effect-badge strip above each tableau column (px); width matches {@link cardWidth}. */
  tableauColumnBadgeHolderHeight: 30,
  /** Vertical gap between the badge holder and the card stack below (px). */
  tableauColumnBadgeHolderGapPx: 10,
  /** Inner vertical padding of the shelf panel; foundation and stock use the same top inset so card tops align with jokers. */
  shelfVerticalPad: 16,
  /** Inner horizontal padding of the shelf panel (joker strip inset from the shelf border). */
  shelfHorizontalPad: 8,
  /**
   * When the bottom of the **foundation** column (shelf/foundation/stock row) is **strictly closer**
   * than this many pixels to the viewport bottom, the tableau uses viewport-floor column min-heights
   * and the tableau pane scrolls internally; otherwise the game shell stays **100dvh** without
   * growing the page for drop-target stretch.
   */
  gameViewScrollWhenFoundationWithinPxOfViewportBottom: 200,
  /** Mini-card width in the Deck Popup (px); {@link cardWidth} is scaled down uniformly to fit. */
  deckPopupCardWidth: 72,
  /** Mini-card height in the Deck Popup (px). */
  deckPopupCardHeight: 100,
  /** Horizontal padding between the panel border and the deck content (px). */
  deckPopupHorizontalEdgePad: 16,
  /** Vertical padding between the panel border and the header / body / footer (px). */
  deckPopupVerticalEdgePad: 14,
  /** Horizontal gap between adjacent cards within a Deck Popup row (px). */
  deckPopupColumnPad: 6,
  /** Opacity of the card-back layer in the Deck Popup when the card is face-down on the tableau or still in the stock (0–1). */
  deckPopupFaceDownBackOpacity: 0.5,
  /**
   * Opacity (0–1) of the card-back layer over the face for the **transparent** power effect
   * (tableau face-down, Stock popup, Deck popup). Face art stays full strength underneath.
   * 0.75 → back is 75% opaque (25% of the face shows through).
   */
  transparentEffectBackOpacity: 0.5,
  /** Large portrait / pip face width in the Deck Popup’s card-details dialog (px). */
  cardDetailsPopupImageWidth: 260,
  /** Large portrait / pip face height in the Deck Popup’s card-details dialog (px). */
  cardDetailsPopupImageHeight: 360,
  /** Horizontal gap between the large image and the text column in the card-details dialog (px). */
  cardDetailsPopupGapPx: 20,
} as const;

/**
 * Portrait inset for court/joker art in the Deck Popup **Card details** dialog (px).
 * Scales {@link dimensions.courtJokerPortraitPaddingPx} with
 * {@link dimensions.cardDetailsPopupImageWidth} / {@link dimensions.cardWidth} so the portrait sits in the
 * frame like {@link CardView}.
 */
export function cardDetailsPortraitInsetPx(): number {
  return Math.round(
    dimensions.courtJokerPortraitPaddingPx *
      (dimensions.cardDetailsPopupImageWidth / dimensions.cardWidth),
  );
}

/**
 * Pip-face padding for aces in the Card details dialog (px); scales {@link dimensions.cardPipFacePaddingPx}
 * the same way as {@link cardDetailsPortraitInsetPx}.
 */
export function cardDetailsPipFacePaddingPx(): number {
  return Math.max(
    1,
    Math.round(
      dimensions.cardPipFacePaddingPx *
        (dimensions.cardDetailsPopupImageWidth / dimensions.cardWidth),
    ),
  );
}

/** Vertical distance from column top to the top edge of the card at `cardIndex` (0-based). */
export function tableauColumnStackTopPx(column: readonly PlacedCard[], cardIndex: number): number {
  let t = 0;
  for (let i = 0; i < cardIndex; i++) {
    t += column[i]!.faceUp
      ? dimensions.tableauColumnFaceUpCardOffset
      : dimensions.tableauColumnFaceDownCardOffset;
  }
  return t;
}

/** Total height from column top to the bottom of the bottom card (empty column → one card height). */
export function tableauColumnStackHeightPx(column: readonly PlacedCard[]): number {
  if (column.length <= 0) return dimensions.cardHeight;
  return tableauColumnStackTopPx(column, column.length - 1) + dimensions.cardHeight;
}

/** Pointer-hover scale on shelf items (`ShelfStrip` jokers / set powers). */
export const SHELF_CARD_HOVER_SCALE = 1.1;

/** Pointer-hover scale on a tableau **draggable same-suit descending run** when hovering a legal grab anchor. */
export const TABLEAU_DRAGGABLE_HOVER_SCALE = 1.1;

/** Scale while **Shift** inspect mode highlights an inspectable shelf joker under the pointer. */
export const SHELF_CARD_INVESTIGATE_SCALE = 1.1;

/** Scale while **Shift** inspect mode highlights an inspectable tableau card under the pointer. */
export const TABLEAU_CARD_INVESTIGATE_SCALE = 1.1;

/**
 * Safe bleed (px) around the shelf strip so hover {@link SHELF_CARD_HOVER_SCALE} from the card centre
 * is not clipped by scroll/padding edges (half of surplus on the longer axis at 110%).
 */
export function shelfHoverScaleBleedPx(): number {
  const s = SHELF_CARD_HOVER_SCALE;
  return Math.max(
    Math.ceil((dimensions.cardWidth * (s - 1)) / 2),
    Math.ceil((dimensions.cardHeight * (s - 1)) / 2),
  );
}

/** Shelf panel height: **shelfVerticalPad** above and below the card row (border-box). */
export const shelfPanelHeightPx =
  dimensions.cardHeight + 2 * dimensions.shelfVerticalPad;

/** Foundation column: top inset + one row of card-sized slots (single-row layout on typical widths). */
const foundationStripMinContentHeightPx =
  dimensions.shelfVerticalPad + dimensions.cardHeight;

/**
 * Caps **layoutDeals** (rules `deals` from game config) for stock stack height and lead-card preview depth.
 */
export function stockVisibleDealCapForLayout(layoutDeals: number): number {
  return Math.min(Math.max(1, layoutDeals), dimensions.stockMaxVisibleDeals);
}

/**
 * Vertical space reserved for the face-down stock stack for a game with **layoutDeals** configured deals
 * (capped by {@link dimensions.stockMaxVisibleDeals}). Does not shrink as the stock empties during play.
 */
export function stockStackRegionHeightPx(layoutDeals: number): number {
  const n = stockVisibleDealCapForLayout(layoutDeals);
  return dimensions.cardHeight + (n - 1) * dimensions.stockCardOffset;
}

/**
 * Minimum height for the row that contains shelf, foundation, and stock so all three align with the
 * tallest region (depends on current **deals** when a game is loaded).
 */
export function shelfFoundationStockStripMinHeightPx(layoutDeals: number): number {
  return Math.max(
    shelfPanelHeightPx,
    foundationStripMinContentHeightPx,
    stockStackRegionHeightPx(layoutDeals),
  );
}

/** Horizontal offset from one shelf card’s left edge to the next’s (never negative). */
export function shelfHorizontalStepPx(): number {
  return Math.max(0, dimensions.cardWidth - dimensions.shelfOverlap);
}
