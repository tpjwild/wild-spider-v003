import { DEFAULT_DECK_PAIR_ID, getDeckPairById } from "@/content/deckPairs";
import { cardHasTransparentEffect, tableauCardDisplayMode } from "@/lib/cardEffectsUi";
import { deckNumFromRegularCardId, faceArtForRegularCard, jokerArtForCard } from "@/lib/deckCardArt";
import { isJoker, isRegular } from "@/engine/cards";
import type { Card, GameState, PlacedCard, Suit } from "@/engine/types";

const SUIT_PLURAL_NAME: Record<Suit, string> = {
  S: "Spades",
  C: "Clubs",
  D: "Diamonds",
  H: "Hearts",
};

function lowercaseFirstLetter(s: string): string {
  if (s.length === 0) return s;
  return s.charAt(0).toLocaleLowerCase() + s.slice(1);
}

function aceDetailsHeading(suit: Suit, themeNameLowerFirst: string): string {
  return `${SUIT_PLURAL_NAME[suit]} the suit of ${themeNameLowerFirst}`;
}

export function isDeckPopupDetailsClickableCard(card: Card): boolean {
  if (isJoker(card)) return true;
  if (!isRegular(card)) return false;
  return card.rank === 1 || (card.rank >= 11 && card.rank <= 13);
}

/** Face-up courts/aces on the tableau, or the same ranks shown via transparent face+back while face-down. */
export function isInGameCardDetailsClickable(state: GameState, placed: PlacedCard): boolean {
  if (!isDeckPopupDetailsClickableCard(placed.card)) return false;
  if (placed.faceUp) return true;
  return (
    cardHasTransparentEffect(state, placed.card) &&
    tableauCardDisplayMode(state, placed) === "deckPopupFaceDown"
  );
}

export type DeckCardDetailsModel = {
  /** Medium portrait for the details dialog. */
  portraitSrc: string;
  /** In-game thumb; shown immediately while {@link portraitSrc} loads (courts/jokers). */
  portraitThumbSrc?: string;
  frameSrc?: string;
  isPipAce: boolean;
  primaryHeading: string;
  body: string;
};

function deckPairOrDefault(deckPairId: string) {
  return getDeckPairById(deckPairId) ?? getDeckPairById(DEFAULT_DECK_PAIR_ID);
}

export function getDeckCardDetailsModel(
  deckPairId: string,
  card: Card,
): DeckCardDetailsModel | null {
  const pair = deckPairOrDefault(deckPairId);
  if (!pair) return null;

  if (isJoker(card)) {
    const j0 = pair.decks[0].jokers;
    const j1 = pair.decks[1].jokers;
    const list = [...j0, ...j1];
    if (list.length === 0) return null;
    const j = list[card.id % list.length];
    if (!j) return null;
    const art = jokerArtForCard(deckPairId, card.id);
    return {
      portraitSrc: art.portraitPath,
      portraitThumbSrc: art.portraitThumbPath,
      frameSrc: art.framePath,
      isPipAce: false,
      primaryHeading: j.name,
      body: j.bio,
    };
  }

  if (!isRegular(card)) return null;

  const deckNum = deckNumFromRegularCardId(card.id);

  if (card.rank === 1) {
    const theme = pair.suitThemes.find((t) => t.suit === card.suit);
    const art = faceArtForRegularCard(deckPairId, card);
    if (!art) return null;
    const themeName = theme?.name ?? SUIT_PLURAL_NAME[card.suit];
    const themeNameTail = lowercaseFirstLetter(themeName);
    return {
      portraitSrc: art.portraitPath,
      isPipAce: true,
      primaryHeading: aceDetailsHeading(card.suit, themeNameTail),
      body: theme?.description ?? "",
    };
  }

  if (card.rank >= 11 && card.rank <= 13) {
    const row = pair.decks[deckNum - 1]?.faces.find(
      (f) => f.suit === card.suit && f.rank === card.rank,
    );
    if (!row) return null;
    return {
      portraitSrc: row.portraitPath,
      portraitThumbSrc: row.portraitThumbPath,
      frameSrc: row.framePath,
      isPipAce: false,
      primaryHeading: row.name,
      body: row.bio,
    };
  }

  return null;
}
