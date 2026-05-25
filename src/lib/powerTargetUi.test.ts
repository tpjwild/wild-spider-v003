import { describe, expect, it } from "vitest";
import {
  JOKER_POWER_EXTRA_COLUMN,
  JOKER_POWER_SELECTED_CARD_SKIP2,
  JOKER_POWER_SELECTED_CARD_TRANSPARENT,
  JOKER_POWER_SELECTED_COLUMN_TRANSPARENT,
} from "@/content/powerDefinitions";
import { triggerTargetedPower } from "@/engine/game";
import { hasCardEffect } from "@/engine/effects";
import { EFFECT_SKIP2 } from "@/content/effectDefinitions";
import { emptyExtraColumnState } from "@/engine/extraColumnState";
import { createShelfJokerEntry } from "@/engine/powers";
import { buildDoubleDeck } from "@/engine/cards";
import type { GameState, ShelfJoker } from "@/engine/types";
import {
  armedPowerIdForShelf,
  isColumnTargetingPower,
  isTableauColumnPowerTarget,
  isTableauPowerTarget,
  tableauPowerTargetContextForCommit,
} from "@/lib/powerTargetUi";

function baseState(overrides: Partial<GameState> = {}): GameState {
  const d = buildDoubleDeck();
  const card = d.find((c) => c.rank === 4)!;
  return {
    config: {
      columns: 4,
      deals: 6,
      deckPairId: "westernPhilosophy",
      seed: "power-target-ui-test",
      jokerCount: 4,
    },
    columns: [[{ card, faceUp: false }], [], [], []],
    foundation: [[], [], [], [], [], [], [], []],
    stock: [],
    shelf: [],
    cardEffects: {},
    columnEffects: {},
    ...emptyExtraColumnState(),
    undoCount: 0,
    history: [],
    ...overrides,
  };
}

function shelfWithCatalogPower(
  deckPairId: string,
  jokerId: number,
): ShelfJoker[] {
  return [createShelfJokerEntry(deckPairId, { kind: "joker", id: jokerId })];
}

describe("powerTargetUi", () => {
  it("isTableauPowerTarget is false for column-only powers", () => {
    const card = buildDoubleDeck().find((c) => c.rank === 4)!;
    const game = baseState({
      shelf: shelfWithCatalogPower("westernPhilosophy", 7),
    });
    expect(isTableauPowerTarget(game, card, false, 0)).toBe(false);
    expect(isTableauPowerTarget(game, card, true, 0)).toBe(false);
  });

  it("isTableauPowerTarget is true for card transparent on face-down tableau", () => {
    const card = buildDoubleDeck().find((c) => c.rank === 4)!;
    const game = baseState({
      shelf: shelfWithCatalogPower("computerScience", 2),
    });
    expect(isTableauPowerTarget(game, card, false, 0)).toBe(true);
  });

  it("isTableauColumnPowerTarget is true for column transparent", () => {
    const game = baseState({
      shelf: shelfWithCatalogPower("westernPhilosophy", 7),
    });
    expect(isTableauColumnPowerTarget(game, 0, 0)).toBe(true);
  });

  it("isTableauColumnPowerTarget for Sartre Extra Column on deal and extra-child columns", () => {
    const game = baseState({
      shelf: shelfWithCatalogPower("westernPhilosophy", 5),
    });
    expect(createShelfJokerEntry("westernPhilosophy", { kind: "joker", id: 5 }).powerId).toBe(
      JOKER_POWER_EXTRA_COLUMN,
    );
    expect(isTableauColumnPowerTarget(game, 0, 0)).toBe(true);
    const chained = baseState({
      columnFlags: { 1: { isExtraChild: true }, 2: { isExtraChild: true } },
      extraColumnLinks: [
        { parentColumnIndex: 0, movesRemaining: 10 },
        { parentColumnIndex: 1, movesRemaining: 5 },
      ],
      shelf: shelfWithCatalogPower("westernPhilosophy", 5),
    });
    expect(isTableauColumnPowerTarget(chained, 1, 0)).toBe(true);
    expect(isTableauColumnPowerTarget(chained, 2, 0)).toBe(true);
  });

  it("armedPowerIdForShelf uses western philosophy catalog for Wittgenstein joker id", () => {
    const wittgenstein = createShelfJokerEntry("westernPhilosophy", { kind: "joker", id: 7 });
    expect(wittgenstein.powerId).toBe(JOKER_POWER_SELECTED_COLUMN_TRANSPARENT);
    const mismatchedShelf = [{ ...wittgenstein, powerId: JOKER_POWER_SELECTED_CARD_TRANSPARENT }];
    const game = baseState({ shelf: mismatchedShelf });
    expect(isColumnTargetingPower(game, 0)).toBe(true);
    const card = buildDoubleDeck().find((c) => c.rank === 4)!;
    expect(isTableauPowerTarget(game, card, false, 0)).toBe(false);
  });

  it("tableauPowerTargetContextForCommit uses tableauCard for face-up skip2 targets", () => {
    const card = buildDoubleDeck().find((c) => c.rank === 9)!;
    const game = baseState({
      columns: [[{ card, faceUp: true }], [], [], []],
      shelf: shelfWithCatalogPower("westernPhilosophy", 6),
    });
    expect(isTableauPowerTarget(game, card, true, 0)).toBe(true);
    expect(tableauPowerTargetContextForCommit(game, card, true, 0)).toEqual({
      tableauCard: true,
    });
    const after = triggerTargetedPower(
      game,
      0,
      card,
      tableauPowerTargetContextForCommit(game, card, true, 0)!,
    );
    expect(after).not.toBeNull();
    expect(hasCardEffect(after!, card, EFFECT_SKIP2)).toBe(true);
  });

  it("tableauPowerTargetContextForCommit uses tableauFaceDown for transparent on face-down", () => {
    const card = buildDoubleDeck().find((c) => c.rank === 4)!;
    const game = baseState({
      shelf: shelfWithCatalogPower("computerScience", 2),
    });
    expect(tableauPowerTargetContextForCommit(game, card, false, 0)).toEqual({
      tableauFaceDown: true,
    });
  });
});
