"use client";

import { useState } from "react";
import { CardView } from "@/components/game/CardView";
import { colors } from "@/constants/colors";
import { getPowerDefinition } from "@/content/powerDefinitions";
import {
  dimensions,
  SHELF_CARD_HOVER_SCALE,
  shelfHorizontalStepPx,
  shelfHoverScaleBleedPx,
  shelfPanelHeightPx,
} from "@/constants/dimensions";
import type { GameState } from "@/engine/types";
import { useGameStore } from "@/state/gameStore";

const {
  cardHeight: ch,
  cardWidth: cw,
  shelfHorizontalPad,
  shelfVerticalPad,
  shelfWidth,
} = dimensions;

/** Stacking lift for the shelf card receiving pointer hover (above default shelf z-indices). */
const SHELF_HOVER_Z = 10_000;
/** Armed targeted power — stays above siblings and hover until commit or cancel. */
const SHELF_POWER_TARGETING_Z = 10_001;

function ShelfChargeBadge({ chargesRemaining }: { chargesRemaining: number }) {
  const depleted = chargesRemaining <= 0;
  return (
    <div
      className={`pointer-events-none absolute left-0.5 top-0.5 z-40 flex h-4 min-w-4 items-center justify-center rounded px-0.5 text-[9px] font-bold ring-1 ${
        depleted
          ? "bg-zinc-800/90 text-zinc-500 ring-zinc-600/60"
          : "bg-zinc-900/90 text-amber-100 ring-amber-500/50"
      }`}
      aria-hidden
    >
      {chargesRemaining}
    </div>
  );
}

export function ShelfStrip({ game }: { game: GameState }) {
  const [hoveredJokerId, setHoveredJokerId] = useState<number | null>(null);
  const dealLocked = useGameStore((s) => s.dealAnimation != null);
  const powerTargeting = useGameStore((s) => s.powerTargeting);
  const triggerShelfPower = useGameStore((s) => s.triggerShelfPower);

  const n = game.shelf.length;
  const step = shelfHorizontalStepPx();
  const innerWidth = n <= 0 ? cw : cw + (n - 1) * step;
  const hoverBleed = shelfHoverScaleBleedPx();

  return (
    <div
      className="flex flex-col justify-start overflow-hidden rounded-lg border border-white/20"
      style={{
        width: shelfWidth,
        maxWidth: "100%",
        height: shelfPanelHeightPx,
        boxSizing: "border-box",
        backgroundColor: colors.shelfPanelBackground,
        paddingTop: shelfVerticalPad,
        paddingBottom: shelfVerticalPad,
        paddingLeft: shelfHorizontalPad,
        paddingRight: shelfHorizontalPad,
      }}
      data-testid="shelf"
      data-power-target-cancel-safe="true"
    >
      {/**
       * Horizontal scroll only (`shelf-scroll` in globals.css). Fixed row height; bleed padding
       * keeps hover scale inside the panel without vertical overflow.
       */}
      <div
        className="shelf-scroll w-full min-w-0"
        style={{
          height: ch,
          paddingLeft: hoverBleed,
          paddingRight: hoverBleed,
          boxSizing: "content-box",
        }}
      >
        {/** `data-shelf-stack` must exist when empty so deal-flight can measure the first joker slot. */}
        <div className="flex min-w-full justify-start">
          <div
            className="relative shrink-0 isolate"
            data-shelf-stack
            style={{
              height: ch,
              width: innerWidth,
              minWidth: innerWidth,
            }}
          >
            {game.shelf.length === 0 ? (
              <div className="absolute left-0 top-0 shrink-0" style={{ width: cw, height: ch }} aria-hidden />
            ) : (
              game.shelf.map((sj, i) => {
                const isHovered = hoveredJokerId === sj.card.id;
                const canTrigger = sj.chargesRemaining > 0 && !dealLocked;
                const isTargeting = powerTargeting?.shelfIndex === i;
                const zIndex = isTargeting
                  ? SHELF_POWER_TARGETING_Z
                  : isHovered
                    ? SHELF_HOVER_Z
                    : 100 + i;
                const def = getPowerDefinition(sj.powerId);
                const powerLabel =
                  def.triggerClass === "immediate"
                    ? "Immediate power — double-click to trigger"
                    : "Targeted power — double-click to choose a target";

                return (
                  <div
                    key={`joker-${sj.card.id}`}
                    className={`absolute left-0 top-0 ${canTrigger ? "cursor-pointer" : "cursor-default"}`}
                    style={{
                      left: i * step,
                      width: cw,
                      height: ch,
                      zIndex,
                      transform:
                        isHovered || isTargeting
                          ? `scale(${SHELF_CARD_HOVER_SCALE})`
                          : "scale(1)",
                      transformOrigin: "center",
                      transition: "transform 0.12s ease-out",
                      opacity: sj.chargesRemaining <= 0 ? 0.45 : 1,
                    }}
                    data-testid={`shelf-joker-${i}`}
                    data-power-targeting={isTargeting ? "true" : "false"}
                    data-charges={sj.chargesRemaining}
                    title={
                      sj.chargesRemaining <= 0
                        ? "No charges remaining"
                        : isTargeting
                          ? `${powerLabel} (select a target, or double-click to cancel)`
                          : powerLabel
                    }
                    onPointerEnter={() => setHoveredJokerId(sj.card.id)}
                    onPointerLeave={() => setHoveredJokerId((id) => (id === sj.card.id ? null : id))}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!canTrigger) return;
                      triggerShelfPower(i);
                    }}
                  >
                    <div
                      className={`relative h-full w-full rounded-md ${
                        isTargeting ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-black/40" : ""
                      }`}
                    >
                      <CardView placed={{ card: sj.card, faceUp: true }} />
                      <ShelfChargeBadge chargesRemaining={sj.chargesRemaining} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
