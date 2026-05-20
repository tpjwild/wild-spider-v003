"use client";

import { useState } from "react";
import { DeckCatalogPopup } from "@/components/game/DeckCatalogPopup";
import { deckPairs, isDeckPairUnlocked } from "@/content/deckPairs";

export default function DecksPage() {
  const [catalogPairId, setCatalogPairId] = useState<string | null>(null);

  return (
    <>
      <div className="mx-auto max-w-xl px-4 py-6 sm:px-8">
        <p className="text-sm text-emerald-100/85">
          All deck pairs in Wild Spider. Choose an unlocked pair to browse the full deck face up.
        </p>
        <ul className="mt-6 divide-y divide-black/20 rounded-lg border border-black/25 bg-black/15 shadow-inner">
          {deckPairs.map((p) => {
            const unlocked = isDeckPairUnlocked(p);
            return (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  {unlocked ? (
                    <button
                      type="button"
                      className="text-left font-medium text-emerald-50 underline-offset-2 hover:text-white hover:underline"
                      onClick={() => setCatalogPairId(p.id)}
                    >
                      {p.name}
                    </button>
                  ) : (
                    <span className="font-medium text-emerald-100/70">{p.name}</span>
                  )}
                  <p className="mt-0.5 text-xs text-emerald-100/55">
                    {p.pairCode} · {p.deckPairTheme}
                  </p>
                </div>
                {!unlocked ? (
                  <span className="shrink-0 rounded border border-black/30 bg-black/20 px-2 py-0.5 text-xs text-emerald-100/50">
                    Locked
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
      {catalogPairId ? (
        <DeckCatalogPopup deckPairId={catalogPairId} open onClose={() => setCatalogPairId(null)} />
      ) : null}
    </>
  );
}
