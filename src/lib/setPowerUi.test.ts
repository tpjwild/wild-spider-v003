import { describe, expect, it } from "vitest";
import { sharedSetFramePath } from "@/constants/gameArtPaths";
import { POWER_SELECTED_CARD_TRANSPARENT } from "@/content/powerDefinitions";
import {
  formatShelfPowerDisplayName,
  isShelfJoker,
  isShelfSetPower,
  partitionShelf,
  setKeyFromSuitDeck,
  shelfEntryLayoutLeftPx,
  shelfSetDisplayLabels,
  shelfStripInnerWidthPx,
} from "@/lib/setPowerUi";
import type { ShelfEntry } from "@/engine/types";

describe("formatShelfPowerDisplayName", () => {
  it("appends move count when catalog has initialDuration", () => {
    expect(formatShelfPowerDisplayName("Extra Column", 5)).toBe("Extra Column (5 moves)");
    expect(formatShelfPowerDisplayName("Extra Column", 10)).toBe("Extra Column (10 moves)");
  });

  it("uses singular for one move", () => {
    expect(formatShelfPowerDisplayName("Wild", 1)).toBe("Wild (1 move)");
  });

  it("leaves name unchanged when duration is null or zero", () => {
    expect(formatShelfPowerDisplayName("Wild", null)).toBe("Wild");
    expect(formatShelfPowerDisplayName("Wild", 0)).toBe("Wild");
  });
});

describe("shelfSetDisplayLabels", () => {
  it("omits duration suffix when set catalog is permanent", () => {
    const labels = shelfSetDisplayLabels("westernPhilosophy", {
      kind: "set",
      setKey: "1-S",
      deckNum: 1,
      suit: "S",
      powerId: POWER_SELECTED_CARD_TRANSPARENT,
      chargesRemaining: 1,
    });
    expect(labels?.powerName).toBe("Veiled glimpse");
  });
});

describe("setKeyFromSuitDeck", () => {
  it("matches courtSetKey format", () => {
    expect(setKeyFromSuitDeck(1, "S")).toBe("1-S");
    expect(setKeyFromSuitDeck(2, "H")).toBe("2-H");
  });
});

describe("sharedSetFramePath", () => {
  it("uses black frame for spades and clubs", () => {
    expect(sharedSetFramePath("S")).toContain("set-black-frame.svg");
    expect(sharedSetFramePath("C")).toContain("set-black-frame.svg");
  });

  it("uses red frame for hearts and diamonds", () => {
    expect(sharedSetFramePath("H")).toContain("set-red-frame.svg");
    expect(sharedSetFramePath("D")).toContain("set-red-frame.svg");
  });
});

describe("partitionShelf", () => {
  const joker: ShelfEntry = {
    kind: "joker",
    card: { kind: "joker", id: 0 },
    slot: 1,
    powerId: "jokerAllKingsTransparent",
    chargesRemaining: 3,
  };
  const setPower: ShelfEntry = {
    kind: "set",
    setKey: "1-H",
    deckNum: 1,
    suit: "H",
    powerId: "jokerSelectedCardTransparent",
    chargesRemaining: 2,
  };

  it("splits jokers and set powers", () => {
    expect(partitionShelf([joker, setPower])).toEqual({
      jokers: [joker],
      sets: [setPower],
    });
  });

  it("type guards match partition", () => {
    expect(isShelfJoker(joker)).toBe(true);
    expect(isShelfSetPower(joker)).toBe(false);
    expect(isShelfSetPower(setPower)).toBe(true);
    expect(isShelfJoker(setPower)).toBe(false);
  });
});

describe("shelf layout helpers", () => {
  const step = 40;
  const gap = 12;
  const cardWidth = 72;

  it("places set entries after jokers with gap", () => {
    const shelf: ShelfEntry[] = [
      {
        kind: "joker",
        card: { kind: "joker", id: 0 },
        slot: 1,
        powerId: "jokerAllKingsTransparent",
        chargesRemaining: 3,
      },
      {
        kind: "set",
        setKey: "1-S",
        deckNum: 1,
        suit: "S",
        powerId: "jokerSelectedCardTransparent",
        chargesRemaining: 3,
      },
    ];
    expect(shelfEntryLayoutLeftPx(0, shelf, step, gap, cardWidth)).toBe(0);
    expect(shelfEntryLayoutLeftPx(1, shelf, step, gap, cardWidth)).toBe(cardWidth + gap);
    expect(shelfStripInnerWidthPx(shelf, step, gap, cardWidth)).toBe(cardWidth + gap + cardWidth);
  });
});
