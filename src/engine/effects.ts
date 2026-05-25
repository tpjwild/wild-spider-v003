import { tickExtraColumnLinks } from "./extraColumn";
import type {
  AppliedEffect,
  Card,
  CardEffectKey,
  EffectId,
  GameState,
  Rank,
} from "./types";
import { isRegular } from "./cards";

export function cardEffectKey(card: Card): CardEffectKey {
  return card.kind === "regular" ? `r:${card.id}` : `j:${card.id}`;
}

export function appliedEffect(
  effect: EffectId,
  movesRemaining: number | null = null,
): AppliedEffect {
  return { effect, movesRemaining };
}

function effectIds(list: readonly AppliedEffect[]): EffectId[] {
  return list.map((e) => e.effect);
}

function hasAppliedEffect(list: readonly AppliedEffect[], effect: EffectId): boolean {
  return list.some((e) => e.effect === effect);
}

export function cardEffectsForKey(state: GameState, key: CardEffectKey): EffectId[] {
  return effectIds(state.cardEffects[key] ?? []);
}

export function cardEffectsForCard(state: GameState, card: Card): EffectId[] {
  return cardEffectsForKey(state, cardEffectKey(card));
}

export function columnEffectsForColumn(state: GameState, columnIndex: number): EffectId[] {
  return effectIds(state.columnEffects[columnIndex] ?? []);
}

export function hasCardEffect(state: GameState, card: Card, effect: EffectId): boolean {
  return hasAppliedEffect(state.cardEffects[cardEffectKey(card)] ?? [], effect);
}

/** Card effects plus any effects on the tableau column the card currently occupies. */
export function effectsForCardInColumn(
  state: GameState,
  columnIndex: number,
  card: Card,
): EffectId[] {
  const merged = [...cardEffectsForCard(state, card), ...columnEffectsForColumn(state, columnIndex)];
  return [...new Set(merged)];
}

export function hasEffectOnCardInColumn(
  state: GameState,
  columnIndex: number,
  card: Card,
  effect: EffectId,
): boolean {
  return effectsForCardInColumn(state, columnIndex, card).includes(effect);
}

export function emptyEffectsState(): Pick<GameState, "cardEffects" | "columnEffects"> {
  return { cardEffects: {}, columnEffects: {} };
}

const LEGACY_EFFECT_ID_MAP: Record<string, EffectId> = {
  bonusColumn: "extraColumn",
};

function normalizeEffectId(effect: string): EffectId {
  return LEGACY_EFFECT_ID_MAP[effect] ?? (effect as EffectId);
}

function normalizeAppliedEffectList(raw: unknown): AppliedEffect[] {
  if (!Array.isArray(raw)) return [];
  const out: AppliedEffect[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      out.push({ effect: normalizeEffectId(item), movesRemaining: null });
      continue;
    }
    if (item && typeof item === "object" && "effect" in item) {
      const effect = normalizeEffectId(String((item as AppliedEffect).effect));
      const movesRemaining =
        (item as AppliedEffect).movesRemaining === undefined
          ? null
          : (item as AppliedEffect).movesRemaining;
      out.push({ effect, movesRemaining });
    }
  }
  return out;
}

function normalizeEffectRecord<T extends string | number>(
  raw: unknown,
): Record<T, AppliedEffect[]> {
  if (!raw || typeof raw !== "object") return {} as Record<T, AppliedEffect[]>;
  const out = {} as Record<T, AppliedEffect[]>;
  for (const [key, val] of Object.entries(raw)) {
    out[key as T] = normalizeAppliedEffectList(val);
  }
  return out;
}

/** Upgrades persisted saves that stored plain {@link EffectId} arrays. */
export function normalizeEffectsState(
  state: Pick<GameState, "cardEffects" | "columnEffects">,
): Pick<GameState, "cardEffects" | "columnEffects"> {
  return {
    cardEffects: normalizeEffectRecord<CardEffectKey>(state.cardEffects),
    columnEffects: normalizeEffectRecord<number>(state.columnEffects),
  };
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

export type EffectAddition = { key: CardEffectKey; effect: EffectId };

function tickAppliedList(list: readonly AppliedEffect[]): AppliedEffect[] {
  return tickAppliedListExcluding(list, () => false);
}

function tickAppliedListExcluding(
  list: readonly AppliedEffect[],
  excludeEntry: (entry: AppliedEffect) => boolean,
): AppliedEffect[] {
  const out: AppliedEffect[] = [];
  for (const entry of list) {
    if (entry.movesRemaining === null) {
      out.push(entry);
      continue;
    }
    if (excludeEntry(entry)) {
      out.push(entry);
      continue;
    }
    const next = entry.movesRemaining - 1;
    if (next > 0) {
      out.push({ ...entry, movesRemaining: next });
    }
  }
  return out;
}

export type TargetCommitTickExcludes = {
  cardEffectsAdded?: readonly EffectAddition[];
  columnEffectsAdded?: readonly { columnIndex: number; effect: EffectId }[];
  extraColumnLinkParentsAdded?: readonly number[];
};

/**
 * After a targeted power commit: tick existing timed card/column effects and extra-column links,
 * skipping effects and parent links added on that commit.
 */
export function tickEffectDurationsOnTargetCommit(
  state: GameState,
  excludes: TargetCommitTickExcludes = {},
): GameState {
  const cardAdded = excludes.cardEffectsAdded ?? [];
  const columnAdded = excludes.columnEffectsAdded ?? [];

  const cardEffects: Record<CardEffectKey, AppliedEffect[]> = {};
  for (const [key, list] of Object.entries(state.cardEffects)) {
    const next = tickAppliedListExcluding(list, (entry) =>
      cardAdded.some((a) => a.key === key && a.effect === entry.effect),
    );
    if (next.length > 0) cardEffects[key as CardEffectKey] = next;
  }

  const columnEffects: Record<number, AppliedEffect[]> = {};
  for (const [colKey, list] of Object.entries(state.columnEffects)) {
    const col = Number(colKey);
    const next = tickAppliedListExcluding(list, (entry) =>
      columnAdded.some((a) => a.columnIndex === col && a.effect === entry.effect),
    );
    if (next.length > 0) columnEffects[col] = next;
  }

  let next = { ...state, cardEffects, columnEffects };
  next = tickExtraColumnLinks(next, {
    excludeParentIndices: excludes.extraColumnLinkParentsAdded,
  });
  return next;
}

/** Decrement timed effects after a player move (tableau, foundation, deal). */
export function tickEffectDurations(state: GameState): GameState {
  const cardEffects: Record<CardEffectKey, AppliedEffect[]> = {};
  for (const [key, list] of Object.entries(state.cardEffects)) {
    const next = tickAppliedList(list);
    if (next.length > 0) cardEffects[key as CardEffectKey] = next;
  }
  const columnEffects: Record<number, AppliedEffect[]> = {};
  for (const [colKey, list] of Object.entries(state.columnEffects)) {
    const next = tickAppliedList(list);
    if (next.length > 0) columnEffects[Number(colKey)] = next;
  }
  return { ...state, cardEffects, columnEffects };
}

/**
 * Adds `effect` to the card keyed by `key` if not already present.
 * Returns updated state and whether the effect was newly added.
 */
export function addCardEffect(
  state: GameState,
  key: CardEffectKey,
  effect: EffectId,
  movesRemaining: number | null = null,
): { state: GameState; added: EffectAddition | null } {
  const prev = state.cardEffects[key] ?? [];
  if (hasAppliedEffect(prev, effect)) {
    return { state, added: null };
  }
  const nextList = [...prev, { effect, movesRemaining }];
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
  movesRemaining: number | null = null,
): { state: GameState; added: EffectAddition | null } {
  return addCardEffect(state, cardEffectKey(card), effect, movesRemaining);
}

export function removeCardEffect(
  state: GameState,
  key: CardEffectKey,
  effect: EffectId,
): GameState {
  const prev = state.cardEffects[key];
  if (!prev?.some((e) => e.effect === effect)) return state;
  const nextList = prev.filter((e) => e.effect !== effect);
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
  movesRemaining: number | null = null,
): { state: GameState; added: { columnIndex: number; effect: EffectId } | null } {
  const prev = state.columnEffects[columnIndex] ?? [];
  if (hasAppliedEffect(prev, effect)) {
    return { state, added: null };
  }
  return {
    state: {
      ...state,
      columnEffects: {
        ...state.columnEffects,
        [columnIndex]: [...prev, { effect, movesRemaining }],
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
  if (!prev?.some((e) => e.effect === effect)) return state;
  const nextList = prev.filter((e) => e.effect !== effect);
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
