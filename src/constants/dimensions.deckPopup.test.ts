import { describe, expect, it } from "vitest";
import {
  deckPopupPanelOuterWidthPx,
  dimensions,
} from "@/constants/dimensions";

describe("deckPopupPanelOuterWidthPx", () => {
  it("adds edge padding, border, and vertical scrollbar gutter to row width", () => {
    const rowInner = 13 * dimensions.deckPopupCardWidth + 12 * dimensions.deckPopupColumnPad;
    expect(deckPopupPanelOuterWidthPx(rowInner)).toBe(
      rowInner +
        2 * dimensions.deckPopupHorizontalEdgePad +
        dimensions.deckPopupPanelBorderTotalPx +
        dimensions.deckPopupVerticalScrollbarPx,
    );
  });
});
