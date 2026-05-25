"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { TableauNamePlateSource } from "@/lib/tableauNamePlate";

export type TableauInspectContextValue = {
  hoverTarget: TableauNamePlateSource | null;
  setHoverTarget: (target: TableauNamePlateSource | null) => void;
  /** While dragging a tableau run — set by {@link GameShell}. */
  dragTarget: TableauNamePlateSource | null;
  /** Pinned while Card details is open for a tableau card. */
  pinnedTarget: TableauNamePlateSource | null;
  setPinnedTarget: (target: TableauNamePlateSource | null) => void;
};

const TableauInspectContext = createContext<TableauInspectContextValue | null>(null);

export function TableauInspectProvider({
  children,
  dragTarget = null,
}: {
  children: ReactNode;
  dragTarget?: TableauNamePlateSource | null;
}) {
  const [hoverTarget, setHoverTarget] = useState<TableauNamePlateSource | null>(null);
  const [pinnedTarget, setPinnedTarget] = useState<TableauNamePlateSource | null>(null);

  const value = useMemo(
    (): TableauInspectContextValue => ({
      hoverTarget,
      setHoverTarget,
      dragTarget,
      pinnedTarget,
      setPinnedTarget,
    }),
    [hoverTarget, dragTarget, pinnedTarget],
  );

  return (
    <TableauInspectContext.Provider value={value}>{children}</TableauInspectContext.Provider>
  );
}

export function useTableauInspect(): TableauInspectContextValue {
  const ctx = useContext(TableauInspectContext);
  if (!ctx) {
    throw new Error("useTableauInspect must be used within TableauInspectProvider");
  }
  return ctx;
}

/** Active inspect source: drag, then pinned details, then pointer hover. */
export function useActiveTableauInspectSource(): TableauNamePlateSource | null {
  const { hoverTarget, dragTarget, pinnedTarget } = useTableauInspect();
  return dragTarget ?? pinnedTarget ?? hoverTarget;
}

export function useSetTableauInspectHover(): (target: TableauNamePlateSource | null) => void {
  const { setHoverTarget, dragTarget } = useTableauInspect();
  return useCallback(
    (target: TableauNamePlateSource | null) => {
      if (dragTarget != null) return;
      setHoverTarget(target);
    },
    [dragTarget, setHoverTarget],
  );
}
