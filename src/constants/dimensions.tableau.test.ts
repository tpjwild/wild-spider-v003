import { describe, expect, it } from "vitest";
import { dimensions, tableauRowWidthPx } from "@/constants/dimensions";

describe("tableauRowWidthPx", () => {
  it("matches card width and column spacing for n columns", () => {
    expect(tableauRowWidthPx(0)).toBe(0);
    expect(tableauRowWidthPx(1)).toBe(dimensions.cardWidth);
    expect(tableauRowWidthPx(4)).toBe(
      4 * dimensions.cardWidth + 3 * dimensions.columnSpacing,
    );
    expect(tableauRowWidthPx(14)).toBe(
      14 * dimensions.cardWidth + 13 * dimensions.columnSpacing,
    );
  });
});
