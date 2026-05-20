import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { newGame } from "@/engine/game";
import { DEFAULT_DECK_PAIR_ID } from "@/content/deckPairs";
import {
  loadLastNewGameDefaults,
  loadGameState,
  saveGameState,
  clearGameState,
  parseStoredGameState,
  resolvedGameConfigForEmptyShell,
} from "./gameStorage";

describe("gameStorage last new-game defaults", () => {
  beforeEach(() => {
    const ls = globalThis.localStorage;
    if (ls && typeof ls.clear === "function") {
      ls.clear();
    }
  });

  afterEach(() => {
    const ls = globalThis.localStorage;
    if (ls && typeof ls.clear === "function") {
      ls.clear();
    }
  });

  it("saveGameState mirrors config into last-new-game key", () => {
    const g = newGame({
      columns: 4,
      deals: 5,
      deckPairId: "mathematics",
      seed: "04-005-MAT-11111111111111",
      jokerCount: 2,
    });
    saveGameState(g);
    const last = loadLastNewGameDefaults();
    expect(last).not.toBeNull();
    expect(last!.columns).toBe(4);
    expect(last!.deals).toBe(5);
    expect(last!.jokerCount).toBe(2);
    expect(last!.seed).toBe("04-005-MAT-11111111111111");
  });

  it("clearGameState removes game but keeps last defaults", () => {
    const g = newGame({
      columns: 7,
      deals: 8,
      deckPairId: "mathematics",
      seed: "07-008-MAT-22222222222222",
      jokerCount: 1,
    });
    saveGameState(g);
    clearGameState();
    expect(loadGameState()).toBeNull();
    const last = loadLastNewGameDefaults();
    expect(last?.columns).toBe(7);
    expect(last?.deals).toBe(8);
  });

  it("parseStoredGameState accepts valid persisted object", () => {
    const g = newGame({
      columns: 4,
      deals: 5,
      deckPairId: DEFAULT_DECK_PAIR_ID,
      seed: "04-005-BAS-11111111111111",
      jokerCount: 0,
    });
    const parsed = parseStoredGameState(JSON.parse(JSON.stringify(g)));
    expect(parsed).not.toBeNull();
    expect(parsed!.config.seed).toBe(g.config.seed);
  });

  it("resolvedGameConfigForEmptyShell uses last defaults when present", () => {
    const g = newGame({
      columns: 4,
      deals: 5,
      deckPairId: DEFAULT_DECK_PAIR_ID,
      seed: "04-005-BAS-11111111111111",
      jokerCount: 0,
    });
    saveGameState(g);
    clearGameState();
    const cfg = resolvedGameConfigForEmptyShell();
    expect(cfg.columns).toBe(4);
    expect(cfg.deals).toBe(5);
    expect(cfg.seed).toBe("04-005-BAS-11111111111111");
  });

  it("resolvedGameConfigForEmptyShell uses product defaults when no last key", () => {
    const ls = globalThis.localStorage;
    ls?.removeItem("wild-spider-last-new-game-defaults-v1");
    const cfg = resolvedGameConfigForEmptyShell();
    expect(cfg.columns).toBe(8);
    expect(cfg.deals).toBe(6);
    expect(cfg.deckPairId).toBe(DEFAULT_DECK_PAIR_ID);
    expect(cfg.jokerCount).toBe(0);
    expect(cfg.seed).toMatch(/^\d{2}-\d{3}-BAS-\d{14}$/);
  });
});
