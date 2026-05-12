import { stripEphemeralGameState } from "@/engine/initialDeal";
import { validateGameConfig } from "@/engine/setup";
import type { GameConfig, GameState } from "@/engine/types";

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
    validateGameConfig(parsed.config as GameConfig);
    if (!Array.isArray(parsed.history)) return null;
    return parsed;
  } catch {
    return null;
  }
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
