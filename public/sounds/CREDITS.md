# Sound credits

Wild Spider loads optional MP3 clips from `public/sounds/<effect>.mp3`:

- `cardDealt`
- `cardPlaced`
- `cardFlipped`
- `powerTriggered`
- `powerTargeted`

If a file is missing, the app uses a small built-in synthesizer fallback (no network required).

---

## Candidate pack (dev audition)

**Kenney — Interface Sounds (1.0)** — **CC0 1.0** (public domain).

- **Author:** Kenney ([kenney.nl](https://kenney.nl))
- **Asset page:** [Interface Sounds](https://kenney.nl/assets/interface-sounds)
- **License text:** [Creative Commons Zero](https://creativecommons.org/publicdomain/zero/1.0/)
- **Local copy:** `public/sounds/KENNEY_INTERFACE_SOUNDS_LICENSE.txt` (from the pack)

Candidates were extracted from the community mirror **Calinou/kenney-interface-sounds** (WAV files under `addons/kenney_interface_sounds/`), which repackages the same Kenney assets for Godot:

- **Repository:** [github.com/Calinou/kenney-interface-sounds](https://github.com/Calinou/kenney-interface-sounds)

### Files under `public/sounds/candidates/` (original Kenney base names)

| Suggested use   | File in repo                         | Original in pack   |
|-----------------|--------------------------------------|--------------------|
| cardDealt       | `candidates/cardDealt/kenney-drop_001.wav`   | `drop_001.wav`     |
| cardDealt       | `candidates/cardDealt/kenney-click_001.wav`  | `click_001.wav`    |
| cardDealt       | `candidates/cardDealt/kenney-pluck_001.wav`  | `pluck_001.wav`    |
| cardPlaced      | `candidates/cardPlaced/kenney-drop_002.wav`  | `drop_002.wav`     |
| cardPlaced      | `candidates/cardPlaced/kenney-glass_001.wav` | `glass_001.wav`    |
| cardPlaced      | `candidates/cardPlaced/kenney-click_003.wav` | `click_003.wav`    |
| cardFlipped     | `candidates/cardFlipped/kenney-open_001.wav` | `open_001.wav`     |
| cardFlipped     | `candidates/cardFlipped/kenney-glass_002.wav` | `glass_002.wav`    |
| cardFlipped     | `candidates/cardFlipped/kenney-toggle_001.wav` | `toggle_001.wav`   |
| powerTriggered  | `candidates/powerTriggered/kenney-bong_001.wav` | `bong_001.wav`    |
| powerTriggered  | `candidates/powerTriggered/kenney-confirmation_001.wav` | `confirmation_001.wav` |
| powerTriggered  | `candidates/powerTriggered/kenney-maximize_007.wav` | `maximize_007.wav` |
| powerTargeted   | `candidates/powerTargeted/kenney-select_007.wav` | `select_007.wav` |
| powerTargeted   | `candidates/powerTargeted/kenney-tick_002.wav` | `tick_002.wav`   |
| powerTargeted   | `candidates/powerTargeted/kenney-click_005.wav` | `click_005.wav` |

Audition on **`/dev/sounds`** (development only). After you choose finals, export as MP3 to `public/sounds/<effect>.mp3` and add a row below for each **shipped** file.

---

## Shipped MP3s (fill in when you add finals)

When you add real `*.mp3` files next to this doc, list each one:

| File              | Title | Source URL | Licence |
|-------------------|-------|------------|---------|
| _(none yet)_     |       |            |         |
