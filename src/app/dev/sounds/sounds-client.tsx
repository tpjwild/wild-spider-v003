"use client";

import { useCallback, useState } from "react";
import { SOUND_CANDIDATES } from "@/constants/soundCandidates";
import { playSound, type SoundName } from "@/lib/playSound";

const NAMES: SoundName[] = [
  "cardDealt",
  "cardPlaced",
  "cardFlipped",
  "powerTriggered",
  "powerTargeted",
];

function fileLabel(url: string): string {
  const i = url.lastIndexOf("/");
  return i >= 0 ? url.slice(i + 1) : url;
}

export function DevSoundsClient() {
  const [log, setLog] = useState<string>("");

  const play = useCallback((n: SoundName) => {
    playSound(n);
    setLog(`playSound(${n}) — ${new Date().toLocaleTimeString()} (uses /sounds/${n}.mp3 or synth)`);
  }, []);

  return (
    <div className="mt-8 space-y-10">
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Candidate clips (CC0)</h2>
        <p className="mt-1 max-w-2xl text-xs text-zinc-500">
          Use the native player on each row. Pick one per effect, convert to MP3 if needed, then save as{" "}
          <code className="text-amber-200">public/sounds/&lt;effect&gt;.mp3</code>. See{" "}
          <code className="text-amber-200">public/sounds/CREDITS.md</code>.
        </p>
        <div className="mt-6 space-y-8">
          {NAMES.map((effect) => (
            <div key={effect}>
              <h3 className="font-mono text-sm text-amber-200">{effect}</h3>
              <ul className="mt-2 space-y-2">
                {SOUND_CANDIDATES[effect].map((src) => (
                  <li
                    key={src}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2"
                  >
                    <span className="min-w-[10rem] font-mono text-xs text-zinc-400">{fileLabel(src)}</span>
                    <audio controls preload="none" src={src} className="h-8 max-w-full flex-1" />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Shipped path (MP3 or synth)</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Calls <code className="text-amber-200">playSound()</code> — same as the game. Without{" "}
          <code className="text-amber-200">.mp3</code> files you will hear the synthesizer fallback.
        </p>
        <ul className="mt-4 flex flex-wrap gap-3">
          {NAMES.map((n) => (
            <li key={n}>
              <button
                type="button"
                onClick={() => play(n)}
                className="cursor-pointer rounded-lg border border-white/20 bg-zinc-900 px-4 py-2 text-sm hover:bg-zinc-800"
              >
                Play <span className="font-mono text-amber-200">{n}</span>
              </button>
            </li>
          ))}
        </ul>
        {log ? <p className="mt-3 text-xs text-zinc-500">{log}</p> : null}
      </section>
    </div>
  );
}
