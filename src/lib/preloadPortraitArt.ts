import { DEFAULT_DECK_PAIR_ID, getDeckPairById } from "@/content/deckPairs";
import { sharedDeckLightCardFacePath } from "@/constants/sharedDeckAssets";
import type { Rank, Suit } from "@/engine/types";

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

  return [...urls];
}

/** Warm the browser HTTP cache only; does not update {@link portraitArtLoadCache}. */
function warmImageUrl(src: string): void {
  if (!src) return;
  const img = new Image();
  img.decoding = "async";
  img.src = src;
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
