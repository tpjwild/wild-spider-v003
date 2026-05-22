/**
 * Art shared by every deck pair: backs and pip faces.
 * Layout under `public/gameArt/shared/` — see `gameArtPaths.ts` for portrait URLs.
 */
import type { Rank, Suit } from "@/engine/types";
import { SHARED_GAME_ART_DIR } from "@/constants/gameArtPaths";

/** Two backs (Spider’s double deck): deck 1 = ids 0–51, deck 2 = ids 52–103. */
export function sharedDeckCardBackPath(deckNum: 1 | 2): string {
  return `${SHARED_GAME_ART_DIR}/backs/back-deck${deckNum}.png`;
}

/** Full-card pip face SVGs: `shared/cards/AS.svg` … `10H.svg`. */
export function sharedDeckLightCardFacePath(rank: Extract<Rank, 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10>, suit: Suit): string {
  const stem = rank === 1 ? "A" : String(rank);
  return `${SHARED_GAME_ART_DIR}/cards/${stem}${suit}.svg`;
}
