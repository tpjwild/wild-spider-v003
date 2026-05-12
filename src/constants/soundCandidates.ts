import type { SoundName } from "@/constants/soundFlags";

/**
 * Dev audition: WAV paths under `public/sounds/` (Kenney Interface Sounds, CC0).
 * Shipped game still uses `public/sounds/<effect>.mp3` or synthesizer via {@link playSound}.
 */
export const SOUND_CANDIDATES: Record<SoundName, readonly string[]> = {
  cardDealt: [
    "/sounds/candidates/cardDealt/kenney-drop_001.wav",
    "/sounds/candidates/cardDealt/kenney-click_001.wav",
    "/sounds/candidates/cardDealt/kenney-pluck_001.wav",
  ],
  cardPlaced: [
    "/sounds/candidates/cardPlaced/kenney-drop_002.wav",
    "/sounds/candidates/cardPlaced/kenney-glass_001.wav",
    "/sounds/candidates/cardPlaced/kenney-click_003.wav",
  ],
  cardFlipped: [
    "/sounds/candidates/cardFlipped/kenney-open_001.wav",
    "/sounds/candidates/cardFlipped/kenney-glass_002.wav",
    "/sounds/candidates/cardFlipped/kenney-toggle_001.wav",
  ],
  powerTriggered: [
    "/sounds/candidates/powerTriggered/kenney-bong_001.wav",
    "/sounds/candidates/powerTriggered/kenney-confirmation_001.wav",
    "/sounds/candidates/powerTriggered/kenney-maximize_007.wav",
  ],
  powerTargeted: [
    "/sounds/candidates/powerTargeted/kenney-select_007.wav",
    "/sounds/candidates/powerTargeted/kenney-tick_002.wav",
    "/sounds/candidates/powerTargeted/kenney-click_005.wav",
  ],
} as const;
