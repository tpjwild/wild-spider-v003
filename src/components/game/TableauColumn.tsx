"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { CardView } from "@/components/game/CardView";
import { dimensions } from "@/constants/dimensions";
import { layoutSpring } from "@/constants/timings";
import { cardLayoutId } from "@/lib/cardLayoutId";
import type { GameState, PlacedCard } from "@/engine/types";
import { canDragFromTableau, useGameStore } from "@/state/gameStore";

const { cardWidth: cw, cardHeight: ch, tableauColumnCardOffset: off } = dimensions;

/** Visual stack height: base card (index 0) at top, each higher index offset down. */
function stackHeightPx(cardCount: number): number {
  if (cardCount <= 0) return ch;
  return (cardCount - 1) * off + ch;
}

function DraggableCard({
  game,
  columnIndex,
  cardIndex,
  placed,
  dealLocked,
}: {
  game: GameState;
  columnIndex: number;
  cardIndex: number;
  placed: PlacedCard;
  dealLocked: boolean;
}) {
  const id = `t-${columnIndex}-${cardIndex}`;
  const canDrag = canDragFromTableau(game, columnIndex, cardIndex);

  const { attributes, listeners, setNodeRef, transform, active } = useDraggable({
    id,
    disabled: !canDrag || dealLocked,
    data: { type: "tableau", fromColumn: columnIndex, startIndex: cardIndex },
  });

  const activeData = active?.data.current as
    | { type?: string; fromColumn?: number; startIndex?: number }
    | undefined;
  const isTableauDrag =
    active != null &&
    activeData?.type === "tableau" &&
    typeof activeData.fromColumn === "number" &&
    typeof activeData.startIndex === "number";
  const dragStart: number | null =
    isTableauDrag &&
    activeData.fromColumn === columnIndex &&
    typeof activeData.startIndex === "number"
      ? activeData.startIndex
      : null;
  /** Entire face-up run being moved: hide in tableau; overlay holds matching `layoutId` for shared layout. */
  const inDraggedRun = dragStart !== null && cardIndex >= dragStart;
  /** Avoid duplicate `layoutId` with DragOverlay while dragging (Framer needs overlay → destination handoff). */
  const layoutId = inDraggedRun ? undefined : cardLayoutId(placed.card);

  const style: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: cardIndex * off,
    zIndex: cardIndex + 1,
    transform: CSS.Translate.toString(transform),
    visibility: inDraggedRun ? "hidden" : "visible",
    pointerEvents: inDraggedRun ? "none" : undefined,
    touchAction: "none",
  };

  const cursorClass =
    canDrag && !dealLocked ? "cursor-grab active:cursor-grabbing" : "cursor-default";

  return (
    <div ref={setNodeRef} className={cursorClass} style={style} {...listeners} {...attributes}>
      <motion.div layoutId={layoutId} transition={layoutSpring} className="inline-block">
        <CardView placed={placed} />
      </motion.div>
    </div>
  );
}

export function TableauColumn({
  game,
  columnIndex,
}: {
  game: GameState;
  columnIndex: number;
}) {
  const col = game.columns[columnIndex] ?? [];
  const dealLocked = useGameStore((s) => s.dealAnimation != null);

  const { setNodeRef, isOver } = useDroppable({
    id: `col-${columnIndex}`,
    data: { type: "column", columnIndex },
    disabled: dealLocked,
  });

  const stackH = stackHeightPx(col.length);
  const minH = stackH + 32;

  /** Border is inside `width` (border-box); content width must stay `cw` so cards align with column edges. */
  const droppableWidth = cw + 4;

  return (
    <div
      ref={setNodeRef}
      className={`relative flex flex-col rounded-md border-2 border-dashed border-transparent transition-colors ${
        isOver ? "bg-amber-500/10" : ""
      }`}
      style={{
        width: droppableWidth,
        minHeight: minH,
        boxSizing: "border-box",
      }}
    >
      <div className="relative" style={{ width: cw, height: Math.max(ch, stackH) }} data-tableau-stack={columnIndex}>
        {col.length === 0 ? (
          <div
            className="pointer-events-none absolute left-0 top-0 z-0 rounded-md border-2 border-dashed border-white/60"
            style={{ width: cw, height: ch }}
            aria-hidden
          />
        ) : null}
        {col.map((placed, cardIndex) => (
          <DraggableCard
            key={`${columnIndex}-${placed.card.kind}-${placed.card.id}-${cardIndex}`}
            game={game}
            columnIndex={columnIndex}
            cardIndex={cardIndex}
            placed={placed}
            dealLocked={dealLocked}
          />
        ))}
      </div>
    </div>
  );
}
