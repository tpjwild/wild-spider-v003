import { findExtraColumnLinkByParent } from "@/engine/extraColumn";
import { cardEffectKey } from "@/engine/effects";
import type { AppliedEffect, Card, GameState } from "@/engine/types";

/** Minimum positive `movesRemaining` among timed applied effects, or null if none. */
export function soonestAppliedEffectTicks(
  effects: readonly AppliedEffect[],
): number | null {
  let min: number | null = null;
  for (const entry of effects) {
    if (entry.movesRemaining == null || entry.movesRemaining <= 0) continue;
    if (min == null || entry.movesRemaining < min) {
      min = entry.movesRemaining;
    }
  }
  return min;
}

/** Soonest card-scoped effect expiry (tableau / deck / stock popups). */
export function soonestCardEffectTicks(state: GameState, card: Card): number | null {
  return soonestAppliedEffectTicks(state.cardEffects[cardEffectKey(card)] ?? []);
}

/**
 * Soonest column-holder expiry: timed `columnEffects` plus active Extra Column
 * parent link on this column (not incoming child links).
 */
export function soonestColumnHolderTicks(
  state: GameState,
  columnIndex: number,
): number | null {
  const fromEffects = soonestAppliedEffectTicks(state.columnEffects[columnIndex] ?? []);
  const link = findExtraColumnLinkByParent(state, columnIndex);
  const fromLink =
    link != null && link.movesRemaining > 0 ? link.movesRemaining : null;
  if (fromEffects == null) return fromLink;
  if (fromLink == null) return fromEffects;
  return Math.min(fromEffects, fromLink);
}
