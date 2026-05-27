import type { PointerEvent } from "react";
import { describe, expect, it } from "vitest";
import {
  pointerLeftPopupOverlay,
  shouldKeepPowerTargetPopupOpen,
} from "@/lib/powerTargetPopupUi";

describe("powerTargetPopupUi", () => {
  it("pointerLeftPopupOverlay is false when moving into a child", () => {
    const parent = document.createElement("div");
    const child = document.createElement("span");
    parent.appendChild(child);
    const left = pointerLeftPopupOverlay({
      currentTarget: parent,
      relatedTarget: child,
    } as PointerEvent<HTMLElement>);
    expect(left).toBe(false);
  });

  it("pointerLeftPopupOverlay is true when leaving for outside", () => {
    const parent = document.createElement("div");
    const outside = document.createElement("div");
    document.body.append(parent, outside);
    const left = pointerLeftPopupOverlay({
      currentTarget: parent,
      relatedTarget: outside,
    } as PointerEvent<HTMLElement>);
    expect(left).toBe(true);
  });

  it("shouldKeepPowerTargetPopupOpen is true on deck/stock bar buttons", () => {
    const deckBtn = document.createElement("button");
    deckBtn.setAttribute("data-testid", "deck-popup-open");
    document.body.append(deckBtn);
    expect(shouldKeepPowerTargetPopupOpen(deckBtn)).toBe(true);
    deckBtn.remove();
  });

  it("shouldKeepPowerTargetPopupOpen is false elsewhere", () => {
    const div = document.createElement("div");
    expect(shouldKeepPowerTargetPopupOpen(div)).toBe(false);
  });

  it("popup root contains scrim for hover-dismiss keep-open", () => {
    const root = document.createElement("div");
    root.setAttribute("data-testid", "deck-popup");
    const scrim = document.createElement("div");
    root.append(scrim);
    document.body.append(root);
    expect(scrim.closest('[data-testid="deck-popup"]')).toBe(root);
    root.remove();
  });
});
