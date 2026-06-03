import { describe, expect, it } from "vitest";
import { buildDoubleDeck, isJoker } from "./cards";
import {
  applyDealEntriesProgress,
  canDealFromStock,
  dealFromStock,
  getDealColumnIndices,
  leadStockIndicesForUpcomingDeals,
} from "./deal";
import { applyExtraColumn } from "./extraColumn";
import { createShelfJokerEntry } from "./powers";
import { createShelfSetPowerEntry } from "./setPowers";
import { isShelfJoker } from "@/lib/setPowerUi";
import { createInitialState } from "./setup";

describe("getDealColumnIndices", () => {
  it("excludes extra-child columns", () => {
    const g = createInitialState({
      columns: 3,
      deals: 10,
      deckPairId: "mathematics",
      seed: "deal-cols",
      jokerCount: 0,
    });
    const applied = applyExtraColumn(g, 0, 10)!;
    expect(applied.state.columns).toHaveLength(4);
    expect(getDealColumnIndices(applied.state)).toEqual([0, 2, 3]);
  });
});

describe("canDealFromStock", () => {
  it("blocks when an empty deal column exists and tableau can fill every deal column", () => {
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

  it("allows deal when only an extra-child column is empty", () => {
    const d = buildDoubleDeck();
    const g = createInitialState({
      columns: 3,
      deals: 10,
      deckPairId: "mathematics",
      seed: "extra-empty-ok",
      jokerCount: 0,
    });
    const applied = applyExtraColumn(g, 0, 10)!;
    const s = structuredClone(applied.state);
    const dealCols = getDealColumnIndices(s);
    for (const i of dealCols) {
      if (s.columns[i]!.length === 0) {
        s.columns[i] = [{ card: d[0]!, faceUp: true }];
      }
    }
    expect(s.columns[1]).toEqual([]);
    expect(dealCols.length).toBe(3);
    expect(s.columns.reduce((n, c) => n + c.length, 0)).toBeGreaterThanOrEqual(dealCols.length);
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

  it("deals only to deal columns when an extra-child column is present", () => {
    const g = createInitialState({
      columns: 3,
      deals: 10,
      deckPairId: "mathematics",
      seed: "deal-skip-extra",
      jokerCount: 0,
    });
    const applied = applyExtraColumn(g, 0, 10)!;
    const pre = applied.state;
    const len0 = pre.columns[0]!.length;
    const len2 = pre.columns[2]!.length;
    const len3 = pre.columns[3]!.length;
    const before = pre.stock.length;
    const r = dealFromStock(pre);
    expect(r).not.toBeNull();
    expect(r!.state.stock.length).toBe(before - 3);
    expect(r!.state.columns[0]!.length).toBe(len0 + 1);
    expect(r!.state.columns[1]!.length).toBe(0);
    expect(r!.state.columns[2]!.length).toBe(len2 + 1);
    expect(r!.state.columns[3]!.length).toBe(len3 + 1);
    if (r!.history.type === "deal") {
      const dealtCols = r!.history.entries
        .filter((e) => e.tableauColumn !== null)
        .map((e) => e.tableauColumn);
      expect(dealtCols).toEqual([0, 2, 3]);
      expect(dealtCols).not.toContain(1);
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
    expect(r!.state.shelf.filter(isShelfJoker).map((s) => s.card)).toEqual([jok(0)]);
    expect(r!.history.type).toBe("deal");
    if (r!.history.type === "deal") {
      expect(r!.history.entries.length).toBe(3);
    }
  });

  it("appends deal jokers before set-power entries on the shelf", () => {
    const jok = (id: number) => ({ kind: "joker" as const, id });
    const reg = (id: number) =>
      ({ kind: "regular" as const, id, suit: "S" as const, rank: 1 as const });
    const g = createInitialState({
      columns: 2,
      deals: 5,
      deckPairId: "mathematics",
      seed: "shelf-order",
      jokerCount: 0,
    });
    g.shelf = [
      createShelfJokerEntry("mathematics", jok(0)),
      createShelfSetPowerEntry(g, "1-H"),
    ];
    g.stock = [jok(1), reg(100), reg(101)];
    const r = dealFromStock(g);
    expect(r).not.toBeNull();
    expect(r!.state.shelf.map((e) => e.kind)).toEqual(["joker", "joker", "set"]);
    expect(r!.state.shelf[1]!.kind).toBe("joker");
    expect((r!.state.shelf[1] as { card: { id: number } }).card.id).toBe(1);
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
