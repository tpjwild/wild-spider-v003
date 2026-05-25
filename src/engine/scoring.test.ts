import { describe, expect, it } from "vitest";
import { buildDoubleDeck } from "./cards";
import { computeScore } from "./scoring";
import { emptyExtraColumnState } from "./extraColumnState";
import type { GameState } from "./types";

function emptyState(): Omit<GameState, "columns" | "foundation"> {
  return {
    config: {
      columns: 2,
      deals: 10,
      deckPairId: "mathematics",
      seed: "s",
      jokerCount: 0,
    },
    stock: [],
    shelf: [],
    cardEffects: {},
    columnEffects: {},
    ...emptyExtraColumnState(),
    undoCount: 0,
    history: [],
  };
}

describe("computeScore", () => {
  it("counts adjacent same-suit descending face-up pairs", () => {
    const d = buildDoubleDeck();
    const h9 = d.find((c) => c.suit === "H" && c.rank === 9)!;
    const h8 = d.find((c) => c.suit === "H" && c.rank === 8 && c.id !== h9.id)!;
    const state: GameState = {
      ...emptyState(),
      columns: [
        [
          { card: h9, faceUp: true },
          { card: h8, faceUp: true },
        ],
        [],
      ],
      foundation: [[], [], [], [], [], [], [], []],
    };
    const s = computeScore(state);
    expect(s.adjacentSuitRunPoints).toBe(1);
    expect(s.foundationPenalty).toBe(0);
  });

  it("applies -1 per foundation card", () => {
    const d = buildDoubleDeck();
    const state: GameState = {
      ...emptyState(),
      columns: [[], []],
      foundation: [
        [{ card: d[0]!, faceUp: true }],
        [
          { card: d[1]!, faceUp: true },
          { card: d[2]!, faceUp: true },
          { card: d[3]!, faceUp: true },
        ],
        [],
        [],
        [],
        [],
        [],
        [],
      ],
    };
    expect(computeScore(state).foundationPenalty).toBe(-4);
  });

  it("adds 0.5 per complete K–A same-suit run in tableau", () => {
    const d = buildDoubleDeck();
    const run = [];
    for (let r = 13; r >= 1; r--) {
      const c = d.find((x) => x.suit === "S" && x.rank === r)!;
      run.push({ card: c, faceUp: true });
    }
    const state: GameState = {
      ...emptyState(),
      columns: [run, []],
      foundation: [[], [], [], [], [], [], [], []],
    };
    const s = computeScore(state);
    expect(s.completeRunBonus).toBe(0.5);
  });

  it("applies -1 per undo", () => {
    const state: GameState = {
      ...emptyState(),
      undoCount: 3,
      columns: [[], []],
      foundation: [[], [], [], [], [], [], [], []],
    };
    expect(computeScore(state).undoPenalty).toBe(-3);
  });
});
