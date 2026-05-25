"use client";

import type { CSSProperties, ReactNode } from "react";
import { OptionalCardBackImage } from "@/components/game/OptionalCardBackImage";
import { colors } from "@/constants/colors";
import { dimensions, stockStackRegionHeightPx, stockVisibleDealCapForLayout } from "@/constants/dimensions";
import { getDealColumnIndices, leadStockIndicesForUpcomingDeals } from "@/engine/deal";
import type { Card, GameState } from "@/engine/types";
import { cardBackStyleForCard } from "@/lib/deckBackStyle";
import { faceDownBackPathForCard } from "@/lib/deckCardArt";

const { cardWidth: cw, cardHeight: ch, stockCardOffset: so } = dimensions;

/** One face-down stock card: same back URL + gradient layering as {@link CardView}. */
function StockBackCard({
  card,
  deckPairId,
  className,
  style,
  onDoubleClick,
}: {
  card: Card;
  deckPairId: string;
  /** Positioning + chrome (must not include `absolute` — this component applies it). */
  className: string;
  style: CSSProperties;
  onDoubleClick?: () => void;
}) {
  return (
    <div
      className={`absolute flex flex-col items-center justify-center overflow-hidden ${className}`}
      style={style}
      onDoubleClick={onDoubleClick}
    >
      <div
        className="absolute inset-0"
        style={{ background: cardBackStyleForCard(deckPairId, card).gradient }}
        aria-hidden
      />
      <OptionalCardBackImage
        src={faceDownBackPathForCard(card, deckPairId)}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
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
  const stackRegionH = stockStackRegionHeightPx(game.config.deals);
  const leadPreviewCap = stockVisibleDealCapForLayout(game.config.deals);

  let stackBody: ReactNode = null;
  if (!stockEmpty) {
    if (initialDealRevealCount !== undefined) {
      const fromTop = Math.min(initialDealRevealCount, Math.max(0, game.stock.length - 1));
      const card = game.stock[game.stock.length - 1 - fromTop]!;
      stackBody = (
        <StockBackCard
          key={`init-stock-${fromTop}-${card.kind}-${card.id}`}
          card={card}
          deckPairId={game.config.deckPairId}
          className={`left-0 top-0 rounded-md border border-zinc-600/80 shadow ${
            topCardInteractive ? "cursor-pointer" : "cursor-default"
          }`}
          style={{
            width: cw,
            height: ch,
            top: 0,
            zIndex: 0,
          }}
          onDoubleClick={topCardInteractive ? () => onDeal() : undefined}
        />
      );
    } else {
      const dealColumnCount = getDealColumnIndices(game).length;
      const useFrozen =
        frozenUpcomingLeadCards != null && frozenUpcomingLeadCards.length > 0;
      const leads = useFrozen
        ? null
        : leadStockIndicesForUpcomingDeals(game.stock, dealColumnCount, leadPreviewCap);
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
              <StockBackCard
                key={key}
                card={card}
                deckPairId={game.config.deckPairId}
                className={`left-0 rounded-md border border-zinc-600/80 shadow ${
                  isTop && topCardInteractive ? "cursor-pointer" : "cursor-default"
                }`}
                style={{
                  width: cw,
                  height: ch,
                  top: i * so,
                  zIndex: i,
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
      style={{ minHeight: stackRegionH }}
    >
      <div className="select-none" data-testid="stock-pile">
        <div
          className="relative shrink-0"
          data-stock-stack
          style={{
            width: cw,
            height: stackRegionH,
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
