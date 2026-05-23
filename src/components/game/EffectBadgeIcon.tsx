"use client";

import { colors } from "@/constants/colors";
import { effectBadgeIconPath } from "@/constants/gameArtPaths";
import { dimensions } from "@/constants/dimensions";
import type { EffectId } from "@/engine/types";
import type { EffectBadgeScope } from "@/lib/effectBadgeEntries";

const {
  effectBadgeIconSizePx: iconPx,
  effectBadgeChipPaddingPx: chipPad,
} = dimensions;

const chipPx = iconPx + 2 * chipPad;

const SCOPE_CHIP_BACKGROUND: Record<EffectBadgeScope, string> = {
  card: colors.effectBadgeChipBackground,
  column: colors.effectBadgeColumnChipBackground,
};

const SCOPE_RING: Record<EffectBadgeScope, string> = {
  card: colors.effectBadgeCardScopeRing,
  column: colors.effectBadgeColumnScopeRing,
};

/**
 * Single effect glyph from `public/gameArt/shared/effect-badges/{effectId}.svg`.
 * White icon on a dark chip; column scope uses a lighter chip and ring.
 */
export function EffectBadgeIcon({
  effectId,
  scope,
  title,
}: {
  effectId: EffectId;
  scope: EffectBadgeScope;
  title?: string;
}) {
  const src = effectBadgeIconPath(effectId);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-sm"
      data-effect-badge-chip
      data-effect-badge-scope={scope}
      style={{
        width: chipPx,
        height: chipPx,
        backgroundColor: SCOPE_CHIP_BACKGROUND[scope],
        boxShadow: `0 0 0 1px ${SCOPE_RING[scope]}`,
      }}
      title={title}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      aria-label={title}
    >
      <span
        className="block shrink-0"
        data-effect-badge-glyph
        style={{
          width: iconPx,
          height: iconPx,
          backgroundColor: colors.effectBadgeIconFill,
          WebkitMaskImage: `url(${src})`,
          maskImage: `url(${src})`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
    </span>
  );
}
