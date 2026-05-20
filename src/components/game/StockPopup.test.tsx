import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StockPopup } from "@/components/game/StockPopup";
import { newGame } from "@/engine/game";

describe("StockPopup", () => {
  it("renders joker section and deal rows", () => {
    const game = newGame({
      columns: 4,
      deals: 6,
      deckPairId: "computerScience",
      seed: "test-stock-popup-ui",
      jokerCount: 4,
    });
    const onClose = vi.fn();
    render(<StockPopup game={game} open onClose={onClose} />);
    expect(screen.getByTestId("stock-popup")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Stock");
    expect(screen.getByText("Jokers")).toBeInTheDocument();
    expect(screen.getByText("Deal 1")).toBeInTheDocument();
    const cells = screen.getAllByTestId("stock-popup-cell");
    expect(cells.length).toBe(game.stock.length);
  });

  it("closes on Escape", async () => {
    const game = newGame({
      columns: 4,
      deals: 5,
      deckPairId: "base",
      seed: "test-stock-popup-esc",
      jokerCount: 0,
    });
    const onClose = vi.fn();
    render(<StockPopup game={game} open onClose={onClose} />);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });
});
