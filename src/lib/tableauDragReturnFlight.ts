import { tableauColumnStackTopPx } from "@/constants/dimensions";
import type { PlacedCard } from "@/engine/types";

/** Fixed-position overlay flight between drop pointer and a tableau stack anchor. */
export type TableauOverlayFlight = {
  columnIndex: number;
  anchorIndex: number;
  cards: readonly PlacedCard[];
  originX: number;
  originY: number;
  deltaX: number;
  deltaY: number;
};

/** @deprecated Use {@link TableauOverlayFlight}. */
export type TableauOverlayReturnFlight = TableauOverlayFlight;

const OVERLAY_ROOT_SELECTOR = "[data-tableau-drag-overlay]";
const STACK_SELECTOR = (col: number) => `[data-tableau-stack="${col}"]`;

/** Screen position of the bottom card of a run at `anchorIndex` in a column stack. */
export function tableauStackAnchorScreenPoint(
  columnIndex: number,
  anchorIndex: number,
  column: readonly PlacedCard[],
): { x: number; y: number } | null {
  if (typeof document === "undefined") return null;
  const stackEl = document.querySelector<HTMLElement>(STACK_SELECTOR(columnIndex));
  if (!stackEl) return null;
  const stackRect = stackEl.getBoundingClientRect();
  return {
    x: stackRect.left,
    y: stackRect.top + tableauColumnStackTopPx(column, anchorIndex),
  };
}

/**
 * Fixed flight between two tableau stack anchors (e.g. undo: destination column → source column).
 */
export function measureTableauStackFlight(
  fromColumnIndex: number,
  fromAnchorIndex: number,
  fromColumn: readonly PlacedCard[],
  toColumnIndex: number,
  toAnchorIndex: number,
  toColumn: readonly PlacedCard[],
  cards: readonly PlacedCard[],
): TableauOverlayFlight | null {
  const from = tableauStackAnchorScreenPoint(fromColumnIndex, fromAnchorIndex, fromColumn);
  const to = tableauStackAnchorScreenPoint(toColumnIndex, toAnchorIndex, toColumn);
  if (!from || !to) return null;
  return {
    columnIndex: toColumnIndex,
    anchorIndex: toAnchorIndex,
    cards,
    originX: from.x,
    originY: from.y,
    deltaX: to.x - from.x,
    deltaY: to.y - from.y,
  };
}

/**
 * Screen-space delta from the drag overlay root to where the run's anchor card sits in
 * `column` at `anchorIndex` (bottom card of the run).
 */
export function measureTableauOverlayFlight(
  columnIndex: number,
  anchorIndex: number,
  column: readonly PlacedCard[],
  overlayCards: readonly PlacedCard[],
): TableauOverlayFlight | null {
  if (typeof document === "undefined") return null;

  const overlayEl = document.querySelector<HTMLElement>(OVERLAY_ROOT_SELECTOR);
  if (!overlayEl) return null;
  const target = tableauStackAnchorScreenPoint(columnIndex, anchorIndex, column);
  if (!target) return null;

  const overlayRect = overlayEl.getBoundingClientRect();

  return {
    columnIndex,
    anchorIndex,
    cards: overlayCards,
    originX: overlayRect.left,
    originY: overlayRect.top,
    deltaX: target.x - overlayRect.left,
    deltaY: target.y - overlayRect.top,
  };
}

/** @deprecated Use {@link measureTableauOverlayFlight}. */
export function measureTableauOverlayReturnFlight(
  fromCol: number,
  startIndex: number,
  column: readonly PlacedCard[],
  overlayCards: readonly PlacedCard[],
): TableauOverlayFlight | null {
  return measureTableauOverlayFlight(fromCol, startIndex, column, overlayCards);
}
