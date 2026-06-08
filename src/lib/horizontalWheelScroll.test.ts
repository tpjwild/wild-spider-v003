import { describe, expect, it, vi } from "vitest";
import {
  applyWheelAsHorizontalScroll,
  bindHorizontalWheelScroll,
} from "@/lib/horizontalWheelScroll";

describe("applyWheelAsHorizontalScroll", () => {
  it("maps deltaY to scrollLeft when content overflows horizontally", () => {
    const el = document.createElement("div");
    Object.defineProperty(el, "scrollWidth", { value: 400, configurable: true });
    Object.defineProperty(el, "clientWidth", { value: 200, configurable: true });
    el.scrollLeft = 0;

    expect(applyWheelAsHorizontalScroll(el, 0, 40)).toBe(true);
    expect(el.scrollLeft).toBe(40);
  });

  it("prefers deltaX when larger than deltaY", () => {
    const el = document.createElement("div");
    Object.defineProperty(el, "scrollWidth", { value: 300, configurable: true });
    Object.defineProperty(el, "clientWidth", { value: 100, configurable: true });
    el.scrollLeft = 0;

    expect(applyWheelAsHorizontalScroll(el, 100, 25)).toBe(true);
    expect(el.scrollLeft).toBe(100);
  });

  it("returns false when there is no horizontal overflow", () => {
    const el = document.createElement("div");
    Object.defineProperty(el, "scrollWidth", { value: 100, configurable: true });
    Object.defineProperty(el, "clientWidth", { value: 100, configurable: true });

    expect(applyWheelAsHorizontalScroll(el, 0, 40)).toBe(false);
    expect(el.scrollLeft).toBe(0);
  });

  it("binds a non-passive wheel listener and preventDefaults on scroll", () => {
    const el = document.createElement("div");
    Object.defineProperty(el, "scrollWidth", { value: 400, configurable: true });
    Object.defineProperty(el, "clientWidth", { value: 200, configurable: true });
    el.scrollLeft = 0;
    const addSpy = vi.spyOn(el, "addEventListener");

    bindHorizontalWheelScroll(el);
    expect(addSpy).toHaveBeenCalledWith("wheel", expect.any(Function), {
      passive: false,
    });

    const handler = addSpy.mock.calls[0][1] as (e: WheelEvent) => void;
    const event = new WheelEvent("wheel", { deltaY: 40, cancelable: true });
    const preventDefault = vi.spyOn(event, "preventDefault");
    handler(event);
    expect(el.scrollLeft).toBe(40);
    expect(preventDefault).toHaveBeenCalled();
  });

  it("returns false at scroll end without changing position", () => {
    const el = document.createElement("div");
    Object.defineProperty(el, "scrollWidth", { value: 200, configurable: true });
    Object.defineProperty(el, "clientWidth", { value: 100, configurable: true });
    el.scrollLeft = 100;

    expect(applyWheelAsHorizontalScroll(el, 0, 50)).toBe(false);
    expect(el.scrollLeft).toBe(100);
  });
});
