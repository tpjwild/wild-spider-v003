"use client";

import { useRef } from "react";
import { colors } from "@/constants/colors";
import { CopySeedIcon } from "@/components/game/CopySeedIcon";
import { getDeckPairById } from "@/content/deckPairs";
import { countPowerTriggers } from "@/engine/history";
import { computeScore } from "@/engine/scoring";
import { formatScore } from "@/lib/formatScore";
import { normalizeNumberOfSuits, numberOfSuitsGameBarLabel } from "@/lib/numberOfSuits";
import { POWER_TARGET_INVALID_CURSOR_CLASS } from "@/lib/powerTargetUi";
import type { GameState } from "@/engine/types";
import { useGameStore } from "@/state/gameStore";

function isGameBarPopupButton(el: EventTarget | null): boolean {
  return (
    el instanceof HTMLElement &&
    el.closest('[data-testid="deck-popup-open"], [data-testid="stock-popup-open"]') != null
  );
}

export function GameBar({
  game,
  /** When true, seed is hidden until the initial deal animation finishes (new game / restart). */
  deferSeedDisplay = false,
  canOpenDeckPopup = false,
  onOpenDeck,
  onOpenDeckHover,
  canOpenStockPopup = false,
  onOpenStock,
  onOpenStockHover,
  /** While a targeted power is armed, pointer enter opens the popup (spec Power Target mode). */
  openDeckOnPointerEnter = false,
  openStockOnPointerEnter = false,
  powerTargetingActive = false,
  onCancelPowerTargeting,
}: {
  game: GameState;
  deferSeedDisplay?: boolean;
  canOpenDeckPopup?: boolean;
  onOpenDeck?: () => void;
  /** Hover while targeting (does not cancel); click uses {@link onOpenDeck}. */
  onOpenDeckHover?: () => void;
  canOpenStockPopup?: boolean;
  onOpenStock?: () => void;
  onOpenStockHover?: () => void;
  openDeckOnPointerEnter?: boolean;
  openStockOnPointerEnter?: boolean;
  powerTargetingActive?: boolean;
  onCancelPowerTargeting?: () => void;
}) {
  const score = formatScore(computeScore(game).total);
  const moves = game.history.length;
  const powers = countPowerTriggers(game);
  const deckPairName =
    getDeckPairById(game.config.deckPairId)?.name ?? game.config.deckPairId;
  const suitsLabel = numberOfSuitsGameBarLabel(normalizeNumberOfSuits(game.config.numberOfSuits));
  const seed = game.config.seed;
  const seedShown = deferSeedDisplay ? null : seed;

  const suppressPopupOpenClickRef = useRef(false);

  const cancelTargetingIfArmed = () => {
    if (!useGameStore.getState().powerTargeting) return false;
    onCancelPowerTargeting?.();
    return true;
  };

  const cancelPopupButtonPointer = (e: React.PointerEvent) => {
    if (!useGameStore.getState().powerTargeting) return;
    suppressPopupOpenClickRef.current = true;
    onCancelPowerTargeting?.();
    e.preventDefault();
    e.stopPropagation();
  };

  const onPopupButtonClick = (open: (() => void) | undefined) => {
    if (suppressPopupOpenClickRef.current) {
      suppressPopupOpenClickRef.current = false;
      return;
    }
    if (cancelTargetingIfArmed()) return;
    open?.();
  };

  return (
    <header
      className={`grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 gap-y-2 border-b border-black/20 px-3 py-2 text-sm ${
        powerTargetingActive ? POWER_TARGET_INVALID_CURSOR_CLASS : ""
      }`}
      data-testid="game-bar"
      data-power-targeting={powerTargetingActive ? "true" : undefined}
      data-power-target-cancel-safe={powerTargetingActive ? "true" : undefined}
      style={{ backgroundColor: colors.gameBar }}
      onPointerDownCapture={(e) => {
        if (!useGameStore.getState().powerTargeting) return;
        if (isGameBarPopupButton(e.target)) return;
        cancelTargetingIfArmed();
      }}
    >
      <div className="flex min-w-0 items-center justify-self-start text-emerald-100/85">
        <span data-testid="game-seed" className="inline-flex min-w-0 items-center gap-1.5">
          Seed{" "}
          <span
            className={`min-w-0 break-all font-mono ${deferSeedDisplay ? "text-emerald-200/50" : "text-emerald-50"}`}
          >
            {seedShown ?? "—"}
          </span>
          <button
            type="button"
            disabled={deferSeedDisplay}
            className={`-m-0.5 shrink-0 rounded p-0.5 text-emerald-200/90 hover:bg-white/10 hover:text-emerald-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-emerald-200/90 ${
              powerTargetingActive
                ? ""
                : deferSeedDisplay
                  ? "cursor-not-allowed"
                  : "cursor-pointer"
            }`}
            aria-label="Copy seed to clipboard"
            title={deferSeedDisplay ? "Seed shown after the deal finishes" : "Copy seed"}
            data-testid="copy-seed"
            onClick={() => {
              if (deferSeedDisplay) return;
              void navigator.clipboard?.writeText(seed).catch(() => {
                /* ignore — e.g. non-secure context */
              });
            }}
          >
            <CopySeedIcon />
          </button>
        </span>
      </div>

      <div className="flex min-w-0 shrink flex-wrap items-center justify-center gap-x-4 gap-y-1 text-emerald-100/85">
        <span data-testid="game-deck-pair">
          Decks: <span className="text-emerald-50">{deckPairName}</span>
        </span>
        <span data-testid="game-suits">
          Suits: <span className="text-emerald-50">{suitsLabel}</span>
        </span>
        <span data-testid="game-powers">
          Powers: <span className="text-emerald-50">{powers}</span>
        </span>
        <span data-testid="game-moves">
          Moves: <span className="text-emerald-50">{moves}</span>
        </span>
        <span data-testid="game-undos">
          Undos: <span className="text-emerald-50">{game.undoCount}</span>
        </span>
        <span data-testid="game-score">
          Score: <span className="text-emerald-50">{score}</span>
        </span>
      </div>

      <div className="flex justify-end justify-self-end gap-2">
        <button
          type="button"
          disabled={powerTargetingActive ? false : !canOpenDeckPopup || !onOpenDeck}
          className={
            powerTargetingActive
              ? "rounded border border-emerald-800/60 px-3 py-1 text-xs text-emerald-100/90"
              : canOpenDeckPopup && onOpenDeck
                ? "cursor-pointer rounded border border-emerald-800/60 px-3 py-1 text-xs text-emerald-100/90 hover:bg-emerald-950/40"
                : "cursor-not-allowed rounded border border-emerald-950/40 px-3 py-1 text-xs text-emerald-200/40"
          }
          title={
            powerTargetingActive
              ? "Cancel power targeting"
              : canOpenDeckPopup
                ? "Show full deck (dealt vs stock)"
                : "Available when a game has cards in play"
          }
          data-testid="deck-popup-open"
          onPointerDownCapture={cancelPopupButtonPointer}
          onClick={() => onPopupButtonClick(onOpenDeck)}
          {...(openDeckOnPointerEnter && onOpenDeckHover
            ? {
                onPointerEnter: () => {
                  onOpenDeckHover();
                },
              }
            : {})}
        >
          Deck
        </button>
        <button
          type="button"
          disabled={powerTargetingActive ? false : !canOpenStockPopup || !onOpenStock}
          className={
            powerTargetingActive
              ? "rounded border border-emerald-800/60 px-3 py-1 text-xs text-emerald-100/90"
              : canOpenStockPopup && onOpenStock
                ? "cursor-pointer rounded border border-emerald-800/60 px-3 py-1 text-xs text-emerald-100/90 hover:bg-emerald-950/40"
                : "cursor-not-allowed rounded border border-emerald-950/40 px-3 py-1 text-xs text-emerald-200/40"
          }
          title={
            powerTargetingActive
              ? "Cancel power targeting"
              : canOpenStockPopup
                ? "Show stock pile (face-down by deal)"
                : "Available when a game has cards in play"
          }
          data-testid="stock-popup-open"
          onPointerDownCapture={cancelPopupButtonPointer}
          onClick={() => onPopupButtonClick(onOpenStock)}
          {...(openStockOnPointerEnter && onOpenStockHover
            ? {
                onPointerEnter: () => {
                  onOpenStockHover();
                },
              }
            : {})}
        >
          Stock
        </button>
      </div>
    </header>
  );
}
