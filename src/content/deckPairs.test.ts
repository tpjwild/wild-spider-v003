import { describe, expect, it } from "vitest";
import {
  deckPairs,
  DEFAULT_DECK_PAIR_ID,
  isDeckPairUnlocked,
  rankSuitImageStem,
  type DeckPairDefinition,
} from "@/content/deckPairs";
import type { Suit } from "@/engine/types";

const SUITS: Suit[] = ["S", "C", "D", "H"];

function assertDeckPairShape(p: DeckPairDefinition) {
  expect(p.pairCode).toMatch(/^[A-Z0-9]{3}$/);
  expect(p.suitThemes).toHaveLength(4);
  for (let i = 0; i < 4; i++) {
    expect(p.suitThemes[i].suit).toBe(SUITS[i]);
  }
  expect(p.decks).toHaveLength(2);
  for (const deck of p.decks) {
    const jLen = deck.jokers.length;
    if (p.id === "base") {
      expect(jLen).toBe(0);
    } else {
      expect(jLen).toBe(4);
      for (let j = 0; j < 4; j++) {
        expect(deck.jokers[j]!.index).toBe((j + 1) as 1 | 2 | 3 | 4);
        expect(deck.jokers[j]!.name.length).toBeGreaterThan(0);
        expect(deck.jokers[j]!.initialCharges).toBeGreaterThan(0);
        expect(deck.jokers[j]!.initialDuration).toBeNull();
      }
    }
    expect(deck.faces).toHaveLength(12);
    const seen = new Set<string>();
    for (const f of deck.faces) {
      const key = `${f.suit}-${f.rank}`;
      expect(seen.has(key)).toBe(false);
      expect(f.name.length).toBeGreaterThan(0);
      seen.add(key);
    }
    for (const s of SUITS) {
      for (const rank of [11, 12, 13] as const) {
        expect(seen.has(`${s}-${rank}`)).toBe(true);
      }
    }
  }
}

describe("deckPairs registry", () => {
  it("has unique ids and pairCodes", () => {
    const ids = deckPairs.map((p) => p.id);
    const codes = deckPairs.map((p) => p.pairCode);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("each entry satisfies structural invariants", () => {
    for (const p of deckPairs) {
      assertDeckPairShape(p);
    }
  });

  it("exposes base pair as default with expected code", () => {
    const base = deckPairs.find((p) => p.id === DEFAULT_DECK_PAIR_ID);
    expect(base?.name).toBe("Base");
    expect(base?.pairCode).toBe("BAS");
    expect(base?.defaultUnlocked).toBe(true);
  });

  it("isDeckPairUnlocked follows defaultUnlocked on each pair", () => {
    for (const p of deckPairs) {
      expect(isDeckPairUnlocked(p)).toBe(p.defaultUnlocked);
    }
  });

  it("exposes mathematics, western philosophy, and computer science with expected codes", () => {
    const mat = deckPairs.find((p) => p.id === "mathematics");
    const wph = deckPairs.find((p) => p.id === "westernPhilosophy");
    const cps = deckPairs.find((p) => p.id === "computerScience");
    expect(mat?.pairCode).toBe("MAT");
    expect(wph?.pairCode).toBe("WPH");
    expect(cps?.pairCode).toBe("CPS");
    expect(mat?.defaultUnlocked).toBe(true);
    expect(wph?.defaultUnlocked).toBe(true);
    expect(cps?.defaultUnlocked).toBe(true);
  });

  it("western philosophy assigns a distinct power to each joker", () => {
    const wph = deckPairs.find((p) => p.id === "westernPhilosophy");
    const powerIds = wph?.decks.flatMap((d) => d.jokers.map((j) => j.powerId)) ?? [];
    expect(powerIds).toHaveLength(8);
    expect(new Set(powerIds).size).toBe(8);
  });
});

describe("rankSuitImageStem", () => {
  it("matches legacy stem naming", () => {
    expect(rankSuitImageStem(11, "H")).toBe("JH");
    expect(rankSuitImageStem(13, "S")).toBe("KS");
  });
});
