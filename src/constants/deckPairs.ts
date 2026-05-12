/**
 * Deck pair registry. Add pairs here and drop assets under public/decks/<id>/.
 * Stage 2 uses a single placeholder; Stage 4 adds real pairs and art.
 *
 * **pairCode:** exactly three characters [A-Z0-9], immutable per pair — used in formatted game seeds.
 */
export type DeckPairId = string;

export const DEFAULT_DECK_PAIR_ID = "placeholder";

export const deckPairs = [
  { id: DEFAULT_DECK_PAIR_ID, name: "Placeholder", pairCode: "PLH" },
] as const satisfies readonly { id: DeckPairId; name: string; pairCode: string }[];
