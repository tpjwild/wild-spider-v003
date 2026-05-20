import { describe, expect, it } from "vitest";
import { DEFAULT_DECK_PAIR_ID } from "@/content/deckPairs";
import {
  decodeShareableGameSetup,
  encodeShareableGameSetup,
  SHAREABLE_SETUP_PREFIX,
} from "@/lib/shareableGameSetup";

describe("shareableGameSetup", () => {
  it("round-trips a valid config", () => {
    const cfg = {
      columns: 8,
      deals: 6,
      seed: "my-seed",
      deckPairId: "mathematics",
      jokerCount: 2,
    };
    const encoded = encodeShareableGameSetup(cfg);
    expect(encoded.startsWith(SHAREABLE_SETUP_PREFIX)).toBe(true);
    expect(decodeShareableGameSetup(encoded)).toEqual(cfg);
  });

  it("supports unicode in seed", () => {
    const cfg = {
      columns: 4,
      deals: 5,
      seed: "种子🔑",
      deckPairId: DEFAULT_DECK_PAIR_ID,
      jokerCount: 0,
    };
    expect(decodeShareableGameSetup(encodeShareableGameSetup(cfg))?.seed).toBe("种子🔑");
  });

  it("returns null for plain seeds and invalid payloads", () => {
    expect(decodeShareableGameSetup("playwright-stage2")).toBeNull();
    expect(decodeShareableGameSetup(`${SHAREABLE_SETUP_PREFIX}`)).toBeNull();
    expect(decodeShareableGameSetup(`${SHAREABLE_SETUP_PREFIX}!!!`)).toBeNull();
  });
});
