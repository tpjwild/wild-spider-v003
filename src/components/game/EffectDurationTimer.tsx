"use client";

import { colors } from "@/constants/colors";
import { dimensions } from "@/constants/dimensions";
import type { EffectBadgeScope } from "@/lib/effectBadgeEntries";

const { effectBadgeIconSizePx: iconPx, effectBadgeChipPaddingPx: chipPad } = dimensions;
const chipPx = iconPx + 2 * chipPad;

const CHIP_BACKGROUND: Record<EffectBadgeScope, string> = {
  card: colors.effectBadgeChipBackground,
  column: colors.effectBadgeColumnChipBackground,
};

const RING: Record<EffectBadgeScope, string> = {
  card: colors.effectBadgeCardScopeRing,
  column: colors.effectBadgeColumnScopeRing,
};

const TEXT: Record<EffectBadgeScope, string> = {
  card: colors.effectBadgeCountText,
  column: colors.effectBadgeIconFill,
};

/** Move-tick countdown chip; styling matches card or column effect badges. */
export function EffectDurationTimer({
  ticks,
  scope,
}: {
  ticks: number;
  scope: EffectBadgeScope;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-sm text-[9px] font-bold leading-none"
      data-testid="effect-duration-timer"
      data-effect-duration-timer
      data-effect-duration-scope={scope}
      style={{
        width: chipPx,
        height: chipPx,
        backgroundColor: CHIP_BACKGROUND[scope],
        color: TEXT[scope],
        boxShadow: `0 0 0 1px ${RING[scope]}`,
      }}
      aria-hidden
    >
      {ticks}
    </span>
  );
}
