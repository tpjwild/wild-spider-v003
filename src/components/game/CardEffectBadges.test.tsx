import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CardEffectBadges } from "@/components/game/CardEffectBadges";
import { dimensions } from "@/constants/dimensions";

describe("CardEffectBadges", () => {
  it("renders nothing when entries is empty", () => {
    const { container } = render(<CardEffectBadges entries={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders scoped icons up to maxEffectBadgesShownIndividually", () => {
    const { container, rerender } = render(
      <CardEffectBadges
        entries={[
          { effectId: "transparent", scope: "card" },
          { effectId: "wild", scope: "column" },
          { effectId: "skip1", scope: "card" },
        ]}
      />,
    );
    expect(container.querySelectorAll("[data-effect-badge-glyph]").length).toBe(3);
    expect(screen.queryByText("3")).not.toBeInTheDocument();

    rerender(<CardEffectBadges entries={[{ effectId: "wild", scope: "column" }]} />);
    expect(container.querySelectorAll("[data-effect-badge-glyph]").length).toBe(1);
  });

  it("renders white glyphs on dark chips with scope on the chip", () => {
    const { container } = render(
      <CardEffectBadges
        entries={[
          { effectId: "wild", scope: "card" },
          { effectId: "skip1", scope: "column" },
        ]}
      />,
    );
    expect(container.querySelector('[data-effect-badge-chip][data-effect-badge-scope="card"]')).toBeTruthy();
    expect(container.querySelector('[data-effect-badge-chip][data-effect-badge-scope="column"]')).toBeTruthy();
    expect(container.querySelectorAll("[data-effect-badge-glyph]").length).toBe(2);
  });

  it("renders a single count badge when entry count exceeds maxEffectBadgesShownIndividually", () => {
    const max = dimensions.maxEffectBadgesShownIndividually;
    const entries = [
      { effectId: "transparent" as const, scope: "card" as const },
      { effectId: "wild" as const, scope: "column" as const },
      { effectId: "halfWild" as const, scope: "card" as const },
      { effectId: "skip1" as const, scope: "column" as const },
    ];
    render(<CardEffectBadges entries={entries} />);
    expect(screen.getByText(String(entries.length))).toBeInTheDocument();
    expect(entries.length).toBeGreaterThan(max);
  });
});
