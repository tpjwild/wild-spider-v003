import { tableauColumnStackTopPx } from "@/constants/dimensions";
import type { PlacedCard } from "@/engine/types";

export type TableauOverlayReturnFlight = {
  fromCol: number;
  startIndex: number;
  cards: readonly PlacedCard[];
  originX: number;
  originY: number;
  deltaX: number;
  deltaY: number;
};

const OVERLAY_ROOT_SELECTOR = "[data-tableau-drag-overlay]";
const STACK_SELECTOR = (col: number) => `[data-tableau-stack="${col}"]`;

/**
 * Screen-space delta from the overlay root (drop position) to where the run's anchor card
 * sits in the source column. Returns null if DOM nodes are missing (caller should snap clear).
 */
export function measureTableauOverlayReturnFlight(
  fromCol: number,
  startIndex: number,
  column: readonly PlacedCard[],
  overlayCards: readonly PlacedCard[],
): TableauOverlayReturnFlight | null {
  if (typeof document === "undefined") return null;

  const overlayEl = document.querySelector<HTMLElement>(OVERLAY_ROOT_SELECTOR);
  const stackEl = document.querySelector<HTMLElement>(STACK_SELECTOR(fromCol));
  if (!overlayEl || !stackEl) return null;

  const overlayRect = overlayEl.getBoundingClientRect();
  const stackRect = stackEl.getBoundingClientRect();
  const targetTop = stackRect.top + tableauColumnStackTopPx(column, startIndex);
  const targetLeft = stackRect.left;

  return {
    fromCol,
    startIndex,
    cards: overlayCards,
    originX: overlayRect.left,
    originY: overlayRect.top,
    deltaX: targetLeft - overlayRect.left,
    deltaY: targetTop - overlayRect.top,
  };
}
