import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { applyExtraColumn } from "@/engine/extraColumn";
import { newGame } from "@/engine/game";
import { createEmptyBoardShell, gameHasAnyCards } from "@/engine/setup";
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

  it("persists cleared board shell so refresh restores post–End Game layout", () => {
    const g = newGame({
      columns: 6,
      deals: 5,
      deckPairId: DEFAULT_DECK_PAIR_ID,
      seed: "06-005-BAS-33333333333333",
      jokerCount: 0,
    });
    const shell = createEmptyBoardShell(g.config);
    saveGameState(shell);
    const loaded = loadGameState();
    expect(loaded).not.toBeNull();
    expect(gameHasAnyCards(loaded!)).toBe(false);
    expect(loaded!.config.seed).toBe(g.config.seed);
    expect(loaded!.columns).toHaveLength(6);
    expect(loaded!.history).toEqual([]);
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
    expect(parsed!.extraColumnLinks).toEqual([]);
    expect(parsed!.columnFlags).toEqual({});
  });

  it("parseStoredGameState migrates legacy shelf entries without kind", () => {
    const g = newGame({
      columns: 4,
      deals: 5,
      deckPairId: DEFAULT_DECK_PAIR_ID,
      seed: "04-005-BAS-11111111111111",
      jokerCount: 0,
    });
    const legacy = JSON.parse(JSON.stringify(g)) as Record<string, unknown>;
    legacy.shelf = [
      {
        card: { kind: "joker", id: 0 },
        slot: 1,
        powerId: "jokerAllKingsTransparent",
        chargesRemaining: 3,
      },
    ];
    delete legacy.alignedSetKeys;
    const parsed = parseStoredGameState(legacy);
    expect(parsed!.alignedSetKeys).toEqual([]);
    expect(parsed!.shelf[0]).toMatchObject({ kind: "joker" });
  });

  it("parseStoredGameState fills extra column defaults on older saves", () => {
    const g = newGame({
      columns: 4,
      deals: 5,
      deckPairId: DEFAULT_DECK_PAIR_ID,
      seed: "04-005-BAS-11111111111111",
      jokerCount: 0,
    });
    const legacy = JSON.parse(JSON.stringify(g)) as Record<string, unknown>;
    delete legacy.bonusColumnLinks;
    delete legacy.columnFlags;
    const parsed = parseStoredGameState(legacy);
    expect(parsed!.extraColumnLinks).toEqual([]);
    expect(parsed!.columnFlags).toEqual({});
  });

  it("round-trips extra column topology through parse and localStorage", () => {
    let g = newGame({
      columns: 4,
      deals: 5,
      deckPairId: DEFAULT_DECK_PAIR_ID,
      seed: "04-005-BAS-11111111111111",
      jokerCount: 0,
    });
    const appliedOnDeal = applyExtraColumn(g, 0, 10);
    expect(appliedOnDeal).not.toBeNull();
    g = appliedOnDeal!.state;
    const appliedOnLeaf = applyExtraColumn(g, 1, 8);
    expect(appliedOnLeaf).not.toBeNull();
    g = appliedOnLeaf!.state;

    expect(g.columns).toHaveLength(6);
    expect(g.extraColumnLinks).toEqual([
      { parentColumnIndex: 0, movesRemaining: 10 },
      { parentColumnIndex: 1, movesRemaining: 8 },
    ]);
    expect(g.columnFlags[1]).toEqual({ isExtraChild: true });
    expect(g.columnFlags[2]).toEqual({ isExtraChild: true });

    const parsed = parseStoredGameState(JSON.parse(JSON.stringify(g)));
    expect(parsed).not.toBeNull();
    expect(parsed!.columns).toHaveLength(6);
    expect(parsed!.extraColumnLinks).toEqual(g.extraColumnLinks);
    expect(parsed!.columnFlags).toEqual(g.columnFlags);

    saveGameState(g);
    const loaded = loadGameState();
    expect(loaded).not.toBeNull();
    expect(loaded!.columns).toHaveLength(6);
    expect(loaded!.extraColumnLinks).toEqual(g.extraColumnLinks);
    expect(loaded!.columnFlags).toEqual(g.columnFlags);
    expect(loaded!.config.columns).toBe(4);
  });

  it("parseStoredGameState migrates legacy bonusColumnLinks field", () => {
    const g = newGame({
      columns: 4,
      deals: 5,
      deckPairId: DEFAULT_DECK_PAIR_ID,
      seed: "04-005-BAS-11111111111111",
      jokerCount: 0,
    });
    const legacy = JSON.parse(JSON.stringify(g)) as Record<string, unknown>;
    legacy.bonusColumnLinks = [{ parentColumnIndex: 0, movesRemaining: 7 }];
    delete legacy.extraColumnLinks;
    const parsed = parseStoredGameState(legacy);
    expect(parsed!.extraColumnLinks).toEqual([{ parentColumnIndex: 0, movesRemaining: 7 }]);
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
    expect(cfg.numberOfSuits).toBe(4);
    expect(cfg.seed).toMatch(/^\d{2}-\d{3}-4-BAS-\d{14}$/);
  });
});
