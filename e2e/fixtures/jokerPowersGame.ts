import { buildDoubleDeck } from "@/engine/cards";
import { emptyEffectsState } from "@/engine/effects";
import { emptyExtraColumnState } from "@/engine/extraColumnState";
import { stripEphemeralGameState } from "@/engine/initialDeal";
import { createShelfJokerEntry } from "@/engine/powers";
import type { GameState, JokerCard, PlacedCard, Rank, RegularCard, Suit } from "@/engine/types";
import { deckNumFromRegularCardId } from "@/lib/deckCardArt";

const STORAGE_KEY = "wild-spider-game-v1";

const E2E_CONFIG = {
  columns: 4,
  deals: 5,
  deckPairId: "computerScience",
  seed: "e2e-joker-powers-fixture",
  jokerCount: 0,
} as const;

const deck = buildDoubleDeck();

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

function king(deckNum: 1 | 2 = 1, suit: Suit = "S"): RegularCard {
  const card = deck.find(
    (c) => c.rank === 13 && c.suit === suit && deckNumFromRegularCardId(c.id) === deckNum,
  );
  if (!card) throw new Error(`missing king deck=${deckNum} suit=${suit}`);
  return card;
}

function regular(rank: Rank, suit: Suit, deckNum: 1 | 2 = 1): RegularCard {
  const card = deck.find(
    (c) => c.rank === rank && c.suit === suit && deckNumFromRegularCardId(c.id) === deckNum,
  );
  if (!card) throw new Error(`missing regular rank=${rank} suit=${suit} deck=${deckNum}`);
  return card;
}

const IMMEDIATE_JOKER: JokerCard = { kind: "joker", id: 0 };
const TARGETED_JOKER: JokerCard = { kind: "joker", id: 2 };

/** Red-slot joker (all Kings transparent) on shelf + face-up King on tableau. */
export function buildImmediateJokerFixture(): GameState {
  const kingCard = king();
  return stripEphemeralGameState(
    baseShell({
      columns: [[placed(kingCard)], [], [], []],
      shelf: [createShelfJokerEntry(E2E_CONFIG.deckPairId, IMMEDIATE_JOKER)],
    }),
  );
}

/** Black-slot joker (single-card transparent) on shelf + face-down tableau target. */
export function buildTargetedJokerFixture(): GameState {
  const targetCard = regular(4, "S");
  return stripEphemeralGameState(
    baseShell({
      columns: [[placed(targetCard, false)], [], [], []],
      shelf: [createShelfJokerEntry(E2E_CONFIG.deckPairId, TARGETED_JOKER)],
    }),
  );
}

export function jokerPowersE2EKingCard(): RegularCard {
  return king();
}

export function jokerPowersE2ETargetCard(): RegularCard {
  return regular(4, "S");
}

export function tableauCardKey(card: RegularCard): string {
  return `regular:${card.id}`;
}

export function serializedJokerPowersFixture(state: GameState): string {
  return JSON.stringify(state);
}

export function storageKey(): string {
  return STORAGE_KEY;
}
