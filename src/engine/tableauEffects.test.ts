import { describe, expect, it } from "vitest";
import { buildDoubleDeck } from "@/engine/cards";
import { cardEffectKey, appliedEffect } from "@/engine/effects";
import {
  EFFECT_SKIP1,
  EFFECT_SKIP2,
  EFFECT_WILD,
  EFFECT_HALF_WILD,
} from "@/content/effectDefinitions";
import {
  canPlaceOnTableauWithEffects,
  effectiveRankChoices,
  effectiveSuitChoices,
  effectiveSuitChoicesForGame,
  isValidStrictSameSuitDescendingRun,
  isValidTableauRun,
  tableauCardAboveSharesDragRun,
} from "@/engine/tableauEffects";
import { emptyExtraColumnState } from "@/engine/extraColumnState";
import type { GameState, PlacedCard } from "@/engine/types";

const d = buildDoubleDeck();

function pile(...cards: { card: (typeof d)[0]; faceUp: boolean }[]): PlacedCard[] {
  return cards.map(({ card, faceUp }) => ({ card, faceUp }));
}

function emptyState(columns: PlacedCard[][]): GameState {
  return {
    config: {
      columns: columns.length,
      deals: 5,
      deckPairId: "mathematics",
      seed: "s",
      jokerCount: 0,
    },
    columns,
    foundation: [[], [], [], [], [], [], [], []],
    stock: [],
    shelf: [],
    alignedSetKeys: [],
    cardEffects: {},
    columnEffects: {},
    ...emptyExtraColumnState(),
    undoCount: 0,
    history: [],
  };
}

function withCardEffect(state: GameState, card: (typeof d)[0], effect: string): GameState {
  const key = cardEffectKey(card);
  return {
    ...state,
    cardEffects: { ...state.cardEffects, [key]: [appliedEffect(effect as GameState["cardEffects"][string][0]["effect"])] },
  };
}

function withColumnEffect(state: GameState, columnIndex: number, effect: string): GameState {
  return {
    ...state,
    columnEffects: {
      ...state.columnEffects,
      [columnIndex]: [appliedEffect(effect as GameState["columnEffects"][number][0]["effect"])],
    },
  };
}

describe("effectiveRankChoices", () => {
  it("skip1 offers printed rank and rank±1", () => {
    expect(effectiveRankChoices(4, [EFFECT_SKIP1]).sort()).toEqual([3, 4, 5]);
  });

  it("skip2 offers printed rank and rank±1 and ±2", () => {
    expect(effectiveRankChoices(5, [EFFECT_SKIP2]).sort()).toEqual([3, 4, 5, 6, 7]);
  });
});

describe("effectiveSuitChoicesForGame", () => {
  it("1 suit mode treats every card as wild on tableau", () => {
    const state = emptyState([[]]);
    state.config.numberOfSuits = 1;
    expect(effectiveSuitChoicesForGame(state, "C", []).sort()).toEqual(["C", "D", "H", "S"]);
  });

  it("2 suit mode treats every card as half-wild on tableau", () => {
    const state = emptyState([[]]);
    state.config.numberOfSuits = 2;
    expect(effectiveSuitChoicesForGame(state, "H", []).sort()).toEqual(["D", "H"]);
    expect(effectiveSuitChoicesForGame(state, "S", []).sort()).toEqual(["C", "S"]);
  });

  it("4 suit mode defers to card effects only", () => {
    const state = emptyState([[]]);
    state.config.numberOfSuits = 4;
    expect(effectiveSuitChoicesForGame(state, "H", [])).toEqual(["H"]);
  });
});

describe("effectiveSuitChoices", () => {
  it("wild allows all suits", () => {
    expect(effectiveSuitChoices("H", [EFFECT_WILD])).toEqual(["S", "C", "D", "H"]);
  });

  it("halfWild allows red or black pair", () => {
    expect(effectiveSuitChoices("D", [EFFECT_HALF_WILD]).sort()).toEqual(["D", "H"]);
    expect(effectiveSuitChoices("C", [EFFECT_HALF_WILD]).sort()).toEqual(["C", "S"]);
  });
});

describe("isValidTableauRun", () => {
  const s5 = d.find((c) => c.suit === "S" && c.rank === 5)!;
  const s4 = d.find((c) => c.suit === "S" && c.rank === 4 && c.id !== s5.id)!;
  const c3 = d.find((c) => c.suit === "C" && c.rank === 3)!;
  const h6 = d.find((c) => c.suit === "H" && c.rank === 6)!;
  const s2 = d.find((c) => c.suit === "S" && c.rank === 2)!;
  const s7 = d.find((c) => c.suit === "S" && c.rank === 7)!;
  const s9 = d.find((c) => c.suit === "S" && c.rank === 9)!;

  it("2-suit mode allows red suits to share a run when ranks align", () => {
    const d5 = d.find((c) => c.suit === "D" && c.rank === 5)!;
    const h4 = d.find((c) => c.suit === "H" && c.rank === 4)!;
    const col = pile({ card: d5, faceUp: true }, { card: h4, faceUp: true });
    const state = emptyState([col]);
    state.config.numberOfSuits = 2;
    expect(isValidTableauRun(state, 0, col, 0)).toBe(true);
  });

  it("1-suit mode allows mixed-color runs when ranks align", () => {
    const s5 = d.find((c) => c.suit === "S" && c.rank === 5)!;
    const h4 = d.find((c) => c.suit === "H" && c.rank === 4)!;
    const d3 = d.find((c) => c.suit === "D" && c.rank === 3)!;
    const col = pile(
      { card: s5, faceUp: true },
      { card: h4, faceUp: true },
      { card: d3, faceUp: true },
    );
    const state = emptyState([col]);
    state.config.numberOfSuits = 1;
    expect(isValidTableauRun(state, 0, col, 0)).toBe(true);
  });

  it("wild 4 on 5S moves as a unit with 5S", () => {
    const col = pile({ card: s5, faceUp: true }, { card: s4, faceUp: true });
    let state = emptyState([col]);
    state = withCardEffect(state, s4, EFFECT_WILD);
    expect(isValidTableauRun(state, 0, col, 0)).toBe(true);
    expect(isValidTableauRun(state, 0, col, 1)).toBe(true);
  });

  it("wild cannot bridge 5S and 3C through wild 4 in one three-card run", () => {
    const col = pile({ card: s5, faceUp: true }, { card: s4, faceUp: true }, { card: c3, faceUp: true });
    let state = emptyState([col]);
    state = withCardEffect(state, s4, EFFECT_WILD);
    expect(isValidTableauRun(state, 0, col, 1)).toBe(true);
    expect(isValidTableauRun(state, 0, col, 0)).toBe(false);
  });

  it("skip1 4S between 6S and 2S: 4+2 unit ok, 6+4+2 not", () => {
    const s6 = d.find((c) => c.suit === "S" && c.rank === 6)!;
    const col = pile({ card: s6, faceUp: true }, { card: s4, faceUp: true }, { card: s2, faceUp: true });
    let state = emptyState([col]);
    state = withCardEffect(state, s4, EFFECT_SKIP1);
    expect(isValidTableauRun(state, 0, col, 1)).toBe(true);
    expect(isValidTableauRun(state, 0, col, 0)).toBe(false);
  });

  it("skip2 4S on wild 6H moves as a group", () => {
    const col = pile({ card: h6, faceUp: true }, { card: s4, faceUp: true });
    let state = emptyState([col]);
    state = withCardEffect(state, h6, EFFECT_WILD);
    state = withCardEffect(state, s4, EFFECT_SKIP2);
    expect(isValidTableauRun(state, 0, col, 0)).toBe(true);
  });

  it("column effect applies to every card in the column", () => {
    const s6 = d.find((c) => c.suit === "S" && c.rank === 6)!;
    const s5 = d.find((c) => c.suit === "S" && c.rank === 5 && c.id !== s6.id)!;
    const col = pile({ card: s6, faceUp: true }, { card: s5, faceUp: true });
    let state = emptyState([col]);
    state = withColumnEffect(state, 0, EFFECT_WILD);
    expect(isValidTableauRun(state, 0, col, 0)).toBe(true);
  });

  it("stacked card and column effects merge", () => {
    const col = pile({ card: s9, faceUp: true }, { card: s4, faceUp: true });
    let state = emptyState([col]);
    state = withColumnEffect(state, 0, EFFECT_HALF_WILD);
    state = withCardEffect(state, s4, EFFECT_SKIP1);
    expect(isValidTableauRun(state, 0, col, 1)).toBe(true);
  });
});

describe("tableauCardAboveSharesDragRun", () => {
  const s5 = d.find((c) => c.suit === "S" && c.rank === 5)!;
  const s4 = d.find((c) => c.suit === "S" && c.rank === 4 && c.id !== s5.id)!;
  const c3 = d.find((c) => c.suit === "C" && c.rank === 3)!;

  it("is true when the card above anchors a run that includes this card", () => {
    const col = pile({ card: s5, faceUp: true }, { card: s4, faceUp: true });
    const state = emptyState([col]);
    expect(tableauCardAboveSharesDragRun(state, 0, 1)).toBe(true);
  });

  it("is false when the card above does not share a run", () => {
    const col = pile({ card: s5, faceUp: true }, { card: s4, faceUp: true }, { card: c3, faceUp: true });
    const state = emptyState([col]);
    expect(tableauCardAboveSharesDragRun(state, 0, 2)).toBe(false);
  });
});

describe("canPlaceOnTableauWithEffects", () => {
  const s4a = d.find((c) => c.suit === "S" && c.rank === 4)!;
  const s4b = d.find((c) => c.suit === "S" && c.rank === 4 && c.id !== s4a.id)!;
  const s6 = d.find((c) => c.suit === "S" && c.rank === 6)!;
  const s7 = d.find((c) => c.suit === "S" && c.rank === 7)!;
  const s9 = d.find((c) => c.suit === "S" && c.rank === 9)!;
  const s7b = d.find((c) => c.suit === "S" && c.rank === 7 && c.id !== s7.id)!;

  it("skip1 4 can land on 6, 5, or 4", () => {
    let state = emptyState([[], []]);
    state = withCardEffect(state, s4a, EFFECT_SKIP1);
    expect(canPlaceOnTableauWithEffects(state, s4a, 0, s6, 1)).toBe(true);
    const s5 = d.find((c) => c.suit === "S" && c.rank === 5)!;
    expect(canPlaceOnTableauWithEffects(state, s4a, 0, s5, 1)).toBe(true);
    expect(canPlaceOnTableauWithEffects(state, s4a, 0, s4b, 1)).toBe(true);
    const s7 = d.find((c) => c.suit === "S" && c.rank === 7)!;
    expect(canPlaceOnTableauWithEffects(state, s4a, 0, s7, 1)).toBe(false);
  });

  it("7 can land on skip1 9 or skip1 7", () => {
    let state = emptyState([[], []]);
    state = withCardEffect(state, s9, EFFECT_SKIP1);
    state = withCardEffect(state, s7b, EFFECT_SKIP1);
    expect(canPlaceOnTableauWithEffects(state, s7, 0, s9, 1)).toBe(true);
    expect(canPlaceOnTableauWithEffects(state, s7, 0, s7b, 1)).toBe(true);
  });
});

describe("foundation uses strict runs", () => {
  it("strict helper rejects wild-bridged mixed suits", () => {
    const s5 = d.find((c) => c.suit === "S" && c.rank === 5)!;
    const s4 = d.find((c) => c.suit === "S" && c.rank === 4 && c.id !== s5.id)!;
    const c3 = d.find((c) => c.suit === "C" && c.rank === 3)!;
    const col = pile({ card: s5, faceUp: true }, { card: s4, faceUp: true }, { card: c3, faceUp: true });
    expect(isValidStrictSameSuitDescendingRun(col, 1)).toBe(false);
  });
});
