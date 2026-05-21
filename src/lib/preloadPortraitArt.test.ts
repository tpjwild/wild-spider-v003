import { describe, expect, it } from "vitest";
import { collectTableauPortraitPreloadUrls } from "@/lib/preloadPortraitArt";

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
