import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DeckPopup } from "@/components/game/DeckPopup";
import { createInitialState } from "@/engine/setup";

describe("DeckPopup", () => {
  it("renders joker section and suit rows for a themed pair", () => {
    const game = createInitialState({
      columns: 8,
      deals: 6,
      deckPairId: "computerScience",
      seed: "08-006-CPS-33333333333333",
      jokerCount: 4,
    });
    const onClose = vi.fn();
    render(<DeckPopup game={game} open onClose={onClose} />);
    expect(screen.getByTestId("deck-popup")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Computer Science");
    expect(screen.getByText("Jokers")).toBeInTheDocument();
    const cells = screen.getAllByTestId("deck-popup-cell");
    expect(cells.length).toBe(104 + 4);
  });

  it("closes on Escape", async () => {
    const game = createInitialState({
      columns: 4,
      deals: 5,
      deckPairId: "base",
      seed: "04-005-BAS-44444444444444",
      jokerCount: 0,
    });
    const onClose = vi.fn();
    render(<DeckPopup game={game} open onClose={onClose} />);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });
});
