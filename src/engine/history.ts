import {
  removeCardEffectsAdded,
  removeColumnEffectsAdded,
} from "./effects";
import { restoreShelfCharge } from "./powers";
import type { GameState, HistoryEntry } from "./types";

function undoMoveTableau(
  state: GameState,
  entry: HistoryEntry & { type: "move_tableau" },
): GameState {
  const columns = state.columns.map((c) => [...c]);
  const dest = columns[entry.toCol]!;
  const moved = dest.splice(dest.length - entry.count, entry.count);
  const src = columns[entry.fromCol]!;
  src.splice(entry.startIndex, 0, ...moved);
  if (entry.startIndex > 0) {
    src[entry.startIndex - 1]!.faceUp = entry.revealedWasFaceUp;
  }
  return { ...state, columns };
}

function undoMoveToFoundation(
  state: GameState,
  entry: HistoryEntry & { type: "move_to_foundation" },
): GameState {
  const columns = state.columns.map((c) => [...c]);
  const foundation = state.foundation.map((p) => [...p]);
  const pile = foundation[entry.foundationIndex]!;
  const placed = pile.pop()!;
  const src = columns[entry.fromCol]!;
  src.push(placed);
  if (src.length >= 2) {
    src[src.length - 2]!.faceUp = entry.revealedWasFaceUp;
  }
  return { ...state, columns, foundation };
}

function undoDeal(
  state: GameState,
  entry: HistoryEntry & { type: "deal" },
): GameState {
  const columns = state.columns.map((c) => [...c]);
  const stock = [...state.stock];
  const shelf = [...state.shelf];

  for (let i = entry.entries.length - 1; i >= 0; i--) {
    const e = entry.entries[i]!;
    if (e.tableauColumn === null) {
      shelf.pop();
      stock.push(e.card);
    } else {
      columns[e.tableauColumn]!.pop();
      stock.push(e.card);
    }
  }

  return { ...state, columns, stock, shelf };
}

function undoPowerTrigger(
  state: GameState,
  entry: HistoryEntry & { type: "power_trigger" },
): GameState {
  let next = removeCardEffectsAdded(state, entry.cardEffectsAdded);
  next = removeColumnEffectsAdded(next, entry.columnEffectsAdded);
  next = restoreShelfCharge(next, entry.shelfIndex, entry.chargesBefore);
  return next;
}

/** Reverts the last history entry without mutating the input. */
export function undoLastEntry(state: GameState): GameState | null {
  if (state.history.length === 0) return null;
  const h = state.history[state.history.length - 1]!;
  let next: GameState;
  if (h.type === "move_tableau") next = undoMoveTableau(state, h);
  else if (h.type === "move_to_foundation") next = undoMoveToFoundation(state, h);
  else if (h.type === "power_trigger") next = undoPowerTrigger(state, h);
  else next = undoDeal(state, h);

  return {
    ...next,
    undoCount: state.undoCount + 1,
    history: state.history.slice(0, -1),
  };
}
