import { isRegular } from "@/engine/cards";
import type { GameState, PlacedCard, RegularCard, SetKey } from "@/engine/types";
import { deckNumFromRegularCardId } from "@/lib/deckCardArt";
import { setKeyFromSuitDeck } from "@/lib/setPowerUi";

function courtTripleMatches(
  bottom: RegularCard,
  middle: RegularCard,
  top: RegularCard,
): SetKey | null {
  if (bottom.rank !== 13 || middle.rank !== 12 || top.rank !== 11) return null;
  if (bottom.suit !== middle.suit || middle.suit !== top.suit) return null;
  const deckNum = deckNumFromRegularCardId(bottom.id);
  if (deckNumFromRegularCardId(middle.id) !== deckNum || deckNumFromRegularCardId(top.id) !== deckNum) {
    return null;
  }
  return setKeyFromSuitDeck(deckNum, bottom.suit);
}

function placedRegularAt(placed: PlacedCard): RegularCard | null {
  return isRegular(placed.card) ? placed.card : null;
}

/**
 * Tableau: Jack immediately above Queen immediately above King (same suit + deck).
 * Column index `start` is the King; `start + 2` is the Jack (top of the triple).
 */
export function alignedSetKeyFromTableauTriple(
  column: readonly PlacedCard[],
  start: number,
): SetKey | null {
  if (start < 0 || start + 2 >= column.length) return null;
  const king = placedRegularAt(column[start]!);
  const queen = placedRegularAt(column[start + 1]!);
  const jack = placedRegularAt(column[start + 2]!);
  if (!king || !queen || !jack) return null;
  return courtTripleMatches(king, queen, jack);
}

/**
 * Foundation pile top: King on Queen on Jack (same suit + deck).
 * Only the top three cards of the pile are considered.
 */
export function alignedSetKeyFromFoundationPile(pile: readonly PlacedCard[]): SetKey | null {
  if (pile.length < 3) return null;
  const jack = placedRegularAt(pile[pile.length - 3]!);
  const queen = placedRegularAt(pile[pile.length - 2]!);
  const king = placedRegularAt(pile[pile.length - 1]!);
  if (!jack || !queen || !king) return null;
  return courtTripleMatches(king, queen, jack);
}

/** All set keys currently aligned on the tableau or foundation. */
export function findAlignedSets(game: GameState): SetKey[] {
  const found = new Set<SetKey>();
  for (const column of game.columns) {
    for (let i = 0; i + 2 < column.length; i++) {
      const key = alignedSetKeyFromTableauTriple(column, i);
      if (key) found.add(key);
    }
  }
  for (const pile of game.foundation) {
    const key = alignedSetKeyFromFoundationPile(pile);
    if (key) found.add(key);
  }
  return [...found];
}

/** Set keys aligned now that were not yet recorded in {@link GameState.alignedSetKeys}. */
export function findNewlyAlignedSets(
  game: GameState,
  alignedSetKeys: readonly SetKey[],
): SetKey[] {
  const already = new Set(alignedSetKeys);
  return findAlignedSets(game).filter((key) => !already.has(key));
}
