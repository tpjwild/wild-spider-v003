/**
 * Art shared by every deck pair: backs and pip faces.
 * Layout under `public/gameArt/shared/` — see `gameArtPaths.ts` for portrait URLs.
 */
import type { DeckBackColor } from "@/content/deckPairs/types";
import type { Rank, Suit } from "@/engine/types";
import { SHARED_GAME_ART_DIR } from "@/constants/gameArtPaths";

/** Two backs (Spider’s double deck): `back-deck1` = red, `back-deck2` = blue. */
export function sharedDeckCardBackPath(deckNum: 1 | 2): string {
  return `${SHARED_GAME_ART_DIR}/backs/back-deck${deckNum}.png`;
}

/** Deck 1 in every pair uses the red back; deck 2 uses the blue back. */
export function sharedDeckCardBackPathForColor(color: DeckBackColor): string {
  return sharedDeckCardBackPath(color === "red" ? 1 : 2);
}

export function defaultDeckBackColorForDeckNum(deckNum: 1 | 2): DeckBackColor {
  return deckNum === 1 ? "red" : "blue";
}

/** Full-card pip face SVGs: `shared/cards/AS.svg` … `10H.svg`. */
export function sharedDeckLightCardFacePath(rank: Extract<Rank, 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10>, suit: Suit): string {
  const stem = rank === 1 ? "A" : String(rank);
  return `${SHARED_GAME_ART_DIR}/cards/${stem}${suit}.svg`;
}
