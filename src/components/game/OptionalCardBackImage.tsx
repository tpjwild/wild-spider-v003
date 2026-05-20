"use client";

import { useState, type CSSProperties } from "react";

type OptionalCardBackImageProps = {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * Face-down card back: loads `src` over a gradient. On load error, renders nothing so the gradient shows.
 * The image is always painted at full opacity so short animations (e.g. deal flights) still show backs once
 * the browser has the bitmap — hiding until `onLoad` left only the gradient visible for the whole flight.
 */
export function OptionalCardBackImage(props: OptionalCardBackImageProps) {
  return <OptionalCardBackImageInner key={props.src} {...props} />;
}

function OptionalCardBackImageInner({ src, alt, className, style }: OptionalCardBackImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{
        ...style,
        pointerEvents: "none",
      }}
      onError={() => setFailed(true)}
      draggable={false}
      loading="eager"
      decoding="async"
    />
  );
}
