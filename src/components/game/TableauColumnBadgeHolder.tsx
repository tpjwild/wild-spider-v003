"use client";

import { useState } from "react";
import { CardEffectBadges } from "@/components/game/CardEffectBadges";
import {
  useActiveTableauInspectSource,
  useSetTableauInspectHover,
} from "@/components/game/TableauInspectContext";
import { colors } from "@/constants/colors";
import { dimensions } from "@/constants/dimensions";
import { EFFECT_DEFINITIONS, EFFECT_EXTRA_COLUMN } from "@/content/effectDefinitions";
import {
  isTableauNamePlateColumnHolderSource,
  NAME_PLATE_INSPECT_HIGHLIGHT_CLASS,
} from "@/lib/cardInspectUi";
import type { EffectBadgeEntry } from "@/lib/effectBadgeEntries";
import {
  POWER_TARGET_CURSOR_CLASS,
  POWER_TARGET_VALID_CURSOR_CLASS,
} from "@/lib/powerTargetUi";

const { cardWidth: cw, tableauColumnBadgeHolderHeight: badgeH } = dimensions;

function ExtraColumnLinkTimerBadge({ movesRemaining }: { movesRemaining: number }) {
  return (
    <div
      className="pointer-events-none absolute left-0.5 top-0.5 z-20 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[9px] font-bold"
      style={{
        backgroundColor: colors.extraColumnLinkTimerBackground,
        color: colors.extraColumnLinkTimerText,
        boxShadow: `0 0 0 1px ${colors.extraColumnLinkTimerRing}`,
      }}
      data-testid="extra-column-link-timer"
      aria-hidden
    >
      {movesRemaining}
    </div>
  );
}

/**
 * Strip above a tableau column for column-level power effects (Stage 5).
 * Effect badges render inside when `entries` is non-empty.
 * Column-targeted powers accept clicks only on this holder, not on cards below.
 */
export function TableauColumnBadgeHolder({
  columnIndex,
  entries = [],
  isExtraChildColumn = false,
  extraChildLinkMovesRemaining = null,
  isColumnPowerTargetMode = false,
  isValidColumnPowerTarget = false,
  onCommitColumnPowerTarget,
}: {
  columnIndex: number;
  entries?: readonly EffectBadgeEntry[];
  /** Lighter green strip + link timer when this column is an extra-child slot. */
  isExtraChildColumn?: boolean;
  extraChildLinkMovesRemaining?: number | null;
  isColumnPowerTargetMode?: boolean;
  isValidColumnPowerTarget?: boolean;
  onCommitColumnPowerTarget?: () => void;
}) {
  const setInspectHover = useSetTableauInspectHover();
  const activeInspectSource = useActiveTableauInspectSource();
  const namePlateHighlight = isTableauNamePlateColumnHolderSource(
    activeInspectSource,
    columnIndex,
  );
  const [targetHover, setTargetHover] = useState(false);
  const showTargetHighlight =
    isValidColumnPowerTarget && targetHover && isColumnPowerTargetMode;

  const cursorClass = isColumnPowerTargetMode
    ? isValidColumnPowerTarget && targetHover
      ? POWER_TARGET_VALID_CURSOR_CLASS
      : POWER_TARGET_CURSOR_CLASS
    : "";

  const holderTitle = isExtraChildColumn
    ? extraChildLinkMovesRemaining != null
      ? `Extra Column (${extraChildLinkMovesRemaining})`
      : EFFECT_DEFINITIONS[EFFECT_EXTRA_COLUMN].label
    : entries.some((e) => e.effectId === EFFECT_EXTRA_COLUMN)
      ? EFFECT_DEFINITIONS[EFFECT_EXTRA_COLUMN].label
      : undefined;

  return (
    <div
      className={`relative shrink-0 self-start rounded-sm border ${cursorClass} ${
        isExtraChildColumn ? "" : "border-white/80"
      } ${isColumnPowerTargetMode ? "z-20" : ""} ${
        showTargetHighlight
          ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-black/30"
          : namePlateHighlight
            ? NAME_PLATE_INSPECT_HIGHLIGHT_CLASS
            : ""
      }`}
      data-name-plate-inspect-highlight={namePlateHighlight ? "true" : undefined}
      data-extra-child-column={isExtraChildColumn ? "true" : undefined}
      style={{
        width: cw,
        height: badgeH,
        boxSizing: "border-box",
        ...(isExtraChildColumn
          ? {
              backgroundColor: colors.tableauExtraChildBadgeHolderBackground,
              borderColor: colors.tableauExtraChildBadgeHolderBorder,
            }
          : {}),
      }}
      title={holderTitle}
      data-testid="tableau-column-badge-holder"
      data-column-index={columnIndex}
      data-power-target-valid={isValidColumnPowerTarget ? "true" : undefined}
      aria-label={
        isColumnPowerTargetMode && isValidColumnPowerTarget
          ? `Column ${columnIndex + 1} — click to apply power`
          : entries.length > 0
            ? `Column ${columnIndex + 1} effects`
            : `Column ${columnIndex + 1} effect holder`
      }
      onPointerEnter={() => {
        setInspectHover({ kind: "columnHolder", columnIndex });
        if (isValidColumnPowerTarget) setTargetHover(true);
      }}
      onPointerLeave={() => {
        setInspectHover(null);
        setTargetHover(false);
      }}
      onClick={(e) => {
        if (!isValidColumnPowerTarget || !onCommitColumnPowerTarget) return;
        e.stopPropagation();
        onCommitColumnPowerTarget();
      }}
    >
      {isExtraChildColumn && extraChildLinkMovesRemaining != null ? (
        <ExtraColumnLinkTimerBadge movesRemaining={extraChildLinkMovesRemaining} />
      ) : null}
      <CardEffectBadges entries={entries} />
    </div>
  );
}
