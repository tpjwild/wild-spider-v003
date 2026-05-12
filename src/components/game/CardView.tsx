"use client";

import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { cardDeckIndexForBack, isJoker, rankChar } from "@/engine/cards";
import type { JokerCard, PlacedCard, Suit } from "@/engine/types";
import { colors } from "@/constants/colors";
import { dimensions } from "@/constants/dimensions";

export type CardDisplayMode = "faceUp" | "faceDown" | "transparent";

const suitColor = (s: string) => (s === "H" || s === "D" ? "#c44" : "#111");

/** Matches {@link cardDeckIndexForBack}: deck 0 → black ink, deck 1 → red ink (with red card backs). */
function jokerCornerColor(card: JokerCard): string {
  return cardDeckIndexForBack(card) === 0 ? suitColor("S") : suitColor("H");
}

const SUIT_GLYPH: Record<Suit, string> = {
  C: "♣",
  D: "♦",
  H: "♥",
  S: "♠",
};

type CardViewProps = {
  placed: PlacedCard;
  /** Force transparent rendering (face-up + back overlay) per spec */
  displayMode?: CardDisplayMode;
  className?: string;
};

function modeFor(placed: PlacedCard, displayMode?: CardDisplayMode): CardDisplayMode {
  if (displayMode) return displayMode;
  if (!placed.faceUp) return "faceDown";
  return "faceUp";
}

export const CardView = forwardRef<
  HTMLDivElement,
  CardViewProps & Omit<HTMLAttributes<HTMLDivElement>, "color">
>(function CardView({ placed, displayMode: forcedMode, className = "", style, ...rest }, ref) {
    const mode = modeFor(placed, forcedMode);
    const w = dimensions.cardWidth;
    const h = dimensions.cardHeight;

    const base =
      "select-none rounded-md border border-zinc-600 shadow-sm flex flex-col items-center justify-center text-xs font-semibold";

    const backGradient =
      cardDeckIndexForBack(placed.card) === 0 ? colors.cardBackDeckOne : colors.cardBackDeckTwo;

    if (mode === "faceDown") {
      const downInk = isJoker(placed.card) ? jokerCornerColor(placed.card) : colors.textMuted;
      return (
        <div
          ref={ref}
          className={`${base} ${className}`}
          style={{
            width: w,
            height: h,
            background: backGradient,
            color: downInk,
            ...(style as CSSProperties),
          }}
          {...rest}
        >
          <span aria-hidden className="text-[24px] leading-none">
            🂠
          </span>
        </div>
      );
    }

    const c = placed.card;

    if (isJoker(c)) {
      const letters = ["J", "O", "K", "E", "R"] as const;
      const jokerInk = jokerCornerColor(c);
      return (
        <div
          ref={ref}
          aria-label="Joker"
          className={`select-none rounded-md border border-zinc-600 shadow-sm relative overflow-hidden bg-zinc-100 ${className}`}
          style={{
            width: w,
            height: h,
            ...(style as CSSProperties),
          }}
          {...rest}
        >
          <div
            className="absolute left-[4px] top-[4px] flex flex-col items-center text-[11px] font-bold leading-[0.95] tracking-wide"
            style={{ color: jokerInk }}
            aria-hidden
          >
            {letters.map((letter, i) => (
              <span key={`joker-tl-${i}`}>{letter}</span>
            ))}
          </div>
          <div
            className="absolute right-[4px] bottom-[4px] flex flex-col items-center text-[11px] font-bold leading-[0.95] tracking-wide"
            style={{
              color: jokerInk,
              transform: "rotate(180deg)",
              transformOrigin: "center",
            }}
            aria-hidden
          >
            {letters.map((letter, i) => (
              <span key={`joker-br-${i}`}>{letter}</span>
            ))}
          </div>
          {mode === "transparent" && (
            <div
              className="pointer-events-none absolute inset-0 rounded-md"
              style={{
                background: backGradient,
                opacity: 0.45,
              }}
              aria-hidden
            />
          )}
        </div>
      );
    }

    const color = suitColor(c.suit);
    const r = rankChar(c.rank);
    const g = SUIT_GLYPH[c.suit];

    return (
      <div
        ref={ref}
        className={`select-none rounded-md border border-zinc-600 shadow-sm relative overflow-hidden bg-zinc-100 ${className}`}
        style={{
          width: w,
          height: h,
          ...(style as CSSProperties),
        }}
        {...rest}
      >
        <span
          className="absolute left-[4px] top-[5px] text-[20px] font-bold leading-none tracking-tight"
          style={{ color }}
        >
          {r}
          <span className="ml-0.5 font-serif">{g}</span>
        </span>
        <div
          className="absolute right-[4px] bottom-[5px] text-[20px] font-bold leading-none tracking-tight"
          style={{ color, transform: "rotate(180deg)", transformOrigin: "center" }}
        >
          <span>
            {r}
            <span className="ml-px font-serif">{g}</span>
          </span>
        </div>
        {mode === "transparent" && (
          <div
            className="pointer-events-none absolute inset-0 rounded-md"
            style={{
              background: backGradient,
              opacity: 0.45,
            }}
            aria-hidden
          />
        )}
      </div>
    );
});
