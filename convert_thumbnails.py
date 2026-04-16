"""
Convert docs/thumbnails/*.bmp to crunchy 1998-style GIFs.

Effect pipeline per image:
  1. Scale down to a low internal resolution (controls pixelation)
  2. Quantize to a small color palette (controls colour depth)
  3. Scale back up to OUTPUT_SIZE so cards stay the same visual size
  4. Save as .gif alongside the original .bmp

Tweak DOWNSCALE_SIZE and PALETTE_COLORS to taste:
  - Smaller DOWNSCALE_SIZE  → chunkier pixels
  - Fewer  PALETTE_COLORS   → more colour banding
"""

from PIL import Image
import os

THUMBNAILS_DIR  = os.path.join(os.path.dirname(__file__), "docs", "thumbnails")
OUTPUT_SIZE     = (1024, 1024)   # final GIF dimensions
DOWNSCALE_SIZE  = (256, 256)     # how low to crush it before scaling back up
PALETTE_COLORS  = 16             # max colours in the GIF palette (2–256)


def crunch(src_path: str, dst_path: str) -> None:
    with Image.open(src_path) as img:
        img = img.convert("RGB")

        # Pixelate: scale down with nearest-neighbour, then back up
        img = img.resize(DOWNSCALE_SIZE, Image.NEAREST)
        img = img.resize(OUTPUT_SIZE, Image.NEAREST)

        # Crush the colour palette
        img = img.quantize(colors=PALETTE_COLORS, dither=Image.Dither.FLOYDSTEINBERG)

        img.save(dst_path, format="GIF")


def main():
    converted = 0
    for fname in sorted(os.listdir(THUMBNAILS_DIR)):
        if not fname.lower().endswith(".bmp"):
            continue
        src = os.path.join(THUMBNAILS_DIR, fname)
        dst = os.path.join(THUMBNAILS_DIR, os.path.splitext(fname)[0] + ".gif")
        crunch(src, dst)
        print(f"  {fname} → {os.path.basename(dst)}")
        converted += 1

    print(f"\nDone — {converted} file(s) converted.")


if __name__ == "__main__":
    main()
