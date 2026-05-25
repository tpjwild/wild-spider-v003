"use client";

import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { TableauDragStackPreview } from "@/components/game/TableauDragStackPreview";
import { layoutIdDropTransition } from "@/constants/timings";
import type { GameState } from "@/engine/types";
import type { TableauOverlayReturnFlight } from "@/lib/tableauDragReturnFlight";

/** Fixed-position flight from drop point back to the source column (invalid drop / cancel). */
export function TableauDragReturnLayer({
  flight,
  applyHoverScale,
  onComplete,
  game,
}: {
  flight: TableauOverlayReturnFlight;
  applyHoverScale: boolean;
  onComplete: () => void;
  game: GameState;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      className="pointer-events-none fixed z-[200]"
      style={{ left: flight.originX, top: flight.originY }}
      initial={{ x: 0, y: 0 }}
      animate={{ x: flight.deltaX, y: flight.deltaY }}
      transition={layoutIdDropTransition}
      onAnimationComplete={onComplete}
    >
      <TableauDragStackPreview
        cards={flight.cards}
        applyHoverScale={applyHoverScale}
        game={game}
        columnIndex={flight.fromCol}
      />
    </motion.div>,
    document.body,
  );
}
