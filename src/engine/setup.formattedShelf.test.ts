import { describe, expect, it } from "vitest";
import { createInitialState, tableauCardCount } from "./setup";

describe("formatted seed: jokers during initial tableau fill → shelf", () => {
  it("keeps all jokers in stock or shelf (never on tableau)", () => {
    const g = createInitialState({
      columns: 8,
      deals: 6,
      deckPairId: "mathematics",
      seed: "08-006-MAT-12345678901234",
      jokerCount: 8,
    });
    const jOnShelf = g.shelf.length;
    const jInStock = g.stock.filter((c) => c.kind === "joker").length;
    expect(jOnShelf + jInStock).toBe(8);
    for (const col of g.columns) {
      for (const p of col) {
        expect(p.card.kind).toBe("regular");
      }
    }
  });

  it("when tableau uses only 52 regulars, no joker sits on shelf (back half starts after index 51)", () => {
    const cfg = {
      columns: 4,
      deals: 13,
      deckPairId: "mathematics" as const,
      seed: "04-013-MAT-12345678901234",
      jokerCount: 8,
    };
    expect(tableauCardCount(cfg)).toBe(52);
    const g = createInitialState(cfg);
    expect(g.shelf.length).toBe(0);
  });

  it("when tableau uses >52 regulars, some shuffles place jokers on shelf", () => {
    let found: { shelf: number; stockJ: number } | null = null;
    for (let n = 0; n < 800; n++) {
      const shuffleKey = `1${String(n).padStart(13, "0")}`;
      const seed = `08-006-MAT-${shuffleKey}`;
      const g = createInitialState({
        columns: 8,
        deals: 6,
        deckPairId: "mathematics",
        seed,
        jokerCount: 8,
      });
      if (g.shelf.length > 0) {
        found = { shelf: g.shelf.length, stockJ: g.stock.filter((c) => c.kind === "joker").length };
        break;
      }
    }
    expect(found).not.toBeNull();
    expect(found!.shelf + found!.stockJ).toBe(8);
  });
});
