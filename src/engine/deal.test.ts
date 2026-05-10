import { describe, expect, it } from "vitest";
import { buildDoubleDeck, isJoker } from "./cards";
import { canDealFromStock, dealFromStock } from "./deal";
import { createInitialState } from "./setup";

describe("canDealFromStock", () => {
  it("blocks when an empty column exists and tableau can fill every column", () => {
    const g = createInitialState({
      columns: 4,
      deals: 10,
      deckPairId: "t",
      seed: "deal-block",
      jokerCount: 0,
    });
    const s = structuredClone(g);
    s.columns[0] = [];
    expect(s.columns.some((c) => c.length === 0)).toBe(true);
    expect(
      s.columns.reduce((n, c) => n + c.length, 0) >= s.columns.length,
    ).toBe(true);
    expect(canDealFromStock(s)).toBe(false);
  });

  it("allows when no empty columns", () => {
    const g = createInitialState({
      columns: 4,
      deals: 10,
      deckPairId: "t",
      seed: "deal-ok",
      jokerCount: 0,
    });
    expect(canDealFromStock(g)).toBe(true);
  });

  it("allows with empty column when total tableau cards < columns", () => {
    const d = buildDoubleDeck();
    const stock = d.slice(0, 20);
    const g = createInitialState({
      columns: 5,
      deals: 10,
      deckPairId: "t",
      seed: "x",
      jokerCount: 0,
    });
    const s = structuredClone(g);
    s.columns = [
      [{ card: d[0]!, faceUp: true }],
      [{ card: d[1]!, faceUp: true }],
      [{ card: d[2]!, faceUp: true }],
      [],
      [],
    ];
    s.stock = stock;
    expect(s.columns.reduce((n, c) => n + c.length, 0)).toBeLessThan(s.columns.length);
    expect(canDealFromStock(s)).toBe(true);
  });
});

describe("dealFromStock", () => {
  it("places one face-up card per column and shortens stock", () => {
    const g = createInitialState({
      columns: 4,
      deals: 8,
      deckPairId: "t",
      seed: "deal-once",
      jokerCount: 0,
    });
    const before = g.stock.length;
    const r = dealFromStock(g);
    expect(r).not.toBeNull();
    expect(r!.state.stock.length).toBe(before - 4);
    for (let c = 0; c < 4; c++) {
      expect(r!.state.columns[c]!.length).toBe(g.columns[c]!.length + 1);
      expect(r!.state.columns[c]!.at(-1)!.faceUp).toBe(true);
    }
  });

  it("sends jokers to shelf and still fills each column with regular cards", () => {
    const g = createInitialState({
      columns: 3,
      deals: 5,
      deckPairId: "t",
      seed: "joker-deal-seed",
      jokerCount: 2,
    });
    const jokers = g.stock.filter(isJoker);
    const regs = g.stock.filter((c) => !isJoker(c));
    // Stock pops from the end; put jokers on top so the first column hits a joker first.
    g.stock = [...regs.slice(0, -6), ...regs.slice(-6), ...jokers];
    const r = dealFromStock(g);
    expect(r).not.toBeNull();
    expect(r!.history.type).toBe("deal");
    if (r!.history.type === "deal") {
      expect(r.history.entries.some((e) => e.tableauColumn === null)).toBe(true);
    }
    expect(r!.state.shelf.length).toBeGreaterThan(0);
    for (let c = 0; c < 3; c++) {
      expect(r!.state.columns[c]!.at(-1)!.card.kind).toBe("regular");
    }
  });
});
