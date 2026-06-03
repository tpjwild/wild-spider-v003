import { describe, expect, it } from "vitest";
import { POWER_SELECTED_CARD_TRANSPARENT } from "@/content/powerDefinitions";
import { EFFECT_TRANSPARENT } from "@/content/effectDefinitions";
import { buildDoubleDeck } from "@/engine/cards";
import { hasCardEffect } from "@/engine/effects";
import { emptyExtraColumnState } from "@/engine/extraColumnState";
import { emptyEffectsState } from "@/engine/effects";
import { moveTableau, triggerTargetedPower, undo } from "@/engine/game";
import { createShelfJokerEntry } from "@/engine/powers";
import {
  applyNewSetAlignments,
  createShelfSetPowerEntry,
  syncShelfSetPowerFromCatalog,
} from "@/engine/setPowers";
import { isShelfJoker, isShelfSetPower } from "@/lib/setPowerUi";
import type { GameConfig, GameState, PlacedCard, Rank, RegularCard, Suit } from "@/engine/types";
import { deckNumFromRegularCardId } from "@/lib/deckCardArt";

const deck = buildDoubleDeck();

function court(suit: Suit, rank: Extract<Rank, 11 | 12 | 13>, deckNum: 1 | 2): RegularCard {
  const card = deck.find(
    (c) => c.suit === suit && c.rank === rank && deckNumFromRegularCardId(c.id) === deckNum,
  );
  if (!card) throw new Error(`missing court ${deckNum} ${suit} ${rank}`);
  return card;
}

function placed(card: RegularCard, faceUp = true): PlacedCard {
  return { card, faceUp };
}

function baseState(overrides: Partial<GameState> = {}): GameState {
  const config: GameConfig = {
    columns: 4,
    deals: 5,
    deckPairId: "mathematics",
    seed: "set-powers-test",
    jokerCount: 0,
  };
  return {
    config,
    columns: [[], [], [], []],
    foundation: [[], [], [], [], [], [], [], []],
    stock: [],
    shelf: [],
    alignedSetKeys: [],
    ...emptyEffectsState(),
    ...emptyExtraColumnState(),
    undoCount: 0,
    history: [],
    ...overrides,
  };
}

describe("createShelfSetPowerEntry", () => {
  it("builds a set shelf entry after the joker block", () => {
    const game = baseState({
      shelf: [createShelfJokerEntry("mathematics", { kind: "joker", id: 0 })],
    });
    const entry = createShelfSetPowerEntry(game, "1-H");
    expect(entry).toMatchObject({
      kind: "set",
      setKey: "1-H",
      deckNum: 1,
      suit: "H",
      powerId: POWER_SELECTED_CARD_TRANSPARENT,
      chargesRemaining: 10,
    });
  });

  it("syncShelfSetPowerFromCatalog upgrades legacy persisted power ids", () => {
    const legacy = syncShelfSetPowerFromCatalog("mathematics", {
      kind: "set",
      setKey: "1-H",
      deckNum: 1,
      suit: "H",
      powerId: "jokerSelectedCardTransparent",
      chargesRemaining: 2,
    });
    expect(legacy.powerId).toBe(POWER_SELECTED_CARD_TRANSPARENT);
  });
});

describe("applyNewSetAlignments", () => {
  it("adds one set instance the first time a set aligns", () => {
    const king = court("H", 13, 1);
    const queen = court("H", 12, 1);
    const jack = court("H", 11, 1);
    const state = baseState({
      columns: [[placed(king), placed(queen), placed(jack)], [], [], []],
    });
    const { state: next, setPowersAdded } = applyNewSetAlignments(state);
    expect(setPowersAdded).toEqual(["1-H"]);
    expect(next.alignedSetKeys).toEqual(["1-H"]);
    expect(next.shelf).toHaveLength(1);
    expect(isShelfSetPower(next.shelf[0]!)).toBe(true);
    expect(next.shelf[0]).toMatchObject({ setKey: "1-H", chargesRemaining: 10 });
  });

  it("does not duplicate when the set is already recorded", () => {
    const king = court("H", 13, 1);
    const queen = court("H", 12, 1);
    const jack = court("H", 11, 1);
    const state = baseState({
      columns: [[placed(king), placed(queen), placed(jack)], [], [], []],
      alignedSetKeys: ["1-H"],
      shelf: [createShelfSetPowerEntry(baseState(), "1-H")],
    });
    const { state: next, setPowersAdded } = applyNewSetAlignments(state);
    expect(setPowersAdded).toEqual([]);
    expect(next.shelf).toHaveLength(1);
    expect(next.alignedSetKeys).toEqual(["1-H"]);
  });

  it("appends multiple new sets after existing jokers", () => {
    const hKing = court("H", 13, 1);
    const hQueen = court("H", 12, 1);
    const hJack = court("H", 11, 1);
    const cKing = court("C", 13, 1);
    const cQueen = court("C", 12, 1);
    const cJack = court("C", 11, 1);
    const joker = createShelfJokerEntry("mathematics", { kind: "joker", id: 1 });
    const state = baseState({
      shelf: [joker],
      columns: [
        [placed(hKing), placed(hQueen), placed(hJack)],
        [placed(cKing), placed(cQueen), placed(cJack)],
        [],
        [],
      ],
    });
    const { state: next, setPowersAdded } = applyNewSetAlignments(state);
    expect(setPowersAdded.sort()).toEqual(["1-C", "1-H"]);
    expect(isShelfJoker(next.shelf[0]!)).toBe(true);
    expect(next.shelf.slice(1).every((e) => isShelfSetPower(e))).toBe(true);
    expect(next.shelf).toHaveLength(3);
  });
});

describe("moveTableau set powers + undo", () => {
  it("creates a set power when a move completes tableau alignment", () => {
    const king = court("D", 13, 2);
    const queen = court("D", 12, 2);
    const jack = court("D", 11, 2);
    const pip = deck.find((c) => c.suit === "D" && c.rank === 9 && deckNumFromRegularCardId(c.id) === 2)!;
    let state = baseState({
      columns: [
        [placed(king), placed(queen)],
        [placed(jack)],
        [placed(pip)],
        [],
      ],
    });
    state = moveTableau(state, { fromColumn: 1, startIndex: 0, toColumn: 0 })!;
    expect(state.alignedSetKeys).toEqual(["2-D"]);
    expect(state.shelf).toHaveLength(1);
    expect(isShelfSetPower(state.shelf[0]!)).toBe(true);
    const last = state.history[state.history.length - 1]!;
    expect(last.type).toBe("move_tableau");
    if (last.type === "move_tableau") {
      expect(last.setPowersAdded).toEqual(["2-D"]);
    }
  });

  it("undo removes set shelf entries and alignedSetKeys", () => {
    const king = court("S", 13, 1);
    const queen = court("S", 12, 1);
    const jack = court("S", 11, 1);
    const pip = deck.find((c) => c.suit === "S" && c.rank === 4 && deckNumFromRegularCardId(c.id) === 1)!;
    let state = baseState({
      columns: [
        [placed(king), placed(queen)],
        [placed(jack)],
        [placed(pip)],
        [],
      ],
    });
    state = moveTableau(state, { fromColumn: 1, startIndex: 0, toColumn: 0 })!;
    expect(state.shelf).toHaveLength(1);
    state = undo(state)!;
    expect(state.shelf).toHaveLength(0);
    expect(state.alignedSetKeys).toEqual([]);
    const last = state.history[state.history.length - 1];
    expect(last).toBeUndefined();
  });
});

describe("triggerTargetedPower from set shelf index", () => {
  it("applies transparent, records power_trigger, and undo restores charge and effect", () => {
    const card = deck.find((c) => c.rank === 4)!;
    const joker = createShelfJokerEntry("mathematics", { kind: "joker", id: 0 });
    const setEntry = createShelfSetPowerEntry(baseState(), "1-C");
    const setShelfIndex = 1;
    let state = baseState({
      columns: [[{ card, faceUp: false }], [], [], []],
      shelf: [joker, setEntry],
    });
    state = triggerTargetedPower(state, setShelfIndex, card, { tableauFaceDown: true })!;
    expect(state).not.toBeNull();
    expect(hasCardEffect(state, card, EFFECT_TRANSPARENT)).toBe(true);
    expect(isShelfSetPower(state.shelf[setShelfIndex]!)).toBe(true);
    expect(state.shelf[setShelfIndex]!.chargesRemaining).toBe(9);
    const last = state.history[state.history.length - 1]!;
    expect(last.type).toBe("power_trigger");
    if (last.type === "power_trigger") {
      expect(last.shelfIndex).toBe(setShelfIndex);
      expect(last.chargesBefore).toBe(10);
    }
    state = undo(state)!;
    expect(state.shelf[setShelfIndex]!.chargesRemaining).toBe(10);
    expect(hasCardEffect(state, card, EFFECT_TRANSPARENT)).toBe(false);
    expect(state.history).toHaveLength(0);
  });
});
