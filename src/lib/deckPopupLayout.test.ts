import { describe, expect, it } from "vitest";
import { createInitialState } from "@/engine/setup";
import {
  cardKey,
  catalogDeckPopupSnapshot,
  deckPopupSuitRows,
  deckPopupSnapshot,
  DECK_POPUP_SUITS_ORDER,
  shouldDeckPopupFaceDown,
} from "@/lib/deckPopupLayout";

describe("deckPopupLayout", () => {
  it("uses S C D H suit row order", () => {
    expect(DECK_POPUP_SUITS_ORDER.join("")).toBe("SCDH");
  });

  it("produces eight suit rows of thirteen cards each", () => {
    const rows = deckPopupSuitRows();
    expect(rows).toHaveLength(8);
    const seen = new Set<string>();
    for (const row of rows) {
      expect(row.cards).toHaveLength(13);
      for (const c of row.cards) {
        expect(c.rank).toBeGreaterThanOrEqual(1);
        expect(c.rank).toBeLessThanOrEqual(13);
        const k = cardKey(c);
        expect(seen.has(k)).toBe(false);
        seen.add(k);
      }
    }
    expect(seen.size).toBe(104);
  });

  it("marks only stock cards as in-stock in snapshot", () => {
    const game = createInitialState({
      columns: 8,
      deals: 6,
      deckPairId: "base",
      seed: "08-006-BAS-11111111111111",
      jokerCount: 0,
    });
    const snap = deckPopupSnapshot(game);
    expect(snap.jokers).toHaveLength(0);
    let inStock = 0;
    let dealt = 0;
    for (const row of snap.suitRows) {
      for (const c of row.cards) {
        if (snap.stockKeys.has(cardKey(c))) inStock++;
        else dealt++;
      }
    }
    expect(inStock).toBe(game.stock.length);
    expect(dealt + inStock).toBe(104);
  });

  it("includes jokers in snapshot when configured", () => {
    const game = createInitialState({
      columns: 8,
      deals: 6,
      deckPairId: "computerScience",
      seed: "08-006-CPS-22222222222222",
      jokerCount: 2,
    });
    const snap = deckPopupSnapshot(game);
    expect(snap.jokers.length).toBe(2);
    for (const j of snap.jokers) {
      expect(snap.stockKeys.has(cardKey(j))).toBe(true);
    }
  });

  it("catalogDeckPopupSnapshot uses max jokers for the deck pair and eight suit rows", () => {
    const base = catalogDeckPopupSnapshot("base");
    expect(base.jokers).toHaveLength(0);
    expect(base.suitRows).toHaveLength(8);

    const cps = catalogDeckPopupSnapshot("computerScience");
    expect(cps.jokers.length).toBeGreaterThan(0);
    expect(cps.suitRows).toHaveLength(8);
  });

  it("shouldDeckPopupFaceDown is true for stock and face-down tableau cards", () => {
    const game = createInitialState({
      columns: 8,
      deals: 6,
      deckPairId: "base",
      seed: "08-006-BAS-11111111111111",
      jokerCount: 0,
    });
    const stockTop = game.stock[game.stock.length - 1]!;
    expect(shouldDeckPopupFaceDown(game, stockTop)).toBe(true);

    const faceDown = game.columns
      .flatMap((col) => col)
      .find((p) => !p.faceUp);
    expect(faceDown).toBeDefined();
    expect(shouldDeckPopupFaceDown(game, faceDown!.card)).toBe(true);

    const faceUp = game.columns.flatMap((col) => col).find((p) => p.faceUp);
    expect(faceUp).toBeDefined();
    expect(shouldDeckPopupFaceDown(game, faceUp!.card)).toBe(false);
  });
});
