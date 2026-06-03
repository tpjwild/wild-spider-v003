"use client";

import { ShelfChargeBadge } from "@/components/game/ShelfChargeBadge";
import { colors } from "@/constants/colors";
import { sharedSetFramePath } from "@/constants/gameArtPaths";
import { dimensions } from "@/constants/dimensions";
import type { Suit } from "@/engine/types";
import { courtThumbsForSet } from "@/lib/deckCardArt";

const { cardWidth: cw, cardHeight: ch } = dimensions;
const {
  setShelfPortraitInsetPx: portraitInset,
  setShelfPortraitBoxHeightPx: portraitBoxH,
  setShelfKingThumbWidthPx: kingW,
  setShelfQueenJackThumbWidthPx: sideW,
  setShelfQueenJackGapPx: queenJackGap,
  setShelfPortraitRowGapPx: rowGap,
  setShelfPortraitClusterOffsetYPx: clusterOffsetY,
} = dimensions;

/** Clip each portrait to its top half (full width). */
function SetCourtThumb({
  src,
  testId,
  widthPx,
}: {
  src: string;
  testId: string;
  widthPx: number;
}) {
  return (
    <div
      className="pointer-events-none shrink-0 overflow-hidden"
      style={{ width: widthPx, height: portraitBoxH }}
    >
      <img
        src={src}
        alt=""
        className="h-[200%] w-full object-cover object-top"
        data-testid={testId}
        draggable={false}
      />
    </div>
  );
}

export type SetPowerShelfCardProps = {
  deckPairId: string;
  deckNum: 1 | 2;
  suit: Suit;
  chargesRemaining: number;
  className?: string;
};

/**
 * Composite shelf card for an aligned court set: King top center, Queen and Jack bottom row,
 * each portrait cropped to its top half, with the shared set frame overlay (red for H/D, black for S/C).
 */
export function SetPowerShelfCard({
  deckPairId,
  deckNum,
  suit,
  chargesRemaining,
  className = "",
}: SetPowerShelfCardProps) {
  const thumbs = courtThumbsForSet(deckPairId, deckNum, suit);
  const frameSrc = sharedSetFramePath(suit);
  const depleted = chargesRemaining <= 0;

  if (!thumbs) {
    return (
      <div
        className={`relative rounded-md bg-zinc-800/80 ${className}`}
        style={{ width: cw, height: ch }}
        data-testid="set-power-shelf-card"
        data-set-suit={suit}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={`relative select-none overflow-hidden rounded-md bg-zinc-100 ${className}`}
      style={{ width: cw, height: ch }}
      data-testid="set-power-shelf-card"
      data-set-suit={suit}
      data-charges={chargesRemaining}
    >
      <div
        className={
          depleted
            ? "relative h-full w-full saturate-[0.45] brightness-[0.88]"
            : "relative h-full w-full"
        }
      >
        <div
          className="pointer-events-none absolute z-0 flex items-center justify-center"
          style={{
            top: portraitInset,
            right: portraitInset,
            bottom: portraitInset,
            left: portraitInset,
          }}
        >
          <div
            className="flex flex-col items-center"
            style={{
              gap: rowGap,
              transform: `translateY(${-clusterOffsetY}px)`,
            }}
          >
            <SetCourtThumb src={thumbs.king} testId="set-court-king" widthPx={kingW} />
            <div className="flex justify-center" style={{ gap: queenJackGap }}>
              <SetCourtThumb src={thumbs.queen} testId="set-court-queen" widthPx={sideW} />
              <SetCourtThumb src={thumbs.jack} testId="set-court-jack" widthPx={sideW} />
            </div>
          </div>
        </div>
        <img
          src={frameSrc}
          alt=""
          className="pointer-events-none absolute inset-0 z-[1] h-full w-full object-fill"
          data-testid="set-power-frame"
          draggable={false}
        />
      </div>
      {depleted ? (
        <div
          className="pointer-events-none absolute inset-0 z-[15] rounded-md"
          style={{ backgroundColor: colors.shelfDepletedCardWash }}
          aria-hidden
        />
      ) : null}
      <ShelfChargeBadge chargesRemaining={chargesRemaining} />
    </div>
  );
}
