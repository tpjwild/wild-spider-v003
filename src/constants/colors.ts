/**
 * Central colour tokens for Wild Spider. Wire these into Tailwind via globals.css or theme extension.
 */
export const colors = {
  /** Billiard-table felt — main play area */
  background: "#2f6f45",
  /** Stats row — darker than felt */
  gameBar: "#1d4d32",
  /** Title chrome — darker than game bar */
  titleBar: "#143824",
  surface: "#1a2332",
  accent: "#c9a227",
  text: "#e8e6e3",
  textMuted: "#8a9199",
  /** Face-down card back — first 52-card deck (ids 0–51). */
  cardBackDeckOne: "linear-gradient(145deg, #2a5a9e 0%, #0f2847 55%, #081830 100%)",
  /** Face-down card back — second 52-card deck (ids 52–103). */
  cardBackDeckTwo: "linear-gradient(145deg, #9e2a2a 0%, #471010 55%, #300808 100%)",
} as const;

export type ColorToken = keyof typeof colors;
