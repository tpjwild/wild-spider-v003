import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SetPowerShelfCard } from "@/components/game/SetPowerShelfCard";
import { courtThumbsForSet } from "@/lib/deckCardArt";

describe("SetPowerShelfCard", () => {
  it("renders three court thumbs and black frame for spades", () => {
    const thumbs = courtThumbsForSet("westernPhilosophy", 1, "S");
    expect(thumbs).not.toBeNull();

    render(
      <SetPowerShelfCard
        deckPairId="westernPhilosophy"
        deckNum={1}
        suit="S"
        chargesRemaining={3}
      />,
    );

    expect(screen.getByTestId("set-court-king")).toHaveAttribute("src", thumbs!.king);
    expect(screen.getByTestId("set-court-queen")).toHaveAttribute("src", thumbs!.queen);
    expect(screen.getByTestId("set-court-jack")).toHaveAttribute("src", thumbs!.jack);
    expect(screen.getByTestId("set-power-frame")).toHaveAttribute(
      "src",
      expect.stringContaining("set-black-frame.svg"),
    );
  });

  it("renders red frame for hearts", () => {
    render(
      <SetPowerShelfCard
        deckPairId="westernPhilosophy"
        deckNum={2}
        suit="H"
        chargesRemaining={2}
      />,
    );

    expect(screen.getByTestId("set-power-frame")).toHaveAttribute(
      "src",
      expect.stringContaining("set-red-frame.svg"),
    );
    expect(screen.getByTestId("set-court-king")).toBeInTheDocument();
    expect(screen.getByTestId("set-court-queen")).toBeInTheDocument();
    expect(screen.getByTestId("set-court-jack")).toBeInTheDocument();
  });
});
