import { describe, expect, it } from "vitest";
import { emptyExtraColumnState } from "@/engine/extraColumnState";
import { appliedEffect, emptyEffectsState } from "@/engine/effects";
import type { GameState, RegularCard } from "@/engine/types";
import {
  columnHolderEffectBadgeEntries,
  deckPopupEffectBadgeEntries,
  extraColumnLinkForChildColumn,
  stockPopupEffectBadgeEntries,
  tableauEffectBadgeEntries,
} from "@/lib/effectBadgeEntries";
import { cardEffectKey } from "@/engine/effects";
import {
  EFFECT_EXTRA_COLUMN,
  EFFECT_TRANSPARENT,
  EFFECT_WILD,
} from "@/content/effectDefinitions";

function reg(id: number): RegularCard {
  return { kind: "regular", id, suit: "S", rank: 5 };
}

function baseState(overrides: Partial<GameState> = {}): GameState {
  return {
    config: { seed: "t", deckPairId: "base", columns: 10, deals: 5, jokerCount: 0 },
    stock: [],
    shelf: [],
    alignedSetKeys: [],
    foundation: [],
    columns: Array.from({ length: 10 }, () => []),
    history: [],
    ...emptyEffectsState(),
    ...emptyExtraColumnState(),
    ...overrides,
  } as GameState;
}

describe("effectBadgeEntries", () => {
  it("tableauEffectBadgeEntries includes card and column-only scopes", () => {
    const card = reg(1);
    const key = cardEffectKey(card);
    const state = baseState({
      columns: [[{ card, faceUp: false }], ...Array.from({ length: 9 }, () => [])],
      cardEffects: { [key]: [appliedEffect(EFFECT_TRANSPARENT)] },
      columnEffects: { 0: [appliedEffect(EFFECT_WILD)] },
    });
    const entries = tableauEffectBadgeEntries(state, 0, card);
    expect(entries).toEqual([
      { effectId: EFFECT_TRANSPARENT, scope: "card" },
      { effectId: EFFECT_WILD, scope: "column" },
    ]);
  });

  it("deckPopupEffectBadgeEntries inherits column effects for tableau cards only", () => {
    const card = reg(2);
    const key = cardEffectKey(card);
    const state = baseState({
      stock: [card],
      columns: Array.from({ length: 10 }, () => []),
      cardEffects: { [key]: [appliedEffect(EFFECT_TRANSPARENT)] },
      columnEffects: { 0: [appliedEffect(EFFECT_WILD)] },
    });
    expect(deckPopupEffectBadgeEntries(state, card)).toEqual([
      { effectId: EFFECT_TRANSPARENT, scope: "card" },
    ]);

    const onTableau = baseState({
      columns: [[{ card, faceUp: true }], ...Array.from({ length: 9 }, () => [])],
      cardEffects: { [key]: [appliedEffect(EFFECT_TRANSPARENT)] },
      columnEffects: { 0: [appliedEffect(EFFECT_WILD)] },
    });
    expect(deckPopupEffectBadgeEntries(onTableau, card)).toEqual([
      { effectId: EFFECT_TRANSPARENT, scope: "card" },
      { effectId: EFFECT_WILD, scope: "column" },
    ]);
  });

  it("columnHolderEffectBadgeEntries includes Extra Column icon for parent link", () => {
    const state = baseState({
      columns: [[], [], []],
      extraColumnLinks: [{ parentColumnIndex: 0, movesRemaining: 10 }],
    });
    expect(columnHolderEffectBadgeEntries(state, 0)).toEqual([
      { effectId: EFFECT_EXTRA_COLUMN, scope: "column" },
    ]);
    expect(columnHolderEffectBadgeEntries(state, 1)).toEqual([]);
  });

  it("columnHolderEffectBadgeEntries merges joker effects with Extra Column icon", () => {
    const state = baseState({
      columns: [[], []],
      columnEffects: { 0: [appliedEffect(EFFECT_WILD)] },
      extraColumnLinks: [{ parentColumnIndex: 0, movesRemaining: 7 }],
    });
    expect(columnHolderEffectBadgeEntries(state, 0)).toEqual([
      { effectId: EFFECT_WILD, scope: "column" },
      { effectId: EFFECT_EXTRA_COLUMN, scope: "column" },
    ]);
  });

  it("extraColumnLinkForChildColumn resolves parent link for extra-child index", () => {
    const state = baseState({
      columns: [[], [], []],
      columnFlags: { 1: { isExtraChild: true } },
      extraColumnLinks: [{ parentColumnIndex: 0, movesRemaining: 10 }],
    });
    expect(extraColumnLinkForChildColumn(state, 1)).toEqual({
      parentColumnIndex: 0,
      movesRemaining: 10,
    });
    expect(extraColumnLinkForChildColumn(state, 0)).toBeUndefined();
  });

  it("stockPopupEffectBadgeEntries never includes column scope", () => {
    const card = reg(3);
    const key = cardEffectKey(card);
    const state = baseState({
      stock: [card],
      columnEffects: { 0: [appliedEffect(EFFECT_WILD)] },
      cardEffects: { [key]: [appliedEffect(EFFECT_TRANSPARENT)] },
    });
    expect(stockPopupEffectBadgeEntries(state, card)).toEqual([
      { effectId: EFFECT_TRANSPARENT, scope: "card" },
    ]);
  });
});
