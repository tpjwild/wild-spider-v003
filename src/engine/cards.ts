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

export function rankChar(rank: Rank): string {
  if (rank === 1) return "A";
  if (rank >= 2 && rank <= 10) return String(rank);
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  return "K";
}
