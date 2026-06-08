import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ShelfStrip } from "@/components/game/ShelfStrip";
import { dimensions, shelfHorizontalStepPx } from "@/constants/dimensions";
import { POWER_SELECTED_CARD_TRANSPARENT } from "@/content/powerDefinitions";
import { emptyEffectsState } from "@/engine/effects";
import { emptyExtraColumnState } from "@/engine/extraColumnState";
import type { GameState, ShelfEntry } from "@/engine/types";
import { shelfPanelWidthPx } from "@/lib/shelfPanelLayout";
import { shelfEntryLayoutLeftPx, shelfStripInnerWidthPx } from "@/lib/setPowerUi";

vi.mock("@/state/gameStore", () => ({
  useGameStore: (selector: (s: { dealAnimation: null; powerTargeting: null; triggerShelfPower: () => void }) => unknown) =>
    selector({
      dealAnimation: null,
      powerTargeting: null,
      triggerShelfPower: vi.fn(),
    }),
}));

function baseGame(shelf: ShelfEntry[]): GameState {
  return {
    config: {
      columns: 4,
      deals: 5,
      deckPairId: "westernPhilosophy",
      seed: "shelf-strip-test",
      jokerCount: 2,
    },
    columns: [[], [], [], []],
    foundation: [[], [], [], [], [], [], [], []],
    stock: [],
    shelf,
    alignedSetKeys: ["1-S"],
    ...emptyEffectsState(),
    ...emptyExtraColumnState(),
    undoCount: 0,
    history: [],
  };
}

describe("ShelfStrip", () => {
  it("renders jokers, gap layout, and set power card", () => {
    const shelf: ShelfEntry[] = [
      {
        kind: "joker",
        card: { kind: "joker", id: 0 },
        slot: 1,
        powerId: POWER_SELECTED_CARD_TRANSPARENT,
        chargesRemaining: 3,
      },
      {
        kind: "joker",
        card: { kind: "joker", id: 1 },
        slot: 2,
        powerId: POWER_SELECTED_CARD_TRANSPARENT,
        chargesRemaining: 2,
      },
      {
        kind: "set",
        setKey: "1-S",
        deckNum: 1,
        suit: "S",
        powerId: POWER_SELECTED_CARD_TRANSPARENT,
        chargesRemaining: 1,
      },
    ];
    const step = shelfHorizontalStepPx();
    const gap = dimensions.shelfJokerSetGapPx;
    const cardWidth = dimensions.cardWidth;

    const panelWidth = shelfPanelWidthPx(shelf, 400);
    render(
      <ShelfStrip
        game={baseGame(shelf)}
        panelWidthPx={panelWidth}
        shiftInspectMode={false}
      />,
    );

    expect(screen.getByTestId("shelf-joker-0")).toBeInTheDocument();
    expect(screen.getByTestId("shelf-joker-1")).toBeInTheDocument();
    expect(screen.getByTestId("shelf-set-2")).toBeInTheDocument();
    expect(screen.getByTestId("set-power-shelf-card")).toBeInTheDocument();
    expect(screen.getByTestId("set-court-king")).toBeInTheDocument();

    const setLeft = step + cardWidth + gap;
    expect(shelfEntryLayoutLeftPx(2, shelf, step, gap, cardWidth)).toBe(setLeft);
    expect(shelfStripInnerWidthPx(shelf, step, gap, cardWidth)).toBe(
      cardWidth + step + gap + cardWidth,
    );

    const setEl = screen.getByTestId("shelf-set-2");
    expect(setEl).toHaveStyle({ left: `${setLeft}px` });
    expect(setEl).toHaveClass("select-none");
  });
});
