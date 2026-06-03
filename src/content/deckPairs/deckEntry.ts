import { sharedDeckCardBackPathForColor } from "@/constants/sharedDeckAssets";
import type { ThemedSetsResult } from "@/content/deckPairs/builders";
import type { DeckBackColor, DeckInPair } from "@/content/deckPairs/types";

type DeckEntryContent =
  | (Pick<DeckInPair, "jokers"> & Pick<DeckInPair, "faces" | "setPowers">)
  | (Pick<DeckInPair, "jokers"> & { sets: ThemedSetsResult });

function expandSets(content: DeckEntryContent): Pick<DeckInPair, "faces" | "setPowers"> {
  if ("sets" in content) {
    return { faces: content.sets.faces, setPowers: content.sets.setPowers };
  }
  return { faces: content.faces, setPowers: content.setPowers };
}

/** Build a deck row: deck 1 → red back, deck 2 → blue back (via {@link DeckBackColor}). */
export function deckEntry(
  name: string,
  color: DeckBackColor,
  content: DeckEntryContent,
): DeckInPair {
  const { faces, setPowers } = expandSets(content);
  return {
    name,
    color,
    cardBackPath: sharedDeckCardBackPathForColor(color),
    jokers: content.jokers,
    faces,
    setPowers,
  };
}
