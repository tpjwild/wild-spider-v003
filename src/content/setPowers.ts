import { setPowerDefinitionForSet } from "@/content/deckPairs";
import { POWER_SELECTED_CARD_TRANSPARENT } from "@/content/powerDefinitions";
import type { PowerId, Suit } from "@/engine/types";

/** Catalog row for a set power (resolved from deck-pair content). */
export type SetPowerCatalogRow = {
  powerId: PowerId;
  initialCharges: number;
  initialDuration: number | null;
};

const FALLBACK_ROW: SetPowerCatalogRow = {
  powerId: POWER_SELECTED_CARD_TRANSPARENT,
  initialCharges: 10,
  initialDuration: 5,
};

/** Returns the set power for an aligned court set from the deck-pair catalog. */
export function setPowerForSet(
  deckPairId: string,
  deckNum: 1 | 2,
  suit: Suit,
): SetPowerCatalogRow {
  const def = setPowerDefinitionForSet(deckPairId, deckNum, suit);
  if (!def) return FALLBACK_ROW;
  return {
    powerId: def.powerId,
    initialCharges: def.initialCharges,
    initialDuration: def.initialDuration,
  };
}
