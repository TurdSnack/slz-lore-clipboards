"""
Rename LoreClipboard JSON files to their clipboard title.

Duplicate titles within the same directory are disambiguated by appending
a number: "Title.json", "Title 2.json", "Title 3.json", etc.

Runs as a dry-run by default — prints what would be renamed.
Pass --confirm to actually perform the renames.

Usage:
  python rename_to_titles.py           # dry run
  python rename_to_titles.py --confirm # rename for real
"""

import json
import os
import re
import sys


INPUT_DIR = os.path.join(os.path.dirname(__file__), "MonoBehaviour")
DRY_RUN   = "--confirm" not in sys.argv


def strip_tmp(text: str) -> str:
    """Remove all TMP rich-text tags, collapse whitespace."""
    text = re.sub(r"<br\s*/?>", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    return re.sub(r"\s+", " ", text).strip()


def to_filename(title: str) -> str:
    """Turn a plain-text title into a safe filename stem (no extension)."""
    # Windows forbidden characters: \ / : * ? " < > |
    title = re.sub(r'[\\/:*?"<>|]', "", title)
    title = re.sub(r"\s+", " ", title).strip(" .")
    return title or "untitled"


def collect_files(directory: str) -> list[str]:
    """Return all .json paths under directory (recursive), sorted."""
    paths = []
    for root, dirs, files in os.walk(directory):
        dirs.sort()
        for f in sorted(files):
            if f.endswith(".json"):
                paths.append(os.path.join(root, f))
    return paths


def build_rename_plan(files: list[str]) -> tuple[list[tuple[str,str]], list[str]]:
    """
    Return (renames, skipped_empty).
    renames: list of (old_path, new_path) pairs with duplicates numbered.
    skipped_empty: files with no title that are left alone.
    """
    # Group files by their parent directory, compute base stem for each
    # structure: { dir: [ (filepath, stem), ... ] }
    by_dir: dict[str, list[tuple[str, str]]] = {}
    skipped_empty: list[str] = []

    for filepath in files:
        with open(filepath, encoding="utf-8-sig") as f:
            data = json.load(f)

        raw_title = data.get("title", "").strip()
        plain     = strip_tmp(raw_title)

        if not plain:
            skipped_empty.append(filepath)
            continue

        stem = to_filename(plain)
        d    = os.path.dirname(filepath)
        by_dir.setdefault(d, []).append((filepath, stem))

    renames: list[tuple[str, str]] = []

    for directory, items in by_dir.items():
        # Count how many files share each stem within this directory
        stem_count: dict[str, int] = {}
        for _, stem in items:
            stem_count[stem] = stem_count.get(stem, 0) + 1

        # Assign numbers to duplicates (first occurrence keeps no number)
        stem_seen: dict[str, int] = {}
        for filepath, stem in items:
            stem_seen[stem] = stem_seen.get(stem, 0) + 1

            if stem_count[stem] == 1:
                # Unique — no suffix needed
                new_name = stem + ".json"
            else:
                # Duplicate — first gets no number, subsequent get 2, 3, ...
                n = stem_seen[stem]
                new_name = stem + ".json" if n == 1 else f"{stem} {n}.json"

            new_path = os.path.join(directory, new_name)

            if os.path.basename(filepath) == new_name:
                continue  # already correct name, skip

            renames.append((filepath, new_path))

    return renames, skipped_empty


def main():
    files              = collect_files(INPUT_DIR)
    renames, skipped   = build_rename_plan(files)

    mode = "DRY RUN" if DRY_RUN else "RENAMING"
    print(f"\n{'-'*60}")
    print(f"  {mode}  ({len(renames)} files to rename)")
    print(f"{'-'*60}\n")

    for old_path, new_path in renames:
        old_rel = os.path.relpath(old_path, INPUT_DIR)
        new_rel = os.path.relpath(new_path, INPUT_DIR)
        print(f"  {old_rel}")
        print(f"    -> {new_rel}")
        if not DRY_RUN:
            if os.path.exists(new_path):
                print(f"    !! SKIPPED — target already exists")
            else:
                os.rename(old_path, new_path)
        print()

    already_correct = len(files) - len(skipped) - len(renames)
    print(f"  {already_correct} files already have the correct name.")

    if skipped:
        print(f"  {len(skipped)} files skipped (no title):")
        for p in skipped:
            print(f"    {os.path.relpath(p, INPUT_DIR)}")

    if DRY_RUN:
        print("\nThis was a dry run. Pass --confirm to apply.")
    else:
        print("\nDone. Re-run build_site.py to regenerate data.js.")


if __name__ == "__main__":
    main()
