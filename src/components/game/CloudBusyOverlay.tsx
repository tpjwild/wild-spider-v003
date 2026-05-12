/** Full-screen dimmed overlay with spinner (cloud load / save). */
export function CloudBusyOverlay({
  label,
  ariaLabel,
}: {
  label: string;
  /** Short label for assistive tech (defaults to `label`). */
  ariaLabel?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-black/55"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={ariaLabel ?? label}
    >
      <div
        className="h-11 w-11 shrink-0 animate-spin rounded-full border-[3px] border-emerald-500/25 border-t-emerald-400"
        aria-hidden
      />
      <p className="text-sm text-zinc-300">{label}</p>
    </div>
  );
}
