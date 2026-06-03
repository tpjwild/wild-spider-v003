import { buildDoubleDeck } from "@/engine/cards";
import { emptyEffectsState } from "@/engine/effects";
import { emptyExtraColumnState } from "@/engine/extraColumnState";
import { stripEphemeralGameState } from "@/engine/initialDeal";
import { createShelfSetPowerEntry } from "@/engine/setPowers";
import type { GameState, PlacedCard, Rank, RegularCard, Suit } from "@/engine/types";
import { deckNumFromRegularCardId } from "@/lib/deckCardArt";

const STORAGE_KEY = "wild-spider-game-v1";

const E2E_CONFIG = {
  columns: 4,
  deals: 5,
  deckPairId: "westernPhilosophy",
  seed: "e2e-set-powers-fixture",
  jokerCount: 0,
} as const;

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

function baseShell(overrides: Partial<GameState> = {}): GameState {
  return {
    config: { ...E2E_CONFIG },
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

/** Set power on shelf + face-down tableau target for transparent power E2E. */
export function buildSetPowerTriggerFixture(): GameState {
  const targetCard = deck.find(
    (c) => c.rank === 4 && c.suit === "S" && deckNumFromRegularCardId(c.id) === 1,
  )!;
  const shell = baseShell({
    columns: [[{ card: targetCard, faceUp: false }], [], [], []],
    alignedSetKeys: ["1-S"],
  });
  return stripEphemeralGameState({
    ...shell,
    shelf: [createShelfSetPowerEntry(shell, "1-S")],
  });
}

/**
 * Spades deck-1 courts one move from alignment: King+Queen col 0, Jack col 1.
 * Moving Jack onto Queen aligns the set and should add a shelf set power.
 */
export function buildSetAlignByMoveFixture(): GameState {
  const king = court("S", 13, 1);
  const queen = court("S", 12, 1);
  const jack = court("S", 11, 1);
  return stripEphemeralGameState(
    baseShell({
      columns: [
        [placed(king), placed(queen)],
        [placed(jack)],
        [],
        [],
      ],
    }),
  );
}

export function tableauCardKey(card: RegularCard): string {
  return `regular:${card.id}`;
}

export function setPowersE2ETargetCard(): RegularCard {
  return deck.find(
    (c) => c.rank === 4 && c.suit === "S" && deckNumFromRegularCardId(c.id) === 1,
  )!;
}

export function setPowersE2EJackCard(): RegularCard {
  return court("S", 11, 1);
}

export function serializedSetPowersFixture(state: GameState): string {
  return JSON.stringify(state);
}

export function storageKey(): string {
  return STORAGE_KEY;
}
