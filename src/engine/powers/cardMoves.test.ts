import { describe, expect, it } from "vitest";
import { buildDoubleDeck } from "@/engine/cards";
import { appliedEffect, tickEffectDurations } from "@/engine/effects";
import { EFFECT_TRANSPARENT } from "@/content/effectDefinitions";
import { cardEffectKey } from "@/engine/effects";
import {
  applyCardSwap,
  applyFoundationReturn,
  findLeftmostLegalTableauColumn,
  undoCardSwap,
  undoFoundationReturn,
} from "@/engine/powers/cardMoves";
import {
  triggerImmediatePower,
  triggerTargetedFoundationPower,
  undo,
} from "@/engine/game";
import { createShelfJokerEntry } from "@/engine/powers";
import { POWER_CARD_SWAP, POWER_FOUNDATION_RETURN } from "@/content/powerDefinitions";
import { emptyExtraColumnState } from "@/engine/extraColumnState";
import type { GameState } from "@/engine/types";

function baseState(overrides: Partial<GameState> = {}): GameState {
  return {
    config: {
      columns: 4,
      deals: 6,
      deckPairId: "computerScience",
      seed: "card-moves-test",
      jokerCount: 4,
    },
    columns: [[], [], [], []],
    foundation: [[], [], [], [], [], [], [], []],
    stock: [],
    shelf: [],
    alignedSetKeys: [],
    cardEffects: {},
    columnEffects: {},
    ...emptyExtraColumnState(),
    undoCount: 0,
    history: [],
    ...overrides,
  };
}

describe("applyFoundationReturn", () => {
  it("places foundation top on leftmost legal column face-up", () => {
    const d = buildDoubleDeck();
    const ten = d.find((c) => c.suit === "H" && c.rank === 10)!;
    const jack = d.find((c) => c.suit === "H" && c.rank === 11)!;
    const queen = d.find((c) => c.suit === "H" && c.rank === 12)!;
    const state = baseState({
      columns: [
        [{ card: queen, faceUp: true }],
        [],
        [{ card: jack, faceUp: true }],
        [],
      ],
      foundation: [[{ card: ten, faceUp: true }], [], [], [], [], [], [], []],
    });
    const r = applyFoundationReturn(state, 0);
    expect(r).not.toBeNull();
    expect(r!.foundationReturnUndo.toColumn).toBe(1);
    expect(r!.state.foundation[0]).toHaveLength(0);
    const col1 = r!.state.columns[1]!;
    expect(col1).toHaveLength(1);
    expect(col1[0]!.card.id).toBe(ten.id);
    expect(col1[0]!.faceUp).toBe(true);
  });

  it("returns null when no legal tableau column", () => {
    const d = buildDoubleDeck();
    const king = d.find((c) => c.suit === "H" && c.rank === 13)!;
    const ace = d.find((c) => c.suit === "H" && c.rank === 1)!;
    const state = baseState({
      columns: [
        [{ card: ace, faceUp: true }],
        [{ card: ace, faceUp: true }],
        [{ card: ace, faceUp: true }],
        [{ card: ace, faceUp: true }],
      ],
      foundation: [[{ card: king, faceUp: true }], [], [], [], [], [], [], []],
    });
    expect(applyFoundationReturn(state, 0)).toBeNull();
    expect(findLeftmostLegalTableauColumn(state, king)).toBeNull();
  });
});

describe("applyCardSwap", () => {
  it("swaps two tableau cards and exchanges face-up state at each slot", () => {
    const d = buildDoubleDeck();
    const a = d.find((c) => c.rank === 5 && c.suit === "S")!;
    const b = d.find((c) => c.rank === 6 && c.suit === "H")!;
    const state = baseState({
      columns: [
        [
          { card: a, faceUp: false },
          { card: b, faceUp: true },
        ],
        [],
        [],
        [],
      ],
    });
    const r = applyCardSwap(state, a, b);
    expect(r).not.toBeNull();
    expect(r!.state.columns[0]![0]!.card.id).toBe(b.id);
    expect(r!.state.columns[0]![0]!.faceUp).toBe(false);
    expect(r!.state.columns[0]![1]!.card.id).toBe(a.id);
    expect(r!.state.columns[0]![1]!.faceUp).toBe(true);
  });

  it("swaps stock and tableau and applies tableau face state to incoming stock card", () => {
    const d = buildDoubleDeck();
    const stockCard = d[0]!;
    const tableauCard = d[1]!;
    const state = baseState({
      columns: [[{ card: tableauCard, faceUp: false }], [], [], []],
      stock: [stockCard],
    });
    const r = applyCardSwap(state, stockCard, tableauCard);
    expect(r).not.toBeNull();
    expect(r!.state.stock[0]!.id).toBe(tableauCard.id);
    expect(r!.state.columns[0]![0]!.card.id).toBe(stockCard.id);
    expect(r!.state.columns[0]![0]!.faceUp).toBe(false);
  });
});

describe("power commit ticks other timed effects", () => {
  it("immediate power ticks existing timed effects but not newly added", () => {
    const d = buildDoubleDeck();
    const other = d.find((c) => c.rank === 5)!;
    const key = cardEffectKey(other);
    const state = baseState({
      cardEffects: {
        [key]: [appliedEffect(EFFECT_TRANSPARENT, 2)],
      },
      shelf: [createShelfJokerEntry("computerScience", { kind: "joker", id: 0 })],
    });
    const before = state.cardEffects[key]![0]!.movesRemaining;
    const next = triggerImmediatePower(state, 0);
    expect(next).not.toBeNull();
    const afterOther = next!.cardEffects[key]![0]!.movesRemaining;
    expect(afterOther).toBe((before ?? 0) - 1);
    const kings = buildDoubleDeck().filter((c) => c.rank === 13);
    for (const k of kings) {
      const kr = next!.cardEffects[cardEffectKey(k)]?.[0]?.movesRemaining;
      expect(kr).toBeNull();
    }
  });
});

describe("triggerTargetedFoundationPower and undo", () => {
  it("consumes charge, moves card, undoes", () => {
    const d = buildDoubleDeck();
    const ten = d.find((c) => c.suit === "H" && c.rank === 10)!;
  const joker = { kind: "joker" as const, id: 1 };
    const state = baseState({
      foundation: [[{ card: ten, faceUp: true }], [], [], [], [], [], [], []],
      shelf: [
        {
          kind: "joker",
          card: joker,
          slot: 2,
          powerId: POWER_FOUNDATION_RETURN,
          chargesRemaining: 5,
        },
      ],
    });
    const next = triggerTargetedFoundationPower(state, 0, 0);
    expect(next).not.toBeNull();
    expect(next!.foundation[0]).toHaveLength(0);
    expect(next!.shelf[0]!.chargesRemaining).toBe(4);
    const undone = undo(next!);
    expect(undone!.foundation[0]).toHaveLength(1);
    expect(undone!.shelf[0]!.chargesRemaining).toBe(5);
  });
});
