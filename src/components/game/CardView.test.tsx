import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CardView } from "@/components/game/CardView";
import type { PlacedCard } from "@/engine/types";

const aceSpades: PlacedCard = {
  faceUp: true,
  card: { kind: "regular", id: 0, suit: "S", rank: 1 },
};

describe("CardView", () => {
  it("renders face-up rank and suit in corners", () => {
    const { container } = render(<CardView placed={aceSpades} />);
    expect(container.textContent).toContain("A");
    expect(container.textContent).toContain("♠");
  });

  it("renders face-down back without rank text", () => {
    render(
      <CardView
        placed={{
          faceUp: false,
          card: { kind: "regular", id: 0, suit: "S", rank: 1 },
        }}
      />,
    );
    expect(screen.getByText("🂠")).toBeInTheDocument();
    expect(screen.queryByText("♠")).not.toBeInTheDocument();
  });

  it("renders joker corners with vertical letters", () => {
    const { container } = render(
      <CardView
        placed={{
          faceUp: true,
          card: { kind: "joker", id: 0 },
        }}
      />,
    );
    expect(screen.getByLabelText("Joker")).toBeInTheDocument();
    expect((container.textContent ?? "").replace(/\s/g, "")).toBe("JOKERJOKER");
  });

  it("supports transparent display mode", () => {
    const { container } = render(<CardView placed={aceSpades} displayMode="transparent" />);
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  });
});
