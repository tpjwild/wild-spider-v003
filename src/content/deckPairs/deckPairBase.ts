import { deckEntry } from "@/content/deckPairs/deckEntry";
import { baseSets } from "@/content/deckPairs/builders";
import {
  POWER_CARD_SWAP,
  POWER_SELECTED_CARD_SKIP1,
  POWER_SELECTED_CARD_TRANSPARENT,
  POWER_SELECTED_CARD_WILD,
} from "@/content/powerDefinitions";
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
    deckEntry("Base Deck", "red", {
      jokers: [],
      sets: baseSets(1, {
        S: {
          j: "Jack of Spades",
          jBio: "Face-card slot for Deck 1, spades.",
          q: "Queen of Spades",
          qBio: "Face-card slot for Deck 1, spades.",
          k: "King of Spades",
          kBio: "Face-card slot for Deck 1, spades.",
          powerId: POWER_SELECTED_CARD_TRANSPARENT,
          initialCharges: 1,
          initialDuration: null,
        },
        C: {
          j: "Jack of Clubs",
          jBio: "Face-card slot for Deck 1, clubs.",
          q: "Queen of Clubs",
          qBio: "Face-card slot for Deck 1, clubs.",
          k: "King of Clubs",
          kBio: "Face-card slot for Deck 1, clubs.",
          powerId: POWER_CARD_SWAP,
          initialCharges: 1,
          initialDuration: null,
        },
        D: {
          j: "Jack of Diamonds",
          jBio: "Face-card slot for Deck 1, diamonds.",
          q: "Queen of Diamonds",
          qBio: "Face-card slot for Deck 1, diamonds.",
          k: "King of Diamonds",
          kBio: "Face-card slot for Deck 1, diamonds.",
          powerId: POWER_SELECTED_CARD_SKIP1,
          initialCharges: 1,
          initialDuration: null,
        },
        H: {
          j: "Jack of Hearts",
          jBio: "Face-card slot for Deck 1, hearts.",
          q: "Queen of Hearts",
          qBio: "Face-card slot for Deck 1, hearts.",
          k: "King of Hearts",
          kBio: "Face-card slot for Deck 1, hearts.",
          powerId: POWER_SELECTED_CARD_WILD,
          initialCharges: 1,
          initialDuration: null,
        },
      }),
    }),
    deckEntry("Base Deck", "blue", {
      jokers: [],
      sets: baseSets(2, {
        S: {
          j: "Jack of Spades (deck 2)",
          jBio: "Face-card slot for Deck 2, spades.",
          q: "Queen of Spades (deck 2)",
          qBio: "Face-card slot for Deck 2, spades.",
          k: "King of Spades (deck 2)",
          kBio: "Face-card slot for Deck 2, spades.",
          powerId: POWER_SELECTED_CARD_TRANSPARENT,
          initialCharges: 1,
          initialDuration: null,
        },
        C: {
          j: "Jack of Clubs (deck 2)",
          jBio: "Face-card slot for Deck 2, clubs.",
          q: "Queen of Clubs (deck 2)",
          qBio: "Face-card slot for Deck 2, clubs.",
          k: "King of Clubs (deck 2)",
          kBio: "Face-card slot for Deck 2, clubs.",
          powerId: POWER_CARD_SWAP,
          initialCharges: 1,
          initialDuration: null,
        },
        D: {
          j: "Jack of Diamonds (deck 2)",
          jBio: "Face-card slot for Deck 2, diamonds.",
          q: "Queen of Diamonds (deck 2)",
          qBio: "Face-card slot for Deck 2, diamonds.",
          k: "King of Diamonds (deck 2)",
          kBio: "Face-card slot for Deck 2, diamonds.",
          powerId: POWER_SELECTED_CARD_SKIP1,
          initialCharges: 1,
          initialDuration: null,
        },
        H: {
          j: "Jack of Hearts (deck 2)",
          jBio: "Face-card slot for Deck 2, hearts.",
          q: "Queen of Hearts (deck 2)",
          qBio: "Face-card slot for Deck 2, hearts.",
          k: "King of Hearts (deck 2)",
          kBio: "Face-card slot for Deck 2, hearts.",
          powerId: POWER_SELECTED_CARD_WILD,
          initialCharges: 1,
          initialDuration: null,
        },
      }),
    }),
  ],
};
