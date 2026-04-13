# BONELAB Lore Clipboards

An archive and interactive viewer for all lore clipboards extracted from **BONELAB** by Stress Level Zero. Includes a static site that renders each clipboard over the original in-game paper texture with level-appropriate ambient audio and faithful text styling.

---

## Contents

| Path | Purpose |
|------|---------|
| `MonoBehaviour/` | Raw extracted JSON files, organised into level subfolders |
| `docs/` | Static site (served via GitHub Pages) |
| `build_site.py` | Generates `docs/js/data.js` from the JSON files |
| `rename_to_titles.py` | Renames JSON files to their clipboard title |
| `convert_to_wiki.py` | Generates a GitHub Wiki from the JSON files |
| `wiki/` | Generated GitHub Wiki markdown (run `convert_to_wiki.py`) |

---

## Clipboard Archive

88 clipboards across 21 levels, organised into subfolders under `MonoBehaviour/`:

| Level | Clipboards |
|-------|-----------|
| 01 - Descent | 18 |
| 02 - BONELAB Hub | 12 |
| 03 - LongRun | 2 |
| 04 - Mine Dive | 4 |
| 05 - Big Anomaly | 9 |
| 06 - Street Puncher | 1 |
| 09 - Moonbase | 1 |
| 11 - Pillar Climb | 2 |
| 12 - Big Anomaly B | 1 |
| 13 - Ascent | 8 |
| 14 - Home | 3 |
| Big Bone Bowling | 2 |
| Container Yard | 2 |
| Drop Pit | 2 |
| Dungeon Warrior | 1 |
| Halfway Park | 4 |
| Mirror | 2 |
| Museum Basement | 10 |
| Neon District Tac Trial | 2 |
| Rooftops | 1 |
| Tuscany | 1 |

---

## Static Site

The site lives in `docs/` and is designed for GitHub Pages. It renders each clipboard over the original `texture_clipBoardPaper.png` with the custom **Code Pro LC** font, preserves in-game text colouring, and plays ambient audio per level.

### Features

- Grid of all 88 clipboards, filterable by level and searchable by title or body text
- Clipboard viewer styled to match the in-game prop — correct paper texture, portrait aspect ratio, metal clip
- In-game Unity TextMeshPro rich-text tags (`<color>`, `<b>`, `<br>`) converted to HTML, preserving coloured character voices
- Per-level ambient audio (placeholder filenames provided — drop your files in and they play automatically)
- Frosted texture effect at the top of the clipboard when scrolling long entries
- Level badges colour-coded by a rotating palette — no CSS changes needed when adding levels
- Fully client-side, no build step required after running `build_site.py`

### Setup

**Requirements:** Python 3.11+, a modern browser.

#### 1. Organise clipboards into level folders

Place JSON files into named subfolders under `MonoBehaviour/`. The folder name becomes the level key:

```
MonoBehaviour/
  01 - Descent/
    Comms Board.json
    HELP HELP!.json
    ...
  02 - BONELAB Hub/
    ...
```

#### 2. Add level labels

Open `build_site.py` and ensure every folder name has an entry in `LEVEL_LABELS`:

```python
LEVEL_LABELS = {
    "01 - descent": "Descent",
    "02 - bonelab hub": "BONELAB Hub",
    # ...
}
```

The script warns you if a folder is missing a label.

#### 3. Build the data file

```bash
python build_site.py
```

This generates `docs/js/data.js` and copies the paper texture into `docs/`. Re-run whenever you add or move JSON files.

#### 4. Add audio (optional)

Drop audio files into `docs/audio/`. The expected filenames match each level key with spaces replaced by hyphens:

```
docs/audio/
  01-descent.mp3
  02-bonelab-hub.mp3
  03-longrun.mp3
  ...
```

To change a filename or disable audio for a level, edit the `AUDIO_MAP` at the top of `docs/js/app.js` and set `src` to your filename or `null`.

#### 5. Test locally

```bash
cd docs
python -m http.server 8000
```

Open **http://localhost:8000**. A local server is required for audio to work (browsers block audio on `file://` URLs).

#### 6. Deploy to GitHub Pages

In your repository settings, set GitHub Pages to serve from the `docs/` folder on the `main` branch.

---

## Adjusting the Site

### Clipboard font size

Edit the single variable in `docs/css/style.css`:

```css
--paper-font-size: 1.5rem;
```

The title scales automatically at `1.3×` whatever value is set here.

### Adding a new level

1. Create a subfolder under `MonoBehaviour/` with the level name
2. Add the label to `LEVEL_LABELS` in `build_site.py`
3. Add an audio entry to `AUDIO_MAP` in `docs/js/app.js`
4. Run `python build_site.py`

No HTML or CSS changes are needed — the level filter and badge colours update automatically.

### Renaming JSON files to clipboard titles

```bash
python rename_to_titles.py           # dry run — shows what would change
python rename_to_titles.py --confirm # applies the renames
```

Duplicate titles within the same folder are automatically numbered (`Title.json`, `Title 2.json`, etc.). Re-run `build_site.py` after renaming.

### Generating a GitHub Wiki

```bash
python convert_to_wiki.py
```

Outputs one `.md` file per clipboard into `wiki/`, plus a `wiki/Home.md` index. Copy the contents of `wiki/` into your repository's wiki to publish.

---

## File Format

Each JSON file is a Unity `MonoBehaviour` component extracted from the game. The relevant fields are:

```json
{
  "title": "<b><color=#224877>LiftCrew 06 - FantasyLand</color></b>",
  "body":  "<color=#224877>FantasyLand people are actually...<br><br>...</color>"
}
```

Unity TextMeshPro tags used in the data:

| Tag | Meaning |
|-----|---------|
| `<b>` | Bold |
| `<color=#hex>` | Character/faction colour |
| `<br>` | Line break |
| `<line-indent=...>` | Indentation (stripped) |

The site's `tmp-parser.js` converts these to HTML at render time. The Python scripts strip them to plain text for filenames, slugs, and search indexing.

---

## Credits

All lore content is property of **Stress Level Zero**. This project is a fan archive for reference and preservation purposes.
