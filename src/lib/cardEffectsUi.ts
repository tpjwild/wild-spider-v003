import type { CardDisplayMode } from "@/components/game/CardView";
import { dimensions } from "@/constants/dimensions";
import { EFFECT_TRANSPARENT } from "@/content/effectDefinitions";
import {
  cardEffectsForCard,
  columnEffectsForColumn,
  effectsForCardInColumn,
  hasCardEffect,
  hasEffectOnCardInColumn,
} from "@/engine/effects";
import type { Card, EffectId, GameState, PlacedCard } from "@/engine/types";
import {
  columnHolderEffectBadgeEntries,
  deckPopupEffectBadgeEntries,
  sortEffectsForBadgeDisplay,
  stockPopupEffectBadgeEntries,
  tableauEffectBadgeEntries,
  type EffectBadgeEntry,
} from "@/lib/effectBadgeEntries";

export {
  columnHolderEffectBadgeEntries,
  deckPopupEffectBadgeEntries,
  sortEffectsForBadgeDisplay,
  stockPopupEffectBadgeEntries,
  tableauEffectBadgeEntries,
  type EffectBadgeEntry,
  type EffectBadgeScope,
} from "@/lib/effectBadgeEntries";

export { hasCardEffect, hasEffectOnCardInColumn };

export function cardEffectCount(state: GameState, card: Card): number {
  return cardEffectsForCard(state, card).length;
}

export function cardEffectCountInColumn(
  state: GameState,
  columnIndex: number,
  card: Card,
): number {
  return effectsForCardInColumn(state, columnIndex, card).length;
}

export function columnEffectCount(state: GameState, columnIndex: number): number {
  return columnEffectsForColumn(state, columnIndex).length;
}

export function cardHasEffect(state: GameState, card: Card, effect: EffectId): boolean {
  return hasCardEffect(state, card, effect);
}

export function cardHasEffectInColumn(
  state: GameState,
  columnIndex: number,
  card: Card,
  effect: EffectId,
): boolean {
  return hasEffectOnCardInColumn(state, columnIndex, card, effect);
}

export function cardHasTransparentEffect(state: GameState, card: Card): boolean {
  return hasCardEffect(state, card, EFFECT_TRANSPARENT);
}

export function cardHasTransparentEffectInColumn(
  state: GameState,
  columnIndex: number,
  card: Card,
): boolean {
  return hasEffectOnCardInColumn(state, columnIndex, card, EFFECT_TRANSPARENT);
}

/** Back overlay opacity for transparent-effect face+back rendering ({@link dimensions.transparentEffectBackOpacity}). */
export function transparentEffectBackOpacity(): number {
  return dimensions.transparentEffectBackOpacity;
}

/** Tableau: face-down + transparent → face art with semi-transparent back (not gradient veil). */
export function tableauCardDisplayMode(
  state: GameState,
  columnIndex: number,
  placed: PlacedCard,
): CardDisplayMode | undefined {
  if (!placed.faceUp && cardHasTransparentEffectInColumn(state, columnIndex, placed.card)) {
    return "deckPopupFaceDown";
  }
  return undefined;
}

/** Stock popup cells are always stock-backed; transparent uses the same face+back treatment. */
export function stockPopupCardDisplayMode(state: GameState, card: Card): CardDisplayMode {
  if (cardHasTransparentEffect(state, card)) {
    return "deckPopupFaceDown";
  }
  return "faceDown";
}

/** @deprecated Use {@link tableauEffectBadgeEntries}. */
export function tableauCardEffectIdsForBadges(
  state: GameState,
  columnIndex: number,
  placed: PlacedCard,
): EffectId[] {
  return tableauEffectBadgeEntries(state, columnIndex, placed.card).map((e) => e.effectId);
}

/** @deprecated Use {@link deckPopupEffectBadgeEntries}. */
export function deckPopupCardEffectIdsForBadges(
  state: GameState,
  card: Card,
  _faceDownInPopup?: boolean,
): EffectId[] {
  return deckPopupEffectBadgeEntries(state, card).map((e) => e.effectId);
}

/** @deprecated Use {@link columnHolderEffectBadgeEntries}. */
export function columnEffectIdsForBadges(state: GameState, columnIndex: number): EffectId[] {
  return columnHolderEffectBadgeEntries(state, columnIndex).map((e) => e.effectId);
}

export function tableauCardEffectBadgeCount(state: GameState, columnIndex: number, placed: PlacedCard): number {
  return tableauEffectBadgeEntries(state, columnIndex, placed.card).length;
}

export function deckPopupCardEffectBadgeCount(
  state: GameState,
  card: Card,
  faceDownInPopup: boolean,
): number {
  return deckPopupEffectBadgeEntries(state, card).length;
}
