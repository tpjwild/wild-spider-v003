/**
 * Wild Spider — single source of truth for game UI colours.
 * Use these tokens in components (`style` / `colors.*`) rather than hard-coded hex in TSX.
 * Shelf and deck/stock popup scrollbar CSS in `globals.css` reads `--ws-*` variables
 * (game shell root and/or popup panel via {@link deckPopupScrollCssVariables}).
 */

import { dimensions } from "@/constants/dimensions";

const billiardFelt = "#2f6f45";

/** CSS custom properties injected on the game shell (see `GameShell`). */
export const gameCssVariables = {
  "--ws-shelf-scrollbar-thumb": "#b8e6bc",
  "--ws-shelf-scrollbar-thumb-hover": "#d8efd9",
  "--ws-shelf-scrollbar-track": "rgba(0, 0, 0, 0.3)",
  "--ws-shelf-scrollbar-size": `${dimensions.shelfHorizontalScrollbarPx}px`,
} as const;

export const colors = {
  // —— Table & shell ——————————————————————————————————————————————————————————
  /** Billiard-table felt — main play area */
  background: billiardFelt,
  /** Deck pairs list (`/decks`) — same felt as the game table */
  decksListViewBackground: billiardFelt,
  /** Stats row — darker than felt */
  gameBar: "#1d4d32",
  /** Title chrome — darker than game bar */
  titleBar: "#143824",
  /** Power targeting cursor fill */
  powerTargetInvalidCursor: "#143824",
  /** Power targeting cursor ring and crosshairs */
  powerTargetCursorRing: "#ffffff",
  /** Generic dark surface (legacy / misc) */
  surface: "#1a2332",
  accent: "#c9a227",
  /** Default body text on felt */
  text: "#e8e6e3",
  textMuted: "#8a9199",
  /** Sticky header shadow on play area */
  playAreaHeaderShadow: "rgba(0, 0, 0, 0.28)",

  // —— Chrome text & controls (emerald on green felt) —————————————————————————
  chromeTextPrimary: "#ecfdf5",
  chromeTextSecondary: "rgba(236, 253, 245, 0.85)",
  chromeTextMuted: "rgba(236, 253, 245, 0.8)",
  chromeTextSoft: "rgba(167, 243, 208, 0.9)",
  chromeTextDisabled: "rgba(167, 243, 208, 0.4)",
  chromeTextSeedDeferred: "rgba(167, 243, 208, 0.5)",
  chromeHoverOverlay: "rgba(255, 255, 255, 0.1)",
  chromeBorderSubtle: "rgba(0, 0, 0, 0.2)",
  chromeBorderMedium: "rgba(0, 0, 0, 0.25)",
  gameBarButtonBorderEnabled: "rgba(6, 95, 70, 0.6)",
  gameBarButtonBorderDisabled: "rgba(6, 78, 59, 0.4)",
  gameBarButtonHover: "rgba(2, 44, 34, 0.4)",

  // —— Cards ——————————————————————————————————————————————————————————————————
  /** Fallback gradient when the back bitmap is missing — blue deck. */
  cardBackBlue: "linear-gradient(145deg, #2a5a9e 0%, #0f2847 55%, #081830 100%)",
  /** Fallback gradient when the back bitmap is missing — red deck. */
  cardBackRed: "linear-gradient(145deg, #9e2a2a 0%, #471010 55%, #300808 100%)",
  /** @deprecated Use {@link cardBackBlue} / {@link cardBackRed} via deck {@link DeckBackColor}. */
  cardBackDeckOne: "linear-gradient(145deg, #2a5a9e 0%, #0f2847 55%, #081830 100%)",
  /** @deprecated Use {@link cardBackBlue} / {@link cardBackRed} via deck {@link DeckBackColor}. */
  cardBackDeckTwo: "linear-gradient(145deg, #9e2a2a 0%, #471010 55%, #300808 100%)",
  cardFacePip: "#ffffff",
  cardFaceBackground: "#f4f4f5",
  cardBorder: "rgba(82, 82, 91, 0.8)",
  cardBorderSolid: "#52525b",
  cardShadow: "rgba(0, 0, 0, 0.1)",
  cardSuitRed: "#cc4444",
  cardSuitBlack: "#111111",
  tableauColumnOutline: "rgba(255, 255, 255, 0.8)",
  foundationEmptyOutline: "rgba(255, 255, 255, 0.6)",

  // —— Popups (deck / stock / catalog — light green panels) ———————————————————
  deckPopupBackdrop: "rgba(8, 28, 16, 0.58)",
  deckPopupPanelBackground: "#d8efd9",
  cardDetailsPopupBackdrop: "rgba(8, 28, 16, 0.42)",
  cardDetailsPopupPanelBackground: "#d5ebd7",
  popupLightPanelBorder: "#9cb89f",
  popupLightPanelTitleText: "#132a1a",
  popupLightPanelMutedText: "#3d5c44",
  popupLightPanelDivider: "rgba(19, 42, 26, 0.18)",
  popupLightPanelBodyText: "#2a4530",
  cardDetailsPopupImageWellBackground: "rgba(255, 255, 255, 0.5)",
  popupLightCloseButtonBackground: "#234d30",
  popupLightCloseButtonBorder: "#163220",
  popupLightCloseButtonText: "#ecf8ee",

  // —— Dark dialogs (new game, end game, actions confirm) —————————————————————
  dialogBackground: "#18181b",
  dialogBorder: "rgba(255, 255, 255, 0.15)",
  dialogTitleText: "#f4f4f5",
  dialogBodyText: "#d4d4d8",
  dialogMutedText: "#71717a",
  dialogLabelText: "#a1a1aa",
  dialogInputBackground: "rgba(0, 0, 0, 0.4)",
  dialogInputBorder: "rgba(255, 255, 255, 0.2)",
  dialogSecondaryButtonBorder: "rgba(255, 255, 255, 0.2)",
  dialogSecondaryButtonText: "#d4d4d8",
  dialogSecondaryButtonHover: "rgba(255, 255, 255, 0.05)",
  dialogPrimaryButtonBackground: "#065f46",
  dialogPrimaryButtonHover: "#047857",
  dialogPrimaryButtonText: "#ffffff",
  dialogDangerButtonBackground: "rgba(127, 29, 29, 0.8)",
  dialogDangerButtonHover: "#991b1b",
  dialogAccentButtonBackground: "#d97706",
  dialogAccentButtonHover: "#f59e0b",
  dialogAccentButtonText: "#000000",
  actionsMenuBackground: "#18181b",
  actionsMenuBorder: "rgba(255, 255, 255, 0.15)",
  actionsMenuShortcutText: "#71717a",
  actionsMenuItemDisabled: "#52525b",

  // —— Shelf ——————————————————————————————————————————————————————————————————
  shelfPanelBackground: "rgba(0, 0, 0, 0.3)",
  shelfPanelBorder: "rgba(255, 255, 255, 0.2)",
  shelfNamePlateBackground: "rgba(0, 0, 0, 0.45)",
  foundationNamePlateBackground: "rgba(0, 0, 0, 0.45)",
  shelfDepletedCardWash: "rgba(235, 240, 245, 0.62)",
  shelfScrollbarThumb: gameCssVariables["--ws-shelf-scrollbar-thumb"],
  shelfScrollbarThumbHover: gameCssVariables["--ws-shelf-scrollbar-thumb-hover"],
  shelfScrollbarTrack: gameCssVariables["--ws-shelf-scrollbar-track"],
  shelfChargeBadgeBackground: "rgba(24, 24, 27, 0.9)",
  shelfChargeBadgeText: "#fef3c7",
  shelfChargeBadgeRing: "rgba(245, 158, 11, 0.5)",
  shelfChargeBadgeDepletedBackground: "rgba(39, 39, 42, 0.9)",
  shelfChargeBadgeDepletedText: "#71717a",
  shelfChargeBadgeDepletedRing: "rgba(82, 82, 91, 0.6)",

  // —— Effect badges ———————————————————————————————————————————————————————————
  effectBadgeChipBackground: "rgba(24, 24, 27, 0.92)",
  /** Lighter chip for column-scoped badges (holder + inherited on cards). */
  effectBadgeColumnChipBackground: "rgba(82, 82, 91, 0.94)",
  effectBadgeIconFill: "#fafafa",
  effectBadgeCardScopeRing: "rgba(251, 191, 36, 0.8)",
  /** Column scope — light ring on lighter chip */
  effectBadgeColumnScopeRing: "rgba(255, 255, 255, 0.95)",
  effectBadgeCountBackground: "rgba(24, 24, 27, 0.85)",
  effectBadgeCountText: "rgba(253, 230, 138, 0.95)",
  effectBadgeCountRing: "rgba(245, 158, 11, 0.4)",

  /** Extra-child column badge holder — lighter green strip (see Extra Column in spec). */
  tableauExtraChildBadgeHolderBackground: "rgba(167, 243, 208, 0.32)",
  tableauExtraChildBadgeHolderBorder: "rgba(134, 239, 172, 0.65)",

  // —— Power targeting & drag feedback ———————————————————————————————————————
  powerTargetRing: "#fbbf24",
  powerTargetRingOffset: "rgba(0, 0, 0, 0.3)",
  powerTargetFill: "rgba(245, 158, 11, 0.2)",
  dragColumnHighlight: "rgba(245, 158, 11, 0.1)",
  popupCellRingOffset: "rgba(24, 24, 27, 0.8)",

  // —— Cloud / loading —————————————————————————————————————————————————————————
  cloudBusySpinnerTrack: "rgba(16, 185, 129, 0.25)",
  cloudBusySpinnerHead: "#34d399",
  cloudBusyLabelText: "#d4d4d8",

  // —— App shell (pre-game / loading) —————————————————————————————————————————
  appLoadingBackground: "#0f1419",
  appLoadingText: "#a1a1aa",
} as const;

export type ColorToken = keyof typeof colors;

/** CSS vars for `.deck-popup-scroll` (track matches {@link colors.deckPopupPanelBackground}). */
export function deckPopupScrollCssVariables(): Record<string, string> {
  return {
    "--ws-deck-popup-scrollbar-track": colors.deckPopupPanelBackground,
    "--ws-deck-popup-scrollbar-thumb": colors.popupLightPanelBorder,
    "--ws-deck-popup-scrollbar-thumb-hover": colors.popupLightPanelMutedText,
  };
}

/** Inline style map for `GameShell` root — sets `--ws-*` for global CSS. */
export function gameShellColorStyle(): Record<string, string> {
  return {
    "--bg": colors.background,
    "--fg": colors.text,
    ...gameCssVariables,
    ...deckPopupScrollCssVariables(),
  };
}
