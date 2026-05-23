/**
 * Deck pair registry. **Face** portraits: medium `public/gameArt/portraits/`, small `public/gameArt/portraits-small/`.
 * **Shared** backs and pip faces: `public/gameArt/shared/` — see `sharedDeckAssets.ts` and `gameArtPaths.ts`.
 * Missing files are handled in the UI (gradient / typography fallbacks); assets are optional in the repo.
 *
 * **pairCode:** exactly three characters `[A-Z0-9]`, immutable per pair — used in formatted game seeds.
 */
export type {
  DeckFaceCard,
  DeckFaceRank,
  DeckInPair,
  DeckJokerCard,
  DeckPairDefinition,
  DeckPairId,
  SuitTheme,
} from "@/content/deckPairs/types";
export { rankSuitImageStem } from "@/content/deckPairs/types";

export { DEFAULT_DECK_PAIR_ID, basePair } from "@/content/deckPairs/deckPairBase";
export { COMPUTER_SCIENCE_ID, computerSciencePair } from "@/content/deckPairs/deckPairComputerScience";
export { MATHEMATICS_ID, mathematicsPair } from "@/content/deckPairs/deckPairMathematics";
export { WESTERN_PHILOSOPHY_ID, westernPhilosophyPair } from "@/content/deckPairs/deckPairWesternPhilosophy";

import { basePair } from "@/content/deckPairs/deckPairBase";
import { computerSciencePair } from "@/content/deckPairs/deckPairComputerScience";
import { mathematicsPair } from "@/content/deckPairs/deckPairMathematics";
import { westernPhilosophyPair } from "@/content/deckPairs/deckPairWesternPhilosophy";
import type { DeckJokerCard, DeckPairDefinition } from "@/content/deckPairs/types";

/** Product registry: stable menu order — Base, Computer Science, Western Philosophy, Mathematics. */
export const deckPairs: readonly DeckPairDefinition[] = [
  basePair,
  computerSciencePair,
  westernPhilosophyPair,
  mathematicsPair,
];

export function getDeckPairById(id: string): DeckPairDefinition | undefined {
  return deckPairs.find((p) => p.id === id);
}

/** Flattened joker catalog for a pair (deck 1 slots 1–4, then deck 2). Matches in-game `JokerCard.id` indexing. */
export function allJokersInDeckPair(pairId: string): readonly DeckJokerCard[] {
  const p = getDeckPairById(pairId);
  if (!p) return [];
  return [...p.decks[0].jokers, ...p.decks[1].jokers];
}

/** Catalog row for an in-play joker id (`id % jokerList.length`). */
export function jokerDefinitionForInGameId(
  pairId: string,
  jokerId: number,
): DeckJokerCard | undefined {
  const list = allJokersInDeckPair(pairId);
  if (list.length === 0) return undefined;
  return list[jokerId % list.length];
}

/** Whether the pair can be selected in New Game and opened in Deck Pair Details (Stage 6 may tighten this). */
export function isDeckPairUnlocked(pair: DeckPairDefinition): boolean {
  return pair.defaultUnlocked;
}

export function isDeckPairUnlockedById(id: string): boolean {
  const p = getDeckPairById(id);
  return p ? isDeckPairUnlocked(p) : false;
}

/** Max jokers that can appear in play for this pair (sum of both decks’ joker lists). */
export function maxJokersInPlayForDeckPair(pairId: string): number {
  const p = getDeckPairById(pairId);
  if (!p) return 0;
  return p.decks[0].jokers.length + p.decks[1].jokers.length;
}
