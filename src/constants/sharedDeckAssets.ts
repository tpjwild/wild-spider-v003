/**
 * Art shared by every deck pair: backs, pip faces, optional legacy joker slots.
 * Layout under `public/gameArt/shared/` — see `gameArtPaths.ts` for portrait URLs.
 */
import type { Rank, Suit } from "@/engine/types";
import { SHARED_GAME_ART_DIR } from "@/constants/gameArtPaths";

/** @deprecated Use {@link SHARED_GAME_ART_DIR} from `gameArtPaths.ts`. */
export const SHARED_DECK_DIR = SHARED_GAME_ART_DIR;

/** Two backs (Spider’s double deck): deck 1 = ids 0–51, deck 2 = ids 52–103. */
export function sharedDeckCardBackPath(deckNum: 1 | 2): string {
  return `${SHARED_GAME_ART_DIR}/backs/back-deck${deckNum}.png`;
}

/** Optional single frame (not used when per-rank `shared/frames/*.svg` exist). */
export function sharedDeckFramePath(): string {
  return `${SHARED_GAME_ART_DIR}/frame.svg`;
}

/** Optional shared joker portraits (themed pairs use per-pair files under `portraits/`). */
export function sharedJokerPortraitPath(index: 1 | 2 | 3 | 4): string {
  return `${SHARED_GAME_ART_DIR}/joker${index}.png`;
}

/** Full-card pip face SVGs: `shared/cards/AS.svg` … `10H.svg`. */
export function sharedDeckLightCardFacePath(rank: Extract<Rank, 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10>, suit: Suit): string {
  const stem = rank === 1 ? "A" : String(rank);
  return `${SHARED_GAME_ART_DIR}/cards/${stem}${suit}.svg`;
}
