import { describe, expect, it } from "vitest";
import {
  formatFormattedGameSeed,
  parseFormattedGameSeed,
} from "@/lib/formattedGameSeed";

describe("parseFormattedGameSeed", () => {
  it("parses valid seed and uppercases deck code", () => {
    const p = parseFormattedGameSeed("08-006-bas-12345678901234");
    expect(p).not.toBeNull();
    expect(p!.columns).toBe(8);
    expect(p!.deals).toBe(6);
    expect(p!.deckPairId).toBe("base");
    expect(p!.shuffleKey).toBe("12345678901234");
    expect(p!.canonical).toBe("08-006-BAS-12345678901234");
  });

  it("parses MAT, WPH, and CPS deck codes", () => {
    const mat = parseFormattedGameSeed("10-005-mat-12345678901234");
    expect(mat?.deckPairId).toBe("mathematics");
    expect(mat?.canonical).toBe("10-005-MAT-12345678901234");
    const wph = parseFormattedGameSeed("08-006-wph-99999999999999");
    expect(wph?.deckPairId).toBe("westernPhilosophy");
    expect(wph?.canonical).toBe("08-006-WPH-99999999999999");
    const cps = parseFormattedGameSeed("06-004-cps-11111111111111");
    expect(cps?.deckPairId).toBe("computerScience");
    expect(cps?.canonical).toBe("06-004-CPS-11111111111111");
  });

  it("returns null without hyphens or wrong shape", () => {
    expect(parseFormattedGameSeed("08006BAS12345678901234")).toBeNull();
    expect(parseFormattedGameSeed("8-06-BAS-12345678901234")).toBeNull();
    expect(parseFormattedGameSeed("08-006-BASX-12345678901234")).toBeNull();
    expect(parseFormattedGameSeed("08-006-XXX-12345678901234")).toBeNull();
  });
});

describe("formatFormattedGameSeed", () => {
  it("pads columns and deals", () => {
    expect(formatFormattedGameSeed(8, 6, "bas", "12345678901234")).toBe(
      "08-006-BAS-12345678901234",
    );
  });
});
