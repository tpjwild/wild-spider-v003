import { describe, expect, it } from "vitest";
import { appliedEffect, emptyEffectsState } from "@/engine/effects";
import type { GameState, RegularCard } from "@/engine/types";
import { cardEffectKey } from "@/engine/effects";
import { EFFECT_TRANSPARENT, EFFECT_WILD } from "@/content/effectDefinitions";
import { emptyExtraColumnState } from "@/engine/extraColumnState";
import {
  columnDisplayLabel,
  tableauNamePlateForSource,
  tableauNamePlateFromCard,
  tableauNamePlateFromColumnHolder,
  tableauNamePlateFromFoundationCard,
} from "@/lib/tableauNamePlate";

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
    ...emptyExtraColumnState(),
    ...overrides,
  } as GameState;
}

describe("tableauNamePlate", () => {
  it("heading for face-up court includes person and deck color", () => {
    const card = reg(60, 13, "H");
    const placed = { card, faceUp: true };
    const state = baseState({
      columns: [[placed], ...Array.from({ length: 9 }, () => [])],
    });
    const model = tableauNamePlateFromCard(state, 0, placed)!;
    expect(model.heading).toContain("King of Hearts: King of Hearts (deck 2)");
    expect(model.heading).toContain("Base Deck (Blue)");
    expect(model.isFaceCard).toBe(true);
    expect(model.set).toBe("Base Deck (Blue) - Hearts (Hearts)");
  });

  it("heading for pip card omits person", () => {
    const card = reg(1, 7, "C");
    const placed = { card, faceUp: true };
    const state = baseState({
      columns: [[placed], ...Array.from({ length: 9 }, () => [])],
    });
    const model = tableauNamePlateFromCard(state, 0, placed)!;
    expect(model.heading).toBe("7 of Clubs - Base Deck (Red)");
    expect(model.isFaceCard).toBe(false);
    expect(model.set).toBe("");
  });

  it("face-down without transparent shows deck-only heading", () => {
    const card = reg(1, 7, "C");
    const placed = { card, faceUp: false };
    const state = baseState({
      columns: [[placed], ...Array.from({ length: 9 }, () => [])],
    });
    const model = tableauNamePlateFromCard(state, 0, placed)!;
    expect(model.heading).toBe("Base Deck (Red)");
    expect(model.set).toBe("");
    expect(model.cardEffects).toBe("—");
    expect(model.columnEffects).toBe("—");
  });

  it("reveals heading for face-down transparent cards", () => {
    const card = reg(1, 7, "C");
    const key = cardEffectKey(card);
    const placed = { card, faceUp: false };
    const state = baseState({
      columns: [[placed], ...Array.from({ length: 9 }, () => [])],
      cardEffects: { [key]: [appliedEffect(EFFECT_TRANSPARENT)] },
    });
    const model = tableauNamePlateFromCard(state, 0, placed)!;
    expect(model.heading).toBe("7 of Clubs - Base Deck (Red)");
    expect(model.cardEffects).toBe("Transparent");
  });

  it("always shows effects on face-down cards", () => {
    const card = reg(2, 5, "D");
    const placed = { card, faceUp: false };
    const state = baseState({
      columns: [[placed], ...Array.from({ length: 9 }, () => [])],
      columnEffects: { 0: [appliedEffect(EFFECT_WILD)] },
    });
    const model = tableauNamePlateFromCard(state, 0, placed)!;
    expect(model.heading).toBe("Base Deck (Red)");
    expect(model.columnEffects).toBe("Wild");
  });

  it("foundation top card shows heading and card effects without column effects", () => {
    const card = reg(1, 7, "C");
    const placed = { card, faceUp: true };
    const state = baseState({
      foundation: [[placed], [], [], [], [], [], [], []],
      columnEffects: { 0: [appliedEffect(EFFECT_WILD)] },
    });
    const model = tableauNamePlateFromFoundationCard(state, placed)!;
    expect(model.heading).toBe("7 of Clubs - Base Deck (Red)");
    expect(model.columnEffects).toBe("—");
    expect(model.cardEffects).toBe("—");
  });

  it("foundation source resolves top of pile", () => {
    const low = { card: reg(1, 5, "C"), faceUp: true };
    const top = { card: reg(2, 6, "C"), faceUp: true };
    const state = baseState({
      foundation: [[low, top], [], [], [], [], [], [], []],
    });
    const model = tableauNamePlateForSource(state, { kind: "foundation", foundationIndex: 0 })!;
    expect(model.heading).toBe("6 of Clubs - Base Deck (Red)");
  });

  it("column holder shows column heading and effects only", () => {
    const state = baseState({
      columnEffects: { 2: [appliedEffect(EFFECT_WILD, 7)] },
    });
    const model = tableauNamePlateFromColumnHolder(state, 2);
    expect(model.heading).toBe("Column 03");
    expect(model.columnEffects).toBe("Wild (7)");
    expect(model.cardEffects).toBe("");
    expect(model.isFaceCard).toBe(false);
    expect(model.columnHolderInspect).toBe(true);
  });

  it("columnDisplayLabel uses deal ordinals and chain suffixes", () => {
    const state = baseState({
      columns: [[], [], [], []],
      columnFlags: { 1: { isExtraChild: true }, 2: { isExtraChild: true } },
      extraColumnLinks: [
        { parentColumnIndex: 0, movesRemaining: 10 },
        { parentColumnIndex: 1, movesRemaining: 5 },
      ],
    });
    expect(columnDisplayLabel(state, 0)).toBe("Column 01");
    expect(columnDisplayLabel(state, 1)).toBe("Column 01.01");
    expect(columnDisplayLabel(state, 2)).toBe("Column 01.02");
    expect(columnDisplayLabel(state, 3)).toBe("Column 02");
  });

  it("parent column holder includes Extra Column timer on column effects", () => {
    const state = baseState({
      columns: [[], [], []],
      columnEffects: { 0: [appliedEffect(EFFECT_WILD, 7)] },
      extraColumnLinks: [{ parentColumnIndex: 0, movesRemaining: 10 }],
    });
    const model = tableauNamePlateFromColumnHolder(state, 0);
    expect(model.heading).toBe("Column 01");
    expect(model.columnEffects).toBe("Wild (7), Extra Column (10)");
  });

  it("leaf extra-child column holder omits parent Extra Column line", () => {
    const state = baseState({
      columns: [[], [], []],
      columnFlags: { 1: { isExtraChild: true } },
      columnEffects: { 1: [appliedEffect(EFFECT_WILD, 3)] },
      extraColumnLinks: [{ parentColumnIndex: 0, movesRemaining: 10 }],
    });
    const model = tableauNamePlateFromColumnHolder(state, 1);
    expect(model.heading).toBe("Column 01.01");
    expect(model.columnEffects).toBe("Wild (3)");
  });

  it("chain-parent extra-child shows its own Extra Column timer", () => {
    const state = baseState({
      columns: [[], [], [], []],
      columnFlags: { 1: { isExtraChild: true }, 2: { isExtraChild: true } },
      columnEffects: { 2: [appliedEffect(EFFECT_WILD, 4)] },
      extraColumnLinks: [
        { parentColumnIndex: 0, movesRemaining: 10 },
        { parentColumnIndex: 2, movesRemaining: 6 },
      ],
    });
    const model = tableauNamePlateFromColumnHolder(state, 2);
    expect(model.heading).toBe("Column 01.02");
    expect(model.columnEffects).toBe("Wild (4), Extra Column (6)");
  });

  it("card inspect shows timed card and column effects", () => {
    const card = reg(1, 7, "C");
    const key = cardEffectKey(card);
    const placed = { card, faceUp: true };
    const state = baseState({
      columns: [[placed], ...Array.from({ length: 9 }, () => [])],
      cardEffects: { [key]: [appliedEffect(EFFECT_TRANSPARENT, 2)] },
      columnEffects: { 0: [appliedEffect(EFFECT_WILD, 5)] },
    });
    const model = tableauNamePlateFromCard(state, 0, placed)!;
    expect(model.cardEffects).toBe("Transparent (2)");
    expect(model.columnEffects).toBe("Wild (5)");
  });

  it("card on extra-child column inherits column effects without parent link", () => {
    const card = reg(1, 7, "C");
    const placed = { card, faceUp: true };
    const state = baseState({
      columns: [[], [placed], ...Array.from({ length: 8 }, () => [])],
      columnFlags: { 1: { isExtraChild: true } },
      columnEffects: { 1: [appliedEffect(EFFECT_WILD, 4)] },
      extraColumnLinks: [{ parentColumnIndex: 0, movesRemaining: 10 }],
    });
    const model = tableauNamePlateFromCard(state, 1, placed)!;
    expect(model.columnEffects).toBe("Wild (4)");
    expect(model.columnEffects).not.toContain("Extra Column");
  });
});
