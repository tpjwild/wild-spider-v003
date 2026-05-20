"use client";

/**
 * Per-card / column effect indicators (Stage 5).
 * Spec: more than two effects → single count badge; otherwise one badge per effect.
 */
export function CardEffectBadges({ effectCount }: { effectCount: number }) {
  if (effectCount <= 0) return null;
  if (effectCount > 2) {
    return (
      <div
        className="pointer-events-none absolute bottom-0.5 right-0.5 z-30 flex h-4 min-w-4 items-center justify-center rounded bg-zinc-900/85 px-0.5 text-[9px] font-bold text-amber-200/95 ring-1 ring-amber-500/40"
        aria-hidden
      >
        {effectCount}
      </div>
    );
  }
  return (
    <div className="pointer-events-none absolute bottom-0.5 right-0.5 z-30 flex gap-0.5" aria-hidden>
      {Array.from({ length: effectCount }).map((_, i) => (
        <span
          key={i}
          className="block size-2.5 rounded-sm bg-amber-400/90 ring-1 ring-amber-700/50"
          title="Effect (placeholder)"
        />
      ))}
    </div>
  );
}
