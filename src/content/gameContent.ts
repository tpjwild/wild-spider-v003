/**
 * Canonical game content registry: deck pairs (faces, jokers, themes) and power metadata.
 * Behavior (apply/trigger) lives in `src/engine/powers/`.
 */
import {
  allJokersInDeckPair,
  deckPairs,
  DEFAULT_DECK_PAIR_ID,
  getDeckPairById,
  isDeckPairUnlocked,
  isDeckPairUnlockedById,
  jokerDefinitionForInGameId,
  maxJokersInPlayForDeckPair,
  type DeckFaceCard,
  type DeckFaceRank,
  type DeckInPair,
  type DeckJokerCard,
  type ThemedJokerInput,
  type DeckPairDefinition,
  type DeckPairId,
  type SuitTheme,
} from "@/content/deckPairs";
import {
  EFFECT_TRANSPARENT,
  getPowerDefinition,
  JOKER_POWER_ALL_KINGS_TRANSPARENT,
  JOKER_POWER_SELECTED_CARD_TRANSPARENT,
  POWER_DEFINITIONS,
  powers,
  type PowerDefinition,
  type PowerTargetKind,
  type PowerTriggerClass,
} from "@/content/powerDefinitions";

export const GAME_CONTENT = {
  deckPairs,
  powerDefinitions: POWER_DEFINITIONS,
} as const;

export type GameContent = typeof GAME_CONTENT;

export {
  allJokersInDeckPair,
  deckPairs,
  DEFAULT_DECK_PAIR_ID,
  getDeckPairById,
  isDeckPairUnlocked,
  isDeckPairUnlockedById,
  jokerDefinitionForInGameId,
  maxJokersInPlayForDeckPair,
  EFFECT_TRANSPARENT,
  getPowerDefinition,
  JOKER_POWER_ALL_KINGS_TRANSPARENT,
  JOKER_POWER_SELECTED_CARD_TRANSPARENT,
  POWER_DEFINITIONS,
  powers,
  type DeckFaceCard,
  type DeckFaceRank,
  type DeckInPair,
  type DeckJokerCard,
  type ThemedJokerInput,
  type DeckPairDefinition,
  type DeckPairId,
  type PowerDefinition,
  type PowerTargetKind,
  type PowerTriggerClass,
  type SuitTheme,
};
