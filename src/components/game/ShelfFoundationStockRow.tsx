"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ShelfStrip } from "@/components/game/ShelfStrip";
import { dimensions, foundationRowWidthPx, shelfFlankPaddingTopPx } from "@/constants/dimensions";
import type { Card, GameState } from "@/engine/types";
import { flankColumnWidthPx, shelfPanelWidthPx } from "@/lib/shelfPanelLayout";

type ShelfFoundationStockRowProps = {
  game: GameState;
  shiftInspectMode: boolean;
  onOpenCardDetails?: (card: Card) => void;
  detailsCard: Card | null;
  foundation: ReactNode;
  stock: ReactNode;
};

/**
 * Top row: equal-width shelf/stock flanks and centred foundation.
 * Measures available width and sizes both flanks identically.
 */
export function ShelfFoundationStockRow({
  game,
  shiftInspectMode,
  onOpenCardDetails,
  detailsCard,
  foundation,
  stock,
}: ShelfFoundationStockRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [rowInnerWidth, setRowInnerWidth] = useState(0);

  useLayoutEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setRowInnerWidth(w);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { shelfFoundationGapPx, shelfMinWidthPx, shelfOuterEdgeGapPx } = dimensions;
  const flankWidth =
    rowInnerWidth > 0 ? flankColumnWidthPx(rowInnerWidth, game.shelf) : shelfMinWidthPx;
  const panelWidth = shelfPanelWidthPx(game.shelf, flankWidth);
  const foundationW = foundationRowWidthPx();
  const minRowWidth =
    2 * (shelfMinWidthPx + shelfOuterEdgeGapPx) + 2 * shelfFoundationGapPx + foundationW;

  return (
    <div
      ref={rowRef}
      className="grid w-full items-start"
      style={{
        gridTemplateColumns: `${flankWidth}px ${foundationW}px ${flankWidth}px`,
        columnGap: shelfFoundationGapPx,
        minWidth: minRowWidth,
      }}
    >
      <div
        className="flex min-w-0 justify-center"
        style={{ paddingTop: shelfFlankPaddingTopPx() }}
      >
        <ShelfStrip
          game={game}
          panelWidthPx={panelWidth}
          shiftInspectMode={shiftInspectMode}
          onOpenCardDetails={onOpenCardDetails}
          detailsCard={detailsCard}
        />
      </div>
      <div className="flex min-w-0 justify-center">{foundation}</div>
      <div
        className="flex min-w-0 justify-center"
        style={{ paddingTop: shelfFlankPaddingTopPx() }}
      >
        {stock}
      </div>
    </div>
  );
}
