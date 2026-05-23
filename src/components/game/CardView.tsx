"use client";

import { forwardRef, useCallback, useState, type CSSProperties, type HTMLAttributes } from "react";
import { OptionalCardBackImage } from "@/components/game/OptionalCardBackImage";
import { OptionalPortraitFrameArt } from "@/components/game/OptionalPortraitFrameArt";
import { colors } from "@/constants/colors";
import { DEFAULT_DECK_PAIR_ID } from "@/content/deckPairs";
import { dimensions } from "@/constants/dimensions";
import { cardDeckIndexForBack, isJoker, isRegular, rankChar } from "@/engine/cards";
import type { Card, JokerCard, PlacedCard, Suit } from "@/engine/types";
import {
  faceArtForRegularCard,
  faceDownBackPathForCard,
  jokerArtForCard,
} from "@/lib/deckCardArt";
import { useGameStore } from "@/state/gameStore";

export type CardDisplayMode = "faceUp" | "faceDown" | "deckPopupFaceDown";

const suitColor = (s: string) =>
  s === "H" || s === "D" ? colors.cardSuitRed : colors.cardSuitBlack;

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

/** In-game face-up: show the card back until portrait art is decoded (avoids white/zinc flash). */
function FaceUpBackUntilPortraitReady({
  card,
  portraitReady,
}: {
  card: Card;
  portraitReady: boolean;
}) {
  if (portraitReady) return null;
  const backSrc = faceDownBackPathForCard(card);
  const backGradient =
    cardDeckIndexForBack(card) === 0 ? colors.cardBackDeckOne : colors.cardBackDeckTwo;
  return (
    <div className="pointer-events-none absolute inset-0 z-[30] overflow-hidden rounded-md" aria-hidden>
      <div className="absolute inset-0" style={{ background: backGradient }} />
      <OptionalCardBackImage
        src={backSrc}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}

/** Face-down cell: full face with the standard card-back bitmap at the given opacity (0–1). */
function DeckPopupFaceDownBackOverlay({
  card,
  opacity,
}: {
  card: Card;
  opacity: number;
}) {
  const backSrc = faceDownBackPathForCard(card);
  const o = opacity;
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[30] overflow-hidden rounded-md"
      aria-hidden
    >
      <OptionalCardBackImage
        src={backSrc}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: o }}
      />
    </div>
  );
}

type CardViewProps = {
  placed: PlacedCard;
  /** Override face rendering: `deckPopupFaceDown` = face art + semi-transparent back on top. */
  displayMode?: CardDisplayMode;
  /**
   * Opacity of the back layer when `displayMode` is `deckPopupFaceDown`.
   * Defaults to {@link dimensions.deckPopupFaceDownBackOpacity}; transparent effect uses
   * {@link dimensions.transparentEffectBackOpacity} via callers.
   */
  faceDownBackOpacity?: number;
  /** When set, overrides in-game `config.deckPairId` (e.g. tests). */
  deckPairId?: string;
  className?: string;
};

function modeFor(placed: PlacedCard, displayMode?: CardDisplayMode): CardDisplayMode {
  if (displayMode) return displayMode;
  if (!placed.faceUp) return "faceDown";
  return "faceUp";
}

type FaceUpPortraitCardShellProps = {
  card: Card;
  mode: CardDisplayMode;
  faceDownBackOpacity: number;
  portraitSrc: string;
  frameSrc?: string;
  portraitInsetPx: number;
  className: string;
  style?: CSSProperties;
  children: React.ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "children" | "className" | "style">;

const FaceUpPortraitCardShell = forwardRef<HTMLDivElement, FaceUpPortraitCardShellProps>(
  function FaceUpPortraitCardShell(
    {
      card,
      mode,
      faceDownBackOpacity,
      portraitSrc,
      frameSrc,
      portraitInsetPx,
      className,
      style,
      children,
      ...rest
    },
    ref,
  ) {
    const [portraitReady, setPortraitReady] = useState(false);
    const onPortraitReadyChange = useCallback((ready: boolean) => setPortraitReady(ready), []);

    const w = dimensions.cardWidth;
    const h = dimensions.cardHeight;

    return (
      <div
        ref={ref}
        className={`relative overflow-hidden select-none rounded-md border border-zinc-600 shadow-sm ${className}`}
        style={{ width: w, height: h, ...style }}
        {...rest}
      >
        <OptionalPortraitFrameArt
          portraitSrc={portraitSrc}
          frameSrc={frameSrc}
          portraitInsetPx={portraitInsetPx}
          hideOverlayWhenReady
          onPortraitReadyChange={onPortraitReadyChange}
          className="h-full w-full rounded-md border-0 shadow-none"
          style={{ width: "100%", height: "100%" }}
        >
          {children}
        </OptionalPortraitFrameArt>
        {mode === "faceUp" ? (
          <FaceUpBackUntilPortraitReady card={card} portraitReady={portraitReady} />
        ) : null}
        {mode === "deckPopupFaceDown" ? (
          <DeckPopupFaceDownBackOverlay card={card} opacity={faceDownBackOpacity} />
        ) : null}
      </div>
    );
  },
);

export const CardView = forwardRef<
  HTMLDivElement,
  CardViewProps & Omit<HTMLAttributes<HTMLDivElement>, "color">
>(function CardView(
  {
    placed,
    displayMode: forcedMode,
    faceDownBackOpacity: faceDownBackOpacityProp,
    deckPairId: deckPairIdProp,
    className = "",
    style,
    ...rest
  },
  ref,
) {
  const storeDeckPairId = useGameStore((s) => s.game?.config.deckPairId);
  const deckPairId = deckPairIdProp ?? storeDeckPairId ?? DEFAULT_DECK_PAIR_ID;

  const mode = modeFor(placed, forcedMode);
  const faceDownBackOpacity =
    faceDownBackOpacityProp ?? dimensions.deckPopupFaceDownBackOpacity;
  const w = dimensions.cardWidth;
  const h = dimensions.cardHeight;

  const base =
    "select-none rounded-md border border-zinc-600 shadow-sm flex flex-col items-center justify-center text-xs font-semibold";

  const backGradient =
    cardDeckIndexForBack(placed.card) === 0 ? colors.cardBackDeckOne : colors.cardBackDeckTwo;

  if (mode === "faceDown") {
    const backSrc = faceDownBackPathForCard(placed.card);
    return (
      <div
        ref={ref}
        className={`${base} relative overflow-hidden ${className}`}
        style={{
          width: w,
          height: h,
          ...(style as CSSProperties),
        }}
        {...rest}
      >
        <div className="absolute inset-0" style={{ background: backGradient }} aria-hidden />
        <OptionalCardBackImage
          src={backSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    );
  }

  const c = placed.card;

  if (isJoker(c)) {
    const jokerInk = jokerCornerColor(c);
    const art = jokerArtForCard(deckPairId, c.id);
    return (
      <FaceUpPortraitCardShell
        key={`${c.id}:${art.portraitThumbPath}:${art.framePath}`}
        ref={ref}
        card={c}
        mode={mode}
        faceDownBackOpacity={faceDownBackOpacity}
        portraitSrc={art.portraitThumbPath}
        frameSrc={art.framePath}
        portraitInsetPx={dimensions.courtJokerPortraitPaddingPx}
        className={className}
        style={style as CSSProperties}
        aria-label="Joker"
        {...rest}
      >
        <>
          <div
            className="absolute left-[4px] top-[5px] flex flex-col items-center gap-0.5 text-[9px] font-bold leading-none"
            style={{ color: jokerInk }}
            aria-hidden
          >
            {"JOKER".split("").map((letter, i) => (
              <span key={i} className="block">
                {letter}
              </span>
            ))}
          </div>
          <div
            className="absolute right-[4px] bottom-[5px] flex flex-col items-center gap-0.5 text-[9px] font-bold leading-none"
            style={{
              color: jokerInk,
              transform: "rotate(180deg)",
              transformOrigin: "center",
            }}
            aria-hidden
          >
            {"JOKER".split("").map((letter, i) => (
              <span key={i} className="block">
                {letter}
              </span>
            ))}
          </div>
        </>
      </FaceUpPortraitCardShell>
    );
  }

  const color = suitColor(c.suit);
  const r = rankChar(c.rank);
  const g = SUIT_GLYPH[c.suit];

  if (isRegular(c)) {
    const art = faceArtForRegularCard(deckPairId, c);
    if (art) {
      const pip = !art.framePath;
      return (
        <FaceUpPortraitCardShell
          key={`${c.id}:${art.portraitThumbPath}:${art.framePath ?? ""}`}
          ref={ref}
          card={c}
          mode={mode}
          faceDownBackOpacity={faceDownBackOpacity}
          portraitSrc={art.portraitThumbPath}
          frameSrc={art.framePath}
          portraitInsetPx={
            pip ? dimensions.cardPipFacePaddingPx : dimensions.courtJokerPortraitPaddingPx
          }
          className={className}
          style={style as CSSProperties}
          {...rest}
        >
          <>
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
          </>
        </FaceUpPortraitCardShell>
      );
    }
  }

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
      {mode === "deckPopupFaceDown" && (
        <DeckPopupFaceDownBackOverlay card={c} opacity={faceDownBackOpacity} />
      )}
    </div>
  );
});
