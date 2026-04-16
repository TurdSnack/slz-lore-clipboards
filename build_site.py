"""
Generate docs/js/data.js from MonoBehaviour JSON files.
Run this whenever you add, move, or update clipboard JSON files.

Folder structure for level assignment:
  MonoBehaviour/
    fantasyland/     ← files here get level="fantasyland"
    liftcrew/
    museum/
    void/
    moon/
    sabrelake/
    mythos/
    (root files)     ← get level="default"

Any subfolder name becomes a valid level key. Add new folders freely —
then add a label below.

Thumbnails (place images in docs/thumbnails/, .jpg .jpeg .png .webp supported):
  Per-clipboard: name matches the JSON filename without extension
                 (e.g. docs/thumbnails/My Clipboard.jpg for My Clipboard.json)
  Per-level:     name matches the level folder key
                 (e.g. docs/thumbnails/01 - descent.jpg)
  Supported formats: .jpg .jpeg .png .webp .bmp
  Per-clipboard takes precedence over per-level when both exist.
"""

import json
import os
import re
import shutil


INPUT_DIR     = os.path.join(os.path.dirname(__file__), "MonoBehaviour")
OUTPUT_DIR    = os.path.join(os.path.dirname(__file__), "docs")
TEXTURE_SRC   = os.path.join(os.path.dirname(__file__), "Texture2D", "texture_clipBoardPaper.png")
TEXTURE_DST   = os.path.join(OUTPUT_DIR, "texture_clipBoardPaper.png")
LOGO_SRC      = os.path.join(os.path.dirname(__file__), "Texture2D", "logo_Monogon_white.png")
LOGO_DST      = os.path.join(OUTPUT_DIR, "logo_Monogon_white.png")
THUMBNAILS_DIR = os.path.join(OUTPUT_DIR, "thumbnails")
THUMB_EXTS    = (".jpg", ".jpeg", ".png", ".webp", ".bmp")

# Human-readable labels for each level folder name.
# Add an entry here whenever you create a new subfolder.
LEVEL_LABELS = {
    "01 - descent":              "Descent",
    "02 - bonelab hub":          "BONELAB Hub",
    "03 - longrun":              "Long Run",
    "04 - mine dive":            "Mine Dive",
    "05 - big anomaly":          "Big Anomaly",
    "06 - street puncher":       "Street Puncher",
    "09 - moonbase":             "Moonbase",
    "11 - pillar climb":         "Pillar Climb",
    "12 - big anomaly b":        "Big Anomaly B",
    "13 - ascent":               "Ascent",
    "14 - home":                 "Home",
    "big bone bowling":          "Big Bone Bowling",
    "container yard":            "Container Yard",
    "drop pit":                  "Drop Pit",
    "dungeon warrior":           "Dungeon Warrior",
    "halfway park":              "Halfway Park",
    "mirror":                    "Mirror",
    "museum basement":           "Museum Basement",
    "neon district tac trial":   "Neon District Tac Trial",
    "rooftops":                  "Rooftops",
    "tuscany":                   "Tuscany",
    "default":                   "Unknown",
}


def build_thumbnail_map() -> dict[str, str]:
    """Return a dict mapping level key → relative web path for its thumbnail."""
    result = {}
    if not os.path.isdir(THUMBNAILS_DIR):
        return result
    for fname in os.listdir(THUMBNAILS_DIR):
        name, ext = os.path.splitext(fname)
        if ext.lower() in THUMB_EXTS:
            result[name.lower()] = f"thumbnails/{fname}"
    return result


def load_entries(thumbnail_map: dict[str, str]) -> list[dict]:
    """Walk INPUT_DIR and all immediate subdirectories for JSON files."""
    entries = []

    def _load_dir(directory: str, level: str) -> None:
        for filename in sorted(os.listdir(directory)):
            filepath = os.path.join(directory, filename)

            # Recurse one level into subdirectories (use folder name as level)
            if os.path.isdir(filepath):
                _load_dir(filepath, filename.lower())
                continue

            if not filename.endswith(".json"):
                continue

            with open(filepath, encoding="utf-8-sig") as f:
                data = json.load(f)

            title = data.get("title", "").strip()
            body  = data.get("body",  "").strip()
            if not title and not body:
                continue  # skip empty template entries

            # Stable ID: level prefix + filename slug
            slug = re.sub(r"[^\w-]", "_", filename.replace(".json", ""))
            entry_id = f"{level}__{slug}" if level != "default" else slug

            entry = {
                "id":     entry_id,
                "source": os.path.relpath(filepath, INPUT_DIR).replace("\\", "/"),
                "title":  title,
                "body":   body,
                "level":  level,
            }

            file_stem = filename.replace(".json", "").lower()
            thumb = thumbnail_map.get(file_stem) or thumbnail_map.get(level)
            if thumb:
                entry["thumbnail"] = thumb

            entries.append(entry)

    _load_dir(INPUT_DIR, "default")
    return entries


def main():
    os.makedirs(os.path.join(OUTPUT_DIR, "js"),  exist_ok=True)
    os.makedirs(os.path.join(OUTPUT_DIR, "css"), exist_ok=True)
    os.makedirs(THUMBNAILS_DIR,                  exist_ok=True)

    # Copy static assets into docs/ so GitHub Pages can serve them
    if os.path.exists(TEXTURE_SRC):
        shutil.copy2(TEXTURE_SRC, TEXTURE_DST)
        print("Copied texture -> docs/texture_clipBoardPaper.png")
    if os.path.exists(LOGO_SRC):
        shutil.copy2(LOGO_SRC, LOGO_DST)
        print("Copied logo    -> docs/logo_Monogon_white.png")

    thumbnail_map = build_thumbnail_map()
    if thumbnail_map:
        print(f"Found {len(thumbnail_map)} thumbnail(s): {', '.join(sorted(thumbnail_map))}")

    entries = load_entries(thumbnail_map)

    # Collect all level keys found so we can warn about missing labels
    found_levels = sorted({e["level"] for e in entries})
    for lvl in found_levels:
        if lvl not in LEVEL_LABELS:
            print(f"  WARNING: no label defined for level '{lvl}' — add it to LEVEL_LABELS in build_site.py")

    lines = [
        "// Auto-generated by build_site.py — do not edit by hand.",
        "// Re-run build_site.py after moving JSON files between level folders.",
        "const CLIPBOARDS = " + json.dumps(entries, indent=2, ensure_ascii=False) + ";",
        "",
        "const LEVEL_LABELS = " + json.dumps(LEVEL_LABELS, indent=2) + ";",
    ]

    out_path = os.path.join(OUTPUT_DIR, "js", "data.js")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"Generated docs/js/data.js with {len(entries)} clipboards.")
    by_level: dict[str, list] = {}
    for e in entries:
        by_level.setdefault(e["level"], []).append(e["id"])
    for lvl in sorted(by_level):
        print(f"  {lvl:14s} {len(by_level[lvl]):3d} clipboards")


if __name__ == "__main__":
    main()
