/**
 * Central colour tokens for Wild Spider. Wire these into Tailwind via globals.css or theme extension.
 */
export const colors = {
  background: "#0f1419",
  surface: "#1a2332",
  accent: "#c9a227",
  text: "#e8e6e3",
  textMuted: "#8a9199",
} as const;

export type ColorToken = keyof typeof colors;
