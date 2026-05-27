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
import { powerTargetCursorClass } from "@/lib/powerTargetUi";
import { useGameStore } from "@/state/gameStore";

const { cardWidth: cw, tableauColumnBadgeHolderHeight: badgeH } = dimensions;

/**
 * Strip above a tableau column for column-level power effects (Stage 5).
 * Effect badges render inside when `entries` is non-empty.
 * Column-targeted powers accept clicks only on this holder, not on cards below.
 */
export function TableauColumnBadgeHolder({
  columnIndex,
  entries = [],
  columnDurationTicks = null,
  isExtraChildColumn = false,
  isColumnPowerTargetMode = false,
  isValidColumnPowerTarget = false,
  onCommitColumnPowerTarget,
}: {
  columnIndex: number;
  entries?: readonly EffectBadgeEntry[];
  /** Soonest timed column effect / parent Extra Column link ticks; shown on holder only. */
  columnDurationTicks?: number | null;
  /** Lighter green strip when this column is an extra-child slot. */
  isExtraChildColumn?: boolean;
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
  const powerTargeting = useGameStore((s) => s.powerTargeting);
  const [targetHover, setTargetHover] = useState(false);
  const showTargetHighlight =
    isValidColumnPowerTarget && targetHover && isColumnPowerTargetMode;

  const cursorClass = powerTargetCursorClass(
    powerTargeting != null,
    isValidColumnPowerTarget,
    targetHover,
  );

  const holderTitle = isExtraChildColumn
    ? EFFECT_DEFINITIONS[EFFECT_EXTRA_COLUMN].label
    : entries.some((e) => e.effectId === EFFECT_EXTRA_COLUMN)
      ? EFFECT_DEFINITIONS[EFFECT_EXTRA_COLUMN].label
      : undefined;

  const showBadges =
    entries.length > 0 || (columnDurationTicks != null && columnDurationTicks > 0);

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
      {showBadges ? (
        <CardEffectBadges
          entries={entries}
          durationTicks={columnDurationTicks}
          durationScope="column"
        />
      ) : null}
    </div>
  );
}
