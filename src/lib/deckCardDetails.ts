import { DEFAULT_DECK_PAIR_ID, getDeckPairById, jokerDefinitionForInGameId } from "@/content/deckPairs";
import { getPowerDefinition } from "@/content/powerDefinitions";
import {
  cardHasTransparentEffect,
  cardHasTransparentEffectInColumn,
  tableauCardDisplayMode,
} from "@/lib/cardEffectsUi";
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
export function isInGameCardDetailsClickable(
  state: GameState,
  placed: PlacedCard,
  tableauColumnIndex?: number,
): boolean {
  if (!isDeckPopupDetailsClickableCard(placed.card)) return false;
  if (placed.faceUp) return true;
  if (tableauColumnIndex === undefined) {
    return cardHasTransparentEffect(state, placed.card);
  }
  return (
    cardHasTransparentEffectInColumn(state, tableauColumnIndex, placed.card) &&
    tableauCardDisplayMode(state, tableauColumnIndex, placed) === "deckPopupFaceDown"
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
  /** Joker shelf power title, when the card has an assigned power. */
  powerName?: string;
  /** Joker shelf power rules summary. */
  powerDescription?: string;
  /** Live shelf charges (in-play joker on the shelf). */
  powerChargesRemaining?: number;
  /** Starting charges for this joker (catalog or shelf entry). */
  powerChargesInitial?: number;
};

export type JokerPowerCharges = {
  remaining: number;
  initial: number;
};

/** Charges for a joker currently on the shelf, if any. */
export function shelfPowerChargesForJoker(
  game: GameState,
  card: Card,
): JokerPowerCharges | undefined {
  if (!isJoker(card)) return undefined;
  const entry = game.shelf.find(
    (sj) => sj.card.kind === "joker" && sj.card.id === card.id,
  );
  if (!entry) return undefined;
  const def = jokerDefinitionForInGameId(game.config.deckPairId, card.id);
  const initial = def?.initialCharges ?? entry.chargesRemaining;
  return { remaining: entry.chargesRemaining, initial };
}

/** Catalog starting charges when the joker is not on the shelf (e.g. Deck Popup preview). */
export function catalogPowerChargesForJoker(
  deckPairId: string,
  card: Card,
): Pick<JokerPowerCharges, "initial"> | undefined {
  if (!isJoker(card)) return undefined;
  const def = jokerDefinitionForInGameId(deckPairId, card.id);
  if (!def) return undefined;
  return { initial: def.initialCharges };
}

function deckPairOrDefault(deckPairId: string) {
  return getDeckPairById(deckPairId) ?? getDeckPairById(DEFAULT_DECK_PAIR_ID);
}

export function getDeckCardDetailsModel(
  deckPairId: string,
  card: Card,
  powerCharges?: JokerPowerCharges,
): DeckCardDetailsModel | null {
  const pair = deckPairOrDefault(deckPairId);
  if (!pair) return null;

  if (isJoker(card)) {
    const j = jokerDefinitionForInGameId(deckPairId, card.id);
    if (!j) return null;
    const art = jokerArtForCard(deckPairId, card.id);
    const power = getPowerDefinition(j.powerId);
    const charges =
      powerCharges ??
      (() => {
        const catalog = catalogPowerChargesForJoker(deckPairId, card);
        return catalog ? { remaining: catalog.initial, initial: catalog.initial } : undefined;
      })();

    return {
      portraitSrc: art.portraitPath,
      portraitThumbSrc: art.portraitThumbPath,
      frameSrc: art.framePath,
      isPipAce: false,
      primaryHeading: j.name,
      body: j.bio,
      powerName: power.name,
      powerDescription: power.description,
      powerChargesRemaining: charges?.remaining,
      powerChargesInitial: charges?.initial,
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
