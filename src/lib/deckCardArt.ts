import { DEFAULT_DECK_PAIR_ID, getDeckPairById } from "@/content/deckPairs";
import { sharedDeckLightCardFacePath } from "@/constants/sharedDeckAssets";
import type { Card, RegularCard } from "@/engine/types";
import { cardBackStyleForCard } from "@/lib/deckBackStyle";

/** Which of the two 52-card decks this regular card belongs to (for backs and face art paths). */
export function deckNumFromRegularCardId(cardId: number): 1 | 2 {
  return cardId < 52 ? 1 : 2;
}

export type FaceArtPaths = {
  portraitPath: string;
  portraitThumbPath: string;
  framePath?: string;
};

export function faceArtForRegularCard(
  deckPairId: string,
  card: RegularCard,
): FaceArtPaths | null {
  if (card.rank <= 10) {
    const portraitPath = sharedDeckLightCardFacePath(
      card.rank as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,
      card.suit,
    );
    return { portraitPath, portraitThumbPath: portraitPath };
  }
  const pair = getDeckPairById(deckPairId) ?? getDeckPairById(DEFAULT_DECK_PAIR_ID);
  if (!pair) return null;
  const deckNum = deckNumFromRegularCardId(card.id);
  const deck = pair.decks[deckNum - 1];
  const row = deck.faces.find((f) => f.suit === card.suit && f.rank === card.rank);
  if (!row) return null;
  return {
    portraitPath: row.portraitPath,
    portraitThumbPath: row.portraitThumbPath,
    framePath: row.framePath,
  };
}

/** Map in-game joker id to one of four shared joker portrait slots (legacy tests). */
export function sharedJokerSlotFromId(jokerId: number): 1 | 2 | 3 | 4 {
  const n = ((jokerId % 4) + 4) % 4;
  return (n + 1) as 1 | 2 | 3 | 4;
}

export function jokerArtForCard(deckPairId: string, jokerId: number): FaceArtPaths & { framePath: string } {
  const pair = getDeckPairById(deckPairId) ?? getDeckPairById(DEFAULT_DECK_PAIR_ID);
  const list = pair ? [...pair.decks[0].jokers, ...pair.decks[1].jokers] : [];
  if (list.length === 0) {
    return { portraitPath: "", portraitThumbPath: "", framePath: "" };
  }
  const j = list[jokerId % list.length]!;
  return {
    portraitPath: j.portraitPath,
    portraitThumbPath: j.portraitThumbPath,
    framePath: j.framePath,
  };
}

export function faceDownBackPathForCard(card: Card, deckPairId?: string): string {
  if (deckPairId) return cardBackStyleForCard(deckPairId, card).path;
  return cardBackStyleForCard(DEFAULT_DECK_PAIR_ID, card).path;
}
