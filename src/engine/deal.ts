import { isJoker } from "./cards";
import type { Card, GameState, HistoryEntry } from "./types";

function totalTableauCards(state: GameState): number {
  return state.columns.reduce((s, col) => s + col.length, 0);
}

function hasEmptyColumn(state: GameState): boolean {
  return state.columns.some((c) => c.length === 0);
}

/**
 * A deal cannot be performed if there are any empty columns unless
 * there are insufficient cards in the tableau to fill them
 * (total tableau cards < columns).
 */
/** Simulate deal: each column needs one non-joker; jokers consume draws but not columns */
function canCompleteDealFromStock(state: GameState): boolean {
  const stack = [...state.stock];
  const need = state.columns.length;
  let filled = 0;
  while (filled < need) {
    const c = stack.pop();
    if (c === undefined) return false;
    if (!isJoker(c)) filled++;
  }
  return true;
}

export function canDealFromStock(state: GameState): boolean {
  if (state.stock.length === 0) return false;
  const { columns } = state;
  if (hasEmptyColumn(state) && totalTableauCards(state) >= columns.length) {
    return false;
  }
  return canCompleteDealFromStock(state);
}

export type DealFromStockResult = {
  state: GameState;
  history: HistoryEntry;
};

/**
 * Deals one face-up card per column from stock (top of stock first).
 * Jokers go to shelf and are replaced by another stock draw for that column.
 */
export function dealFromStock(state: GameState): DealFromStockResult | null {
  if (!canDealFromStock(state)) return null;

  const columns = state.columns.map((c) => [...c]);
  const stock = [...state.stock];
  const shelf = [...state.shelf];
  const entries: { card: Card; tableauColumn: number | null }[] = [];

  for (let col = 0; col < columns.length; col++) {
    let placed = false;
    while (!placed) {
      const card = stock.pop();
      if (card === undefined) {
        throw new Error("dealFromStock: stock exhausted (preflight should prevent)");
      }
      if (isJoker(card)) {
        shelf.push({ card });
        entries.push({ card, tableauColumn: null });
        continue;
      }
      columns[col]!.push({ card, faceUp: true });
      entries.push({ card, tableauColumn: col });
      placed = true;
    }
  }

  const history: HistoryEntry = {
    type: "deal",
    entries,
  };

  return {
    state: {
      ...state,
      columns,
      stock,
      shelf,
      history: state.history,
    },
    history,
  };
}
