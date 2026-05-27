"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { colors, deckPopupScrollCssVariables } from "@/constants/colors";
import { CardDetailsPopup } from "@/components/game/CardDetailsPopup";
import { CardView } from "@/components/game/CardView";
import { CardEffectBadges } from "@/components/game/CardEffectBadges";
import { getDeckPairById } from "@/content/deckPairs";
import { shelfPowerChargesForJoker } from "@/lib/deckCardDetails";
import { deckPopupPanelOuterWidthPx, dimensions } from "@/constants/dimensions";
import { rankChar } from "@/engine/cards";
import type { Card, GameState, Suit } from "@/engine/types";
import { isDeckPopupDetailsClickableCard } from "@/lib/deckCardDetails";
import {
  cardHasTransparentEffect,
  deckPopupEffectBadgeEntries,
  soonestCardEffectTicks,
  transparentEffectBackOpacity,
} from "@/lib/cardEffectsUi";
import { cardKey, deckPopupSnapshot, shouldDeckPopupFaceDown } from "@/lib/deckPopupLayout";
import {
  pointerLeftPopupOverlay,
  usePowerTargetPopupHoverDismiss,
} from "@/lib/powerTargetPopupUi";
import {
  deckPopupPowerTargetContextForCommit,
  isDeckPopupPowerTarget,
  powerTargetCursorClass,
  POWER_TARGET_INVALID_CURSOR_CLASS,
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

function suitThemeName(pairId: string, suit: Suit): string {
  const p = getDeckPairById(pairId);
  const t = p?.suitThemes.find((s) => s.suit === suit);
  return t?.name ?? suit;
}

function ScaledCardCell({
  game,
  card,
  deckPairId,
  stockKeys,
  onOpenDetails,
}: {
  game: GameState;
  card: Card;
  deckPairId: string;
  stockKeys: ReadonlySet<string>;
  onOpenDetails?: (card: Card) => void;
}) {
  const key = cardKey(card);
  const inStock = stockKeys.has(key);
  const powerTargeting = useGameStore((s) => s.powerTargeting);
  const commitTargetedPower = useGameStore((s) => s.commitTargetedPower);

  const faceDownInPopup = shouldDeckPopupFaceDown(game, card);
  const effectBadgeEntries = deckPopupEffectBadgeEntries(game, card);
  const mode = faceDownInPopup ? "deckPopupFaceDown" : "faceUp";
  const isPowerTargetMode = powerTargeting != null;
  const isValidPowerTarget =
    isPowerTargetMode &&
    powerTargeting != null &&
    isDeckPopupPowerTarget(game, card, faceDownInPopup, powerTargeting.shelfIndex);
  const [hoverValidTarget, setHoverValidTarget] = useState(false);
  const isSelectedTarget =
    powerTargeting?.selectedTarget?.kind === "card" &&
    powerTargeting.selectedTarget.card.kind === card.kind &&
    powerTargeting.selectedTarget.card.id === card.id;
  const placed = { card, faceUp: true };
  const s = Math.min(deckPopupCardWidth / cw, deckPopupCardHeight / ch);
  const ariaFaceDown = faceDownInPopup && !inStock;
  const detailsClickable =
    Boolean(onOpenDetails) &&
    isDeckPopupDetailsClickableCard(card) &&
    !isPowerTargetMode;
  const scaled = (
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
        displayMode={mode}
        deckPairId={deckPairId}
        faceDownBackOpacity={
          faceDownInPopup && cardHasTransparentEffect(game, card)
            ? transparentEffectBackOpacity()
            : undefined
        }
      />
    </div>
  );
  const cellCursor = powerTargetCursorClass(
    isPowerTargetMode,
    isValidPowerTarget,
    hoverValidTarget,
  );

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden ${cellCursor} ${
        isSelectedTarget
          ? "rounded-md ring-2 ring-sky-400 ring-offset-1 ring-offset-zinc-900/80"
          : isValidPowerTarget && hoverValidTarget
            ? "rounded-md ring-2 ring-amber-400 ring-offset-1 ring-offset-zinc-900/80"
            : ""
      }`}
      style={{ width: deckPopupCardWidth, height: deckPopupCardHeight }}
      data-testid="deck-popup-cell"
      data-in-stock={inStock ? "true" : "false"}
      data-details-clickable={detailsClickable ? "true" : "false"}
      data-power-target-valid={isValidPowerTarget ? "true" : undefined}
      onPointerEnter={() => {
        if (isValidPowerTarget) setHoverValidTarget(true);
      }}
      onPointerLeave={() => {
        if (hoverValidTarget) setHoverValidTarget(false);
      }}
      onClick={(e) => {
        if (!isValidPowerTarget || powerTargeting == null) return;
        e.stopPropagation();
        const ctx = deckPopupPowerTargetContextForCommit(
          game,
          card,
          faceDownInPopup,
          powerTargeting.shelfIndex,
        );
        if (!ctx) return;
        commitTargetedPower(card, ctx);
      }}
      aria-label={
        card.kind === "joker"
          ? inStock
            ? "Joker, in stock"
            : ariaFaceDown
              ? "Joker, face down on tableau"
              : "Joker, dealt"
          : inStock
            ? `${rankChar(card.rank)} of ${card.suit}, in stock`
            : ariaFaceDown
              ? `${rankChar(card.rank)} of ${card.suit}, face down on tableau`
              : `${rankChar(card.rank)} of ${card.suit}, dealt`
      }
    >
      {detailsClickable ? (
        <button
          type="button"
          className="absolute inset-0 z-[5] flex cursor-pointer items-center justify-center border-0 bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
          aria-label="View card details"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails?.(card);
          }}
        >
          {scaled}
        </button>
      ) : (
        scaled
      )}
      <CardEffectBadges
        entries={effectBadgeEntries}
        durationTicks={soonestCardEffectTicks(game, card)}
        durationScope="card"
      />
    </div>
  );
}

function rowWidthPx(cardCount: number): number {
  if (cardCount <= 0) return 0;
  return cardCount * deckPopupCardWidth + (cardCount - 1) * deckPopupColumnPad;
}

/** First four vs second four jokers: triple {@link dimensions.deckPopupColumnPad} between the two groups. */
function jokerRowWidthPx(jokerCount: number): number {
  if (jokerCount <= 0) return 0;
  if (jokerCount <= 4) return rowWidthPx(jokerCount);
  const betweenDecksGapPx = 3 * deckPopupColumnPad;
  return rowWidthPx(4) + betweenDecksGapPx + rowWidthPx(jokerCount - 4);
}

export function DeckPopup({
  game,
  open,
  onClose,
}: {
  game: GameState;
  open: boolean;
  onClose: () => void;
}) {
  const pair = getDeckPairById(game.config.deckPairId);
  const title = pair?.name ?? "Deck";

  const { stockKeys, jokers, suitRows } = useMemo(() => deckPopupSnapshot(game), [game]);

  const maxRowWidthPx = useMemo(() => {
    const jokerW = jokerRowWidthPx(jokers.length);
    const suitW = rowWidthPx(13);
    return Math.max(jokerW, suitW, deckPopupCardWidth);
  }, [jokers.length]);

  const panelOuterWidthPx = deckPopupPanelOuterWidthPx(maxRowWidthPx);

  const [detailsCard, setDetailsCard] = useState<Card | null>(null);

  useEffect(() => {
    if (!open) startTransition(() => setDetailsCard(null));
  }, [open]);

  const powerTargeting = useGameStore((s) => s.powerTargeting);
  const cancelPowerTargeting = useGameStore((s) => s.cancelPowerTargeting);
  usePowerTargetPopupHoverDismiss({
    enabled: open && powerTargeting != null,
    popupTestId: "deck-popup",
    onClose,
  });

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
      if (detailsCard !== null) {
        setDetailsCard(null);
        return;
      }
      onClose();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, onClose, detailsCard, cancelPowerTargeting, powerTargeting]);

  if (!open) return null;

  const popupTargetingCursor = powerTargeting
    ? POWER_TARGET_INVALID_CURSOR_CLASS
    : "cursor-default";

  const dismissOverlayOnPointerLeave = () => {
    if (!powerTargeting) return;
    onClose();
  };

  return (
    <>
    <div
      className="fixed inset-0 z-[52] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deck-popup-title"
      data-testid="deck-popup"
      data-power-targeting={powerTargeting ? "true" : undefined}
    >
      <div
        className={`absolute inset-0 pointer-events-auto ${popupTargetingCursor}`}
        style={{ backgroundColor: colors.deckPopupBackdrop }}
        aria-hidden
        onClick={(e) => {
          if (e.target !== e.currentTarget) return;
          if (useGameStore.getState().powerTargeting) {
            cancelPowerTargeting();
            return;
          }
          onClose();
        }}
      />
      <div
        className={`pointer-events-auto relative z-10 flex max-h-[min(92dvh,920px)] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border shadow-2xl ${popupTargetingCursor}`}
        style={{
          width: panelOuterWidthPx,
          boxSizing: "border-box",
          paddingLeft: deckPopupHorizontalEdgePad,
          paddingRight: deckPopupHorizontalEdgePad,
          paddingTop: deckPopupVerticalEdgePad,
          paddingBottom: deckPopupVerticalEdgePad,
          backgroundColor: colors.deckPopupPanelBackground,
          borderColor: colors.popupLightPanelBorder,
          ...deckPopupScrollCssVariables(),
        }}
        onPointerLeave={(e) => {
          if (!pointerLeftPopupOverlay(e)) return;
          dismissOverlayOnPointerLeave();
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="deck-popup-title"
          className="shrink-0 border-b border-solid pb-3 text-center text-base font-semibold"
          style={{
            color: colors.popupLightPanelTitleText,
            borderBottomColor: colors.popupLightPanelDivider,
          }}
        >
          {title}
        </h2>

        <div className="deck-popup-scroll min-h-0 w-full flex-1 py-3">
          {jokers.length > 0 ? (
            <section className="mb-5 w-full" aria-label="Jokers">
              <h3 className="mb-2 w-full text-center text-xs font-semibold uppercase tracking-wide" style={{ color: colors.popupLightPanelMutedText }}>
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
                          <ScaledCardCell
                            key={cardKey(j)}
                            game={game}
                            card={j}
                            deckPairId={game.config.deckPairId}
                            stockKeys={stockKeys}
                            onOpenDetails={setDetailsCard}
                          />
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
                            <ScaledCardCell
                              key={cardKey(j)}
                              game={game}
                              card={j}
                              deckPairId={game.config.deckPairId}
                              stockKeys={stockKeys}
                              onOpenDetails={setDetailsCard}
                            />
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
            {suitRows.map((row) => {
              const deckLabel = pair?.decks[row.deckIndex]?.name ?? `Deck ${row.deckIndex + 1}`;
              const suitLabel = suitThemeName(game.config.deckPairId, row.suit);
              return (
                <section key={`${row.deckIndex}-${row.suit}`} className="w-full" aria-label={`${deckLabel} ${row.suit}`}>
                  <h3 className="mb-2 w-full text-center text-xs font-semibold uppercase tracking-wide" style={{ color: colors.popupLightPanelMutedText }}>
                    {deckLabel} — {suitLabel}
                  </h3>
                  <div className="flex w-full flex-nowrap justify-center" style={rowGapStyle}>
                    {row.cards.map((c) => (
                      <ScaledCardCell
                        key={cardKey(c)}
                        game={game}
                        card={c}
                        deckPairId={game.config.deckPairId}
                        stockKeys={stockKeys}
                        onOpenDetails={setDetailsCard}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
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
    {detailsCard ? (
      <CardDetailsPopup
        deckPairId={game.config.deckPairId}
        card={detailsCard}
        powerCharges={shelfPowerChargesForJoker(game, detailsCard)}
        onClose={() => setDetailsCard(null)}
      />
    ) : null}
    </>
  );
}
