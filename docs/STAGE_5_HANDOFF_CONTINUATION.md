# Stage 5 handoff — continuation (powers UI + set powers)

**Supersedes** the “codebase reality” table in [STAGE_5_HANDOFF.md](./STAGE_5_HANDOFF.md) for implementation status as of the continuation handoff. Product rules are unchanged: **[WILD_SPIDER_SPEC.md](./WILD_SPIDER_SPEC.md)** (sections **Powers**, **Effects**, Game View).

Build checklist (if present): `.cursor/plans/wild_spider_phased_build_9d78c4e6.plan.md` — Stage 5.

---

## What was completed (engine + content)

### Engine state and behavior

| Area | Location | Status |
|------|----------|--------|
| Card/column effects on `GameState` | `src/engine/types.ts` — `cardEffects`, `columnEffects` | Done |
| `ShelfJoker` | `slot`, `powerId`, `chargesRemaining` (default 3) | Done |
| History | `HistoryEntry` type `power_trigger`; undo restores effects + charge | `src/engine/history.ts` |
| Apply transparent | All 8 Kings by card id; single card targeted | `src/engine/powers/handlers.ts` |
| Trigger + charge | `triggerImmediatePower`, `triggerTargetedPower` | `handlers.ts` → `game.ts` appends history |
| Shelf on deal | `createShelfJokerEntry(deckPairId, card)` | `deal.ts`, `setup.ts`, `initialDeal.ts` |
| Persisted saves | `normalizeStoredGameState` fills missing fields | `src/lib/gameStorage.ts` |
| Unit tests | Handlers, charges, undo, catalog `powerId` | `src/engine/powers/powers.test.ts` |

Public power API: **`import { … } from "@/engine/powers"`** (re-exported from `src/engine/index.ts`).

### Content layout (single registry)

| Path | Role |
|------|------|
| `src/content/gameContent.ts` | `GAME_CONTENT = { deckPairs, powerDefinitions }` + re-exports |
| `src/content/deckPairs.ts` | Full deck-pair catalog (~900 lines) |
| `src/content/powerDefinitions.ts` | `POWER_DEFINITIONS`, `JOKER_POWER_*`, `getPowerDefinition` |
| `src/content/portraitManifest.ts` | Themed portrait **files** only (courts + jokers) |

**Removed shims:** `src/constants/deckPairs.ts`, `powers.ts`, `portraitManifest.ts` — import from `@/content/...` or `@/constants` barrel (`deckPairs` / `powers` re-export from content).

### Joker catalog authoring

Each themed joker is defined with **explicit** `name`, `bio`, `powerId` (not from manifest):

```typescript
jokers: themedJokers({
  pairId: "computerScience",
  deck: 1,
  jokers: [
    { name: "Ada Lovelace", bio: "…", powerId: JOKER_POWER_RED_ALL_KINGS },
    // slots 1–4 → portrait files from manifest by `${pairId}:${deck}:${slot}`
  ],
}),
```

`themedFaces({ pairId, deck, faces: { S: { j, jBio, … }, … } })` uses the same options-object shape.

- **`name`** comes from catalog only (`def.name`); manifest `name` on jokers is unused.
- **`powerId`** is per joker in the tuple/object (today all themed pairs: slots 1–2 red, 3–4 black).
- **`powerIdForJokerSlot` was deleted** — no slot→power inference at runtime.

Helpers: `jokerDefinitionForInGameId(pairId, jokerId)`, `allJokersInDeckPair(pairId)`.

### Power definitions (behavior metadata)

| `powerId` | Class | Effect |
|-----------|--------|--------|
| `jokerRedAllKingsTransparent` | immediate | `transparent` on all Kings (card ids 0..103 rank 13) |
| `jokerBlackCardTransparent` | targeted | `transparent` on one valid target |

Target validation (engine): `isValidBlackJokerCardTarget(state, card, { tableauFaceDown, inStockPopup, deckPopupFaceDown })` — must match actual game state.

---

## Not done yet (UI + polish)

| Area | Status |
|------|--------|
| **`gameStore`** | No `triggerImmediatePower` / `triggerTargetedPower` wiring |
| **`ShelfStrip`** | No double-click to trigger; no charge badges; no power vs set distinction |
| **`CardView`** | `displayMode="transparent"` still uses **gradient veil** — spec wants **face + `DeckPopupFaceDownBackOverlay`** when face-down + effect |
| **Effect badges in UI** | `effectCount={0}` hardcoded in `TableauColumn`, `DeckPopup`, `StockPopup`; not reading `game.cardEffects` |
| **`CardEffectBadges`** | Count badge when `effectCount > 3`; spec says **> 2** |
| **Power Target mode** | Not in `GameShell` — hover Deck/Stock opens popups while targeting; Escape cancels |
| **Black joker targeting** | Engine ready; no click handlers on tableau/popup cards |
| **Set powers** | No alignment detector, no `ShelfSetPower` type, no handlers |
| **E2E** | No Playwright tests for powers (per plan) |
| **Spec doc paths** | `WILD_SPIDER_SPEC.md` still mentions `src/constants/deckPairs.ts` / `portraitManifest.ts` |

---

## Recommended build order (from here)

1. **Read effects from state in UI** — helper: `cardEffectsForCard(game, card)` / `hasCardEffect(…, "transparent")`; pass `effectCount` into tableau, `DeckPopup`, `StockPopup` (not foundation, not stock pile widget).
2. **`CardView`** — when card has `transparent` and face-down (or stock popup cell): use `deckPopupFaceDown` overlay path, not gradient `transparent` mode; face-up + effect → badge only.
3. **`CardEffectBadges`** — threshold `> 2`; tooltips TBD.
4. **`gameStore`** — actions: `triggerShelfPower(shelfIndex)`, `commitTargetedPower(card, context)`, cancel targeting; call `triggerImmediatePower` / `triggerTargetedPower` from `@/engine/game`.
5. **`ShelfStrip`** — double-click shelf item; show `chargesRemaining`; disable/depleted at 0.
6. **`GameShell`** — pointer modes `PowerTarget` / `ValidPowerTarget`; deck/stock bar hover opens popups while targeting; Escape cancels without charge.
7. **One power end-to-end** — red joker immediate in UI first, then black targeted + undo in UI.
8. **E2E** — immediate kings transparent + targeted card + undo.
9. **Set alignment** + set powers (later Stage 5 slice).

---

## Pitfalls (easy to miss)

1. **Engine `JokerCard.id` vs catalog** — Runtime joker is `{ kind: "joker", id: 0..n-1 }`. Catalog row is `jokerDefinitionForInGameId(pairId, id)` = `list[id % list.length]`. **Shelf** stores `powerId` from catalog when joker lands; triggers use `shelf[i].powerId`, not raw id.
2. **Kings transparent in state** — Effect is on all 8 King **ids** even if not in play; foundation kings have effect in state but **no** badge/overlay per spec.
3. **Undo** — Power trigger counts as a move; `undo()` in `game.ts` uses `undoLastEntry` (increments `undoCount`).
4. **Base pair** — `jokers: []`; no shelf powers for Base.
5. **Portrait manifest** — Keys use `deck` 1|2: `${pairId}:${deck}:${slot}` for jokers; `${pairId}:${deck}:${suit}:${rank}` for courts. Court **names** still come from manifest in `themedFaces`; only jokers use catalog `name`.
6. **Authored joker names vs art** — Catalog names (e.g. “Ada Lovelace” on CS deck 1 slot 1) may not match portrait filenames (e.g. Konrad Zuse) until content is aligned intentionally.

---

## Key files (quick map)

```
src/content/
  gameContent.ts          # GAME_CONTENT entry point
  deckPairs.ts            # deck pairs, themedJokers/themedFaces builders
  powerDefinitions.ts     # POWER_DEFINITIONS
  portraitManifest.ts     # file paths (+ unused court/joker names for courts)

src/engine/
  types.ts                # GameState effects, ShelfJoker, HistoryEntry
  effects.ts              # cardEffectKey, add/remove effects
  game.ts                 # triggerImmediatePower, triggerTargetedPower, undo
  powers/
    handlers.ts           # all joker power logic (single file)
    index.ts              # public exports
    powers.test.ts

src/components/game/
  CardView.tsx            # needs transparent effect wiring
  CardEffectBadges.tsx    # threshold + real badges
  ShelfStrip.tsx          # trigger UX
  GameShell.tsx           # targeting mode
  TableauColumn.tsx       # effectCount from state
  DeckPopup.tsx / StockPopup.tsx
```

---

## Tests

```bash
npm test -- --run src/engine/powers src/content
npx tsc --noEmit
```

All engine tests were green at handoff; UI work is mostly untested.

---

## Open decisions (unchanged defaults)

1. Card effect badge threshold: **> 2** (match spec **Effects**).
2. Effect id string: **`transparent`** on `EffectId`.
3. Foundation/stock pile: no transparent visual, no badges (effect may exist on kings in foundation).

---

## First message for a new agent

See the **Initial prompt** block in the continuation chat or copy from the handoff message the user was given.
