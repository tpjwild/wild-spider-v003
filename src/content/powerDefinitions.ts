import type { EffectId, PowerId, ShelfJoker } from "@/engine/types";

export const EFFECT_TRANSPARENT: EffectId = "transparent";

export const JOKER_POWER_ALL_KINGS_TRANSPARENT: PowerId = "jokerAllKingsTransparent";
export const JOKER_POWER_SELECTED_CARD_TRANSPARENT: PowerId = "jokerSelectedCardTransparent";

export type PowerTriggerClass = "immediate" | "targeted";

/** Valid targets for a targeted power (selected-card transparent). */
export type PowerTargetKind =
  | "tableauFaceDownCard"
  | "stockPopupCard"
  | "deckPopupFaceDownCard";

export type PowerDefinition = {
  id: PowerId;
  triggerClass: PowerTriggerClass;
  /** When set, only these target kinds are valid (selected-card joker excludes column/shelf). */
  targetKinds?: readonly PowerTargetKind[];
};

export const POWER_DEFINITIONS: Record<PowerId, PowerDefinition> = {
  [JOKER_POWER_ALL_KINGS_TRANSPARENT]: {
    id: JOKER_POWER_ALL_KINGS_TRANSPARENT,
    triggerClass: "immediate",
  },
  [JOKER_POWER_SELECTED_CARD_TRANSPARENT]: {
    id: JOKER_POWER_SELECTED_CARD_TRANSPARENT,
    triggerClass: "targeted",
    targetKinds: ["tableauFaceDownCard", "stockPopupCard", "deckPopupFaceDownCard"],
  },
};

export const powers = Object.values(POWER_DEFINITIONS);

/** Persisted saves from before the Stage 5 power-id rename. */
const LEGACY_POWER_ID_MAP: Record<string, PowerId> = {
  jokerRedAllKingsTransparent: JOKER_POWER_ALL_KINGS_TRANSPARENT,
  jokerBlackCardTransparent: JOKER_POWER_SELECTED_CARD_TRANSPARENT,
};

/** Map legacy persisted ids to the current registry (no-op for current ids). */
export function normalizePowerId(powerId: string): PowerId {
  return LEGACY_POWER_ID_MAP[powerId] ?? (powerId as PowerId);
}

/** Rewrite legacy {@link PowerId} on a shelf entry (e.g. when loading localStorage). */
export function normalizeShelfJoker(entry: ShelfJoker): ShelfJoker {
  const powerId = normalizePowerId(entry.powerId);
  return powerId === entry.powerId ? entry : { ...entry, powerId };
}

export function getPowerDefinition(powerId: string): PowerDefinition {
  const id = normalizePowerId(powerId);
  const def = POWER_DEFINITIONS[id];
  if (!def) {
    throw new Error(`Unknown power id: ${powerId}`);
  }
  return def;
}
