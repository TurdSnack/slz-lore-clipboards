"""
Convert BONELAB LoreClipboard JSON files to GitHub wiki markdown.

Outputs:
  wiki/Home.md          — index of all clipboards
  wiki/<slug>.md        — one page per clipboard
"""

import json
import os
import re


INPUT_DIR = os.path.join(os.path.dirname(__file__), "MonoBehaviour")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "wiki")


def strip_tmp(text: str, bold: bool = True) -> str:
    """Convert Unity TMP rich-text tags to markdown equivalents.

    Args:
        text: Raw TMP text from JSON.
        bold: If True, convert <b> tags to **markdown bold**.
              If False, strip <b> tags entirely (useful for headings/links).
    """
    # <br> → newline
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
    if bold:
        text = re.sub(r"<b>", "**", text, flags=re.IGNORECASE)
        text = re.sub(r"</b>", "**", text, flags=re.IGNORECASE)
        text = re.sub(r"<i>", "*", text, flags=re.IGNORECASE)
        text = re.sub(r"</i>", "*", text, flags=re.IGNORECASE)
    # Strip all remaining tags (colour, line-indent, b/i if bold=False, etc.)
    text = re.sub(r"<[^>]+>", "", text)
    # Collapse 3+ consecutive newlines to double newline
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def slugify(text: str) -> str:
    """Turn a title into a safe filename slug."""
    text = strip_tmp(text, bold=False)
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s]+", "-", text.strip())
    return text[:80] or "untitled"


def load_clipboard(path: str) -> dict | None:
    """Load a JSON file and return its title/body, or None if empty/template."""
    with open(path, encoding="utf-8-sig") as f:
        data = json.load(f)
    title = data.get("title", "").strip()
    body = data.get("body", "").strip()
    if not title and not body:
        return None
    return {"title": title, "body": body, "source": os.path.basename(path)}


def to_markdown(title: str, body: str, source: str) -> str:
    md_title = strip_tmp(title, bold=False) if title else "(Untitled)"
    md_body = strip_tmp(body, bold=True) if body else "_No content._"
    lines = [
        f"# {md_title}",
        "",
        md_body,
        "",
        "---",
        f"_Source: `{source}`_",
    ]
    return "\n".join(lines)


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    clipboards = []
    for filename in sorted(os.listdir(INPUT_DIR)):
        if not filename.endswith(".json"):
            continue
        result = load_clipboard(os.path.join(INPUT_DIR, filename))
        if result is None:
            continue
        clipboards.append(result)

    # Deduplicate slugs
    slug_counts: dict[str, int] = {}
    pages = []
    for cb in clipboards:
        base_slug = slugify(cb["title"]) if cb["title"] else "untitled"
        slug_counts[base_slug] = slug_counts.get(base_slug, 0) + 1
        count = slug_counts[base_slug]
        slug = base_slug if count == 1 else f"{base_slug}-{count}"
        pages.append({**cb, "slug": slug})

    # Write individual pages
    for page in pages:
        md = to_markdown(page["title"], page["body"], page["source"])
        out_path = os.path.join(OUTPUT_DIR, f"{page['slug']}.md")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(md)

    # Write Home index
    index_lines = [
        "# BONELAB Lore Clipboards",
        "",
        "All lore clipboards extracted from BONELAB, organized alphabetically.",
        "",
        "| Title | File |",
        "|-------|------|",
    ]
    for page in sorted(pages, key=lambda p: strip_tmp(p["title"], bold=False).lower()):
        display = strip_tmp(page["title"], bold=False) or "(Untitled)"
        index_lines.append(f"| [{display}]({page['slug']}) | `{page['source']}` |")

    index_lines += ["", "---", f"_{len(pages)} clipboards total._"]

    with open(os.path.join(OUTPUT_DIR, "Home.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(index_lines))

    print(f"Done. {len(pages)} clipboards -> {OUTPUT_DIR}/")
    for page in pages:
        print(f"  {page['slug']}.md  <-  {page['source']}")


if __name__ == "__main__":
    main()
