import type { Card, CardEffectKey, EffectId, GameState, Rank } from "./types";
import { isRegular } from "./cards";

export function cardEffectKey(card: Card): CardEffectKey {
  return card.kind === "regular" ? `r:${card.id}` : `j:${card.id}`;
}

export function cardEffectsForKey(state: GameState, key: CardEffectKey): EffectId[] {
  return state.cardEffects[key] ?? [];
}

export function cardEffectsForCard(state: GameState, card: Card): EffectId[] {
  return cardEffectsForKey(state, cardEffectKey(card));
}

export function columnEffectsForColumn(state: GameState, columnIndex: number): EffectId[] {
  return state.columnEffects[columnIndex] ?? [];
}

export function hasCardEffect(state: GameState, card: Card, effect: EffectId): boolean {
  return cardEffectsForCard(state, card).includes(effect);
}

export function emptyEffectsState(): Pick<GameState, "cardEffects" | "columnEffects"> {
  return { cardEffects: {}, columnEffects: {} };
}

/** All regular cards currently in play (tableau, foundation, stock). */
export function allRegularCardsInPlay(state: GameState): Card[] {
  const out: Card[] = [];
  for (const col of state.columns) {
    for (const p of col) {
      if (isRegular(p.card)) out.push(p.card);
    }
  }
  for (const pile of state.foundation) {
    for (const p of pile) {
      if (isRegular(p.card)) out.push(p.card);
    }
  }
  for (const c of state.stock) {
    if (isRegular(c)) out.push(c);
  }
  return out;
}

export function allRegularCardsWithRank(state: GameState, rank: Rank): Card[] {
  return allRegularCardsInPlay(state).filter(
    (c): c is Card & { kind: "regular" } => isRegular(c) && c.rank === rank,
  );
}

type EffectAddition = { key: CardEffectKey; effect: EffectId };

/**
 * Adds `effect` to the card keyed by `key` if not already present.
 * Returns updated state and whether the effect was newly added.
 */
export function addCardEffect(
  state: GameState,
  key: CardEffectKey,
  effect: EffectId,
): { state: GameState; added: EffectAddition | null } {
  const prev = state.cardEffects[key] ?? [];
  if (prev.includes(effect)) {
    return { state, added: null };
  }
  const nextList = [...prev, effect];
  return {
    state: {
      ...state,
      cardEffects: { ...state.cardEffects, [key]: nextList },
    },
    added: { key, effect },
  };
}

export function addCardEffectForCard(
  state: GameState,
  card: Card,
  effect: EffectId,
): { state: GameState; added: EffectAddition | null } {
  return addCardEffect(state, cardEffectKey(card), effect);
}

export function removeCardEffect(
  state: GameState,
  key: CardEffectKey,
  effect: EffectId,
): GameState {
  const prev = state.cardEffects[key];
  if (!prev?.includes(effect)) return state;
  const nextList = prev.filter((e) => e !== effect);
  const cardEffects = { ...state.cardEffects };
  if (nextList.length === 0) {
    delete cardEffects[key];
  } else {
    cardEffects[key] = nextList;
  }
  return { ...state, cardEffects };
}

export function removeCardEffectsAdded(
  state: GameState,
  added: readonly EffectAddition[],
): GameState {
  let next = state;
  for (const { key, effect } of added) {
    next = removeCardEffect(next, key, effect);
  }
  return next;
}

export function addColumnEffect(
  state: GameState,
  columnIndex: number,
  effect: EffectId,
): { state: GameState; added: { columnIndex: number; effect: EffectId } | null } {
  const prev = state.columnEffects[columnIndex] ?? [];
  if (prev.includes(effect)) {
    return { state, added: null };
  }
  return {
    state: {
      ...state,
      columnEffects: {
        ...state.columnEffects,
        [columnIndex]: [...prev, effect],
      },
    },
    added: { columnIndex, effect },
  };
}

export function removeColumnEffect(
  state: GameState,
  columnIndex: number,
  effect: EffectId,
): GameState {
  const prev = state.columnEffects[columnIndex];
  if (!prev?.includes(effect)) return state;
  const nextList = prev.filter((e) => e !== effect);
  const columnEffects = { ...state.columnEffects };
  if (nextList.length === 0) {
    delete columnEffects[columnIndex];
  } else {
    columnEffects[columnIndex] = nextList;
  }
  return { ...state, columnEffects };
}

export function removeColumnEffectsAdded(
  state: GameState,
  added: readonly { columnIndex: number; effect: EffectId }[],
): GameState {
  let next = state;
  for (const { columnIndex, effect } of added) {
    next = removeColumnEffect(next, columnIndex, effect);
  }
  return next;
}
