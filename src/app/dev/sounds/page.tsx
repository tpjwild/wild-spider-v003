import { notFound } from "next/navigation";
import { DevSoundsClient } from "./sounds-client";

export default function DevSoundsPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return (
    <div className="min-h-screen bg-zinc-950 p-8 text-zinc-100">
      <h1 className="text-xl font-semibold">Sound audition (dev only)</h1>
      <p className="mt-2 max-w-xl text-sm text-zinc-400">
        Place candidate MP3s under <code className="text-amber-200">public/sounds/candidates/&lt;effect&gt;/</code>{" "}
        then play here. Shipped defaults use <code className="text-amber-200">public/sounds/&lt;effect&gt;.mp3</code>{" "}
        or the synthesizer fallback. See <code className="text-amber-200">public/sounds/CREDITS.md</code>.
      </p>
      <DevSoundsClient />
    </div>
  );
}
