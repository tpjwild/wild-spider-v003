export type PortraitArtLoadState = "idle" | "ok" | "fail";

const portraitBySrc = new Map<string, PortraitArtLoadState>();
const frameBySrc = new Map<string, PortraitArtLoadState>();

export function getPortraitLoadState(src: string): PortraitArtLoadState {
  return portraitBySrc.get(src) ?? "idle";
}

export function getFrameLoadState(src: string): PortraitArtLoadState {
  return frameBySrc.get(src) ?? "idle";
}

export function rememberPortraitLoadState(src: string, state: "ok" | "fail"): void {
  portraitBySrc.set(src, state);
}

export function rememberFrameLoadState(src: string, state: "ok" | "fail"): void {
  frameBySrc.set(src, state);
}
