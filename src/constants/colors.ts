/**
 * Central colour tokens for Wild Spider. Wire these into Tailwind via globals.css or theme extension.
 */

const billiardFelt = "#2f6f45";

export const colors = {
  /** Billiard-table felt — main play area */
  background: billiardFelt,
  /** Deck pairs list (`/decks`) — same felt as the game table; separate token so it can diverge later. */
  decksListViewBackground: billiardFelt,
  /** Stats row — darker than felt */
  gameBar: "#1d4d32",
  /** Title chrome — darker than game bar */
  titleBar: "#143824",
  surface: "#1a2332",
  accent: "#c9a227",
  text: "#e8e6e3",
  textMuted: "#8a9199",
  /** Face-down card back — first 52-card deck (ids 0–51). */
  cardBackDeckOne: "linear-gradient(145deg, #2a5a9e 0%, #0f2847 55%, #081830 100%)",
  /** Face-down card back — second 52-card deck (ids 52–103). */
  cardBackDeckTwo: "linear-gradient(145deg, #9e2a2a 0%, #471010 55%, #300808 100%)",
  /** Face area behind pip (A–10) SVG art — matches typical white card stock. */
  cardFacePip: "#ffffff",
  /** Scrim behind the Deck Popup while it is open. */
  deckPopupBackdrop: "rgba(8, 28, 16, 0.58)",
  /** Inner panel fill — Deck Popup (light green). */
  deckPopupPanelBackground: "#d8efd9",
  /** Scrim behind the Card Details popup (drawn above the Deck Popup). */
  cardDetailsPopupBackdrop: "rgba(8, 28, 16, 0.42)",
  /** Inner panel fill — Card Details popup (light green). */
  cardDetailsPopupPanelBackground: "#d5ebd7",
  /** Border around light-green popup panels (Deck + Card Details). */
  popupLightPanelBorder: "#9cb89f",
  /** Main title / heading text on light-green popup panels. */
  popupLightPanelTitleText: "#132a1a",
  /** Section labels and muted text on light-green popup panels. */
  popupLightPanelMutedText: "#3d5c44",
  /** Horizontal rules between header / body / footer on light-green popup panels. */
  popupLightPanelDivider: "rgba(19, 42, 26, 0.18)",
  /** Body / paragraph text on light-green popup panels (Card Details). */
  popupLightPanelBodyText: "#2a4530",
  /** Tint behind the large card image in Card Details (on light panel). */
  cardDetailsPopupImageWellBackground: "rgba(255, 255, 255, 0.5)",
  /** Close button fill on light-green popup panels. */
  popupLightCloseButtonBackground: "#234d30",
  /** Close button border. */
  popupLightCloseButtonBorder: "#163220",
  /** Close button label colour. */
  popupLightCloseButtonText: "#ecf8ee",
} as const;

export type ColorToken = keyof typeof colors;
