"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { colors } from "@/constants/colors";
import { getDeckPairById } from "@/content/deckPairs";
import { CardDetailsPopup } from "@/components/game/CardDetailsPopup";
import { CardView } from "@/components/game/CardView";
import { dimensions } from "@/constants/dimensions";
import { rankChar } from "@/engine/cards";
import type { Card, Suit } from "@/engine/types";
import { isDeckPopupDetailsClickableCard } from "@/lib/deckCardDetails";
import { cardKey, catalogDeckPopupSnapshot } from "@/lib/deckPopupLayout";

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

function CatalogCardCell({
  card,
  deckPairId,
  onOpenDetails,
}: {
  card: Card;
  deckPairId: string;
  onOpenDetails?: (card: Card) => void;
}) {
  const placed = { card, faceUp: true };
  const s = Math.min(deckPopupCardWidth / cw, deckPopupCardHeight / ch);
  const detailsClickable = Boolean(onOpenDetails) && isDeckPopupDetailsClickableCard(card);
  const scaled = (
    <div
      style={{
        width: cw,
        height: ch,
        transform: `scale(${s})`,
        transformOrigin: "center center",
      }}
    >
      <CardView placed={placed} displayMode="faceUp" deckPairId={deckPairId} />
    </div>
  );
  const ariaRankSuit =
    card.kind === "joker" ? "Joker" : `${rankChar(card.rank)} of ${card.suit}, face up`;
  return (
    <div
      className="relative flex shrink-0 items-center justify-center overflow-hidden"
      style={{ width: deckPopupCardWidth, height: deckPopupCardHeight }}
      data-testid="deck-catalog-popup-cell"
      data-details-clickable={detailsClickable ? "true" : "false"}
      aria-label={ariaRankSuit}
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
    </div>
  );
}

function rowWidthPx(cardCount: number): number {
  if (cardCount <= 0) return 0;
  return cardCount * deckPopupCardWidth + (cardCount - 1) * deckPopupColumnPad;
}

function jokerRowWidthPx(jokerCount: number): number {
  if (jokerCount <= 0) return 0;
  if (jokerCount <= 4) return rowWidthPx(jokerCount);
  const betweenDecksGapPx = 3 * deckPopupColumnPad;
  return rowWidthPx(4) + betweenDecksGapPx + rowWidthPx(jokerCount - 4);
}

export function DeckCatalogPopup({
  deckPairId,
  open,
  onClose,
}: {
  deckPairId: string;
  open: boolean;
  onClose: () => void;
}) {
  const pair = getDeckPairById(deckPairId);
  const title = pair?.name ?? "Deck";

  const { jokers, suitRows } = useMemo(() => catalogDeckPopupSnapshot(deckPairId), [deckPairId]);

  const maxRowWidthPx = useMemo(() => {
    const jokerW = jokerRowWidthPx(jokers.length);
    const suitW = rowWidthPx(13);
    return Math.max(jokerW, suitW, deckPopupCardWidth);
  }, [jokers.length]);

  const panelInnerWidthPx = maxRowWidthPx;
  const panelOuterWidthPx = panelInnerWidthPx + 2 * deckPopupHorizontalEdgePad;

  const [detailsCard, setDetailsCard] = useState<Card | null>(null);

  useEffect(() => {
    if (!open) startTransition(() => setDetailsCard(null));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      if (detailsCard !== null) {
        setDetailsCard(null);
        return;
      }
      onClose();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, onClose, detailsCard]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[52] flex cursor-default items-center justify-center p-4"
        style={{ backgroundColor: colors.deckPopupBackdrop }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deck-catalog-popup-title"
        data-testid="deck-catalog-popup"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
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
            id="deck-catalog-popup-title"
            className="shrink-0 border-b border-solid pb-3 text-center text-base font-semibold"
            style={{
              color: colors.popupLightPanelTitleText,
              borderBottomColor: colors.popupLightPanelDivider,
            }}
          >
            {title}
          </h2>

          <div className="min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden py-3">
            {jokers.length > 0 ? (
              <section className="mb-5 w-full" aria-label="Jokers">
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
                            <CatalogCardCell
                              key={cardKey(j)}
                              card={j}
                              deckPairId={deckPairId}
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
                              <CatalogCardCell
                                key={cardKey(j)}
                                card={j}
                                deckPairId={deckPairId}
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
                const suitLabel = suitThemeName(deckPairId, row.suit);
                return (
                  <section key={`${row.deckIndex}-${row.suit}`} className="w-full" aria-label={`${deckLabel} ${row.suit}`}>
                    <h3
                      className="mb-2 w-full text-center text-xs font-semibold uppercase tracking-wide"
                      style={{ color: colors.popupLightPanelMutedText }}
                    >
                      {deckLabel} — {suitLabel}
                    </h3>
                    <div className="flex w-full flex-nowrap justify-center" style={rowGapStyle}>
                      {row.cards.map((c) => (
                        <CatalogCardCell
                          key={cardKey(c)}
                          card={c}
                          deckPairId={deckPairId}
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
        <CardDetailsPopup deckPairId={deckPairId} card={detailsCard} onClose={() => setDetailsCard(null)} />
      ) : null}
    </>
  );
}
