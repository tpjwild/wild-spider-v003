"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { colors } from "@/constants/colors";
import {
  rememberFrameLoadState,
  rememberPortraitLoadState,
  type PortraitArtLoadState,
} from "@/lib/portraitArtLoadCache";

type LoadState = PortraitArtLoadState;

function imageLoaded(el: HTMLImageElement): boolean {
  return el.complete && el.naturalWidth > 0;
}

type OptionalPortraitFrameArtProps = {
  portraitSrc: string;
  /** When set, portrait shows as soon as it loads; frame fades in separately. Pip faces omit `frameSrc`. */
  frameSrc?: string;
  /** Uniform padding inside the card around the portrait (e.g. pip SVGs); omit for edge-to-edge. */
  portraitInsetPx?: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** When true, corner `children` are hidden so rank/joker typography never shows over loading art. */
  hideOverlayWhenReady?: boolean;
};

/**
 * Portrait + optional frame for face cards and jokers. Readiness comes only from each mounted `<img>`
 * `onLoad` (not from background preload), so face-up cards do not flash empty white while the session
 * cache thinks assets are ready. Framed cards show the portrait first; the frame appears when it loads.
 */
export const OptionalPortraitFrameArt = forwardRef<
  HTMLDivElement,
  OptionalPortraitFrameArtProps & Omit<HTMLAttributes<HTMLDivElement>, "children">
>(function OptionalPortraitFrameArt(
  { portraitSrc, frameSrc, portraitInsetPx, children, className = "", style, hideOverlayWhenReady, ...rest },
  ref,
) {
  const useFrame = Boolean(frameSrc);
  const [portrait, setPortrait] = useState<LoadState>("idle");
  const [frame, setFrame] = useState<LoadState>(() => (frameSrc ? "idle" : "ok"));

  useEffect(() => {
    setPortrait("idle");
    setFrame(frameSrc ? "idle" : "ok");
  }, [portraitSrc, frameSrc]);

  const markPortraitOk = useCallback(() => {
    rememberPortraitLoadState(portraitSrc, "ok");
    setPortrait("ok");
  }, [portraitSrc]);

  const markPortraitFail = useCallback(() => {
    rememberPortraitLoadState(portraitSrc, "fail");
    setPortrait("fail");
  }, [portraitSrc]);

  const markFrameOk = useCallback(() => {
    if (!frameSrc) return;
    rememberFrameLoadState(frameSrc, "ok");
    setFrame("ok");
  }, [frameSrc]);

  const markFrameFail = useCallback(() => {
    if (!frameSrc) return;
    rememberFrameLoadState(frameSrc, "fail");
    setFrame("fail");
  }, [frameSrc]);

  const syncPortraitFromImg = useCallback(
    (el: HTMLImageElement | null) => {
      if (!el) return;
      if (imageLoaded(el)) markPortraitOk();
    },
    [markPortraitOk],
  );

  const syncFrameFromImg = useCallback(
    (el: HTMLImageElement | null) => {
      if (!el) return;
      if (imageLoaded(el)) markFrameOk();
    },
    [markFrameOk],
  );

  const onPortraitLoad = useCallback(
    (_e: SyntheticEvent<HTMLImageElement>) => {
      markPortraitOk();
    },
    [markPortraitOk],
  );

  const onFrameLoad = useCallback(
    (_e: SyntheticEvent<HTMLImageElement>) => {
      markFrameOk();
    },
    [markFrameOk],
  );

  const anyFail = portrait === "fail" || (useFrame && frame === "fail");
  const portraitReady = portrait === "ok";
  const portraitOpacity = portrait === "fail" ? 0 : portraitReady ? 1 : 0;
  const frameOpacity = useFrame ? (frame === "ok" ? 1 : 0) : 0;
  const hideCorners = Boolean(hideOverlayWhenReady);
  const pipPad = portraitInsetPx && portraitInsetPx > 0 ? portraitInsetPx : 0;
  const pipFace = !useFrame;

  const portraitImg = (
    <img
      ref={syncPortraitFromImg}
      src={portraitSrc}
      alt=""
      className={`z-0 h-full w-full border-0 outline-none ${pipFace ? "object-contain" : "object-cover"} block`}
      style={{ opacity: portraitOpacity }}
      loading="eager"
      decoding="async"
      onLoad={onPortraitLoad}
      onError={markPortraitFail}
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
              ref={syncFrameFromImg}
              src={frameSrc}
              alt=""
              className="pointer-events-none absolute inset-0 z-[1] h-full w-full object-fill"
              style={{ opacity: frameOpacity }}
              onLoad={onFrameLoad}
              onError={markFrameFail}
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
