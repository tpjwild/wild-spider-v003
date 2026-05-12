# Wild Spider

Spider solitaire with jokers and achievements — see **[docs/WILD_SPIDER_SPEC.md](docs/WILD_SPIDER_SPEC.md)** for product rules.

## Stack

Next.js (App Router) + TypeScript + Tailwind · Headless engine in `src/engine/` · Client state in `src/state/gameStore.ts` (Zustand).

## Scripts

| Command | Purpose |
|--------|---------|
| `pnpm dev` | Next.js dev server |
| `pnpm build` / `pnpm start` | Production build and run |
| `pnpm test` | Vitest (engine + components) |
| `pnpm test:e2e` | Playwright (starts dev server; run `pnpm exec playwright install chromium` once if browsers are missing) |
| `pnpm lint` | ESLint |

## Stage 1 — Engine

Rules and scoring live in **`src/engine/`**. Run **`pnpm test`**. For a text snapshot of a state, use **`gameToAscii`** from `src/engine/ascii.ts`.

## Stage 2 — Playable UI

- **`/`** — Game view: tableau, foundation (8), stock (double-click deal), shelf, game bar (seed, moves, score to one decimal). Actions: New Game, Restart, End Game, Undo. Save / Logout / hamburger are disabled placeholders; Deck / Stock bar buttons disabled until Stage 4.
- **Drag & drop** — `@dnd-kit/core`: legal tableau moves and single-card to foundation; invalid drop snaps back (overlay). Successful drag-to-tableau / drag-to-foundation does **not** play placement sounds (per spec); **`cardFlipped`** only when a face-down card is revealed by that move.
- **Animations** — Framer Motion on foundation row after new deal / restart; timings from `src/constants/timings.ts`.
- **Sound** — `playSound()` in `src/lib/playSound.ts`: loads `public/sounds/<effect>.mp3` if present, otherwise Web Audio synth. **`/dev/sounds`** (dev only): native `<audio>` players for **CC0 WAV candidates** under `public/sounds/candidates/` (see `src/constants/soundCandidates.ts`) plus buttons that call `playSound()` like the game. **`public/sounds/CREDITS.md`** and **`KENNEY_INTERFACE_SOUNDS_LICENSE.txt`** document the candidate pack.
- **Persistence** — After each move the full `GameState` (including `history`) is written to **`localStorage`** key `wild-spider-game-v1` for refresh recovery.

## Create Next App

This project was bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app). See [Next.js docs](https://nextjs.org/docs) for framework details.
