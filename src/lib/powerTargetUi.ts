import { isValidTargetedCardTarget } from "@/engine/powers";
import type { Card, GameState, PowerId } from "@/engine/types";

function powerIdForTargeting(game: GameState, shelfIndex: number): PowerId | null {
  return game.shelf[shelfIndex]?.powerId ?? null;
}

/** Face-down tableau card valid for the armed targeted power on `shelfIndex`. */
export function isTableauFaceDownPowerTarget(
  game: GameState,
  card: Card,
  faceUp: boolean,
  shelfIndex: number,
): boolean {
  if (faceUp) return false;
  const powerId = powerIdForTargeting(game, shelfIndex);
  if (!powerId) return false;
  return isValidTargetedCardTarget(game, powerId, card, { tableauFaceDown: true });
}

/** Deck popup cell still in stock or face-down on tableau (not dealt face-up). */
export function isDeckPopupPowerTarget(
  game: GameState,
  card: Card,
  faceDownInPopup: boolean,
  shelfIndex: number,
): boolean {
  if (!faceDownInPopup) return false;
  const powerId = powerIdForTargeting(game, shelfIndex);
  if (!powerId) return false;
  return isValidTargetedCardTarget(game, powerId, card, { deckPopupFaceDown: true });
}

/** Any card shown in the Stock popup. */
export function isStockPopupPowerTarget(
  game: GameState,
  card: Card,
  shelfIndex: number,
): boolean {
  const powerId = powerIdForTargeting(game, shelfIndex);
  if (!powerId) return false;
  return isValidTargetedCardTarget(game, powerId, card, { inStockPopup: true });
}

export const POWER_TARGET_CURSOR_CLASS = "cursor-crosshair";
export const POWER_TARGET_VALID_CURSOR_CLASS = "cursor-cell";
