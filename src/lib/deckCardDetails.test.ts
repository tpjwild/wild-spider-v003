import { describe, expect, it } from "vitest";
import { EFFECT_TRANSPARENT } from "@/content/powerDefinitions";
import type { GameState } from "@/engine/types";
import {
  getDeckCardDetailsModel,
  isDeckPopupDetailsClickableCard,
  isInGameCardDetailsClickable,
} from "@/lib/deckCardDetails";
import { cardEffectKey } from "@/engine/effects";

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
    expect(m?.portraitThumbSrc).toBeDefined();
    expect(m?.portraitThumbSrc).not.toBe(m?.portraitSrc);
  });

  it("getDeckCardDetailsModel for joker uses portrait and deck label", () => {
    const m = getDeckCardDetailsModel("mathematics", { kind: "joker", id: 0 });
    expect(m?.primaryHeading.length).toBeGreaterThan(0);
    expect(m?.body.length).toBeGreaterThan(0);
    expect(m?.portraitSrc).toContain("/gameArt/portraits/mathematics/");
  });

  it("isInGameCardDetailsClickable is true for face-up courts and transparent face-down courts", () => {
    const king = { kind: "regular" as const, id: 12, suit: "S" as const, rank: 13 as const };
    const emptyEffects = { cardEffects: {} } as unknown as GameState;
    expect(isInGameCardDetailsClickable(emptyEffects, { card: king, faceUp: true })).toBe(true);
    expect(isInGameCardDetailsClickable(emptyEffects, { card: king, faceUp: false })).toBe(false);

    const transparentKing = {
      cardEffects: { [cardEffectKey(king)]: [EFFECT_TRANSPARENT] },
    } as unknown as GameState;
    expect(isInGameCardDetailsClickable(transparentKing, { card: king, faceUp: false })).toBe(true);
    expect(
      isInGameCardDetailsClickable(transparentKing, {
        card: { kind: "regular", id: 5, suit: "S", rank: 6 as const },
        faceUp: false,
      }),
    ).toBe(false);
  });
});
