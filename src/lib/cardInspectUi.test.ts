import { describe, expect, it } from "vitest";
import { appliedEffect, emptyEffectsState } from "@/engine/effects";
import type { GameState, RegularCard } from "@/engine/types";
import { cardEffectKey } from "@/engine/effects";
import { EFFECT_TRANSPARENT } from "@/content/effectDefinitions";
import {
  courtSetKey,
  namePlateInspectHighlightForTableauCard,
} from "@/lib/cardInspectUi";

function reg(id: number, rank: RegularCard["rank"] = 5, suit: RegularCard["suit"] = "S"): RegularCard {
  return { kind: "regular", id, suit, rank };
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

describe("namePlateInspectHighlightForTableauCard", () => {
  it("direct hover: pip vs court ring tier", () => {
    const pip = { card: reg(1, 7, "H"), faceUp: true };
    const king = { card: reg(2, 13, "H"), faceUp: true };
    const state = baseState({
      columns: [[pip], [king], ...Array.from({ length: 8 }, () => [])],
    });
    expect(
      namePlateInspectHighlightForTableauCard(state, { kind: "card", columnIndex: 0, cardIndex: 0 }, 0, 0, pip),
    ).toBe("pip");
    expect(
      namePlateInspectHighlightForTableauCard(state, { kind: "card", columnIndex: 1, cardIndex: 0 }, 1, 0, king),
    ).toBe("face");
  });

  it("hovering a court highlights set mates that are face-up or transparent face-down", () => {
    const king = { card: reg(1, 13, "S"), faceUp: true };
    const queenUp = { card: reg(2, 12, "S"), faceUp: true };
    const jackDown = { card: reg(3, 11, "S"), faceUp: false };
    const jackKey = cardEffectKey(jackDown.card);
    const queenHidden = { card: reg(4, 12, "D"), faceUp: false };
    const state = baseState({
      columns: [
        [king],
        [queenUp],
        [jackDown],
        [queenHidden],
        ...Array.from({ length: 6 }, () => []),
      ],
      cardEffects: { [jackKey]: [appliedEffect(EFFECT_TRANSPARENT)] },
    });
    expect(courtSetKey(king.card)).toBe(courtSetKey(queenUp.card));
    expect(courtSetKey(king.card)).toBe(courtSetKey(jackDown.card));
    expect(courtSetKey(king.card)).not.toBe(courtSetKey(queenHidden.card));

    const source = { kind: "card" as const, columnIndex: 0, cardIndex: 0 };
    expect(namePlateInspectHighlightForTableauCard(state, source, 1, 0, queenUp)).toBe("face");
    expect(namePlateInspectHighlightForTableauCard(state, source, 2, 0, jackDown)).toBe("face");
    expect(namePlateInspectHighlightForTableauCard(state, source, 3, 0, queenHidden)).toBe("none");
  });

  it("different deck same suit is not the same set", () => {
    const kingD1 = { card: reg(1, 13, "H"), faceUp: true };
    const queenD2 = { card: reg(60, 12, "H"), faceUp: true };
    const state = baseState({
      columns: [[kingD1], [queenD2], ...Array.from({ length: 8 }, () => [])],
    });
    const source = { kind: "card" as const, columnIndex: 0, cardIndex: 0 };
    expect(namePlateInspectHighlightForTableauCard(state, source, 1, 0, queenD2)).toBe("none");
  });
});
