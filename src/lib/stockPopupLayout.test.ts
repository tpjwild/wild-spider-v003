import { describe, expect, it } from "vitest";
import { isJoker } from "@/engine/cards";
import { dealFromStock } from "@/engine/deal";
import { newGame } from "@/engine/game";
import { stockPopupLayout } from "@/lib/stockPopupLayout";

describe("stockPopupLayout", () => {
  it("chunks all-regular stock into rows of length columns", () => {
    const g = newGame({
      columns: 8,
      deals: 6,
      deckPairId: "base",
      seed: "test-stock-chunk",
      jokerCount: 0,
    });
    const { jokers, dealRows } = stockPopupLayout(g.stock, g.config.columns);
    expect(jokers.length).toBe(0);
    const total = dealRows.reduce((n, r) => n + r.length, 0);
    expect(total).toBe(g.stock.length);
    for (const row of dealRows.slice(0, -1)) {
      expect(row.length).toBe(8);
    }
  });

  it("first deal row matches dealFromStock regular placements", () => {
    const g = newGame({
      columns: 4,
      deals: 8,
      deckPairId: "mathematics",
      seed: "test-stock-first-deal",
      jokerCount: 0,
    });
    const r = dealFromStock(structuredClone(g));
    expect(r).not.toBeNull();
    const h = r!.history;
    expect(h.type).toBe("deal");
    if (h.type !== "deal") return;
    const firstIds = h.entries.filter((e) => e.tableauColumn !== null).map((e) => e.card.id);
    const layout = stockPopupLayout(g.stock, g.config.columns);
    expect(layout.dealRows[0]?.map((c) => c.id)).toEqual(firstIds);
  });

  it("collects jokers from bottom-first stock and trailing top jokers like dealFromStock", () => {
    function reg(id: number) {
      return { kind: "regular" as const, id, suit: "S" as const, rank: 1 as const };
    }
    function jok(id: number) {
      return { kind: "joker" as const, id };
    }
    const stock = [jok(0), reg(100), reg(101)];
    const { jokers, dealRows } = stockPopupLayout(stock, 2);
    expect(jokers.map((j) => j.id)).toEqual([0]);
    expect(dealRows).toHaveLength(1);
    expect(dealRows[0]!.map((c) => c.id)).toEqual([101, 100]);
  });

  it("includes all jokers from stock in jokers list", () => {
    const g = newGame({
      columns: 4,
      deals: 6,
      deckPairId: "computerScience",
      seed: "test-stock-joker-set",
      jokerCount: 4,
    });
    const fromStock = g.stock.filter(isJoker);
    const { jokers } = stockPopupLayout(g.stock, g.config.columns);
    expect(jokers.length).toBe(fromStock.length);
    const a = new Set(fromStock.map((j) => j.id));
    const b = new Set(jokers.map((j) => j.id));
    expect(a).toEqual(b);
  });
});
