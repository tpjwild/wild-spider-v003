import { describe, expect, it } from "vitest";
import { buildDoubleDeck, isJoker } from "./cards";
import {
  applyDealEntriesProgress,
  canDealFromStock,
  dealFromStock,
  leadStockIndicesForUpcomingDeals,
} from "./deal";
import { createInitialState } from "./setup";

describe("canDealFromStock", () => {
  it("blocks when an empty column exists and tableau can fill every column", () => {
    const g = createInitialState({
      columns: 4,
      deals: 10,
      deckPairId: "mathematics",
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
      deckPairId: "mathematics",
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
      deckPairId: "mathematics",
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

describe("leadStockIndicesForUpcomingDeals", () => {
  function reg(id: number) {
    return { kind: "regular" as const, id, suit: "S" as const, rank: 1 as const };
  }

  it("returns first popped index per deal (no jokers), current top first", () => {
    const stock = Array.from({ length: 16 }, (_, i) => reg(i));
    expect(leadStockIndicesForUpcomingDeals(stock, 8, 8)).toEqual([15, 7]);
  });

  it("respects maxLayers", () => {
    const stock = Array.from({ length: 40 }, (_, i) => reg(i));
    expect(leadStockIndicesForUpcomingDeals(stock, 8, 2)).toEqual([39, 31]);
  });
});

describe("dealFromStock", () => {
  it("places one face-up card per column and shortens stock", () => {
    const g = createInitialState({
      columns: 4,
      deals: 8,
      deckPairId: "mathematics",
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

  it("moves jokers left on top of the stock after the round to the shelf (same deal)", () => {
    function reg(id: number) {
      return { kind: "regular" as const, id, suit: "S" as const, rank: 1 as const };
    }
    function jok(id: number) {
      return { kind: "joker" as const, id };
    }
    const g = createInitialState({
      columns: 2,
      deals: 5,
      deckPairId: "mathematics",
      seed: "drain-joker",
      jokerCount: 0,
    });
    // Bottom joker would strand after two pops if we did not drain post-round.
    g.stock = [jok(0), reg(100), reg(101)];
    const r = dealFromStock(g);
    expect(r).not.toBeNull();
    expect(r!.state.stock).toEqual([]);
    expect(r!.state.shelf.map((s) => s.card)).toEqual([jok(0)]);
    expect(r!.history.type).toBe("deal");
    if (r!.history.type === "deal") {
      expect(r!.history.entries.length).toBe(3);
    }
  });

  it("sends jokers to shelf and still fills each column with regular cards", () => {
    const g = createInitialState({
      columns: 3,
      deals: 5,
      deckPairId: "mathematics",
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
      expect(r!.history.entries.some((e) => e.tableauColumn === null)).toBe(true);
    }
    expect(r!.state.shelf.length).toBeGreaterThan(0);
    for (let c = 0; c < 3; c++) {
      expect(r!.state.columns[c]!.at(-1)!.card.kind).toBe("regular");
    }
  });
});

describe("applyDealEntriesProgress", () => {
  it("matches full dealFromStock when applied to the full entry list", () => {
    const g = createInitialState({
      columns: 4,
      deals: 8,
      deckPairId: "mathematics",
      seed: "deal-once",
      jokerCount: 0,
    });
    const r = dealFromStock(g);
    expect(r).not.toBeNull();
    const h = r!.history;
    expect(h.type).toBe("deal");
    if (h.type !== "deal") return;
    const stepped = applyDealEntriesProgress(g, h.entries, h.entries.length);
    expect(stepped.columns).toEqual(r!.state.columns);
    expect(stepped.stock).toEqual(r!.state.stock);
    expect(stepped.shelf).toEqual(r!.state.shelf);
  });

  it("is a no-op at landedCount 0", () => {
    const g = createInitialState({
      columns: 4,
      deals: 8,
      deckPairId: "mathematics",
      seed: "deal-once",
      jokerCount: 0,
    });
    const r = dealFromStock(g);
    expect(r).not.toBeNull();
    const h = r!.history;
    if (h.type !== "deal") return;
    expect(applyDealEntriesProgress(g, h.entries, 0)).toBe(g);
  });
});
