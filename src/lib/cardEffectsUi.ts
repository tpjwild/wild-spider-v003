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

/** Per spec: card effect badges on the tableau only when the card is face up. */
export function tableauCardEffectBadgeCount(state: GameState, columnIndex: number, placed: PlacedCard): number {
  return placed.faceUp ? cardEffectCountInColumn(state, columnIndex, placed.card) : 0;
}

/** Deck popup: badges on face-up cells only; face-down transparent uses overlay. */
export function deckPopupCardEffectBadgeCount(
  state: GameState,
  card: Card,
  faceDownInPopup: boolean,
): number {
  return faceDownInPopup ? 0 : cardEffectCount(state, card);
}
