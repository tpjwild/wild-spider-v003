import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TableauDragStackPreview } from "@/components/game/TableauDragStackPreview";
import { emptyExtraColumnState } from "@/engine/extraColumnState";
import { appliedEffect, emptyEffectsState } from "@/engine/effects";
import type { GameState, RegularCard } from "@/engine/types";
import { cardEffectKey } from "@/engine/effects";
import { EFFECT_TRANSPARENT } from "@/content/effectDefinitions";

function reg(id: number): RegularCard {
  return { kind: "regular", id, suit: "S", rank: 5 };
}

function baseState(overrides: Partial<GameState> = {}): GameState {
  return {
    config: { seed: "t", deckPairId: "base", columns: 10, deals: 5, jokerCount: 0 },
    stock: [],
    shelf: [],
    foundation: [],
    columns: Array.from({ length: 10 }, () => []),
    history: [],
    ...emptyEffectsState(),
    ...emptyExtraColumnState(),
    ...overrides,
  } as GameState;
}

describe("TableauDragStackPreview", () => {
  it("shows effect badges when game and columnIndex are provided", () => {
    const card = reg(1);
    const key = cardEffectKey(card);
    const placed = { card, faceUp: true };
    const game = baseState({
      columns: [[placed], ...Array.from({ length: 9 }, () => [])],
      cardEffects: { [key]: [appliedEffect(EFFECT_TRANSPARENT)] },
    });

    const { container } = render(
      <TableauDragStackPreview
        cards={[placed]}
        applyHoverScale={false}
        game={game}
        columnIndex={0}
      />,
    );

    expect(container.querySelectorAll("[data-effect-badge-glyph]").length).toBe(1);
  });

  it("omits effect badges without game context", () => {
    const placed = { card: reg(2), faceUp: true };

    const { container } = render(
      <TableauDragStackPreview cards={[placed]} applyHoverScale={false} />,
    );

    expect(container.querySelectorAll("[data-effect-badge-glyph]").length).toBe(0);
  });
});
