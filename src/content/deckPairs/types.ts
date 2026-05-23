import type { PowerId, Suit } from "@/engine/types";

export type DeckPairId = string;

/** Jack, Queen, or King within a deck. */
export type DeckFaceRank = 11 | 12 | 13;

export type DeckFaceCard = {
  suit: Suit;
  rank: DeckFaceRank;
  name: string;
  bio: string;
  /** Medium WebP/SVG — card details popup. */
  portraitPath: string;
  /** Small WebP/SVG — in-game card faces (tableau, foundation, shelf, deck popup). */
  portraitThumbPath: string;
  framePath: string;
};

export type DeckJokerCard = {
  /** Slot 1–4 within this deck (red/black pairs in themed art filenames). */
  index: 1 | 2 | 3 | 4;
  /** Power triggered from the shelf (see `content/powerDefinitions.ts`). */
  powerId: PowerId;
  /** Charges when the joker is first placed on the shelf. */
  initialCharges: number;
  /** null = power effects permanent; number = moves before applied effects expire. */
  initialDuration: number | null;
  name: string;
  bio: string;
  portraitPath: string;
  portraitThumbPath: string;
  framePath: string;
};

export type DeckInPair = {
  /** Short label for UI (e.g. era or sub-theme). */
  label: string;
  cardBackPath: string;
  /** Up to four per deck; Base ships with none. */
  jokers: readonly DeckJokerCard[];
  /** Exactly twelve: J, Q, K for each suit S, C, D, H. */
  faces: readonly DeckFaceCard[];
};

export type SuitTheme = {
  suit: Suit;
  name: string;
  description: string;
};

export type DeckPairDefinition = {
  id: DeckPairId;
  /** Menu and seed display name. */
  name: string;
  pairCode: string;
  /** High-level theme title for the pair (see product spec). */
  deckPairTheme: string;
  /** Optional prose for Deck Pair Details. */
  deckPairBlurb?: string;
  /**
   * When false, the pair stays locked until achievements unlock it (Stage 6).
   * Stage 4 ships all defined pairs unlocked by default.
   */
  defaultUnlocked: boolean;
  /** One entry per suit S, C, D, H (order matches Deck Popup rows). */
  suitThemes: readonly [SuitTheme, SuitTheme, SuitTheme, SuitTheme];
  decks: readonly [DeckInPair, DeckInPair];
};

export function rankSuitImageStem(rank: DeckFaceRank, suit: Suit): string {
  const rankLetter = rank === 11 ? "J" : rank === 12 ? "Q" : "K";
  return `${rankLetter}${suit}`;
}
