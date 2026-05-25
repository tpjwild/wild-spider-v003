"use client";

import { useEffect } from "react";
import { useActiveTableauDragId } from "@/components/game/TableauDragOverlayContext";
import {
  useActiveTableauInspectSource,
  useTableauInspect,
} from "@/components/game/TableauInspectContext";
import { FoundationNamePlate } from "@/components/game/FoundationNamePlate";
import type { Card, GameState } from "@/engine/types";
import {
  tableauInspectSourceForCard,
  tableauNamePlateForSource,
  type TableauNamePlateModel,
  type TableauNamePlateSource,
} from "@/lib/tableauNamePlate";

/** Syncs shift-inspect pin and clears pointer hover when a tableau drag starts. */
export function TableauInspectController({
  game,
  detailsCard,
}: {
  game: GameState | null;
  detailsCard: Card | null;
}) {
  const { setPinnedTarget, setHoverTarget } = useTableauInspect();
  const activeTableauDragId = useActiveTableauDragId();

  useEffect(() => {
    if (!game || !detailsCard) {
      setPinnedTarget(null);
      return;
    }
    setPinnedTarget(tableauInspectSourceForCard(game, detailsCard));
  }, [game, detailsCard, setPinnedTarget]);

  useEffect(() => {
    if (activeTableauDragId) setHoverTarget(null);
  }, [activeTableauDragId, setHoverTarget]);

  return null;
}

export function FoundationInspectNamePlate({
  game,
  dragInspectTarget,
}: {
  game: GameState | null;
  dragInspectTarget: TableauNamePlateSource | null;
}) {
  const hoverOrPinned = useActiveTableauInspectSource();
  const source = dragInspectTarget ?? hoverOrPinned;
  let model: TableauNamePlateModel | null = null;
  if (game && source) {
    model = tableauNamePlateForSource(game, source);
  }
  return <FoundationNamePlate model={model} />;
}
