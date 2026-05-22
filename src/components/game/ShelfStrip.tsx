"use client";

import { useEffect, useRef, useState } from "react";
import { CardView } from "@/components/game/CardView";
import { colors } from "@/constants/colors";
import { getPowerDefinition } from "@/content/powerDefinitions";
import {
  dimensions,
  SHELF_CARD_HOVER_SCALE,
  SHELF_CARD_INVESTIGATE_SCALE,
  shelfHorizontalStepPx,
  shelfHoverScaleBleedPx,
  shelfPanelHeightPx,
} from "@/constants/dimensions";
import { CARD_INSPECT_HIGHLIGHT_CLASS } from "@/lib/cardInspectUi";
import type { Card, GameState } from "@/engine/types";
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

function pointerIsOverRect(x: number, y: number, rect: DOMRect): boolean {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

export function ShelfStrip({
  game,
  shiftInspectMode,
  onOpenCardDetails,
  detailsCard,
}: {
  game: GameState;
  shiftInspectMode: boolean;
  onOpenCardDetails?: (card: Card) => void;
  /** While set to a shelf joker, that joker stays scaled and in front until this clears. */
  detailsCard?: Card | null;
}) {
  const [hoveredJokerId, setHoveredJokerId] = useState<number | null>(null);
  const jokerElRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const prevDetailsCardRef = useRef<Card | null>(null);
  const dealLocked = useGameStore((s) => s.dealAnimation != null);
  const powerTargeting = useGameStore((s) => s.powerTargeting);
  const triggerShelfPower = useGameStore((s) => s.triggerShelfPower);

  const pinnedShelfJokerId =
    detailsCard?.kind === "joker" && game.shelf.some((sj) => sj.card.id === detailsCard.id)
      ? detailsCard.id
      : null;

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, []);

  useEffect(() => {
    const prev = prevDetailsCardRef.current;
    prevDetailsCardRef.current = detailsCard ?? null;

    const prevPinned =
      prev?.kind === "joker" && game.shelf.some((sj) => sj.card.id === prev.id) ? prev.id : null;
    if (prevPinned == null || pinnedShelfJokerId != null) return;

    const el = jokerElRefs.current.get(prevPinned);
    const { x, y } = lastPointerRef.current;
    const stillOver = el != null && pointerIsOverRect(x, y, el.getBoundingClientRect());
    setHoveredJokerId((id) => {
      if (stillOver) return prevPinned;
      return id === prevPinned ? null : id;
    });
  }, [detailsCard, game.shelf, pinnedShelfJokerId]);

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
      <div
        className="shelf-scroll w-full min-w-0"
        style={{
          height: ch,
          paddingLeft: hoverBleed,
          paddingRight: hoverBleed,
          boxSizing: "content-box",
        }}
      >
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
                const isDetailsPinned = pinnedShelfJokerId === sj.card.id;
                const isPointerOver = hoveredJokerId === sj.card.id;
                const depleted = sj.chargesRemaining <= 0;
                const canTrigger = !depleted && !dealLocked;
                const isTargeting = powerTargeting?.shelfIndex === i;
                const inspectable =
                  shiftInspectMode && Boolean(onOpenCardDetails) && powerTargeting == null;
                const showHoverScale = (isPointerOver || isDetailsPinned) && !shiftInspectMode;
                const showInspectHighlight = inspectable && isPointerOver;
                const showInvestigateScale = inspectable && isPointerOver;
                const isRaised = showHoverScale || isDetailsPinned || isTargeting || showInvestigateScale;
                const cardScale =
                  showHoverScale || isDetailsPinned || isTargeting
                    ? SHELF_CARD_HOVER_SCALE
                    : showInvestigateScale
                      ? SHELF_CARD_INVESTIGATE_SCALE
                      : 1;

                const zIndex = isTargeting
                  ? SHELF_POWER_TARGETING_Z
                  : isRaised
                    ? SHELF_HOVER_Z
                    : 100 + i;
                const def = getPowerDefinition(sj.powerId);
                const powerLabel =
                  def.triggerClass === "immediate"
                    ? "Immediate power — double-click to trigger"
                    : "Targeted power — double-click to choose a target";
                const inspectHint = "Hold Shift and click to view card details";

                return (
                  <div
                    key={`joker-${sj.card.id}`}
                    ref={(node) => {
                      if (node) jokerElRefs.current.set(sj.card.id, node);
                      else jokerElRefs.current.delete(sj.card.id);
                    }}
                    className={`absolute left-0 top-0 ${
                      shiftInspectMode
                        ? "cursor-help"
                        : canTrigger
                          ? "cursor-pointer"
                          : "cursor-default"
                    }`}
                    style={{
                      left: i * step,
                      width: cw,
                      height: ch,
                      zIndex,
                      transform: cardScale === 1 ? "scale(1)" : `scale(${cardScale})`,
                      transformOrigin: "center",
                      transition: "transform 0.12s ease-out",
                    }}
                    data-testid={`shelf-joker-${i}`}
                    data-power-targeting={isTargeting ? "true" : "false"}
                    data-charges={sj.chargesRemaining}
                    data-inspect-highlight={showInspectHighlight ? "true" : undefined}
                    title={
                      depleted
                        ? inspectable
                          ? `${inspectHint} (no charges)`
                          : "No charges remaining"
                        : isTargeting
                          ? `${powerLabel} (select a target, or double-click to cancel)`
                          : inspectable
                            ? `${powerLabel}. ${inspectHint}.`
                            : powerLabel
                    }
                    onPointerEnter={() => setHoveredJokerId(sj.card.id)}
                    onPointerLeave={() => {
                      if (isDetailsPinned) return;
                      setHoveredJokerId((id) => (id === sj.card.id ? null : id));
                    }}
                    onClick={(e) => {
                      if (!inspectable || !e.shiftKey) return;
                      e.stopPropagation();
                      onOpenCardDetails?.(sj.card);
                    }}
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
                      } ${showInspectHighlight ? CARD_INSPECT_HIGHLIGHT_CLASS : ""}`}
                    >
                      <div
                        className={
                          depleted
                            ? "relative h-full w-full saturate-[0.45] brightness-[0.88]"
                            : "h-full w-full"
                        }
                      >
                        <CardView placed={{ card: sj.card, faceUp: true }} />
                      </div>
                      {depleted ? (
                        <div
                          className="pointer-events-none absolute inset-0 z-[15] rounded-md"
                          style={{ backgroundColor: colors.shelfDepletedCardWash }}
                          aria-hidden
                        />
                      ) : null}
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
