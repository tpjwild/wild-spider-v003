import type { ColumnFlagsEntry, ExtraColumnLink, GameState } from "@/engine/types";

export function emptyExtraColumnState(): Pick<GameState, "extraColumnLinks" | "columnFlags"> {
  return { extraColumnLinks: [], columnFlags: {} };
}

type ExtraColumnPersistedRaw = Partial<Pick<GameState, "extraColumnLinks" | "columnFlags">> & {
  /** Renamed from `bonusColumnLinks` (Phase 1). */
  bonusColumnLinks?: unknown;
};

function isExtraChildFlag(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const v = value as { isExtraChild?: boolean; isBonusChild?: boolean };
  return v.isExtraChild === true || v.isBonusChild === true;
}

/** Fills extra-column fields missing from older persisted saves. */
export function normalizeExtraColumnState(
  raw: ExtraColumnPersistedRaw,
): Pick<GameState, "extraColumnLinks" | "columnFlags"> {
  const extraColumnLinks: ExtraColumnLink[] = [];
  const linksRaw = raw.extraColumnLinks ?? raw.bonusColumnLinks;
  if (Array.isArray(linksRaw)) {
    for (const item of linksRaw) {
      if (
        item &&
        typeof item === "object" &&
        typeof item.parentColumnIndex === "number" &&
        typeof item.movesRemaining === "number" &&
        Number.isInteger(item.parentColumnIndex) &&
        item.parentColumnIndex >= 0 &&
        Number.isInteger(item.movesRemaining) &&
        item.movesRemaining > 0
      ) {
        extraColumnLinks.push({
          parentColumnIndex: item.parentColumnIndex,
          movesRemaining: item.movesRemaining,
        });
      }
    }
  }

  const columnFlags: Record<number, ColumnFlagsEntry> = {};
  if (raw.columnFlags && typeof raw.columnFlags === "object") {
    for (const [key, value] of Object.entries(raw.columnFlags)) {
      const idx = Number(key);
      if (Number.isInteger(idx) && idx >= 0 && isExtraChildFlag(value)) {
        columnFlags[idx] = { isExtraChild: true };
      }
    }
  }

  return { extraColumnLinks, columnFlags };
}
