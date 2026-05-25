import type {
  AppliedEffect,
  ColumnFlagsEntry,
  ExtraColumnLink,
  GameState,
  HistoryEntry,
} from "./types";

/** After inserting a column at `insertAt`, map a column index from before insert to after. */
export function remapIndexAfterInsert(index: number, insertAt: number): number {
  return index >= insertAt ? index + 1 : index;
}

/**
 * After removing a column at `removeAt`, map a column index from before remove to after.
 * Returns `null` when `index` was the removed column.
 */
export function remapIndexAfterRemove(index: number, removeAt: number): number | null {
  if (index < removeAt) return index;
  if (index === removeAt) return null;
  return index - 1;
}

/**
 * Like {@link remapIndexAfterRemove} but collapses the removed index to its parent slot
 * (`removeAt - 1`, or `0`) for history entries that still reference the removed column.
 */
export function remapHistoryColumnIndexAfterRemove(index: number, removeAt: number): number {
  if (index < removeAt) return index;
  if (index === removeAt) return Math.max(0, removeAt - 1);
  return index - 1;
}

function remapNullableColumnIndexAfterInsert(
  column: number | null,
  insertAt: number,
): number | null {
  return column === null ? null : remapIndexAfterInsert(column, insertAt);
}

function remapNullableColumnIndexAfterRemove(
  column: number | null,
  removeAt: number,
): number | null {
  if (column === null) return null;
  return remapHistoryColumnIndexAfterRemove(column, removeAt);
}

export function remapColumnKeyedRecord<T>(
  record: Record<number, T>,
  insertAt: number,
  mode: "insert" | "remove",
  removeAt?: number,
): Record<number, T> {
  const out: Record<number, T> = {};
  for (const [key, value] of Object.entries(record)) {
    const idx = Number(key);
    if (!Number.isInteger(idx)) continue;
    if (mode === "insert") {
      out[remapIndexAfterInsert(idx, insertAt)] = value;
      continue;
    }
    const mapped = remapIndexAfterRemove(idx, removeAt!);
    if (mapped !== null) out[mapped] = value;
  }
  return out;
}

export function remapExtraColumnLinks(
  links: readonly ExtraColumnLink[],
  insertAt: number,
  mode: "insert" | "remove",
  removeAt?: number,
): ExtraColumnLink[] {
  if (mode === "insert") {
    return links.map((link) => ({
      ...link,
      parentColumnIndex: remapIndexAfterInsert(link.parentColumnIndex, insertAt),
    }));
  }
  const out: ExtraColumnLink[] = [];
  for (const link of links) {
    const parent = remapIndexAfterRemove(link.parentColumnIndex, removeAt!);
    if (parent !== null) out.push({ ...link, parentColumnIndex: parent });
  }
  return out;
}

export function remapHistoryEntry(
  entry: HistoryEntry,
  insertAt: number,
  mode: "insert" | "remove",
  removeAt?: number,
): HistoryEntry {
  if (mode === "insert") {
    if (entry.type === "move_tableau") {
      return {
        ...entry,
        fromCol: remapIndexAfterInsert(entry.fromCol, insertAt),
        toCol: remapIndexAfterInsert(entry.toCol, insertAt),
      };
    }
    if (entry.type === "move_to_foundation") {
      return {
        ...entry,
        fromCol: remapIndexAfterInsert(entry.fromCol, insertAt),
      };
    }
    if (entry.type === "deal") {
      return {
        ...entry,
        entries: entry.entries.map((e) => ({
          ...e,
          tableauColumn: remapNullableColumnIndexAfterInsert(e.tableauColumn, insertAt),
        })),
      };
    }
    return {
      ...entry,
      columnEffectsAdded: entry.columnEffectsAdded.map((a) => ({
        ...a,
        columnIndex: remapIndexAfterInsert(a.columnIndex, insertAt),
      })),
    };
  }

  if (entry.type === "move_tableau") {
    return {
      ...entry,
      fromCol: remapHistoryColumnIndexAfterRemove(entry.fromCol, removeAt!),
      toCol: remapHistoryColumnIndexAfterRemove(entry.toCol, removeAt!),
    };
  }
  if (entry.type === "move_to_foundation") {
    return {
      ...entry,
      fromCol: remapHistoryColumnIndexAfterRemove(entry.fromCol, removeAt!),
    };
  }
  if (entry.type === "deal") {
    return {
      ...entry,
      entries: entry.entries.map((e) => ({
        ...e,
        tableauColumn: remapNullableColumnIndexAfterRemove(e.tableauColumn, removeAt!),
      })),
    };
  }
  return {
    ...entry,
    columnEffectsAdded: entry.columnEffectsAdded.map((a) => ({
      ...a,
      columnIndex: remapHistoryColumnIndexAfterRemove(a.columnIndex, removeAt!),
    })),
  };
}

export function remapHistory(
  history: readonly HistoryEntry[],
  insertAt: number,
  mode: "insert" | "remove",
  removeAt?: number,
): HistoryEntry[] {
  return history.map((entry) => remapHistoryEntry(entry, insertAt, mode, removeAt));
}

function assertValidInsertIndex(state: GameState, insertIndex: number): void {
  if (!Number.isInteger(insertIndex) || insertIndex < 0 || insertIndex > state.columns.length) {
    throw new Error(
      `insertEmptyColumnAt: insertIndex ${insertIndex} out of range 0..${state.columns.length}`,
    );
  }
}

function assertValidRemoveIndex(state: GameState, removeIndex: number): void {
  if (!Number.isInteger(removeIndex) || removeIndex < 0 || removeIndex >= state.columns.length) {
    throw new Error(
      `removeColumnAt: removeIndex ${removeIndex} out of range 0..${state.columns.length - 1}`,
    );
  }
}

/**
 * Inserts an empty column at `insertIndex` and remaps column-indexed state and history.
 */
export function insertEmptyColumnAt(state: GameState, insertIndex: number): GameState {
  assertValidInsertIndex(state, insertIndex);
  const columns = state.columns.map((c) => [...c]);
  columns.splice(insertIndex, 0, []);

  return {
    ...state,
    columns,
    columnEffects: remapColumnKeyedRecord(state.columnEffects, insertIndex, "insert"),
    columnFlags: remapColumnKeyedRecord(state.columnFlags, insertIndex, "insert"),
    extraColumnLinks: remapExtraColumnLinks(state.extraColumnLinks, insertIndex, "insert"),
    history: remapHistory(state.history, insertIndex, "insert"),
  };
}

/**
 * Removes the column at `removeIndex` (pile discarded) and remaps column-indexed state and history.
 * Callers that merge a child pile onto its parent should do so before invoking this.
 */
export function removeColumnAt(state: GameState, removeIndex: number): GameState {
  assertValidRemoveIndex(state, removeIndex);
  const columns = state.columns.map((c) => [...c]);
  columns.splice(removeIndex, 1);

  return {
    ...state,
    columns,
    columnEffects: remapColumnKeyedRecord(state.columnEffects, removeIndex, "remove", removeIndex),
    columnFlags: remapColumnKeyedRecord(state.columnFlags, removeIndex, "remove", removeIndex),
    extraColumnLinks: remapExtraColumnLinks(
      state.extraColumnLinks,
      removeIndex,
      "remove",
      removeIndex,
    ),
    history: remapHistory(state.history, removeIndex, "remove", removeIndex),
  };
}

/** Shallow snapshot of topology fields for power-trigger undo (Phase 6). */
export type ExtraColumnTopologySnapshot = Pick<
  GameState,
  "columns" | "columnEffects" | "columnFlags" | "extraColumnLinks"
>;

export function snapshotExtraColumnTopology(state: GameState): ExtraColumnTopologySnapshot {
  return {
    columns: state.columns.map((c) => c.map((p) => ({ ...p }))),
    columnEffects: remapColumnEffectsSnapshot(state.columnEffects),
    columnFlags: { ...state.columnFlags },
    extraColumnLinks: state.extraColumnLinks.map((l) => ({ ...l })),
  };
}

export function restoreExtraColumnTopology(
  state: GameState,
  snapshot: ExtraColumnTopologySnapshot,
): GameState {
  return {
    ...state,
    columns: snapshot.columns.map((c) => c.map((p) => ({ ...p }))),
    columnEffects: remapColumnEffectsSnapshot(snapshot.columnEffects),
    columnFlags: { ...snapshot.columnFlags },
    extraColumnLinks: snapshot.extraColumnLinks.map((l) => ({ ...l })),
  };
}

function remapColumnEffectsSnapshot(
  columnEffects: Record<number, AppliedEffect[]>,
): Record<number, AppliedEffect[]> {
  const out: Record<number, AppliedEffect[]> = {};
  for (const [key, list] of Object.entries(columnEffects)) {
    out[Number(key)] = list.map((e) => ({ ...e }));
  }
  return out;
}
