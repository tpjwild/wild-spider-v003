import { describe, expect, it } from "vitest";
import {
  getPowerDefinition,
  JOKER_POWER_CARD_SWAP,
  JOKER_POWER_EXTRA_COLUMN,
  JOKER_POWER_FOUNDATION_RETURN,
  JOKER_POWER_SELECTED_CARD_TRANSPARENT,
  powerTargetsDeckPopup,
  powerTargetsStockPopup,
} from "@/content/powerDefinitions";

describe("power popup target kinds", () => {
  it("card transparent targets deck and stock popups", () => {
    expect(powerTargetsDeckPopup(JOKER_POWER_SELECTED_CARD_TRANSPARENT)).toBe(true);
    expect(powerTargetsStockPopup(JOKER_POWER_SELECTED_CARD_TRANSPARENT)).toBe(true);
  });

  it("card swap targets deck and stock popups", () => {
    expect(powerTargetsDeckPopup(JOKER_POWER_CARD_SWAP)).toBe(true);
    expect(powerTargetsStockPopup(JOKER_POWER_CARD_SWAP)).toBe(true);
  });

  it("foundation return targets neither popup", () => {
    expect(powerTargetsDeckPopup(JOKER_POWER_FOUNDATION_RETURN)).toBe(false);
    expect(powerTargetsStockPopup(JOKER_POWER_FOUNDATION_RETURN)).toBe(false);
    expect(getPowerDefinition(JOKER_POWER_FOUNDATION_RETURN).targetKinds).toEqual([
      "foundationSlot",
    ]);
  });

  it("column powers target neither popup", () => {
    expect(powerTargetsDeckPopup(JOKER_POWER_EXTRA_COLUMN)).toBe(false);
    expect(powerTargetsStockPopup(JOKER_POWER_EXTRA_COLUMN)).toBe(false);
  });
});
