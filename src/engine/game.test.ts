import { describe, expect, it } from "vitest";
import { buildDoubleDeck } from "./cards";
import { dealStock, moveTableau, newGame, undo } from "./game";
import { computeScore } from "./scoring";

describe("undo chain", () => {
  it("restores tableau and decrements score via undoCount", () => {
    const d = buildDoubleDeck();
    const k = d.find((c) => c.suit === "C" && c.rank === 13)!;
    const q = d.find((c) => c.suit === "C" && c.rank === 12 && c.id !== k.id)!;
    let g = newGame({
      columns: 2,
      deals: 10,
      deckPairId: "mathematics",
      seed: "undo-test",
      jokerCount: 0,
    });
    g = {
      ...g,
      columns: [[], [{ card: k, faceUp: false }, { card: q, faceUp: true }]],
    };
    const after = moveTableau(g, { fromColumn: 1, startIndex: 1, toColumn: 0 });
    expect(after).not.toBeNull();
    const back = undo(after!);
    expect(back).not.toBeNull();
    expect(back!.columns[1]!.length).toBe(2);
    expect(back!.columns[1]![0]!.faceUp).toBe(false);
    expect(back!.undoCount).toBe(1);
    expect(computeScore(back!).undoPenalty).toBe(-1);
  });

  it("undoes a deal", () => {
    const g = newGame({
      columns: 3,
      deals: 6,
      deckPairId: "mathematics",
      seed: "deal-undo",
      jokerCount: 0,
    });
    const before = structuredClone(g);
    const dealt = dealStock(g);
    expect(dealt).not.toBeNull();
    const restored = undo(dealt!);
    expect(restored).not.toBeNull();
    expect(restored!.stock.length).toBe(before.stock.length);
    expect(restored!.columns.map((c) => c.length)).toEqual(
      before.columns.map((c) => c.length),
    );
  });
});
