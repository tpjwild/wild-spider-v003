import { EFFECT_DEFINITIONS } from "@/content/effectDefinitions";
import {
  cardEffectsForCard,
  columnEffectsForColumn,
  hasCardEffect,
} from "@/engine/effects";
import type { Card, EffectId, GameState } from "@/engine/types";
import { isCardInStock, stockCardKeySet } from "@/lib/deckPopupLayout";

/** Stable badge order (catalog order in {@link EFFECT_DEFINITIONS}). */
const EFFECT_BADGE_DISPLAY_ORDER = Object.keys(EFFECT_DEFINITIONS) as EffectId[];

export type EffectBadgeScope = "card" | "column";

export type EffectBadgeEntry = {
  effectId: EffectId;
  scope: EffectBadgeScope;
};

export function sortEffectsForBadgeDisplay(ids: readonly EffectId[]): EffectId[] {
  const present = new Set(ids);
  return EFFECT_BADGE_DISPLAY_ORDER.filter((id) => present.has(id));
}

export function effectBadgeTooltip(entries: readonly EffectBadgeEntry[]): string {
  return entries
    .map((e) => {
      const label = EFFECT_DEFINITIONS[e.effectId].label;
      return e.scope === "column" ? `${label} (column)` : label;
    })
    .join(", ");
}

/** Column index if the card is on the tableau; otherwise null. */
export function tableauColumnIndexForCard(state: GameState, card: Card): number | null {
  for (let i = 0; i < state.columns.length; i++) {
    const col = state.columns[i]!;
    if (col.some((p) => p.card.kind === card.kind && p.card.id === card.id)) {
      return i;
    }
  }
  return null;
}

function cardScopeBadgeEntries(state: GameState, card: Card): EffectBadgeEntry[] {
  return sortEffectsForBadgeDisplay(cardEffectsForCard(state, card)).map((effectId) => ({
    effectId,
    scope: "card" as const,
  }));
}

function columnScopeBadgeEntries(
  state: GameState,
  columnIndex: number,
  card: Card,
): EffectBadgeEntry[] {
  return sortEffectsForBadgeDisplay(
    columnEffectsForColumn(state, columnIndex).filter((id) => !hasCardEffect(state, card, id)),
  ).map((effectId) => ({ effectId, scope: "column" as const }));
}

/** Tableau card — face up or face down; card effects plus column-only effects. */
export function tableauEffectBadgeEntries(
  state: GameState,
  columnIndex: number,
  card: Card,
): EffectBadgeEntry[] {
  return [
    ...cardScopeBadgeEntries(state, card),
    ...columnScopeBadgeEntries(state, columnIndex, card),
  ];
}

/** Column badge holder — column effects only (darker badges). */
export function columnHolderEffectBadgeEntries(
  state: GameState,
  columnIndex: number,
): EffectBadgeEntry[] {
  return sortEffectsForBadgeDisplay(columnEffectsForColumn(state, columnIndex)).map(
    (effectId) => ({ effectId, scope: "column" as const }),
  );
}

/**
 * Deck popup — card effects always; column inheritance only when the card is on the tableau
 * (not in stock).
 */
export function deckPopupEffectBadgeEntries(state: GameState, card: Card): EffectBadgeEntry[] {
  const stockKeys = stockCardKeySet(state.stock);
  const cardEntries = cardScopeBadgeEntries(state, card);
  if (isCardInStock(card, stockKeys)) {
    return cardEntries;
  }
  const columnIndex = tableauColumnIndexForCard(state, card);
  if (columnIndex == null) {
    return cardEntries;
  }
  return [...cardEntries, ...columnScopeBadgeEntries(state, columnIndex, card)];
}

/** Stock popup — card-attached effects only (no column inheritance). */
export function stockPopupEffectBadgeEntries(state: GameState, card: Card): EffectBadgeEntry[] {
  return cardScopeBadgeEntries(state, card);
}
