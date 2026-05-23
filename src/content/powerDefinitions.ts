import {
  EFFECT_HALF_WILD,
  EFFECT_SKIP1,
  EFFECT_SKIP2,
  EFFECT_TRANSPARENT,
  EFFECT_WILD,
} from "@/content/effectDefinitions";
import type { EffectId, PowerId, ShelfJoker } from "@/engine/types";

export {
  EFFECT_HALF_WILD,
  EFFECT_SKIP1,
  EFFECT_SKIP2,
  EFFECT_TRANSPARENT,
  EFFECT_WILD,
} from "@/content/effectDefinitions";

export const JOKER_POWER_ALL_KINGS_TRANSPARENT: PowerId = "jokerAllKingsTransparent";
export const JOKER_POWER_SELECTED_CARD_TRANSPARENT: PowerId = "jokerSelectedCardTransparent";
export const JOKER_POWER_SELECTED_CARD_WILD: PowerId = "jokerSelectedCardWild";
export const JOKER_POWER_SELECTED_CARD_HALFWILD: PowerId = "jokerSelectedCardHalfWild";
export const JOKER_POWER_SELECTED_COLUMN_WILD: PowerId = "jokerSelectedColumnWild";
export const JOKER_POWER_SELECTED_COLUMN_HALFWILD: PowerId = "jokerSelectedColumnHalfWild";
export const JOKER_POWER_SELECTED_COLUMN_TRANSPARENT: PowerId = "jokerSelectedColumnTransparent";
export const JOKER_POWER_SELECTED_CARD_SKIP1: PowerId = "jokerSelectedCardSkip1";
export const JOKER_POWER_SELECTED_CARD_SKIP2: PowerId = "jokerSelectedCardSkip2";
export const JOKER_POWER_SELECTED_COLUMN_SKIP1: PowerId = "jokerSelectedColumnSkip1";
export const JOKER_POWER_SELECTED_COLUMN_SKIP2: PowerId = "jokerSelectedColumnSkip2";
export const JOKER_POWER_2_KINGS_TRANSPARENT: PowerId = "jokerTwoKingsTransparent";

export type PowerTriggerClass = "immediate" | "targeted";

export type PowerTargetKind =
  | "tableauFaceDownCard"
  | "tableauCard"
  | "stockPopupCard"
  | "deckPopupFaceDownCard"
  | "tableauColumn";

export type PowerDefinition = {
  id: PowerId;
  /** Player-facing title (card details, future tooltips). */
  name: string;
  /** Player-facing rules summary. */
  description: string;
  triggerClass: PowerTriggerClass;
  /** Effect applied to a targeted card or column (targeted powers). */
  appliesEffect?: EffectId;
  /** Valid target kinds for targeted powers. */
  targetKinds?: readonly PowerTargetKind[];
};

export const POWER_DEFINITIONS: Record<PowerId, PowerDefinition> = {
  [JOKER_POWER_ALL_KINGS_TRANSPARENT]: {
    id: JOKER_POWER_ALL_KINGS_TRANSPARENT,
    name: "Royal revelation",
    description:
      "Double-click to apply transparent to every King in the game (all suits and decks, every zone). Counts as one move; undo restores charges and removes the effect.",
    triggerClass: "immediate",
  },
  [JOKER_POWER_2_KINGS_TRANSPARENT]: {
    id: JOKER_POWER_2_KINGS_TRANSPARENT,
    name: "Twin crowns",
    description:
      "Double-click to make two Kings transparent, preferring stock or face-down foundation, then face-up tableau, then other foundation Kings. Kings already transparent are skipped.",
    triggerClass: "immediate",
  },
  [JOKER_POWER_SELECTED_CARD_TRANSPARENT]: {
    id: JOKER_POWER_SELECTED_CARD_TRANSPARENT,
    name: "Veiled glimpse",
    description:
      "Double-click, then click one valid card: a face-down tableau card, any card in the Stock popup, or a face-down card in the Deck popup. Applies transparent so the card can be inspected while face-down. Cancel with Escape or Shift without spending a charge.",
    triggerClass: "targeted",
    appliesEffect: EFFECT_TRANSPARENT,
    targetKinds: ["tableauFaceDownCard", "stockPopupCard", "deckPopupFaceDownCard"],
  },
  [JOKER_POWER_SELECTED_CARD_WILD]: {
    id: JOKER_POWER_SELECTED_CARD_WILD,
    name: "Wild card",
    description:
      "Double-click, then click one valid card on the tableau (face-up or down), in the Stock popup, or face-down in the Deck popup. That card becomes wild for tableau runs (foundation moves stay strict).",
    triggerClass: "targeted",
    appliesEffect: EFFECT_WILD,
    targetKinds: ["tableauCard", "stockPopupCard", "deckPopupFaceDownCard"],
  },
  [JOKER_POWER_SELECTED_CARD_HALFWILD]: {
    id: JOKER_POWER_SELECTED_CARD_HALFWILD,
    name: "Half wild card",
    description:
      "Double-click, then click one valid card on the tableau (face-up or down), in the Stock popup, or face-down in the Deck popup. That card becomes half wild: it may use either of two adjacent ranks when building tableau runs.",
    triggerClass: "targeted",
    appliesEffect: EFFECT_HALF_WILD,
    targetKinds: ["tableauCard", "stockPopupCard", "deckPopupFaceDownCard"],
  },
  [JOKER_POWER_SELECTED_CARD_SKIP1]: {
    id: JOKER_POWER_SELECTED_CARD_SKIP1,
    name: "Skip ±1 card",
    description:
      "Double-click, then click one valid card on the tableau (face-up or down), in the Stock popup, or face-down in the Deck popup. That card may count as one rank higher or lower when building tableau runs.",
    triggerClass: "targeted",
    appliesEffect: EFFECT_SKIP1,
    targetKinds: ["tableauCard", "stockPopupCard", "deckPopupFaceDownCard"],
  },
  [JOKER_POWER_SELECTED_CARD_SKIP2]: {
    id: JOKER_POWER_SELECTED_CARD_SKIP2,
    name: "Skip ±2 card",
    description:
      "Double-click, then click one valid card on the tableau (face-up or down), in the Stock popup, or face-down in the Deck popup. That card may count as two ranks higher or lower when building tableau runs.",
    triggerClass: "targeted",
    appliesEffect: EFFECT_SKIP2,
    targetKinds: ["tableauCard", "stockPopupCard", "deckPopupFaceDownCard"],
  },
  [JOKER_POWER_SELECTED_COLUMN_TRANSPARENT]: {
    id: JOKER_POWER_SELECTED_COLUMN_TRANSPARENT,
    name: "Column veil",
    description:
      "Double-click, then click a tableau column. Every card in that column becomes transparent (face-down cards can be inspected per transparent rules).",
    triggerClass: "targeted",
    appliesEffect: EFFECT_TRANSPARENT,
    targetKinds: ["tableauColumn"],
  },
  [JOKER_POWER_SELECTED_COLUMN_WILD]: {
    id: JOKER_POWER_SELECTED_COLUMN_WILD,
    name: "Wild column",
    description:
      "Double-click, then click a tableau column. Every card in that column becomes wild for tableau runs.",
    triggerClass: "targeted",
    appliesEffect: EFFECT_WILD,
    targetKinds: ["tableauColumn"],
  },
  [JOKER_POWER_SELECTED_COLUMN_HALFWILD]: {
    id: JOKER_POWER_SELECTED_COLUMN_HALFWILD,
    name: "Half wild column",
    description:
      "Double-click, then click a tableau column. Every card in that column becomes half wild for tableau runs.",
    triggerClass: "targeted",
    appliesEffect: EFFECT_HALF_WILD,
    targetKinds: ["tableauColumn"],
  },
  [JOKER_POWER_SELECTED_COLUMN_SKIP1]: {
    id: JOKER_POWER_SELECTED_COLUMN_SKIP1,
    name: "Skip ±1 column",
    description:
      "Double-click, then click a tableau column. Every card in that column may use ±1 rank when building tableau runs.",
    triggerClass: "targeted",
    appliesEffect: EFFECT_SKIP1,
    targetKinds: ["tableauColumn"],
  },
  [JOKER_POWER_SELECTED_COLUMN_SKIP2]: {
    id: JOKER_POWER_SELECTED_COLUMN_SKIP2,
    name: "Skip ±2 column",
    description:
      "Double-click, then click a tableau column. Every card in that column may use ±2 ranks when building tableau runs.",
    triggerClass: "targeted",
    appliesEffect: EFFECT_SKIP2,
    targetKinds: ["tableauColumn"],
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

export function powerTargetsTableauColumn(powerId: string): boolean {
  const kinds = getPowerDefinition(powerId).targetKinds;
  return kinds?.includes("tableauColumn") ?? false;
}
