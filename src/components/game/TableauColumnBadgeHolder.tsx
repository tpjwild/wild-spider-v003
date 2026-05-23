"use client";

import { useState } from "react";
import { CardEffectBadges } from "@/components/game/CardEffectBadges";
import { dimensions } from "@/constants/dimensions";
import type { EffectBadgeEntry } from "@/lib/effectBadgeEntries";
import {
  POWER_TARGET_CURSOR_CLASS,
  POWER_TARGET_VALID_CURSOR_CLASS,
} from "@/lib/powerTargetUi";

const { cardWidth: cw, tableauColumnBadgeHolderHeight: badgeH } = dimensions;

/**
 * Strip above a tableau column for column-level power effects (Stage 5).
 * Effect badges render inside when `entries` is non-empty.
 * Column-targeted powers accept clicks only on this holder, not on cards below.
 */
export function TableauColumnBadgeHolder({
  columnIndex,
  entries = [],
  isColumnPowerTargetMode = false,
  isValidColumnPowerTarget = false,
  onCommitColumnPowerTarget,
}: {
  columnIndex: number;
  entries?: readonly EffectBadgeEntry[];
  isColumnPowerTargetMode?: boolean;
  isValidColumnPowerTarget?: boolean;
  onCommitColumnPowerTarget?: () => void;
}) {
  const [targetHover, setTargetHover] = useState(false);
  const showTargetHighlight =
    isValidColumnPowerTarget && targetHover && isColumnPowerTargetMode;

  const cursorClass = isColumnPowerTargetMode
    ? isValidColumnPowerTarget && targetHover
      ? POWER_TARGET_VALID_CURSOR_CLASS
      : POWER_TARGET_CURSOR_CLASS
    : "";

  return (
    <div
      className={`relative shrink-0 self-start rounded-sm border border-white/80 ${cursorClass} ${
        isColumnPowerTargetMode ? "z-20" : ""
      } ${
        showTargetHighlight ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-black/30" : ""
      }`}
      style={{ width: cw, height: badgeH, boxSizing: "border-box" }}
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
        if (isValidColumnPowerTarget) setTargetHover(true);
      }}
      onPointerLeave={() => setTargetHover(false)}
      onClick={(e) => {
        if (!isValidColumnPowerTarget || !onCommitColumnPowerTarget) return;
        e.stopPropagation();
        onCommitColumnPowerTarget();
      }}
    >
      <CardEffectBadges entries={entries} />
    </div>
  );
}
