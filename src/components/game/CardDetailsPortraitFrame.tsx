"use client";

import { useCallback, useState, type SyntheticEvent } from "react";
import { decodeLoadedImage } from "@/lib/decodeCardImage";
import {
  getPortraitLoadState,
  rememberFrameLoadState,
  rememberPortraitLoadState,
  type PortraitArtLoadState,
} from "@/lib/portraitArtLoadCache";

type LoadState = PortraitArtLoadState;

/**
 * Card details portrait well: in-game thumb visible immediately, medium portrait
 * crossfades in when decoded; frame overlays when ready (same stacking as {@link OptionalPortraitFrameArt}).
 */
export function CardDetailsPortraitFrame({
  portraitSrc,
  portraitThumbSrc,
  frameSrc,
  portraitInsetPx,
}: {
  portraitSrc: string;
  portraitThumbSrc?: string;
  frameSrc?: string;
  portraitInsetPx: number;
}) {
  const resetKey = `${portraitSrc}|${portraitThumbSrc ?? ""}|${frameSrc ?? ""}`;
  return (
    <CardDetailsPortraitFrameInner
      key={resetKey}
      portraitSrc={portraitSrc}
      portraitThumbSrc={portraitThumbSrc}
      frameSrc={frameSrc}
      portraitInsetPx={portraitInsetPx}
    />
  );
}

function CardDetailsPortraitFrameInner({
  portraitSrc,
  portraitThumbSrc,
  frameSrc,
  portraitInsetPx,
}: {
  portraitSrc: string;
  portraitThumbSrc?: string;
  frameSrc?: string;
  portraitInsetPx: number;
}) {
  const useFrame = Boolean(frameSrc);
  const placeholderSrc =
    portraitThumbSrc && portraitThumbSrc !== portraitSrc ? portraitThumbSrc : undefined;

  const [thumb, setThumb] = useState<LoadState>(() =>
    placeholderSrc && getPortraitLoadState(placeholderSrc) === "ok" ? "ok" : "idle",
  );
  const [portrait, setPortrait] = useState<LoadState>("idle");
  const [frame, setFrame] = useState<LoadState>(() => (frameSrc ? "idle" : "ok"));

  const markThumbOk = useCallback(() => {
    if (!placeholderSrc) return;
    rememberPortraitLoadState(placeholderSrc, "ok");
    setThumb("ok");
  }, [placeholderSrc]);

  const markThumbFail = useCallback(() => {
    if (!placeholderSrc) return;
    rememberPortraitLoadState(placeholderSrc, "fail");
    setThumb("fail");
  }, [placeholderSrc]);

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

  const commitPortraitFromImg = useCallback(
    (el: HTMLImageElement) => {
      void (async () => {
        await decodeLoadedImage(el);
        markPortraitOk();
      })();
    },
    [markPortraitOk],
  );

  const onThumbLoad = useCallback(
    (e: SyntheticEvent<HTMLImageElement>) => {
      void (async () => {
        await decodeLoadedImage(e.currentTarget);
        markThumbOk();
      })();
    },
    [markThumbOk],
  );

  const onPortraitLoad = useCallback(
    (e: SyntheticEvent<HTMLImageElement>) => {
      commitPortraitFromImg(e.currentTarget);
    },
    [commitPortraitFromImg],
  );

  const portraitReady = portrait === "ok";
  const thumbReady = thumb === "ok";
  const showPlaceholder = Boolean(placeholderSrc);
  const showFaceBackground = portraitReady || (showPlaceholder && thumbReady);
  const frameOpacity = useFrame ? (frame === "ok" ? 1 : 0) : 0;
  const portraitFailed = portrait === "fail";
  const showMediumLayer = !portraitFailed;
  const mediumOpacity = portraitReady ? 1 : 0;
  const placeholderOpacity =
    showPlaceholder && thumbReady && (!portraitReady || portraitFailed) ? 1 : 0;

  const pipPad = portraitInsetPx > 0 ? portraitInsetPx : 0;
  /** Match {@link OptionalPortraitFrameArt}: padding on the wrapper; portraits fill the content box via `h-full w-full`, not `absolute inset-0` on the padded node. */
  const portraitImgClass =
    "absolute inset-0 h-full w-full border-0 outline-none object-cover block transition-opacity duration-200";

  const portraitStack = (
    <div
      className="absolute inset-0 z-0 box-border"
      style={{ padding: pipPad }}
    >
      <div className="relative h-full w-full">
        {showPlaceholder && placeholderSrc ? (
          <img
            src={placeholderSrc}
            alt=""
            className={`${portraitImgClass} z-0`}
            style={{ opacity: placeholderOpacity }}
            loading="eager"
            decoding="async"
            onLoad={onThumbLoad}
            onError={markThumbFail}
            draggable={false}
          />
        ) : null}
        {showMediumLayer ? (
          <img
            src={portraitSrc}
            alt=""
            className={`${portraitImgClass} z-[1]`}
            style={{ opacity: mediumOpacity }}
            loading="eager"
            decoding="async"
            onLoad={onPortraitLoad}
            onError={markPortraitFail}
            draggable={false}
          />
        ) : null}
      </div>
    </div>
  );

  const inner = (
    <>
      {portraitStack}
      {useFrame ? (
        <img
          src={frameSrc}
          alt=""
          className="pointer-events-none absolute inset-0 z-[2] h-full w-full object-fill transition-opacity duration-150"
          style={{ opacity: frameOpacity }}
          onLoad={() => markFrameOk()}
          onError={markFrameFail}
          draggable={false}
        />
      ) : null}
    </>
  );

  return (
    <div
      className={`relative h-full w-full overflow-hidden${useFrame && showFaceBackground ? " bg-zinc-100" : ""}`}
    >
      {inner}
    </div>
  );
}
