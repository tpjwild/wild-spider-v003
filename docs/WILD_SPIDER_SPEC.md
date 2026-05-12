# Wild Spider Spec Doc

## Overview

The web app will play a variant of Spider Solitaire with the addition of jokers and achievements.

## Game Rules

### Objective

Score as many points as possible by building as many sequences of cards in descending order of the same suit.

### Game Config

The config of each game is determined by the following parameters:

- **numberOfColumns:** The number of columns in the tableau, maximum of 10.
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

Cards can be moved as a group if both the rank sequence and the suits match.

### Turning Face‑Down Cards

When you move the top face‑up card(s) away from a pile and expose a face‑down card underneath, that card is immediately turned face up.

### Empty Columns

Any single card or valid same‑suit descending sequence can be moved to an empty tableau column.

Empty columns are very powerful because they let you temporarily park cards and rearrange runs.

### Dealing New Rows from the Stock

When the user decides to deal, a single card is placed face up on each tableau column.

A deal cannot be performed if there are any empty columns unless there are insufficient cards in the tableau to fill them.

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

Each Deck Pair has a deck pair theme, e.g. Philosophers, Mathematicians.

Each Deck Pair has a suit theme name and suit theme details for each suit.

e.g. Suit theme name: Metaphysics & Ontology – “The suit of hidden foundations”

e.g. Suit theme details: This suit explores the basic structure of reality: what exists, what it means to be, and how things hang together at the deepest level. Its philosophers ask what kinds of things are real—minds, bodies, numbers, causes, possibilities—and how those underlying structures shape everything else.

Each deck has four jokers.

Each face card and joker for a given deck depicts a different person relevant to the deck’s theme.

Each joker and face card has:

- Person Name
- Person Bio
- Card face image

Each card face image has two image elements:

- Person Portrait: A png picture of the person
- Card frame: An svg file of the card frame that is put on top of the portrait

Each deck has one image element:

- Card back image: A png

## Jokers

Each deck has one joker when it is unlocked and 3 more that can be unlocked via achievements.

Each joker has a unique joker power and a number of charges.

Jokers are never placed on the **tableau**. After a joker is dealt from the stock it goes to the **shelf** only; jokers are not moved onto columns by the player or by powers.

## Sets

The face cards for a given suit of a given deck are called a set.

Each set has a unique set power.

A set power instance is created the first time in a given game that a set is aligned (i.e. the jack is on the queen which is on the king).

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

- **Immediate:** Will take effect immediately, e.g. make all jokers transparent.
- **Targeted:** Will only take effect when the user selects a target, e.g. make the selected card transparent.

When a targeted power is triggered, if the user clicks on an invalid target or hits escape then the power’s triggering is canceled and no charge is consumed.

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

Powers **do not flip** cards between face up and face down. A power may change how a card is rendered (for example the **transparent** mode) but card orientation is only changed by normal dealing and player moves as described elsewhere in this document.

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
- Save Game — from the Actions menu: while the server request runs, a full-screen spinner is shown; when it succeeds, a short **Save complete** dialog confirms the save (errors use the dismissible error strip). Saving from the **End game** save prompt uses the same spinner, then returns to the end-game flow without that dialog.
- Load Game — asks for confirmation, then replaces the in-progress game with the single saved row from the server (same as resume on login). While the request runs, a loading indicator is shown. Disabled when not signed in, when Supabase is not configured, while a deal animation is running, or while a load is already in progress.
- End Game — opens a confirmation dialog showing **final score** and **game configuration** (columns, deals, deck pair, joker count, seed with the same **copy icon beside the seed** as on the game bar), plus **OK** / **Cancel**. **OK** clears the in-progress game and local save and returns to the empty game screen **without** opening the New Game dialog (the user opens New Game when they want). **Cancel**, **Escape**, or clicking the **backdrop** outside the dialog panel closes the dialog and leaves the game unchanged.
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
- **Decks:** Lists **all deck pairs** available in the game. Each deck pair’s name links to its **Deck Pair Details** view when that deck pair is **unlocked** (locked pairs are still listed but are not inspectable in detail until unlocked).
- **Hall of Fame:** Lists all users ranked by various things.
- **Settings:** Allows the user to edit game settings.

### Login Page

Allows the user to log in and create an account if they don’t have one. The login experience includes **password reset** (e.g. email link via Supabase Auth).

After login the user is taken to the game view. **If there is a saved in-progress game for the user, it is loaded.**

### Saved games (database and local)

The user may have **at most one in-progress saved game** in the database per account. Choosing **Save Game** writes (or replaces) that single saved row. **Local storage** also stores the current state after each move for crash recovery and should mirror the same single in-progress game concept.

### Game View

Cards in the game can be rendered in the following modes:

- Face Up
- Face Down — the back design uses **blue** tones for the **first** standard 52-card deck in the box and **red** tones for the **second** 52-card deck (by card identity in the double deck). Jokers use the same two palettes by joker id until deck-specific joker art exists.
- Transparent (rendered face up with a semitransparent image of the card’s back on top)

The card will also have a badge for each active effect it has.

If there are more than two effects it will have a single badge with a number indicating the number of effects.

Each badge has a tool tip describing the effect or effects it represents.

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
- The **stock** stack uses a **fixed vertical height** for the face-down pile for the whole game (from **stockMaxVisibleLayers** and **stockCardOffset**); only the number of visible backs changes as deals run down.

#### The Game View has the following elements

**Tableau**

- In the middle of the window.
- Contains a tableau column for each column in the game.
- Each tableau column has a drop area that extends to the bottom of the tableau.
- Above each tableau column is a square element called the badge holder which displays badges for any effects that have been applied to the column.
- The tableau column **drop area** has no visible border or background in normal play; while dragging, a valid target column may show a light tint only. **Empty** columns show a **dashed** white card-sized outline (**2px** stroke) at the **column head** only (same style as an empty foundation slot).
- The first card in the column (the base of the pile) is placed on the tableau column head at the **top** of the stack. Each subsequent card is offset **vertically downward** from the previous by **tableauColumnCardOffset** (higher cards in the pile have higher stacking order so the face-up tail remains readable).

**Foundation**

- Above the Tableau.
- Has 8 foundation slots (two decks × four suits).
- Each foundation slot has a **dashed** white outline (**2px** stroke) the size and shape of a card when the slot is **empty**; drag-over uses the same dashed border (amber tint + light fill), not a second outline, so a valid target does not read as two nested rectangles.

**Stock**

- To the right of the Foundation.
- Face-down backs show **one card per remaining deal** (up to **stockMaxVisibleLayers**), with **vertical** offset only between backs. Each back uses the **blue or red deck palette** of the **actual stock card** that will be the **first card popped** when that deal runs (same pop/joker rules as dealing); the count of backs matches how many full deals the stock can still complete, not a fixed eight.
- The **face-down stack** sits in a **fixed-height** region (see **stockMaxVisibleLayers** / **stockCardOffset** in constants); that height does not shrink as the stock empties.
- When the stock has **no cards left** (all deals from the stock have been performed), the stock area shows a **dashed** card outline (**2px** stroke, same size and style as an **empty foundation** slot) and no face-down stack.
- Double clicking on the stock will execute the next deal.

**Shelf**

- To the left of the Foundation.
- Inner padding uses **shelfVerticalPad** and **shelfHorizontalPad** so jokers sit inset from the shelf border consistently. The shelf panel height is **cardHeight + 2 × shelfVerticalPad** (**shelfPanelHeightPx**) so there is **shelfVerticalPad** above and below the shelf cards.
- Jokers and set-power instances on the shelf use horizontal step **`max(0, cardWidth − shelfOverlap)`** (first card always flush with the inner left of the shelf). When **`shelfOverlap` &lt; cardWidth**, that step gives about **`shelfOverlap` pixels of overlap** with the card to the left; when **`shelfOverlap` ≥ cardWidth**, step is 0 (cards stacked on one x) and **later cards paint above earlier ones**. If the strip exceeds **shelfWidth**, it **scrolls horizontally**.
- Contains all jokers that have been dealt and all set power instances that have been created.
- Each joker and set power instance has a badge indicating how many charges it has.
- When a joker or set power has zero charges it stays in the shelf but gets a treatment to show it is depleted.

**Game Bar**

- Above the Foundation.
- **Layout:** **Seed** on the **left** (after the initial deal animation completes for a new game or restart, the bar shows an en-dash until then). A **copy icon** beside the seed copies **that same string** to the clipboard when the seed is visible (what you see is what you paste). **Moves** and **Score** are **centered** between the seed and the right-hand controls. **Score** uses **one decimal place**, per scoring rules.
- **Right:** buttons for **Deck** (opens Deck Popup) and **Stock** (opens Stock Popup).

**New Game Popup**

- Opened when the user starts a new game.
- Each time the popup opens, **columns**, **deals**, **deck pair**, and **joker count** default to the **last played game’s** values (persisted in the browser when a game is saved or started; **not** cleared when the user ends a game). The **seed** field is always **empty** on open so **Start Game** uses a **new random shuffle** with those layout options unless the user types or pastes a seed. If no prior configuration exists (first visit), defaults are **8** columns, **6** deals, **0** jokers, default deck pair, and an **empty** seed.
- **Seed format:** `CC-DDD-XXX-SSSSSSSSSSSSSS` as in **Setup** above (hyphens required). A valid **`ws1:`** replay string is still accepted for backwards compatibility.
- When the seed field is **empty**, **Start Game** builds a new formatted seed using the current **columns**, **deals**, and **deck pair** plus a random 14-digit shuffle key, and the chosen **joker count**.
- When the seed field contains **any** non-whitespace text, **columns**, **deals**, and **deck pair** are **disabled** and show the values from the parsed seed (**formatted** or **`ws1:`**). The **joker count** control is **always enabled**; its value is used when starting the game (including for formatted seeds, which do not encode joker count).
- If the seed text is not empty and is neither a valid formatted seed nor a valid **`ws1:`** payload, or validation fails (e.g. columns × deals > 104), the dialog shows **error text** and **Start Game** is disabled (same for **Return** / Enter).
- **Escape** or clicking the backdrop (outside the dialog panel) dismisses the popup the same way as **Cancel**.
- **Return** (main or keypad; the DOM reports this as **Enter** / **NumpadEnter**) confirms and starts the game when the configuration is valid (same as **Start Game**).

**Deck Popup**

- Shows all cards in the game’s Deck Pair.
- A row at the top for any jokers in the deck.
- A row for each suit (i.e. 8 rows: Deck 1 - Spades, Clubs, Diamonds, Hearts then Deck 2 - Spades, Clubs, Diamonds, Hearts).
- Cards in each row ordered from Ace up to King.
- If a card has been dealt it will be rendered face up.
- If a card has not been dealt it will be rendered in transparent mode.
- If a card has had one or more effects applied to it then it will have an icon for each effect. If there are more than three effects it will have a single icon indicating the number of effects.

**Stock Popup**

- Shows all the cards in the stock.
- Cards are rendered face down.
- If a card has had one or more effects applied to it then it will have an icon for each effect. If there are more than three effects it will have a single icon indicating the number of effects.
- If a card has the transparent effect applied to it then it will be rendered in transparent mode.
- The jokers are rendered in a row at the top.
- Each deal is rendered in its own row.
- Note that, while the jokers are each part of a given deal depending on where they are in the stock, they are not rendered in the row for their deal.

**Achievement Popup**

- Displays any completed achievements at the end of a game.
- For each completed achievement it shows: Name, Requirements, Rewards.

The game is saved to the database whenever the user clicks save.

The game is saved to local storage after each move.

A game save includes both the current state and the entire history. **Ideally** the user can **undo all the way back to the start of the game**; if that proves impractical (storage, performance, or product limits), a narrower limit may be introduced later.

**End Game:** When the user chooses **End Game**, if the current state has **not** been saved to the database since the last change, the app **offers to save** before the game is ended and achievements are evaluated.

A game ends when the user confirms **End Game** in the action menu (after any save prompt is resolved).

### Achievements View

Lists all the achievements: Name, Requirements, Rewards, Completion status.

### Decks View

Lists **all deck pairs** in the game.

Each deck pair name is a link to its deck pair details view.

The link to the deck pair details view is only enabled if the deck pair is unlocked.

### Deck Pair Details View

Shows the following details for a given deck pair:

- The four suit themes with their descriptions.
- For each of the decks, a row for each of the jokers, kings, queens and jacks showing both the name, bio and card face image.

Only unlocked jokers are displayed.

### Hall of Fame View

Shows all users ranked by achievement points.

Shows the top ten users by game score for each game setup for a given deck pair that has been played by any user.

Any deck pair setup that has more than 10 users who achieved 100 points is hidden.

When two users **tie** on the sorted metric in a Hall of Fame list, the tie is broken by **date-time** as follows: use the **`completed_at`** timestamp on the **user achievement** record when the ranking is driven by achievement progress or achievement points. When the ranking is **only** by **game score** for a setup (no achievement row defines the tie), use the **`ended_at`** timestamp on the **completed game** that produced that score. **Earlier** date-time ranks **above** later.

### Settings View

Allows the user to edit the following settings:

- Play sound effects
- Confirm before saving game

Has an OK button (saves edits) and a Cancel button (reverts edits).

## Animation Notes

### Starting a new game

When a new game is started, the engine builds the shuffled tableau and stock (same rules as **Setup** above). While the **initial deal animation** runs, the UI shows an empty tableau; the **stock** area shows **only the back of the current top stock card** (the real card backs from `game.stock`, advancing as each flight **starts** so the next back appears as the previous card leaves the pile). Each tableau card is animated in **deal order** (one card into column 0, then column 1, … then the next round), **from the stock pile** (same origin geometry as a stock deal).

Each flight uses **cardDealDuration**. Face-down cards fly **face down**; the eventual **face-up column tops** fly **face up** so they match the final state when they land. **cardDealDelay** is the **start-to-start** spacing between initial-deal flights (same overlapping rules as stock deals). When the last flight completes, the full game state (including stock) is committed and saved. **Escape** during the initial deal skips any remaining flights and commits the same final state immediately (same as if the animation had finished).

The first card dealt into a tableau column is placed on the column head at the **top** of the stack; subsequent cards are placed **below** the previous with a vertical step of **tableauColumnCardOffset**.

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

There should be a constants file that contains all colour values so they can be edited in one place.

There should be a constants file that contains all of the length definitions, e.g. offset of cards in the stock, **shelfWidth**, **shelfOverlap**, **shelfVerticalPad**, **shelfHorizontalPad**, **shelfPanelHeightPx**, **columnSpacing** (gap between tableau columns and between foundation slots), **stockMaxVisibleLayers**, and timings, e.g. dealDuration.

There should be a constants file that defines the achievement parameters and the code should be structured so that adding a new achievement or editing an existing one should just require editing this file.

There should be a constants file that defines all powers and the code should be structured so that adding a new power or editing an existing one should just require editing this file.

There should be a constants file that defines all the deck pairs and their parameters and the code should be structured so that adding a new deck pair or editing an existing one just requires editing this file and adding the required portrait images.

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
