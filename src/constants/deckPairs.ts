/**
 * Deck pair registry. Add pairs here and drop assets under public/decks/<id>/.
 * Populated in Stage 4.
 */
export type DeckPairId = string;

export const deckPairs = [] as readonly { id: DeckPairId; name: string }[];
