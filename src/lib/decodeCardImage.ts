/** Wait for a loaded image to be decoded before showing it (reduces empty-face flashes). */
export async function decodeLoadedImage(img: HTMLImageElement): Promise<void> {
  if (!img.complete || img.naturalWidth === 0) return;
  if (typeof img.decode !== "function") return;
  try {
    await img.decode();
  } catch {
    /* decode() can reject for SVG/cors edge cases; onLoad still means we can show */
  }
}
