import { isJoker, isRegular } from "./cards";
import type {
  Card,
  FoundationIndex,
  GameState,
  MoveTableauArgs,
  MoveToFoundationArgs,
  PlacedCard,
} from "./types";

function topPlaced(column: PlacedCard[]): PlacedCard | undefined {
  const n = column.length;
  return n > 0 ? column[n - 1] : undefined;
}

/** Bottom index of the contiguous face-up tail (all cards from this index to top are face-up) */
export function bottomFaceUpIndex(column: PlacedCard[]): number {
  let i = column.length - 1;
  while (i >= 0 && column[i]!.faceUp) i--;
  return i + 1;
}

/** Cards from startIndex..end inclusive must be face-up, same-suit, strictly descending ranks */
export function isValidSameSuitDescendingRun(
  column: PlacedCard[],
  startIndex: number,
): boolean {
  if (startIndex < 0 || startIndex >= column.length) return false;
  if (!column[startIndex]!.faceUp) return false;
  for (let i = startIndex; i < column.length; i++) {
    if (!column[i]!.faceUp) return false;
    const c = column[i]!.card;
    if (!isRegular(c)) return false;
    if (i > startIndex) {
      const prev = column[i - 1]!.card;
      if (!isRegular(prev)) return false;
      if (prev.suit !== c.suit) return false;
      if (prev.rank !== c.rank + 1) return false;
    }
  }
  return true;
}

/** Single card or tail run can sit on destTop: dest rank = moving bottom rank + 1; suit any for single? Spec: one rank higher regardless of suit for placement - that's for single card. For group, same suit sequence. */
export function canPlaceOnTableau(
  movingBottom: Card,
  destTop: Card | undefined,
): boolean {
  if (destTop === undefined) return true; // empty column
  if (!isRegular(movingBottom) || !isRegular(destTop)) return false;
  return destTop.rank === movingBottom.rank + 1;
}

function canPlaceRegularOnFoundationPile(
  card: Card & { kind: "regular" },
  pile: PlacedCard[],
): boolean {
  if (pile.length === 0) return card.rank === 1;
  const top = pile[pile.length - 1]!.card;
  if (!isRegular(top)) return false;
  return top.suit === card.suit && card.rank === top.rank + 1;
}

/**
 * Tableau run is stored bottom → top (high rank toward bottom). Foundation builds upward, so cards
 * are placed from the run top (lowest rank) first — iterate the run tail-to-head.
 */
export function canPlaceRunOnFoundationPile(
  run: readonly PlacedCard[],
  pile: readonly PlacedCard[],
): boolean {
  const simulated = [...pile];
  for (let i = run.length - 1; i >= 0; i--) {
    const placed = run[i]!;
    const card = placed.card;
    if (!isRegular(card)) return false;
    if (!canPlaceRegularOnFoundationPile(card, simulated)) return false;
    simulated.push(placed);
  }
  return true;
}

export function canMoveTableau(
  state: GameState,
  args: MoveTableauArgs,
): boolean {
  const { fromColumn, startIndex, toColumn } = args;
  if (fromColumn < 0 || fromColumn >= state.columns.length) return false;
  if (toColumn < 0 || toColumn >= state.columns.length) return false;
  if (fromColumn === toColumn) return false;
  const src = state.columns[fromColumn]!;
  if (startIndex < 0 || startIndex >= src.length) return false;
  if (!isValidSameSuitDescendingRun(src, startIndex)) return false;

  const moving = src.slice(startIndex);
  const bottom = moving[0]!.card;
  if (isJoker(bottom)) return false;

  const dest = state.columns[toColumn]!;
  const destTop = topPlaced(dest)?.card;
  return canPlaceOnTableau(bottom, destTop);
}

export function canMoveToFoundation(
  state: GameState,
  args: MoveToFoundationArgs,
): boolean {
  const { fromColumn, startIndex, foundationIndex } = args;
  if (fromColumn < 0 || fromColumn >= state.columns.length) return false;
  if (foundationIndex < 0 || foundationIndex > 7) return false;
  const src = state.columns[fromColumn]!;
  if (startIndex < 0 || startIndex >= src.length) return false;
  if (!isValidSameSuitDescendingRun(src, startIndex)) return false;

  const run = src.slice(startIndex);
  const pile = state.foundation[foundationIndex]!;
  return canPlaceRunOnFoundationPile(run, pile);
}

export type MoveTableauResult = {
  state: GameState;
  history: GameState["history"][0];
};

/** Applies tableau move; returns new state and history entry. Caller must push history. */
export function applyMoveTableau(
  state: GameState,
  args: MoveTableauArgs,
): MoveTableauResult | null {
  if (!canMoveTableau(state, args)) return null;
  const { fromColumn, startIndex, toColumn } = args;
  const columns = state.columns.map((c) => [...c]);
  const src = columns[fromColumn]!;
  const dest = columns[toColumn]!;
  let revealedWasFaceUp = true;
  if (startIndex > 0) {
    revealedWasFaceUp = src[startIndex - 1]!.faceUp;
  }
  const moved = src.splice(startIndex);
  dest.push(...moved);
  if (startIndex > 0) {
    const below = src[startIndex - 1]!;
    if (!below.faceUp) below.faceUp = true;
  }

  const history = {
    type: "move_tableau" as const,
    fromCol: fromColumn,
    toCol: toColumn,
    startIndex,
    count: moved.length,
    revealedWasFaceUp,
  };

  return {
    state: {
      ...state,
      columns,
    },
    history,
  };
}

export type MoveFoundationResult = {
  state: GameState;
  history: GameState["history"][0];
};

export function applyMoveToFoundation(
  state: GameState,
  args: MoveToFoundationArgs,
): MoveFoundationResult | null {
  if (!canMoveToFoundation(state, args)) return null;
  const { fromColumn, startIndex, foundationIndex } = args;
  const columns = state.columns.map((c) => [...c]);
  const foundation = state.foundation.map((p) => [...p]);
  const src = columns[fromColumn]!;
  let revealedWasFaceUp = true;
  if (startIndex > 0) {
    revealedWasFaceUp = src[startIndex - 1]!.faceUp;
  }
  const moved = src.splice(startIndex);
  if (startIndex > 0) {
    const below = src[startIndex - 1]!;
    if (!below.faceUp) below.faceUp = true;
  }

  const pile = foundation[foundationIndex]!;
  for (let i = moved.length - 1; i >= 0; i--) {
    pile.push(moved[i]!);
  }

  return {
    state: {
      ...state,
      columns,
      foundation,
    },
    history: {
      type: "move_to_foundation",
      fromCol: fromColumn,
      startIndex,
      count: moved.length,
      foundationIndex: foundationIndex as FoundationIndex,
      revealedWasFaceUp,
    },
  };
}
