import type { Card } from "@/engine/types";

/** Stable id for Framer Motion `layoutId` (tableau ↔ foundation). */
export function cardLayoutId(card: Card): string {
  return `wild-card-${card.kind}-${card.id}`;
}
