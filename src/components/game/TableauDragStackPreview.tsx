"use client";

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
  /** Set on {@link DragOverlay} root so invalid-drop return can measure screen position. */
  dragOverlayMeasureMarker = false,
}: {
  cards: readonly PlacedCard[];
  applyHoverScale: boolean;
  dragOverlayMeasureMarker?: boolean;
}) {
  return (
    <div
      className="relative cursor-grabbing shadow-xl"
      style={{
        width: dimensions.cardWidth,
        height: tableauColumnStackHeightPx(cards),
      }}
      {...(dragOverlayMeasureMarker ? { "data-tableau-drag-overlay": "" } : {})}
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
