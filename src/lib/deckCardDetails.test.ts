import { describe, expect, it } from "vitest";
import { getDeckCardDetailsModel, isDeckPopupDetailsClickableCard } from "@/lib/deckCardDetails";

describe("deckCardDetails", () => {
  it("isDeckPopupDetailsClickableCard is true for joker, ace, and face ranks only", () => {
    expect(isDeckPopupDetailsClickableCard({ kind: "joker", id: 0 })).toBe(true);
    expect(
      isDeckPopupDetailsClickableCard({ kind: "regular", id: 0, suit: "S", rank: 1 }),
    ).toBe(true);
    expect(
      isDeckPopupDetailsClickableCard({ kind: "regular", id: 10, suit: "S", rank: 11 }),
    ).toBe(true);
    expect(
      isDeckPopupDetailsClickableCard({ kind: "regular", id: 11, suit: "S", rank: 12 }),
    ).toBe(true);
    expect(
      isDeckPopupDetailsClickableCard({ kind: "regular", id: 12, suit: "S", rank: 13 }),
    ).toBe(true);
    expect(
      isDeckPopupDetailsClickableCard({ kind: "regular", id: 5, suit: "S", rank: 6 }),
    ).toBe(false);
  });

  it("getDeckCardDetailsModel for ace uses plural suit name, lowercased-first theme name in heading, description as body", () => {
    const m = getDeckCardDetailsModel("base", {
      kind: "regular",
      id: 0,
      suit: "S",
      rank: 1,
    });
    expect(m?.isPipAce).toBe(true);
    expect(m?.primaryHeading).toBe("Spades the suit of spades");
    expect(m?.body).toContain("Default suit theme");
    expect(m?.portraitSrc).toContain("/gameArt/shared/cards/AS.svg");
  });

  it("getDeckCardDetailsModel ace heading for Computer Science hearts", () => {
    const m = getDeckCardDetailsModel("computerScience", {
      kind: "regular",
      id: 39,
      suit: "H",
      rank: 1,
    });
    expect(m?.primaryHeading).toBe("Hearts the suit of people, Interaction & Society");
    expect(m?.body).toContain("interfaces, collaboration");
  });

  it("getDeckCardDetailsModel for king uses face name and bio", () => {
    const m = getDeckCardDetailsModel("base", {
      kind: "regular",
      id: 12,
      suit: "S",
      rank: 13,
    });
    expect(m?.isPipAce).toBe(false);
    expect(m?.primaryHeading).toBe("King of Spades");
    expect(m?.body).toContain("Face-card slot");
    expect(m?.frameSrc).toBeDefined();
  });

  it("getDeckCardDetailsModel for joker uses portrait and deck label", () => {
    const m = getDeckCardDetailsModel("mathematics", { kind: "joker", id: 0 });
    expect(m?.primaryHeading.length).toBeGreaterThan(0);
    expect(m?.body.length).toBeGreaterThan(0);
    expect(m?.portraitSrc).toContain("/gameArt/portraits/mathematics/");
  });
});
