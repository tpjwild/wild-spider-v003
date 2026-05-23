"use client";

import { EffectBadgeIcon } from "@/components/game/EffectBadgeIcon";
import { colors } from "@/constants/colors";
import { dimensions } from "@/constants/dimensions";
import { EFFECT_DEFINITIONS } from "@/content/effectDefinitions";
import {
  effectBadgeTooltip,
  type EffectBadgeEntry,
} from "@/lib/effectBadgeEntries";

const { maxEffectBadgesShownIndividually: maxIndividual } = dimensions;

function entryLabel(entry: EffectBadgeEntry): string {
  const label = EFFECT_DEFINITIONS[entry.effectId].label;
  return entry.scope === "column" ? `${label} (column)` : label;
}

/**
 * Per-card / column effect indicators.
 * Up to {@link dimensions.maxEffectBadgesShownIndividually} icons; above that, one count badge.
 */
export function CardEffectBadges({ entries }: { entries: readonly EffectBadgeEntry[] }) {
  if (entries.length === 0) return null;

  if (entries.length > maxIndividual) {
    const title = effectBadgeTooltip(entries);
    return (
      <div
        className="pointer-events-none absolute top-0.5 right-0.5 z-30 flex h-4 min-w-4 items-center justify-center rounded px-0.5 text-[9px] font-bold"
        style={{
          backgroundColor: colors.effectBadgeCountBackground,
          color: colors.effectBadgeCountText,
          boxShadow: `0 0 0 1px ${colors.effectBadgeCountRing}`,
        }}
        title={title}
        aria-label={title}
      >
        {entries.length}
      </div>
    );
  }

  const title = effectBadgeTooltip(entries);
  return (
    <div
      className="pointer-events-none absolute top-0.5 right-0.5 z-30 flex gap-0.5"
      title={title}
      aria-label={title}
    >
      {entries.map((entry) => (
        <EffectBadgeIcon
          key={`${entry.scope}-${entry.effectId}`}
          effectId={entry.effectId}
          scope={entry.scope}
          title={entryLabel(entry)}
        />
      ))}
    </div>
  );
}
