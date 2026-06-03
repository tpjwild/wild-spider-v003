import { describe, expect, it } from "vitest";
import { dimensions, foundationRowWidthPx } from "@/constants/dimensions";
import type { ShelfEntry } from "@/engine/types";
import {
  flankColumnWidthPx,
  maxFlankColumnWidthPx,
  shelfPanelContentWidthPx,
  shelfPanelWidthPx,
} from "@/lib/shelfPanelLayout";

const joker = (id: number): ShelfEntry => ({
  kind: "joker",
  card: { kind: "joker", id },
  slot: 1,
  powerId: "jokerSelectedCardTransparent",
  chargesRemaining: 3,
});

describe("shelfPanelLayout", () => {
  it("maxFlankColumnWidthPx splits row space around foundation", () => {
    const foundation = foundationRowWidthPx();
    const gap = dimensions.shelfFoundationGapPx;
    const row = foundation + 2 * gap + 2 * 400;
    expect(maxFlankColumnWidthPx(row)).toBe(400);
  });

  it("shelf panel uses minimum width for a single card", () => {
    const flank = 400;
    expect(shelfPanelWidthPx([joker(0)], flank)).toBe(dimensions.shelfMinWidthPx);
  });

  it("flank column uses all available row space when shelf content is narrow", () => {
    const foundation = foundationRowWidthPx();
    const gap = dimensions.shelfFoundationGapPx;
    const row = foundation + 2 * gap + 2 * 400;
    expect(flankColumnWidthPx(row, [joker(0)])).toBe(400);
  });

  it("flank column grows with shelf content but stays equal-cap bounded", () => {
    const shelf: ShelfEntry[] = Array.from({ length: 12 }, (_, i) => joker(i));
    const row = 2000;
    const flank = flankColumnWidthPx(row, shelf);
    const panel = shelfPanelWidthPx(shelf, flank);
    expect(panel).toBeGreaterThan(dimensions.shelfMinWidthPx);
    expect(panel).toBeLessThanOrEqual(
      maxFlankColumnWidthPx(row) - dimensions.shelfOuterEdgeGapPx,
    );
    expect(flank).toBeGreaterThanOrEqual(panel + dimensions.shelfOuterEdgeGapPx);
  });

  it("shelfPanelContentWidthPx includes horizontal pad", () => {
    const w = shelfPanelContentWidthPx([joker(0)]);
    expect(w).toBe(dimensions.cardWidth + 2 * dimensions.shelfHorizontalPad);
  });
});
