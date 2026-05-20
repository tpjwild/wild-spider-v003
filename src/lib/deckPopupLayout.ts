import { maxJokersInPlayForDeckPair } from "@/content/deckPairs";
import { buildDoubleDeck, buildJokers } from "@/engine/cards";
import type { Card, GameState, JokerCard, RegularCard, Suit } from "@/engine/types";

/** Deck Popup suit row order: Spades, Clubs, Diamonds, Hearts (per product spec). */
export const DECK_POPUP_SUITS_ORDER: readonly Suit[] = ["S", "C", "D", "H"];

export function cardKey(card: Card): string {
  return `${card.kind}:${card.id}`;
}

export function stockCardKeySet(stock: readonly Card[]): Set<string> {
  return new Set(stock.map(cardKey));
}

/** True when the card is still in the stock pile (not yet dealt to tableau / foundation / shelf). */
export function isCardInStock(card: Card, stockKeys: Set<string>): boolean {
  return stockKeys.has(cardKey(card));
}

export function jokersForPopup(jokerCount: number): readonly JokerCard[] {
  return buildJokers(jokerCount);
}

export type DeckPopupSuitRow = {
  deckIndex: 0 | 1;
  suit: Suit;
  cards: readonly RegularCard[];
};

/**
 * Eight suit rows: deck 0 × four suits, then deck 1 × four suits; each row Ace → King.
 */
export function deckPopupSuitRows(): DeckPopupSuitRow[] {
  const all = buildDoubleDeck();
  const rows: DeckPopupSuitRow[] = [];
  for (const deckIndex of [0, 1] as const) {
    for (const suit of DECK_POPUP_SUITS_ORDER) {
      const cards = all
        .filter((c) => (c.id < 52 ? 0 : 1) === deckIndex && c.suit === suit)
        .sort((a, b) => a.rank - b.rank);
      rows.push({ deckIndex, suit, cards });
    }
  }
  return rows;
}

/** Snapshot used by the Deck Popup: stock keys + joker list + suit rows (stable for a given game config). */
export function deckPopupSnapshot(game: GameState): {
  stockKeys: Set<string>;
  jokers: readonly JokerCard[];
  suitRows: readonly DeckPopupSuitRow[];
} {
  return {
    stockKeys: stockCardKeySet(game.stock),
    jokers: jokersForPopup(game.config.jokerCount),
    suitRows: deckPopupSuitRows(),
  };
}

/** Full pair layout for the catalog Deck popup (Decks view): all cards face-up; joker count from the deck pair registry. */
export function catalogDeckPopupSnapshot(deckPairId: string): {
  jokers: readonly JokerCard[];
  suitRows: readonly DeckPopupSuitRow[];
} {
  const jokerCount = maxJokersInPlayForDeckPair(deckPairId);
  return {
    jokers: jokersForPopup(jokerCount),
    suitRows: deckPopupSuitRows(),
  };
}

/** Deck Popup “face + back” treatment: card is still in the stock, or is face-down on the tableau. */
export function shouldDeckPopupFaceDown(game: GameState, card: Card): boolean {
  const inStock = stockCardKeySet(game.stock);
  if (isCardInStock(card, inStock)) return true;
  for (const col of game.columns) {
    for (const p of col) {
      if (p.card.kind === card.kind && p.card.id === card.id && !p.faceUp) return true;
    }
  }
  return false;
}
