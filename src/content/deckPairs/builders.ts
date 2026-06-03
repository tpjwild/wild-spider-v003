import {
  baseCourtPortraitBasename,
  gameArtPortraitThumbUrl,
  gameArtPortraitUrl,
  sharedCourtFramePath,
  sharedJokerFramePathFromPortraitBasename,
} from "@/constants/gameArtPaths";
import { THEMED_COURT_PORTRAITS, THEMED_JOKER_PORTRAITS } from "@/content/portraitManifest";
import type { PowerId, Suit } from "@/engine/types";
import type {
  DeckFaceCard,
  DeckFaceRank,
  DeckJokerCard,
  DeckSetPower,
} from "@/content/deckPairs/types";

const SUITS_ORDER: readonly Suit[] = ["S", "C", "D", "H"];

export type ThemedPairId = "computerScience" | "mathematics" | "westernPhilosophy";

function courtPortraitKey(pairId: ThemedPairId, deck: 1 | 2, suit: Suit, rank: DeckFaceRank): string {
  return `${pairId}:${deck}:${suit}:${rank}`;
}

/** Per suit: court card copy plus shelf set-power catalog (like joker slots). */
export type ThemedSetSuitInput = {
  jName: string;
  jBio: string;
  qName: string;
  qBio: string;
  kName: string;
  kBio: string;
  powerId: PowerId;
  initialCharges: number;
  /** null = permanent effects. */
  initialDuration: number | null;
};

export type ThemedSetsResult = {
  faces: readonly DeckFaceCard[];
  setPowers: readonly DeckSetPower[];
};

type ThemedSetsArgs = {
  pairId: ThemedPairId;
  deck: 1 | 2;
  sets: Record<Suit, ThemedSetSuitInput>;
};

export function themedSets({ pairId, deck, sets: bySuit }: ThemedSetsArgs): ThemedSetsResult {
  const faces: DeckFaceCard[] = [];
  const setPowers: DeckSetPower[] = [];
  for (const suit of SUITS_ORDER) {
    const row = bySuit[suit];
    const triple: readonly [DeckFaceRank, string, string][] = [
      [11, row.jName, row.jBio],
      [12, row.qName, row.qBio],
      [13, row.kName, row.kBio],
    ];
    for (const [rank, name, bio] of triple) {
      const key = courtPortraitKey(pairId, deck, suit, rank);
      const m = THEMED_COURT_PORTRAITS[key];
      if (!m) throw new Error(`Missing themed court portrait manifest entry: ${key}`);
      faces.push({
        suit,
        rank,
        name,
        bio,
        portraitPath: gameArtPortraitUrl(pairId, deck, m.file),
        portraitThumbPath: gameArtPortraitThumbUrl(pairId, deck, m.file),
        framePath: sharedCourtFramePath(rank, suit),
      });
    }
    setPowers.push({
      suit,
      powerId: row.powerId,
      initialCharges: row.initialCharges,
      initialDuration: row.initialDuration,
    });
  }
  return { faces, setPowers };
}

type BaseSetSuitInput = {
  j: string;
  jBio: string;
  q: string;
  qBio: string;
  k: string;
  kBio: string;
  powerId: PowerId;
  initialCharges: number;
  initialDuration: number | null;
};

export function baseSets(
  deckNum: 1 | 2,
  bySuit: Record<Suit, BaseSetSuitInput>,
): ThemedSetsResult {
  const faces: DeckFaceCard[] = [];
  const setPowers: DeckSetPower[] = [];
  for (const suit of SUITS_ORDER) {
    const row = bySuit[suit];
    const triple: readonly [DeckFaceRank, string, string][] = [
      [11, row.j, row.jBio],
      [12, row.q, row.qBio],
      [13, row.k, row.kBio],
    ];
    for (const [rank, name, bio] of triple) {
      const basename = baseCourtPortraitBasename(deckNum, rank, suit);
      faces.push({
        suit,
        rank,
        name,
        bio,
        portraitPath: gameArtPortraitUrl("base", deckNum, basename),
        portraitThumbPath: gameArtPortraitThumbUrl("base", deckNum, basename),
        framePath: sharedCourtFramePath(rank, suit),
      });
    }
    setPowers.push({
      suit,
      powerId: row.powerId,
      initialCharges: row.initialCharges,
      initialDuration: row.initialDuration,
    });
  }
  return { faces, setPowers };
}

/** Per joker slot 1–4: catalog name, bio, power, charges, and duration; portrait file from manifest. */
export type ThemedJokerInput = {
  name: string;
  bio: string;
  powerId: PowerId;
  initialCharges: number;
  /** null = permanent effects (default). */
  initialDuration?: number | null;
};

type ThemedJokersArgs = {
  pairId: ThemedPairId;
  deck: 1 | 2;
  jokers: readonly [ThemedJokerInput, ThemedJokerInput, ThemedJokerInput, ThemedJokerInput];
};

export function themedJokers({ pairId, deck, jokers: defs }: ThemedJokersArgs): readonly DeckJokerCard[] {
  const out: DeckJokerCard[] = [];
  for (let i = 0; i < 4; i++) {
    const slot = (i + 1) as 1 | 2 | 3 | 4;
    const key = `${pairId}:${deck}:${slot}`;
    const portrait = THEMED_JOKER_PORTRAITS[key];
    if (!portrait) throw new Error(`Missing themed joker portrait manifest entry: ${key}`);
    const def = defs[i]!;
    out.push({
      index: slot,
      powerId: def.powerId,
      initialCharges: def.initialCharges,
      initialDuration: def.initialDuration ?? null,
      name: def.name,
      bio: def.bio,
      portraitPath: gameArtPortraitUrl(pairId, deck, portrait.file),
      portraitThumbPath: gameArtPortraitThumbUrl(pairId, deck, portrait.file),
      framePath: sharedJokerFramePathFromPortraitBasename(portrait.file),
    });
  }
  return out;
}
