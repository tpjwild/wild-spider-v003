import { describe, expect, it } from "vitest";
import {
  getPowerDefinition,
  POWER_CARD_SWAP,
  POWER_EXTRA_COLUMN,
  POWER_FOUNDATION_RETURN,
  POWER_SELECTED_CARD_TRANSPARENT,
  powerTargetsDeckPopup,
  powerTargetsStockPopup,
} from "@/content/powerDefinitions";

describe("power popup target kinds", () => {
  it("card transparent targets deck and stock popups", () => {
    expect(powerTargetsDeckPopup(POWER_SELECTED_CARD_TRANSPARENT)).toBe(true);
    expect(powerTargetsStockPopup(POWER_SELECTED_CARD_TRANSPARENT)).toBe(true);
  });

  it("card swap targets deck and stock popups", () => {
    expect(powerTargetsDeckPopup(POWER_CARD_SWAP)).toBe(true);
    expect(powerTargetsStockPopup(POWER_CARD_SWAP)).toBe(true);
  });

  it("foundation return targets neither popup", () => {
    expect(powerTargetsDeckPopup(POWER_FOUNDATION_RETURN)).toBe(false);
    expect(powerTargetsStockPopup(POWER_FOUNDATION_RETURN)).toBe(false);
    expect(getPowerDefinition(POWER_FOUNDATION_RETURN).targetKinds).toEqual([
      "foundationSlot",
    ]);
  });

  it("column powers target neither popup", () => {
    expect(powerTargetsDeckPopup(POWER_EXTRA_COLUMN)).toBe(false);
    expect(powerTargetsStockPopup(POWER_EXTRA_COLUMN)).toBe(false);
  });
});
