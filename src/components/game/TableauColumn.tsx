"use client";

import { useDraggable, useDndMonitor, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CardEffectBadges } from "@/components/game/CardEffectBadges";
import { CardView } from "@/components/game/CardView";
import { TableauColumnBadgeHolder } from "@/components/game/TableauColumnBadgeHolder";
import {
  useActiveTableauDragId,
  useApplyTableauDropViewportFloorMinHeight,
  useTableauDropFloorBottomPx,
  useTableauLayoutBoostColumn,
} from "@/components/game/TableauDragOverlayContext";
import {
  dimensions,
  TABLEAU_DRAGGABLE_HOVER_SCALE,
  tableauColumnStackHeightPx,
  tableauColumnStackTopPx,
} from "@/constants/dimensions";
import { layoutIdCardMotionProps, timings } from "@/constants/timings";
import {
  cardHasTransparentEffect,
  columnEffectCount,
  tableauCardDisplayMode,
  tableauCardEffectBadgeCount,
  transparentEffectBackOpacity,
} from "@/lib/cardEffectsUi";
import { cardLayoutId } from "@/lib/cardLayoutId";
import {
  isTableauFaceDownPowerTarget,
  POWER_TARGET_CURSOR_CLASS,
  POWER_TARGET_VALID_CURSOR_CLASS,
} from "@/lib/powerTargetUi";
import type { GameState, PlacedCard } from "@/engine/types";
import { canDragFromTableau, useGameStore } from "@/state/gameStore";

const { cardWidth: cw, cardHeight: ch, tableauColumnBadgeHolderGapPx } = dimensions;

type TableauCardSharedProps = {
  game: GameState;
  columnIndex: number;
  cardIndex: number;
  placed: PlacedCard;
  dealLocked: boolean;
  hideInTableau: boolean;
  hoveredDragRunStart: number | null;
  onArmHover: () => void;
};

function tableauCardStyles(
  game: GameState,
  columnIndex: number,
  cardIndex: number,
  hideInTableau: boolean,
  hoveredDragRunStart: number | null,
  dealLocked: boolean,
  translatePart: string,
): { style: React.CSSProperties; scaleShellStyle: React.CSSProperties } {
  const inScaledRun =
    hoveredDragRunStart !== null &&
    cardIndex >= hoveredDragRunStart &&
    !hideInTableau &&
    !dealLocked;

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
      transform: inScaledRun ? `scale(${TABLEAU_DRAGGABLE_HOVER_SCALE})` : "scale(1)",
      transformOrigin: "center center",
      transition: inScaledRun && !translatePart ? "transform 0.12s ease-out" : "none",
    },
  };
}

const TableauStackCard = memo(function TableauStackCard({
  game,
  columnIndex,
  cardIndex,
  placed,
  dealLocked,
  hideInTableau,
  hoveredDragRunStart,
  onArmHover,
}: TableauCardSharedProps) {
  const powerTargeting = useGameStore((s) => s.powerTargeting);
  const commitTargetedPower = useGameStore((s) => s.commitTargetedPower);
  const isPowerTargetMode = powerTargeting != null;
  const isValidPowerTarget =
    isPowerTargetMode &&
    powerTargeting != null &&
    isTableauFaceDownPowerTarget(game, placed.card, placed.faceUp, powerTargeting.shelfIndex);
  const [hoverValidTarget, setHoverValidTarget] = useState(false);

  const canDrag = canDragFromTableau(game, columnIndex, cardIndex);
  const layoutId = hideInTableau ? undefined : cardLayoutId(placed.card);
  const { style, scaleShellStyle } = tableauCardStyles(
    game,
    columnIndex,
    cardIndex,
    hideInTableau,
    hoveredDragRunStart,
    dealLocked,
    "",
  );

  const cursorClass = isPowerTargetMode
    ? isValidPowerTarget
      ? hoverValidTarget
        ? POWER_TARGET_VALID_CURSOR_CLASS
        : POWER_TARGET_CURSOR_CLASS
      : POWER_TARGET_CURSOR_CLASS
    : canDrag && !dealLocked
      ? "cursor-grab active:cursor-grabbing"
      : "cursor-default";

  const targetRingClass =
    isPowerTargetMode && isValidPowerTarget && hoverValidTarget
      ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-black/30"
      : "";

  return (
    <div
      className={cursorClass}
      style={style}
      data-power-target-valid={isValidPowerTarget ? "true" : undefined}
      onPointerEnter={() => {
        if (isPowerTargetMode && isValidPowerTarget) setHoverValidTarget(true);
        if (canDrag && !dealLocked && !isPowerTargetMode) onArmHover();
      }}
      onPointerLeave={() => {
        if (hoverValidTarget) setHoverValidTarget(false);
      }}
      onClick={(e) => {
        if (!isPowerTargetMode || !isValidPowerTarget) return;
        e.stopPropagation();
        commitTargetedPower(placed.card, { tableauFaceDown: true });
      }}
    >
      <motion.div layoutId={layoutId} {...layoutIdCardMotionProps(layoutId)} className="inline-block">
        <motion.div className={`relative inline-block rounded-md ${targetRingClass}`} style={scaleShellStyle}>
          <CardView
            placed={placed}
            displayMode={tableauCardDisplayMode(game, placed)}
            faceDownBackOpacity={
              cardHasTransparentEffect(game, placed.card)
                ? transparentEffectBackOpacity()
                : undefined
            }
          />
          <CardEffectBadges effectCount={tableauCardEffectBadgeCount(game, placed)} />
        </motion.div>
      </motion.div>
    </div>
  );
});

const TableauDraggableCard = memo(function TableauDraggableCard({
  game,
  columnIndex,
  cardIndex,
  placed,
  dealLocked,
  hideInTableau,
  hoveredDragRunStart,
  onArmHover,
}: TableauCardSharedProps) {
  const powerTargeting = useGameStore((s) => s.powerTargeting);
  const commitTargetedPower = useGameStore((s) => s.commitTargetedPower);
  const isPowerTargetMode = powerTargeting != null;
  const isValidPowerTarget =
    isPowerTargetMode &&
    powerTargeting != null &&
    isTableauFaceDownPowerTarget(game, placed.card, placed.faceUp, powerTargeting.shelfIndex);
  const [hoverValidTarget, setHoverValidTarget] = useState(false);

  const id = `t-${columnIndex}-${cardIndex}`;
  const canDrag = canDragFromTableau(game, columnIndex, cardIndex);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    disabled: !canDrag || dealLocked || isPowerTargetMode,
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

  const { style, scaleShellStyle } = tableauCardStyles(
    game,
    columnIndex,
    cardIndex,
    hideInTableau,
    hoveredDragRunStart,
    dealLocked,
    translatePart,
  );

  const cursorClass = isPowerTargetMode
    ? isValidPowerTarget
      ? hoverValidTarget
        ? POWER_TARGET_VALID_CURSOR_CLASS
        : POWER_TARGET_CURSOR_CLASS
      : POWER_TARGET_CURSOR_CLASS
    : canDrag && !dealLocked
      ? "cursor-grab active:cursor-grabbing"
      : "cursor-default";

  const targetRingClass =
    isPowerTargetMode && isValidPowerTarget && hoverValidTarget
      ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-black/30"
      : "";

  return (
    <div
      ref={setNodeRef}
      className={cursorClass}
      style={style}
      data-power-target-valid={isValidPowerTarget ? "true" : undefined}
      onPointerEnter={() => {
        if (isPowerTargetMode && isValidPowerTarget) setHoverValidTarget(true);
        if (canDrag && !dealLocked && !isPowerTargetMode) onArmHover();
      }}
      onPointerLeave={() => {
        if (hoverValidTarget) setHoverValidTarget(false);
      }}
      onClick={(e) => {
        if (!isPowerTargetMode || !isValidPowerTarget) return;
        e.stopPropagation();
        commitTargetedPower(placed.card, { tableauFaceDown: true });
      }}
      {...(isPowerTargetMode ? {} : { ...listeners, ...attributes })}
    >
      <motion.div layoutId={layoutId} {...layoutIdCardMotionProps(layoutId)} className="inline-block">
        <div className={`relative inline-block rounded-md ${targetRingClass}`} style={scaleShellStyle}>
          <CardView
            placed={placed}
            displayMode={tableauCardDisplayMode(game, placed)}
            faceDownBackOpacity={
              cardHasTransparentEffect(game, placed.card)
                ? transparentEffectBackOpacity()
                : undefined
            }
          />
          <CardEffectBadges effectCount={tableauCardEffectBadgeCount(game, placed)} />
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
  hoveredDragRunStart,
  onArmHover,
}: Omit<TableauCardSharedProps, "hideInTableau"> & { columnDragRunStart: number | null }) {
  const activeTableauDragId = useActiveTableauDragId();
  const id = `t-${columnIndex}-${cardIndex}`;
  const hideInTableau = columnDragRunStart !== null && cardIndex >= columnDragRunStart;
  const shared: TableauCardSharedProps = {
    game,
    columnIndex,
    cardIndex,
    placed,
    dealLocked,
    hideInTableau,
    hoveredDragRunStart,
    onArmHover,
  };

  if (activeTableauDragId !== null && activeTableauDragId !== id) {
    return <TableauStackCard {...shared} />;
  }
  return <TableauDraggableCard {...shared} />;
}

export function TableauColumn({
  game,
  columnIndex,
}: {
  game: GameState;
  columnIndex: number;
}) {
  const col = useMemo(() => game.columns[columnIndex] ?? [], [game.columns, columnIndex]);
  const dealLocked = useGameStore((s) => s.dealAnimation != null);
  const powerTargeting = useGameStore((s) => s.powerTargeting);
  const layoutBoostColumn = useTableauLayoutBoostColumn();
  const applyViewportFloor = useApplyTableauDropViewportFloorMinHeight();
  const tableauDropFloorBottomPx = useTableauDropFloorBottomPx();

  const [hoveredDragRunStart, setHoveredDragRunStart] = useState<number | null>(null);
  const [columnDragRunStart, setColumnDragRunStart] = useState<number | null>(null);
  /** After drop/cancel, `visibility: hidden` → visible can re-fire `pointerenter` while the pointer is still; block re-arm on this column only. */
  const hoverArmBlockedUntilRef = useRef(0);

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
  const handleStackPointerLeave = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rel = e.relatedTarget;
    if (rel instanceof Node && e.currentTarget.contains(rel)) return;
    setHoveredDragRunStart(null);
  }, []);

  const hoveredDragRunStartActive = dealLocked ? null : hoveredDragRunStart;

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

  return (
    <div
      ref={setDroppableRef}
      className={`relative flex min-h-0 shrink-0 flex-col rounded-md border-2 border-dashed border-transparent transition-colors ${
        isOver ? "bg-amber-500/10" : ""
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
        effectCount={columnEffectCount(game, columnIndex)}
      />
      <div
        className="relative shrink-0 overflow-visible self-start"
        style={{ width: cw, height: Math.max(ch, stackH) }}
        data-tableau-stack={columnIndex}
        onPointerLeave={handleStackPointerLeave}
      >
        {col.length === 0 ? (
          <motion.div
            className="pointer-events-none absolute left-0 top-0 z-0 rounded-md border-2 border-dashed border-white/60"
            style={{ width: cw, height: ch }}
            aria-hidden
          />
        ) : null}
        {col.map((placed, cardIndex) => (
          <TableauCardSlot
            key={`${columnIndex}-${placed.card.kind}-${placed.card.id}`}
            game={game}
            columnIndex={columnIndex}
            cardIndex={cardIndex}
            placed={placed}
            dealLocked={dealLocked}
            columnDragRunStart={columnDragRunStart}
            hoveredDragRunStart={hoveredDragRunStartActive}
            onArmHover={armHoverCallbacks[cardIndex]!}
          />
        ))}
      </div>
    </div>
  );
}
