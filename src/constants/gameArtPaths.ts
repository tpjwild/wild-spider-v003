import type { EffectId, Suit } from "@/engine/types";

/** Jack, Queen, or King — matches court portrait filenames. */
export type CourtFaceRank = 11 | 12 | 13;

export const GAME_ART_ROOT = "/gameArt";

export const SHARED_GAME_ART_DIR = `${GAME_ART_ROOT}/shared`;

const EFFECT_BADGE_ART_DIR = `${SHARED_GAME_ART_DIR}/effect-badges`;

/** Lucide (or custom) SVG per {@link EffectId} under `public/gameArt/shared/effect-badges/`. */
export function effectBadgeIconPath(effectId: EffectId): string {
  return `${EFFECT_BADGE_ART_DIR}/${effectId}.svg`;
}

/** Medium court/joker portraits (card details popup) under `public/gameArt/portraits/`. */
export function gameArtPortraitUrl(deckPairId: string, deckNum: 1 | 2, basename: string): string {
  return `${GAME_ART_ROOT}/portraits/${deckPairId}/deck${deckNum}/${basename}`;
}

/** Small court/joker portraits (tableau, foundation, shelf, deck popup) under `public/gameArt/portraits-small/`. */
export function gameArtPortraitThumbUrl(deckPairId: string, deckNum: 1 | 2, basename: string): string {
  return `${GAME_ART_ROOT}/portraits-small/${deckPairId}/deck${deckNum}/${basename}`;
}

const SUIT_WORD: Record<Suit, string> = {
  S: "spades",
  C: "clubs",
  D: "diamonds",
  H: "hearts",
};

function rankWord(rank: CourtFaceRank): string {
  return rank === 11 ? "jack" : rank === 12 ? "queen" : "king";
}

/** Shared SVG frame overlay for each court card (`shared/frames/`). */
export function sharedCourtFramePath(rank: CourtFaceRank, suit: Suit): string {
  return `${SHARED_GAME_ART_DIR}/frames/${rankWord(rank)}-${SUIT_WORD[suit]}-frame.svg`;
}

/** Shared SVG frame for set-power shelf cards (hearts/diamonds = red, spades/clubs = black). */
export function sharedSetFramePath(suit: Suit): string {
  return suit === "H" || suit === "D"
    ? `${SHARED_GAME_ART_DIR}/frames/set-red-frame.svg`
    : `${SHARED_GAME_ART_DIR}/frames/set-black-frame.svg`;
}

/** Joker frame from portrait basename (`joker-red01-…` vs `joker-black01-…`). */
export function sharedJokerFramePathFromPortraitBasename(basename: string): string {
  return basename.includes("joker-red")
    ? `${SHARED_GAME_ART_DIR}/frames/joker-red-frame.svg`
    : `${SHARED_GAME_ART_DIR}/frames/joker-black-frame.svg`;
}

/** Base pair courts: `base01-jack-clubs-jack.svg` under `portraits/base/deck{n}/`. */
export function baseCourtPortraitBasename(deckNum: 1 | 2, rank: CourtFaceRank, suit: Suit): string {
  const prefix = deckNum === 1 ? "base01" : "base02";
  const rw = rankWord(rank);
  return `${prefix}-${rw}-${SUIT_WORD[suit]}-${rw}.svg`;
}
