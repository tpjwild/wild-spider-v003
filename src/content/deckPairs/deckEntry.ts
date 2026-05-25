import { sharedDeckCardBackPathForColor } from "@/constants/sharedDeckAssets";
import type { DeckBackColor, DeckInPair } from "@/content/deckPairs/types";

/** Build a deck row: deck 1 → red back, deck 2 → blue back (via {@link DeckBackColor}). */
export function deckEntry(
  name: string,
  color: DeckBackColor,
  content: Pick<DeckInPair, "jokers" | "faces">,
): DeckInPair {
  return {
    name,
    color,
    cardBackPath: sharedDeckCardBackPathForColor(color),
    ...content,
  };
}
