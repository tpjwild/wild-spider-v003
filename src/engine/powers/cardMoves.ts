import { isRegular } from "@/engine/cards";
import { canPlaceOnTableauWithEffects } from "@/engine/tableauEffects";
import type {
  Card,
  CardSlotSnapshot,
  FoundationIndex,
  GameState,
  PlacedCard,
} from "@/engine/types";

export function isCardInFoundation(state: GameState, card: Card): boolean {
  if (!isRegular(card)) return false;
  return state.foundation.some((pile) =>
    pile.some((p) => p.card.kind === "regular" && p.card.id === card.id),
  );
}

export function isCardOnShelf(state: GameState, card: Card): boolean {
  return state.shelf.some((s) => s.card.kind === card.kind && s.card.id === card.id);
}

function isOnTableau(state: GameState, card: Card): boolean {
  if (!isRegular(card)) return false;
  return state.columns.some((col) =>
    col.some((p) => p.card.kind === "regular" && p.card.id === card.id),
  );
}

function isInStock(state: GameState, card: Card): boolean {
  return state.stock.some((c) => c.kind === card.kind && c.id === card.id);
}

function topPlaced(column: PlacedCard[]): PlacedCard | undefined {
  const n = column.length;
  return n > 0 ? column[n - 1] : undefined;
}

/** Leftmost column index where `card` may be placed on the tableau top (or empty column). */
export function findLeftmostLegalTableauColumn(
  state: GameState,
  card: Card & { kind: "regular" },
): number | null {
  for (let col = 0; col < state.columns.length; col++) {
    const destTop = topPlaced(state.columns[col]!)?.card;
    const destRegular =
      destTop !== undefined && isRegular(destTop) ? destTop : undefined;
    if (
      canPlaceOnTableauWithEffects(state, card, -1, destRegular, col)
    ) {
      return col;
    }
  }
  return null;
}

export type FoundationReturnResult = {
  state: GameState;
  foundationReturnUndo: {
    foundationIndex: FoundationIndex;
    toColumn: number;
    placed: PlacedCard;
  };
};

/** Moves the top card of a non-empty foundation pile to the leftmost legal tableau column. */
export function applyFoundationReturn(
  state: GameState,
  foundationIndex: FoundationIndex,
): FoundationReturnResult | null {
  const pile = state.foundation[foundationIndex]!;
  if (pile.length === 0) return null;
  const placed = pile[pile.length - 1]!;
  const card = placed.card;
  if (!isRegular(card)) return null;

  const toColumn = findLeftmostLegalTableauColumn(state, card);
  if (toColumn === null) return null;

  const foundation = state.foundation.map((p, i) =>
    i === foundationIndex ? p.slice(0, -1) : [...p],
  );
  const columns = state.columns.map((c) => [...c]);
  columns[toColumn]!.push({ card, faceUp: true });

  return {
    state: { ...state, foundation, columns },
    foundationReturnUndo: { foundationIndex, toColumn, placed },
  };
}

export function isValidFoundationReturnTarget(
  state: GameState,
  foundationIndex: FoundationIndex,
): boolean {
  if (foundationIndex < 0 || foundationIndex > 7) return false;
  const pile = state.foundation[foundationIndex]!;
  if (pile.length === 0) return false;
  const card = pile[pile.length - 1]!.card;
  if (!isRegular(card)) return false;
  return findLeftmostLegalTableauColumn(state, card) !== null;
}

export function locateCardForSwap(
  state: GameState,
  card: Card,
): CardSlotSnapshot | null {
  if (!isRegular(card) || isCardInFoundation(state, card) || isCardOnShelf(state, card)) {
    return null;
  }
  for (let columnIndex = 0; columnIndex < state.columns.length; columnIndex++) {
    const col = state.columns[columnIndex]!;
    for (let index = 0; index < col.length; index++) {
      const p = col[index]!;
      if (p.card.kind === card.kind && p.card.id === card.id) {
        return { zone: "tableau", columnIndex, index, placed: { ...p } };
      }
    }
  }
  for (let stockIndex = 0; stockIndex < state.stock.length; stockIndex++) {
    const c = state.stock[stockIndex]!;
    if (c.kind === card.kind && c.id === card.id) {
      return { zone: "stock", stockIndex, card: c };
    }
  }
  return null;
}

export function isValidCardSwapTarget(state: GameState, card: Card): boolean {
  return locateCardForSwap(state, card) !== null;
}

function writeSlot(
  state: GameState,
  slot: CardSlotSnapshot,
): GameState {
  if (slot.zone === "tableau") {
    const columns = state.columns.map((c) => [...c]);
    columns[slot.columnIndex]![slot.index] = { ...slot.placed };
    return { ...state, columns };
  }
  const stock = [...state.stock];
  stock[slot.stockIndex] = slot.card;
  return { ...state, stock };
}

function readSlot(state: GameState, slot: CardSlotSnapshot): CardSlotSnapshot {
  if (slot.zone === "tableau") {
    const placed = state.columns[slot.columnIndex]![slot.index]!;
    return { zone: "tableau", columnIndex: slot.columnIndex, index: slot.index, placed: { ...placed } };
  }
  const card = state.stock[slot.stockIndex]!;
  return { zone: "stock", stockIndex: slot.stockIndex, card };
}

function cardFromSlot(slot: CardSlotSnapshot): Card {
  return slot.zone === "tableau" ? slot.placed.card : slot.card;
}

/** Face-up at a tableau slot; stock slots are always treated as face-down. */
function faceUpAtSlot(slot: CardSlotSnapshot): boolean {
  return slot.zone === "tableau" ? slot.placed.faceUp : false;
}

function placedWithFace(card: Card, faceUp: boolean): PlacedCard {
  return { card, faceUp };
}

export type CardSwapResult = {
  state: GameState;
  cardSwapUndo: { slotA: CardSlotSnapshot; slotB: CardSlotSnapshot };
};

/** Swaps two cards at their current tableau or stock positions. */
export function applyCardSwap(
  state: GameState,
  cardA: Card,
  cardB: Card,
): CardSwapResult | null {
  const slotA = locateCardForSwap(state, cardA);
  const slotB = locateCardForSwap(state, cardB);
  if (!slotA || !slotB) return null;
  if (
    cardA.kind === cardB.kind &&
    cardA.id === cardB.id
  ) {
    return null;
  }

  const undoA = readSlot(state, slotA);
  const undoB = readSlot(state, slotB);

  let next = state;
  const faceAtA = faceUpAtSlot(undoA);
  const faceAtB = faceUpAtSlot(undoB);
  const cardAtA = cardFromSlot(undoA);
  const cardAtB = cardFromSlot(undoB);

  if (slotA.zone === "tableau" && slotB.zone === "tableau") {
    const columns = state.columns.map((c) => [...c]);
    columns[slotA.columnIndex]![slotA.index] = placedWithFace(cardAtB, faceAtA);
    columns[slotB.columnIndex]![slotB.index] = placedWithFace(cardAtA, faceAtB);
    next = { ...state, columns };
  } else if (slotA.zone === "stock" && slotB.zone === "stock") {
    const stock = [...state.stock];
    stock[slotA.stockIndex] = cardAtB;
    stock[slotB.stockIndex] = cardAtA;
    next = { ...state, stock };
  } else if (slotA.zone === "tableau" && slotB.zone === "stock") {
    const columns = state.columns.map((c) => [...c]);
    columns[slotA.columnIndex]![slotA.index] = placedWithFace(cardAtB, faceAtA);
    const stock = [...state.stock];
    stock[slotB.stockIndex] = cardAtA;
    next = { ...state, columns, stock };
  } else if (slotA.zone === "stock" && slotB.zone === "tableau") {
    const columns = state.columns.map((c) => [...c]);
    columns[slotB.columnIndex]![slotB.index] = placedWithFace(cardAtA, faceAtB);
    const stock = [...state.stock];
    stock[slotA.stockIndex] = cardAtB;
    next = { ...state, columns, stock };
  } else {
    return null;
  }

  return {
    state: next,
    cardSwapUndo: { slotA: undoA, slotB: undoB },
  };
}

export function undoFoundationReturn(
  state: GameState,
  undo: NonNullable<FoundationReturnResult["foundationReturnUndo"]>,
): GameState {
  const columns = state.columns.map((c) => [...c]);
  const col = columns[undo.toColumn]!;
  if (col.length === 0) return state;
  const top = col[col.length - 1]!;
  if (
    top.card.kind !== undo.placed.card.kind ||
    top.card.id !== undo.placed.card.id
  ) {
    return state;
  }
  col.pop();
  const foundation = state.foundation.map((p, i) =>
    i === undo.foundationIndex ? [...p, undo.placed] : [...p],
  );
  return { ...state, columns, foundation };
}

export function undoCardSwap(
  state: GameState,
  undo: { slotA: CardSlotSnapshot; slotB: CardSlotSnapshot },
): GameState {
  let next = writeSlot(state, undo.slotA);
  next = writeSlot(next, undo.slotB);
  return next;
}

export function isValidCardSwapTargetContext(
  state: GameState,
  card: Card,
  targetContext: {
    tableauCard?: boolean;
    inStockPopup?: boolean;
    deckPopupCard?: boolean;
  },
): boolean {
  if (!isValidCardSwapTarget(state, card)) return false;
  if (targetContext.tableauCard && isOnTableau(state, card)) return true;
  if (targetContext.inStockPopup && isInStock(state, card)) return true;
  if (
    targetContext.deckPopupCard &&
    (isInStock(state, card) || isOnTableau(state, card)) &&
    !isCardInFoundation(state, card)
  ) {
    return true;
  }
  return false;
}
