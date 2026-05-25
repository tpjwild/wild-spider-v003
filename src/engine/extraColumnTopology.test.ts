import { describe, expect, it } from "vitest";
import { appliedEffect } from "@/engine/effects";
import {
  insertEmptyColumnAt,
  remapExtraColumnLinks,
  remapHistoryEntry,
  remapIndexAfterInsert,
  remapIndexAfterRemove,
  removeColumnAt,
  restoreExtraColumnTopology,
  snapshotExtraColumnTopology,
} from "@/engine/extraColumnTopology";
import { EFFECT_WILD } from "@/content/effectDefinitions";
import type { GameState, HistoryEntry } from "@/engine/types";

function baseState(overrides: Partial<GameState> = {}): GameState {
  return {
    config: {
      columns: 3,
      deals: 10,
      deckPairId: "mathematics",
      seed: "topology-test",
      jokerCount: 0,
    },
    columns: [[{ card: { kind: "regular", id: 0, suit: "S", rank: 5 }, faceUp: true }], [], []],
    foundation: [[], [], [], [], [], [], [], []],
    stock: [],
    shelf: [],
    cardEffects: {},
    columnEffects: {
      0: [appliedEffect(EFFECT_WILD)],
      2: [appliedEffect(EFFECT_WILD)],
    },
    columnFlags: { 1: { isExtraChild: true } },
    undoCount: 0,
    history: [
      {
        type: "move_tableau",
        fromCol: 0,
        toCol: 2,
        startIndex: 0,
        count: 1,
        revealedWasFaceUp: false,
      },
      {
        type: "move_to_foundation",
        fromCol: 2,
        startIndex: 0,
        count: 1,
        foundationIndex: 0,
        revealedWasFaceUp: false,
      },
      {
        type: "deal",
        entries: [
          { card: { kind: "regular", id: 1, suit: "H", rank: 4 }, faceUp: true, tableauColumn: 1 },
          { card: { kind: "joker", id: 0 }, tableauColumn: null },
        ],
      },
      {
        type: "power_trigger",
        shelfIndex: 0,
        chargesBefore: 3,
        cardEffectsAdded: [],
        columnEffectsAdded: [{ columnIndex: 2, effect: EFFECT_WILD }],
      },
    ],
    extraColumnLinks: [{ parentColumnIndex: 0, movesRemaining: 7 }],
    ...overrides,
  };
}

describe("remapIndexAfterInsert", () => {
  it("shifts indices at and after insert point", () => {
    expect(remapIndexAfterInsert(0, 2)).toBe(0);
    expect(remapIndexAfterInsert(2, 2)).toBe(3);
    expect(remapIndexAfterInsert(3, 2)).toBe(4);
  });
});

describe("remapIndexAfterRemove", () => {
  it("drops removed index and shifts higher indices down", () => {
    expect(remapIndexAfterRemove(0, 2)).toBe(0);
    expect(remapIndexAfterRemove(2, 2)).toBeNull();
    expect(remapIndexAfterRemove(3, 2)).toBe(2);
  });
});

describe("remapExtraColumnLinks", () => {
  it("shifts parent indices on insert", () => {
    const links = remapExtraColumnLinks(
      [
        { parentColumnIndex: 0, movesRemaining: 10 },
        { parentColumnIndex: 2, movesRemaining: 5 },
      ],
      1,
      "insert",
    );
    expect(links).toEqual([
      { parentColumnIndex: 0, movesRemaining: 10 },
      { parentColumnIndex: 3, movesRemaining: 5 },
    ]);
  });

  it("removes links whose parent was removed and shifts others", () => {
    const links = remapExtraColumnLinks(
      [
        { parentColumnIndex: 0, movesRemaining: 10 },
        { parentColumnIndex: 2, movesRemaining: 5 },
        { parentColumnIndex: 3, movesRemaining: 4 },
      ],
      2,
      "remove",
      2,
    );
    expect(links).toEqual([
      { parentColumnIndex: 0, movesRemaining: 10 },
      { parentColumnIndex: 2, movesRemaining: 4 },
    ]);
  });
});

describe("remapHistoryEntry", () => {
  const move: HistoryEntry = {
    type: "move_tableau",
    fromCol: 1,
    toCol: 3,
    startIndex: 0,
    count: 1,
    revealedWasFaceUp: false,
  };

  it("remaps move and deal entries on insert", () => {
    expect(remapHistoryEntry(move, 2, "insert")).toEqual({
      ...move,
      fromCol: 1,
      toCol: 4,
    });
    const deal: HistoryEntry = {
      type: "deal",
      entries: [
        { card: { kind: "regular", id: 0, suit: "S", rank: 5 }, tableauColumn: 2 },
        { card: { kind: "joker", id: 0 }, tableauColumn: null },
      ],
    };
    expect(remapHistoryEntry(deal, 1, "insert")).toEqual({
      type: "deal",
      entries: [
        { card: { kind: "regular", id: 0, suit: "S", rank: 5 }, tableauColumn: 3 },
        { card: { kind: "joker", id: 0 }, tableauColumn: null },
      ],
    });
  });

  it("remaps move columns on remove including collapsed removed index", () => {
    expect(remapHistoryEntry(move, 2, "remove", 2)).toEqual({
      ...move,
      fromCol: 1,
      toCol: 2,
    });
    expect(remapHistoryEntry({ ...move, fromCol: 2 }, 2, "remove", 2)).toEqual({
      ...move,
      fromCol: 1,
      toCol: 2,
    });
  });
});

describe("insertEmptyColumnAt", () => {
  it("inserts an empty column and remaps indexed state and history", () => {
    const state = baseState();
    const next = insertEmptyColumnAt(state, 2);

    expect(next.columns).toHaveLength(4);
    expect(next.columns[2]).toEqual([]);
    expect(next.columns[0]).toHaveLength(1);
    expect(next.columnEffects[0]).toBeDefined();
    expect(next.columnEffects[3]).toBeDefined();
    expect(next.columnEffects[2]).toBeUndefined();
    expect(next.columnFlags[1]).toEqual({ isExtraChild: true });
    expect(next.columnFlags[2]).toBeUndefined();
    expect(next.extraColumnLinks).toEqual([{ parentColumnIndex: 0, movesRemaining: 7 }]);

    expect(next.history[0]).toMatchObject({ type: "move_tableau", fromCol: 0, toCol: 3 });
    expect(next.history[1]).toMatchObject({ type: "move_to_foundation", fromCol: 3 });
    const deal = next.history[2] as HistoryEntry & { type: "deal" };
    expect(deal.entries[0]!.tableauColumn).toBe(1);
    expect(deal.entries[1]!.tableauColumn).toBeNull();
    expect(next.history[3]).toMatchObject({
      type: "power_trigger",
      columnEffectsAdded: [{ columnIndex: 3, effect: EFFECT_WILD }],
    });
  });

  it("inserts at index 0 and at end", () => {
    const state = baseState({ columns: [[], []] });
    const head = insertEmptyColumnAt(state, 0);
    expect(head.columns).toEqual([[], [], []]);
    const tail = insertEmptyColumnAt(state, 2);
    expect(tail.columns).toEqual([[], [], []]);
  });
});

describe("removeColumnAt", () => {
  it("removes a column and remaps indexed state and history", () => {
    const state = baseState({
      columns: [
        [{ card: { kind: "regular", id: 0, suit: "S", rank: 5 }, faceUp: true }],
        [],
        [{ card: { kind: "regular", id: 1, suit: "H", rank: 6 }, faceUp: true }],
      ],
      columnEffects: { 0: [appliedEffect(EFFECT_WILD)], 2: [appliedEffect(EFFECT_WILD)] },
      columnFlags: { 1: { isExtraChild: true } },
      extraColumnLinks: [
        { parentColumnIndex: 0, movesRemaining: 7 },
        { parentColumnIndex: 2, movesRemaining: 4 },
      ],
    });
    const next = removeColumnAt(state, 1);

    expect(next.columns).toHaveLength(2);
    expect(next.columns[0]).toHaveLength(1);
    expect(next.columns[1]).toHaveLength(1);
    expect(next.columnEffects[1]).toBeDefined();
    expect(next.columnFlags[1]).toBeUndefined();
    expect(next.extraColumnLinks).toEqual([
      { parentColumnIndex: 0, movesRemaining: 7 },
      { parentColumnIndex: 1, movesRemaining: 4 },
    ]);

    expect(next.history[0]).toMatchObject({ type: "move_tableau", fromCol: 0, toCol: 1 });
    expect(next.history[1]).toMatchObject({ type: "move_to_foundation", fromCol: 1 });
    const deal = next.history[2] as HistoryEntry & { type: "deal" };
    expect(deal.entries[0]!.tableauColumn).toBe(0);
  });

  it("drops column effects and flags on the removed index", () => {
    const state = baseState({
      columns: [[], [{ card: { kind: "regular", id: 2, suit: "C", rank: 3 }, faceUp: true }], []],
      columnEffects: { 1: [appliedEffect(EFFECT_WILD)] },
      columnFlags: { 1: { isExtraChild: true } },
      extraColumnLinks: [{ parentColumnIndex: 0, movesRemaining: 3 }],
      history: [],
    });
    const next = removeColumnAt(state, 1);
    expect(next.columnEffects[1]).toBeUndefined();
    expect(next.columnFlags[1]).toBeUndefined();
  });
});

describe("topology snapshot restore", () => {
  it("round-trips columns, effects, flags, and links", () => {
    const state = baseState();
    const snap = snapshotExtraColumnTopology(state);
    const altered = insertEmptyColumnAt(state, 1);
    expect(altered.columns).toHaveLength(4);
    const restored = restoreExtraColumnTopology(altered, snap);
    expect(restored.columns).toEqual(state.columns);
    expect(restored.columnEffects).toEqual(state.columnEffects);
    expect(restored.columnFlags).toEqual(state.columnFlags);
    expect(restored.extraColumnLinks).toEqual(state.extraColumnLinks);
  });
});
