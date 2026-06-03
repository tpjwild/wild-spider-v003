import { jokerDefinitionForInGameId } from "@/content/deckPairs";
import {
  normalizePowerId,
  powerIsCardSwap,
  powerTargetsFoundationSlot,
  powerTargetsTableauColumn,
} from "@/content/powerDefinitions";
import { resolvedSetPowerId } from "@/engine/setPowers";
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
  if (entry.kind === "set") return resolvedSetPowerId(game.config.deckPairId, entry);
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
  if (!powerId || powerTargetsTableauColumn(powerId) || powerTargetsFoundationSlot(powerId)) {
    return false;
  }
  if (powerIsCardSwap(powerId)) {
    return isValidTargetedCardTarget(game, powerId, card, { tableauCard: true });
  }
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
  if (powerIsCardSwap(powerId)) {
    return isValidTargetedCardTarget(game, powerId, card, { tableauCard: true })
      ? { tableauCard: true }
      : null;
  }
  if (isValidTargetedCardTarget(game, powerId, card, { tableauCard: true })) {
    return { tableauCard: true };
  }
  if (!faceUp && isValidTargetedCardTarget(game, powerId, card, { tableauFaceDown: true })) {
    return { tableauFaceDown: true };
  }
  return null;
}

/** Commit context for a deck-popup cell (stock/face-down tableau, face-up tableau, or swap). */
export function deckPopupPowerTargetContextForCommit(
  game: GameState,
  card: Card,
  faceDownInPopup: boolean,
  shelfIndex: number,
): BlackJokerTargetContext | null {
  const powerId = armedPowerIdForShelf(game, shelfIndex);
  if (!powerId || powerTargetsTableauColumn(powerId) || powerTargetsFoundationSlot(powerId)) {
    return null;
  }
  if (powerIsCardSwap(powerId)) {
    return isValidTargetedCardTarget(game, powerId, card, { deckPopupCard: true })
      ? { deckPopupCard: true }
      : null;
  }
  if (faceDownInPopup) {
    return isValidTargetedCardTarget(game, powerId, card, { deckPopupFaceDown: true })
      ? { deckPopupFaceDown: true }
      : null;
  }
  return isValidTargetedCardTarget(game, powerId, card, { tableauCard: true })
    ? { tableauCard: true }
    : null;
}

/** Deck popup cell valid for the armed targeted power. */
export function isDeckPopupPowerTarget(
  game: GameState,
  card: Card,
  faceDownInPopup: boolean,
  shelfIndex: number,
): boolean {
  return deckPopupPowerTargetContextForCommit(game, card, faceDownInPopup, shelfIndex) != null;
}

/** Deck popup cell valid for card swap (any non-foundation card). */
export function isDeckPopupCardSwapTarget(
  game: GameState,
  card: Card,
  shelfIndex: number,
): boolean {
  const powerId = armedPowerIdForShelf(game, shelfIndex);
  if (!powerId || !powerIsCardSwap(powerId)) return false;
  return isValidTargetedCardTarget(game, powerId, card, { deckPopupCard: true });
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

export function isFoundationTargetingPower(game: GameState, shelfIndex: number): boolean {
  const powerId = armedPowerIdForShelf(game, shelfIndex);
  return powerId != null && powerTargetsFoundationSlot(powerId);
}

export function isCardSwapTargetingPower(game: GameState, shelfIndex: number): boolean {
  const powerId = armedPowerIdForShelf(game, shelfIndex);
  return powerId != null && powerIsCardSwap(powerId);
}

/** Context for card-swap commit from a click with partial target flags. */
export function cardSwapTargetContextForCommit(
  game: GameState,
  card: Card,
  partial: BlackJokerTargetContext,
  shelfIndex: number,
): BlackJokerTargetContext | null {
  const powerId = armedPowerIdForShelf(game, shelfIndex);
  if (!powerId || !powerIsCardSwap(powerId)) return null;
  if (partial.tableauCard && isValidTargetedCardTarget(game, powerId, card, { tableauCard: true })) {
    return { tableauCard: true };
  }
  if (partial.inStockPopup && isValidTargetedCardTarget(game, powerId, card, { inStockPopup: true })) {
    return { inStockPopup: true };
  }
  if (partial.deckPopupCard && isValidTargetedCardTarget(game, powerId, card, { deckPopupCard: true })) {
    return { deckPopupCard: true };
  }
  if (isValidTargetedCardTarget(game, powerId, card, { tableauCard: true })) {
    return { tableauCard: true };
  }
  if (isValidTargetedCardTarget(game, powerId, card, { inStockPopup: true })) {
    return { inStockPopup: true };
  }
  if (isValidTargetedCardTarget(game, powerId, card, { deckPopupCard: true })) {
    return { deckPopupCard: true };
  }
  return null;
}

/** Invalid target or empty space while a power is armed. */
export const POWER_TARGET_INVALID_CURSOR_CLASS = "cursor-power-target-invalid";
/** Pointer over a valid target while a power is armed. */
export const POWER_TARGET_VALID_CURSOR_CLASS = "cursor-power-target-valid";

/** @deprecated Use {@link POWER_TARGET_INVALID_CURSOR_CLASS}. */
export const POWER_TARGET_ARMED_CURSOR_CLASS = POWER_TARGET_INVALID_CURSOR_CLASS;
/** @deprecated Use {@link POWER_TARGET_VALID_CURSOR_CLASS}. */
export const POWER_TARGET_CURSOR_CLASS = POWER_TARGET_VALID_CURSOR_CLASS;

/**
 * Cursor while {@link powerTargetingActive}. Valid cursor (green fill, white ring
 * and crosshairs) only when hovering a valid target; otherwise the invalid cursor
 * (same disc without crosshairs).
 */
export function powerTargetCursorClass(
  powerTargetingActive: boolean,
  isValidTarget: boolean,
  isHoveringValidTarget: boolean,
): string {
  if (!powerTargetingActive) return "";
  if (isValidTarget && isHoveringValidTarget) return POWER_TARGET_VALID_CURSOR_CLASS;
  return POWER_TARGET_INVALID_CURSOR_CLASS;
}
