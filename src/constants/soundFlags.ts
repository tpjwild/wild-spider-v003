/**
 * Per-effect toggles for {@link playSound}, {@link playSoundAsync}, and {@link prepareSound}.
 * Set any entry to `false` to mute that cue (MP3 and synth are skipped).
 */
export const soundFlags = {
  cardDealt: true,
  cardPlaced: true,
  cardFlipped: false,
  powerTriggered: true,
  powerTargeted: true,
} as const;

export type SoundName = keyof typeof soundFlags;
