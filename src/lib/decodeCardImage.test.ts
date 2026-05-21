import { describe, expect, it, vi } from "vitest";
import { decodeLoadedImage } from "@/lib/decodeCardImage";

describe("decodeLoadedImage", () => {
  it("calls decode when available", async () => {
    const decode = vi.fn().mockResolvedValue(undefined);
    const img = {
      complete: true,
      naturalWidth: 10,
      decode,
    } as unknown as HTMLImageElement;
    await decodeLoadedImage(img);
    expect(decode).toHaveBeenCalledOnce();
  });

  it("no-ops when image not loaded", async () => {
    const decode = vi.fn();
    const img = { complete: false, naturalWidth: 0, decode } as unknown as HTMLImageElement;
    await decodeLoadedImage(img);
    expect(decode).not.toHaveBeenCalled();
  });
});
