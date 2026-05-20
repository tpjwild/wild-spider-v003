import { dealFromStock } from "./deal";
import { undoLastEntry } from "./history";
import {
  triggerImmediatePower as applyImmediatePower,
  triggerTargetedPower as applyTargetedPower,
  type BlackJokerTargetContext,
} from "./powers";
import { applyMoveTableau, applyMoveToFoundation } from "./moves";
import { createInitialState } from "./setup";
import type {
  Card,
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

function appendHistory(state: GameState, entry: HistoryEntry): GameState {
  return {
    ...state,
    history: [...state.history, entry],
  };
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

export type { BlackJokerTargetContext };

export { createInitialState } from "./setup";
export type { GameConfig, GameState } from "./types";
