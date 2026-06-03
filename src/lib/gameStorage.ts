import { DEFAULT_DECK_PAIR_ID, deckPairs, maxJokersInPlayForDeckPair } from "@/content/deckPairs";
import { normalizePowerId, normalizeShelfJoker } from "@/content/powerDefinitions";
import {
  normalizeShelfPartition,
  syncShelfJokerPowerFromCatalog,
  syncShelfSetPowerFromCatalog,
} from "@/engine/powers";
import { emptyExtraColumnState, normalizeExtraColumnState } from "@/engine/extraColumnState";
import { emptyEffectsState, normalizeEffectsState } from "@/engine/effects";
import { stripEphemeralGameState } from "@/engine/initialDeal";
import { createShelfJokerEntry } from "@/engine/powers";
import { validateGameConfig } from "@/engine/setup";
import type {
  GameConfig,
  GameState,
  JokerCard,
  SetKey,
  ShelfEntry,
  ShelfJoker,
  ShelfSetPower,
} from "@/engine/types";
import { formatFormattedGameSeed, newRandomShuffleKey } from "@/lib/formattedGameSeed";
import { normalizeNumberOfSuits } from "@/lib/numberOfSuits";

const STORAGE_KEY = "wild-spider-game-v1";
const LAST_NEW_GAME_DEFAULTS_KEY = "wild-spider-last-new-game-defaults-v1";

export function saveGameState(state: GameState): void {
  try {
    if (typeof window === "undefined") return;
    const toSave = stripEphemeralGameState(state);
    saveLastNewGameDefaults(toSave.config);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    /* quota or private mode */
  }
}

/** Remember layout + seed + jokers for the next New Game dialog (not cleared with end game). */
export function saveLastNewGameDefaults(config: GameConfig): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(LAST_NEW_GAME_DEFAULTS_KEY, JSON.stringify(config));
  } catch {
    /* ignore */
  }
}

export function loadLastNewGameDefaults(): GameConfig | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(LAST_NEW_GAME_DEFAULTS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameConfig;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.columns !== "number" ||
      typeof parsed.deals !== "number" ||
      typeof parsed.deckPairId !== "string" ||
      typeof parsed.seed !== "string" ||
      typeof parsed.jokerCount !== "number"
    ) {
      return null;
    }
    const maxJ = Math.min(8, maxJokersInPlayForDeckPair(parsed.deckPairId));
    parsed.jokerCount = Math.min(Math.max(0, parsed.jokerCount), maxJ);
    parsed.numberOfSuits = normalizeNumberOfSuits(parsed.numberOfSuits);
    validateGameConfig(parsed);
    return parsed;
  } catch {
    return null;
  }
}

function normalizeShelfSetPower(entry: ShelfSetPower, deckPairId: string): ShelfSetPower {
  const powerId = normalizePowerId(entry.powerId);
  const withPower = powerId === entry.powerId ? entry : { ...entry, powerId };
  return syncShelfSetPowerFromCatalog(deckPairId, withPower);
}

function normalizeLegacyShelfJokerEntry(
  entry: Record<string, unknown>,
  deckPairId: string,
): ShelfJoker {
  const legacy = entry as Omit<ShelfJoker, "kind"> & { kind?: string };
  const withKind: ShelfJoker =
    legacy.kind === "joker"
      ? (legacy as ShelfJoker)
      : {
          kind: "joker",
          card: legacy.card,
          slot: legacy.slot,
          powerId: legacy.powerId,
          chargesRemaining: legacy.chargesRemaining,
        };
  const normalized = normalizeShelfJoker(withKind);
  return syncShelfJokerPowerFromCatalog(deckPairId, normalized);
}

function normalizeShelfEntry(entry: unknown, deckPairId: string): ShelfEntry {
  if (!entry || typeof entry !== "object") {
    throw new Error("Invalid shelf entry");
  }
  const raw = entry as Record<string, unknown>;
  if (raw.kind === "set") {
    return normalizeShelfSetPower(raw as ShelfSetPower, deckPairId);
  }
  if (
    raw.kind === "joker" ||
    ("powerId" in raw && "chargesRemaining" in raw && "slot" in raw && "card" in raw)
  ) {
    return normalizeLegacyShelfJokerEntry(raw, deckPairId);
  }
  const card = raw.card as JokerCard | undefined;
  if (card?.kind === "joker") {
    return createShelfJokerEntry(deckPairId, card);
  }
  throw new Error("Invalid shelf entry");
}

/** Parse persisted JSON (localStorage or Supabase `state` column). Returns null if invalid. */
export function parseStoredGameState(value: unknown): GameState | null {
  try {
    if (!value || typeof value !== "object") return null;
    const parsed = value as GameState;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(parsed.columns) ||
      typeof parsed.config !== "object" ||
      parsed.config === null
    ) {
      return null;
    }
    const cfg = parsed.config as GameConfig;
    const maxJ = Math.min(8, maxJokersInPlayForDeckPair(cfg.deckPairId));
    cfg.jokerCount = Math.min(Math.max(0, cfg.jokerCount), maxJ);
    cfg.numberOfSuits = normalizeNumberOfSuits(cfg.numberOfSuits);
    validateGameConfig(cfg);
    if (!Array.isArray(parsed.history)) return null;
    return normalizeStoredGameState(parsed);
  } catch {
    return null;
  }
}

/** Fills Stage 5 fields missing from older persisted saves. */
export function normalizeStoredGameState(parsed: GameState): GameState {
  const effects = emptyEffectsState();
  const shelf = normalizeShelfPartition(
    (parsed.shelf ?? []).map((entry) => normalizeShelfEntry(entry, parsed.config.deckPairId)),
  );
  const alignedSetKeys: readonly SetKey[] = Array.isArray(parsed.alignedSetKeys)
    ? parsed.alignedSetKeys
    : [];
  return {
    ...parsed,
    shelf,
    alignedSetKeys,
    ...normalizeEffectsState({
      cardEffects: parsed.cardEffects ?? effects.cardEffects,
      columnEffects: parsed.columnEffects ?? effects.columnEffects,
    }),
    ...normalizeExtraColumnState({
      extraColumnLinks: parsed.extraColumnLinks,
      columnFlags: parsed.columnFlags,
      bonusColumnLinks: (parsed as { bonusColumnLinks?: unknown }).bonusColumnLinks,
    }),
  };
}

export function loadGameState(): GameState | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return parseStoredGameState(parsed);
  } catch {
    return null;
  }
}

export function clearGameState(): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Config for an empty “cleared” board when there is no persisted game: last New Game defaults if any, else
 * product defaults (8×6, Base pair, random formatted shuffle key).
 */
export function resolvedGameConfigForEmptyShell(): GameConfig {
  const last = loadLastNewGameDefaults();
  if (last) return last;
  const pairCode = deckPairs.find((p) => p.id === DEFAULT_DECK_PAIR_ID)?.pairCode ?? "BAS";
  return {
    columns: 8,
    deals: 6,
    deckPairId: DEFAULT_DECK_PAIR_ID,
    seed: formatFormattedGameSeed(8, 6, 4, pairCode, newRandomShuffleKey()),
    jokerCount: 0,
    numberOfSuits: 4,
  };
}
