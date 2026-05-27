import { describe, expect, it } from "vitest";
import {
  columnEffectAffectsTableauCards,
  EFFECT_DEFINITIONS,
  EFFECT_EXTRA_COLUMN,
} from "@/content/effectDefinitions";
import type { EffectId } from "@/engine/types";

describe("columnAffectsTableauCards", () => {
  it("only extraColumn is false in the catalog", () => {
    const withoutExtra = (Object.keys(EFFECT_DEFINITIONS) as EffectId[]).filter(
      (id) => id !== EFFECT_EXTRA_COLUMN,
    );
    for (const id of withoutExtra) {
      expect(EFFECT_DEFINITIONS[id].columnAffectsTableauCards).toBe(true);
    }
    expect(EFFECT_DEFINITIONS[EFFECT_EXTRA_COLUMN].columnAffectsTableauCards).toBe(false);
    expect(columnEffectAffectsTableauCards(EFFECT_EXTRA_COLUMN)).toBe(false);
  });
});
