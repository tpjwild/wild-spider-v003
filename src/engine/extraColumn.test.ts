import { describe, expect, it } from "vitest";
import { buildDoubleDeck } from "@/engine/cards";
import { appliedEffect } from "@/engine/effects";
import { moveTableau } from "@/engine/game";
import {
  applyExtraColumn,
  canTargetExtraColumnParent,
  expireExtraColumnLinkAtParent,
  extraChildColumnIndex,
  findExtraColumnLinkByParent,
  isExtraChildColumn,
  tickExtraColumnLinks,
} from "@/engine/extraColumn";
import { emptyExtraColumnState } from "@/engine/extraColumnState";
import { EFFECT_WILD } from "@/content/effectDefinitions";
import type { GameState, PlacedCard } from "@/engine/types";

const d = buildDoubleDeck();

function pile(...cards: { card: (typeof d)[0]; faceUp: boolean }[]): PlacedCard[] {
  return cards.map(({ card, faceUp }) => ({ card, faceUp }));
}

function baseState(overrides: Partial<GameState> = {}): GameState {
  return {
    config: {
      columns: 3,
      deals: 10,
      deckPairId: "mathematics",
      seed: "extra-column-apply",
      jokerCount: 0,
    },
    columns: [pile(), pile(), pile()],
    foundation: [[], [], [], [], [], [], [], []],
    stock: [],
    shelf: [],
    alignedSetKeys: [],
    cardEffects: {},
    columnEffects: {},
    ...emptyExtraColumnState(),
    undoCount: 0,
    history: [],
    ...overrides,
  };
}

describe("canTargetExtraColumnParent", () => {
  it("allows deal columns, leaf extra-children, and chain parents", () => {
    const state = baseState({
      columnFlags: { 1: { isExtraChild: true }, 2: { isExtraChild: true } },
      extraColumnLinks: [
        { parentColumnIndex: 0, movesRemaining: 10 },
        { parentColumnIndex: 1, movesRemaining: 5 },
      ],
    });
    expect(canTargetExtraColumnParent(state, 0)).toBe(true);
    expect(canTargetExtraColumnParent(state, 1)).toBe(true);
    expect(canTargetExtraColumnParent(state, 2)).toBe(true);
    expect(canTargetExtraColumnParent(state, 99)).toBe(false);
  });
});

describe("applyExtraColumn", () => {
  it("inserts an empty child column and creates a parent link", () => {
    const c0 = d[0]!;
    const c1 = d[1]!;
    const state = baseState({
      columns: [pile({ card: c0, faceUp: true }), pile({ card: c1, faceUp: true }), pile()],
      columnEffects: { 0: [appliedEffect(EFFECT_WILD)] },
    });

    const result = applyExtraColumn(state, 0, 10);
    expect(result).not.toBeNull();
    const next = result!.state;

    expect(next.columns).toHaveLength(4);
    expect(next.columns[1]).toEqual([]);
    expect(next.columns[0]).toHaveLength(1);
    expect(next.columns[2]).toHaveLength(1);
    expect(next.extraColumnLinks).toEqual([{ parentColumnIndex: 0, movesRemaining: 10 }]);
    expect(next.columnFlags[1]).toEqual({ isExtraChild: true });
    expect(next.columnEffects[0]).toBeDefined();
    expect(next.columnEffects[1]).toBeUndefined();
    expect(isExtraChildColumn(next, 1)).toBe(true);
    expect(findExtraColumnLinkByParent(next, 0)!.movesRemaining).toBe(10);
    expect(extraChildColumnIndex(0)).toBe(1);
  });

  it("rejects out-of-range parent or non-positive duration", () => {
    expect(applyExtraColumn(baseState(), 99, 10)).toBeNull();
    expect(applyExtraColumn(baseState(), 0, 0)).toBeNull();
  });

  it("extends chain from a leaf extra-child column", () => {
    const state = baseState({
      columns: [[], [], []],
      columnFlags: { 1: { isExtraChild: true } },
      extraColumnLinks: [{ parentColumnIndex: 0, movesRemaining: 10 }],
    });
    const result = applyExtraColumn(state, 1, 8)!;
    const next = result.state;
    expect(next.columns).toHaveLength(4);
    expect(next.columnFlags[2]).toEqual({ isExtraChild: true });
    expect(next.extraColumnLinks).toEqual([
      { parentColumnIndex: 0, movesRemaining: 10 },
      { parentColumnIndex: 1, movesRemaining: 8 },
    ]);
    expect(result.newLinkParentIndex).toBe(1);
  });

  it("chains when parent already has a child and preserves inner timer", () => {
    const a = d[0]!;
    const b = d[1]!;
    const state = baseState({
      columns: [
        pile({ card: a, faceUp: true }),
        pile({ card: b, faceUp: true }),
        pile(),
      ],
      columnFlags: { 1: { isExtraChild: true } },
      extraColumnLinks: [{ parentColumnIndex: 0, movesRemaining: 5 }],
    });

    const result = applyExtraColumn(state, 0, 10)!;
    const next = result.state;

    expect(next.columns).toHaveLength(4);
    expect(next.columns[1]).toEqual([]);
    expect(next.columns[2]).toHaveLength(1);
    expect(next.columns[2]![0]!.card.id).toBe(b.id);

    expect(next.extraColumnLinks).toEqual([
      { parentColumnIndex: 0, movesRemaining: 10 },
      { parentColumnIndex: 1, movesRemaining: 5 },
    ]);
    expect(result.reparentedLinkParentIndex).toBe(1);
    expect(next.columnFlags[1]?.isExtraChild).toBe(true);
    expect(next.columnFlags[2]?.isExtraChild).toBe(true);
  });

  it("inserts between parent and grandchild when re-applying on middle of a chain", () => {
    const a = d[0]!;
    const b = d[2]!;
    const c = d[3]!;
    const state = baseState({
      columns: [
        pile({ card: a, faceUp: true }),
        pile({ card: b, faceUp: true }),
        pile({ card: c, faceUp: true }),
      ],
      columnFlags: {
        1: { isExtraChild: true },
        2: { isExtraChild: true },
      },
      extraColumnLinks: [
        { parentColumnIndex: 0, movesRemaining: 10 },
        { parentColumnIndex: 1, movesRemaining: 5 },
      ],
    });

    const result = applyExtraColumn(state, 1, 10)!;
    const next = result.state;

    expect(next.columns).toHaveLength(4);
    expect(next.columns[1]).toHaveLength(1);
    expect(next.columns[1]![0]!.card.id).toBe(b.id);
    expect(next.columns[2]).toEqual([]);
    expect(next.columns[3]).toHaveLength(1);
    expect(next.columns[3]![0]!.card.id).toBe(c.id);

    expect(next.extraColumnLinks).toEqual([
      { parentColumnIndex: 0, movesRemaining: 10 },
      { parentColumnIndex: 1, movesRemaining: 10 },
      { parentColumnIndex: 2, movesRemaining: 5 },
    ]);
    expect(result.newLinkParentIndex).toBe(1);
    expect(result.reparentedLinkParentIndex).toBe(2);
  });
});

describe("tickExtraColumnLinks", () => {
  it("decrements moves remaining without expiring", () => {
    const state = baseState({
      extraColumnLinks: [
        { parentColumnIndex: 0, movesRemaining: 3 },
        { parentColumnIndex: 1, movesRemaining: 2 },
      ],
    });
    const next = tickExtraColumnLinks(state);
    expect(next.extraColumnLinks).toEqual([
      { parentColumnIndex: 0, movesRemaining: 2 },
      { parentColumnIndex: 1, movesRemaining: 1 },
    ]);
  });

  it("skips excluded parent links", () => {
    const state = baseState({
      extraColumnLinks: [{ parentColumnIndex: 0, movesRemaining: 2 }],
    });
    const next = tickExtraColumnLinks(state, { excludeParentIndices: [0] });
    expect(next.extraColumnLinks[0]!.movesRemaining).toBe(2);
  });
});

describe("expireExtraColumnLinkAtParent", () => {
  it("merges child pile onto parent and removes the child column", () => {
    const a = d[0]!;
    const b = d[1]!;
    const state = baseState({
      columns: [
        pile({ card: a, faceUp: true }),
        pile({ card: b, faceUp: true }),
        pile(),
      ],
      columnFlags: { 1: { isExtraChild: true } },
      extraColumnLinks: [{ parentColumnIndex: 0, movesRemaining: 1 }],
    });

    const next = expireExtraColumnLinkAtParent(state, 0);
    expect(next.columns).toHaveLength(2);
    expect(next.columns[0]).toHaveLength(2);
    expect(next.columns[0]![0]!.card.id).toBe(a.id);
    expect(next.columns[0]![1]!.card.id).toBe(b.id);
    expect(next.extraColumnLinks).toEqual([]);
    expect(next.columnFlags[1]).toBeUndefined();
  });

  it("expires middle of A→B→C chain leaving only A→C link", () => {
    const a = d[0]!;
    const b = d[2]!;
    const c = d[3]!;
    const state = baseState({
      columns: [
        pile({ card: a, faceUp: true }),
        pile({ card: b, faceUp: true }),
        pile({ card: c, faceUp: true }),
      ],
      columnFlags: {
        1: { isExtraChild: true },
        2: { isExtraChild: true },
      },
      extraColumnLinks: [
        { parentColumnIndex: 0, movesRemaining: 10 },
        { parentColumnIndex: 1, movesRemaining: 1 },
      ],
    });

    const next = tickExtraColumnLinks(state);
    expect(next.columns).toHaveLength(2);
    expect(next.columns[0]).toHaveLength(1);
    expect(next.columns[1]).toHaveLength(2);
    expect(next.columns[1]![0]!.card.id).toBe(b.id);
    expect(next.columns[1]![1]!.card.id).toBe(c.id);
    expect(next.extraColumnLinks).toEqual([{ parentColumnIndex: 0, movesRemaining: 9 }]);
    expect(findExtraColumnLinkByParent(next, 0)).toBeDefined();
    expect(findExtraColumnLinkByParent(next, 1)).toBeUndefined();
    expect(next.columnFlags[2]).toBeUndefined();
  });

  it("reparents grandchild when expiring middle of a four-column chain", () => {
    const a = d[0]!;
    const b = d[2]!;
    const c = d[4]!;
    const state = baseState({
      columns: [
        pile({ card: a, faceUp: true }),
        pile({ card: b, faceUp: true }),
        [],
        pile({ card: c, faceUp: true }),
      ],
      columnFlags: {
        1: { isExtraChild: true },
        2: { isExtraChild: true },
        3: { isExtraChild: true },
      },
      extraColumnLinks: [
        { parentColumnIndex: 0, movesRemaining: 10 },
        { parentColumnIndex: 1, movesRemaining: 1 },
        { parentColumnIndex: 2, movesRemaining: 4 },
      ],
    });

    const next = expireExtraColumnLinkAtParent(state, 1);
    expect(next.columns).toHaveLength(3);
    expect(next.columns[1]).toHaveLength(1);
    expect(next.columns[1]![0]!.card.id).toBe(b.id);
    expect(next.columns[2]).toHaveLength(1);
    expect(next.columns[2]![0]!.card.id).toBe(c.id);
    expect(next.extraColumnLinks).toEqual([
      { parentColumnIndex: 0, movesRemaining: 10 },
      { parentColumnIndex: 1, movesRemaining: 4 },
    ]);
    expect(extraChildColumnIndex(1)).toBe(2);
  });
});

describe("extra column tick on player moves", () => {
  it("ticks links after a tableau move via game.moveTableau", () => {
    const a = d[0]!;
    const b = d[1]!;
    const c = d[2]!;
    const state = baseState({
      columns: [
        pile({ card: a, faceUp: true }),
        pile({ card: b, faceUp: true }, { card: c, faceUp: true }),
        pile(),
      ],
      extraColumnLinks: [{ parentColumnIndex: 0, movesRemaining: 2 }],
      columnFlags: { 1: { isExtraChild: true } },
    });
    const after = moveTableau(state, { fromColumn: 1, startIndex: 1, toColumn: 2 })!;
    expect(after.extraColumnLinks[0]!.movesRemaining).toBe(1);
  });
});
