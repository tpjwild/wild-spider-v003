import { deckPairs } from "@/content/deckPairs";

/** Full game seed: CC-DDD-XXX-SSSSSSSSSSSSSS (hyphens required). XXX = stable deck pair code. */
export const FORMATTED_GAME_SEED_PATTERN =
  /^(\d{2})-(\d{3})-([A-Za-z0-9]{3})-(\d{14})$/;

export function isFormattedGameSeed(s: string): boolean {
  return FORMATTED_GAME_SEED_PATTERN.test(s.trim());
}

export type ParsedFormattedGameSeed = {
  columns: number;
  deals: number;
  deckPairId: string;
  /** 14-digit shuffle key only — drives regular-card order and joker slot draws. */
  shuffleKey: string;
  /** Normalised seed string (deck code uppercased). */
  canonical: string;
};

export function parseFormattedGameSeed(trimmed: string): ParsedFormattedGameSeed | null {
  const m = trimmed.match(FORMATTED_GAME_SEED_PATTERN);
  if (!m) return null;
  const columns = Number(m[1]);
  const deals = Number(m[2]);
  const pairCode = m[3]!.toUpperCase();
  const shuffleKey = m[4]!;
  const pair = deckPairs.find((p) => p.pairCode === pairCode);
  if (!pair) return null;
  const canonical = `${String(columns).padStart(2, "0")}-${String(deals).padStart(3, "0")}-${pairCode}-${shuffleKey}`;
  return {
    columns,
    deals,
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
  pairCode: string,
  shuffleKey: string,
): string {
  return `${String(columns).padStart(2, "0")}-${String(deals).padStart(3, "0")}-${pairCode.toUpperCase()}-${shuffleKey}`;
}

export function getPairCodeForDeckId(deckPairId: string): string | undefined {
  return deckPairs.find((x) => x.id === deckPairId)?.pairCode;
}
