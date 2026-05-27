"use client";

import { CardEffectBadges } from "@/components/game/CardEffectBadges";
import { CardView } from "@/components/game/CardView";
import {
  dimensions,
  tableauColumnStackHeightPx,
  tableauColumnStackTopPx,
  TABLEAU_DRAGGABLE_HOVER_SCALE,
} from "@/constants/dimensions";
import type { GameState, PlacedCard } from "@/engine/types";
import {
  cardHasTransparentEffectInColumn,
  soonestCardEffectTicks,
  tableauCardDisplayMode,
  tableauEffectBadgeEntries,
  transparentEffectBackOpacity,
} from "@/lib/cardEffectsUi";

/** Lifted tableau run shown in {@link DragOverlay} or the invalid-drop return flight layer. */
export function TableauDragStackPreview({
  cards,
  applyHoverScale,
  /** Set on {@link DragOverlay} root so invalid-drop return can measure screen position. */
  dragOverlayMeasureMarker = false,
  game,
  columnIndex,
}: {
  cards: readonly PlacedCard[];
  applyHoverScale: boolean;
  dragOverlayMeasureMarker?: boolean;
  /** With {@link columnIndex}, each card matches the tableau stack (display mode + effect badges). */
  game?: GameState;
  columnIndex?: number;
}) {
  const matchTableau = game !== undefined && columnIndex !== undefined;

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
            {matchTableau ? (
              <div className="relative inline-block rounded-md">
                <CardView
                  placed={placed}
                  displayMode={tableauCardDisplayMode(game, columnIndex, placed)}
                  faceDownBackOpacity={
                    cardHasTransparentEffectInColumn(game, columnIndex, placed.card)
                      ? transparentEffectBackOpacity()
                      : undefined
                  }
                />
                <CardEffectBadges
                  entries={tableauEffectBadgeEntries(game, columnIndex, placed.card)}
                  durationTicks={soonestCardEffectTicks(game, placed.card)}
                  durationScope="card"
                />
              </div>
            ) : (
              <CardView placed={placed} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
