import type { SoundName } from "@/constants/soundFlags";

/**
 * Effects that have a shipped `public/sounds/<name>.mp3`.
 * Only listed effects are fetched; others use the synthesizer without a network request.
 *
 * When you add or remove an MP3 under `public/sounds/`, set the matching entry to `true` here.
 */
export const SOUND_MP3_SHIPPED = {
  // cardDealt: true,
} as const satisfies Partial<Record<SoundName, true>>;

export function isSoundMp3Shipped(name: SoundName): boolean {
  return Object.prototype.hasOwnProperty.call(SOUND_MP3_SHIPPED, name);
}
