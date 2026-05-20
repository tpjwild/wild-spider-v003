import { jokerDefinitionForInGameId } from "@/content/deckPairs";
import {
  EFFECT_TRANSPARENT,
  getPowerDefinition,
  JOKER_POWER_ALL_KINGS_TRANSPARENT,
  JOKER_POWER_SELECTED_CARD_TRANSPARENT,
  normalizePowerId,
} from "@/content/powerDefinitions";
import { buildDoubleDeck, isRegular } from "@/engine/cards";
import { addCardEffectForCard, hasCardEffect } from "@/engine/effects";
import type {
  Card,
  CardEffectKey,
  EffectId,
  GameState,
  HistoryEntry,
  JokerCard,
  JokerPortraitSlot,
  PowerId,
  ShelfJoker,
} from "@/engine/types";

// —— Effect applications —————————————————————————————————————————————————————

export type AppliedCardEffect = { key: CardEffectKey; effect: EffectId };

export function applyMakeAllKingsTransparent(state: GameState): {
  state: GameState;
  cardEffectsAdded: AppliedCardEffect[];
} {
  const kings = buildDoubleDeck().filter((c) => c.rank === 13);
  let next = state;
  const cardEffectsAdded: AppliedCardEffect[] = [];
  for (const card of kings) {
    const r = addCardEffectForCard(next, card, EFFECT_TRANSPARENT);
    next = r.state;
    if (r.added) cardEffectsAdded.push(r.added);
  }
  return { state: next, cardEffectsAdded };
}

export function applyMakeCardTransparent(
  state: GameState,
  card: Card,
): { state: GameState; cardEffectsAdded: AppliedCardEffect[] } {
  const r = addCardEffectForCard(state, card, EFFECT_TRANSPARENT);
  return {
    state: r.state,
    cardEffectsAdded: r.added ? [r.added] : [],
  };
}

function isFaceDownOnTableau(state: GameState, card: Card): boolean {
  if (!isRegular(card)) return false;
  return state.columns.some((col) =>
    col.some((p) => p.card.kind === "regular" && p.card.id === card.id && !p.faceUp),
  );
}

function isInStock(state: GameState, card: Card): boolean {
  return state.stock.some((c) => c.kind === card.kind && c.id === card.id);
}

/** Effect the targeted power would apply; used to reject targets that already have it. */
function effectIdForTargetedPower(powerId: string): EffectId | null {
  if (normalizePowerId(powerId) === JOKER_POWER_SELECTED_CARD_TRANSPARENT) return EFFECT_TRANSPARENT;
  return null;
}

export function cardAlreadyHasTargetedPowerEffect(
  state: GameState,
  powerId: PowerId,
  card: Card,
): boolean {
  const effect = effectIdForTargetedPower(powerId);
  if (!effect) return false;
  return hasCardEffect(state, card, effect);
}

export function columnAlreadyHasTargetedPowerEffect(
  state: GameState,
  powerId: PowerId,
  columnIndex: number,
): boolean {
  const effect = effectIdForTargetedPower(powerId);
  if (!effect) return false;
  return (state.columnEffects[columnIndex] ?? []).includes(effect);
}

function isBlackJokerCardTargetLocation(
  state: GameState,
  card: Card,
  opts: BlackJokerTargetContext,
): boolean {
  if (!isRegular(card)) return false;
  if (opts.tableauFaceDown && isFaceDownOnTableau(state, card)) return true;
  if (opts.inStockPopup && isInStock(state, card)) return true;
  if (opts.deckPopupFaceDown && (isInStock(state, card) || isFaceDownOnTableau(state, card))) {
    return true;
  }
  return false;
}

export function isValidBlackJokerCardTarget(
  state: GameState,
  card: Card,
  opts: BlackJokerTargetContext,
): boolean {
  if (!isBlackJokerCardTargetLocation(state, card, opts)) return false;
  return !cardAlreadyHasTargetedPowerEffect(state, JOKER_POWER_SELECTED_CARD_TRANSPARENT, card);
}

/** Valid card target for a shelf targeted power (zone + not already bearing that power's effect). */
export function isValidTargetedCardTarget(
  state: GameState,
  powerId: PowerId,
  card: Card,
  targetContext: BlackJokerTargetContext,
): boolean {
  const normalized = normalizePowerId(powerId);
  if (cardAlreadyHasTargetedPowerEffect(state, normalized, card)) return false;
  if (normalized === JOKER_POWER_SELECTED_CARD_TRANSPARENT) {
    return isBlackJokerCardTargetLocation(state, card, targetContext);
  }
  return false;
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
  return slot <= 2 ? JOKER_POWER_ALL_KINGS_TRANSPARENT : JOKER_POWER_SELECTED_CARD_TRANSPARENT;
}

export function createShelfJokerEntry(deckPairId: string, card: JokerCard): ShelfJoker {
  const def = jokerDefinitionForInGameId(deckPairId, card.id);
  const slot = def?.index ?? jokerPortraitSlotForCard(deckPairId, card);
  const powerId = def?.powerId ?? powerIdForJokerCard(deckPairId, card);
  return {
    card,
    slot,
    powerId,
    chargesRemaining: def?.initialCharges ?? 3,
  };
}

// —— Triggering ———————————————————————————————————————————————————————————————

export type BlackJokerTargetContext = {
  tableauFaceDown?: boolean;
  inStockPopup?: boolean;
  deckPopupFaceDown?: boolean;
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
  const powerId = normalizePowerId(shelfEntry.powerId);
  const def = getPowerDefinition(powerId);
  if (def.triggerClass !== "immediate") return null;

  const chargesBefore = shelfEntry.chargesRemaining;
  let next = state;
  let cardEffectsAdded: PowerTriggerResult["history"]["cardEffectsAdded"] = [];
  const columnEffectsAdded: PowerTriggerResult["history"]["columnEffectsAdded"] = [];

  if (powerId === JOKER_POWER_ALL_KINGS_TRANSPARENT) {
    const applied = applyMakeAllKingsTransparent(next);
    next = applied.state;
    cardEffectsAdded = applied.cardEffectsAdded;
  } else {
    return null;
  }

  next = consumeShelfCharge(next, shelfIndex);
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

export function triggerTargetedPower(
  state: GameState,
  shelfIndex: number,
  card: Card,
  targetContext: BlackJokerTargetContext,
): PowerTriggerResult | null {
  if (!shelfPowerTriggerable(state, shelfIndex)) return null;
  const shelfEntry = state.shelf[shelfIndex]!;
  const powerId = normalizePowerId(shelfEntry.powerId);
  if (powerId !== JOKER_POWER_SELECTED_CARD_TRANSPARENT) return null;
  if (!isValidTargetedCardTarget(state, powerId, card, targetContext)) {
    return null;
  }

  const chargesBefore = shelfEntry.chargesRemaining;
  const applied = applyMakeCardTransparent(state, card);
  const next = consumeShelfCharge(applied.state, shelfIndex);
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

export function canTriggerImmediatePower(state: GameState, shelfIndex: number): boolean {
  if (!shelfPowerTriggerable(state, shelfIndex)) return false;
  const entry = state.shelf[shelfIndex]!;
  return getPowerDefinition(entry.powerId).triggerClass === "immediate";
}
