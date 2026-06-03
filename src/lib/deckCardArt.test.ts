import { describe, expect, it } from "vitest";
import { faceArtForRegularCard, courtThumbsForSet, jokerArtForCard, sharedJokerSlotFromId } from "@/lib/deckCardArt";

describe("deckCardArt", () => {
  it("faceArtForRegularCard uses shared pip SVGs for ranks 1–10", () => {
    const ace = faceArtForRegularCard("base", {
      kind: "regular",
      id: 0,
      suit: "S",
      rank: 1,
    });
    expect(ace).toEqual({
      portraitPath: "/gameArt/shared/cards/AS.svg",
      portraitThumbPath: "/gameArt/shared/cards/AS.svg",
    });
    const tenH = faceArtForRegularCard("westernPhilosophy", {
      kind: "regular",
      id: 51,
      suit: "H",
      rank: 10,
    });
    expect(tenH).toEqual({
      portraitPath: "/gameArt/shared/cards/10H.svg",
      portraitThumbPath: "/gameArt/shared/cards/10H.svg",
    });
  });

  it("faceArtForRegularCard uses deck pair court portraits for J/Q/K", () => {
    const king = faceArtForRegularCard("mathematics", {
      kind: "regular",
      id: 25,
      suit: "D",
      rank: 13,
    });
    expect(king?.portraitPath).toBe(
      "/gameArt/portraits/mathematics/deck1/math01-king-diamonds-carl-friedrich-gauss.webp",
    );
    expect(king?.portraitThumbPath).toBe(
      "/gameArt/portraits-small/mathematics/deck1/math01-king-diamonds-carl-friedrich-gauss.webp",
    );
    expect(king?.framePath).toBe("/gameArt/shared/frames/king-diamonds-frame.svg");
  });

  it("courtThumbsForSet returns K/Q/J thumb paths for deck and suit", () => {
    const thumbs = courtThumbsForSet("mathematics", 1, "D");
    expect(thumbs).not.toBeNull();
    expect(thumbs!.king).toContain("king-diamonds");
    expect(thumbs!.queen).toContain("queen-diamonds");
    expect(thumbs!.jack).toContain("jack-diamonds");
    expect(thumbs!.king).toContain("/portraits-small/");
  });

  it("sharedJokerSlotFromId cycles 1..4", () => {
    expect(sharedJokerSlotFromId(0)).toBe(1);
    expect(sharedJokerSlotFromId(3)).toBe(4);
    expect(sharedJokerSlotFromId(4)).toBe(1);
    expect(sharedJokerSlotFromId(-1)).toBe(4);
  });

  it("jokerArtForCard uses pair joker list (mathematics)", () => {
    const art = jokerArtForCard("mathematics", 0);
    expect(art.portraitPath).toContain("/gameArt/portraits/mathematics/deck1/");
    expect(art.portraitThumbPath).toContain("/gameArt/portraits-small/mathematics/deck1/");
    expect(art.framePath).toContain("/gameArt/shared/frames/joker-");
  });

  it("jokerArtForCard returns empty paths when pair defines no jokers (Base)", () => {
    expect(jokerArtForCard("base", 0)).toEqual({
      portraitPath: "",
      portraitThumbPath: "",
      framePath: "",
    });
  });
});
