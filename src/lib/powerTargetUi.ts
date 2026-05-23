import { jokerDefinitionForInGameId } from "@/content/deckPairs";
import {
  getPowerDefinition,
  normalizePowerId,
  powerTargetsTableauColumn,
} from "@/content/powerDefinitions";
import {
  isValidTargetedCardTarget,
  isValidTargetedColumnTarget,
  type BlackJokerTargetContext,
} from "@/engine/powers";
import type { Card, GameState, PowerId } from "@/engine/types";

/** Power armed on the shelf — catalog wins over persisted `shelf.powerId` (keeps art and rules aligned). */
export function armedPowerIdForShelf(game: GameState, shelfIndex: number): PowerId | null {
  const entry = game.shelf[shelfIndex];
  if (!entry) return null;
  const fromCatalog = jokerDefinitionForInGameId(game.config.deckPairId, entry.card.id);
  if (fromCatalog) return fromCatalog.powerId;
  return normalizePowerId(entry.powerId);
}

/** Tableau card valid for the armed targeted power (face-down and/or any tableau card per power def). */
export function isTableauPowerTarget(
  game: GameState,
  card: Card,
  faceUp: boolean,
  shelfIndex: number,
): boolean {
  const powerId = armedPowerIdForShelf(game, shelfIndex);
  if (!powerId || powerTargetsTableauColumn(powerId)) return false;
  if (isValidTargetedCardTarget(game, powerId, card, { tableauCard: true })) return true;
  if (!faceUp && isValidTargetedCardTarget(game, powerId, card, { tableauFaceDown: true })) {
    return true;
  }
  return false;
}

/** @deprecated Use {@link isTableauPowerTarget}. */
export function isTableauFaceDownPowerTarget(
  game: GameState,
  card: Card,
  faceUp: boolean,
  shelfIndex: number,
): boolean {
  return isTableauPowerTarget(game, card, faceUp, shelfIndex);
}

/** Context for {@link commitTargetedPower} after a validated tableau card click. */
export function tableauPowerTargetContextForCommit(
  game: GameState,
  card: Card,
  faceUp: boolean,
  shelfIndex: number,
): BlackJokerTargetContext | null {
  const powerId = armedPowerIdForShelf(game, shelfIndex);
  if (!powerId) return null;
  if (isValidTargetedCardTarget(game, powerId, card, { tableauCard: true })) {
    return { tableauCard: true };
  }
  if (!faceUp && isValidTargetedCardTarget(game, powerId, card, { tableauFaceDown: true })) {
    return { tableauFaceDown: true };
  }
  return null;
}

/** Deck popup cell still in stock or face-down on tableau (not dealt face-up). */
export function isDeckPopupPowerTarget(
  game: GameState,
  card: Card,
  faceDownInPopup: boolean,
  shelfIndex: number,
): boolean {
  if (!faceDownInPopup) return false;
  const powerId = armedPowerIdForShelf(game, shelfIndex);
  if (!powerId || powerTargetsTableauColumn(powerId)) return false;
  return isValidTargetedCardTarget(game, powerId, card, { deckPopupFaceDown: true });
}

/** Any card shown in the Stock popup. */
export function isStockPopupPowerTarget(
  game: GameState,
  card: Card,
  shelfIndex: number,
): boolean {
  const powerId = armedPowerIdForShelf(game, shelfIndex);
  if (!powerId || powerTargetsTableauColumn(powerId)) return false;
  return isValidTargetedCardTarget(game, powerId, card, { inStockPopup: true });
}

/** Tableau column valid for the armed column-targeted power. */
export function isTableauColumnPowerTarget(
  game: GameState,
  columnIndex: number,
  shelfIndex: number,
): boolean {
  const powerId = armedPowerIdForShelf(game, shelfIndex);
  if (!powerId || !powerTargetsTableauColumn(powerId)) return false;
  return isValidTargetedColumnTarget(game, powerId, columnIndex);
}

export function isColumnTargetingPower(game: GameState, shelfIndex: number): boolean {
  const powerId = armedPowerIdForShelf(game, shelfIndex);
  return powerId != null && powerTargetsTableauColumn(powerId);
}

export const POWER_TARGET_CURSOR_CLASS = "cursor-crosshair";
export const POWER_TARGET_VALID_CURSOR_CLASS = "cursor-cell";
