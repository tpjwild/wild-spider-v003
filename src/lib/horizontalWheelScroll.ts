/**
 * Scrolls a horizontally overflowed element using the mouse wheel.
 * Uses deltaX when the device sends horizontal wheel (trackpad); otherwise maps deltaY.
 * @returns true when scroll position changed (caller may preventDefault).
 */
export function applyWheelAsHorizontalScroll(
  element: HTMLElement,
  deltaX: number,
  deltaY: number,
): boolean {
  const maxScroll = element.scrollWidth - element.clientWidth;
  if (maxScroll <= 0) return false;

  const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
  if (delta === 0) return false;

  const next = Math.max(0, Math.min(maxScroll, element.scrollLeft + delta));
  if (next === element.scrollLeft) return false;

  element.scrollLeft = next;
  return true;
}

/**
 * Attaches a non-passive `wheel` listener so horizontal scroll can call preventDefault
 * (React `onWheel` is passive and cannot block page scroll).
 */
export function bindHorizontalWheelScroll(element: HTMLElement): () => void {
  const onWheel = (e: WheelEvent) => {
    if (applyWheelAsHorizontalScroll(element, e.deltaX, e.deltaY)) {
      e.preventDefault();
    }
  };
  element.addEventListener("wheel", onWheel, { passive: false });
  return () => element.removeEventListener("wheel", onWheel);
}
