import { DEFAULT_DECK_PAIR_ID, getDeckPairById } from "@/content/deckPairs";
import {
  sharedDeckCardBackPath,
  sharedDeckLightCardFacePath,
} from "@/constants/sharedDeckAssets";
import { cardDeckIndexForBack } from "@/engine/cards";
import type { Card, RegularCard } from "@/engine/types";

/** Which of the two 52-card decks this regular card belongs to (for backs and face art paths). */
export function deckNumFromRegularCardId(cardId: number): 1 | 2 {
  return cardId < 52 ? 1 : 2;
}

export function faceArtForRegularCard(
  deckPairId: string,
  card: RegularCard,
): { portraitPath: string; framePath?: string } | null {
  if (card.rank <= 10) {
    return {
      portraitPath: sharedDeckLightCardFacePath(
        card.rank as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,
        card.suit,
      ),
    };
  }
  const pair = getDeckPairById(deckPairId) ?? getDeckPairById(DEFAULT_DECK_PAIR_ID);
  if (!pair) return null;
  const deckNum = deckNumFromRegularCardId(card.id);
  const deck = pair.decks[deckNum - 1];
  const row = deck.faces.find((f) => f.suit === card.suit && f.rank === card.rank);
  if (!row) return null;
  return { portraitPath: row.portraitPath, framePath: row.framePath };
}

/** Map in-game joker id to one of four shared joker portrait slots (legacy tests). */
export function sharedJokerSlotFromId(jokerId: number): 1 | 2 | 3 | 4 {
  const n = ((jokerId % 4) + 4) % 4;
  return (n + 1) as 1 | 2 | 3 | 4;
}

export function jokerArtForCard(deckPairId: string, jokerId: number): {
  portraitPath: string;
  framePath: string;
} {
  const pair = getDeckPairById(deckPairId) ?? getDeckPairById(DEFAULT_DECK_PAIR_ID);
  const list = pair ? [...pair.decks[0].jokers, ...pair.decks[1].jokers] : [];
  if (list.length === 0) {
    return { portraitPath: "", framePath: "" };
  }
  const j = list[jokerId % list.length]!;
  return { portraitPath: j.portraitPath, framePath: j.framePath };
}

export function faceDownBackPathForCard(card: Card): string {
  const idx = cardDeckIndexForBack(card);
  return sharedDeckCardBackPath(idx === 0 ? 1 : 2);
}
