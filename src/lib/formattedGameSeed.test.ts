import { describe, expect, it } from "vitest";
import {
  formatFormattedGameSeed,
  parseFormattedGameSeed,
} from "@/lib/formattedGameSeed";

describe("parseFormattedGameSeed", () => {
  it("parses seed with suits segment and uppercases deck code", () => {
    const p = parseFormattedGameSeed("08-006-2-bas-12345678901234");
    expect(p).not.toBeNull();
    expect(p!.columns).toBe(8);
    expect(p!.deals).toBe(6);
    expect(p!.numberOfSuits).toBe(2);
    expect(p!.deckPairId).toBe("base");
    expect(p!.shuffleKey).toBe("12345678901234");
    expect(p!.canonical).toBe("08-006-2-BAS-12345678901234");
  });

  it("parses legacy seed without suits as 4 suits", () => {
    const p = parseFormattedGameSeed("08-006-bas-12345678901234");
    expect(p).not.toBeNull();
    expect(p!.columns).toBe(8);
    expect(p!.deals).toBe(6);
    expect(p!.numberOfSuits).toBe(4);
    expect(p!.deckPairId).toBe("base");
    expect(p!.shuffleKey).toBe("12345678901234");
    expect(p!.canonical).toBe("08-006-BAS-12345678901234");
  });

  it("parses MAT, WPH, and CPS deck codes", () => {
    const mat = parseFormattedGameSeed("10-005-4-mat-12345678901234");
    expect(mat?.deckPairId).toBe("mathematics");
    expect(mat?.canonical).toBe("10-005-4-MAT-12345678901234");
    const wph = parseFormattedGameSeed("08-006-1-wph-99999999999999");
    expect(wph?.deckPairId).toBe("westernPhilosophy");
    expect(wph?.numberOfSuits).toBe(1);
    expect(wph?.canonical).toBe("08-006-1-WPH-99999999999999");
    const cps = parseFormattedGameSeed("06-004-4-cps-11111111111111");
    expect(cps?.deckPairId).toBe("computerScience");
    expect(cps?.canonical).toBe("06-004-4-CPS-11111111111111");
  });

  it("returns null without hyphens or wrong shape", () => {
    expect(parseFormattedGameSeed("08006BAS12345678901234")).toBeNull();
    expect(parseFormattedGameSeed("8-06-BAS-12345678901234")).toBeNull();
    expect(parseFormattedGameSeed("08-006-BASX-12345678901234")).toBeNull();
    expect(parseFormattedGameSeed("08-006-XXX-12345678901234")).toBeNull();
    expect(parseFormattedGameSeed("08-006-3-BAS-12345678901234")).toBeNull();
  });
});

describe("formatFormattedGameSeed", () => {
  it("pads columns and deals and includes suits", () => {
    expect(formatFormattedGameSeed(8, 6, 4, "bas", "12345678901234")).toBe(
      "08-006-4-BAS-12345678901234",
    );
    expect(formatFormattedGameSeed(8, 6, 1, "bas", "12345678901234")).toBe(
      "08-006-1-BAS-12345678901234",
    );
  });
});
