import { dealFromStock } from "./deal";
import { undoLastEntry } from "./history";
import {
  triggerImmediatePower as applyImmediatePower,
  triggerCardSwapPower as applyCardSwapPower,
  triggerTargetedColumnPower as applyTargetedColumnPower,
  triggerTargetedFoundationPower as applyTargetedFoundationPower,
  triggerTargetedPower as applyTargetedPower,
  type BlackJokerTargetContext,
} from "./powers";
import { applyMoveTableau, applyMoveToFoundation } from "./moves";
import { createInitialState } from "./setup";
import { tickEffectDurations } from "./effects";
import { tickExtraColumnLinks } from "./extraColumn";
import type {
  Card,
  FoundationIndex,
  GameConfig,
  GameState,
  HistoryEntry,
  MoveTableauArgs,
  MoveToFoundationArgs,
} from "./types";

export function newGame(config: GameConfig): GameState {
  return createInitialState(config);
}

export function moveTableau(state: GameState, args: MoveTableauArgs): GameState | null {
  const r = applyMoveTableau(state, args);
  if (!r) return null;
  return appendHistory(r.state, r.history);
}

export function moveToFoundation(
  state: GameState,
  args: MoveToFoundationArgs,
): GameState | null {
  const r = applyMoveToFoundation(state, args);
  if (!r) return null;
  return appendHistory(r.state, r.history);
}

export function dealStock(state: GameState): GameState | null {
  const r = dealFromStock(state);
  if (!r) return null;
  return appendHistory(r.state, r.history);
}

function shouldTickEffectDurations(entry: HistoryEntry): boolean {
  return (
    entry.type === "move_tableau" ||
    entry.type === "move_to_foundation" ||
    entry.type === "deal"
  );
}

function appendHistory(state: GameState, entry: HistoryEntry): GameState {
  const withHistory = {
    ...state,
    history: [...state.history, entry],
  };
  if (!shouldTickEffectDurations(entry)) return withHistory;
  return tickExtraColumnLinks(tickEffectDurations(withHistory));
}

export function undo(state: GameState): GameState | null {
  return undoLastEntry(state);
}

export function triggerImmediatePower(
  state: GameState,
  shelfIndex: number,
): GameState | null {
  const r = applyImmediatePower(state, shelfIndex);
  if (!r) return null;
  return appendHistory(r.state, r.history);
}

export function triggerTargetedPower(
  state: GameState,
  shelfIndex: number,
  card: Card,
  targetContext: BlackJokerTargetContext,
): GameState | null {
  const r = applyTargetedPower(state, shelfIndex, card, targetContext);
  if (!r) return null;
  return appendHistory(r.state, r.history);
}

export function triggerTargetedColumnPower(
  state: GameState,
  shelfIndex: number,
  columnIndex: number,
): GameState | null {
  const r = applyTargetedColumnPower(state, shelfIndex, columnIndex);
  if (!r) return null;
  return appendHistory(r.state, r.history);
}

export function triggerTargetedFoundationPower(
  state: GameState,
  shelfIndex: number,
  foundationIndex: FoundationIndex,
): GameState | null {
  const r = applyTargetedFoundationPower(state, shelfIndex, foundationIndex);
  if (!r) return null;
  return appendHistory(r.state, r.history);
}

export function triggerCardSwapPower(
  state: GameState,
  shelfIndex: number,
  firstCard: Card,
  secondCard: Card,
  firstContext: BlackJokerTargetContext,
  secondContext: BlackJokerTargetContext,
): GameState | null {
  const r = applyCardSwapPower(state, shelfIndex, firstCard, secondCard, firstContext, secondContext);
  if (!r) return null;
  return appendHistory(r.state, r.history);
}

export type { BlackJokerTargetContext };

export { createInitialState } from "./setup";
export type { GameConfig, GameState } from "./types";
