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
import { applyNewSetAlignments, withSetPowersOnHistoryEntry } from "./setPowers";
import { createInitialState } from "./setup";
import { snapshotTimedEffectsState, tickEffectDurations } from "./effects";
import { tickExtraColumnLinks } from "./extraColumn";
import type {
  Card,
  FoundationIndex,
  GameConfig,
  GameState,
  HistoryEntry,
  MoveTableauArgs,
  MoveToFoundationArgs,
  TimedEffectsSnapshot,
} from "./types";

export function newGame(config: GameConfig): GameState {
  return createInitialState(config);
}

export function moveTableau(state: GameState, args: MoveTableauArgs): GameState | null {
  const r = applyMoveTableau(state, args);
  if (!r) return null;
  return finalizePlayerMove(r.state, r.history);
}

export function moveToFoundation(
  state: GameState,
  args: MoveToFoundationArgs,
): GameState | null {
  const r = applyMoveToFoundation(state, args);
  if (!r) return null;
  return finalizePlayerMove(r.state, r.history);
}

export function dealStock(state: GameState): GameState | null {
  const r = dealFromStock(state);
  if (!r) return null;
  return finalizePlayerMove(r.state, r.history);
}

function withTimedEffectsBeforeTick(
  entry: HistoryEntry,
  snapshot: TimedEffectsSnapshot,
): HistoryEntry {
  switch (entry.type) {
    case "move_tableau":
    case "move_to_foundation":
    case "deal":
      return { ...entry, timedEffectsBeforeTick: snapshot };
    default:
      return entry;
  }
}

function finalizePlayerMove(state: GameState, historyEntry: HistoryEntry): GameState {
  const { state: withSets, setPowersAdded } = applyNewSetAlignments(state);
  const entry = withSetPowersOnHistoryEntry(historyEntry, setPowersAdded);
  return appendHistory(withSets, entry);
}

export { finalizePlayerMove };

function shouldTickEffectDurations(entry: HistoryEntry): boolean {
  return (
    entry.type === "move_tableau" ||
    entry.type === "move_to_foundation" ||
    entry.type === "deal"
  );
}

function appendHistory(state: GameState, entry: HistoryEntry): GameState {
  const timedSnapshot = shouldTickEffectDurations(entry)
    ? snapshotTimedEffectsState(state)
    : null;
  const entryWithSnapshot =
    timedSnapshot != null ? withTimedEffectsBeforeTick(entry, timedSnapshot) : entry;
  const withHistory = {
    ...state,
    history: [...state.history, entryWithSnapshot],
  };
  if (!shouldTickEffectDurations(entryWithSnapshot)) return withHistory;
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
  const { state: withSets, setPowersAdded } = applyNewSetAlignments(r.state);
  const entry = withSetPowersOnHistoryEntry(r.history, setPowersAdded);
  return appendHistory(withSets, entry);
}

export type { BlackJokerTargetContext };

export { createInitialState } from "./setup";
export type { GameConfig, GameState } from "./types";
