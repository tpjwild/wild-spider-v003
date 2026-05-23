import { isJoker, isRegular } from "./cards";
import { effectsForCardInColumn } from "./effects";
import {
  EFFECT_SKIP1,
  EFFECT_SKIP2,
  EFFECT_WILD,
  EFFECT_HALF_WILD,
} from "@/content/effectDefinitions";
import type { Card, EffectId, GameState, PlacedCard, Rank, RegularCard, Suit } from "./types";

const ALL_SUITS: readonly Suit[] = ["S", "C", "D", "H"];

function clampRank(n: number): Rank | null {
  if (n < 1 || n > 13 || !Number.isInteger(n)) return null;
  return n as Rank;
}

/** Rank choices for skip effects: ±1 (skip1) or ±1/±2 (skip2); natural rank excluded. */
export function effectiveRankChoices(rank: Rank, effects: readonly EffectId[]): Rank[] {
  const hasSkip2 = effects.includes(EFFECT_SKIP2);
  const hasSkip1 = effects.includes(EFFECT_SKIP1);
  const maxDelta = hasSkip2 ? 2 : hasSkip1 ? 1 : 0;
  if (maxDelta === 0) return [rank];

  const out = new Set<Rank>();
  for (let d = -maxDelta; d <= maxDelta; d++) {
    if (d === 0) continue;
    const r = clampRank(rank + d);
    if (r != null) out.add(r);
  }
  return [...out];
}

/** Suit choices for wild / halfWild (stacked with plain suit). */
export function effectiveSuitChoices(suit: Suit, effects: readonly EffectId[]): Suit[] {
  if (effects.includes(EFFECT_WILD)) return [...ALL_SUITS];
  const out = new Set<Suit>([suit]);
  if (effects.includes(EFFECT_HALF_WILD)) {
    if (suit === "H" || suit === "D") {
      out.add("H");
      out.add("D");
    } else {
      out.add("S");
      out.add("C");
    }
  }
  return [...out];
}

function segmentIsFaceUpRegular(column: PlacedCard[], startIndex: number): boolean {
  if (startIndex < 0 || startIndex >= column.length) return false;
  if (!column[startIndex]!.faceUp) return false;
  for (let i = startIndex; i < column.length; i++) {
    if (!column[i]!.faceUp) return false;
    if (!isRegular(column[i]!.card)) return false;
  }
  return true;
}

/**
 * Backtracking: each card picks one effective rank and suit for this run slice.
 * Below (lower index) must be exactly one rank higher and same effective suit as above.
 */
function runSliceAdmitsAssignment(
  state: GameState,
  columnIndex: number,
  column: PlacedCard[],
  startIndex: number,
): boolean {
  const len = column.length - startIndex;
  if (len === 0) return false;

  const rankChoices: Rank[][] = [];
  const suitChoices: Suit[][] = [];

  for (let i = startIndex; i < column.length; i++) {
    const card = column[i]!.card;
    if (!isRegular(card)) return false;
    const effects = effectsForCardInColumn(state, columnIndex, card);
    rankChoices.push(effectiveRankChoices(card.rank, effects));
    suitChoices.push(effectiveSuitChoices(card.suit, effects));
    if (rankChoices[rankChoices.length - 1]!.length === 0) return false;
    if (suitChoices[suitChoices.length - 1]!.length === 0) return false;
  }

  const ranks: Rank[] = new Array(len);
  const suits: Suit[] = new Array(len);

  function dfs(pos: number): boolean {
    if (pos === len) return true;
    for (const r of rankChoices[pos]!) {
      for (const s of suitChoices[pos]!) {
        if (pos > 0) {
          if (ranks[pos - 1]! !== ((r + 1) as Rank)) continue;
          if (suits[pos - 1]! !== s) continue;
        }
        ranks[pos] = r;
        suits[pos] = s;
        if (dfs(pos + 1)) return true;
      }
    }
    return false;
  }

  return dfs(0);
}

/** Tableau run validation with wild / halfWild / skip (column + card effects). */
export function isValidTableauRun(
  state: GameState,
  columnIndex: number,
  column: PlacedCard[],
  startIndex: number,
): boolean {
  if (!segmentIsFaceUpRegular(column, startIndex)) return false;
  const bottom = column[startIndex]!.card;
  if (isJoker(bottom)) return false;
  return runSliceAdmitsAssignment(state, columnIndex, column, startIndex);
}

/** Strict same-suit descending run (physical ranks/suits only; foundation and baseline). */
export function isValidStrictSameSuitDescendingRun(
  column: PlacedCard[],
  startIndex: number,
): boolean {
  if (startIndex < 0 || startIndex >= column.length) return false;
  if (!column[startIndex]!.faceUp) return false;
  for (let i = startIndex; i < column.length; i++) {
    if (!column[i]!.faceUp) return false;
    const c = column[i]!.card;
    if (!isRegular(c)) return false;
    if (i > startIndex) {
      const prev = column[i - 1]!.card;
      if (!isRegular(prev)) return false;
      if (prev.suit !== c.suit) return false;
      if (prev.rank !== c.rank + 1) return false;
    }
  }
  return true;
}

/** Placement onto a tableau pile (rank +1 with skip windows); suit ignored per spec. */
export function canPlaceOnTableauWithEffects(
  state: GameState,
  movingBottom: Card & { kind: "regular" },
  fromColumnIndex: number,
  destTop: (Card & { kind: "regular" }) | undefined,
  toColumnIndex: number,
): boolean {
  if (destTop === undefined) return true;

  const moveEffects = effectsForCardInColumn(state, fromColumnIndex, movingBottom);
  const destEffects = effectsForCardInColumn(state, toColumnIndex, destTop);
  const moveRanks = effectiveRankChoices(movingBottom.rank, moveEffects);
  const destRanks = effectiveRankChoices(destTop.rank, destEffects);

  for (const m of moveRanks) {
    for (const d of destRanks) {
      if (d === ((m + 1) as Rank)) return true;
    }
  }
  return false;
}
