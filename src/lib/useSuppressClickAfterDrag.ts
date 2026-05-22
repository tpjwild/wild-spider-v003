"use client";

import { useDndMonitor } from "@dnd-kit/core";
import { useCallback, useRef } from "react";

/** After a tableau drag that actually moved, ignore the following click so details do not open on drop. */
export function useSuppressClickAfterDrag(draggableId: string) {
  const suppressRef = useRef(false);
  const movedRef = useRef(false);

  useDndMonitor({
    onDragStart(event) {
      if (event.active.id !== draggableId) return;
      movedRef.current = false;
    },
    onDragMove(event) {
      if (event.active.id !== draggableId) return;
      movedRef.current = true;
    },
    onDragEnd(event) {
      if (event.active.id !== draggableId) return;
      if (!movedRef.current) return;
      suppressRef.current = true;
      window.setTimeout(() => {
        suppressRef.current = false;
      }, 0);
    },
    onDragCancel(event) {
      if (event.active.id !== draggableId) return;
      if (!movedRef.current) return;
      suppressRef.current = true;
      window.setTimeout(() => {
        suppressRef.current = false;
      }, 0);
    },
  });

  return useCallback(() => !suppressRef.current, []);
}
