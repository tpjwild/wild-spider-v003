# Wild Spider Spec Doc

## Overview

The web app will play a variant of Spider Solitaire with the addition of jokers and achievements.

## Game Rules

### Objective

Score as many points as possible by building as many sequences of cards in descending order of the same suit.

### Game Config

The config of each game is determined by the following parameters:

- **numberOfColumns:** The number of **deal columns** in the initial tableau layout (01–10 in formatted seeds). This value is stored as `config.columns` and does **not** cap how many physical tableau columns may exist later (e.g. after **Extra Column** inserts). The live tableau length is `columns.length`.
- **numberOfDeals:** The number of times the player can perform a deal, minimum of 5.
- **Deck Pair:** Which deck pair to use for this game. Each deck in the deck pair will contain any of its jokers that have been unlocked (see achievements below).
- **numberOfJokers:** Total count of joker cards shuffled into the stock for this game. This is determined by the deck pair chosen, cannot be set by the user and will be the sum of unlocked jokers across the two decks in the chosen deck pair, capped by 8.
- **numberOfColumns × numberOfDeals** must be ≤ 104.
- If **numberOfColumns × numberOfDeals === 104** then there will initially be zero cards in the tableau.

### Setup

Uses two standard 52‑card decks with each of the 2 decks containing from zero to 4 jokers (104 to 112 cards total).

**Canonical game seed (formatted):** `CC-DDD-XXX-SSSSSSSSSSSSSS` with **hyphens required** when displaying or entering:

- **CC** — two digits, number of tableau columns (01–10).
- **DDD** — three digits, number of deals (at least 005; **CC × DDD** must be ≤ 104).
- **XXX** — three characters `[A-Z0-9]`, a **stable deck pair code** assigned to each deck pair in the product registry (never repurposed when new pairs are added).
- **SSSSSSSSSSSSSS** — fourteen decimal digits (first digit 1–9): the **shuffle key** only. It determines the order of the **104 non‑joker** cards (Fisher–Yates from a PRNG seeded solely from this key). **Jokers** are Fisher–Yates shuffled using another stream derived from the same key, then **distinct insertion slots** are chosen deterministically from a third stream: those slots lie in the **trailing portion** of the shuffled 104‑card list (length controlled by **`FORMATTED_JOKER_INSERT_BACK_FRACTION`** in `src/constants/formattedJokerDeal.ts`, default **0.5** = the last 50% of indices, i.e. **52–103** for a 104‑card list). Up to one joker is placed per eligible index; **any jokers left over** (when **numberOfJokers** exceeds the number of eligible slots) are appended to the **bottom** of the initial stock (dealt last). Each inserted joker is placed **before** the corresponding regular card without reordering other regulars. **Dealing:** walk the combined `(104 + jokerCount)` sequence from the top; each **regular** card fills the next tableau slot until **104 − CC × DDD** regular cards are placed. If a **joker** appears **before** those tableau slots are filled (only possible when **104 − CC × DDD** exceeds the count of leading regular indices before the insertion region — for the default fraction, when **> 52**, since jokers then exist only from the back half of the 104 regular order), it is placed on the **shelf** immediately — the same outcome as dealing a joker from the stock. During the new-game **initial deal animation**, those jokers fly from the stock pile to the shelf at the point in the deal order where they would have been encountered, rather than appearing on the shelf before the animation begins. All remaining cards go to the **initial stock** in encounter order. The stock array is then **reversed** so that `dealFromStock` (which pops from the **end** of `stock` as the visible pile top) matches pack top-to-bottom order. Jokers never appear **on the tableau** from this construction.

**Legacy seeds:** strings that do not match the formatted pattern (including older saves and **`ws1:`** replay blobs) still use the previous engine behaviour: shuffle the 104 regular cards with the full seed string, append jokers, then shuffle the stock pile with a stock-specific RNG that mixes seed and layout.

**numberOfJokers** in the formatted seed path is chosen when starting the game (UI / unlock rules); it is **not** encoded in the seed string.

The tableau will thus initially contain **104 − numberOfColumns × numberOfDeals** **regular** cards, dealt face down. **Layout when columns have unequal counts:** let **n** = numberOfColumns, **t** = that tableau regular count, **q** = ⌊t/n⌋, **r** = t mod n (so **r** columns hold **q+1** cards and the rest hold **q**). The **r** taller columns are chosen at indices spaced along **0 … n−1**: for **r = 1** use the centre column ⌊(n−1)/2⌋ (left of two middles when **n** is even); for **r ≥ 2** use ⌊k·(n−1)/(r−1)⌋ for k = 0 … r−1 (e.g. n=10, r=4 → columns 0, 3, 6, 9; n=9, r=5 → 0, 2, 4, 6, 8). **Deal order (initial animation):** first deal **q** complete left-to-right passes over **all** columns (so each column receives **q** cards in classic round-robin order), then deal one more card to each taller column in **increasing column index** (left to right among those **r** columns). Implementation: `src/engine/tableauDealLayout.ts` and setup in `src/engine/setup.ts`.

Initially the top card of each non-empty column in the tableau is face up and the rest are face down.

Initially the stock will contain **numberOfColumns × numberOfDeals** regular cards plus any jokers not moved to the shelf during setup (see formatted seed dealing above). The shelf may already contain one or more jokers after setup when the tableau takes more regular cards than the leading “no‑joker” prefix of the 104 order (for the default back fraction, when **104 − CC × DDD > 52**); the initial deal animation moves those from the stock to the shelf in order (see formatted seed dealing above).

### Card Movement

Within the tableau the user can place a card on another card that is one rank higher regardless of suit.

A card can be moved from the tableau to the foundation if it is an ace being placed in an empty foundation slot or a card that is one rank above and of the same suit as the topmost card in the foundation slot.

The same **valid same-suit descending run** that may be dragged on the tableau (one or more face-up cards) may be moved to a foundation slot in **one action** when each card in the run, in order from the bottom of the run upward, can be placed on that slot’s pile under the rules above.

Cards can be moved as a group on the tableau if both the rank sequence and the suits match.

### Turning Face‑Down Cards

When you move the top face‑up card(s) away from a pile and expose a face‑down card underneath, that card is immediately turned face up.

### Empty Columns

Any single card or valid same‑suit descending sequence can be moved to an empty tableau column.

Empty columns are very powerful because they let you temporarily park cards and rearrange runs.

### Dealing New Rows from the Stock

When the user decides to deal, a single card is placed face up on each **deal column** (see **Extra Column**). **Extra-child** columns inserted by that power receive **no** deal card.

A deal cannot be performed if there are any empty **deal** columns unless there are insufficient cards in the tableau to fill those deal columns. Empty **extra-child** columns do **not** block dealing.

Whenever a joker is dealt from the stock it is placed on the shelf and an additional card is dealt in its place.

After each column has received its card for this deal, any jokers that are now on top of the stock (including a joker that was under the dealt slice) are immediately moved to the shelf as part of the same deal, so jokers are not left stranded on the stock.

### Game scoring

1 point for every face up card immediately on top of another face up card where the suit matches and the rank of the top card is one less than the rank of the bottom card.

−1 point for every card placed in the foundation.

½ point for every complete run from King to Ace of a single suit in the tableau.

−1 point for every undone move.

Thus the maximum number of points for a game is 100.

The **displayed** game score is **rounded to one decimal place** (e.g. half-points from complete runs still use ½ internally before rounding).

## Deck Pairs

The app has a number of deck pairs.

Each Deck Pair consists of two Decks.

Each Deck Pair has a deck pair theme, e.g. Western Philosophy, Computer Science.

Each Deck Pair has a suit theme name and suit theme details for each suit.

e.g. Suit theme name: Metaphysics & Ontology – “The suit of hidden foundations”

e.g. Suit theme details: This suit explores the basic structure of reality: what exists, what it means to be, and how things hang together at the deepest level. Its philosophers ask what kinds of things are real—minds, bodies, numbers, causes, possibilities—and how those underlying structures shape everything else.

Each deck in a **themed** deck pair (Computer Science, Western Philosophy, Mathematics) has **four** jokers in the shipped registry. The **Base** pair has **no** jokers in the registry (no joker cards for that pair in product data).

Each face card and joker for a given deck depicts a different person relevant to the deck’s theme.

Each joker and face card has:

- Person Name
- Person Bio
- Card face image

Each card face image has two image elements:

- Person Portrait: a **PNG** or **SVG** picture of the person (Base courts ship as SVG in the art set)
- Card frame: An svg file of the card frame that is put on top of the portrait. In the UI the frame is **scaled to the full card face** (same width and height as the card) so artwork that is narrower than the card still spans edge to edge.

Each deck has one image element:

- Card back image: A png

The deck pair registry lives in `src/content/deckPairs/` (one module per pair plus `index.ts`). Themed **court and joker display names**, bios, and power config are authored in those deck-pair modules (`themedFaces` / `themedJokers` inputs). The shipped product data includes **Base** (`BAS`), **Computer Science** (`CPS`), **Western Philosophy** (`WPH`), and **Mathematics** (`MAT`), each with two decks, four suit themes, and twelve face cards per deck. **Base** defines **no** jokers; each **themed** pair defines **four** jokers per deck. **Optional** bitmap/SVG art lives under `public/gameArt/portraits/<pairId>/deck{n}/` for court and joker portraits (see `src/content/portraitManifest.ts` for themed portrait **file** basenames only), under `public/gameArt/shared/backs/` for card backs, `public/gameArt/shared/cards/` for **A–10 pip faces** (`AS.svg` … `10H.svg`), and `public/gameArt/shared/frames/` for per-rank and per-joker-colour frame overlays (see `src/constants/sharedDeckAssets.ts` and `src/constants/gameArtPaths.ts`). **A–10** faces use a **white** card field; pip cards use the same **zinc border and shadow** as other face-up cards (courts, jokers, typography fallbacks). Pip art is scaled to fit within the padded area without cropping. If a back image is missing or fails to load, the face-down card shows the deck palette **gradient only**. When a back image is present, the UI shows **gradient plus bitmap only** (no playing-card index glyph on the back). If a joker or court **portrait** or **frame** fails to load, the card uses the same **corner typography** style as rank/suit cards (jokers use **JOKER** with letters **stacked vertically** in each corner, like a playing-card index). If a pip face SVG fails to load, **A–10** fall back to that same corner typography. The repo does not require every asset path to exist on disk.

## Jokers

Each deck has one joker when it is unlocked and 3 more that can be unlocked via achievements.

Each joker has a unique joker power and a number of charges.

Jokers are never placed on the **tableau**. After a joker is dealt from the stock it goes to the **shelf** only; jokers are not moved onto columns by the player or by powers.

## Sets

The face cards for a given suit of a given deck are called a set.

Each set has a unique set power.

A set power instance is created the first time in a given game that a set is **aligned**. **Aligned** means the same **suit** and same **deck** (first 52 cards = deck 1, second 52 = deck 2), with:

- **Tableau:** Jack on Queen on King — the Jack is immediately above the Queen, which is immediately above the King (face-up or face-down).
- **Foundation:** King on Queen on Jack — the King is on top of the Queen, which is on top of the Jack (same suit and deck in that foundation pile).

If more than one set becomes aligned as the result of a **single** move, multiple set power instances are created; the **order** in which those instances appear on the shelf **does not matter**.

A set power instance has a number of charges.

## Powers

There are two types of powers: Joker Powers and Set Powers.

Each joker has a given power and a number of charges.

A joker’s power can be triggered if it is sitting in the shelf and it has at least one charge left.

Set powers are created when a given set is aligned for the first time.

When a set power instance is created it is placed on the shelf.

A set power can be triggered if it is sitting on the shelf and it has at least one charge left.

There are two trigger classes of power:

- **Immediate:** Will take effect immediately, e.g. make all **Kings** transparent (red jokers in the initial registry; see **Effects**).
- **Targeted:** Will only take effect when the user selects a target, e.g. make the **selected** card transparent (black jokers in the initial registry; see **Effects**).

When a targeted power is triggered, if the user clicks on an invalid target or hits **Escape** then the power’s triggering is canceled and no charge is consumed. Pressing **Shift** while in **Power Target** mode also cancels targeting (no charge consumed).

A power can be triggered by double clicking on the relevant joker or set power instance.

A power can be targeted (if required) by clicking on a valid target.

If a power requires a target upon triggering then that target can be one of the following:

- A card in the tableau: Selected by clicking the card.
- A tableau column: Selected by clicking on the badge holder for the column.
- A card in the deck popup: Selected by mousing over the Deck button on the game bar (which will open if the mouse is in Power Target mode) and then clicking on the card.
- A card in the stock popup: Selected by mousing over the Stock button on the game bar (which will open if the mouse is in Power Target mode) and then clicking on the card.
- A joker or set power instance on the shelf: Selected by clicking on the item on the shelf.

Triggering a power counts as a move in terms of the number of moves shown in the game bar and the undo function.

Targeting a power does not count as a move. Undoing the triggering of a power will also undo its targeting event if it has one.

Undoing the triggering of a power will restore the charge to its source and undo any effects that it caused.

See **Effects** for how powers change appearance (badges, transparent rendering). Powers **do not flip** cards; orientation changes only through dealing and normal moves as described elsewhere in this document.

## Effects

Powers apply **effects** to game entities. An effect is either on a **card** or on a **tableau column**.

- **Stacking:** A card or column may have **multiple** effects. A card in a column with column effects receives **both** its own card effects and that column’s effects.
- **Duration:** Each joker in the deck-pair catalog may set **`initialDuration`**: **`null`** (default) means applied effects are **permanent** until removed; a **positive number** means the effect expires after that many **player moves** (tableau move, foundation move, or deal). **Arming** a targeted power (double-click) is **not** a move and does **not** tick durations. **Committing** a targeted power (valid target click) **is** a move: `tickEffectDurationsOnTargetCommit` in `src/engine/effects.ts` runs once with exclusions for card/column effects and extra-column parent links **added on that commit** (they start at full duration). All **other** timed card effects, column effects, and **Extra Column** links tick once on commit. `power_trigger` history does **not** use the generic move tick path. Timed effects also tick down after each tableau move, foundation move, and deal.
- **Column scope:** While a card remains in a column, **column effects** apply to **every** card in that column (in addition to any effects on the card itself).
- **Catalog:** Effect ids and labels live in `src/content/effectDefinitions.ts`. Tableau move rules are implemented in `src/engine/tableauEffects.ts`.

### Where effects appear (badges)

- **Placement:** Effect badges on cards and in tableau **column badge holders** are anchored at the **top-right** of the card face or holder (`CardEffectBadges` in `src/components/game/CardEffectBadges.tsx`).
- **Tableau column:** Each effect on a column adds a badge in that column’s **badge holder** (see Tableau under Game View), using the **column** ring style on the dark chip. Icons live in `public/gameArt/shared/effect-badges/{effectId}.svg` (see `effectBadgeIconPath` in `src/constants/gameArtPaths.ts`). Up to **`maxEffectBadgesShownIndividually`** (default **3** in `dimensions.ts`) effects show as separate icons; above that, one numeric count badge. Each icon or count badge has a tooltip (effect labels from `effectDefinitions.ts`; column-scoped entries append “(column)”).
- **Card:** Each badge is a **white** glyph on a **dark chip** (`effectBadgeIconSizePx`, default **10** px glyph; chip padding in `dimensions.ts`). **Card**-scoped effects use the standard dark chip with a **medium amber** ring; **column**-scoped effects use a **lighter chip** and **white** ring (see `effectBadgeColumnChipBackground` / `effectBadgeColumnScopeRing` in `src/constants/colors.ts`). On the **tableau**, badges appear on **face-up and face-down** cards. Card badges also appear in the **Deck popup** (with column inheritance when the card is on the tableau, not when it is still in stock) and the **Stock popup** (**card** effects only — no column inheritance). Card effect badges are **not** shown on cards in the **foundation** row or on the **stock pile** widget (face-down backs in the main game view). The **foundation name plate** (see **Foundation** under Game View) lists the same effect labels as text on tableau hover, including on face-down cards.

### Transparent effect (card)

If a card has the **transparent** effect:

- **Tableau, face down:** Render the card’s **face** art with the standard **card-back image** on top at **`transparentEffectBackOpacity`** (default **0.75** in `dimensions.ts` — opacity of the back layer; tweak there). Deck-popup cells without the transparent effect still use **`deckPopupFaceDownBackOpacity`** (default **0.5**).
- **Stock popup:** Same **face + semi-transparent back** treatment at **`transparentEffectBackOpacity`** when the effect applies.
- **Tableau, face up** and **Deck popup (face-up cells):** No face+back overlay; the card shows a **transparent effect badge** only (see badges above).
- **Foundation** and **stock pile widget:** No transparent visual treatment and no effect badges (badges are not shown there in any case).

Powers **do not flip** cards. Transparent only changes rendering and badges as above; orientation still changes only through dealing and normal moves.

### Wild effect (card or column; tableau only)

A card with **wild** may use **any** suit when forming a **tableau** descending run or when its suit is compared to neighbors in that run. A wild card picks **one** effective suit for the whole run slice being moved; it cannot bridge two incompatible non-wild suits in a single longer run (e.g. **5♠ — wild 4 — 3♣**: the **4+3** unit may move; **5+4+3** may not).

A **wild** at the **bottom** of a moving run may still move with the card below it in the slice (e.g. **wild 4** on **5♠** move together when the wild adopts spades).

**Foundation:** **wild** is ignored; only physical rank and suit apply.

### Wild half effect (card or column; tableau only)

**halfWild** (half wild): **Hearts** and **diamonds** may each act as **H** or **D**; **spades** and **clubs** may each act as **S** or **C**. Same “one effective suit per run slice” rule as **wild**. **wild** (full wild) overrides the half constraint when both apply.

**Foundation:** **halfWild** is ignored.

### Skip 1 / Skip 2 effects (card or column; tableau only)

**skip1:** For tableau runs and placement, the card’s rank may be treated as **one higher** or **one lower** than printed (not both in one run slice). Neighbors in a run must still differ by exactly **one** in **effective** rank.

**skip2:** Same as **skip1**, but the card may be treated as **±1** or **±2** ranks from printed (one choice per card per run slice).

**Placement:** Skip affects where a card may be placed on the tableau (e.g. a **skip1 4** may be placed on a **6** or a **4**; a **7** may be placed on a **skip1 9** or **skip1 7**). Suit rules for **multi-card** runs still require a single effective suit across the run; skip does not waive that.

**Combined example:** A **skip2 4♠** on a **wild 6♥** may move as a group when ranks and suits can be chosen consistently (e.g. wild as **6♠**, skip2 **4** as **5♠**).

**Foundation:** **skip1** and **skip2** are ignored.

### Extra Column effect (`extraColumn`; badge / name plate only)

The **`extraColumn`** effect id is used for **labels and badges** only; it is **not** in `TABLEAU_MOVE_EFFECT_IDS` and does not change tableau move rules. Gameplay is driven by **`extraColumnLinks`** and **`columnFlags`** on `GameState` (see **Extra Column power** below).

### Extra Column power (`jokerExtraColumn`)

A **targeted column** joker power (like column Wild / Transparent). **Jean-Paul Sartre** (Western Philosophy, Modern deck, slot 2) is the initial catalog assignment: **10** charges, **`initialDuration` 10** per new parent link (catalog change in content; behaviour in `src/engine/`).

**Targeting:** Any tableau column may be targeted: **deal columns**, **leaf** extra-child columns, and **chain-parent** extra-child columns (with or without an existing outgoing link). Invalid target or **Escape** / **Shift** cancel without spending a charge. Applying on a **leaf** inserts a new extra-child at `leaf + 1` with a fresh link from that leaf (extends the chain outward). Applying on a **deal column** or **chain parent** that already has a child uses the re-apply / insert-between rules below.

**Apply:** On a valid parent column **P**, insert an **empty** extra-child column at index **P + 1**, remapping all indices at and after the insert. Create a link `{ parentColumnIndex: P, movesRemaining: initialDuration }` and set `columnFlags[P+1].isExtraChild = true`. The child does **not** inherit the parent’s `columnEffects`; it may receive normal column joker effects on its own badge holder.

**Re-apply on a parent that already has a child:** Insert a new column at **parent + 1**; the new column is the new child of the targeted parent with a **fresh** link timer (not ticked on commit). The former child becomes the child of the new column; its existing link timer is preserved, then the commit move ticks it once (e.g. 5 → 4). Example: **A → B** (B has 5 moves left) → apply on **A** → **A → D → B**: **A→D** at 10, **D→B** at 4 after commit. Re-apply on **B** in **A → B → C** inserts between **B** and **C** with the same rules.

**Expiry:** When a link **P → child** reaches zero moves remaining (after tableau move, foundation move, deal, or targeted commit tick as above), merge the **entire** child pile onto **P** (child bottom on parent top), remove the child column, and remap indices. If the expired child had its own child (grandchild), the grandchild becomes the child of **P** (e.g. expire **B** in **A → B → C** → **A → C**; only **A** keeps the Extra Column badge on the parent).

**Deal columns:** Indices where the column is **not** `isExtraChild`. Stock deals place one card per deal column only.

**Undo:** An Extra Column target commit is undoable via `power_trigger`: restore charge and added card/column effects as today. When topology changes, history stores `extraColumnTopologyBefore` (snapshot of `columns`, `columnEffects`, `columnFlags`, `extraColumnLinks`) and undo restores it before reversing effects.

**Persistence:** `extraColumnLinks` and `columnFlags` are saved and loaded with the game (`gameStorage.ts`). `columns.length` may exceed `config.columns` after inserts; the full column array and topology fields round-trip through local save and `parseStoredGameState`. Older saves using `bonusColumnLinks` / `isBonusChild` are migrated on load.

**Topology:** Inserting or removing a column remaps `columns`, `columnEffects`, `columnFlags`, `extraColumnLinks`, and undo `history` column indices (`src/engine/extraColumnTopology.ts`: `insertEmptyColumnAt`, `removeColumnAt`).

**Apply:** `applyExtraColumn` in `src/engine/extraColumn.ts` inserts the empty child, creates the parent link, and on re-apply reparents the former child under the new column while preserving its link timer.

**Tick & expiry:** `tickExtraColumnLinks` runs after tableau moves, foundation moves, and deals (`src/engine/game.ts`). Each link’s `movesRemaining` decrements by one; at zero, `expireExtraColumnLinkAtParent` merges the child pile onto the parent, removes the child column, and reparents a grandchild link onto the parent when present.

**Deals:** `getDealColumnIndices` in `src/engine/extraColumn.ts` (re-exported from `deal.ts`) lists columns that are not `isExtraChild`. `dealFromStock` / `canDealFromStock` deal one card per deal column only; empty-column blocking uses deal columns, not extra-child empties.

**Column display labels** (UI): Deal column **i** → `Column ${String(i+1).padStart(2,"0")}` (e.g. `Column 01`). Extra children chained from that deal root use `.01`, `.02`, … in left-to-right chain order: `Column 01`, `Column 01.01`, `Column 01.02`. **Foundation name plate** (inspect): timed effects show `Label (N)`; any column that **parents** an active link (deal column or chain-parent extra-child) shows heading + `Extra Column (N)` for **that** link under Column Effects; **leaf** extra-child hover shows heading and joker column effects only (no `Extra Column` line — the parent link timer appears on the green badge strip). **Badges:** Parent with active link shows the Extra Column icon (`public/gameArt/shared/effect-badges/extraColumn.svg`) in that column’s badge holder (`columnHolderEffectBadgeEntries`). Extra-child column holders use a lighter green strip (`tableauExtraChildBadgeHolderBackground` / `tableauExtraChildBadgeHolderBorder` in `colors.ts`) and a circle at the top-left with the parent link’s `movesRemaining` (`extraColumnLinkTimer*` tokens).

### Joker power registry (catalog; deck assignment optional)

Power ids, **name**, **description**, and targeting rules live in `src/content/powerDefinitions.ts`. Behavior in `src/engine/powers/handlers.ts`. The **Card details** popup shows a joker’s power name, description, and **remaining charges** (live count when the joker is on the shelf; catalog starting count otherwise) below its bio. **Deck pairs** still assign only the initial red/black transparent powers until achievements expand the set.

| Power id (constant) | Class | Applies | Target |
|---------------------|-------|---------|--------|
| `jokerAllKingsTransparent` | Immediate | transparent | all Kings |
| `jokerTwoKingsTransparent` | Immediate | transparent | 2 Kings (prefer stock / face-down foundation, then face-up tableau, then foundation) |
| `jokerSelectedCardTransparent` | Targeted | transparent | face-down tableau, stock popup, deck popup face-down |
| `jokerSelectedCardWild` / `HalfWild` / `Skip1` / `Skip2` | Targeted | matching effect | tableau card, stock popup, deck popup face-down |
| `jokerSelectedColumnTransparent` / `Wild` / `HalfWild` / `Skip1` / `Skip2` | Targeted | matching effect | tableau column (**badge holder** only while targeting; not individual cards) |
| `jokerExtraColumn` | Targeted | *(structural; `extraColumn` badge only)* | any tableau column (**badge holder**) |

### Stage 5 joker powers (initial registry)

Until achievements gate powers (Stage 6), **Computer Science** and **Mathematics** use a fixed mapping by **joker slot** within each deck (**1–2** = red, **3–4** = black; see portrait manifest). **Western Philosophy** assigns a **distinct** power per joker (eight different powers across the pair — see `deckPairWesternPhilosophy.ts`). Each shelf joker instance starts with **`initialCharges`** and **`initialDuration`** from the deck-pair catalog in `src/content/deckPairs/` (per joker; typically **3** charges and **`null`** duration today).

| Slot (CPS / MAT default) | Power class | Effect |
|------|-------------|--------|
| **1–2 (red)** | **Immediate** | Apply **transparent** to **every King** (rank 13) in the current game — all suits, both decks, every zone (tableau, foundation, stock list, etc.); rendering/badges follow the rules above per surface. |
| **3–4 (black)** | **Targeted** | Apply **transparent** to **one** valid target: any **face-down** card on the **tableau**; **any** card in the **Stock popup**; any card in the **Deck popup** that is **not** shown face-up (i.e. still in stock or face-down on tableau in that popup). After triggering a **card** targeted power, **hovering** the **Deck** or **Stock** button while in **Power Target** mode opens that popup so the user can click a valid card there (**column** targeted powers do not open those popups on hover). Invalid target or **Escape** cancels without spending a charge. |

**Western Philosophy** joker powers (by catalog slot **1–4** per deck):

| Deck | Slot | Philosopher | Power |
|------|------|-------------|-------|
| Classical | 1 | Protagoras | All Kings transparent |
| Classical | 2 | Pyrrho | Two Kings transparent |
| Classical | 3 | Diogenes | Selected card transparent |
| Classical | 4 | Heraclitus | Selected card wild |
| Modern | 1 | Camus | Selected card skip ±1 |
| Modern | 2 | Sartre | Extra Column (10 charges, duration 10 per new parent link) |
| Modern | 3 | Nietzsche | Selected card skip ±2 |
| Modern | 4 | Wittgenstein | Selected column transparent |

Set powers and additional powers are defined in Stage 5 / later content.

## Achievements

Are of the form:

- Achieve at least X points in a game
- Using the Y deck pair
- C columns
- D deals
- Use no more than X joker power charges and Y set power charges

Each achievement will do one of the following:

- Unlock a deck pair
- Unlock a set power
- Unlock a joker
- Upgrade a joker power
- Upgrade a set power

Each achievement has the following parameters:

- name
- description
- achievementPoints
- requiredGamePoints
- requiredDeckPair
- requiredColumns
- requiredDeals
- requiredMaxUsedJokerCharges
- requiredMaxUsedSetCharges
- unlockedDeckPairs
- unlockedSetPowers
- unlockedJokers
- upgradedJokerPowers
- upgradedSetPowers

When a game ends each achievement that is not completed is checked. If any new achievements have been completed then a popup is displayed.

Jokers only appear in the decks when they have been unlocked.

Set powers can only be triggered once they have been unlocked.

Deck pairs can only be selected for a game when they have been unlocked.

## Views

### Layout

Every view has a title bar with:

- A hamburger menu on the left — allows navigation between views.
- A title to the right of the hamburger menu: **WILD SPIDER**.
- When the user is signed in, a **display name** (profile name from the provider if present, otherwise the part of the email before `@`) appears on the right, immediately to the left of the action menu; long values truncate with the full string available on hover.
- An action menu on the right — allows the user to take different actions on each view:

**Game**

- New Game
- Restart Game — undoes **all** moves and restores the game to its **initial** layout and state (same **seed** and thus the same card order as when the game started).
- Save Game — from the Actions menu (or **Alt+Shift+S**): when **Confirm before saving game** is enabled in Settings (stored as `user_settings.confirm_save`, default **on**), the app first shows a **confirmation dialog**; **Save** or **Enter** / **Return** (main or keypad) then runs the server request the same way, **Cancel** / **Escape** / backdrop dismiss without saving. When that setting is **off**, the server request runs immediately. While the request runs, a full-screen spinner is shown; when it succeeds, a short **Save complete** dialog confirms the save — dismiss with **OK**, **Enter** / **Return**, **Escape**, or the backdrop. On failure, errors use the dismissible error strip. Save and Load confirmations cannot be open at the same time (the other action is disabled while one is open).
- Load Game — when the **game area has any cards in play** (in-progress game or a deal animation that has already placed cards), the app asks for **confirmation** before replacing that state with the single saved row from the server (same as resume on login). When the board is **cleared** (no cards on tableau, foundation, stock, or shelf), **Load Game** runs immediately with no confirmation dialog. While the request runs, a loading indicator is shown. Disabled when not signed in, when Supabase is not configured, while a deal animation is running, while a load is already in progress, or while the **Save Game** confirmation dialog is open.
- End Game — opens a confirmation dialog showing **final score** and **game configuration** (columns, deals, deck pair, joker count, seed with the same **copy icon beside the seed** as on the game bar), plus **OK** / **Cancel**. **OK** or **Enter** / **Return** (main or keypad) confirms ending the same way, except when keyboard focus is on **Cancel** or the seed **copy** control (those keep their normal behaviour). Confirming clears the in-progress game and local save, leaves the **shelf, foundation row, and stock pile visible (empty)**, and shows an empty tableau for the same column count — **without** opening the New Game dialog (the user opens New Game when they want). The user is **not** prompted to save to the server before ending; they can use **Save Game** from the Actions menu when they wish. **Cancel**, **Escape**, or clicking the **backdrop** outside the dialog panel closes the dialog and leaves the game unchanged.
- Logout

On the **Game** view, when no modal dialog is open and keyboard focus is not in a text-entry control, the action menu items also respond to **Alt+Shift** chords (**Alt** is **Option** on macOS): **N** New Game, **A** Restart Game, **S** Save Game, **L** Load Game, **E** End Game, **O** Logout, **U** Undo. Chords are shown next to each item in the Actions menu. Chords use the **physical** key codes (`KeyA`, etc.) and are handled in the **capture** phase so the browser (or embedded preview host) is less likely to consume the shortcut before the page.

**Achievements** — Logout

**Decks** — Logout

**Hall of Fame** — Logout

**Settings** — Logout

### View Summary

- **Login page:** User lands here when they are not logged in. Cannot otherwise be navigated to.
- **Game:** Where the game itself is played.
- **Achievements:** Lists all achievements, both achieved and not yet achieved.
- **Decks:** Lists **all deck pairs** available in the game. Choosing an **unlocked** pair opens the **Deck Popup** for that pair with **every card face up** (browse-only). Locked pairs are listed but cannot be opened until unlocked.
- **Hall of Fame:** Lists all users ranked by various things.
- **Settings:** Allows the user to edit game settings.

### Login Page

Allows the user to log in and create an account if they don’t have one. The login experience includes **password reset** (e.g. email link via Supabase Auth).

After login the user is taken to the game view. **Bootstrap:** On load (including full **browser refresh**), the app **restores from `localStorage`** key `wild-spider-game-v1` when a valid saved state exists, so in-progress play survives refresh. If there is **no** local snapshot (first visit or after **End Game**, which clears that key), the app may **fallback** to the single **server** row (same as **Load Game**) when the user is logged in and Supabase is configured — otherwise it shows the **cleared layout** (empty shelf, foundation, stock, and tableau) using last **New Game** defaults from this browser when known, otherwise product defaults — and the **New Game** dialog does **not** open by itself. If the user logged out on a **cleared** board while a server save still exists but local was cleared, the next login triggers that empty-local path and can therefore restore from the server. (The “skip server autoload on next login” hint remains stored in **localStorage** for this origin and is removed only after that login’s bootstrap applies the cleared layout, so auth remounts do not consume it too early.) A **first-time** user (no server row, no local save) sees the same **cleared board** without being forced through **New Game** immediately; they can open **New Game** from the Actions menu when they want.

### Saved games (database and local)

The user may have **at most one in-progress saved game** in the database per account. Choosing **Save Game** writes (or replaces) that single saved row. **Local storage** also stores the current state after each move for crash recovery and **takes precedence on refresh** over the server row when a local snapshot exists; use **Save Game** to push the current local game to the server.

### Game View

Cards in the game can be rendered in the following modes:

- Face Up
- Face Down — the back design uses **blue** tones for the **first** standard 52-card deck in the box and **red** tones for the **second** 52-card deck (by card identity in the double deck). Jokers use the same two palettes by joker id until deck-specific joker art exists.
- **Transparent (effect):** Not a global display mode by itself; see **Effects** — transparent cards use **face + semi-transparent back** when face down on the tableau or in the Stock popup, and **effect badges** in Deck-popup / face-up contexts.

Effect **badges** on cards and columns follow **Effects** (including: no card badges on foundation or the stock pile widget; column badges in the badge holder strip).

The mouse pointer in the game view can be in the following modes:

- **Default:** Standard arrow.
- **Active:** A hand; mouse is over a button or link that can be clicked, a card that can be picked up, etc.
- **Drag:** A closed hand; user has clicked a card or cards that are able to be moved.
- **Power Target:** Indicates that a targeted power has been triggered and the next click will select a target for that power.
- **Valid Power Target:** Indicates that a targeted power has been triggered and the mouse is currently over a valid target for that power.

#### Shelf, foundation, and stock row

- One row above the tableau: **Shelf** (left), **Foundation** (centre), **Stock** (right).
- The **top** of the shelf’s joker/power strip, the **top** of the foundation row, and the **top** of the **stock stack area** share the same vertical alignment (implemented with **shelfVerticalPad**: shelf inner padding plus matching top inset on the foundation and stock columns).
- The **foundation** sits in the **centre** of the row. To its **left** is a region reserved for the **shelf**; to its **right** is a region reserved for the **stock**. Those two regions are **always the same width** as each other and are **never narrower than shelfWidth**; when the row is wider than the minimum, the two regions **grow equally** (CSS `minmax(shelfWidth, 1fr)` on each flank). The **shelf** panel (bordered area) is **horizontally centred** within the left region; **jokers / powers inside the shelf** are **left-justified**. The **stock** pile is **horizontally centred** within the right region.
- The **stock** stack reserves a **vertical height** for the face-down pile for the whole game from the current setup’s **deals** count (capped by **stockMaxVisibleDeals** in `dimensions`, with **stockCardOffset** between backs) and **`stockStackRegionHeightPx`** in `src/constants/dimensions.ts`; only the number of **visible** backs changes as deals run down. The shelf / foundation / stock strip uses **`shelfFoundationStockStripMinHeightPx(deals)`** so that row’s minimum height matches the tallest of shelf, foundation, and stock regions when a game starts or loads.

#### The Game View has the following elements

- The in-game shell is **`100dvh`** tall with **overflow hidden** on the window chrome; the **tableau** pane below the shelf / foundation / stock row (`[data-tableau-scroll-pane]`, class **`tableau-scroll`** in `globals.css`) uses **vertical scrolling** when stacks are tall and **horizontal scrolling** when the row of columns is wider than the pane (e.g. after **Extra Column** inserts beyond the initial deal width). Columns stay on **one row** (`flex-nowrap`); row width is **`tableauRowWidthPx(columns.length)`** in `dimensions.ts` (card width × column count + gaps). While a game is in play, each tableau column droppable stretches to the **bottom of that scroll pane** (not only the card stack height) so empty drop space and drag highlights reach the bottom of the visible tableau area.

**Tableau**

- In the middle of the window.
- Contains a tableau column for each column in the game.
- Each tableau column has a drop area that extends to the bottom of the **tableau scroll pane** while a game is loaded (plus small padding above the stack minimum); when no game is shown, droppables are not rendered.
- Above each tableau column is a **badge holder** strip that displays **column-level** effect badges; see **Effects**. It is **`tableauColumnBadgeHolderHeight`** tall (default **30** px in `src/constants/dimensions.ts`), **`cardWidth`** wide (same as the column card stack), with a thin **white** outline (`TableauColumnBadgeHolder` in `src/components/game/TableauColumn.tsx`). **`tableauColumnBadgeHolderGapPx`** (default **10** px) separates the badge holder from the card stack / empty-column outline below.
- The tableau column **drop area** has no visible border or background in normal play; while dragging, a valid target column may show a light tint only. **Empty** columns show a **dashed** white card-sized outline (**2px** stroke) at the **column head** only (same style as an empty foundation slot).
- The first card in the column (the base of the pile) is placed on the tableau column head at the **top** of the stack. Each subsequent card is offset **vertically downward** from the previous: the step is **tableauColumnFaceDownCardOffset** when the card above is face **down**, and **tableauColumnFaceUpCardOffset** when the card above is face **up** (see `src/constants/dimensions.ts`). Higher cards in the pile have higher stacking order so the face-up tail remains readable.
- **Pointer hover (draggable run):** When the pointer is over a **face-up** card that **can start a legal tableau drag** (same-suit descending tail to the column top), **that** card and **every card above it in that same legal run** are scaled by **`TABLEAU_DRAGGABLE_HOVER_SCALE`** (`dimensions.ts`, default **110%**) from the card **centre**. Only the **top‑hit** card at the pointer (stacking order above) “arms” the hover: a card wholly covered by a higher card does not receive the pointer. **In-column** scale follows **hover only** (not the drag `active` id): once the **`DragOverlay`** is mounted the source cards are hidden and the overlay shows the lifted run at the same scale until **drop or cancel**. The **`TableauDragStackPreview`** in the overlay and on the invalid-drop return flight renders each card like the tableau stack (face-up/down display, transparent face+back when applicable, and **effect badges** for card and inherited column effects). **`onDragEnd`** / **`onDragCancel`** clear hover run state as soon as the pointer releases so **illegal** returns are not scaled from a stale drag id after the overlay unmounts. The **source** column also ignores **`pointerenter`** hover re-arm for **`timings.tableauLayoutReturnBoostMs`** after a tableau drag from that column ends (same window as the layout-return z-boost in **`GameShell`**) so **`visibility: hidden` → visible** during the return flight does not re-apply **110%** while the pointer has not moved. In-column cards use an explicit **`scale(1)`** with **no** CSS transform transition when not hovered so scale snaps to **100%** immediately. **Successful** drop commits the overlay to **normal (100%)** size **before** the overlay is cleared. The **`DragOverlay`** preview is **plain DOM** (no Framer **`layoutId`**) so **`@dnd-kit`** transform tracking stays tight while dragging. On an **invalid** drop or cancel, a fixed **`TableauDragReturnLayer`** animates the whole lifted run from the drop position back to the source column (spring **`layoutIdDropTransition`**); source tableau cards stay **`visibility: hidden`** via **`tableauReturnHide`** until that flight completes so cards are not doubled. **Tableau and foundation** cards that participate in **`layoutId`** use **`layoutIdCardMotionProps`** (**position-only** layout in `src/constants/timings.ts`) so post-drop motion does **not** interpolate **size** (no visible **110%→100%** size tween). Those transitions use **`layoutIdDropTransition`** (snappier than **`layoutSpring`**). No hover growth while a deal animation locks the board. Leaving a card through its **top** edge clears hover scale unless the pointer moves directly onto the **card above** in the **same** legal drag run (see **`tableauCardAboveSharesDragRun`** in `src/engine/tableauEffects.ts`); leaving through other edges or into empty space clears scale as before.
- **Card details (inspect mode):** Hold **Shift** to inspect cards on the board (pointer becomes a **help** / question-mark cursor). While **Shift** is held, eligible **face-up** **Aces**, **Jacks**, **Queens**, and **Kings** on the tableau scale by **`TABLEAU_CARD_INVESTIGATE_SCALE`** (default **1.1**) and show a **sky-blue highlight** ring on pointer hover; **Shift+click** (or **Shift**+tap on the card after a small pointer movement on draggable cards) opens the same **Card details** dialog as in the Deck Popup. A **face-down** card on the tableau that has the **transparent** effect and is therefore shown as **face + semi-transparent back** is treated the same when it is an Ace or court. Without **Shift**, those clicks do **not** open Card details (normal **drag** and **hover scale** on draggable runs apply). **Drag** still takes precedence: a **Shift**+click after a tableau drag does not open Card details. While **Power Target** mode is active, tableau clicks apply only to valid targets (and **Shift** cancels targeting). While Card details for a card is open, that card **keeps** hover scale if applicable; when the dialog closes, hover is restored only if the pointer is still over that card. **Close**, **Escape**, or the details **backdrop** dismiss the dialog.

**Foundation**

- Above the Tableau.
- Has 8 foundation slots (two decks × four suits).
- Each foundation slot has a **dashed** white outline (**2px** stroke) the size and shape of a card when the slot is **empty**; drag-over uses the same dashed border (amber tint + light fill), not a second outline, so a valid target does not read as two nested rectangles.
- **Name plate (tableau inspect):** Directly **below** the foundation row, **exactly as wide** as the foundation row (**`foundationRowWidthPx()`** = eight card widths plus inter-slot gaps; see **`foundationSlotCount`** in `dimensions.ts`). Fixed **max** height **`foundationNamePlateHeightPx`**, gap **`foundationNamePlateGapPx`**, same styling family as the shelf name plate; long copy **wraps** and the plate **scrolls vertically** when content overflows (scrollbar styling matches the shelf strip). The plate is **empty** when the pointer is not over a tableau card, **foundation** top card, or column badge holder. While a **foundation** top card, **tableau** card, or **column badge holder** is the active inspect target, that target shows a **yellow** ring on its visible edges — **`NAME_PLATE_INSPECT_HIGHLIGHT_CLASS`** (darker) for pip cards, **`NAME_PLATE_INSPECT_FACE_CARD_HIGHLIGHT_CLASS`** (lighter) for courts (J/Q/K). When a **court** on the tableau is the inspect target, every other **set mate** on the tableau (same **deck** and **suit** as the aligned-set rule) that is **face up** or **face down** with **transparent** also gets the **lighter** court ring. Tableau inspect also applies when pinned for drag anchor or Shift Card details. While the pointer hovers a **tableau card** with visible identity (**face up**, or **face down** with **transparent** in that column), a **heading** line shows rank and suit (e.g. `King of Spades: Karl Marx - Modern Deck (Blue)` for courts, `6 of Hearts - Classical Deck (Red)` for pip cards). **Tableau** face-down cards without transparent show a **deck-only** heading (`Deck name (Color)`, e.g. `Classical Deck (Red)`) but still hide rank, suit, person, and set; **card** and **column** effect lines are always shown. **Foundation** top cards use the full heading when face-up (foundation cards are normally face-up after play). Typography matches the **shelf name plate** (heading **`text-xs`/`font-semibold`**, detail lines **`text-[10px]`**). Below the heading, **two columns**: (1) **Card effects**, **Column effects**; (2) **Set**, **Set power** — column (2) is **blank** unless the card is a court (J/Q/K). **Set** uses `Deck name (Color) - Suit theme (Suit)` (e.g. `Classical Deck (Red) - Ethics & Moral Philosophy (Hearts)`). Each **deck** in a pair has a **`name`** and **`color`** (`red` | `blue`) in `DeckInPair`; **deck 1** is always **red**, **deck 2** always **blue**, and **`color`** selects the shared back art (`back-deck1.png` / `back-deck2.png`) and fallback gradient. Hovering a **column badge holder** shows centered heading **`Column NN`** (1-based, zero-padded, e.g. `Column 01`) and a centered **Column Effects:** line only (no card-effects row). While **dragging** a tableau run, the plate shows the **anchor** card until **drop** or cancel. While **Shift** Card details is open for a tableau card, the plate **pins** that card until the dialog closes (same idea as the shelf name plate for jokers).

**Stock**

- To the right of the Foundation.
- Face-down backs show **one card per remaining deal** (up to **`min(rules deals, stockMaxVisibleDeals)`**), with **vertical** offset only between backs. Each back uses the **blue or red deck palette** of the **actual stock card** that will be the **first card popped** when that deal runs (same pop/joker rules as dealing); the count of backs matches how many full deals the stock can still complete, capped by **stockMaxVisibleDeals** when rules deals are higher.
- The **face-down stack** sits in a **fixed-height** region for that game’s **deals** (see **stockMaxVisibleDeals**, **`stockStackRegionHeightPx`**, and **stockCardOffset** in `src/constants/dimensions.ts`); that reserved height does not shrink as the stock empties during play.
- When the stock has **no cards left** (all deals from the stock have been performed), the stock area shows a **dashed** card outline (**2px** stroke, same size and style as an **empty foundation** slot) and no face-down stack.
- Double clicking on the stock will execute the next deal.

**Shelf**

- To the left of the Foundation.
- Inner padding uses **shelfVerticalPad** and **shelfHorizontalPad** so jokers sit inset from the shelf border consistently. The shelf panel height is **cardHeight + 2 × shelfVerticalPad** (**shelfPanelHeightPx**) so there is **shelfVerticalPad** above and below the shelf cards.
- Jokers and set-power instances on the shelf use horizontal step **`max(0, cardWidth − shelfOverlap)`** (first card always flush with the inner left of the shelf). When **`shelfOverlap` &lt; cardWidth**, that step gives about **`shelfOverlap` pixels of overlap** with the card to the left; when **`shelfOverlap` ≥ cardWidth**, step is 0 (cards stacked on one x) and **later cards paint above earlier ones**. If the strip exceeds **shelfWidth**, it **scrolls horizontally**.
- **Pointer hover:** The item under the pointer is highlighted only when that item is the **topmost** shelf card at that point (overlapping regions use normal hit testing so a card behind another does not hover). The highlighted item is drawn in front and scaled by **`SHELF_CARD_HOVER_SCALE`** (default matches **110%**) from the **centre** of the card. The shelf strip uses extra **bleed** around the scroll area (see **`shelfHoverScaleBleedPx`** in `src/constants/dimensions.ts`) and **overflow** so the scaled card is not clipped by inner padding or the shelf border.
- Contains all jokers that have been dealt and all set power instances that have been created.
- Each joker and set power instance has a badge indicating how many charges it has.
- When a joker or set power has zero charges it stays in the shelf but the **card face** is shown **greyed out** (reduced saturation/brightness plus a light grey wash in **`shelfDepletedCardWash`** in `colors.ts`); the **charge badge** stays at full opacity with its own depleted styling.
- **Card details (inspect mode):** Hold **Shift** to inspect (question-mark cursor); shelf **jokers** scale by **`SHELF_CARD_INVESTIGATE_SCALE`** (default **1.1**) and show the same **sky-blue highlight** on hover, and open Card details on **Shift+click** (same dialog as the Deck Popup: large face, heading, and body). **Double-click** (without **Shift**) still triggers or cancels **powers** as before. While **Power Target** mode is active, shelf **Shift+click** does not open Card details (**Shift** cancels targeting). While Card details for that joker is open, the joker **keeps** the same **hover** treatment (brought to the front and scaled) even if the pointer moves onto the dialog; when the dialog closes, hover remains only if the pointer is still over that joker’s bounds, otherwise it returns to normal immediately.
- **Name plate:** Directly **below** the shelf panel (fixed height **`shelfNamePlateHeightPx`**, gap **`shelfNamePlateGapPx`**) an empty name plate is always visible. While the pointer hovers a shelf joker, it shows that joker’s **name** and **power name** from the deck-pair catalog (same labels as Card details). When a **targeted** power is armed (double-click), the plate **keeps** that joker’s labels until the power is committed on a target or cancelled (Escape / Shift / double-click the joker again).

**Game Bar**

- Above the Foundation.
- **Layout:** **Seed** on the **left** (after the initial deal animation completes for a new game or restart, the bar shows an en-dash until then). A **copy icon** beside the seed copies **that same string** to the clipboard when the seed is visible (what you see is what you paste). **Moves** and **Score** are **centered** between the seed and the right-hand controls. **Score** uses **one decimal place**, per scoring rules.
- **Right:** buttons for **Deck** (opens the Deck Popup) and **Stock** (opens the Stock Popup). Only one of these popups is shown at a time; opening one closes the other.

**New Game Popup**

- Opened when the user chooses **New Game** from the Actions menu (or equivalent). It does **not** open automatically on login or when showing the cleared board.
- Each time the popup opens, **columns**, **deals**, **deck pair**, and **joker count** default to the **last played game’s** values (persisted in the browser when a game is saved or started; **not** cleared when the user ends a game). The **seed** field is always **empty** on open so **Start Game** uses a **new random shuffle** with those layout options unless the user types or pastes a seed. If no prior configuration exists (first visit), defaults are **8** columns, **6** deals, **0** jokers, default deck pair, and an **empty** seed.
- **Seed format:** `CC-DDD-XXX-SSSSSSSSSSSSSS` as in **Setup** above (hyphens required). A valid **`ws1:`** replay string is still accepted for backwards compatibility.
- When the seed field is **empty**, **Start Game** builds a new formatted seed using the current **columns**, **deals**, and **deck pair** plus a random 14-digit shuffle key, and the chosen **joker count**.
- When the seed field contains **any** non-whitespace text, **columns**, **deals**, and **deck pair** are **disabled** and show the values from the parsed seed (**formatted** or **`ws1:`**). The **joker count** control is **always enabled**; its value is used when starting the game (including for formatted seeds, which do not encode joker count).
- If the seed text is not empty and is neither a valid formatted seed nor a valid **`ws1:`** payload, or validation fails (e.g. columns × deals > 104), the dialog shows **error text** and **Start Game** is disabled (same for **Return** / Enter).
- **Escape** or clicking the backdrop (outside the dialog panel) dismisses the popup the same way as **Cancel**.
- **Return** (main or keypad; the DOM reports this as **Enter** / **NumpadEnter**) confirms and starts the game when the configuration is valid (same as **Start Game**).

**Deck Popup**

- Opened from the **Deck** button on the game bar while a game with cards in play is active; **Escape**, **Close** (bottom right of the panel), or clicking the **backdrop** dismisses it — **unless** the **Card details** dialog is open on top (see below), in which case those actions dismiss **only** the card details first. It is dismissed when **New Game** or **End Game** dialogs open, when the in-progress game is cleared, or when the board has no cards.
- The heading is the deck pair **display name** only (e.g. **Western Philosophy**). The panel width fits the widest row (13 cards across two decks) plus horizontal padding; each card row is **horizontally centred**. Deck Popup layout uses **`deckPopupCardWidth`**, **`deckPopupCardHeight`**, **`deckPopupColumnPad`**, **`deckPopupHorizontalEdgePad`**, **`deckPopupVerticalEdgePad`**, and **`deckPopupFaceDownBackOpacity`** in `src/constants/dimensions.ts`. The nested **Card details** dialog uses **`cardDetailsPopupImageWidth`**, **`cardDetailsPopupImageHeight`**, and **`cardDetailsPopupGapPx`** for the large face image and column gap; court/joker portrait inset and ace pip padding use the helpers **`cardDetailsPortraitInsetPx()`** and **`cardDetailsPipFacePaddingPx()`** (scaled from **`courtJokerPortraitPaddingPx`** and **`cardPipFacePaddingPx`** vs the in-game card width) so framing matches **`CardView`**. **Colours** for the Deck Popup and Card details (light-green panels, scrims, borders, text, and close buttons) live in **`src/constants/colors.ts`** (**`deckPopupBackdrop`**, **`deckPopupPanelBackground`**, **`cardDetailsPopupBackdrop`**, **`cardDetailsPopupPanelBackground`**, **`popupLightPanelBorder`**, **`popupLightPanelTitleText`**, **`popupLightPanelMutedText`**, **`popupLightPanelDivider`**, **`popupLightPanelBodyText`**, **`cardDetailsPopupImageWellBackground`**, **`popupLightCloseButtonBackground`**, **`popupLightCloseButtonBorder`**, **`popupLightCloseButtonText`**).
- Shows all cards in the game’s Deck Pair.
- A row at the top for any jokers in the deck. When **eight** jokers are shown, the first **four** (deck 1) and second **four** (deck 2) are separated by **triple** the normal horizontal card gap (**`3 × deckPopupColumnPad`** in `dimensions.ts`) so the two decks read as two groups.
- A row for each suit (i.e. 8 rows: Deck 1 - Spades, Clubs, Diamonds, Hearts then Deck 2 - Spades, Clubs, Diamonds, Hearts).
- Cards in each row ordered from Ace up to King.
- **Dealt** vs **face-down in the popup:** A card still in the **stock** pile, or **face down** on the **tableau**, uses the **`deckPopupFaceDown`** **`CardView`** mode: the full **face** art is drawn, then the standard **card-back bitmap** at **`deckPopupFaceDownBackOpacity`** (default **0.5** in `dimensions.ts`) on top. Once a card has left the stock and is **face up** on the tableau, foundation, or shelf, it is shown **face up** only (no back overlay).
- **Browse from Decks:** From **`/decks`**, choosing an **unlocked** pair opens the same panel layout for that pair with **every** card **face up** (no stock / tableau state). **`DeckCatalogPopup`** in `src/components/game/DeckCatalogPopup.tsx` uses **`catalogDeckPopupSnapshot`** in `src/lib/deckPopupLayout.ts`.
- **Card effects:** Cards with effects show **badges** on the card in this popup (see **Effects**). If a card has the **transparent** effect and is shown **face-up** in the popup, show the **badge** only (no face+back overlay). If the cell uses **`deckPopupFaceDown`** (still in stock or face-down on tableau), use **face + semi-transparent back** at **`deckPopupFaceDownBackOpacity`** unless the **transparent** effect applies, in which case use **`transparentEffectBackOpacity`**.
- **Card details:** Clicking an **Ace**, **Jack**, **Queen**, **King**, or **Joker** in the Deck Popup opens a **Card details** dialog above the deck panel (pointer cursor on those cards only). The dialog shows a **large** card face on the **left** and on the **right** a **heading** and **body** (no physical deck-within-pair label). For **courts** and **jokers**, the heading is the **person name** and the body is the **bio**; the large face uses **`CardDetailsPortraitFrame`**: the in-game **thumb** (`portraitThumbPath`) appears immediately (often already cached from the board), then the **medium** portrait (`portraitPath`) crossfades in when loaded and decoded; the **frame** overlays when ready. For **Aces**, the heading is **“{Suit plural} the suit of {suit theme name}”**, where **{Suit plural}** is **Spades**, **Clubs**, **Diamonds**, or **Hearts** (matching the card’s suit), **{suit theme name}** comes from **`suitThemes.name`** for that suit, and if its **first character is uppercase** it is changed to **lowercase** so the phrase reads naturally after “the suit of ”. The body is **`suitThemes.description`** for that suit. **Close** (bottom right), **Escape**, or clicking the **backdrop** outside the details panel dismisses **only** this dialog (the Deck Popup stays open until dismissed separately).

**Stock Popup**

- Shows all the cards in the stock.
- Cards are rendered face down.
- **Card effects:** Cards with effects show **badges** on the card in this popup (see **Effects**). If a card has the **transparent** effect, use **face + semi-transparent back** at **`transparentEffectBackOpacity`** (see **Effects**), not the legacy gradient **transparent** display mode.
- The jokers are rendered in a row at the top.
- Each deal is rendered in its own row.
- Note that, while the jokers are each part of a given deal depending on where they are in the stock, they are not rendered in the row for their deal.
- **Implementation:** Opened from the **Stock** button on the game bar while a game with cards in play is active (same gating as the Deck button). **Escape**, **Close**, or the backdrop dismisses it. Layout uses the same mini-card sizing as the Deck Popup (**`deckPopupCardWidth`**, **`deckPopupCardHeight`**, **`deckPopupColumnPad`**, edge padding, and joker gap rules** in `dimensions.ts`) and the same light-panel colours as the Deck Popup in **`colors.ts`**. The panel never shrinks below the size of **one full deal** (**`stockPopupMinPanelOuterWidthPx(columns)`**, **`stockPopupMinPanelOuterHeightPx()`** in `dimensions.ts`). Rows are derived by **`stockPopupLayout(stock, columns)`** in `src/lib/stockPopupLayout.ts`, which mirrors **`dealFromStock`** pop order (jokers collected into the top row; each full deal round’s regular cards in column order in subsequent rows; any remainder is flushed after the last full round).

**Achievement Popup**

- Displays any completed achievements at the end of a game.
- For each completed achievement it shows: Name, Requirements, Rewards.

The game is saved to the database whenever the user clicks save.

The game is saved to local storage after each move.

A game save includes both the current state and the entire history. **Ideally** the user can **undo all the way back to the start of the game**; if that proves impractical (storage, performance, or product limits), a narrower limit may be introduced later.

**End Game:** Choosing **End Game** opens the confirmation dialog directly (no server-save prompt). **OK** or **Enter** / **Return** confirms (except when focus is on **Cancel** or the seed **copy** control). When the user confirms, the in-progress game and local save are cleared; achievements are evaluated when that flow exists.

A game ends when the user confirms **End Game** in the action menu (including via **Enter** / **Return** in that dialog when it applies).

### App chrome (authenticated)

- The **Game**, **Achievements**, **Decks**, **Hall of Fame**, and **Settings** views use a **title bar** with a **hamburger** control on the **left** (opens the navigation drawer), then **“WILD SPIDER”**, **“: ”**, and the **current view name** (e.g. **Game**, **Decks**).
- The drawer lists **Game**, **Achievements**, **Decks**, **Hall of Fame**, and **Settings** for moving between views.
- **`GameApp`** stays mounted in **`AuthAppChrome`** while the user browses other views (hidden with CSS) so returning to **Game** does not re-fetch settings or show a loading gate.

### Achievements View

Lists all the achievements: Name, Requirements, Rewards, Completion status.

### Decks View

Lists **all deck pairs** in the game.

Choosing an **unlocked** pair’s name opens the **Deck Popup** for that deck pair with **all cards face up** (same layout as in-game: joker row when applicable, then eight suit rows). **Locked** pairs are listed with a **Locked** label and cannot be opened.

**Implementation:** Route **`/decks`**. Uses **`colors.decksListViewBackground`** (billiard felt) for the page body. Title bar and navigation drawer are provided by **`AuthAppChrome`** (same title pattern as **`GameShell`** on **`/`**). **`DeckCatalogPopup`** renders the browse-only popup.

### Hall of Fame View

Shows all users ranked by achievement points.

Shows the top ten users by game score for each game setup for a given deck pair that has been played by any user.

Any deck pair setup that has more than 10 users who achieved 100 points is hidden.

When two users **tie** on the sorted metric in a Hall of Fame list, the tie is broken by **date-time** as follows: use the **`completed_at`** timestamp on the **user achievement** record when the ranking is driven by achievement progress or achievement points. When the ranking is **only** by **game score** for a setup (no achievement row defines the tie), use the **`ended_at`** timestamp on the **completed game** that produced that score. **Earlier** date-time ranks **above** later.

### Settings View

Allows the user to edit the following settings:

- Play sound effects
- Confirm before saving game — when **on** (default), choosing **Save Game** from the Actions menu (or **Alt+Shift+S**) opens a confirmation dialog before the server save runs; when **off**, save starts immediately.

Has an OK button (saves edits) and a Cancel button (reverts edits).

## Animation Notes

### Starting a new game

When a new game is started, the engine builds the shuffled tableau and stock (same rules as **Setup** above). While the **initial deal animation** runs, the UI shows an empty tableau; the **stock** area shows **only the back of the current top stock card** (the real card backs from `game.stock`, advancing as each flight **starts** so the next back appears as the previous card leaves the pile). Each tableau card is animated in **deal order** (one card into column 0, then column 1, … then the next round), **from the stock pile** (same origin geometry as a stock deal).

Each flight uses **cardDealDuration**. Face-down cards fly **face down**; the eventual **face-up column tops** fly **face up** so they match the final state when they land. **cardDealDelay** is the **start-to-start** spacing between initial-deal flights (same overlapping rules as stock deals). When the last flight completes, the full game state (including stock) is committed and saved. **Escape** during the initial deal skips any remaining flights and commits the same final state immediately (same as if the animation had finished).

The first card dealt into a tableau column is placed on the column head at the **top** of the stack; subsequent cards are placed **below** the previous using **tableauColumnFaceDownCardOffset** or **tableauColumnFaceUpCardOffset** according to whether the card above is face down or face up (see `dimensions.ts`).

The delay between each card being turned face up will be determined by **cardDealFaceUpDelay** (used elsewhere; initial deal uses the final face-up flags on the last cards of each flight as above).

### Performing a deal

When a deal is performed each card will be separately animated moving face down from the stock to its tableau column. **Escape** during this animation skips any remaining deal flights and commits the final layout (same as when the last flight completes).

When a card is animated moving away from the stock, the back of the next card will become visible.

As each card reaches its tableau column it should be flipped face up.

If any of the cards dealt are a joker then they will be animated moving to the shelf and will be turned face up when they get there.

The timing of the animation of a card to move from the stock to its place in the tableau column will be determined by **cardDealDuration**.

The timing of the animation of a joker to move from the stock to the shelf will be determined by **cardJokerDealDuration**.

**cardDealDelay** is **start-to-start** between flights for a stock deal (same as in “Starting a new game” above); flights may overlap when delay is shorter than the relevant flight duration.

### Dragging and dropping cards

When the user clicks a card or cards that can be legally moved and drags them they will move with the mouse.

When the user drops the card or cards:

- If they are in the drop area for a column in which they can be legally placed then they will be animated moving from the drop point into place in their new column (this does not get a sound effect).
- If they are over a foundation slot into which they can be legally placed then they will be animated moving from the drop point into the foundation slot (this does not get a sound effect). While that animation runs, the **previous** top card in that slot (if any) stays visible underneath until the incoming card finishes settling.
- Otherwise they will pop back to their original position.

## Sound Effects Notes

- **cardDealt:** Played whenever a card is animated moving from the stock to the tableau.
- **cardPlaced:** Played whenever a card is placed in the tableau, foundation or shelf.
- **cardFlipped:** Played whenever a card is **flipped** between face up and face down by **normal play** (dealing, exposing a face-down card, etc.). Powers do not flip cards, so power effects do **not** trigger this sound. **Initial deal only:** `cardFlipped` plays for each flight that places a **face-up** tableau card (`InitialDealEntry.faceUp`, i.e. the visible column top), not for buried tableau cards or shelf jokers. **Stock deals:** plays for **every** card. **Deal flights (stock + initial):** the cue is scheduled partway through each relevant flight’s duration (`cardFlippedDuringDealProgress` in `src/constants/timings.ts`), not after the motion fully completes, so it stays aligned with the easing.
- **powerTriggered:** Played whenever a power is triggered.
- **powerTargeted:** Played whenever a power is targeted.

**Implementation (Stage 2):** The app loads optional **`public/sounds/<name>.mp3`** files when present; missing files use a small built-in synthesizer. For development, **`/dev/sounds`** lists **CC0 candidate clips** (WAV under `public/sounds/candidates/<effect>/`) with inline players, and buttons that call the same `playSound()` path as the game (MP3 or synth). Credits and source links: **`public/sounds/CREDITS.md`**. After you pick finals, export to MP3 as `public/sounds/<name>.mp3` and record each shipped file in **CREDITS.md**.

There should be a constants file that contains all colour values so they can be edited in one place (including Deck Popup and Card details scrims, light-green panel fills, chrome, and close buttons — see **`deckPopupBackdrop`**, **`deckPopupPanelBackground`**, **`cardDetailsPopupBackdrop`**, **`cardDetailsPopupPanelBackground`**, **`popupLightPanel*`** and **`popupLightCloseButton*`** in **`src/constants/colors.ts`**).

There should be a constants file that contains all of the length definitions, e.g. offset of cards in the stock, **shelfWidth**, **shelfOverlap**, **shelfVerticalPad**, **shelfHorizontalPad**, **shelfPanelHeightPx**, **columnSpacing** (gap between tableau columns and between foundation slots), **stockMaxVisibleDeals**, **`stockStackRegionHeightPx`** / **`shelfFoundationStockStripMinHeightPx`** (layout helpers derived from rules **deals**), **`gameViewScrollWhenFoundationWithinPxOfViewportBottom`** (when the foundation column is this close to the viewport bottom, tableau uses viewport-floor drop heights and internal scroll), Deck Popup sizing (**`deckPopupCardWidth`**, **`deckPopupCardHeight`**, **`deckPopupHorizontalEdgePad`**, **`deckPopupVerticalEdgePad`**, **`deckPopupColumnPad`**, **`deckPopupFaceDownBackOpacity`**), Deck Popup **Card details** sizing (**`cardDetailsPopupImageWidth`**, **`cardDetailsPopupImageHeight`**, **`cardDetailsPopupGapPx`**, **`cardDetailsPortraitInsetPx()`**, **`cardDetailsPipFacePaddingPx()`**), pointer-hover scales (**`SHELF_CARD_HOVER_SCALE`**, **`TABLEAU_DRAGGABLE_HOVER_SCALE`**, plus **`shelfHoverScaleBleedPx`** used by the shelf), and timings, e.g. dealDuration.

There should be a constants file that defines the achievement parameters and the code should be structured so that adding a new achievement or editing an existing one should just require editing this file.

There should be a constants file that defines all powers and the code should be structured so that adding a new power or editing an existing one should just require editing this file.

There should be a constants file that defines all the deck pairs and their parameters and the code should be structured so that adding a new deck pair or editing an existing one just requires editing this file and, when art is ready, adding the optional portrait, frame, back, and joker image files under `public/gameArt/` as described in the deck pair section above.

## Core Stack

### Frontend

Next.js (React) + TypeScript  
Tailwind CSS

### Backend

Supabase  
Postgres database  
Auth (sign up / login / password reset)  
Row-Level Security

### Hosting

Vercel for the Next.js app  
Supabase hosts DB + auth

### Version Control

Git + GitHub repo
