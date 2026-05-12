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
} as const;

/** Framer Motion spring for shared `layoutId` (tableau / overlay / foundation). */
export const layoutSpring = {
  type: "spring" as const,
  stiffness: 420,
  damping: 32,
  mass: 0.85,
};
