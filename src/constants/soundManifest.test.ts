import { describe, expect, it } from "vitest";
import { isSoundMp3Shipped } from "@/constants/soundManifest";

describe("soundManifest", () => {
  it("isSoundMp3Shipped is false until an effect is listed in SOUND_MP3_SHIPPED", () => {
    expect(isSoundMp3Shipped("cardDealt")).toBe(false);
    expect(isSoundMp3Shipped("cardPlaced")).toBe(false);
  });
});
