import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  measureTableauStackFlight,
  tableauStackAnchorScreenPoint,
} from "@/lib/tableauDragReturnFlight";
import type { PlacedCard } from "@/engine/types";

const placed = (id: number): PlacedCard => ({
  card: { kind: "regular", id, suit: "S", rank: 5 },
  faceUp: true,
});

describe("tableauDragReturnFlight", () => {
  let stacks: Map<number, HTMLElement>;

  beforeEach(() => {
    stacks = new Map();
    for (const col of [0, 1]) {
      const stack = document.createElement("div");
      stack.dataset.tableauStack = String(col);
      stack.getBoundingClientRect = () =>
        ({
          left: col * 100,
          top: 200,
          width: 70,
          height: 400,
          right: col * 100 + 70,
          bottom: 600,
        }) as DOMRect;
      document.body.appendChild(stack);
      stacks.set(col, stack);
    }
  });

  afterEach(() => {
    for (const el of stacks.values()) el.remove();
  });

  it("measureTableauStackFlight returns delta between two column anchors", () => {
    const col0: PlacedCard[] = [placed(0), placed(1)];
    const col1: PlacedCard[] = [placed(2)];

    const flight = measureTableauStackFlight(1, 0, col1, 0, 1, col0, [placed(2)]);
    expect(flight).not.toBeNull();
    expect(flight!.originX).toBe(100);
    expect(flight!.deltaX).toBe(-100);
    expect(flight!.columnIndex).toBe(0);
    expect(flight!.anchorIndex).toBe(1);
  });

  it("tableauStackAnchorScreenPoint returns null without a stack element", () => {
    expect(tableauStackAnchorScreenPoint(9, 0, [])).toBeNull();
  });
});
