import { describe, expect, it } from "vitest";
import {
  applyInitialDealEntriesProgress,
  buildInitialDealEntries,
  buildInitialDealFlightPlanFromFinalColumns,
  initialDealAnimationBase,
  stripEphemeralGameState,
} from "./initialDeal";
import { createInitialState } from "./setup";

describe("buildInitialDealEntries", () => {
  it("matches derived flight plan for 4 columns (even tableau split)", () => {
    const g = createInitialState({
      columns: 4,
      deals: 10,
      deckPairId: "t",
      seed: "initial-deal-order",
      jokerCount: 0,
    });
    const entries = buildInitialDealEntries(g);
    expect(entries).toEqual(buildInitialDealFlightPlanFromFinalColumns(g.columns));
    expect(entries.length).toBe(g.columns.reduce((s, c) => s + c.length, 0));
    for (let i = 0; i < entries.length; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      expect(entries[i]!.tableauColumn).toBe(col);
      expect(entries[i]!.card).toEqual(g.columns[col]![row]!.card);
      expect(entries[i]!.faceUp).toBe(g.columns[col]![row]!.faceUp);
    }
  });

  it("last tableau deals follow tall columns left-to-right when r > 0", () => {
    const g = createInitialState({
      columns: 10,
      deals: 5,
      deckPairId: "t",
      seed: "uneven-tableau-deal-order",
      jokerCount: 0,
    });
    const entries = buildInitialDealEntries(g);
    expect(entries.length).toBe(54);
    expect(entries.slice(0, 50).map((e) => e.tableauColumn)).toEqual(
      Array.from({ length: 50 }, (_, i) => i % 10),
    );
    expect(entries.slice(50, 54).map((e) => e.tableauColumn)).toEqual([0, 3, 6, 9]);
  });

  it("blank stock-top replay then apply all entries equals full state", () => {
    const g = createInitialState({
      columns: 3,
      deals: 8,
      deckPairId: "t",
      seed: "x",
      jokerCount: 1,
    });
    const entries = buildInitialDealEntries(g);
    const finalGame = stripEphemeralGameState(g);
    const base = initialDealAnimationBase(finalGame, entries);
    const stepped = applyInitialDealEntriesProgress(base, entries, entries.length);
    expect(stripEphemeralGameState(stepped)).toEqual(finalGame);
  });

  it("formatted seed: flight plan includes shelf jokers and replay matches final", () => {
    let g: ReturnType<typeof createInitialState> | null = null;
    for (let n = 0; n < 800; n++) {
      const shuffleKey = `1${String(n).padStart(13, "0")}`;
      const trial = createInitialState({
        columns: 8,
        deals: 6,
        deckPairId: "placeholder",
        seed: `08-006-PLH-${shuffleKey}`,
        jokerCount: 8,
      });
      if (trial.shelf.length > 0) {
        g = trial;
        break;
      }
    }
    expect(g).not.toBeNull();
    const entries = buildInitialDealEntries(g!);
    const shelfFlights = entries.filter((e) => e.tableauColumn === null);
    expect(shelfFlights.length).toBe(g!.shelf.length);
    const finalGame = stripEphemeralGameState(g!);
    const base = initialDealAnimationBase(finalGame, entries);
    expect(base.shelf).toEqual([]);
    const stepped = applyInitialDealEntriesProgress(base, entries, entries.length);
    expect(stripEphemeralGameState(stepped)).toEqual(finalGame);
  });
});
