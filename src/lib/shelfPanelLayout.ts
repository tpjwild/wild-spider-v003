import {
  dimensions,
  foundationRowWidthPx,
  shelfHorizontalStepPx,
} from "@/constants/dimensions";
import type { ShelfEntry } from "@/engine/types";
import { shelfStripInnerWidthPx } from "@/lib/setPowerUi";

/** Width of the card strip inside the shelf panel (horizontal padding only). */
export function shelfPanelContentWidthPx(shelf: readonly ShelfEntry[]): number {
  const step = shelfHorizontalStepPx();
  const gap = dimensions.shelfJokerSetGapPx;
  const cw = dimensions.cardWidth;
  const inner = shelfStripInnerWidthPx(shelf, step, gap, cw);
  return inner + 2 * dimensions.shelfHorizontalPad;
}

/** Max width of one flank column (shelf or stock) from the measured top-row inner width. */
export function maxFlankColumnWidthPx(rowInnerWidthPx: number): number {
  const foundation = foundationRowWidthPx();
  const gap = dimensions.shelfFoundationGapPx;
  return Math.max(0, Math.floor((rowInnerWidthPx - foundation - 2 * gap) / 2));
}

/** Shelf panel width: min {@link dimensions.shelfMinWidthPx}, content-driven, capped by flank column minus outer gap. */
export function shelfPanelWidthPx(shelf: readonly ShelfEntry[], flankColumnWidthPx: number): number {
  const content = shelfPanelContentWidthPx(shelf);
  const maxPanel = Math.max(
    dimensions.shelfMinWidthPx,
    flankColumnWidthPx - dimensions.shelfOuterEdgeGapPx,
  );
  return Math.max(dimensions.shelfMinWidthPx, Math.min(content, maxPanel));
}

/**
 * Equal width for shelf and stock columns so the foundation stays centred.
 * Uses all space available in the row (up to maxFlank), not only content width.
 */
export function flankColumnWidthPx(rowInnerWidthPx: number, shelf: readonly ShelfEntry[]): number {
  const minFlank = dimensions.shelfMinWidthPx + dimensions.shelfOuterEdgeGapPx;
  const contentFlank = shelfPanelContentWidthPx(shelf) + dimensions.shelfOuterEdgeGapPx;
  const maxFlank = maxFlankColumnWidthPx(rowInnerWidthPx);
  return Math.max(minFlank, Math.min(maxFlank, Math.max(contentFlank, maxFlank)));
}
