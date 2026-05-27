"use client";

import { useDraggable, useDndMonitor, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CardEffectBadges } from "@/components/game/CardEffectBadges";
import { CardView } from "@/components/game/CardView";
import { TableauColumnBadgeHolder } from "@/components/game/TableauColumnBadgeHolder";
import {
  useActiveTableauDragId,
  useApplyTableauDropViewportFloorMinHeight,
  useTableauDropFloorBottomPx,
  useTableauLayoutBoostColumn,
  useTableauReturnHide,
} from "@/components/game/TableauDragOverlayContext";
import {
  useActiveTableauInspectSource,
  useTableauInspect,
} from "@/components/game/TableauInspectContext";
import {
  dimensions,
  TABLEAU_CARD_INVESTIGATE_SCALE,
  TABLEAU_DRAGGABLE_HOVER_SCALE,
  tableauColumnStackHeightPx,
  tableauColumnStackTopPx,
} from "@/constants/dimensions";
import { layoutIdCardMotionProps, timings } from "@/constants/timings";
import { isExtraChildColumn } from "@/engine/extraColumn";
import {
  cardHasTransparentEffectInColumn,
  columnHolderEffectBadgeEntries,
  soonestCardEffectTicks,
  soonestColumnHolderTicks,
  tableauCardDisplayMode,
  tableauEffectBadgeEntries,
  transparentEffectBackOpacity,
} from "@/lib/cardEffectsUi";
import { cardLayoutId } from "@/lib/cardLayoutId";
import {
  isColumnTargetingPower,
  isTableauColumnPowerTarget,
  isTableauPowerTarget,
  powerTargetCursorClass,
  tableauPowerTargetContextForCommit,
} from "@/lib/powerTargetUi";
import {
  CARD_INSPECT_HIGHLIGHT_CLASS,
  namePlateInspectHighlightClass,
  namePlateInspectHighlightForTableauCard,
} from "@/lib/cardInspectUi";
import { isInGameCardDetailsClickable } from "@/lib/deckCardDetails";
import { useSuppressClickAfterDrag } from "@/lib/useSuppressClickAfterDrag";
import type { Card, GameState, PlacedCard } from "@/engine/types";
import { tableauCardAboveSharesDragRun } from "@/engine/tableauEffects";
import { canDragFromTableau, useGameStore } from "@/state/gameStore";

const { cardWidth: cw, cardHeight: ch, tableauColumnBadgeHolderGapPx } = dimensions;

/** Max pointer movement (px) still treated as a tap to open Card details (not a drag). */
const TABLEAU_DETAILS_TAP_MAX_MOVE_PX = 5;

function pointerTapWithinSlop(
  down: { x: number; y: number },
  up: { x: number; y: number },
): boolean {
  const dx = up.x - down.x;
  const dy = up.y - down.y;
  const slop = TABLEAU_DETAILS_TAP_MAX_MOVE_PX;
  return dx * dx + dy * dy <= slop * slop;
}

function tableauCardIdentity(card: Card): string {
  return `${card.kind}:${card.id}`;
}

function pointerIsOverRect(x: number, y: number, rect: DOMRect): boolean {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

type TableauCardSharedProps = {
  game: GameState;
  columnIndex: number;
  cardIndex: number;
  placed: PlacedCard;
  dealLocked: boolean;
  hideInTableau: boolean;
  hoveredDragRunStart: number | null;
  detailsPinned: boolean;
  shiftInspectMode: boolean;
  onArmHover: () => void;
  onOpenCardDetails?: (card: Card) => void;
};

function tableauCardStyles(
  game: GameState,
  columnIndex: number,
  cardIndex: number,
  hideInTableau: boolean,
  hoveredDragRunStart: number | null,
  dealLocked: boolean,
  translatePart: string,
  detailsPinned: boolean,
  inspectScaled: boolean,
): { style: React.CSSProperties; scaleShellStyle: React.CSSProperties } {
  const inScaledRun =
    detailsPinned ||
    (hoveredDragRunStart !== null &&
      cardIndex >= hoveredDragRunStart &&
      !hideInTableau &&
      !dealLocked);
  const scale = inScaledRun
    ? TABLEAU_DRAGGABLE_HOVER_SCALE
    : inspectScaled
      ? TABLEAU_CARD_INVESTIGATE_SCALE
      : 1;

  return {
    style: {
      position: "absolute",
      left: 0,
      top: tableauColumnStackTopPx(game.columns[columnIndex]!, cardIndex),
      zIndex: cardIndex + 1,
      ...(translatePart ? { transform: translatePart } : {}),
      visibility: hideInTableau ? "hidden" : "visible",
      pointerEvents: hideInTableau ? "none" : undefined,
      touchAction: "none",
    },
    scaleShellStyle: {
      transform: scale === 1 ? "scale(1)" : `scale(${scale})`,
      transformOrigin: "center center",
      transition: scale !== 1 && !translatePart ? "transform 0.12s ease-out" : "none",
    },
  };
}

const TableauDraggableCard = memo(function TableauDraggableCard({
  game,
  columnIndex,
  cardIndex,
  placed,
  dealLocked,
  hideInTableau,
  hoveredDragRunStart,
  detailsPinned,
  shiftInspectMode,
  onArmHover,
  onOpenCardDetails,
  onInspectHover,
  onInspectLeave,
  onDragHoverPointerLeave,
}: TableauCardSharedProps & {
  onInspectHover: () => void;
  onInspectLeave: () => void;
  onDragHoverPointerLeave: (e: React.PointerEvent<HTMLElement>) => void;
}) {
  const powerTargeting = useGameStore((s) => s.powerTargeting);
  const commitTargetedPower = useGameStore((s) => s.commitTargetedPower);
  const isPowerTargetMode = powerTargeting != null;
  const columnPowerTargetMode =
    isPowerTargetMode &&
    powerTargeting != null &&
    isColumnTargetingPower(game, powerTargeting.shelfIndex);
  const isValidPowerTarget =
    isPowerTargetMode &&
    !columnPowerTargetMode &&
    powerTargeting != null &&
    isTableauPowerTarget(game, placed.card, placed.faceUp, powerTargeting.shelfIndex);
  const [hoverValidTarget, setHoverValidTarget] = useState(false);
  const [inspectHover, setInspectHover] = useState(false);
  const activeInspectSource = useActiveTableauInspectSource();
  const namePlateHighlightTier = namePlateInspectHighlightForTableauCard(
    game,
    activeInspectSource,
    columnIndex,
    cardIndex,
    placed,
  );
  const namePlateHighlightClass = namePlateInspectHighlightClass(namePlateHighlightTier);

  const id = `t-${columnIndex}-${cardIndex}`;
  const activeTableauDragId = useActiveTableauDragId();
  const tableauDragInProgress = activeTableauDragId !== null;
  const isActiveDrag = activeTableauDragId === id;
  const canDrag = canDragFromTableau(game, columnIndex, cardIndex);
  const shouldHandleDetailsClick = useSuppressClickAfterDrag(id);
  const detailsClickable =
    shiftInspectMode &&
    Boolean(onOpenCardDetails) &&
    !isPowerTargetMode &&
    !tableauDragInProgress &&
    isInGameCardDetailsClickable(game, placed, columnIndex);
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    disabled:
      !canDrag || dealLocked || isPowerTargetMode || (tableauDragInProgress && !isActiveDrag),
    data: { type: "tableau", fromColumn: columnIndex, startIndex: cardIndex },
  });

  const layoutId = hideInTableau ? undefined : cardLayoutId(placed.card);

  const translateRaw = transform ? CSS.Translate.toString(transform) : "";
  const translatePart =
    translateRaw &&
    translateRaw !== "none" &&
    translateRaw !== "translate3d(0px, 0px, 0px)" &&
    translateRaw !== "translate(0px, 0px)"
      ? translateRaw
      : "";

  const inspectScaled = detailsClickable && inspectHover;
  const { style, scaleShellStyle } = tableauCardStyles(
    game,
    columnIndex,
    cardIndex,
    hideInTableau,
    hoveredDragRunStart,
    dealLocked,
    translatePart,
    detailsPinned,
    inspectScaled,
  );

  const cursorClass = isPowerTargetMode
    ? powerTargetCursorClass(true, isValidPowerTarget, hoverValidTarget)
    : shiftInspectMode
      ? "cursor-help"
      : canDrag && !dealLocked
        ? "cursor-grab active:cursor-grabbing"
        : "cursor-default";

  const cardRingClass =
    powerTargeting?.selectedTarget?.kind === "card" &&
    powerTargeting.selectedTarget.card.kind === placed.card.kind &&
    powerTargeting.selectedTarget.card.id === placed.card.id
      ? "ring-2 ring-sky-400 ring-offset-1 ring-offset-black/30"
      : isPowerTargetMode && isValidPowerTarget && hoverValidTarget
        ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-black/30"
      : detailsClickable && inspectHover
        ? CARD_INSPECT_HIGHLIGHT_CLASS
        : namePlateHighlightClass;

  const dragListenersActive = !isPowerTargetMode && (!tableauDragInProgress || isActiveDrag);
  const {
    onPointerDown: dragOnPointerDown,
    onPointerUp: dragOnPointerUp,
    ...restDragListeners
  } = dragListenersActive ? (listeners ?? {}) : {};

  return (
    <div
      ref={setNodeRef}
      className={`${cursorClass} outline-none focus:outline-none`}
      style={style}
      data-power-target-valid={isValidPowerTarget ? "true" : undefined}
      data-in-game-details-clickable={detailsClickable ? "true" : undefined}
      data-inspect-highlight={detailsClickable && inspectHover ? "true" : undefined}
      data-name-plate-inspect-highlight={namePlateHighlightTier !== "none" ? "true" : undefined}
      data-name-plate-inspect-tier={namePlateHighlightTier !== "none" ? namePlateHighlightTier : undefined}
      data-tableau-card-key={tableauCardIdentity(placed.card)}
      title={detailsClickable ? "Hold Shift and click to view card details" : undefined}
      onPointerEnter={() => {
        if (tableauDragInProgress) return;
        if (isPowerTargetMode && isValidPowerTarget) setHoverValidTarget(true);
        if (detailsClickable) setInspectHover(true);
        if (canDrag && !dealLocked && !isPowerTargetMode && !shiftInspectMode) onArmHover();
        if (!tableauDragInProgress && !dealLocked && !columnPowerTargetMode) onInspectHover();
      }}
      onPointerLeave={(e) => {
        if (hoverValidTarget) setHoverValidTarget(false);
        if (inspectHover) setInspectHover(false);
        const rel = e.relatedTarget;
        if (rel instanceof Node && e.currentTarget.contains(rel)) return;
        if (
          canDrag &&
          !dealLocked &&
          !tableauDragInProgress &&
          !isPowerTargetMode &&
          !shiftInspectMode
        ) {
          onDragHoverPointerLeave(e);
        }
        onInspectLeave();
      }}
      onClick={(e) => {
        if (isPowerTargetMode && isValidPowerTarget && powerTargeting != null) {
          e.stopPropagation();
          const ctx = tableauPowerTargetContextForCommit(
            game,
            placed.card,
            placed.faceUp,
            powerTargeting.shelfIndex,
          );
          if (ctx) commitTargetedPower(placed.card, ctx);
        }
      }}
      onPointerDown={(e) => {
        if (detailsClickable) {
          pointerDownRef.current = { x: e.clientX, y: e.clientY };
        }
        dragOnPointerDown?.(e);
      }}
      onPointerUp={(e) => {
        if (isPowerTargetMode && isValidPowerTarget) {
          dragOnPointerUp?.(e);
          return;
        }
        const down = pointerDownRef.current;
        pointerDownRef.current = null;
        if (
          detailsClickable &&
          e.shiftKey &&
          onOpenCardDetails &&
          down &&
          pointerTapWithinSlop(down, { x: e.clientX, y: e.clientY }) &&
          shouldHandleDetailsClick()
        ) {
          e.stopPropagation();
          onOpenCardDetails(placed.card);
        }
        dragOnPointerUp?.(e);
      }}
      {...(dragListenersActive ? { ...restDragListeners, ...attributes } : {})}
    >
      <motion.div layoutId={layoutId} {...layoutIdCardMotionProps(layoutId)} className="inline-block">
        <div className={`relative inline-block rounded-md ${cardRingClass}`} style={scaleShellStyle}>
          <CardView
            placed={placed}
            displayMode={tableauCardDisplayMode(game, columnIndex, placed)}
            faceDownBackOpacity={
              cardHasTransparentEffectInColumn(game, columnIndex, placed.card)
                ? transparentEffectBackOpacity()
                : undefined
            }
          />
          <CardEffectBadges
            entries={tableauEffectBadgeEntries(game, columnIndex, placed.card)}
            durationTicks={soonestCardEffectTicks(game, placed.card)}
            durationScope="card"
          />
        </div>
      </motion.div>
    </div>
  );
});

function TableauCardSlot({
  game,
  columnIndex,
  cardIndex,
  placed,
  dealLocked,
  columnDragRunStart,
  tableauReturnHide,
  hoveredDragRunStart,
  detailsPinned,
  shiftInspectMode,
  onArmHover,
  onInspectHover,
  onInspectLeave,
  onDragHoverPointerLeave,
  onOpenCardDetails,
}: Omit<TableauCardSharedProps, "hideInTableau"> & {
  onInspectHover: () => void;
  onInspectLeave: () => void;
  onDragHoverPointerLeave: (e: React.PointerEvent<HTMLElement>) => void;
  columnDragRunStart: number | null;
  tableauReturnHide: { column: number; startIndex: number } | null;
}) {
  const hideInTableau =
    (columnDragRunStart !== null && cardIndex >= columnDragRunStart) ||
    (tableauReturnHide !== null &&
      tableauReturnHide.column === columnIndex &&
      cardIndex >= tableauReturnHide.startIndex);

  return (
    <TableauDraggableCard
      game={game}
      columnIndex={columnIndex}
      cardIndex={cardIndex}
      placed={placed}
      dealLocked={dealLocked}
      hideInTableau={hideInTableau}
      hoveredDragRunStart={hoveredDragRunStart}
      detailsPinned={detailsPinned}
      shiftInspectMode={shiftInspectMode}
      onArmHover={onArmHover}
      onInspectHover={onInspectHover}
      onInspectLeave={onInspectLeave}
      onDragHoverPointerLeave={onDragHoverPointerLeave}
      onOpenCardDetails={onOpenCardDetails}
    />
  );
}

export function TableauColumn({
  game,
  columnIndex,
  shiftInspectMode,
  onOpenCardDetails,
  detailsCard,
}: {
  game: GameState;
  columnIndex: number;
  shiftInspectMode: boolean;
  onOpenCardDetails?: (card: Card) => void;
  detailsCard?: Card | null;
}) {
  const col = useMemo(() => game.columns[columnIndex] ?? [], [game.columns, columnIndex]);
  const dealLocked = useGameStore((s) => s.dealAnimation != null);
  const powerTargeting = useGameStore((s) => s.powerTargeting);
  const commitTargetedColumnPower = useGameStore((s) => s.commitTargetedColumnPower);
  const layoutBoostColumn = useTableauLayoutBoostColumn();
  const tableauReturnHide = useTableauReturnHide();
  const applyViewportFloor = useApplyTableauDropViewportFloorMinHeight();
  const tableauDropFloorBottomPx = useTableauDropFloorBottomPx();
  const activeTableauDragId = useActiveTableauDragId();
  const { setHoverTarget: setInspectHoverTarget } = useTableauInspect();

  const [hoveredDragRunStart, setHoveredDragRunStart] = useState<number | null>(null);
  const [columnDragRunStart, setColumnDragRunStart] = useState<number | null>(null);
  /** After drop/cancel, `visibility: hidden` → visible can re-fire `pointerenter` while the pointer is still; block re-arm on this column only. */
  const hoverArmBlockedUntilRef = useRef(0);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const prevDetailsCardRef = useRef<Card | null>(null);
  const stackElRef = useRef<HTMLDivElement | null>(null);

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
    if (!prev || detailsCard) return;

    const cardIndex = col.findIndex((p) => tableauCardIdentity(p.card) === tableauCardIdentity(prev));
    if (cardIndex < 0) return;

    const el = stackElRef.current?.querySelector<HTMLElement>(
      `[data-tableau-card-key="${tableauCardIdentity(prev)}"]`,
    );
    const { x, y } = lastPointerRef.current;
    const stillOver =
      el != null && pointerIsOverRect(x, y, el.getBoundingClientRect());
    if (stillOver && canDragFromTableau(game, columnIndex, cardIndex) && !dealLocked) {
      setHoveredDragRunStart(cardIndex);
      setInspectHoverTarget({ kind: "card", columnIndex, cardIndex });
    } else {
      setHoveredDragRunStart((start) => (start === cardIndex ? null : start));
      setInspectHoverTarget(null);
    }
  }, [col, columnIndex, dealLocked, detailsCard, game, setInspectHoverTarget]);

  const tryArmHover = useCallback(
    (idx: number) => {
      if (dealLocked) return;
      if (performance.now() < hoverArmBlockedUntilRef.current) return;
      if (!canDragFromTableau(game, columnIndex, idx)) return;
      setHoveredDragRunStart(idx);
    },
    [dealLocked, game, columnIndex],
  );

  const clearColumnDragRun = useCallback(() => setColumnDragRunStart(null), []);

  /** Drop/cancel ends the drag before layout return; clear hover so scale does not linger on the flight. */
  useDndMonitor(
    useMemo(
      () => ({
        onDragStart(event) {
          setHoveredDragRunStart(null);
          const d = event.active.data.current as
            | { type?: string; fromColumn?: number; startIndex?: number }
            | undefined;
          if (
            d?.type === "tableau" &&
            d.fromColumn === columnIndex &&
            typeof d.startIndex === "number"
          ) {
            setColumnDragRunStart(d.startIndex);
          }
        },
        onDragEnd(event) {
          setHoveredDragRunStart(null);
          clearColumnDragRun();
          const d = event.active.data.current as { type?: string; fromColumn?: number } | undefined;
          if (d?.type === "tableau" && d.fromColumn === columnIndex) {
            hoverArmBlockedUntilRef.current = performance.now() + timings.tableauLayoutReturnBoostMs;
          }
        },
        onDragCancel(event) {
          setHoveredDragRunStart(null);
          clearColumnDragRun();
          const d = event.active.data.current as { type?: string; fromColumn?: number } | undefined;
          if (d?.type === "tableau" && d.fromColumn === columnIndex) {
            hoverArmBlockedUntilRef.current = performance.now() + timings.tableauLayoutReturnBoostMs;
          }
        },
      }),
      [columnIndex, clearColumnDragRun],
    ),
  );

  /** Top-hit tableau card receives the pointer over its bounds; stacking order matches z-index. */
  const handleStackPointerLeave = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rel = e.relatedTarget;
      if (rel instanceof Node && e.currentTarget.contains(rel)) return;
      setHoveredDragRunStart(null);
      setInspectHoverTarget(null);
    },
    [setInspectHoverTarget],
  );

  const hoveredDragRunStartActive =
    dealLocked || activeTableauDragId != null ? null : hoveredDragRunStart;

  const { setNodeRef, isOver } = useDroppable({
    id: `col-${columnIndex}`,
    data: { type: "column", columnIndex },
    disabled: dealLocked || powerTargeting != null,
  });

  const droppableElRef = useRef<HTMLDivElement | null>(null);
  const setDroppableRef = useCallback(
    (node: HTMLDivElement | null) => {
      droppableElRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef],
  );

  /** Stretch drop/highlight to the bottom of the viewport (flex parents often give no usable % height). */
  const [measuredViewportFloorMinHeight, setMeasuredViewportFloorMinHeight] = useState<string | null>(
    null,
  );
  const viewportFloorActive =
    applyViewportFloor && !dealLocked && tableauDropFloorBottomPx != null;
  const viewportFloorMinHeight = viewportFloorActive ? measuredViewportFloorMinHeight : null;

  /** Droppable stretch uses shared pane bottom from `GameShell`; only this column's top is measured here. */
  useLayoutEffect(() => {
    if (!viewportFloorActive) return;
    const el = droppableElRef.current;
    if (!el) return;

    const top = el.getBoundingClientRect().top;
    const next = `${Math.max(0, Math.ceil(tableauDropFloorBottomPx - top))}px`;
    setMeasuredViewportFloorMinHeight((prev) => (prev === next ? prev : next));
  }, [viewportFloorActive, col.length, columnIndex, tableauDropFloorBottomPx]);

  const stackH = tableauColumnStackHeightPx(col);
  const minH = stackH + 32;

  const droppableMinHeight =
    applyViewportFloor && viewportFloorMinHeight != null
      ? `max(${minH}px, ${viewportFloorMinHeight})`
      : `${minH}px`;

  /** Border is inside `width` (border-box); content width must stay `cw` so cards align with column edges. */
  const droppableWidth = cw + 4;

  const armHoverCallbacks = useMemo(
    () => col.map((_, cardIndex) => () => tryArmHover(cardIndex)),
    [col, tryArmHover],
  );

  const inspectHoverCallbacks = useMemo(
    () =>
      col.map((_, cardIndex) => () => {
        setInspectHoverTarget({ kind: "card", columnIndex, cardIndex });
      }),
    [col, columnIndex, setInspectHoverTarget],
  );

  const inspectLeaveCallback = useCallback(() => {
    setInspectHoverTarget(null);
  }, [setInspectHoverTarget]);

  const handleCardDragHoverPointerLeave = useCallback(
    (e: React.PointerEvent<HTMLElement>, leaveIndex: number) => {
      if (dealLocked || activeTableauDragId != null || powerTargeting != null) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const exitTop = e.clientY < rect.top;

      if (exitTop && leaveIndex > 0) {
        const rel = e.relatedTarget;
        if (tableauCardAboveSharesDragRun(game, columnIndex, leaveIndex) && rel instanceof Node) {
          const abovePlaced = col[leaveIndex - 1]!;
          const aboveEl = stackElRef.current?.querySelector<HTMLElement>(
            `[data-tableau-card-key="${tableauCardIdentity(abovePlaced.card)}"]`,
          );
          if (aboveEl && (aboveEl === rel || aboveEl.contains(rel))) {
            return;
          }
        }
        setHoveredDragRunStart((start) => {
          if (start === null) return null;
          if (leaveIndex >= start) return null;
          return start;
        });
      }
    },
    [activeTableauDragId, col, columnIndex, dealLocked, game, powerTargeting],
  );

  const dragHoverLeaveCallbacks = useMemo(
    () => col.map((_, cardIndex) => (e: React.PointerEvent<HTMLElement>) => {
      handleCardDragHoverPointerLeave(e, cardIndex);
    }),
    [col, handleCardDragHoverPointerLeave],
  );

  const columnTargetMode =
    powerTargeting != null && isColumnTargetingPower(game, powerTargeting.shelfIndex);
  const isValidColumnTarget =
    columnTargetMode &&
    powerTargeting != null &&
    isTableauColumnPowerTarget(game, columnIndex, powerTargeting.shelfIndex);

  const columnIsExtraChild = isExtraChildColumn(game, columnIndex);

  return (
    <div
      ref={setDroppableRef}
      className={`relative flex min-h-0 shrink-0 flex-col rounded-md border-2 border-dashed transition-colors ${
        isOver ? "bg-amber-500/10 border-transparent" : "border-transparent"
      }`}
      style={{
        width: droppableWidth,
        minHeight: droppableMinHeight,
        boxSizing: "border-box",
        gap: tableauColumnBadgeHolderGapPx,
        zIndex: layoutBoostColumn === columnIndex ? 30 : undefined,
      }}
    >
      <TableauColumnBadgeHolder
        columnIndex={columnIndex}
        entries={columnHolderEffectBadgeEntries(game, columnIndex)}
        columnDurationTicks={soonestColumnHolderTicks(game, columnIndex)}
        isExtraChildColumn={columnIsExtraChild}
        isColumnPowerTargetMode={columnTargetMode}
        isValidColumnPowerTarget={isValidColumnTarget}
        onCommitColumnPowerTarget={
          isValidColumnTarget
            ? () => commitTargetedColumnPower(columnIndex)
            : undefined
        }
      />
      <div
        ref={stackElRef}
        className={`relative shrink-0 overflow-visible self-start ${columnTargetMode ? "pointer-events-none" : ""}`}
        style={{ width: cw, height: Math.max(ch, stackH) }}
        data-tableau-stack={columnIndex}
        onPointerLeave={columnTargetMode ? undefined : handleStackPointerLeave}
      >
        {col.length === 0 ? (
          <motion.div
            className="pointer-events-none absolute left-0 top-0 z-0 rounded-md border-2 border-dashed border-white/60"
            style={{ width: cw, height: ch }}
            aria-hidden
          />
        ) : null}
        {col.map((placed, cardIndex) => {
          const detailsPinned =
            detailsCard != null &&
            tableauCardIdentity(placed.card) === tableauCardIdentity(detailsCard) &&
            isInGameCardDetailsClickable(game, placed, columnIndex);

          return (
            <TableauCardSlot
              key={`${columnIndex}-${placed.card.kind}-${placed.card.id}`}
              game={game}
              columnIndex={columnIndex}
              cardIndex={cardIndex}
              placed={placed}
              dealLocked={dealLocked}
              columnDragRunStart={columnDragRunStart}
              tableauReturnHide={tableauReturnHide}
              hoveredDragRunStart={hoveredDragRunStartActive}
              detailsPinned={detailsPinned}
              shiftInspectMode={shiftInspectMode}
              onArmHover={armHoverCallbacks[cardIndex]!}
              onInspectHover={inspectHoverCallbacks[cardIndex]!}
              onInspectLeave={inspectLeaveCallback}
              onDragHoverPointerLeave={dragHoverLeaveCallbacks[cardIndex]!}
              onOpenCardDetails={onOpenCardDetails}
            />
          );
        })}
      </div>
    </div>
  );
}
