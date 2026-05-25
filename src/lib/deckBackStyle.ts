import { colors } from "@/constants/colors";
import { getDeckPairById, DEFAULT_DECK_PAIR_ID } from "@/content/deckPairs";
import type { DeckBackColor, DeckInPair } from "@/content/deckPairs/types";
import { defaultDeckBackColorForDeckNum, sharedDeckCardBackPathForColor } from "@/constants/sharedDeckAssets";
import { cardDeckIndexForBack, isRegular } from "@/engine/cards";
import type { Card } from "@/engine/types";

function deckNumFromRegularCardId(cardId: number): 1 | 2 {
  return cardId < 52 ? 1 : 2;
}

export function deckBackColorLabel(color: DeckBackColor): string {
  return color === "red" ? "Red" : "Blue";
}

export function cardBackGradientForColor(color: DeckBackColor): string {
  return color === "red" ? colors.cardBackRed : colors.cardBackBlue;
}

export function deckInPairForRegularCard(
  deckPairId: string,
  card: Card,
): DeckInPair | undefined {
  if (!isRegular(card)) return undefined;
  const pair = getDeckPairById(deckPairId) ?? getDeckPairById(DEFAULT_DECK_PAIR_ID);
  if (!pair) return undefined;
  return pair.decks[deckNumFromRegularCardId(card.id) - 1];
}

export function cardBackStyleForCard(
  deckPairId: string,
  card: Card,
): { path: string; gradient: string } {
  const deck = deckInPairForRegularCard(deckPairId, card);
  if (deck) {
    return {
      path: deck.cardBackPath,
      gradient: cardBackGradientForColor(deck.color),
    };
  }
  const idx = cardDeckIndexForBack(card);
  const color = defaultDeckBackColorForDeckNum(idx === 0 ? 1 : 2);
  return {
    path: sharedDeckCardBackPathForColor(color),
    gradient: cardBackGradientForColor(color),
  };
}
