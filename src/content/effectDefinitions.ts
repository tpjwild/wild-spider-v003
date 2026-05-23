import type { EffectId } from "@/engine/types";

export const EFFECT_TRANSPARENT: EffectId = "transparent";
export const EFFECT_WILD: EffectId = "wild";
export const EFFECT_HALF_WILD: EffectId = "halfWild";
export const EFFECT_SKIP1: EffectId = "skip1";
export const EFFECT_SKIP2: EffectId = "skip2";

/** Effects that change tableau run / placement rules (inactive on foundation). */
export const TABLEAU_MOVE_EFFECT_IDS = [
  EFFECT_WILD,
  EFFECT_HALF_WILD,
  EFFECT_SKIP1,
  EFFECT_SKIP2,
] as const;

export type TableauMoveEffectId = (typeof TABLEAU_MOVE_EFFECT_IDS)[number];

export type EffectDefinition = {
  id: EffectId;
  /** Short label for badges / tooltips. */
  label: string;
  /** When true, effect does not alter foundation moves (strict rank/suit). */
  tableauOnly: boolean;
};

export const EFFECT_DEFINITIONS: Record<EffectId, EffectDefinition> = {
  [EFFECT_TRANSPARENT]: {
    id: EFFECT_TRANSPARENT,
    label: "Transparent",
    tableauOnly: false,
  },
  [EFFECT_WILD]: {
    id: EFFECT_WILD,
    label: "Wild",
    tableauOnly: true,
  },
  [EFFECT_HALF_WILD]: {
    id: EFFECT_HALF_WILD,
    label: "Half wild",
    tableauOnly: true,
  },
  [EFFECT_SKIP1]: {
    id: EFFECT_SKIP1,
    label: "Skip ±1",
    tableauOnly: true,
  },
  [EFFECT_SKIP2]: {
    id: EFFECT_SKIP2,
    label: "Skip ±2",
    tableauOnly: true,
  },
};

export function isTableauMoveEffect(effect: EffectId): effect is TableauMoveEffectId {
  return (TABLEAU_MOVE_EFFECT_IDS as readonly EffectId[]).includes(effect);
}
