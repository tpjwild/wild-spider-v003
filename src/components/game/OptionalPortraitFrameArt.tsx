"use client";

import { forwardRef, useEffect, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { colors } from "@/constants/colors";
import {
  getFrameLoadState,
  getPortraitLoadState,
  rememberFrameLoadState,
  rememberPortraitLoadState,
  type PortraitArtLoadState,
} from "@/lib/portraitArtLoadCache";

type LoadState = PortraitArtLoadState;

type OptionalPortraitFrameArtProps = {
  portraitSrc: string;
  /** When set, portrait and frame must both load before art is shown; when omitted, portrait only (full-bleed pip SVG). */
  frameSrc?: string;
  /** Uniform padding inside the card around the portrait (e.g. pip SVGs); omit for edge-to-edge. */
  portraitInsetPx?: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** When true, corner `children` (rank/joker indices) hide once portrait art is ready (pip or framed). */
  hideOverlayWhenReady?: boolean;
};

/**
 * Portrait + optional frame for face cards and jokers. If required assets fail to load, only `children`
 * remain visible (typography on pip-white or zinc-100 when framed). When both portrait and frame load (when frame is used),
 * images sit under `children`. Pip faces omit `frameSrc` and show the portrait as soon as it is not in error.
 * Frame SVGs are drawn with `object-fit: fill` so the overlay matches the card rectangle (narrower artwork stretches horizontally).
 */
export const OptionalPortraitFrameArt = forwardRef<
  HTMLDivElement,
  OptionalPortraitFrameArtProps & Omit<HTMLAttributes<HTMLDivElement>, "children">
>(function OptionalPortraitFrameArt(
  { portraitSrc, frameSrc, portraitInsetPx, children, className = "", style, hideOverlayWhenReady, ...rest },
  ref,
) {
  const useFrame = Boolean(frameSrc);
  const [portrait, setPortrait] = useState<LoadState>(() => getPortraitLoadState(portraitSrc));
  const [frame, setFrame] = useState<LoadState>(() =>
    frameSrc ? getFrameLoadState(frameSrc) : "ok",
  );

  useEffect(() => {
    setPortrait(getPortraitLoadState(portraitSrc));
    setFrame(frameSrc ? getFrameLoadState(frameSrc) : "ok");
  }, [portraitSrc, frameSrc]);

  const anyFail = portrait === "fail" || (useFrame && frame === "fail");
  const framedArtReady = portrait === "ok" && frame === "ok";
  const pipArtReady = !useFrame && portrait === "ok";
  const showFramedArt = useFrame && framedArtReady;
  /** Pip mode: show portrait unless it failed (deal-friendly: no wait for opacity fade). */
  const portraitOpacity = useFrame ? (showFramedArt ? 1 : 0) : portrait === "fail" ? 0 : 1;
  const hideCorners = Boolean(hideOverlayWhenReady && (useFrame ? framedArtReady : pipArtReady));
  const pipPad = portraitInsetPx && portraitInsetPx > 0 ? portraitInsetPx : 0;
  const pipFace = !useFrame;

  const portraitImg = (
    <img
      src={portraitSrc}
      alt=""
      className={`z-0 h-full w-full border-0 outline-none ${pipFace ? "object-contain" : "object-cover"} block`}
      style={{ opacity: portraitOpacity }}
      loading="eager"
      decoding="async"
      onLoad={() => {
        rememberPortraitLoadState(portraitSrc, "ok");
        setPortrait("ok");
      }}
      onError={() => {
        rememberPortraitLoadState(portraitSrc, "fail");
        setPortrait("fail");
      }}
      draggable={false}
    />
  );

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${useFrame ? "bg-zinc-100" : ""} ${className}`}
      style={{
        ...style,
        ...(pipFace ? { backgroundColor: colors.cardFacePip } : {}),
      }}
      {...rest}
    >
      {!anyFail ? (
        <>
          {pipPad > 0 ? (
            <div
              className="absolute inset-0 z-0 box-border"
              style={{ padding: pipPad, backgroundColor: pipFace ? colors.cardFacePip : undefined }}
            >
              {portraitImg}
            </div>
          ) : (
            <div className="absolute inset-0 z-0" style={pipFace ? { backgroundColor: colors.cardFacePip } : undefined}>
              {portraitImg}
            </div>
          )}
          {useFrame ? (
            <img
              src={frameSrc}
              alt=""
              className="pointer-events-none absolute inset-0 z-[1] h-full w-full object-fill"
              style={{ opacity: showFramedArt ? 1 : 0 }}
              onLoad={() => {
                rememberFrameLoadState(frameSrc!, "ok");
                setFrame("ok");
              }}
              onError={() => {
                rememberFrameLoadState(frameSrc!, "fail");
                setFrame("fail");
              }}
              draggable={false}
            />
          ) : null}
        </>
      ) : null}
      <div
        className={`relative z-10 h-full w-full${hideCorners ? " pointer-events-none opacity-0" : ""}`}
        aria-hidden={hideCorners ? true : undefined}
      >
        {children}
      </div>
    </div>
  );
});
