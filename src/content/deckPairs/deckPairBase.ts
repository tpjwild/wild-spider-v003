import { sharedDeckCardBackPath } from "@/constants/sharedDeckAssets";
import { baseFaces } from "@/content/deckPairs/builders";
import type { DeckPairDefinition } from "@/content/deckPairs/types";

export const DEFAULT_DECK_PAIR_ID = "base";

export const basePair: DeckPairDefinition = {
  id: DEFAULT_DECK_PAIR_ID,
  name: "Base",
  pairCode: "BAS",
  deckPairTheme: "Base",
  deckPairBlurb: "Neutral rectangles and text until portrait assets are wired.",
  defaultUnlocked: true,
  suitThemes: [
    {
      suit: "S",
      name: "Spades",
      description: "Default suit theme for development and tests.",
    },
    {
      suit: "C",
      name: "Clubs",
      description: "Default suit theme for development and tests.",
    },
    {
      suit: "D",
      name: "Diamonds",
      description: "Default suit theme for development and tests.",
    },
    {
      suit: "H",
      name: "Hearts",
      description: "Default suit theme for development and tests.",
    },
  ],
  decks: [
    {
      label: "Deck 1",
      cardBackPath: sharedDeckCardBackPath(1),
      jokers: [],
      faces: baseFaces(1, {
        S: {
          j: "Jack of Spades",
          jBio: "Face-card slot for Deck 1, spades.",
          q: "Queen of Spades",
          qBio: "Face-card slot for Deck 1, spades.",
          k: "King of Spades",
          kBio: "Face-card slot for Deck 1, spades.",
        },
        C: {
          j: "Jack of Clubs",
          jBio: "Face-card slot for Deck 1, clubs.",
          q: "Queen of Clubs",
          qBio: "Face-card slot for Deck 1, clubs.",
          k: "King of Clubs",
          kBio: "Face-card slot for Deck 1, clubs.",
        },
        D: {
          j: "Jack of Diamonds",
          jBio: "Face-card slot for Deck 1, diamonds.",
          q: "Queen of Diamonds",
          qBio: "Face-card slot for Deck 1, diamonds.",
          k: "King of Diamonds",
          kBio: "Face-card slot for Deck 1, diamonds.",
        },
        H: {
          j: "Jack of Hearts",
          jBio: "Face-card slot for Deck 1, hearts.",
          q: "Queen of Hearts",
          qBio: "Face-card slot for Deck 1, hearts.",
          k: "King of Hearts",
          kBio: "Face-card slot for Deck 1, hearts.",
        },
      }),
    },
    {
      label: "Deck 2",
      cardBackPath: sharedDeckCardBackPath(2),
      jokers: [],
      faces: baseFaces(2, {
        S: {
          j: "Jack of Spades (deck 2)",
          jBio: "Face-card slot for Deck 2, spades.",
          q: "Queen of Spades (deck 2)",
          qBio: "Face-card slot for Deck 2, spades.",
          k: "King of Spades (deck 2)",
          kBio: "Face-card slot for Deck 2, spades.",
        },
        C: {
          j: "Jack of Clubs (deck 2)",
          jBio: "Face-card slot for Deck 2, clubs.",
          q: "Queen of Clubs (deck 2)",
          qBio: "Face-card slot for Deck 2, clubs.",
          k: "King of Clubs (deck 2)",
          kBio: "Face-card slot for Deck 2, clubs.",
        },
        D: {
          j: "Jack of Diamonds (deck 2)",
          jBio: "Face-card slot for Deck 2, diamonds.",
          q: "Queen of Diamonds (deck 2)",
          qBio: "Face-card slot for Deck 2, diamonds.",
          k: "King of Diamonds (deck 2)",
          kBio: "Face-card slot for Deck 2, diamonds.",
        },
        H: {
          j: "Jack of Hearts (deck 2)",
          jBio: "Face-card slot for Deck 2, hearts.",
          q: "Queen of Hearts (deck 2)",
          qBio: "Face-card slot for Deck 2, hearts.",
          k: "King of Hearts (deck 2)",
          kBio: "Face-card slot for Deck 2, hearts.",
        },
      }),
    },
  ],
};
