import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GameBar } from "@/components/game/GameBar";
import { POWER_TARGET_INVALID_CURSOR_CLASS } from "@/lib/powerTargetUi";
import { DEFAULT_DECK_PAIR_ID } from "@/content/deckPairs";
import { WESTERN_PHILOSOPHY_ID } from "@/content/deckPairs/deckPairWesternPhilosophy";
import { newGame } from "@/engine/game";
import type { GameState } from "@/engine/types";
import { useGameStore } from "@/state/gameStore";

function setStorePowerTargeting(game: GameState, armed: boolean) {
  useGameStore.setState({
    game,
    powerTargeting: armed ? { shelfIndex: 0 } : null,
  });
}

describe("GameBar", () => {
  beforeEach(() => {
    useGameStore.setState({ powerTargeting: null });
  });
  it("shows seed, deck pair, powers, moves, and formatted score", () => {
    const game = newGame({
      columns: 4,
      deals: 5,
      seed: "test-seed",
      deckPairId: WESTERN_PHILOSOPHY_ID,
      jokerCount: 0,
    });
    render(<GameBar game={game} />);
    expect(screen.getByTestId("game-seed")).toHaveTextContent("test-seed");
    expect(screen.getByTestId("copy-seed")).toBeInTheDocument();
    expect(screen.getByTestId("copy-seed")).not.toBeDisabled();
    expect(screen.getByTestId("game-deck-pair")).toHaveTextContent("Western Philosophy");
    expect(screen.getByTestId("game-powers")).toHaveTextContent("0");
    expect(screen.getByTestId("game-moves")).toHaveTextContent("0");
    expect(screen.getByTestId("game-undos")).toHaveTextContent("0");
    expect(screen.getByTestId("game-score")).toHaveTextContent(/\d+\.\d/);
  });

  it("counts power_trigger history entries as powers used", () => {
    const game = newGame({
      columns: 4,
      deals: 5,
      seed: "s",
      deckPairId: DEFAULT_DECK_PAIR_ID,
      jokerCount: 0,
    });
    const withPowers: GameState = {
      ...game,
      history: [
        ...game.history,
        {
          type: "power_trigger",
          shelfIndex: 0,
          chargesBefore: 1,
          cardEffectsAdded: [],
          columnEffectsAdded: [],
        },
        {
          type: "power_trigger",
          shelfIndex: 0,
          chargesBefore: 0,
          cardEffectsAdded: [],
          columnEffectsAdded: [],
        },
      ],
    };
    render(<GameBar game={withPowers} />);
    expect(screen.getByTestId("game-powers")).toHaveTextContent("2");
    expect(screen.getByTestId("game-moves")).toHaveTextContent("2");
  });

  it("shows undoCount as Undos", () => {
    const game = newGame({
      columns: 4,
      deals: 5,
      seed: "s",
      deckPairId: DEFAULT_DECK_PAIR_ID,
      jokerCount: 0,
    });
    render(<GameBar game={{ ...game, undoCount: 3 }} />);
    expect(screen.getByTestId("game-undos")).toHaveTextContent("3");
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

  it("uses invalid target cursor and cancels targeting on pointer down when armed", async () => {
    const game = newGame({
      columns: 4,
      deals: 5,
      seed: "s",
      deckPairId: DEFAULT_DECK_PAIR_ID,
      jokerCount: 0,
    });
    const onCancelPowerTargeting = vi.fn();
    setStorePowerTargeting(game, true);
    render(
      <GameBar
        game={game}
        powerTargetingActive
        onCancelPowerTargeting={onCancelPowerTargeting}
      />,
    );
    expect(screen.getByTestId("game-bar")).toHaveClass(POWER_TARGET_INVALID_CURSOR_CLASS);
    expect(screen.getByTestId("game-bar")).toHaveAttribute("data-power-target-cancel-safe", "true");
    await userEvent.click(screen.getByTestId("game-score"));
    expect(onCancelPowerTargeting).toHaveBeenCalled();
  });

  it("opens deck on pointer enter via hover handler while targeting", async () => {
    const game = newGame({
      columns: 4,
      deals: 5,
      seed: "s",
      deckPairId: DEFAULT_DECK_PAIR_ID,
      jokerCount: 0,
    });
    const onOpenDeck = vi.fn();
    const onOpenDeckHover = vi.fn();
    render(
      <GameBar
        game={game}
        canOpenDeckPopup
        onOpenDeck={onOpenDeck}
        onOpenDeckHover={onOpenDeckHover}
        powerTargetingActive
        openDeckOnPointerEnter
      />,
    );
    await userEvent.hover(screen.getByTestId("deck-popup-open"));
    expect(onOpenDeckHover).toHaveBeenCalled();
    expect(onOpenDeck).not.toHaveBeenCalled();
    expect(screen.getByTestId("deck-popup-open")).not.toHaveClass("cursor-pointer");
  });

  it("does not open deck popup on click while targeting is active", async () => {
    const game = newGame({
      columns: 4,
      deals: 5,
      seed: "s",
      deckPairId: DEFAULT_DECK_PAIR_ID,
      jokerCount: 0,
    });
    const onOpenDeck = vi.fn();
    const onCancelPowerTargeting = vi.fn();
    setStorePowerTargeting(game, true);
    const { rerender } = render(
      <GameBar
        game={game}
        canOpenDeckPopup
        onOpenDeck={onOpenDeck}
        powerTargetingActive
        onCancelPowerTargeting={onCancelPowerTargeting}
      />,
    );
    const deckBtn = screen.getByTestId("deck-popup-open");
    await userEvent.click(deckBtn);
    expect(onCancelPowerTargeting).toHaveBeenCalled();
    expect(onOpenDeck).not.toHaveBeenCalled();

    onCancelPowerTargeting.mockClear();
    onOpenDeck.mockClear();
    setStorePowerTargeting(game, false);
    rerender(
      <GameBar
        game={game}
        canOpenDeckPopup
        onOpenDeck={onOpenDeck}
        powerTargetingActive={false}
        onCancelPowerTargeting={onCancelPowerTargeting}
      />,
    );
    await userEvent.click(deckBtn);
    expect(onOpenDeck).toHaveBeenCalled();
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
