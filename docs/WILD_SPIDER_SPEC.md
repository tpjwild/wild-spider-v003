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

The tableau is dealt from a shuffled deck of the non-joker cards and then any jokers are shuffled into the stock.

The initial shuffle and the shuffling of jokers into the stock are generated from a seed so that a given seed always gives the same order (but not necessarily the same **numberOfJokers** because that is dependent on which jokers are unlocked at the time).

The tableau will thus initially contain **104 − numberOfColumns × numberOfDeals** cards. These are dealt face down into the columns from left to right. If there are not enough cards to deal the same number into each column then the columns with an extra card will be distributed aesthetically using an algorithm to be determined.

Initially the top card of each non-empty column in the tableau is face up and the rest are face down.

Initially the stock will contain **numberOfColumns × numberOfDeals + numberOfJokers**.

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

### Game scoring

1 point for every face up card immediately on top of another face up card where the suit matches and the rank of the top card is one less than the rank of the bottom card.

−1 point for every card placed in the foundation.

½ point for every complete run from King to Ace of a single suit in the tableau.

−1 point for every undone move.

Thus the maximum number of points for a game is 100.

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

## Sets

The face cards for a given suit of a given deck are called a set.

Each set has a unique set power.

A set power instance is created the first time in a given game that a set is aligned (i.e. the jack is on the queen which is on the king).

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
- An action menu on the right — allows the user to take different actions on each view:

**Game**

- New Game
- Restart Game
- Save Game
- End Game
- Logout

**Achievements** — Logout

**Decks** — Logout

**Hall of Fame** — Logout

**Settings** — Logout

### View Summary

- **Login page:** User lands here when they are not logged in. Cannot otherwise be navigated to.
- **Game:** Where the game itself is played.
- **Achievements:** Lists all achievements, both achieved and not yet achieved.
- **Decks:** Lists all decks available in the game. Decks that have been unlocked can be inspected.
- **Hall of Fame:** Lists all users ranked by various things.
- **Settings:** Allows the user to edit game settings.

### Login Page

Allows the user to login and create an account if they don’t have one.

After login the user is taken to the game view. If there is a saved game it will be loaded.

### Game View

Cards in the game can be rendered in the following modes:

- Face Up
- Face Down
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

#### The Game View has the following elements

**Tableau**

- In the middle of the window.
- Contains a tableau column for each column in the game.
- Each tableau column has a drop area that extends to the bottom of the tableau.
- Above each tableau column is a square element called the badge holder which displays badges for any effects that have been applied to the column.
- The head of each tableau column has a white outline the size and shape of a card.
- The first card in the column is placed on the tableau column head. Subsequent cards are placed on top with each card having a vertical offset defined by **tableauColumnCardOffset**.

**Foundation**

- Above the Tableau.
- Has 8 foundation slots (two decks × four suits).
- Each foundation slot has a white outline of a card which is only visible if the slot is empty.

**Stock**

- To the right of the Foundation.
- The first card of each of the remaining deals is rendered face down with an offset giving a visual indication of the number of remaining deals.
- Double clicking on the stock will execute the next deal.

**Shelf**

- To the left of the Foundation.
- Contains all jokers that have been dealt and all set power instances that have been created.
- Each joker and set power instance has a badge indicating how many charges it has.
- When a joker or set power has zero charges it stays in the shelf but gets a treatment to show it is depleted.

**Game Bar**

- Above the Foundation.
- Shows the game seed on the left.
- Shows number of moves to the right of the game seed.
- Shows current score in the middle.
- Has buttons on the right: Deck (opens Deck Popup), Stock (opens Stock Popup).

**New Game Popup**

- Opened when the user starts a new game.
- Allows the user to choose the number of columns, number of deals and deck pair.
- User can also enter a game seed which means **numberOfColumns**, **numberOfDeals** and the deck pair will be updated to match the values for the seed and **numberOfJokers** will be determined by the number of jokers currently unlocked for the deck pair.

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

A game save includes both the current state and the entire history so that the user can undo as far back as they want.

A game ends when the user clicks End Game in the action menu.

### Achievements View

Lists all the achievements: Name, Requirements, Rewards, Completion status.

### Deck Pairs View

Lists all deck pairs.

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

### Settings View

Allows the user to edit the following settings:

- Play sound effects
- Confirm before saving game

Has an OK button (saves edits) and a Cancel button (reverts edits).

## Animation Notes

### Starting a new game

When a new game is started, the tableau and foundation will be cleared, the decks will be shuffled and the back of the topmost card in the decks will be rendered in the stock.

As the cards are dealt from the stock into the tableau columns they will be animated moving face down from the stock to their column.

One card is dealt into each column and then a second into each column and so forth.

When a card is animated moving away from the stock, the back of the next card will become visible.

The first card dealt into a tableau column will be placed on column head and subsequent cards will be placed with a vertical offset from the card beneath them of **tableauColumnCardOffset**.

When all required cards are dealt, the top card in each non-empty column will be turned face up.

The timing of the animation of a card to move from the stock to its place in the tableau column will be determined by **cardDealDuration**.

The delay between each card being dealt will be specified by **cardDealDelay**.

The delay between each card being turned face up will be determined by **cardDealFaceUpDelay**.

### Performing a deal

When a deal is performed each card will be separately animated moving face down from the stock to its tableau column.

When a card is animated moving away from the stock, the back of the next card will become visible.

As each card reaches its tableau column it should be flipped face up.

If any of the cards dealt are a joker then they will be animated moving to the shelf and will be turned face up when they get there.

The timing of the animation of a card to move from the stock to its place in the tableau column will be determined by **cardDealDuration**.

The timing of the animation of a joker to move from the stock to the shelf will be determined by **cardJokerDealDuration**.

The delay between each card being dealt will be specified by **cardDealDelay**.

### Dragging and dropping cards

When the user clicks a card or cards that can be legally moved and drags them they will move with the mouse.

When the user drops the card or cards:

- If they are in the drop area for a column in which they can be legally placed then they will be animated moving from the drop point into place in their new column (this does not get a sound effect).
- If they are over a foundation slot into which they can be legally placed then they will be animated moving from the drop point into the foundation slot (this does not get a sound effect).
- Otherwise they will pop back to their original position.

## Sound Effects Notes

- **cardDealt:** Played whenever a card is animated moving from the stock to the tableau.
- **cardPlaced:** Played whenever a card is placed in the tableau, foundation or shelf.
- **cardFlipped:** Played whenever a card is flipped.
- **powerTriggered:** Played whenever a power is triggered.
- **powerTargeted:** Played whenever a power is targeted.

## Technical Notes

There should be a constants file that contains all colour values so they can be edited in one place.

There should be a constants file that contains all of the length definitions, e.g. offset of cards in the stock, and timings, e.g. dealDuration.

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
Auth (sign up / login)  
Row-Level Security

### Hosting

Vercel for the Next.js app  
Supabase hosts DB + auth

### Version Control

Git + GitHub repo
