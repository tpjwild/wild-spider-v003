/**
 * Play named UI sounds. Tries `/sounds/<name>.mp3` when listed in `soundManifest` (`SOUND_MP3_SHIPPED`);
 * otherwise uses the synthesizer without fetching. Unlisted or failed loads also use synth.
 *
 * Per-effect mute toggles: {@link soundFlags} in `src/constants/soundFlags.ts`.
 */
import { soundFlags, type SoundName } from "@/constants/soundFlags";
import { isSoundMp3Shipped } from "@/constants/soundManifest";

export type { SoundName };

function soundEnabled(name: SoundName): boolean {
  return soundFlags[name];
}

const bufferCache = new Map<SoundName, AudioBuffer | null>();
const loadPromises = new Map<SoundName, Promise<AudioBuffer | null>>();

/** BufferSource nodes still playing (natural end or {@link stopPlayingSound} removes them). */
const activeBufferSources = new Map<SoundName, AudioBufferSourceNode[]>();

function trackBufferSource(name: SoundName, src: AudioBufferSourceNode): void {
  let list = activeBufferSources.get(name);
  if (!list) {
    list = [];
    activeBufferSources.set(name, list);
  }
  list.push(src);
  const prevOnEnded = src.onended;
  src.onended = () => {
    prevOnEnded?.call(src, new Event("ended"));
    const L = activeBufferSources.get(name);
    if (!L) return;
    const i = L.indexOf(src);
    if (i >= 0) L.splice(i, 1);
  };
}

/**
 * Stops all in-flight buffer playback for this effect (e.g. long `cardDealt.mp3` tails after a multi-card deal).
 * No-op for sounds that are not currently playing from a decoded buffer.
 */
export function stopPlayingSound(name: SoundName): void {
  const list = activeBufferSources.get(name);
  if (!list?.length) return;
  for (const src of [...list]) {
    try {
      src.stop(0);
    } catch {
      /* already stopped */
    }
  }
  activeBufferSources.set(name, []);
}

/** One context for the whole app — creating a new `AudioContext` per sound hits browser limits (~6) and later deals go silent. */
let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (sharedAudioContext?.state === "closed") {
    sharedAudioContext = null;
  }
  if (sharedAudioContext) return sharedAudioContext;
  const Ctx =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  sharedAudioContext = new Ctx();
  return sharedAudioContext;
}

function loadBuffer(ctx: AudioContext, name: SoundName): Promise<AudioBuffer | null> {
  const cached = bufferCache.get(name);
  if (cached !== undefined) return Promise.resolve(cached);
  if (!isSoundMp3Shipped(name)) {
    bufferCache.set(name, null);
    return Promise.resolve(null);
  }
  let p = loadPromises.get(name);
  if (!p) {
    p = (async () => {
      try {
        const res = await fetch(`/sounds/${name}.mp3`);
        if (!res.ok) {
          bufferCache.set(name, null);
          return null;
        }
        const arr = await res.arrayBuffer();
        const buf = await ctx.decodeAudioData(arr.slice(0));
        bufferCache.set(name, buf);
        return buf;
      } catch {
        bufferCache.set(name, null);
        return null;
      } finally {
        loadPromises.delete(name);
      }
    })();
    loadPromises.set(name, p);
  }
  return p;
}

function playSynth(name: SoundName, ctx: AudioContext): void {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const now = ctx.currentTime;
  o.connect(g);
  g.connect(ctx.destination);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.12, now + 0.02);

  const profiles: Record<SoundName, { f: number; dur: number }> = {
    cardDealt: { f: 320, dur: 0.06 },
    cardPlaced: { f: 220, dur: 0.05 },
    cardFlipped: { f: 480, dur: 0.07 },
    powerTriggered: { f: 600, dur: 0.08 },
    powerTargeted: { f: 520, dur: 0.06 },
  };
  const p = profiles[name];
  o.type = "sine";
  o.frequency.setValueAtTime(p.f, now);
  o.frequency.exponentialRampToValueAtTime(p.f * 0.85, now + p.dur);
  o.start(now);
  o.stop(now + p.dur + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, now + p.dur + 0.03);
}

/**
 * Decode / resume only — no playback. Use before a burst of {@link playSound} calls so the first
 * `AudioBufferSourceNode.start()` is not delayed behind `decodeAudioData` + `AudioContext.resume()`.
 */
export async function prepareSound(name: SoundName): Promise<void> {
  if (typeof window === "undefined") return;
  if (!soundEnabled(name)) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") await ctx.resume();
    await loadBuffer(ctx, name);
  } catch {
    bufferCache.set(name, null);
  }
}

/** Loads (if needed) and starts playback; resolves once the buffer or synth path has been started. */
export async function playSoundAsync(name: SoundName): Promise<void> {
  if (typeof window === "undefined") return;
  if (!soundEnabled(name)) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") await ctx.resume();
    const buf = await loadBuffer(ctx, name);
    if (buf) {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = false;
      src.connect(ctx.destination);
      trackBufferSource(name, src);
      src.start();
      return;
    }
  } catch {
    bufferCache.set(name, null);
  }
  try {
    if (ctx.state === "suspended") await ctx.resume();
    playSynth(name, ctx);
  } catch {
    /* ignore */
  }
}

/**
 * Fire-and-forget: loads mp3 on first use, then plays buffer or synth.
 */
export function playSound(name: SoundName): void {
  void playSoundAsync(name);
}
