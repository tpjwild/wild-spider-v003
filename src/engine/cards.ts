import type { Card, JokerCard, Rank, RegularCard, Suit } from "./types";

const SUITS: Suit[] = ["C", "D", "H", "S"];

/** Build the 104 regular cards (two standard decks). id 0..103 */
export function buildDoubleDeck(): RegularCard[] {
  const out: RegularCard[] = [];
  let id = 0;
  for (let copy = 0; copy < 2; copy++) {
    for (const suit of SUITS) {
      for (let r = 1; r <= 13; r++) {
        out.push({
          kind: "regular",
          id: id++,
          suit,
          rank: r as Rank,
        });
      }
    }
  }
  return out;
}

export function buildJokers(count: number): JokerCard[] {
  const out: JokerCard[] = [];
  for (let i = 0; i < count; i++) {
    out.push({ kind: "joker", id: i });
  }
  return out;
}

export function isRegular(c: Card): c is RegularCard {
  return c.kind === "regular";
}

export function isJoker(c: Card): c is JokerCard {
  return c.kind === "joker";
}

/** Which physical deck (0 or 1) this card belongs to — used for face-down back colour. */
export function cardDeckIndexForBack(card: Card): 0 | 1 {
  if (card.kind === "regular") {
    return card.id < 52 ? 0 : 1;
  }
  /** Jokers have no deck id in v1; alternate by joker id so multiple jokers are not identical. */
  return (card.id & 1) === 0 ? 0 : 1;
}

export function rankChar(rank: Rank): string {
  if (rank === 1) return "A";
  if (rank >= 2 && rank <= 10) return String(rank);
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  return "K";
}
