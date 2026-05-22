/**
 * Animation durations and delays (ms).
 */
export const timings = {
  cardDealDuration: 320,
  /** Start-to-start gap between deal flights (ms); may be less than duration for overlapping flights. */
  cardDealDelay: 100,
  cardDealFaceUpDelay: 60,
  cardJokerDealDuration: 320,
  /**
   * During stock / initial deal flights, `cardFlipped` plays after this fraction of the flight duration (0–1),
   * before the motion fully completes — avoids the sound feeling late vs the easing.
   */
  cardFlippedDuringDealProgress: 0.58,
  /**
   * After invalid tableau drop / cancel, source column z-boost and Framer return flight; also used to
   * block hover re-arm on that column so `pointerenter` does not re-apply scale mid-flight.
   */
  tableauLayoutReturnBoostMs: 520,
} as const;

/** Framer Motion spring for shared `layoutId` (tableau / overlay / foundation). */
export const layoutSpring = {
  type: "spring" as const,
  stiffness: 420,
  damping: 32,
  mass: 0.85,
};

/**
 * Snappier spring for **`layoutId`** handoffs (drop / cancel) so cards do not feel sluggish vs
 * {@link layoutSpring}, which remains available for other motion.
 */
export const layoutIdDropTransition = {
  type: "spring" as const,
  stiffness: 520,
  damping: 44,
  mass: 0.55,
} as const;

/** Stack reflow when cards above/below shift (no shared `layoutId`). */
export const tableauStackReflowTransition = {
  type: "spring" as const,
  stiffness: 380,
  damping: 38,
  mass: 0.85,
} as const;

/**
 * Tableau + foundation cards: **position** layout for stack reflow; shared **`layoutId`** uses
 * {@link layoutIdDropTransition}. Invalid tableau drops use {@link layoutIdDropTransition} on a fixed
 * return flight layer (`TableauDragReturnLayer`), not **`layoutId`** on the drag follow layer.
 */
export function layoutIdCardMotionProps(layoutId: string | undefined) {
  return {
    layout: "position" as const,
    transition: layoutId ? layoutIdDropTransition : tableauStackReflowTransition,
  };
}
