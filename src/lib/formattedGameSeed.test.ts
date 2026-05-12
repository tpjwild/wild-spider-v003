import { describe, expect, it } from "vitest";
import {
  formatFormattedGameSeed,
  parseFormattedGameSeed,
} from "@/lib/formattedGameSeed";

describe("parseFormattedGameSeed", () => {
  it("parses valid seed and uppercases deck code", () => {
    const p = parseFormattedGameSeed("08-006-plh-12345678901234");
    expect(p).not.toBeNull();
    expect(p!.columns).toBe(8);
    expect(p!.deals).toBe(6);
    expect(p!.deckPairId).toBe("placeholder");
    expect(p!.shuffleKey).toBe("12345678901234");
    expect(p!.canonical).toBe("08-006-PLH-12345678901234");
  });

  it("returns null without hyphens or wrong shape", () => {
    expect(parseFormattedGameSeed("08006PLH12345678901234")).toBeNull();
    expect(parseFormattedGameSeed("8-06-PLH-12345678901234")).toBeNull();
    expect(parseFormattedGameSeed("08-006-PLHX-12345678901234")).toBeNull();
    expect(parseFormattedGameSeed("08-006-XXX-12345678901234")).toBeNull();
  });
});

describe("formatFormattedGameSeed", () => {
  it("pads columns and deals", () => {
    expect(formatFormattedGameSeed(8, 6, "plh", "12345678901234")).toBe(
      "08-006-PLH-12345678901234",
    );
  });
});
