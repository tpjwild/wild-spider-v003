"use client";

import { useMemo } from "react";
import { colors } from "@/constants/colors";
import {
  cardDetailsPipFacePaddingPx,
  cardDetailsPortraitInsetPx,
  dimensions,
} from "@/constants/dimensions";
import type { Card } from "@/engine/types";
import { getDeckCardDetailsModel } from "@/lib/deckCardDetails";
import { OptionalPortraitFrameArt } from "@/components/game/OptionalPortraitFrameArt";

type CardDetailsPopupProps = {
  deckPairId: string;
  card: Card;
  onClose: () => void;
};

export function CardDetailsPopup({ deckPairId, card, onClose }: CardDetailsPopupProps) {
  const model = useMemo(() => getDeckCardDetailsModel(deckPairId, card), [deckPairId, card]);

  if (!model) return null;

  const w = dimensions.cardDetailsPopupImageWidth;
  const h = dimensions.cardDetailsPopupImageHeight;

  return (
    <div
      className="fixed inset-0 z-[54] flex items-center justify-center p-4"
      style={{ backgroundColor: colors.cardDetailsPopupBackdrop }}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="pointer-events-auto flex max-h-[90vh] w-full max-w-[min(90vw,720px)] flex-col overflow-hidden rounded-xl border border-solid p-5 shadow-2xl"
        style={{
          backgroundColor: colors.cardDetailsPopupPanelBackground,
          borderColor: colors.popupLightPanelBorder,
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-details-heading"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className="flex min-h-0 flex-1 flex-col sm:flex-row"
          style={{ gap: dimensions.cardDetailsPopupGapPx }}
        >
          <div
            className="mx-auto shrink-0 overflow-hidden rounded-lg border border-solid"
            style={{
              width: w,
              height: h,
              backgroundColor: colors.cardDetailsPopupImageWellBackground,
              borderColor: colors.popupLightPanelBorder,
            }}
          >
            {model.isPipAce ? (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{
                  backgroundColor: colors.cardFacePip,
                  padding: cardDetailsPipFacePaddingPx(),
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={model.portraitSrc}
                  alt={model.primaryHeading}
                  className="max-h-full max-w-full object-contain"
                  draggable={false}
                />
              </div>
            ) : (
              <OptionalPortraitFrameArt
                portraitSrc={model.portraitSrc}
                frameSrc={model.frameSrc}
                portraitInsetPx={cardDetailsPortraitInsetPx()}
                hideOverlayWhenReady
                className="h-full w-full"
                style={{ width: "100%", height: "100%" }}
              >
                <></>
              </OptionalPortraitFrameArt>
            )}
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto pr-1 text-left">
            <h2
              id="card-details-heading"
              className="text-lg font-semibold"
              style={{ color: colors.popupLightPanelTitleText }}
            >
              {model.primaryHeading}
            </h2>
            {model.body ? (
              <p
                className="whitespace-pre-wrap text-sm leading-relaxed"
                style={{ color: colors.popupLightPanelBodyText }}
              >
                {model.body}
              </p>
            ) : null}
          </div>
        </div>
        <div
          className="mt-4 flex shrink-0 justify-end border-t border-solid pt-3"
          style={{ borderTopColor: colors.popupLightPanelDivider }}
        >
          <button
            type="button"
            className="rounded-md border border-solid px-4 py-2 text-sm font-medium transition hover:brightness-95"
            style={{
              backgroundColor: colors.popupLightCloseButtonBackground,
              borderColor: colors.popupLightCloseButtonBorder,
              color: colors.popupLightCloseButtonText,
            }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
