import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CardEffectBadges } from "@/components/game/CardEffectBadges";

describe("CardEffectBadges", () => {
  it("renders nothing when effectCount is zero", () => {
    const { container } = render(<CardEffectBadges effectCount={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders one badge per effect when count is 2 or less", () => {
    const { container, rerender } = render(<CardEffectBadges effectCount={2} />);
    expect(container.querySelectorAll(".size-2\\.5").length).toBe(2);
    expect(screen.queryByText("2")).not.toBeInTheDocument();

    rerender(<CardEffectBadges effectCount={1} />);
    expect(container.querySelectorAll(".size-2\\.5").length).toBe(1);
  });

  it("renders a single count badge when effectCount is greater than 2", () => {
    render(<CardEffectBadges effectCount={3} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
