"use client";

import { useEffect } from "react";

/** Deck/Stock bar buttons (below the overlay when the scrim is pass-through). */
export const GAME_BAR_POPUP_HOVER_KEEP_OPEN_SELECTOR =
  '[data-testid="deck-popup-open"], [data-testid="stock-popup-open"]';

export function shouldKeepPowerTargetPopupOpen(element: Element | null): boolean {
  if (!element) return false;
  if (element.closest(GAME_BAR_POPUP_HOVER_KEEP_OPEN_SELECTOR) != null) return true;
  return false;
}

/** True when the pointer left `overlay` for an element outside it (not into a child). */
export function pointerLeftPopupOverlay(
  e: React.PointerEvent<HTMLElement>,
): boolean {
  const related = e.relatedTarget;
  if (related instanceof Node && e.currentTarget.contains(related)) return false;
  return true;
}

/** Close deck/stock popup on hover outside the overlay without canceling targeting. */
export function usePowerTargetPopupHoverDismiss({
  enabled,
  popupTestId,
  onClose,
}: {
  enabled: boolean;
  /** `data-testid` on the popup root (`deck-popup` or `stock-popup`). */
  popupTestId: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!enabled) return;
    const rootSelector = `[data-testid="${popupTestId}"]`;
    const onPointerMove = (e: PointerEvent) => {
      const under = document.elementFromPoint(e.clientX, e.clientY);
      if (!under) return;
      if (under.closest(rootSelector)) return;
      if (shouldKeepPowerTargetPopupOpen(under)) return;
      onClose();
    };
    document.addEventListener("pointermove", onPointerMove);
    return () => document.removeEventListener("pointermove", onPointerMove);
  }, [enabled, onClose, popupTestId]);
}
