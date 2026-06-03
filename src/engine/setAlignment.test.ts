import { describe, expect, it } from "vitest";
import { buildDoubleDeck } from "@/engine/cards";
import { emptyExtraColumnState } from "@/engine/extraColumnState";
import { emptyEffectsState } from "@/engine/effects";
import {
  alignedSetKeyFromFoundationPile,
  alignedSetKeyFromTableauTriple,
  findAlignedSets,
  findNewlyAlignedSets,
} from "@/engine/setAlignment";
import type { GameConfig, GameState, PlacedCard, Rank, RegularCard, Suit } from "@/engine/types";
import { deckNumFromRegularCardId } from "@/lib/deckCardArt";
import { setKeyFromSuitDeck } from "@/lib/setPowerUi";

const deck = buildDoubleDeck();

function court(suit: Suit, rank: Extract<Rank, 11 | 12 | 13>, deckNum: 1 | 2): RegularCard {
  const card = deck.find(
    (c) => c.suit === suit && c.rank === rank && deckNumFromRegularCardId(c.id) === deckNum,
  );
  if (!card) throw new Error(`missing ${deckNum} ${suit} rank ${rank}`);
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
    seed: "set-alignment-test",
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

describe("alignedSetKeyFromTableauTriple", () => {
  it("accepts Jack on Queen on King with matching suit and deck", () => {
    const king = court("H", 13, 1);
    const queen = court("H", 12, 1);
    const jack = court("H", 11, 1);
    const column = [placed(king), placed(queen), placed(jack)];
    expect(alignedSetKeyFromTableauTriple(column, 0)).toBe(setKeyFromSuitDeck(1, "H"));
  });

  it("allows face-down cards in the triple", () => {
    const king = court("S", 13, 2);
    const queen = court("S", 12, 2);
    const jack = court("S", 11, 2);
    const column = [placed(king, false), placed(queen, false), placed(jack, true)];
    expect(alignedSetKeyFromTableauTriple(column, 0)).toBe(setKeyFromSuitDeck(2, "S"));
  });

  it("rejects wrong vertical order (Queen on King on Jack)", () => {
    const queen = court("D", 12, 1);
    const king = court("D", 13, 1);
    const jack = court("D", 11, 1);
    const column = [placed(queen), placed(king), placed(jack)];
    expect(alignedSetKeyFromTableauTriple(column, 0)).toBeNull();
  });

  it("rejects mixed suits", () => {
    const king = court("C", 13, 1);
    const queen = court("H", 12, 1);
    const jack = court("C", 11, 1);
    const column = [placed(king), placed(queen), placed(jack)];
    expect(alignedSetKeyFromTableauTriple(column, 0)).toBeNull();
  });

  it("rejects mixed decks", () => {
    const king = court("C", 13, 1);
    const queen = court("C", 12, 2);
    const jack = court("C", 11, 1);
    const column = [placed(king), placed(queen), placed(jack)];
    expect(alignedSetKeyFromTableauTriple(column, 0)).toBeNull();
  });

  it("rejects non-adjacent courts with a pip between queen and jack", () => {
    const king = court("H", 13, 1);
    const queen = court("H", 12, 1);
    const pip = deck.find((c) => c.suit === "H" && c.rank === 5 && deckNumFromRegularCardId(c.id) === 1)!;
    const jack = court("H", 11, 1);
    const column = [placed(king), placed(queen), placed(pip), placed(jack)];
    expect(alignedSetKeyFromTableauTriple(column, 0)).toBeNull();
    expect(alignedSetKeyFromTableauTriple(column, 1)).toBeNull();
  });

  it("finds triple buried below extra cards", () => {
    const pip = deck.find((c) => c.suit === "S" && c.rank === 4 && deckNumFromRegularCardId(c.id) === 1)!;
    const king = court("S", 13, 1);
    const queen = court("S", 12, 1);
    const jack = court("S", 11, 1);
    const column = [placed(pip), placed(king), placed(queen), placed(jack)];
    expect(alignedSetKeyFromTableauTriple(column, 1)).toBe(setKeyFromSuitDeck(1, "S"));
  });
});

describe("alignedSetKeyFromFoundationPile", () => {
  it("accepts King on Queen on Jack on the pile top", () => {
    const jack = court("D", 11, 1);
    const queen = court("D", 12, 1);
    const king = court("D", 13, 1);
    const pile = [placed(jack), placed(queen), placed(king)];
    expect(alignedSetKeyFromFoundationPile(pile)).toBe(setKeyFromSuitDeck(1, "D"));
  });

  it("uses only the top three cards when the pile is taller", () => {
    const ace = deck.find((c) => c.suit === "D" && c.rank === 1 && deckNumFromRegularCardId(c.id) === 1)!;
    const jack = court("D", 11, 1);
    const queen = court("D", 12, 1);
    const king = court("D", 13, 1);
    const pile = [placed(ace), placed(jack), placed(queen), placed(king)];
    expect(alignedSetKeyFromFoundationPile(pile)).toBe(setKeyFromSuitDeck(1, "D"));
  });

  it("rejects wrong order on foundation (Jack on top)", () => {
    const king = court("C", 13, 2);
    const queen = court("C", 12, 2);
    const jack = court("C", 11, 2);
    const pile = [placed(king), placed(queen), placed(jack)];
    expect(alignedSetKeyFromFoundationPile(pile)).toBeNull();
  });
});

describe("findAlignedSets", () => {
  it("collects aligned sets from tableau and foundation", () => {
    const hKing = court("H", 13, 1);
    const hQueen = court("H", 12, 1);
    const hJack = court("H", 11, 1);
    const sJack = court("S", 11, 2);
    const sQueen = court("S", 12, 2);
    const sKing = court("S", 13, 2);
    const state = baseState({
      columns: [[placed(hKing), placed(hQueen), placed(hJack)], [], [], []],
      foundation: [
        [placed(sJack), placed(sQueen), placed(sKing)],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
      ],
    });
    expect(findAlignedSets(state).sort()).toEqual(["1-H", "2-S"]);
  });

  it("returns each set key at most once", () => {
    const king = court("H", 13, 1);
    const queen = court("H", 12, 1);
    const jack = court("H", 11, 1);
    const state = baseState({
      columns: [[placed(king), placed(queen), placed(jack)], [], [], []],
    });
    expect(findAlignedSets(state)).toEqual(["1-H"]);
  });
});

describe("findNewlyAlignedSets", () => {
  it("omits sets already recorded in alignedSetKeys", () => {
    const king = court("H", 13, 1);
    const queen = court("H", 12, 1);
    const jack = court("H", 11, 1);
    const state = baseState({
      columns: [[placed(king), placed(queen), placed(jack)], [], [], []],
      alignedSetKeys: ["1-H"],
    });
    expect(findNewlyAlignedSets(state, state.alignedSetKeys)).toEqual([]);
  });

  it("returns only newly aligned keys", () => {
    const hKing = court("H", 13, 1);
    const hQueen = court("H", 12, 1);
    const hJack = court("H", 11, 1);
    const cKing = court("C", 13, 1);
    const cQueen = court("C", 12, 1);
    const cJack = court("C", 11, 1);
    const state = baseState({
      columns: [
        [placed(hKing), placed(hQueen), placed(hJack)],
        [placed(cKing), placed(cQueen), placed(cJack)],
        [],
        [],
      ],
      alignedSetKeys: ["1-H"],
    });
    expect(findNewlyAlignedSets(state, state.alignedSetKeys)).toEqual(["1-C"]);
  });
});
