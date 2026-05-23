import { describe, expect, it } from "vitest";
import { EFFECT_TRANSPARENT } from "@/content/effectDefinitions";
import { getPowerDefinition, JOKER_POWER_ALL_KINGS_TRANSPARENT } from "@/content/powerDefinitions";
import type { GameState } from "@/engine/types";
import {
  getDeckCardDetailsModel,
  isDeckPopupDetailsClickableCard,
  isInGameCardDetailsClickable,
  shelfPowerChargesForJoker,
} from "@/lib/deckCardDetails";
import { createShelfJokerEntry } from "@/engine/powers";
import { appliedEffect, cardEffectKey } from "@/engine/effects";

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

  it("getDeckCardDetailsModel for joker uses portrait, bio, and power name/description", () => {
    const m = getDeckCardDetailsModel("mathematics", { kind: "joker", id: 0 });
    expect(m?.primaryHeading.length).toBeGreaterThan(0);
    expect(m?.body.length).toBeGreaterThan(0);
    expect(m?.portraitSrc).toContain("/gameArt/portraits/mathematics/");
    const allKings = getPowerDefinition(JOKER_POWER_ALL_KINGS_TRANSPARENT);
    expect(m?.powerName).toBe(allKings.name);
    expect(m?.powerDescription).toBe(allKings.description);
    expect(m?.powerChargesRemaining).toBe(3);
    expect(m?.powerChargesInitial).toBe(3);
  });

  it("getDeckCardDetailsModel uses live shelf charges when provided", () => {
    const joker = { kind: "joker" as const, id: 7 };
    const m = getDeckCardDetailsModel("westernPhilosophy", joker, {
      remaining: 1,
      initial: 3,
    });
    expect(m?.powerChargesRemaining).toBe(1);
    expect(m?.powerChargesInitial).toBe(3);
  });

  it("shelfPowerChargesForJoker reads charges from game shelf", () => {
    const entry = createShelfJokerEntry("westernPhilosophy", { kind: "joker", id: 7 });
    const game = {
      config: { deckPairId: "westernPhilosophy" },
      shelf: [{ ...entry, chargesRemaining: 2 }],
    } as unknown as GameState;
    const charges = shelfPowerChargesForJoker(game, { kind: "joker", id: 7 });
    expect(charges?.remaining).toBe(2);
    expect(charges?.initial).toBe(3);
  });

  it("getDeckCardDetailsModel for court does not include power fields", () => {
    const m = getDeckCardDetailsModel("base", {
      kind: "regular",
      id: 12,
      suit: "S",
      rank: 13,
    });
    expect(m?.powerName).toBeUndefined();
    expect(m?.powerDescription).toBeUndefined();
  });

  it("isInGameCardDetailsClickable is true for face-up courts and transparent face-down courts", () => {
    const king = { kind: "regular" as const, id: 12, suit: "S" as const, rank: 13 as const };
    const emptyEffects = { cardEffects: {} } as unknown as GameState;
    expect(isInGameCardDetailsClickable(emptyEffects, { card: king, faceUp: true })).toBe(true);
    expect(isInGameCardDetailsClickable(emptyEffects, { card: king, faceUp: false })).toBe(false);

    const transparentKing = {
      cardEffects: { [cardEffectKey(king)]: [appliedEffect(EFFECT_TRANSPARENT)] },
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
