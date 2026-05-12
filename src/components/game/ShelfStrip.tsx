"use client";

import { CardView } from "@/components/game/CardView";
import { dimensions, shelfHorizontalStepPx, shelfPanelHeightPx } from "@/constants/dimensions";
import type { GameState } from "@/engine/types";

const {
  cardHeight: ch,
  cardWidth: cw,
  shelfHorizontalPad,
  shelfVerticalPad,
  shelfWidth,
} = dimensions;

export function ShelfStrip({ game }: { game: GameState }) {
  const n = game.shelf.length;
  const step = shelfHorizontalStepPx();
  const innerWidth = n <= 0 ? cw : cw + (n - 1) * step;

  return (
    <div
      className="flex flex-col justify-start rounded-lg border border-white/20 bg-black/30"
      style={{
        width: shelfWidth,
        maxWidth: "100%",
        height: shelfPanelHeightPx,
        boxSizing: "border-box",
        paddingTop: shelfVerticalPad,
        paddingBottom: shelfVerticalPad,
        paddingLeft: shelfHorizontalPad,
        paddingRight: shelfHorizontalPad,
      }}
      data-testid="shelf"
    >
      <div className="w-full min-w-0 overflow-x-auto overflow-y-hidden">
        {/** `data-shelf-stack` must exist when empty so deal-flight can measure the first joker slot. */}
        <div className="flex min-w-full justify-start">
          <div
            className="relative shrink-0 isolate"
            data-shelf-stack
            style={{
              height: ch,
              width: innerWidth,
              minWidth: innerWidth,
            }}
          >
            {game.shelf.length === 0 ? (
              <div className="absolute left-0 top-0 shrink-0" style={{ width: cw, height: ch }} aria-hidden />
            ) : (
              game.shelf.map((sj, i) => (
                <div
                  key={`joker-${sj.card.id}`}
                  className="absolute left-0 top-0"
                  style={{
                    left: i * step,
                    width: cw,
                    height: ch,
                    zIndex: 100 + i,
                  }}
                >
                  <CardView placed={{ card: sj.card, faceUp: true }} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
