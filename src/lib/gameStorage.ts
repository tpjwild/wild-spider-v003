import { DEFAULT_DECK_PAIR_ID, deckPairs, maxJokersInPlayForDeckPair } from "@/content/deckPairs";
import { normalizeShelfJoker } from "@/content/powerDefinitions";
import { syncShelfJokerPowerFromCatalog } from "@/engine/powers";
import { emptyExtraColumnState, normalizeExtraColumnState } from "@/engine/extraColumnState";
import { emptyEffectsState, normalizeEffectsState } from "@/engine/effects";
import { stripEphemeralGameState } from "@/engine/initialDeal";
import { createShelfJokerEntry } from "@/engine/powers";
import { validateGameConfig } from "@/engine/setup";
import type { GameConfig, GameState, ShelfJoker } from "@/engine/types";
import { formatFormattedGameSeed, newRandomShuffleKey } from "@/lib/formattedGameSeed";

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
    validateGameConfig(parsed);
    return parsed;
  } catch {
    return null;
  }
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
  const extra = emptyExtraColumnState();
  const shelf: ShelfJoker[] = (parsed.shelf ?? []).map((entry) => {
    if (
      entry &&
      typeof entry === "object" &&
      "powerId" in entry &&
      "chargesRemaining" in entry &&
      "slot" in entry
    ) {
      const normalized = normalizeShelfJoker(entry as ShelfJoker);
      return syncShelfJokerPowerFromCatalog(parsed.config.deckPairId, normalized);
    }
    const card = (entry as { card: ShelfJoker["card"] }).card;
    return createShelfJokerEntry(parsed.config.deckPairId, card);
  });
  return {
    ...parsed,
    shelf,
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
    seed: formatFormattedGameSeed(8, 6, pairCode, newRandomShuffleKey()),
    jokerCount: 0,
  };
}
