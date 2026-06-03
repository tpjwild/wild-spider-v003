import { jokerDefinitionForInGameId } from "@/content/deckPairs";
import {
  EFFECT_HALF_WILD,
  EFFECT_SKIP1,
  EFFECT_SKIP2,
  EFFECT_TRANSPARENT,
  EFFECT_WILD,
} from "@/content/effectDefinitions";
import {
  getPowerDefinition,
  POWER_2_KINGS_TRANSPARENT,
  POWER_ALL_KINGS_TRANSPARENT,
  POWER_CARD_SWAP,
  POWER_EXTRA_COLUMN,
  POWER_FOUNDATION_RETURN,
  POWER_SELECTED_CARD_HALFWILD,
  POWER_SELECTED_CARD_SKIP1,
  POWER_SELECTED_CARD_SKIP2,
  POWER_SELECTED_CARD_TRANSPARENT,
  POWER_SELECTED_CARD_WILD,
  POWER_SELECTED_COLUMN_HALFWILD,
  POWER_SELECTED_COLUMN_SKIP1,
  POWER_SELECTED_COLUMN_SKIP2,
  POWER_SELECTED_COLUMN_TRANSPARENT,
  POWER_SELECTED_COLUMN_WILD,
  normalizePowerId,
  powerIsCardSwap,
  powerTargetsFoundationSlot,
  powerTargetsTableauColumn,
  type PowerTargetKind,
} from "@/content/powerDefinitions";
import {
  applyCardSwap,
  applyFoundationReturn,
  isCardInFoundation,
  isValidCardSwapTargetContext,
  isValidFoundationReturnTarget,
} from "@/engine/powers/cardMoves";
import { buildDoubleDeck, isRegular } from "@/engine/cards";
import { applyExtraColumn, canTargetExtraColumnParent } from "@/engine/extraColumn";
import {
  addCardEffectForCard,
  addColumnEffect,
  hasCardEffect,
  tickEffectDurationsOnTargetCommit,
} from "@/engine/effects";
import { snapshotExtraColumnTopology } from "@/engine/extraColumnTopology";
import {
  resolvedSetPowerId,
  setPowerEffectDuration,
  syncShelfSetPowerFromCatalog,
} from "@/engine/setPowers";
import { createMulberry32, hashSeedToUint32, shuffleInPlace } from "@/engine/seededRng";
import type {
  Card,
  CardEffectKey,
  EffectId,
  FoundationIndex,
  GameState,
  HistoryEntry,
  JokerCard,
  JokerPortraitSlot,
  PowerId,
  RegularCard,
  ShelfEntry,
  ShelfJoker,
  ShelfSetPower,
} from "@/engine/types";

// —— Effect applications —————————————————————————————————————————————————————

export type AppliedCardEffect = { key: CardEffectKey; effect: EffectId };
export type AppliedColumnEffect = { columnIndex: number; effect: EffectId };

export function applyMakeAllKingsTransparent(
  state: GameState,
  movesRemaining: number | null = null,
): {
  state: GameState;
  cardEffectsAdded: AppliedCardEffect[];
} {
  const kings = buildDoubleDeck().filter((c) => c.rank === 13);
  let next = state;
  const cardEffectsAdded: AppliedCardEffect[] = [];
  for (const card of kings) {
    const r = addCardEffectForCard(next, card, EFFECT_TRANSPARENT, movesRemaining);
    next = r.state;
    if (r.added) cardEffectsAdded.push(r.added);
  }
  return { state: next, cardEffectsAdded };
}

function isKingOnTableauFaceUp(state: GameState, king: RegularCard): boolean {
  return state.columns.some((col) =>
    col.some((p) => p.card.kind === "regular" && p.card.id === king.id && p.faceUp),
  );
}

function isKingInFoundation(state: GameState, king: RegularCard): boolean {
  return state.foundation.some((pile) =>
    pile.some((p) => p.card.kind === "regular" && p.card.id === king.id),
  );
}

function isKingFaceDownInFoundation(state: GameState, king: RegularCard): boolean {
  return state.foundation.some((pile) =>
    pile.some((p) => p.card.kind === "regular" && p.card.id === king.id && !p.faceUp),
  );
}

function isKingInStock(state: GameState, king: RegularCard): boolean {
  return state.stock.some((c) => c.kind === "regular" && c.id === king.id);
}

/**
 * Preference tier for picking kings (lower = chosen first).
 * Order from last to first in spec: stock/face-down foundation, face-up tableau, foundation, already transparent.
 */
function kingTransparentPickTier(state: GameState, king: RegularCard): number {
  if (hasCardEffect(state, king, EFFECT_TRANSPARENT)) return 3;
  if (isKingInFoundation(state, king)) return 2;
  if (isKingOnTableauFaceUp(state, king)) return 1;
  if (isKingInStock(state, king) || isKingFaceDownInFoundation(state, king)) return 0;
  return 1;
}

/** Makes two kings transparent, preferring stock / face-down foundation, then tableau, then foundation. */
export function applyMakeTwoKingsTransparent(
  state: GameState,
  movesRemaining: number | null = null,
): {
  state: GameState;
  cardEffectsAdded: AppliedCardEffect[];
} {
  const kings = buildDoubleDeck().filter((c): c is RegularCard => c.rank === 13);
  const rng = createMulberry32(hashSeedToUint32(`${state.config.seed}:twoKings`));
  const byTier: RegularCard[][] = [[], [], [], []];
  for (const king of kings) {
    byTier[kingTransparentPickTier(state, king)]!.push(king);
  }
  for (const tier of byTier) {
    shuffleInPlace(tier, rng);
  }
  const picked: RegularCard[] = [];
  for (const tier of byTier) {
    for (const king of tier) {
      if (picked.length >= 2) break;
      picked.push(king);
    }
    if (picked.length >= 2) break;
  }

  let next = state;
  const cardEffectsAdded: AppliedCardEffect[] = [];
  for (const card of picked) {
    const r = addCardEffectForCard(next, card, EFFECT_TRANSPARENT, movesRemaining);
    next = r.state;
    if (r.added) cardEffectsAdded.push(r.added);
  }
  return { state: next, cardEffectsAdded };
}

export function applyCardEffect(
  state: GameState,
  card: Card,
  effect: EffectId,
  movesRemaining: number | null = null,
): { state: GameState; cardEffectsAdded: AppliedCardEffect[] } {
  const r = addCardEffectForCard(state, card, effect, movesRemaining);
  return {
    state: r.state,
    cardEffectsAdded: r.added ? [r.added] : [],
  };
}

export function applyMakeCardTransparent(
  state: GameState,
  card: Card,
): { state: GameState; cardEffectsAdded: AppliedCardEffect[] } {
  return applyCardEffect(state, card, EFFECT_TRANSPARENT);
}

export function applyColumnEffect(
  state: GameState,
  columnIndex: number,
  effect: EffectId,
  movesRemaining: number | null = null,
): { state: GameState; columnEffectsAdded: AppliedColumnEffect[] } {
  const r = addColumnEffect(state, columnIndex, effect, movesRemaining);
  return {
    state: r.state,
    columnEffectsAdded: r.added ? [r.added] : [],
  };
}

function isFaceDownOnTableau(state: GameState, card: Card): boolean {
  if (!isRegular(card)) return false;
  return state.columns.some((col) =>
    col.some((p) => p.card.kind === "regular" && p.card.id === card.id && !p.faceUp),
  );
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

function effectForTargetedPower(powerId: PowerId): EffectId | null {
  return getPowerDefinition(powerId).appliesEffect ?? null;
}

export function cardAlreadyHasTargetedPowerEffect(
  state: GameState,
  powerId: PowerId,
  card: Card,
): boolean {
  const effect = effectForTargetedPower(normalizePowerId(powerId));
  if (!effect) return false;
  return hasCardEffect(state, card, effect);
}

export function columnAlreadyHasTargetedPowerEffect(
  state: GameState,
  powerId: PowerId,
  columnIndex: number,
): boolean {
  const effect = effectForTargetedPower(normalizePowerId(powerId));
  if (!effect) return false;
  return (state.columnEffects[columnIndex] ?? []).some((e) => e.effect === effect);
}

function targetKindMatchesLocation(
  state: GameState,
  card: Card,
  kind: PowerTargetKind,
  opts: BlackJokerTargetContext,
): boolean {
  if (!isRegular(card)) return false;
  switch (kind) {
    case "tableauFaceDownCard":
      return opts.tableauFaceDown === true && isFaceDownOnTableau(state, card);
    case "tableauCard":
      return opts.tableauCard === true && isOnTableau(state, card);
    case "stockPopupCard":
      return opts.inStockPopup === true && isInStock(state, card);
    case "deckPopupFaceDownCard":
      return (
        opts.deckPopupFaceDown === true &&
        (isInStock(state, card) || isFaceDownOnTableau(state, card))
      );
    case "deckPopupCard":
      return (
        opts.deckPopupCard === true &&
        !isCardInFoundation(state, card) &&
        (isInStock(state, card) || isOnTableau(state, card))
      );
    default:
      return false;
  }
}

function isCardTargetLocation(
  state: GameState,
  powerId: PowerId,
  card: Card,
  opts: BlackJokerTargetContext,
): boolean {
  const def = getPowerDefinition(powerId);
  const kinds = def.targetKinds ?? [];
  return kinds.some(
    (kind) => kind !== "tableauColumn" && targetKindMatchesLocation(state, card, kind, opts),
  );
}

export function isValidBlackJokerCardTarget(
  state: GameState,
  card: Card,
  opts: BlackJokerTargetContext,
): boolean {
  if (!isCardTargetLocation(state, POWER_SELECTED_CARD_TRANSPARENT, card, opts)) {
    return false;
  }
  return !cardAlreadyHasTargetedPowerEffect(state, POWER_SELECTED_CARD_TRANSPARENT, card);
}

/** Valid card target for a shelf targeted power (zone + not already bearing that power's effect). */
export function isValidTargetedCardTarget(
  state: GameState,
  powerId: PowerId,
  card: Card,
  targetContext: BlackJokerTargetContext,
): boolean {
  const normalized = normalizePowerId(powerId);
  if (powerIsCardSwap(normalized)) {
    return isValidCardSwapTargetContext(state, card, targetContext);
  }
  if (cardAlreadyHasTargetedPowerEffect(state, normalized, card)) return false;
  return isCardTargetLocation(state, normalized, card, targetContext);
}

export function isValidTargetedColumnTarget(
  state: GameState,
  powerId: PowerId,
  columnIndex: number,
): boolean {
  const normalized = normalizePowerId(powerId);
  if (!powerTargetsTableauColumn(normalized)) return false;
  if (columnIndex < 0 || columnIndex >= state.columns.length) return false;
  if (normalized === POWER_EXTRA_COLUMN) {
    return canTargetExtraColumnParent(state, columnIndex);
  }
  if (columnAlreadyHasTargetedPowerEffect(state, normalized, columnIndex)) return false;
  return true;
}

// —— Shelf joker catalog ——————————————————————————————————————————————————————

export function jokerPortraitSlotForCard(
  deckPairId: string,
  joker: JokerCard,
): JokerPortraitSlot {
  const def = jokerDefinitionForInGameId(deckPairId, joker.id);
  if (def) return def.index;
  return (((joker.id % 4) + 4) % 4 + 1) as JokerPortraitSlot;
}

function powerIdForJokerCard(deckPairId: string, joker: JokerCard): PowerId {
  const def = jokerDefinitionForInGameId(deckPairId, joker.id);
  if (def) return def.powerId;
  const slot = jokerPortraitSlotForCard(deckPairId, joker);
  return slot <= 2 ? POWER_ALL_KINGS_TRANSPARENT : POWER_SELECTED_CARD_TRANSPARENT;
}

export function createShelfJokerEntry(deckPairId: string, card: JokerCard): ShelfJoker {
  const def = jokerDefinitionForInGameId(deckPairId, card.id);
  const slot = def?.index ?? jokerPortraitSlotForCard(deckPairId, card);
  const powerId = def?.powerId ?? powerIdForJokerCard(deckPairId, card);
  return {
    kind: "joker",
    card,
    slot,
    powerId,
    chargesRemaining: def?.initialCharges ?? 3,
  };
}

/** Append a joker after existing jokers and before any set-power entries. */
export function appendShelfJoker(shelf: readonly ShelfEntry[], entry: ShelfJoker): ShelfEntry[] {
  const next = [...shelf];
  const insertAt = next.findIndex((e) => e.kind === "set");
  next.splice(insertAt === -1 ? next.length : insertAt, 0, entry);
  return next;
}

/** Enforce shelf partition: all jokers first, then set powers (repairs legacy order). */
export function normalizeShelfPartition(shelf: readonly ShelfEntry[]): ShelfEntry[] {
  const jokers: ShelfJoker[] = [];
  const sets: ShelfSetPower[] = [];
  for (const entry of shelf) {
    if (entry.kind === "joker") jokers.push(entry);
    else sets.push(entry);
  }
  return [...jokers, ...sets];
}

/** Align persisted shelf `powerId` with the deck-pair catalog for this joker card. */
export function syncShelfJokerPowerFromCatalog(
  deckPairId: string,
  entry: ShelfJoker,
): ShelfJoker {
  const def = jokerDefinitionForInGameId(deckPairId, entry.card.id);
  if (!def || def.powerId === entry.powerId) return entry;
  return { ...entry, powerId: def.powerId, slot: def.index };
}

export { syncShelfSetPowerFromCatalog } from "@/engine/setPowers";

/** Align persisted shelf entry with joker or set catalog (whichever applies). */
export function syncShelfEntryPowerFromCatalog(
  deckPairId: string,
  entry: ShelfEntry,
): ShelfEntry {
  if (entry.kind === "joker") return syncShelfJokerPowerFromCatalog(deckPairId, entry);
  return syncShelfSetPowerFromCatalog(deckPairId, entry);
}

// —— Triggering ———————————————————————————————————————————————————————————————

export type BlackJokerTargetContext = {
  tableauFaceDown?: boolean;
  tableauCard?: boolean;
  inStockPopup?: boolean;
  deckPopupFaceDown?: boolean;
  deckPopupCard?: boolean;
};

export type TargetedCardTargetContext = BlackJokerTargetContext;

export type PowerTriggerResult = {
  state: GameState;
  history: HistoryEntry & { type: "power_trigger" };
};

function shelfPowerTriggerable(state: GameState, shelfIndex: number): boolean {
  const entry = state.shelf[shelfIndex];
  return entry !== undefined && entry.chargesRemaining > 0;
}

function resolvedPowerIdForShelf(state: GameState, shelfIndex: number): PowerId {
  const entry = state.shelf[shelfIndex]!;
  if (entry.kind === "set") return resolvedSetPowerId(state.config.deckPairId, entry);
  const def = jokerDefinitionForInGameId(state.config.deckPairId, entry.card.id);
  return def?.powerId ?? normalizePowerId(entry.powerId);
}

function powerEffectDuration(state: GameState, shelfIndex: number): number | null {
  const entry = state.shelf[shelfIndex]!;
  if (entry.kind === "set") return setPowerEffectDuration(state.config.deckPairId, entry);
  const def = jokerDefinitionForInGameId(state.config.deckPairId, entry.card.id);
  return def?.initialDuration ?? null;
}

function consumeShelfCharge(state: GameState, shelfIndex: number): GameState {
  const shelf = state.shelf.map((s, i) =>
    i === shelfIndex ? { ...s, chargesRemaining: s.chargesRemaining - 1 } : s,
  );
  return { ...state, shelf };
}

export function restoreShelfCharge(
  state: GameState,
  shelfIndex: number,
  chargesBefore: number,
): GameState {
  const shelf = state.shelf.map((s, i) =>
    i === shelfIndex ? { ...s, chargesRemaining: chargesBefore } : s,
  );
  return { ...state, shelf };
}

export function triggerImmediatePower(
  state: GameState,
  shelfIndex: number,
): PowerTriggerResult | null {
  if (!shelfPowerTriggerable(state, shelfIndex)) return null;
  const shelfEntry = state.shelf[shelfIndex]!;
  const powerId = resolvedPowerIdForShelf(state, shelfIndex);
  const def = getPowerDefinition(powerId);
  if (def.triggerClass !== "immediate") return null;

  const chargesBefore = shelfEntry.chargesRemaining;
  let next = state;
  let cardEffectsAdded: PowerTriggerResult["history"]["cardEffectsAdded"] = [];
  const columnEffectsAdded: PowerTriggerResult["history"]["columnEffectsAdded"] = [];

  const duration = powerEffectDuration(state, shelfIndex);

  if (powerId === POWER_ALL_KINGS_TRANSPARENT) {
    const applied = applyMakeAllKingsTransparent(next, duration);
    next = applied.state;
    cardEffectsAdded = applied.cardEffectsAdded;
  } else if (powerId === POWER_2_KINGS_TRANSPARENT) {
    const applied = applyMakeTwoKingsTransparent(next, duration);
    next = applied.state;
    cardEffectsAdded = applied.cardEffectsAdded;
  } else {
    return null;
  }

  next = tickEffectDurationsOnTargetCommit(consumeShelfCharge(next, shelfIndex), {
    cardEffectsAdded,
  });
  return {
    state: next,
    history: {
      type: "power_trigger",
      shelfIndex,
      chargesBefore,
      cardEffectsAdded,
      columnEffectsAdded,
    },
  };
}

export function triggerTargetedFoundationPower(
  state: GameState,
  shelfIndex: number,
  foundationIndex: FoundationIndex,
): PowerTriggerResult | null {
  if (!shelfPowerTriggerable(state, shelfIndex)) return null;
  const shelfEntry = state.shelf[shelfIndex]!;
  const powerId = resolvedPowerIdForShelf(state, shelfIndex);
  if (!powerTargetsFoundationSlot(powerId)) return null;
  if (!isValidFoundationReturnTarget(state, foundationIndex)) return null;

  const applied = applyFoundationReturn(state, foundationIndex);
  if (!applied) return null;

  const chargesBefore = shelfEntry.chargesRemaining;
  const next = tickEffectDurationsOnTargetCommit(
    consumeShelfCharge(applied.state, shelfIndex),
    {},
  );
  return {
    state: next,
    history: {
      type: "power_trigger",
      shelfIndex,
      chargesBefore,
      cardEffectsAdded: [],
      columnEffectsAdded: [],
      foundationReturnUndo: applied.foundationReturnUndo,
    },
  };
}

export function triggerCardSwapPower(
  state: GameState,
  shelfIndex: number,
  firstCard: Card,
  secondCard: Card,
  firstContext: BlackJokerTargetContext,
  secondContext: BlackJokerTargetContext,
): PowerTriggerResult | null {
  if (!shelfPowerTriggerable(state, shelfIndex)) return null;
  const shelfEntry = state.shelf[shelfIndex]!;
  const powerId = resolvedPowerIdForShelf(state, shelfIndex);
  if (!powerIsCardSwap(powerId)) return null;
  if (
    !isValidTargetedCardTarget(state, powerId, firstCard, firstContext) ||
    !isValidTargetedCardTarget(state, powerId, secondCard, secondContext)
  ) {
    return null;
  }
  if (firstCard.kind === secondCard.kind && firstCard.id === secondCard.id) {
    return null;
  }

  const applied = applyCardSwap(state, firstCard, secondCard);
  if (!applied) return null;

  const chargesBefore = shelfEntry.chargesRemaining;
  const next = tickEffectDurationsOnTargetCommit(
    consumeShelfCharge(applied.state, shelfIndex),
    {},
  );
  return {
    state: next,
    history: {
      type: "power_trigger",
      shelfIndex,
      chargesBefore,
      cardEffectsAdded: [],
      columnEffectsAdded: [],
      cardSwapUndo: applied.cardSwapUndo,
    },
  };
}

export function triggerTargetedPower(
  state: GameState,
  shelfIndex: number,
  card: Card,
  targetContext: BlackJokerTargetContext,
): PowerTriggerResult | null {
  if (!shelfPowerTriggerable(state, shelfIndex)) return null;
  const shelfEntry = state.shelf[shelfIndex]!;
  const powerId = resolvedPowerIdForShelf(state, shelfIndex);
  if (powerTargetsTableauColumn(powerId) || powerTargetsFoundationSlot(powerId)) {
    return null;
  }
  if (powerIsCardSwap(powerId)) return null;
  if (!isValidTargetedCardTarget(state, powerId, card, targetContext)) return null;

  const effect = effectForTargetedPower(powerId);
  if (!effect) return null;

  const chargesBefore = shelfEntry.chargesRemaining;
  const duration = powerEffectDuration(state, shelfIndex);
  const applied = applyCardEffect(state, card, effect, duration);
  const next = tickEffectDurationsOnTargetCommit(consumeShelfCharge(applied.state, shelfIndex), {
    cardEffectsAdded: applied.cardEffectsAdded,
  });
  return {
    state: next,
    history: {
      type: "power_trigger",
      shelfIndex,
      chargesBefore,
      cardEffectsAdded: applied.cardEffectsAdded,
      columnEffectsAdded: [],
    },
  };
}

export function triggerTargetedColumnPower(
  state: GameState,
  shelfIndex: number,
  columnIndex: number,
): PowerTriggerResult | null {
  if (!shelfPowerTriggerable(state, shelfIndex)) return null;
  const shelfEntry = state.shelf[shelfIndex]!;
  const powerId = resolvedPowerIdForShelf(state, shelfIndex);
  if (!isValidTargetedColumnTarget(state, powerId, columnIndex)) return null;

  const chargesBefore = shelfEntry.chargesRemaining;

  if (powerId === POWER_EXTRA_COLUMN) {
    const duration = powerEffectDuration(state, shelfIndex);
    if (duration == null || duration <= 0) return null;
    const topologyBefore = snapshotExtraColumnTopology(state);
    const applied = applyExtraColumn(state, columnIndex, duration);
    if (!applied) return null;
    const next = tickEffectDurationsOnTargetCommit(consumeShelfCharge(applied.state, shelfIndex), {
      extraColumnLinkParentsAdded: [applied.newLinkParentIndex],
    });
    return {
      state: next,
      history: {
        type: "power_trigger",
        shelfIndex,
        chargesBefore,
        cardEffectsAdded: [],
        columnEffectsAdded: [],
        extraColumnTopologyBefore: topologyBefore,
      },
    };
  }

  const effect = effectForTargetedPower(powerId);
  if (!effect) return null;

  const duration = powerEffectDuration(state, shelfIndex);
  const applied = applyColumnEffect(state, columnIndex, effect, duration);
  const next = tickEffectDurationsOnTargetCommit(consumeShelfCharge(applied.state, shelfIndex), {
    columnEffectsAdded: applied.columnEffectsAdded,
  });
  return {
    state: next,
    history: {
      type: "power_trigger",
      shelfIndex,
      chargesBefore,
      cardEffectsAdded: [],
      columnEffectsAdded: applied.columnEffectsAdded,
    },
  };
}

export function canTriggerImmediatePower(state: GameState, shelfIndex: number): boolean {
  if (!shelfPowerTriggerable(state, shelfIndex)) return false;
  const entry = state.shelf[shelfIndex]!;
  return getPowerDefinition(entry.powerId).triggerClass === "immediate";
}
