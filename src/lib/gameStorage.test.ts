import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { newGame } from "@/engine/game";
import { DEFAULT_DECK_PAIR_ID } from "@/constants/deckPairs";
import {
  loadLastNewGameDefaults,
  loadGameState,
  saveGameState,
  clearGameState,
  parseStoredGameState,
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
      deckPairId: DEFAULT_DECK_PAIR_ID,
      seed: "04-005-PLH-11111111111111",
      jokerCount: 2,
    });
    saveGameState(g);
    const last = loadLastNewGameDefaults();
    expect(last).not.toBeNull();
    expect(last!.columns).toBe(4);
    expect(last!.deals).toBe(5);
    expect(last!.jokerCount).toBe(2);
    expect(last!.seed).toBe("04-005-PLH-11111111111111");
  });

  it("clearGameState removes game but keeps last defaults", () => {
    const g = newGame({
      columns: 7,
      deals: 8,
      deckPairId: DEFAULT_DECK_PAIR_ID,
      seed: "07-008-PLH-22222222222222",
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
      seed: "04-005-PLH-11111111111111",
      jokerCount: 0,
    });
    const parsed = parseStoredGameState(JSON.parse(JSON.stringify(g)));
    expect(parsed).not.toBeNull();
    expect(parsed!.config.seed).toBe(g.config.seed);
  });
});
