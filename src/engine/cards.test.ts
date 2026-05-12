import { describe, expect, it } from "vitest";
import { buildDoubleDeck, buildJokers, cardDeckIndexForBack } from "./cards";

describe("cardDeckIndexForBack", () => {
  it("assigns deck 0 to first 52-card copy and deck 1 to second", () => {
    const deck = buildDoubleDeck();
    expect(cardDeckIndexForBack(deck[0]!)).toBe(0);
    expect(cardDeckIndexForBack(deck[51]!)).toBe(0);
    expect(cardDeckIndexForBack(deck[52]!)).toBe(1);
    expect(cardDeckIndexForBack(deck[103]!)).toBe(1);
  });

  it("alternates joker backs by joker id", () => {
    const j = buildJokers(2);
    expect(cardDeckIndexForBack(j[0]!)).toBe(0);
    expect(cardDeckIndexForBack(j[1]!)).toBe(1);
  });
});
