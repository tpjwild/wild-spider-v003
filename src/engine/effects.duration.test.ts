import { describe, expect, it } from "vitest";
import { EFFECT_TRANSPARENT } from "@/content/effectDefinitions";
import { buildDoubleDeck } from "@/engine/cards";
import {
  addCardEffectForCard,
  appliedEffect,
  cardEffectKey,
  tickEffectDurations,
} from "@/engine/effects";
import { emptyExtraColumnState } from "@/engine/extraColumnState";
import { moveTableau, undo } from "@/engine/game";
import type { GameState } from "@/engine/types";

function baseState(overrides: Partial<GameState> = {}): GameState {
  return {
    config: {
      columns: 4,
      deals: 6,
      deckPairId: "computerScience",
      seed: "duration-test",
      jokerCount: 0,
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
  } as GameState;
}

describe("effect duration", () => {
  it("tickEffectDurations decrements timed effects and removes at zero", () => {
    const card = buildDoubleDeck()[0]!;
    const key = cardEffectKey(card);
    let state = baseState({
      cardEffects: { [key]: [appliedEffect(EFFECT_TRANSPARENT, 2)] },
    });
    state = tickEffectDurations(state);
    expect(state.cardEffects[key]).toEqual([appliedEffect(EFFECT_TRANSPARENT, 1)]);
    state = tickEffectDurations(state);
    expect(state.cardEffects[key]).toBeUndefined();
  });

  it("tickEffectDurations leaves permanent effects unchanged", () => {
    const card = buildDoubleDeck()[0]!;
    const key = cardEffectKey(card);
    const state = baseState({
      cardEffects: { [key]: [appliedEffect(EFFECT_TRANSPARENT, null)] },
    });
    const after = tickEffectDurations(state);
    expect(after.cardEffects[key]).toEqual([appliedEffect(EFFECT_TRANSPARENT, null)]);
  });

  it("moveTableau ticks timed effects after the move", () => {
    const d = buildDoubleDeck();
    const king = d.find((c) => c.rank === 13)!;
    const queen = d.find((c) => c.rank === 12 && c.suit === king.suit)!;
    const key = cardEffectKey(king);
    const state = baseState({
      columns: [
        [{ card: queen, faceUp: true }, { card: king, faceUp: true }],
        [],
        [],
        [],
      ],
      cardEffects: { [key]: [appliedEffect(EFFECT_TRANSPARENT, 1)] },
    });
    const after = moveTableau(state, { fromColumn: 0, startIndex: 1, toColumn: 1 });
    expect(after?.cardEffects[key]).toBeUndefined();
  });

  it("undo move restores timed effects expired by that move", () => {
    const d = buildDoubleDeck();
    const king = d.find((c) => c.rank === 13)!;
    const queen = d.find((c) => c.rank === 12 && c.suit === king.suit)!;
    const key = cardEffectKey(king);
    const state = baseState({
      columns: [
        [{ card: queen, faceUp: true }, { card: king, faceUp: true }],
        [],
        [],
        [],
      ],
      cardEffects: { [key]: [appliedEffect(EFFECT_TRANSPARENT, 1)] },
    });
    const afterMove = moveTableau(state, { fromColumn: 0, startIndex: 1, toColumn: 1 })!;
    expect(afterMove.cardEffects[key]).toBeUndefined();

    const afterUndo = undo(afterMove)!;
    expect(afterUndo.cardEffects[key]).toEqual([appliedEffect(EFFECT_TRANSPARENT, 1)]);
    expect(afterUndo.history).toHaveLength(0);
  });

  it("addCardEffectForCard stores movesRemaining", () => {
    const card = buildDoubleDeck()[0]!;
    const { state } = addCardEffectForCard(baseState(), card, EFFECT_TRANSPARENT, 5);
    expect(state.cardEffects[cardEffectKey(card)]).toEqual([
      appliedEffect(EFFECT_TRANSPARENT, 5),
    ]);
  });
});
