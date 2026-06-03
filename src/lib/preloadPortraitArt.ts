import { DEFAULT_DECK_PAIR_ID, getDeckPairById } from "@/content/deckPairs";
import { sharedSetFramePath } from "@/constants/gameArtPaths";
import { sharedDeckLightCardFacePath } from "@/constants/sharedDeckAssets";
import type { DealFlightEntry } from "@/engine/deal";
import { isJoker, isRegular } from "@/engine/cards";
import type { Card, PlacedCard, Rank, Suit } from "@/engine/types";
import { faceArtForRegularCard, jokerArtForCard, courtThumbsForSet } from "@/lib/deckCardArt";

const PIP_RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const satisfies readonly Rank[];
const PIP_SUITS = ["S", "C", "D", "H"] as const satisfies readonly Suit[];

/** Portrait thumb + frame SVGs for one deck pair, plus shared A–10 pip faces (all pairs). */
export function collectTableauPortraitPreloadUrls(deckPairId: string): string[] {
  const urls = new Set<string>();

  for (const rank of PIP_RANKS) {
    for (const suit of PIP_SUITS) {
      urls.add(
        sharedDeckLightCardFacePath(rank as Extract<Rank, 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10>, suit),
      );
    }
  }

  const pair = getDeckPairById(deckPairId) ?? getDeckPairById(DEFAULT_DECK_PAIR_ID);
  if (!pair) return [...urls];

  for (const deck of pair.decks) {
    for (const face of deck.faces) {
      if (face.portraitThumbPath) urls.add(face.portraitThumbPath);
      if (face.framePath) urls.add(face.framePath);
    }
    for (const joker of deck.jokers) {
      if (joker.portraitThumbPath) urls.add(joker.portraitThumbPath);
      if (joker.framePath) urls.add(joker.framePath);
    }
  }

  for (const suit of PIP_SUITS) {
    urls.add(sharedSetFramePath(suit));
  }

  return [...urls];
}

/** Thumb + frame URLs for one card (tableau / shelf face). */
export function collectCardFacePreloadUrls(deckPairId: string, card: Card): string[] {
  const urls: string[] = [];
  if (isRegular(card)) {
    const art = faceArtForRegularCard(deckPairId, card);
    if (!art) return urls;
    if (art.portraitThumbPath) urls.push(art.portraitThumbPath);
    if (art.framePath) urls.push(art.framePath);
  } else if (isJoker(card)) {
    const art = jokerArtForCard(deckPairId, card.id);
    if (art.portraitThumbPath) urls.push(art.portraitThumbPath);
    if (art.framePath) urls.push(art.framePath);
  }
  return urls;
}

/**
 * Card flipped face-up when a tableau run is removed from `startIndex` (any legal drop that
 * completes the move, including foundation).
 */
export function cardRevealedByTableauDrag(
  columns: readonly PlacedCard[][],
  fromColumn: number,
  startIndex: number,
): Card | null {
  if (startIndex <= 0) return null;
  const col = columns[fromColumn];
  if (!col) return null;
  const below = col[startIndex - 1];
  if (!below || below.faceUp) return null;
  return below.card;
}

/** Warm the browser HTTP cache only; does not update {@link portraitArtLoadCache}. */
function warmImageUrl(src: string): void {
  if (!src) return;
  const img = new Image();
  img.decoding = "async";
  img.src = src;
}

export function warmCardFaceArt(deckPairId: string, card: Card): void {
  if (typeof window === "undefined") return;
  for (const src of collectCardFacePreloadUrls(deckPairId, card)) {
    warmImageUrl(src);
  }
}

/** Thumb + frame URLs for one set-power shelf card. */
export function collectSetShelfPreloadUrls(
  deckPairId: string,
  deckNum: 1 | 2,
  suit: Suit,
): string[] {
  const urls: string[] = [sharedSetFramePath(suit)];
  const thumbs = courtThumbsForSet(deckPairId, deckNum, suit);
  if (!thumbs) return urls;
  urls.push(thumbs.king, thumbs.queen, thumbs.jack);
  return urls;
}

export function warmSetShelfArt(deckPairId: string, deckNum: 1 | 2, suit: Suit): void {
  if (typeof window === "undefined") return;
  for (const src of collectSetShelfPreloadUrls(deckPairId, deckNum, suit)) {
    warmImageUrl(src);
  }
}

export function warmCardsFaceArt(deckPairId: string, cards: readonly Card[]): void {
  if (typeof window === "undefined") return;
  const urls = new Set<string>();
  for (const card of cards) {
    for (const src of collectCardFacePreloadUrls(deckPairId, card)) {
      urls.add(src);
    }
  }
  for (const src of urls) {
    warmImageUrl(src);
  }
}

export function scheduleWarmCardFaceArt(deckPairId: string, card: Card): void {
  if (typeof window === "undefined") return;
  queueMicrotask(() => warmCardFaceArt(deckPairId, card));
}

/** Preload face art for each card in a stock-deal flight plan (non-blocking). */
export function schedulePreloadStockDealFaces(
  deckPairId: string,
  entries: readonly DealFlightEntry[],
): void {
  if (typeof window === "undefined") return;
  queueMicrotask(() => warmCardsFaceArt(deckPairId, entries.map((e) => e.card)));
}

/**
 * Warm browser HTTP cache for tableau/foundation/shelf faces. Face-up cards still become visible
 * only after their mounted `<img>` loads in `OptionalPortraitFrameArt`.
 */
export function preloadTableauPortraitArt(deckPairId: string): void {
  if (typeof window === "undefined") return;
  for (const src of collectTableauPortraitPreloadUrls(deckPairId)) {
    warmImageUrl(src);
  }
}

/** Non-blocking: runs after the current turn so deal animation is not delayed. */
export function scheduleTableauPortraitPreload(deckPairId: string): void {
  if (typeof window === "undefined") return;
  queueMicrotask(() => preloadTableauPortraitArt(deckPairId));
}
