import { describe, expect, it } from "vitest";
import { tableauDealColumnOrder, tableauExtraColumnIndices } from "./tableauDealLayout";

describe("tableauExtraColumnIndices", () => {
  it("returns empty when r is 0", () => {
    expect(tableauExtraColumnIndices(10, 0)).toEqual([]);
  });

  it("centres a single extra (left bias when even n)", () => {
    expect(tableauExtraColumnIndices(10, 1)).toEqual([4]);
    expect(tableauExtraColumnIndices(9, 1)).toEqual([4]);
    expect(tableauExtraColumnIndices(8, 1)).toEqual([3]);
  });

  it("matches agreed spacing examples", () => {
    expect(tableauExtraColumnIndices(10, 4)).toEqual([0, 3, 6, 9]);
    expect(tableauExtraColumnIndices(9, 5)).toEqual([0, 2, 4, 6, 8]);
  });
});

describe("tableauDealColumnOrder", () => {
  it("is pure round-robin when t divides n", () => {
    const n = 4;
    const t = 12;
    const o = tableauDealColumnOrder(n, t);
    expect(o).toHaveLength(t);
    for (let i = 0; i < t; i++) {
      expect(o[i]).toBe(i % n);
    }
  });

  it("ends with extras on tall columns left to right (10 cols, 4 extras)", () => {
    const n = 10;
    const t = 54;
    const o = tableauDealColumnOrder(n, t);
    expect(o).toHaveLength(t);
    expect(o.slice(0, 50)).toEqual(
      Array.from({ length: 50 }, (_, i) => i % n),
    );
    expect(o.slice(50)).toEqual([0, 3, 6, 9]);
  });

  it("handles only partial first row (q=0)", () => {
    expect(tableauDealColumnOrder(10, 4)).toEqual([0, 3, 6, 9]);
  });
});
