"use client";

import type { HTMLAttributes } from "react";
import { CardView } from "@/components/game/CardView";
import {
  dimensions,
  tableauColumnStackHeightPx,
  tableauColumnStackTopPx,
  TABLEAU_DRAGGABLE_HOVER_SCALE,
} from "@/constants/dimensions";
import type { PlacedCard } from "@/engine/types";

/** Lifted tableau run shown in {@link DragOverlay} or the invalid-drop return flight layer. */
export function TableauDragStackPreview({
  cards,
  applyHoverScale,
  rootProps,
}: {
  cards: readonly PlacedCard[];
  applyHoverScale: boolean;
  rootProps?: HTMLAttributes<HTMLDivElement>;
}) {
  return (
    <div
      className="relative cursor-grabbing shadow-xl"
      style={{
        width: dimensions.cardWidth,
        height: tableauColumnStackHeightPx(cards),
      }}
      {...rootProps}
    >
      {cards.map((placed, i) => (
        <div
          key={`${placed.card.kind}-${placed.card.id}-${i}`}
          className="absolute left-0 inline-block"
          style={{ top: tableauColumnStackTopPx(cards, i), zIndex: i + 1 }}
        >
          <div
            className="inline-block"
            style={
              applyHoverScale
                ? {
                    transform: `scale(${TABLEAU_DRAGGABLE_HOVER_SCALE})`,
                    transformOrigin: "center center",
                  }
                : undefined
            }
          >
            <CardView placed={placed} />
          </div>
        </div>
      ))}
    </div>
  );
}
