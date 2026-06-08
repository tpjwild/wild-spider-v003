import { describe, expect, it } from "vitest";
import { buildDoubleDeck } from "./cards";
import { dealFromStock, canDealFromStock } from "./deal";
import {
  createEmptyBoardShell,
  createInitialState,
  gameHasAnyCards,
  InvalidGameConfigError,
  tableauCardCount,
  validateGameConfig,
} from "./setup";

describe("validateGameConfig", () => {
  it("rejects columns > 12", () => {
    expect(() =>
      validateGameConfig({
        columns: 13,
        deals: 5,
        deckPairId: "x",
        seed: "s",
        jokerCount: 0,
      }),
    ).toThrow(InvalidGameConfigError);
  });

  it("rejects deals < 5", () => {
    expect(() =>
      validateGameConfig({
        columns: 8,
        deals: 4,
        deckPairId: "x",
        seed: "s",
        jokerCount: 0,
      }),
    ).toThrow(InvalidGameConfigError);
  });

  it("rejects columns*deals > 104", () => {
    expect(() =>
      validateGameConfig({
        columns: 10,
        deals: 11,
        deckPairId: "x",
        seed: "s",
        jokerCount: 0,
      }),
    ).toThrow(InvalidGameConfigError);
  });

  it("rejects jokerCount > 8", () => {
    expect(() =>
      validateGameConfig({
        columns: 8,
        deals: 6,
        deckPairId: "x",
        seed: "s",
        jokerCount: 9,
      }),
    ).toThrow(InvalidGameConfigError);
  });

  it("rejects jokerCount above deck pair maximum (Base has none)", () => {
    expect(() =>
      validateGameConfig({
        columns: 8,
        deals: 6,
        deckPairId: "base",
        seed: "08-006-BAS-12345678901234",
        jokerCount: 1,
      }),
    ).toThrow(InvalidGameConfigError);
  });
});

describe("createInitialState determinism", () => {
  const formattedSeed = "08-006-MAT-12345678901234";
  const cfg = {
    columns: 8,
    deals: 6,
    deckPairId: "mathematics" as const,
    seed: formattedSeed,
    jokerCount: 2,
  };

  it("same seed produces identical stock top and column sizes", () => {
    const a = createInitialState(cfg);
    const b = createInitialState(cfg);
    expect(a.stock.map((c) => (c.kind === "regular" ? c.id : `j${c.id}`))).toEqual(
      b.stock.map((c) => (c.kind === "regular" ? c.id : `j${c.id}`)),
    );
    expect(a.columns.map((c) => c.length)).toEqual(b.columns.map((c) => c.length));
  });

  it("different shuffle keys differ", () => {
    const a = createInitialState({
      ...cfg,
      seed: "08-006-MAT-11111111111111",
    });
    const b = createInitialState({
      ...cfg,
      seed: "08-006-MAT-22222222222222",
    });
    const idsA = a.stock.map((c) => (c.kind === "regular" ? c.id : -1 - c.id));
    const idsB = b.stock.map((c) => (c.kind === "regular" ? c.id : -1 - c.id));
    expect(idsA).not.toEqual(idsB);
  });
  it("legacy non-formatted seed still creates a valid game", () => {
    const g = createInitialState({
      columns: 4,
      deals: 5,
      deckPairId: "base",
      seed: "legacy-plain-seed",
      jokerCount: 0,
    });
    expect(g.columns.reduce((n, c) => n + c.length, 0)).toBe(104 - 20);
  });

  it("formatted seed: stock pile top matches deal order so jokers can surface from stock deals", () => {
    const g = createInitialState({
      columns: 10,
      deals: 5,
      deckPairId: "mathematics",
      seed: "10-005-MAT-44444444444444",
      jokerCount: 8,
    });
    let s = g;
    let jokersFromDeals = 0;
    for (let d = 0; d < 40; d++) {
      if (!canDealFromStock(s)) break;
      const r = dealFromStock(s);
      if (!r) break;
      const h = r.history;
      if (h.type !== "deal") break;
      jokersFromDeals += h.entries.filter((e) => e.card.kind === "joker").length;
      s = r.state;
    }
    expect(jokersFromDeals).toBeGreaterThan(0);
  });
});

describe("tableau distribution", () => {
  it("sums to 104 - columns*deals - jokers for all valid pairs", () => {
    for (let columns = 1; columns <= 12; columns++) {
      for (let deals = 5; deals <= 20; deals++) {
        for (let jokers = 0; jokers <= 8; jokers++) {
          if (columns * deals > 104) continue;
          const cfg = {
            columns,
            deals,
            deckPairId: "mathematics",
            seed: "z",
            jokerCount: jokers,
          };
          validateGameConfig(cfg);
          const g = createInitialState(cfg);
          const inTableau = g.columns.reduce((s, c) => s + c.length, 0);
          const inStock = g.stock.length;
          expect(inTableau).toBe(tableauCardCount(cfg));
          expect(inTableau + inStock).toBe(104 + jokers);
          const regularInStock = g.stock.filter((c) => c.kind === "regular").length;
          expect(regularInStock).toBe(columns * deals);
          expect(g.stock.filter((c) => c.kind === "joker").length).toBe(jokers);
          expect(inTableau).toBe(104 - columns * deals);
        }
      }
    }
  });

  it("uses all 104 regular cards exactly once across tableau and stock", () => {
    const g = createInitialState({
      columns: 10,
      deals: 5,
      deckPairId: "mathematics",
      seed: "u",
      jokerCount: 0,
    });
    const seen = new Set<number>();
    for (const col of g.columns) {
      for (const p of col) {
        if (p.card.kind === "regular") seen.add(p.card.id);
      }
    }
    for (const c of g.stock) {
      if (c.kind === "regular") seen.add(c.id);
    }
    expect(seen.size).toBe(104);
    for (let i = 0; i < 104; i++) expect(seen.has(i)).toBe(true);
  });

  it("each column top is face up only", () => {
    const g = createInitialState({
      columns: 7,
      deals: 8,
      deckPairId: "mathematics",
      seed: "v",
      jokerCount: 1,
    });
    for (const col of g.columns) {
      if (col.length === 0) continue;
      for (let i = 0; i < col.length - 1; i++) {
        expect(col[i]!.faceUp).toBe(false);
      }
      expect(col[col.length - 1]!.faceUp).toBe(true);
    }
  });
});

describe("createEmptyBoardShell and gameHasAnyCards", () => {
  const cfg = {
    columns: 8,
    deals: 6,
    deckPairId: "base",
    seed: "08-006-BAS-12345678901234",
    jokerCount: 0,
  };

  it("createEmptyBoardShell matches column count and has no cards", () => {
    const shell = createEmptyBoardShell(cfg);
    expect(shell.config).toEqual(cfg);
    expect(shell.columns).toHaveLength(8);
    expect(shell.columns.every((c) => c.length === 0)).toBe(true);
    expect(shell.foundation).toHaveLength(8);
    expect(shell.foundation.every((f) => f.length === 0)).toBe(true);
    expect(shell.stock).toHaveLength(0);
    expect(shell.shelf).toHaveLength(0);
    expect(shell.history).toHaveLength(0);
    expect(gameHasAnyCards(shell)).toBe(false);
  });

  it("gameHasAnyCards is true when stock has a card", () => {
    const shell = createEmptyBoardShell(cfg);
    const withStock: typeof shell = {
      ...shell,
      stock: [{ kind: "joker" as const, id: 0 }],
    };
    expect(gameHasAnyCards(withStock)).toBe(true);
  });
});

describe("buildDoubleDeck", () => {
  it("has 104 unique ids", () => {
    const d = buildDoubleDeck();
    expect(d.length).toBe(104);
    expect(new Set(d.map((c) => c.id)).size).toBe(104);
  });
});
