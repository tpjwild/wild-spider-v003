"use client";

import type { ReactNode } from "react";
import { colors } from "@/constants/colors";
import { dimensions, stockStackMaxHeightPx } from "@/constants/dimensions";
import { cardDeckIndexForBack } from "@/engine/cards";
import { leadStockIndicesForUpcomingDeals } from "@/engine/deal";
import type { Card, GameState } from "@/engine/types";

const { cardWidth: cw, cardHeight: ch, stockCardOffset: so, stockMaxVisibleLayers } = dimensions;

function backGradientForCard(card: Card): string {
  return cardDeckIndexForBack(card) === 0 ? colors.cardBackDeckOne : colors.cardBackDeckTwo;
}

export function StockPile({
  game,
  onDeal,
  canDeal,
  /** Pre-deal “first pop of deal k” cards; top layer still uses live `game.stock` top (deal-in-progress). */
  frozenUpcomingLeadCards,
  /**
   * During new-game initial deal: show only one back — `game.stock[length - 1 - min(value, length - 1)]`.
   * Matches `InitialDealAnimationState.stockRevealDepth` (bumps with each card after deal sound + flight start).
   */
  initialDealRevealCount,
}: {
  game: GameState;
  onDeal: () => void;
  canDeal: boolean;
  frozenUpcomingLeadCards?: readonly Card[] | null;
  initialDealRevealCount?: number;
}) {
  const stockEmpty = game.stock.length === 0;
  const topCardInteractive = canDeal && !stockEmpty;

  let stackBody: ReactNode = null;
  if (!stockEmpty) {
    if (initialDealRevealCount !== undefined) {
      const fromTop = Math.min(initialDealRevealCount, Math.max(0, game.stock.length - 1));
      const card = game.stock[game.stock.length - 1 - fromTop]!;
      stackBody = (
        <div
          key={`init-stock-${fromTop}-${card.kind}-${card.id}`}
          className={`absolute left-0 top-0 rounded-md border border-zinc-600/80 shadow ${
            topCardInteractive ? "cursor-pointer" : "cursor-default"
          }`}
          style={{
            width: cw,
            height: ch,
            top: 0,
            zIndex: 0,
            background: backGradientForCard(card),
          }}
          onDoubleClick={topCardInteractive ? () => onDeal() : undefined}
        />
      );
    } else {
      const columns = game.columns.length;
      const useFrozen =
        frozenUpcomingLeadCards != null && frozenUpcomingLeadCards.length > 0;
      const leads = useFrozen
        ? null
        : leadStockIndicesForUpcomingDeals(game.stock, columns, stockMaxVisibleLayers);
      const shown = useFrozen ? frozenUpcomingLeadCards.length : leads!.length;
      stackBody = (
        <>
          {Array.from({ length: shown }).map((_, i) => {
            const isTop = i === shown - 1;
            const card: Card = useFrozen
              ? isTop
                ? game.stock[game.stock.length - 1]!
                : frozenUpcomingLeadCards![shown - 1 - i]!
              : game.stock[leads![shown - 1 - i]!]!;
            const key = useFrozen
              ? `${isTop ? "live" : "frz"}-${card.kind}-${card.id}-${i}`
              : `${card.kind}-${card.id}-${leads![shown - 1 - i]}-${i}`;
            return (
              <div
                key={key}
                className={`absolute left-0 rounded-md border border-zinc-600/80 shadow ${
                  isTop && topCardInteractive ? "cursor-pointer" : "cursor-default"
                }`}
                style={{
                  width: cw,
                  height: ch,
                  top: i * so,
                  zIndex: i,
                  background: backGradientForCard(card),
                }}
                onDoubleClick={isTop && topCardInteractive ? () => onDeal() : undefined}
              />
            );
          })}
        </>
      );
    }
  }

  return (
    <div
      className="flex w-full min-w-0 flex-col items-center justify-start"
      style={{ minHeight: stockStackMaxHeightPx }}
    >
      <div className="select-none" data-testid="stock-pile">
        <div
          className="relative shrink-0"
          data-stock-stack
          style={{
            width: cw,
            height: stockStackMaxHeightPx,
          }}
        >
          {stockEmpty ? (
            <div
              className="absolute left-0 top-0 cursor-default rounded-md border-2 border-dashed border-white/60"
              style={{ width: cw, height: ch }}
              aria-label="Stock empty"
            />
          ) : (
            stackBody
          )}
        </div>
      </div>
    </div>
  );
}
