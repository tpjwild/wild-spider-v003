import { describe, expect, it } from "vitest";
import { buildDoubleDeck } from "./cards";
import {
  createInitialState,
  InvalidGameConfigError,
  tableauCardCount,
  validateGameConfig,
} from "./setup";

describe("validateGameConfig", () => {
  it("rejects columns > 10", () => {
    expect(() =>
      validateGameConfig({
        columns: 11,
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
});

describe("createInitialState determinism", () => {
  const cfg = {
    columns: 8,
    deals: 6,
    deckPairId: "test",
    seed: "deterministic-seed-42",
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

  it("different seeds differ", () => {
    const a = createInitialState({ ...cfg, seed: "aaa" });
    const b = createInitialState({ ...cfg, seed: "bbb" });
    const idsA = a.stock.map((c) => (c.kind === "regular" ? c.id : -1 - c.id));
    const idsB = b.stock.map((c) => (c.kind === "regular" ? c.id : -1 - c.id));
    expect(idsA).not.toEqual(idsB);
  });
});

describe("tableau distribution", () => {
  it("sums to 104 - columns*deals - jokers for all valid pairs", () => {
    for (let columns = 1; columns <= 10; columns++) {
      for (let deals = 5; deals <= 20; deals++) {
        for (let jokers = 0; jokers <= 4; jokers++) {
          if (columns * deals > 104) continue;
          const cfg = {
            columns,
            deals,
            deckPairId: "t",
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
      deckPairId: "t",
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
      deckPairId: "t",
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

describe("buildDoubleDeck", () => {
  it("has 104 unique ids", () => {
    const d = buildDoubleDeck();
    expect(d.length).toBe(104);
    expect(new Set(d.map((c) => c.id)).size).toBe(104);
  });
});
