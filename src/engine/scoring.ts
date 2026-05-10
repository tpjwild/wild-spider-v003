import { isRegular } from "./cards";
import type { GameState } from "./types";

export type ScoreBreakdown = {
  /** +1 per face-up on face-up where suits match and top rank = bottom rank - 1 */
  adjacentSuitRunPoints: number;
  /** -1 per card in foundation */
  foundationPenalty: number;
  /** +0.5 per complete K..A same suit in tableau (contiguous face-up tail) */
  completeRunBonus: number;
  /** -1 per undo */
  undoPenalty: number;
  total: number;
};

/**
 * Counts contiguous face-up same-suit runs that are exactly ranks K..A (13 cards).
 * Walk each column from bottom to top; only one suit per contiguous face-up segment.
 */
function countCompleteKingToAceRunsInTableau(state: GameState): number {
  let runs = 0;
  for (const col of state.columns) {
    let i = 0;
    while (i < col.length) {
      if (!col[i]!.faceUp) {
        i++;
        continue;
      }
      const start = i;
      while (i < col.length && col[i]!.faceUp) i++;
      const segment = col.slice(start, i);
      if (segment.length === 13 && isFullKingToAceRun(segment)) {
        runs++;
      }
    }
  }
  return runs;
}

function isFullKingToAceRun(segment: { card: import("./types").Card; faceUp: boolean }[]): boolean {
  if (segment.length !== 13) return false;
  const first = segment[0]!.card;
  const last = segment[12]!.card;
  if (!isRegular(first) || !isRegular(last)) return false;
  if (first.suit !== last.suit) return false;
  // bottom of column = index 0 in segment should be King (highest), top = Ace
  if (first.rank !== 13 || last.rank !== 1) return false;
  for (let j = 1; j < 13; j++) {
    const a = segment[j - 1]!.card;
    const b = segment[j]!.card;
    if (!isRegular(a) || !isRegular(b)) return false;
    if (a.suit !== b.suit) return false;
    if (a.rank !== b.rank + 1) return false;
  }
  return true;
}

function adjacentSuitPairPoints(state: GameState): number {
  let pts = 0;
  for (const col of state.columns) {
    for (let i = 1; i < col.length; i++) {
      const lower = col[i - 1]!;
      const upper = col[i]!;
      if (!lower.faceUp || !upper.faceUp) continue;
      const a = lower.card;
      const b = upper.card;
      if (!isRegular(a) || !isRegular(b)) continue;
      if (a.suit === b.suit && b.rank === a.rank - 1) pts++;
    }
  }
  return pts;
}

function foundationCardCount(state: GameState): number {
  return state.foundation.reduce((s, p) => s + p.length, 0);
}

/**
 * Score from current position (does not include "future" undos).
 * undoCount is taken from state.
 */
export function computeScore(state: GameState): ScoreBreakdown {
  const adjacentSuitRunPoints = adjacentSuitPairPoints(state);
  const fc = foundationCardCount(state);
  const foundationPenalty = fc === 0 ? 0 : -fc;
  const completeRunBonus = 0.5 * countCompleteKingToAceRunsInTableau(state);
  const undoPenalty = -state.undoCount;
  const total =
    adjacentSuitRunPoints +
    foundationPenalty +
    completeRunBonus +
    undoPenalty;
  return {
    adjacentSuitRunPoints,
    foundationPenalty,
    completeRunBonus,
    undoPenalty,
    total,
  };
}
