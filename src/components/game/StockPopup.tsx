"use client";

import { useEffect, useMemo, useState } from "react";
import { colors } from "@/constants/colors";
import { CardEffectBadges } from "@/components/game/CardEffectBadges";
import { CardView } from "@/components/game/CardView";
import { dimensions } from "@/constants/dimensions";
import { rankChar } from "@/engine/cards";
import type { Card, GameState } from "@/engine/types";
import {
  cardEffectCount,
  stockPopupCardDisplayMode,
  transparentEffectBackOpacity,
} from "@/lib/cardEffectsUi";
import { stockPopupLayout } from "@/lib/stockPopupLayout";
import {
  isStockPopupPowerTarget,
  POWER_TARGET_CURSOR_CLASS,
  POWER_TARGET_VALID_CURSOR_CLASS,
} from "@/lib/powerTargetUi";
import { useGameStore } from "@/state/gameStore";

const {
  cardWidth: cw,
  cardHeight: ch,
  deckPopupCardWidth,
  deckPopupCardHeight,
  deckPopupHorizontalEdgePad,
  deckPopupVerticalEdgePad,
  deckPopupColumnPad,
} = dimensions;

const rowGapStyle = { gap: deckPopupColumnPad } as const;

function rowWidthPx(cardCount: number): number {
  if (cardCount <= 0) return 0;
  return cardCount * deckPopupCardWidth + (cardCount - 1) * deckPopupColumnPad;
}

/** Same joker grouping as {@link DeckPopup}: first four vs second four with triple gap. */
function jokerRowWidthPx(jokerCount: number): number {
  if (jokerCount <= 0) return 0;
  if (jokerCount <= 4) return rowWidthPx(jokerCount);
  const betweenDecksGapPx = 3 * deckPopupColumnPad;
  return rowWidthPx(4) + betweenDecksGapPx + rowWidthPx(jokerCount - 4);
}

function StockPopupFaceDownCell({
  game,
  card,
  deckPairId,
}: {
  game: GameState;
  card: Card;
  deckPairId: string;
}) {
  const powerTargeting = useGameStore((s) => s.powerTargeting);
  const commitTargetedPower = useGameStore((s) => s.commitTargetedPower);

  const s = Math.min(deckPopupCardWidth / cw, deckPopupCardHeight / ch);
  const displayMode = stockPopupCardDisplayMode(game, card);
  const placed = { card, faceUp: displayMode === "deckPopupFaceDown" };
  const effectCount = cardEffectCount(game, card);
  const isPowerTargetMode = powerTargeting != null;
  const isValidPowerTarget =
    isPowerTargetMode &&
    powerTargeting != null &&
    isStockPopupPowerTarget(game, card, powerTargeting.shelfIndex);
  const [hoverValidTarget, setHoverValidTarget] = useState(false);

  const cellCursor = isValidPowerTarget
    ? hoverValidTarget
      ? POWER_TARGET_VALID_CURSOR_CLASS
      : POWER_TARGET_CURSOR_CLASS
    : isPowerTargetMode
      ? POWER_TARGET_CURSOR_CLASS
      : "";

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden ${cellCursor} ${
        isValidPowerTarget && hoverValidTarget
          ? "rounded-md ring-2 ring-amber-400 ring-offset-1 ring-offset-zinc-900/80"
          : ""
      }`}
      style={{ width: deckPopupCardWidth, height: deckPopupCardHeight }}
      data-testid="stock-popup-cell"
      data-power-target-valid={isValidPowerTarget ? "true" : undefined}
      aria-label={
        card.kind === "joker"
          ? "Joker, in stock"
          : `${rankChar(card.rank)} of ${card.suit}, in stock`
      }
      onPointerEnter={() => {
        if (isValidPowerTarget) setHoverValidTarget(true);
      }}
      onPointerLeave={() => {
        if (hoverValidTarget) setHoverValidTarget(false);
      }}
      onClick={(e) => {
        if (!isValidPowerTarget) return;
        e.stopPropagation();
        commitTargetedPower(card, { inStockPopup: true });
      }}
    >
      <div
        style={{
          width: cw,
          height: ch,
          transform: `scale(${s})`,
          transformOrigin: "center center",
        }}
      >
        <CardView
          placed={placed}
          displayMode={displayMode}
          deckPairId={deckPairId}
          faceDownBackOpacity={
            displayMode === "deckPopupFaceDown" ? transparentEffectBackOpacity() : undefined
          }
        />
      </div>
      <CardEffectBadges effectCount={effectCount} />
    </div>
  );
}

export function StockPopup({
  game,
  open,
  onClose,
}: {
  game: GameState;
  open: boolean;
  onClose: () => void;
}) {
  const cancelPowerTargeting = useGameStore((s) => s.cancelPowerTargeting);

  const { jokers, dealRows } = useMemo(
    () => stockPopupLayout(game.stock, game.config.columns),
    [game.stock, game.config.columns],
  );

  const maxRowWidthPx = useMemo(() => {
    const jokerW = jokerRowWidthPx(jokers.length);
    const dealW = dealRows.reduce((m, row) => Math.max(m, rowWidthPx(row.length)), 0);
    return Math.max(jokerW, dealW, deckPopupCardWidth);
  }, [jokers.length, dealRows]);

  const panelInnerWidthPx = maxRowWidthPx;
  const panelOuterWidthPx = panelInnerWidthPx + 2 * deckPopupHorizontalEdgePad;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      if (useGameStore.getState().powerTargeting) {
        cancelPowerTargeting();
        return;
      }
      onClose();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, onClose, cancelPowerTargeting]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[53] flex cursor-default items-center justify-center p-4"
      style={{ backgroundColor: colors.deckPopupBackdrop }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="stock-popup-title"
      data-testid="stock-popup"
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        if (useGameStore.getState().powerTargeting) {
          cancelPowerTargeting();
          return;
        }
        onClose();
      }}
    >
      <div
        className="flex max-h-[min(92dvh,920px)] max-w-[calc(100vw-2rem)] cursor-default flex-col overflow-hidden rounded-xl border shadow-2xl"
        style={{
          width: panelOuterWidthPx,
          boxSizing: "border-box",
          paddingLeft: deckPopupHorizontalEdgePad,
          paddingRight: deckPopupHorizontalEdgePad,
          paddingTop: deckPopupVerticalEdgePad,
          paddingBottom: deckPopupVerticalEdgePad,
          backgroundColor: colors.deckPopupPanelBackground,
          borderColor: colors.popupLightPanelBorder,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="stock-popup-title"
          className="shrink-0 border-b border-solid pb-3 text-center text-base font-semibold"
          style={{
            color: colors.popupLightPanelTitleText,
            borderBottomColor: colors.popupLightPanelDivider,
          }}
        >
          Stock
        </h2>

        <div className="min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden py-3">
          {jokers.length > 0 ? (
            <section className="mb-5 w-full" aria-label="Jokers in stock">
              <h3
                className="mb-2 w-full text-center text-xs font-semibold uppercase tracking-wide"
                style={{ color: colors.popupLightPanelMutedText }}
              >
                Jokers
              </h3>
              <div className="flex w-full flex-wrap items-center justify-center gap-0">
                {(() => {
                  const betweenDecksGapPx = 3 * deckPopupColumnPad;
                  const first = jokers.slice(0, 4);
                  const rest = jokers.slice(4);
                  return (
                    <>
                      <div className="flex flex-wrap justify-center" style={rowGapStyle}>
                        {first.map((j) => (
                          <StockPopupFaceDownCell key={`joker-${j.id}`} game={game} card={j} deckPairId={game.config.deckPairId} />
                        ))}
                      </div>
                      {rest.length > 0 ? (
                        <div
                          className="shrink-0"
                          style={{ width: betweenDecksGapPx, minWidth: betweenDecksGapPx }}
                          aria-hidden
                        />
                      ) : null}
                      {rest.length > 0 ? (
                        <div className="flex flex-wrap justify-center" style={rowGapStyle}>
                          {rest.map((j) => (
                            <StockPopupFaceDownCell key={`joker-${j.id}-b`} game={game} card={j} deckPairId={game.config.deckPairId} />
                          ))}
                        </div>
                      ) : null}
                    </>
                  );
                })()}
              </div>
            </section>
          ) : null}

          <div className="flex w-full flex-col gap-5">
            {dealRows.map((row, dealIdx) => (
              <section key={`deal-${dealIdx}`} className="w-full" aria-label={`Deal ${dealIdx + 1}`}>
                <h3
                  className="mb-2 w-full text-center text-xs font-semibold uppercase tracking-wide"
                  style={{ color: colors.popupLightPanelMutedText }}
                >
                  Deal {dealIdx + 1}
                </h3>
                <div className="flex w-full flex-nowrap justify-center" style={rowGapStyle}>
                  {row.map((c) => (
                    <StockPopupFaceDownCell key={`${c.kind}-${c.id}`} game={game} card={c} deckPairId={game.config.deckPairId} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <div
          className="flex shrink-0 justify-end border-t border-solid pt-3"
          style={{ borderTopColor: colors.popupLightPanelDivider }}
        >
          <button
            type="button"
            className="cursor-pointer rounded border border-solid px-3 py-1 text-xs transition hover:brightness-95"
            style={{
              backgroundColor: colors.popupLightCloseButtonBackground,
              borderColor: colors.popupLightCloseButtonBorder,
              color: colors.popupLightCloseButtonText,
            }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
