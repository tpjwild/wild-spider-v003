"use client";

import { useEffect, useRef, useState } from "react";
import { CardView } from "@/components/game/CardView";
import { SetPowerShelfCard } from "@/components/game/SetPowerShelfCard";
import { ShelfChargeBadge } from "@/components/game/ShelfChargeBadge";
import { colors } from "@/constants/colors";
import { jokerDefinitionForInGameId } from "@/content/deckPairs";
import { getPowerDefinition } from "@/content/powerDefinitions";
import { POWER_TARGET_INVALID_CURSOR_CLASS } from "@/lib/powerTargetUi";
import {
  dimensions,
  SHELF_CARD_HOVER_SCALE,
  SHELF_CARD_INVESTIGATE_SCALE,
  shelfHoverScaleBleedPx,
  shelfPanelTopInsetPx,
  shelfHorizontalStepPx,
  shelfPanelHeightPx,
} from "@/constants/dimensions";
import { CARD_INSPECT_HIGHLIGHT_CLASS } from "@/lib/cardInspectUi";
import { bindHorizontalWheelScroll } from "@/lib/horizontalWheelScroll";
import {
  isShelfJoker,
  isShelfSetPower,
  shelfEntryLayoutLeftPx,
  formatShelfPowerDisplayName,
  shelfSetDisplayLabels,
  shelfStripInnerWidthPx,
} from "@/lib/setPowerUi";
import type { Card, GameState, SetKey } from "@/engine/types";
import { useGameStore } from "@/state/gameStore";

const {
  cardHeight: ch,
  cardWidth: cw,
  shelfHorizontalPad,
  shelfNamePlateGapPx,
  shelfNamePlateHeightPx,
  shelfJokerSetGapPx,
  shelfHorizontalScrollbarPx,
} = dimensions;

/** Stacking lift for the shelf card receiving pointer hover (above default shelf z-indices). */
const SHELF_HOVER_Z = 10_000;
/** Armed targeted power — stays above siblings and hover until commit or cancel. */
const SHELF_POWER_TARGETING_Z = 10_001;

function pointerIsOverRect(x: number, y: number, rect: DOMRect): boolean {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function shelfEntryDomKey(entry: GameState["shelf"][number]): string {
  if (entry.kind === "joker") return `joker:${entry.card.id}`;
  return `set:${entry.setKey}`;
}

function shelfJokerLabels(
  game: GameState,
  jokerId: number,
): { primaryName: string; powerName: string } | null {
  for (const entry of game.shelf) {
    if (!isShelfJoker(entry) || entry.card.id !== jokerId) continue;
    const jokerDef = jokerDefinitionForInGameId(game.config.deckPairId, entry.card.id);
    if (!jokerDef) return null;
    const power = getPowerDefinition(jokerDef.powerId);
    return {
      primaryName: jokerDef.name,
      powerName: formatShelfPowerDisplayName(power.name, jokerDef.initialDuration),
    };
  }
  return null;
}

function shelfNamePlateLabels(
  game: GameState,
  hoveredEntryKey: string | null,
  targetingShelfIndex: number | null,
): { primaryName: string; powerName: string } | null {
  if (targetingShelfIndex != null) {
    const entry = game.shelf[targetingShelfIndex];
    if (entry) {
      if (isShelfJoker(entry)) {
        const labels = shelfJokerLabels(game, entry.card.id);
        if (labels) return labels;
      }
      if (isShelfSetPower(entry)) {
        const labels = shelfSetDisplayLabels(game.config.deckPairId, entry);
        if (labels) return { primaryName: labels.setName, powerName: labels.powerName };
      }
    }
  }
  if (hoveredEntryKey != null) {
    for (const entry of game.shelf) {
      if (shelfEntryDomKey(entry) !== hoveredEntryKey) continue;
      if (isShelfJoker(entry)) {
        return shelfJokerLabels(game, entry.card.id);
      }
      if (isShelfSetPower(entry)) {
        const labels = shelfSetDisplayLabels(game.config.deckPairId, entry);
        if (labels) return { primaryName: labels.setName, powerName: labels.powerName };
      }
    }
  }
  return null;
}

function ShelfNamePlate({
  primaryName,
  powerName,
}: {
  primaryName?: string;
  powerName?: string;
}) {
  const hasText = primaryName != null && powerName != null;
  return (
    <div
      className="flex w-full flex-col items-center justify-center rounded-md border border-white/15 px-2 text-center"
      style={{
        marginTop: shelfNamePlateGapPx,
        height: shelfNamePlateHeightPx,
        backgroundColor: colors.shelfNamePlateBackground,
      }}
      data-testid="shelf-name-plate"
      data-has-text={hasText ? "true" : "false"}
      aria-hidden={!hasText}
    >
      {hasText ? (
        <>
          <div
            className="w-full truncate text-xs font-semibold leading-tight"
            style={{ color: colors.text }}
            data-testid="shelf-name-plate-joker"
          >
            {primaryName}
          </div>
          <div
            className="mt-0.5 w-full truncate text-[10px] leading-tight"
            style={{ color: colors.textMuted }}
            data-testid="shelf-name-plate-power"
          >
            {powerName}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function ShelfStrip({
  game,
  panelWidthPx,
  shiftInspectMode,
  onOpenCardDetails,
  detailsCard,
}: {
  game: GameState;
  panelWidthPx: number;
  shiftInspectMode: boolean;
  onOpenCardDetails?: (card: Card) => void;
  /** While set to a shelf joker, that joker stays scaled and in front until this clears. */
  detailsCard?: Card | null;
}) {
  const [hoveredEntryKey, setHoveredEntryKey] = useState<string | null>(null);
  const entryElRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const prevDetailsCardRef = useRef<Card | null>(null);
  const dealLocked = useGameStore((s) => s.dealAnimation != null);
  const powerTargeting = useGameStore((s) => s.powerTargeting);
  const triggerShelfPower = useGameStore((s) => s.triggerShelfPower);

  const pinnedJokerEntryKey =
    detailsCard?.kind === "joker" &&
    game.shelf.some((e) => isShelfJoker(e) && e.card.id === detailsCard.id)
      ? `joker:${detailsCard.id}`
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
      prev?.kind === "joker" &&
      game.shelf.some((e) => isShelfJoker(e) && e.card.id === prev.id)
        ? `joker:${prev.id}`
        : null;
    if (prevPinned == null || pinnedJokerEntryKey != null) return;

    const el = entryElRefs.current.get(prevPinned);
    const { x, y } = lastPointerRef.current;
    const stillOver = el != null && pointerIsOverRect(x, y, el.getBoundingClientRect());
    setHoveredEntryKey((key) => {
      if (stillOver) return prevPinned;
      return key === prevPinned ? null : key;
    });
  }, [detailsCard, game.shelf, pinnedJokerEntryKey]);

  const step = shelfHorizontalStepPx();
  const gap = shelfJokerSetGapPx;
  const innerWidth = shelfStripInnerWidthPx(game.shelf, step, gap, cw);
  const hoverBleed = shelfHoverScaleBleedPx();
  const topInset = shelfPanelTopInsetPx();
  const stripH =
    topInset + ch + hoverBleed + shelfHorizontalScrollbarPx;
  const namePlateLabels = shelfNamePlateLabels(
    game,
    hoveredEntryKey,
    powerTargeting?.shelfIndex ?? null,
  );

  const needsHorizontalScroll = innerWidth > panelWidthPx;
  const shelfScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = shelfScrollRef.current;
    if (!el || !needsHorizontalScroll) return;
    return bindHorizontalWheelScroll(el);
  }, [needsHorizontalScroll]);

  return (
    <div className="flex max-w-full flex-col" style={{ width: panelWidthPx }}>
      <div
        className="overflow-hidden rounded-lg border border-white/20"
        style={{
          width: panelWidthPx,
          maxWidth: "100%",
          height: shelfPanelHeightPx,
          boxSizing: "border-box",
          backgroundColor: colors.shelfPanelBackground,
        }}
        data-testid="shelf"
        data-power-target-cancel-safe="true"
      >
        <div
          className="box-border flex h-full flex-col"
          style={{
            paddingLeft: shelfHorizontalPad,
            paddingRight: shelfHorizontalPad,
          }}
        >
          <div
            className="flex shrink-0 flex-col"
            style={{
              marginLeft: -shelfHorizontalPad,
              marginRight: -shelfHorizontalPad,
              paddingLeft: shelfHorizontalPad,
              paddingRight: shelfHorizontalPad,
              width: `calc(100% + ${2 * shelfHorizontalPad}px)`,
            }}
          >
            <div
              className="flex shrink-0 flex-col overflow-hidden"
              style={{
                height: stripH,
                marginLeft: -hoverBleed,
                marginRight: -hoverBleed,
                width: `calc(100% + ${2 * hoverBleed}px)`,
              }}
            >
              <div
                ref={shelfScrollRef}
                className={`shelf-scroll min-h-0 flex-1 overflow-y-hidden ${
                  needsHorizontalScroll ? "overflow-x-auto" : "overflow-x-hidden"
                }`}
                style={{
                  boxSizing: "border-box",
                  paddingTop: topInset,
                  paddingRight: hoverBleed,
                  paddingBottom: hoverBleed,
                  paddingLeft: hoverBleed,
                }}
                data-testid="shelf-scroll"
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
                  <div
                    className="absolute left-0 top-0 shrink-0"
                    style={{ width: cw, height: ch }}
                    aria-hidden
                  />
                ) : (
                  game.shelf.map((entry, i) => {
                    const domKey = shelfEntryDomKey(entry);
                    const left = shelfEntryLayoutLeftPx(i, game.shelf, step, gap, cw);
                    const isDetailsPinned = pinnedJokerEntryKey === domKey;
                    const isPointerOver = hoveredEntryKey === domKey;
                    const depleted = entry.chargesRemaining <= 0;
                    const canTrigger = !depleted && !dealLocked;
                    const isTargeting = powerTargeting?.shelfIndex === i;
                    const isJoker = isShelfJoker(entry);

                    const inspectable =
                      isJoker &&
                      shiftInspectMode &&
                      Boolean(onOpenCardDetails) &&
                      powerTargeting == null;
                    const showHoverScale =
                      (isPointerOver || isDetailsPinned) && !(isJoker && shiftInspectMode);
                    const showInspectHighlight = inspectable && isPointerOver;
                    const showInvestigateScale = inspectable && isPointerOver;
                    const isRaised =
                      showHoverScale ||
                      isDetailsPinned ||
                      isTargeting ||
                      showInvestigateScale;
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

                    const testId = isJoker ? `shelf-joker-${i}` : `shelf-set-${i}`;
                    const setKey: SetKey | undefined = isShelfSetPower(entry)
                      ? entry.setKey
                      : undefined;

                    return (
                      <div
                        key={domKey}
                        ref={(node) => {
                          if (node) entryElRefs.current.set(domKey, node);
                          else entryElRefs.current.delete(domKey);
                        }}
                        className={`absolute left-0 top-0 select-none ${
                          isJoker && shiftInspectMode
                            ? "cursor-help"
                            : powerTargeting
                              ? POWER_TARGET_INVALID_CURSOR_CLASS
                              : canTrigger
                                ? "cursor-pointer"
                                : "cursor-default"
                        }`}
                        style={{
                          left,
                          width: cw,
                          height: ch,
                          zIndex,
                          transform: cardScale === 1 ? "scale(1)" : `scale(${cardScale})`,
                          transformOrigin: "center",
                          transition: "transform 0.12s ease-out",
                        }}
                        data-testid={testId}
                        data-set-key={setKey}
                        data-power-targeting={isTargeting ? "true" : "false"}
                        data-charges={entry.chargesRemaining}
                        data-inspect-highlight={showInspectHighlight ? "true" : undefined}
                        onPointerEnter={() => setHoveredEntryKey(domKey)}
                        onPointerLeave={() => {
                          if (isDetailsPinned) return;
                          setHoveredEntryKey((key) => (key === domKey ? null : key));
                        }}
                        onClick={(e) => {
                          if (!isJoker || !inspectable || !e.shiftKey) return;
                          e.stopPropagation();
                          onOpenCardDetails?.(entry.card);
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
                            isTargeting
                              ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-black/40"
                              : ""
                          } ${showInspectHighlight ? CARD_INSPECT_HIGHLIGHT_CLASS : ""}`}
                        >
                          {isJoker ? (
                            <>
                              <div
                                className={
                                  depleted
                                    ? "relative h-full w-full saturate-[0.45] brightness-[0.88]"
                                    : "h-full w-full"
                                }
                              >
                                <CardView placed={{ card: entry.card, faceUp: true }} />
                              </div>
                              {depleted ? (
                                <div
                                  className="pointer-events-none absolute inset-0 z-[15] rounded-md"
                                  style={{ backgroundColor: colors.shelfDepletedCardWash }}
                                  aria-hidden
                                />
                              ) : null}
                              <ShelfChargeBadge chargesRemaining={entry.chargesRemaining} />
                            </>
                          ) : (
                            <SetPowerShelfCard
                              deckPairId={game.config.deckPairId}
                              deckNum={entry.deckNum}
                              suit={entry.suit}
                              chargesRemaining={entry.chargesRemaining}
                              className="h-full w-full"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ShelfNamePlate
        primaryName={namePlateLabels?.primaryName}
        powerName={namePlateLabels?.powerName}
      />
    </div>
  );
}
