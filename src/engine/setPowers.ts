import { setPowerForSet } from "@/content/setPowers";
import { findNewlyAlignedSets } from "@/engine/setAlignment";
import type { GameState, HistoryEntry, PowerId, SetKey, ShelfSetPower } from "@/engine/types";
import { parseSetKey } from "@/lib/setPowerUi";

export function resolvedSetPowerId(deckPairId: string, entry: ShelfSetPower): PowerId {
  return setPowerForSet(deckPairId, entry.deckNum, entry.suit).powerId;
}

export function setPowerEffectDuration(deckPairId: string, entry: ShelfSetPower): number | null {
  return setPowerForSet(deckPairId, entry.deckNum, entry.suit).initialDuration;
}

/** Align persisted set shelf `powerId` with the deck-pair catalog for this set. */
export function syncShelfSetPowerFromCatalog(
  deckPairId: string,
  entry: ShelfSetPower,
): ShelfSetPower {
  const catalog = setPowerForSet(deckPairId, entry.deckNum, entry.suit);
  if (catalog.powerId === entry.powerId) return entry;
  return { ...entry, powerId: catalog.powerId };
}

export function createShelfSetPowerEntry(game: GameState, setKey: SetKey): ShelfSetPower {
  const { deckNum, suit } = parseSetKey(setKey);
  const def = setPowerForSet(game.config.deckPairId, deckNum, suit);
  return {
    kind: "set",
    setKey,
    deckNum,
    suit,
    powerId: def.powerId,
    chargesRemaining: def.initialCharges,
  };
}

export function applyNewSetAlignments(state: GameState): {
  state: GameState;
  setPowersAdded: SetKey[];
} {
  const newly = findNewlyAlignedSets(state, state.alignedSetKeys);
  if (newly.length === 0) {
    return { state, setPowersAdded: [] };
  }
  const shelf = [...state.shelf];
  const alignedSetKeys = [...state.alignedSetKeys];
  for (const setKey of newly) {
    shelf.push(createShelfSetPowerEntry(state, setKey));
    alignedSetKeys.push(setKey);
  }
  return {
    state: { ...state, shelf, alignedSetKeys },
    setPowersAdded: newly,
  };
}

/** Reverts shelf set-power instances created by a player move (see history `setPowersAdded`). */
export function undoSetPowersAdded(
  state: GameState,
  setPowersAdded: readonly SetKey[] | undefined,
): GameState {
  if (!setPowersAdded?.length) return state;
  const remove = new Set(setPowersAdded);
  const shelf = state.shelf.filter((entry) => entry.kind !== "set" || !remove.has(entry.setKey));
  const alignedSetKeys = state.alignedSetKeys.filter((key) => !remove.has(key));
  return { ...state, shelf, alignedSetKeys };
}

export function withSetPowersOnHistoryEntry(
  historyEntry: HistoryEntry,
  setPowersAdded: readonly SetKey[],
): HistoryEntry {
  if (setPowersAdded.length === 0) return historyEntry;
  if (
    historyEntry.type !== "move_tableau" &&
    historyEntry.type !== "move_to_foundation" &&
    historyEntry.type !== "deal" &&
    historyEntry.type !== "power_trigger"
  ) {
    return historyEntry;
  }
  return { ...historyEntry, setPowersAdded: [...setPowersAdded] };
}
