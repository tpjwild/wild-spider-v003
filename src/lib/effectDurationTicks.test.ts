import { describe, expect, it } from "vitest";
import { appliedEffect, emptyEffectsState } from "@/engine/effects";
import type { GameState, RegularCard } from "@/engine/types";
import { EFFECT_WILD } from "@/content/effectDefinitions";
import {
  soonestAppliedEffectTicks,
  soonestCardEffectTicks,
  soonestColumnHolderTicks,
} from "@/lib/effectDurationTicks";
import { cardEffectKey } from "@/engine/effects";

function reg(id: number): RegularCard {
  return { kind: "regular", id, suit: "S", rank: 5 };
}

function baseState(overrides: Partial<GameState> = {}): GameState {
  return {
    config: { seed: "t", deckPairId: "base", columns: 10, deals: 5, jokerCount: 0 },
    stock: [],
    shelf: [],
    foundation: [],
    columns: Array.from({ length: 10 }, () => []),
    history: [],
    ...emptyEffectsState(),
    ...overrides,
  } as GameState;
}

describe("soonestAppliedEffectTicks", () => {
  it("returns null when no timed effects", () => {
    expect(
      soonestAppliedEffectTicks([
        appliedEffect(EFFECT_WILD, null),
        appliedEffect("transparent", 0),
      ]),
    ).toBeNull();
  });

  it("returns minimum positive moves remaining", () => {
    expect(
      soonestAppliedEffectTicks([
        appliedEffect(EFFECT_WILD, 7),
        appliedEffect("skip1", 3),
      ]),
    ).toBe(3);
  });
});

describe("soonestCardEffectTicks", () => {
  it("uses only card effects", () => {
    const card = reg(1);
    const state = baseState({
      cardEffects: { [cardEffectKey(card)]: [appliedEffect(EFFECT_WILD, 4)] },
      columnEffects: { 0: [appliedEffect("skip1", 2)] },
    });
    expect(soonestCardEffectTicks(state, card)).toBe(4);
  });
});

describe("soonestColumnHolderTicks", () => {
  it("includes parent Extra Column link and column effects", () => {
    const state = baseState({
      extraColumnLinks: [{ parentColumnIndex: 0, movesRemaining: 10 }],
      columnEffects: { 0: [appliedEffect(EFFECT_WILD, 3)] },
    });
    expect(soonestColumnHolderTicks(state, 0)).toBe(3);
  });

  it("does not use incoming child link on extra-child column", () => {
    const state = baseState({
      columnFlags: { 1: { isExtraChild: true } },
      extraColumnLinks: [{ parentColumnIndex: 0, movesRemaining: 8 }],
    });
    expect(soonestColumnHolderTicks(state, 1)).toBeNull();
  });
});
