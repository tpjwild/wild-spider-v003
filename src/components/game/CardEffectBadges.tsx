"use client";

import { EffectBadgeIcon } from "@/components/game/EffectBadgeIcon";
import { EffectDurationTimer } from "@/components/game/EffectDurationTimer";
import { colors } from "@/constants/colors";
import { dimensions } from "@/constants/dimensions";
import { EFFECT_DEFINITIONS } from "@/content/effectDefinitions";
import {
  effectBadgeTooltip,
  type EffectBadgeEntry,
  type EffectBadgeScope,
} from "@/lib/effectBadgeEntries";

const { maxEffectBadgesShownIndividually: maxIndividual } = dimensions;

function entryLabel(entry: EffectBadgeEntry): string {
  const label = EFFECT_DEFINITIONS[entry.effectId].label;
  return entry.scope === "column" ? `${label} (column)` : label;
}

function scopeCountBadge(scope: EffectBadgeScope, count: number, title: string) {
  const isColumn = scope === "column";
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-sm px-0.5 text-[9px] font-bold"
      data-effect-badge-count
      data-effect-badge-scope={scope}
      style={{
        minWidth: dimensions.effectBadgeIconSizePx + 2 * dimensions.effectBadgeChipPaddingPx,
        height: dimensions.effectBadgeIconSizePx + 2 * dimensions.effectBadgeChipPaddingPx,
        backgroundColor: isColumn
          ? colors.effectBadgeColumnChipBackground
          : colors.effectBadgeCountBackground,
        color: isColumn ? colors.effectBadgeIconFill : colors.effectBadgeCountText,
        boxShadow: `0 0 0 1px ${
          isColumn ? colors.effectBadgeColumnScopeRing : colors.effectBadgeCountRing
        }`,
      }}
      title={title}
      aria-label={title}
    >
      {count}
    </span>
  );
}

function scopeBadgeGroup(
  entries: readonly EffectBadgeEntry[],
  scope: EffectBadgeScope,
  groupTitle: string,
) {
  const scoped = entries.filter((e) => e.scope === scope);
  if (scoped.length === 0) return null;

  if (scoped.length > maxIndividual) {
    return scopeCountBadge(scope, scoped.length, groupTitle);
  }

  return scoped.map((entry) => (
    <EffectBadgeIcon
      key={`${entry.scope}-${entry.effectId}`}
      effectId={entry.effectId}
      scope={entry.scope}
      title={entryLabel(entry)}
    />
  ));
}

/**
 * Per-card / column effect indicators.
 * Optional duration timer (soonest timed expiry) is always shown when &gt; 0 and is
 * not folded into the per-scope icon collapse.
 */
export function CardEffectBadges({
  entries,
  durationTicks = null,
  durationScope = "card",
}: {
  entries: readonly EffectBadgeEntry[];
  /** Soonest timed ticks for this surface; hidden when null or ≤ 0. */
  durationTicks?: number | null;
  /** Card-style timer on cards; column-style on column badge holders. */
  durationScope?: EffectBadgeScope;
}) {
  const showTimer = durationTicks != null && durationTicks > 0;
  const hasEntries = entries.length > 0;
  if (!showTimer && !hasEntries) return null;

  const title = effectBadgeTooltip(entries);
  const cardGroupTitle =
    entries.filter((e) => e.scope === "card").length > 0
      ? entries
          .filter((e) => e.scope === "card")
          .map(entryLabel)
          .join(", ")
      : "";
  const columnGroupTitle =
    entries.filter((e) => e.scope === "column").length > 0
      ? entries
          .filter((e) => e.scope === "column")
          .map(entryLabel)
          .join(", ")
      : "";

  return (
    <div
      className="pointer-events-none absolute top-0.5 right-0.5 z-30 flex gap-0.5"
      title={hasEntries ? title : undefined}
      aria-label={hasEntries ? title : undefined}
    >
      {showTimer ? <EffectDurationTimer ticks={durationTicks!} scope={durationScope} /> : null}
      {scopeBadgeGroup(entries, "card", cardGroupTitle)}
      {scopeBadgeGroup(entries, "column", columnGroupTitle)}
    </div>
  );
}
