import { isRegular } from "@/engine/cards";
import type { Card, GameState, PlacedCard, RegularCard } from "@/engine/types";
import { cardHasTransparentEffectInColumn } from "@/lib/cardEffectsUi";
import { deckNumFromRegularCardId } from "@/lib/deckCardArt";
import type { TableauNamePlateSource } from "@/lib/tableauNamePlate";
import type { FoundationIndex } from "@/engine/types";

/** Ring shown on shelf/tableau cards inspectable while Shift is held. */
export const CARD_INSPECT_HIGHLIGHT_CLASS =
  "ring-2 ring-sky-300 ring-offset-1 ring-offset-black/40";

/** Name-plate inspect on pip / non-court cards. */
export const NAME_PLATE_INSPECT_HIGHLIGHT_CLASS =
  "ring-2 ring-yellow-600 ring-offset-1 ring-offset-black/40";

/** Name-plate inspect on courts (J/Q/K) and other cards in the same set. */
export const NAME_PLATE_INSPECT_FACE_CARD_HIGHLIGHT_CLASS =
  "ring-2 ring-yellow-300 ring-offset-1 ring-offset-black/40";

export type NamePlateInspectHighlight = "none" | "pip" | "face";

export function isCourtCard(card: Card): card is RegularCard {
  return isRegular(card) && card.rank >= 11 && card.rank <= 13;
}

/** Same set = same deck (1/2) and suit — the three courts that can align. */
export function courtSetKey(card: RegularCard): string {
  return `${deckNumFromRegularCardId(card.id)}-${card.suit}`;
}

function tableauCardEligibleForCourtInspectRing(
  game: GameState,
  columnIndex: number,
  placed: PlacedCard,
): boolean {
  return (
    placed.faceUp ||
    cardHasTransparentEffectInColumn(game, columnIndex, placed.card)
  );
}

function activeInspectCourtCard(
  game: GameState,
  source: TableauNamePlateSource | null,
): RegularCard | null {
  if (source?.kind !== "card") return null;
  const placed = game.columns[source.columnIndex]?.[source.cardIndex];
  if (!placed || !isCourtCard(placed.card)) return null;
  if (!tableauCardEligibleForCourtInspectRing(game, source.columnIndex, placed)) return null;
  return placed.card;
}

/**
 * Yellow name-plate ring tier for a tableau card (direct hover/drag/pin or set-mate spillover).
 */
export function namePlateInspectHighlightForTableauCard(
  game: GameState,
  source: TableauNamePlateSource | null,
  columnIndex: number,
  cardIndex: number,
  placed: PlacedCard,
): NamePlateInspectHighlight {
  if (!source || source.kind !== "card") return "none";

  const isDirect =
    source.columnIndex === columnIndex && source.cardIndex === cardIndex;

  if (isDirect) {
    if (
      isCourtCard(placed.card) &&
      tableauCardEligibleForCourtInspectRing(game, columnIndex, placed)
    ) {
      return "face";
    }
    return "pip";
  }

  const anchor = activeInspectCourtCard(game, source);
  if (!anchor || !isCourtCard(placed.card)) return "none";
  if (courtSetKey(anchor) !== courtSetKey(placed.card)) return "none";
  if (!tableauCardEligibleForCourtInspectRing(game, columnIndex, placed)) return "none";
  return "face";
}

export function namePlateInspectHighlightClass(tier: NamePlateInspectHighlight): string {
  if (tier === "face") return NAME_PLATE_INSPECT_FACE_CARD_HIGHLIGHT_CLASS;
  if (tier === "pip") return NAME_PLATE_INSPECT_HIGHLIGHT_CLASS;
  return "";
}

export function isTableauNamePlateCardSource(
  source: TableauNamePlateSource | null,
  columnIndex: number,
  cardIndex: number,
): boolean {
  return (
    source?.kind === "card" &&
    source.columnIndex === columnIndex &&
    source.cardIndex === cardIndex
  );
}

export function isTableauNamePlateFoundationSource(
  source: TableauNamePlateSource | null,
  foundationIndex: FoundationIndex,
): boolean {
  return source?.kind === "foundation" && source.foundationIndex === foundationIndex;
}

export function isTableauNamePlateColumnHolderSource(
  source: TableauNamePlateSource | null,
  columnIndex: number,
): boolean {
  return source?.kind === "columnHolder" && source.columnIndex === columnIndex;
}

/** Foundation top-card inspect ring (no set spillover on foundation row). */
export function namePlateInspectHighlightForFoundationCard(
  source: TableauNamePlateSource | null,
  foundationIndex: FoundationIndex,
  card: Card,
): NamePlateInspectHighlight {
  if (!isTableauNamePlateFoundationSource(source, foundationIndex)) return "none";
  return isCourtCard(card) ? "face" : "pip";
}
