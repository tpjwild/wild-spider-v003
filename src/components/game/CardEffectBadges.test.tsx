import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CardEffectBadges } from "@/components/game/CardEffectBadges";
import { dimensions } from "@/constants/dimensions";

describe("CardEffectBadges", () => {
  it("renders nothing when entries is empty and no duration", () => {
    const { container } = render(<CardEffectBadges entries={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders duration timer alone when entries empty", () => {
    render(<CardEffectBadges entries={[]} durationTicks={5} durationScope="card" />);
    expect(screen.getByTestId("effect-duration-timer")).toHaveTextContent("5");
  });

  it("hides duration timer when ticks are 0", () => {
    const { container } = render(
      <CardEffectBadges entries={[{ effectId: "wild", scope: "card" }]} durationTicks={0} />,
    );
    expect(container.querySelector("[data-effect-duration-timer]")).toBeNull();
  });

  it("renders timer before card then column scoped icons", () => {
    const { container } = render(
      <CardEffectBadges
        entries={[
          { effectId: "transparent", scope: "card" },
          { effectId: "wild", scope: "column" },
          { effectId: "skip1", scope: "card" },
        ]}
        durationTicks={4}
        durationScope="card"
      />,
    );
    const row = container.firstChild as HTMLElement;
    const children = [...row.children];
    expect(children[0]).toHaveAttribute("data-effect-duration-timer");
    expect(children[0]).toHaveAttribute("data-effect-duration-scope", "card");
    expect(container.querySelectorAll("[data-effect-badge-glyph]").length).toBe(3);
  });

  it("renders scoped icons up to maxEffectBadgesShownIndividually per scope", () => {
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

  it("renders a per-scope count badge when that scope exceeds max, timer still separate", () => {
    const max = dimensions.maxEffectBadgesShownIndividually;
    const cardEntries = [
      { effectId: "transparent" as const, scope: "card" as const },
      { effectId: "wild" as const, scope: "card" as const },
      { effectId: "halfWild" as const, scope: "card" as const },
      { effectId: "skip1" as const, scope: "card" as const },
    ];
    render(
      <CardEffectBadges entries={cardEntries} durationTicks={2} durationScope="card" />,
    );
    expect(cardEntries.length).toBeGreaterThan(max);
    expect(screen.getByTestId("effect-duration-timer")).toHaveTextContent("2");
    expect(screen.getByText(String(cardEntries.length))).toBeInTheDocument();
    expect(screen.getByText(String(cardEntries.length)).closest("[data-effect-badge-count]")).toHaveAttribute(
      "data-effect-badge-scope",
      "card",
    );
  });
});
