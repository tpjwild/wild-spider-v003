import { insertEmptyColumnAt, removeColumnAt } from "./extraColumnTopology";
import type { ExtraColumnLink, GameState, PlacedCard } from "./types";

/** Child column for a parent link is always immediately to the right after apply/remap. */
export function extraChildColumnIndex(parentColumnIndex: number): number {
  return parentColumnIndex + 1;
}

export function isExtraChildColumn(state: GameState, columnIndex: number): boolean {
  return state.columnFlags[columnIndex]?.isExtraChild === true;
}

/** Tableau column indices that receive stock deals (not extra-child columns). */
export function getDealColumnIndices(state: GameState): number[] {
  const indices: number[] = [];
  for (let i = 0; i < state.columns.length; i++) {
    if (!isExtraChildColumn(state, i)) indices.push(i);
  }
  return indices;
}

export function findExtraColumnLinkByParent(
  state: GameState,
  parentColumnIndex: number,
): ExtraColumnLink | undefined {
  return state.extraColumnLinks.find((l) => l.parentColumnIndex === parentColumnIndex);
}

/**
 * True when the column may be targeted by Extra Column (deal column, chain parent, or leaf extra-child).
 */
export function canTargetExtraColumnParent(state: GameState, columnIndex: number): boolean {
  return (
    Number.isInteger(columnIndex) && columnIndex >= 0 && columnIndex < state.columns.length
  );
}

export type ApplyExtraColumnResult = {
  state: GameState;
  /** Parent index of the newly created outer link. */
  newLinkParentIndex: number;
  /** Parent index of a reparented inner link, if any. */
  reparentedLinkParentIndex: number | null;
};

/**
 * Inserts an empty extra-child column at `parentColumnIndex + 1` and wires links.
 * When the parent already has a child, the former child is reparented under the new
 * column with its existing `movesRemaining` preserved (commit tick is Phase 6).
 */
export function applyExtraColumn(
  state: GameState,
  parentColumnIndex: number,
  linkDuration: number,
): ApplyExtraColumnResult | null {
  if (!canTargetExtraColumnParent(state, parentColumnIndex)) return null;
  if (!Number.isInteger(linkDuration) || linkDuration <= 0) return null;

  const insertAt = extraChildColumnIndex(parentColumnIndex);
  const existingChildLink = findExtraColumnLinkByParent(state, parentColumnIndex);

  let next = insertEmptyColumnAt(state, insertAt);

  const withoutParentLink = next.extraColumnLinks.filter(
    (l) => l.parentColumnIndex !== parentColumnIndex,
  );

  const newLinks: ExtraColumnLink[] = [
    ...withoutParentLink,
    { parentColumnIndex, movesRemaining: linkDuration },
  ];

  let reparentedLinkParentIndex: number | null = null;
  if (existingChildLink) {
    reparentedLinkParentIndex = insertAt;
    newLinks.push({
      parentColumnIndex: insertAt,
      movesRemaining: existingChildLink.movesRemaining,
    });
  }

  next = {
    ...next,
    extraColumnLinks: newLinks,
    columnFlags: {
      ...next.columnFlags,
      [insertAt]: { isExtraChild: true },
    },
  };

  return {
    state: next,
    newLinkParentIndex: parentColumnIndex,
    reparentedLinkParentIndex,
  };
}

/** Merges the child pile (bottom on parent top) for link `parentColumnIndex` → `parentColumnIndex + 1`. */
export function mergeExtraChildPileOntoParent(
  columns: PlacedCard[][],
  parentColumnIndex: number,
): PlacedCard[][] {
  const childColumnIndex = extraChildColumnIndex(parentColumnIndex);
  const cols = columns.map((c) => [...c]);
  const parent = cols[parentColumnIndex] ?? [];
  const child = cols[childColumnIndex] ?? [];
  cols[parentColumnIndex] = [...parent, ...child];
  return cols;
}

/**
 * Expires one parent→child link: merge child pile onto parent, remove child column,
 * reparent a grandchild link onto `parentColumnIndex` when present.
 */
export function expireExtraColumnLinkAtParent(
  state: GameState,
  parentColumnIndex: number,
): GameState {
  const childColumnIndex = extraChildColumnIndex(parentColumnIndex);
  if (childColumnIndex >= state.columns.length) return state;

  const columns = mergeExtraChildPileOntoParent(state.columns, parentColumnIndex);
  const grandchildLink = findExtraColumnLinkByParent(state, childColumnIndex);

  let extraColumnLinks = state.extraColumnLinks.filter(
    (l) => l.parentColumnIndex !== parentColumnIndex,
  );
  if (grandchildLink) {
    extraColumnLinks = [
      ...extraColumnLinks.filter((l) => l.parentColumnIndex !== childColumnIndex),
      {
        parentColumnIndex,
        movesRemaining: grandchildLink.movesRemaining,
      },
    ];
  }

  return removeColumnAt(
    { ...state, columns, extraColumnLinks },
    childColumnIndex,
  );
}

export type TickExtraColumnLinksOptions = {
  /** Parent indices whose links must not tick (targeted-commit exclusions; Phase 6). */
  excludeParentIndices?: readonly number[];
};

/**
 * Decrements timed extra-column links after a player move, then expires any that reach zero.
 */
export function tickExtraColumnLinks(
  state: GameState,
  options?: TickExtraColumnLinksOptions,
): GameState {
  const exclude = new Set(options?.excludeParentIndices ?? []);
  const toExpire: number[] = [];
  const extraColumnLinks: ExtraColumnLink[] = [];

  for (const link of state.extraColumnLinks) {
    if (exclude.has(link.parentColumnIndex)) {
      extraColumnLinks.push(link);
      continue;
    }
    const nextMoves = link.movesRemaining - 1;
    if (nextMoves <= 0) {
      toExpire.push(link.parentColumnIndex);
    } else {
      extraColumnLinks.push({ ...link, movesRemaining: nextMoves });
    }
  }

  let next = { ...state, extraColumnLinks };
  const parentsToExpire = [...toExpire].sort((a, b) => b - a);
  for (const parent of parentsToExpire) {
    next = expireExtraColumnLinkAtParent(next, parent);
  }
  return next;
}
