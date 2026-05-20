"use client";

import { useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { CardView } from "@/components/game/CardView";
import { dimensions } from "@/constants/dimensions";
import { layoutIdCardMotionProps } from "@/constants/timings";
import { cardLayoutId } from "@/lib/cardLayoutId";
import type { FoundationIndex, GameState } from "@/engine/types";
import { useGameStore } from "@/state/gameStore";

const { cardWidth: cw, cardHeight: ch } = dimensions;

export function FoundationSlot({
  game,
  index,
}: {
  game: GameState;
  index: FoundationIndex;
}) {
  const pile = game.foundation[index] ?? [];
  const top = pile.length > 0 ? pile[pile.length - 1] : undefined;
  const dealLocked = useGameStore((s) => s.dealAnimation != null);
  const { setNodeRef, isOver } = useDroppable({
    id: `foundation-${index}`,
    data: { type: "foundation", foundationIndex: index },
    disabled: dealLocked,
  });

  const underTop = pile.length >= 2 ? pile[pile.length - 2] : undefined;

  const empty = pile.length === 0;
  /** Empty slot: dashed border only (no `ring` — ring + dashed border reads as two rectangles). */
  const borderClass = empty
    ? isOver
      ? "border-2 border-dashed border-amber-400 bg-amber-500/20"
      : "border-2 border-dashed border-white/60"
    : isOver
      ? "border-2 border-transparent bg-amber-500/20"
      : "border-2 border-transparent";

  return (
    <div
      ref={setNodeRef}
      className={`relative flex items-center justify-center rounded-md ${borderClass}`}
      style={{ width: cw, height: ch }}
    >
      {underTop ? (
        <div
          className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
          aria-hidden
        >
          <CardView placed={underTop} />
        </div>
      ) : null}
      {top ? (
        <motion.div
          key={cardLayoutId(top.card)}
          layoutId={cardLayoutId(top.card)}
          {...layoutIdCardMotionProps(cardLayoutId(top.card))}
          className="relative z-[1] inline-block"
        >
          <CardView placed={top} />
        </motion.div>
      ) : (
        <span className="sr-only">Empty foundation {index + 1}</span>
      )}
    </div>
  );
}
