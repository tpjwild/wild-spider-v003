import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GameBar } from "@/components/game/GameBar";
import { DEFAULT_DECK_PAIR_ID } from "@/content/deckPairs";
import { newGame } from "@/engine/game";

describe("GameBar", () => {
  it("shows seed, moves, and formatted score", () => {
    const game = newGame({
      columns: 4,
      deals: 5,
      seed: "test-seed",
      deckPairId: DEFAULT_DECK_PAIR_ID,
      jokerCount: 0,
    });
    render(<GameBar game={game} />);
    expect(screen.getByTestId("game-seed")).toHaveTextContent("test-seed");
    expect(screen.getByTestId("copy-seed")).toBeInTheDocument();
    expect(screen.getByTestId("copy-seed")).not.toBeDisabled();
    expect(screen.getByTestId("game-moves")).toHaveTextContent("0");
    expect(screen.getByTestId("game-score")).toHaveTextContent(/\d+\.\d/);
  });

  it("defers seed display during initial deal", () => {
    const game = newGame({
      columns: 4,
      deals: 5,
      seed: "hidden-until-deal",
      deckPairId: DEFAULT_DECK_PAIR_ID,
      jokerCount: 0,
    });
    render(<GameBar game={game} deferSeedDisplay />);
    expect(screen.getByTestId("game-seed")).toHaveTextContent("—");
    expect(screen.getByTestId("game-seed")).not.toHaveTextContent("hidden-until-deal");
    expect(screen.getByTestId("copy-seed")).toBeDisabled();
  });

  it("copies the visible seed string to clipboard", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    const game = newGame({
      columns: 4,
      deals: 5,
      seed: "inner-seed",
      deckPairId: DEFAULT_DECK_PAIR_ID,
      jokerCount: 0,
    });
    render(<GameBar game={game} />);
    await userEvent.click(screen.getByTestId("copy-seed"));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith("inner-seed");
    vi.unstubAllGlobals();
  });

  it("enables Deck when canOpenDeckPopup and onOpenDeck are set", () => {
    const game = newGame({
      columns: 4,
      deals: 5,
      seed: "s",
      deckPairId: DEFAULT_DECK_PAIR_ID,
      jokerCount: 0,
    });
    const onOpenDeck = vi.fn();
    render(<GameBar game={game} canOpenDeckPopup onOpenDeck={onOpenDeck} canOpenStockPopup onOpenStock={vi.fn()} />);
    expect(screen.getByTestId("deck-popup-open")).not.toBeDisabled();
  });

  it("disables Deck when canOpenDeckPopup is false", () => {
    const game = newGame({
      columns: 4,
      deals: 5,
      seed: "s",
      deckPairId: DEFAULT_DECK_PAIR_ID,
      jokerCount: 0,
    });
    render(<GameBar game={game} canOpenDeckPopup={false} onOpenDeck={() => {}} canOpenStockPopup={false} onOpenStock={() => {}} />);
    expect(screen.getByTestId("deck-popup-open")).toBeDisabled();
  });

  it("enables Stock when canOpenStockPopup and onOpenStock are set", () => {
    const game = newGame({
      columns: 4,
      deals: 5,
      seed: "s",
      deckPairId: DEFAULT_DECK_PAIR_ID,
      jokerCount: 0,
    });
    const onOpenStock = vi.fn();
    render(<GameBar game={game} canOpenStockPopup onOpenStock={onOpenStock} />);
    expect(screen.getByTestId("stock-popup-open")).not.toBeDisabled();
  });

  it("disables Stock when canOpenStockPopup is false", () => {
    const game = newGame({
      columns: 4,
      deals: 5,
      seed: "s",
      deckPairId: DEFAULT_DECK_PAIR_ID,
      jokerCount: 0,
    });
    render(<GameBar game={game} canOpenStockPopup={false} onOpenStock={() => {}} />);
    expect(screen.getByTestId("stock-popup-open")).toBeDisabled();
  });
});
