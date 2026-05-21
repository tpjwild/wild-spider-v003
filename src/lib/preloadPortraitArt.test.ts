import { describe, expect, it } from "vitest";
import {
  cardRevealedByTableauDrag,
  collectCardFacePreloadUrls,
  collectTableauPortraitPreloadUrls,
} from "@/lib/preloadPortraitArt";
import type { PlacedCard, RegularCard } from "@/engine/types";

describe("collectTableauPortraitPreloadUrls", () => {
  it("includes shared pip SVGs for every rank and suit", () => {
    const urls = collectTableauPortraitPreloadUrls("base");
    expect(urls).toContain("/gameArt/shared/cards/AS.svg");
    expect(urls).toContain("/gameArt/shared/cards/10H.svg");
    const pipCount = urls.filter((u) => u.includes("/shared/cards/")).length;
    expect(pipCount).toBe(40);
  });

  it("includes themed court thumbs, frames, and joker art for mathematics", () => {
    const urls = collectTableauPortraitPreloadUrls("mathematics");
    expect(urls.some((u) => u.includes("/portraits-small/mathematics/deck1/"))).toBe(true);
    expect(urls.some((u) => u.includes("/shared/frames/king-diamonds-frame.svg"))).toBe(true);
    expect(urls.some((u) => u.includes("/portraits-small/mathematics/") && u.includes("joker"))).toBe(
      true,
    );
  });

  it("dedupes frame paths shared across multiple faces", () => {
    const urls = collectTableauPortraitPreloadUrls("computerScience");
    const kingDiamondsFrame = urls.filter((u) => u === "/gameArt/shared/frames/king-diamonds-frame.svg");
    expect(kingDiamondsFrame).toHaveLength(1);
  });
});

describe("collectCardFacePreloadUrls", () => {
  it("returns pip SVG for a regular low card", () => {
    const card: RegularCard = { kind: "regular", id: 0, suit: "S", rank: 5 };
    expect(collectCardFacePreloadUrls("base", card)).toEqual(["/gameArt/shared/cards/5S.svg"]);
  });

  it("returns thumb and frame for a themed court", () => {
    const card: RegularCard = { kind: "regular", id: 0, suit: "D", rank: 13 };
    const urls = collectCardFacePreloadUrls("mathematics", card);
    expect(urls[0]).toContain("/portraits-small/mathematics/deck1/");
    expect(urls[1]).toBe("/gameArt/shared/frames/king-diamonds-frame.svg");
  });
});

describe("cardRevealedByTableauDrag", () => {
  const faceDown = (card: PlacedCard["card"]): PlacedCard => ({ card, faceUp: false });
  const faceUp = (card: PlacedCard["card"]): PlacedCard => ({ card, faceUp: true });

  it("returns the card below the run when it is face-down", () => {
    const king: RegularCard = { kind: "regular", id: 10, suit: "H", rank: 13 };
    const queen: RegularCard = { kind: "regular", id: 11, suit: "H", rank: 12 };
    const columns: PlacedCard[][] = [[faceDown(king), faceUp(queen)]];
    expect(cardRevealedByTableauDrag(columns, 0, 1)).toEqual(king);
  });

  it("returns null when startIndex is 0 or the card below is already face-up", () => {
    const queen: RegularCard = { kind: "regular", id: 11, suit: "H", rank: 12 };
    const columns: PlacedCard[][] = [[faceUp(queen)]];
    expect(cardRevealedByTableauDrag(columns, 0, 0)).toBeNull();
    expect(cardRevealedByTableauDrag(columns, 0, 1)).toBeNull();
  });
});
