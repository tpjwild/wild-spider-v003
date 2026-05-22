"use client";

import { useEffect, useState } from "react";

function isTextEntryElement(el: HTMLElement): boolean {
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

function shouldIgnoreShiftForInspect(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (isTextEntryElement(target)) return true;
  if (target.closest('[aria-modal="true"]')) return true;
  return false;
}

/** Tracks Shift held for in-game card inspect; optional callback when Shift pressed during power targeting. */
export function useShiftInspectMode(onShiftDownWhileTargeting?: () => void) {
  const [shiftInspectMode, setShiftInspectMode] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Shift" || e.repeat) return;
      if (shouldIgnoreShiftForInspect(e.target)) return;
      setShiftInspectMode(true);
      onShiftDownWhileTargeting?.();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key !== "Shift") return;
      setShiftInspectMode(false);
    };

    const clear = () => setShiftInspectMode(false);

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("blur", clear);
    };
  }, [onShiftDownWhileTargeting]);

  return shiftInspectMode;
}
