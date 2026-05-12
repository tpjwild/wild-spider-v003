import { isJoker } from "./cards";
import type { Card, GameState, HistoryEntry, JokerCard, PlacedCard, ShelfJoker } from "./types";

function totalTableauCards(state: GameState): number {
  return state.columns.reduce((s, col) => s + col.length, 0);
}

function hasEmptyColumn(state: GameState): boolean {
  return state.columns.some((c) => c.length === 0);
}

export type DealFlightEntry = { card: Card; tableauColumn: number | null };

/**
 * One deal round: each column gets one face-up regular (jokers go to shelf and draw again for that column),
 * then any jokers now on top of the stock are moved to the shelf so they are not stranded under dealt cards.
 */
function runDealRound(
  columns: PlacedCard[][],
  stock: Card[],
  shelf: ShelfJoker[],
): { columns: PlacedCard[][]; stock: Card[]; shelf: ShelfJoker[]; entries: DealFlightEntry[] } | null {
  const cols = columns.map((c) => [...c]);
  const st = [...stock];
  const sh = [...shelf];
  const entries: DealFlightEntry[] = [];

  for (let col = 0; col < cols.length; col++) {
    let placed = false;
    while (!placed) {
      const card = st.pop();
      if (card === undefined) return null;
      if (isJoker(card)) {
        sh.push({ card });
        entries.push({ card, tableauColumn: null });
        continue;
      }
      cols[col]!.push({ card, faceUp: true });
      entries.push({ card, tableauColumn: col });
      placed = true;
    }
  }

  while (st.length > 0 && isJoker(st[st.length - 1]!)) {
    const card = st.pop()!;
    if (!isJoker(card)) break;
    sh.push({ card });
    entries.push({ card, tableauColumn: null });
  }

  return { columns: cols, stock: st, shelf: sh, entries };
}

export function canDealFromStock(state: GameState): boolean {
  if (state.stock.length === 0) return false;
  const { columns } = state;
  if (hasEmptyColumn(state) && totalTableauCards(state) >= columns.length) {
    return false;
  }
  return (
    runDealRound(
      state.columns.map((c) => [...c]),
      [...state.stock],
      [...state.shelf],
    ) !== null
  );
}

export type DealFromStockResult = {
  state: GameState;
  history: HistoryEntry;
};

/**
 * Indices into `stock` of the first card popped for each upcoming deal, using the same
 * pop order and joker handling as {@link dealFromStock}. Used so each visible stock back
 * stays tied to a fixed upcoming “deal start” card instead of sliding a contiguous window.
 */
export function leadStockIndicesForUpcomingDeals(
  stock: readonly Card[],
  columns: number,
  maxLayers: number,
): number[] {
  if (columns < 1 || stock.length === 0 || maxLayers < 1) return [];

  let stack = stock.map((card, idx) => ({ card, idx }));
  const leads: number[] = [];

  while (stack.length > 0 && leads.length < maxLayers) {
    const topIdx = stack[stack.length - 1]!.idx;
    const trial = stack.map((x) => ({ ...x }));

    for (let col = 0; col < columns; col++) {
      let placed = false;
      while (!placed) {
        const popped = trial.pop();
        if (popped === undefined) return leads;
        if (!isJoker(popped.card)) placed = true;
      }
    }
    while (trial.length > 0 && isJoker(trial[trial.length - 1]!.card)) {
      trial.pop();
    }

    leads.push(topIdx);
    stack = trial;
  }

  return leads;
}

/** Deals one face-up card per column from stock (top first); jokers to shelf with a replacement draw per column; then any jokers left on top of the stock go to the shelf. */
export function dealFromStock(state: GameState): DealFromStockResult | null {
  if (state.stock.length === 0) return null;
  if (hasEmptyColumn(state) && totalTableauCards(state) >= state.columns.length) {
    return null;
  }

  const r = runDealRound(
    state.columns.map((c) => [...c]),
    [...state.stock],
    [...state.shelf],
  );
  if (!r) return null;

  const history: HistoryEntry = {
    type: "deal",
    entries: r.entries,
  };

  return {
    state: {
      ...state,
      columns: r.columns,
      stock: r.stock,
      shelf: r.shelf,
      history: state.history,
    },
    history,
  };
}

/**
 * Applies the first `landedCount` stock pops from a deal's `entries` list onto `state`
 * (which must be the pre-deal snapshot). Used to drive incremental deal-from-stock UI.
 */
export function applyDealEntriesProgress(
  state: GameState,
  entries: readonly DealFlightEntry[],
  landedCount: number,
): GameState {
  if (landedCount < 0 || landedCount > entries.length) {
    throw new Error(`applyDealEntriesProgress: landedCount ${landedCount} out of range 0..${entries.length}`);
  }
  if (landedCount === 0) return state;

  const columns = state.columns.map((c) => [...c]);
  const stock = [...state.stock];
  const shelf = [...state.shelf];

  for (let i = 0; i < landedCount; i++) {
    const e = entries[i]!;
    const popped = stock.pop();
    if (!popped || popped.kind !== e.card.kind || popped.id !== e.card.id) {
      throw new Error(`applyDealEntriesProgress: stock top mismatch at step ${i}`);
    }
    if (e.tableauColumn === null) {
      if (popped.kind !== "joker") throw new Error("applyDealEntriesProgress: expected joker to shelf");
      shelf.push({ card: popped as JokerCard });
    } else {
      columns[e.tableauColumn]!.push({ card: popped, faceUp: true });
    }
  }

  return { ...state, columns, stock, shelf };
}
