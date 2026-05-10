import { describe, expect, it } from "vitest";
import { buildDoubleDeck } from "./cards";
import type { GameState, PlacedCard } from "./types";
import {
  applyMoveTableau,
  canMoveTableau,
  canMoveToFoundation,
  isValidSameSuitDescendingRun,
} from "./moves";

function pile(...cards: PlacedCard[]): PlacedCard[] {
  return cards;
}

describe("isValidSameSuitDescendingRun", () => {
  const S = buildDoubleDeck();
  const h13 = S.find((c) => c.suit === "H" && c.rank === 13)!;
  const h12 = S.find((c) => c.suit === "H" && c.rank === 12 && c.id !== h13.id)!;
  const h11 = S.find((c) => c.suit === "H" && c.rank === 11 && c.id !== h13.id && c.id !== h12.id)!;

  it("accepts same-suit descending tail", () => {
    const col: PlacedCard[] = [
      { card: S[0]!, faceUp: false },
      { card: h13, faceUp: true },
      { card: h12, faceUp: true },
      { card: h11, faceUp: true },
    ];
    expect(isValidSameSuitDescendingRun(col, 1)).toBe(true);
  });

  it("rejects mixed suit", () => {
    const c1 = S.find((c) => c.suit === "H" && c.rank === 9)!;
    const c2 = S.find((c) => c.suit === "D" && c.rank === 8)!;
    const col: PlacedCard[] = [
      { card: c1, faceUp: true },
      { card: c2, faceUp: true },
    ];
    expect(isValidSameSuitDescendingRun(col, 0)).toBe(false);
  });
});

describe("canMoveTableau / foundation", () => {
  const d = buildDoubleDeck();
  const empty: GameState = {
    config: {
      columns: 3,
      deals: 5,
      deckPairId: "t",
      seed: "s",
      jokerCount: 0,
    },
    columns: [[], [], []],
    foundation: [[], [], [], [], [], [], [], []],
    stock: [],
    shelf: [],
    undoCount: 0,
    history: [],
  };

  it("allows single card onto rank+1 regardless of suit", () => {
    const a = d.find((c) => c.suit === "S" && c.rank === 5)!;
    const b = d.find((c) => c.suit === "H" && c.rank === 6)!;
    const state: GameState = {
      ...empty,
      columns: [
        pile({ card: b, faceUp: true }),
        pile({ card: a, faceUp: true }),
        [],
      ],
    };
    expect(canMoveTableau(state, { fromColumn: 1, startIndex: 0, toColumn: 0 })).toBe(true);
  });

  it("rejects moving mixed-suit run", () => {
    const h8 = d.find((c) => c.suit === "H" && c.rank === 8)!;
    const s7 = d.find((c) => c.suit === "S" && c.rank === 7)!;
    const h6 = d.find((c) => c.suit === "H" && c.rank === 6)!;
    const state: GameState = {
      ...empty,
      columns: [
        pile({ card: h8, faceUp: true }),
        pile({ card: s7, faceUp: true }, { card: h6, faceUp: true }),
        [],
      ],
    };
    expect(canMoveTableau(state, { fromColumn: 1, startIndex: 0, toColumn: 0 })).toBe(false);
  });

  it("Ace onto empty foundation only", () => {
    const ace = d.find((c) => c.suit === "C" && c.rank === 1)!;
    const state: GameState = {
      ...empty,
      columns: [[{ card: ace, faceUp: true }], [], []],
    };
    expect(canMoveToFoundation(state, { fromColumn: 0, foundationIndex: 0 })).toBe(true);
    const king = d.find((c) => c.suit === "C" && c.rank === 13)!;
    const st2: GameState = {
      ...empty,
      columns: [[{ card: king, faceUp: true }], [], []],
    };
    expect(canMoveToFoundation(st2, { fromColumn: 0, foundationIndex: 0 })).toBe(false);
  });

  it("foundation builds same suit ascending", () => {
    const ace = d.find((c) => c.suit === "D" && c.rank === 1)!;
    const two = d.find((c) => c.suit === "D" && c.rank === 2 && c.id !== ace.id)!;
    const state: GameState = {
      ...empty,
      columns: [[{ card: two, faceUp: true }], [], []],
      foundation: [
        [{ card: ace, faceUp: true }],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
      ],
    };
    expect(canMoveToFoundation(state, { fromColumn: 0, foundationIndex: 0 })).toBe(true);
  });
});

describe("applyMoveTableau flips exposed card", () => {
  it("turns face-down neighbour face up after move", () => {
    const d = buildDoubleDeck();
    const k = d.find((c) => c.suit === "C" && c.rank === 13)!;
    const q = d.find((c) => c.suit === "C" && c.rank === 12 && c.id !== k.id)!;
    const state: GameState = {
      config: { columns: 2, deals: 10, deckPairId: "t", seed: "s", jokerCount: 0 },
      columns: [[], [{ card: k, faceUp: false }, { card: q, faceUp: true }]],
      foundation: [[], [], [], [], [], [], [], []],
      stock: [],
      shelf: [],
      undoCount: 0,
      history: [],
    };
    const r = applyMoveTableau(state, { fromColumn: 1, startIndex: 1, toColumn: 0 });
    expect(r).not.toBeNull();
    const col1 = r!.state.columns[1]!;
    expect(col1).toHaveLength(1);
    expect(col1[0]!.faceUp).toBe(true);
    expect(col1[0]!.card.id).toBe(k.id);
  });
});
