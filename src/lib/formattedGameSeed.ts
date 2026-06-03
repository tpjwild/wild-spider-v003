import { deckPairs } from "@/content/deckPairs";
import { normalizeNumberOfSuits } from "@/lib/numberOfSuits";
import type { NumberOfSuits } from "@/engine/types";

/** Formatted seed with suits segment: CC-DDD-S-XXX-SSSSSSSSSSSSSS (S = 1, 2, or 4). */
export const FORMATTED_GAME_SEED_PATTERN =
  /^(\d{2})-(\d{3})-([124])-([A-Za-z0-9]{3})-(\d{14})$/;

/** Legacy formatted seed without suits (defaults to 4 suits). */
const LEGACY_FORMATTED_GAME_SEED_PATTERN =
  /^(\d{2})-(\d{3})-([A-Za-z0-9]{3})-(\d{14})$/;

export function isFormattedGameSeed(s: string): boolean {
  const t = s.trim();
  return (
    FORMATTED_GAME_SEED_PATTERN.test(t) || LEGACY_FORMATTED_GAME_SEED_PATTERN.test(t)
  );
}

export type ParsedFormattedGameSeed = {
  columns: number;
  deals: number;
  numberOfSuits: NumberOfSuits;
  deckPairId: string;
  /** 14-digit shuffle key only — drives regular-card order and joker slot draws. */
  shuffleKey: string;
  /** Normalised seed string (deck code uppercased). */
  canonical: string;
};

export function parseFormattedGameSeed(trimmed: string): ParsedFormattedGameSeed | null {
  const withSuits = trimmed.match(FORMATTED_GAME_SEED_PATTERN);
  if (withSuits) {
    const columns = Number(withSuits[1]);
    const deals = Number(withSuits[2]);
    const numberOfSuits = normalizeNumberOfSuits(Number(withSuits[3]));
    const pairCode = withSuits[4]!.toUpperCase();
    const shuffleKey = withSuits[5]!;
    const pair = deckPairs.find((p) => p.pairCode === pairCode);
    if (!pair) return null;
    const canonical = `${String(columns).padStart(2, "0")}-${String(deals).padStart(3, "0")}-${numberOfSuits}-${pairCode}-${shuffleKey}`;
    return {
      columns,
      deals,
      numberOfSuits,
      deckPairId: pair.id,
      shuffleKey,
      canonical,
    };
  }

  const legacy = trimmed.match(LEGACY_FORMATTED_GAME_SEED_PATTERN);
  if (!legacy) return null;
  const columns = Number(legacy[1]);
  const deals = Number(legacy[2]);
  const pairCode = legacy[3]!.toUpperCase();
  const shuffleKey = legacy[4]!;
  const pair = deckPairs.find((p) => p.pairCode === pairCode);
  if (!pair) return null;
  const canonical = `${String(columns).padStart(2, "0")}-${String(deals).padStart(3, "0")}-${pairCode}-${shuffleKey}`;
  return {
    columns,
    deals,
    numberOfSuits: 4,
    deckPairId: pair.id,
    shuffleKey,
    canonical,
  };
}

/** Fourteen-digit shuffle key (first digit 1–9). */
export function newRandomShuffleKey(): string {
  const buf = new Uint8Array(14);
  crypto.getRandomValues(buf);
  let s = String(1 + (buf[0]! % 9));
  for (let i = 1; i < 14; i++) {
    s += String(buf[i]! % 10);
  }
  return s;
}

export function formatFormattedGameSeed(
  columns: number,
  deals: number,
  numberOfSuits: NumberOfSuits,
  pairCode: string,
  shuffleKey: string,
): string {
  const suits = normalizeNumberOfSuits(numberOfSuits);
  return `${String(columns).padStart(2, "0")}-${String(deals).padStart(3, "0")}-${suits}-${pairCode.toUpperCase()}-${shuffleKey}`;
}

export function getPairCodeForDeckId(deckPairId: string): string | undefined {
  return deckPairs.find((x) => x.id === deckPairId)?.pairCode;
}
