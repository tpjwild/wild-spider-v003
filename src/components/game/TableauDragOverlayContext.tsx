"use client";

import { createContext, useContext } from "react";

export type TableauDragOverlayContextValue = {
  /**
   * `t-{column}-{cardIndex}` for the card that owns the current tableau drag.
   * While set, only that card keeps `useDraggable`; others render without dnd-kit subscriptions.
   */
  activeTableauDragId: string | null;
  /**
   * While set, that tableau column is painted above its flex siblings so shared-layout
   * return after an invalid drop/cancel does not slide under columns to the right.
   */
  layoutBoostColumn: number | null;
  /**
   * When true, tableau column droppables stretch to the bottom of `[data-tableau-scroll-pane]`;
   * when false, min-height follows the card stack only.
   */
  applyTableauDropViewportFloorMinHeight: boolean;
  /**
   * Viewport Y of `[data-tableau-scroll-pane]` bottom (from a single shared measure in `GameShell`).
   * Columns compute `minHeight` as this minus their droppable top.
   */
  tableauDropFloorBottomPx: number | null;
};

const defaultValue: TableauDragOverlayContextValue = {
  activeTableauDragId: null,
  layoutBoostColumn: null,
  applyTableauDropViewportFloorMinHeight: false,
  tableauDropFloorBottomPx: null,
};

export const TableauDragOverlayContext = createContext<TableauDragOverlayContextValue>(defaultValue);

export function useActiveTableauDragId(): string | null {
  return useContext(TableauDragOverlayContext).activeTableauDragId;
}

export function useTableauLayoutBoostColumn(): number | null {
  return useContext(TableauDragOverlayContext).layoutBoostColumn;
}

export function useApplyTableauDropViewportFloorMinHeight(): boolean {
  return useContext(TableauDragOverlayContext).applyTableauDropViewportFloorMinHeight;
}

export function useTableauDropFloorBottomPx(): number | null {
  return useContext(TableauDragOverlayContext).tableauDropFloorBottomPx;
}
