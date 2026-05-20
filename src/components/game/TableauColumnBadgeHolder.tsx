"use client";

import { dimensions } from "@/constants/dimensions";
import { CardEffectBadges } from "@/components/game/CardEffectBadges";

const { cardWidth: cw, tableauColumnBadgeHolderHeight: badgeH } = dimensions;

/**
 * Strip above a tableau column for column-level power effects (Stage 5).
 * Effect badges render inside when `effectCount` is greater than zero.
 */
export function TableauColumnBadgeHolder({
  columnIndex,
  effectCount = 0,
}: {
  columnIndex: number;
  effectCount?: number;
}) {
  return (
    <div
      className="relative shrink-0 self-start rounded-sm border border-white/80"
      style={{ width: cw, height: badgeH, boxSizing: "border-box" }}
      data-testid="tableau-column-badge-holder"
      data-column-index={columnIndex}
      aria-label={effectCount > 0 ? `Column ${columnIndex + 1} effects` : `Column ${columnIndex + 1} effect holder`}
    >
      <CardEffectBadges effectCount={effectCount} />
    </div>
  );
}
