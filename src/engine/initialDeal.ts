import { appendShelfJoker, createShelfJokerEntry } from "./powers";
import { tableauDealColumnOrder } from "./tableauDealLayout";
import type { GameState, InitialDealEntry, PlacedCard } from "./types";

export type { InitialDealEntry };

/**
 * Emits initial-deal steps in the same order as setup: `q` full left-to-right rounds, then extras on tall
 * columns left-to-right (see {@link tableauDealColumnOrder}).
 */
export function buildInitialDealFlightPlanFromFinalColumns(columns: PlacedCard[][]): InitialDealEntry[] {
  const n = columns.length;
  if (n < 1) return [];
  const tCount = columns.reduce((sum, col) => sum + col.length, 0);
  if (tCount === 0) return [];

  const order = tableauDealColumnOrder(n, tCount);
  const expectedHeights = Array.from({ length: n }, () => 0);
  for (const c of order) {
    expectedHeights[c]!++;
  }
  for (let c = 0; c < n; c++) {
    const h = columns[c]!.length;
    const e = expectedHeights[c]!;
    if (h !== e) {
      throw new Error(
        `buildInitialDealFlightPlanFromFinalColumns: column ${c} length ${h} does not match deal layout (${e})`,
      );
    }
  }

  const perColRow = Array.from({ length: n }, () => 0);
  const out: InitialDealEntry[] = [];
  for (let i = 0; i < tCount; i++) {
    const col = order[i]!;
    const row = perColRow[col]++;
    const placed = columns[col]![row];
    if (!placed) {
      throw new Error(`buildInitialDealFlightPlanFromFinalColumns: missing card at col ${col} row ${row}`);
    }
    out.push({
      card: placed.card,
      tableauColumn: col,
      faceUp: placed.faceUp,
    });
  }
  return out;
}

/**
 * Full initial-deal flight list: uses {@link GameState.initialDealFlightPlan} when set (formatted seed with
 * interleaved shelf jokers), otherwise derives deal order from final tableau columns ({@link tableauDealColumnOrder}).
 */
export function buildInitialDealEntries(state: GameState): InitialDealEntry[] {
  if (state.initialDealFlightPlan?.length) {
    return state.initialDealFlightPlan.map((e) => ({ ...e }));
  }
  return buildInitialDealFlightPlanFromFinalColumns(state.columns);
}

/** Remove ephemeral setup-only fields (persistence / committed play state). */
export function stripEphemeralGameState(state: GameState): GameState {
  const rest = { ...state };
  delete rest.initialDealFlightPlan;
  return rest;
}

/** Empty tableau and history; stock, shelf, foundation, config match `finalGame` (for incremental initial deal UI). */
export function blankTableauSnapshot(finalGame: GameState): GameState {
  return {
    ...stripEphemeralGameState(finalGame),
    columns: finalGame.columns.map(() => []),
    history: [],
    undoCount: 0,
  };
}

/**
 * Base state for animating the initial deal: empty tableau and shelf, stock = final stock plus the
 * sequence of flight cards on top (so each step pops the same card as in `entries`).
 */
export function initialDealAnimationBase(
  finalGame: GameState,
  entries: readonly InitialDealEntry[],
): GameState {
  const fg = stripEphemeralGameState(finalGame);
  const topSegment = [...entries].map((e) => e.card).reverse();
  return {
    ...fg,
    columns: finalGame.columns.map(() => []),
    history: [],
    undoCount: 0,
    shelf: [],
    alignedSetKeys: finalGame.alignedSetKeys,
    stock: [...fg.stock, ...topSegment],
  };
}

/**
 * Applies the first `landedCount` initial-deal pops: each entry removes one card from the stock top
 * and places it on the tableau column or shelf.
 */
export function applyInitialDealEntriesProgress(
  base: GameState,
  entries: readonly InitialDealEntry[],
  landedCount: number,
): GameState {
  if (landedCount < 0 || landedCount > entries.length) {
    throw new Error(
      `applyInitialDealEntriesProgress: landedCount ${landedCount} out of range 0..${entries.length}`,
    );
  }
  if (landedCount === 0) return base;

  const stock = [...base.stock];
  const columns = base.columns.map((col) => [...col]);
  let shelf = [...base.shelf];

  for (let i = 0; i < landedCount; i++) {
    const e = entries[i]!;
    const popped = stock.pop();
    if (popped === undefined) {
      throw new Error(`applyInitialDealEntriesProgress: stock underflow at step ${i}`);
    }
    if (popped.kind !== e.card.kind || popped.id !== e.card.id) {
      throw new Error(`applyInitialDealEntriesProgress: stock top mismatch at step ${i}`);
    }
    if (e.tableauColumn !== null) {
      columns[e.tableauColumn]!.push({ card: e.card, faceUp: e.faceUp });
    } else {
      if (e.card.kind !== "joker") {
        throw new Error("applyInitialDealEntriesProgress: shelf flight requires a joker card");
      }
      shelf = appendShelfJoker(shelf, createShelfJokerEntry(base.config.deckPairId, e.card));
    }
  }

  return { ...base, stock, columns, shelf };
}
