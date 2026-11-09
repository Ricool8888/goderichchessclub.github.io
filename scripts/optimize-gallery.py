#!/usr/bin/env python3
"""Rebuild the web-sized gallery photos and their grid thumbnails.

Run from the repository root:

    python3 scripts/optimize-gallery.py             # optimise + build missing thumbs
    python3 scripts/optimize-gallery.py --dry-run   # report what would change
    python3 scripts/optimize-gallery.py --force     # rebuild every thumbnail

Requires Python 3 and Pillow (``pip install Pillow``).

What it does, for every photo listed in assets/gallery.json:

  * the original in assets/gallery/ is auto-rotated, stripped of metadata and
    re-saved as a progressive JPEG capped at MAX_EDGE pixels on its longest
    side (only when that actually makes the file smaller);
  * a grid thumbnail is written to assets/gallery/thumbs/ at most THUMB_EDGE
    pixels on its longest side;
  * a photo whose thumbnail is already newer than the original is skipped, so
    running the script twice is cheap.

The lightbox shows the original, the grid shows the thumbnail, and gallery.js
falls back to the original when a thumbnail is missing, so adding a photo
without running this script still works - it is just slower to load.
"""

import argparse
import json
import os
import sys

try:
    from PIL import Image, ImageOps
except ImportError:  # pragma: no cover - only hit without Pillow installed
    sys.exit(
        "optimize-gallery: Pillow is required. Install it with:\n"
        "    pip install Pillow"
    )

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GALLERY_JSON = os.path.join(ROOT, "assets", "gallery.json")
PHOTO_DIR = os.path.join(ROOT, "assets", "gallery")
THUMB_DIR = os.path.join(PHOTO_DIR, "thumbs")

MAX_EDGE = 1600  # longest side of the stored full-size photo
THUMB_EDGE = 640  # longest side of the grid thumbnail
QUALITY = 82
THUMB_QUALITY = 78

# An original is only re-encoded when it breaks one of these limits, so a
# second run leaves everything alone instead of quietly degrading the photos.
# A photo that has been through this script ends up well under 1 MB.
REENCODE_ABOVE = 1048576


def photo_filenames():
    with open(GALLERY_JSON, encoding="utf-8") as handle:
        sections = json.load(handle)

    names = []
    for section in sections:
        for photo in section.get("photos", []):
            name = photo.get("filename")
            if name:
                names.append(name)
    return names


def save_jpeg(image, path, quality):
    """Write a progressive JPEG, replacing the file only if it got smaller."""
    tmp = path + ".opt"
    image.save(tmp, "JPEG", quality=quality, optimize=True, progressive=True)
    if os.path.exists(path) and os.path.getsize(tmp) >= os.path.getsize(path):
        os.remove(tmp)
        return False
    os.replace(tmp, path)
    return True


def optimise_original(path, dry_run):
    before = os.path.getsize(path)
    with Image.open(path) as source:
        image = ImageOps.exif_transpose(source)
        if image.mode != "RGB":
            image = image.convert("RGB")

        longest = max(image.size)
        if longest <= MAX_EDGE and before <= REENCODE_ABOVE:
            return before, before

        if longest > MAX_EDGE:
            scale = MAX_EDGE / float(longest)
            image = image.resize(
                (max(1, round(image.width * scale)), max(1, round(image.height * scale))),
                Image.LANCZOS,
            )

        if dry_run:
            # Estimate the result without touching the working tree.
            tmp = path + ".estimate"
            image.save(tmp, "JPEG", quality=QUALITY, optimize=True, progressive=True)
            after = os.path.getsize(tmp)
            os.remove(tmp)
            return before, min(before, after)

        save_jpeg(image, path, QUALITY)
        return before, os.path.getsize(path)


def write_thumbnail(path, thumb_path, dry_run, force):
    if not force and os.path.exists(thumb_path):
        if os.path.getmtime(thumb_path) >= os.path.getmtime(path):
            return None

    with Image.open(path) as source:
        image = ImageOps.exif_transpose(source)
        if image.mode != "RGB":
            image = image.convert("RGB")

        longest = max(image.size)
        if longest > THUMB_EDGE:
            scale = THUMB_EDGE / float(longest)
            image = image.resize(
                (max(1, round(image.width * scale)), max(1, round(image.height * scale))),
                Image.LANCZOS,
            )

        if dry_run:
            tmp = thumb_path + ".estimate"
            image.save(tmp, "JPEG", quality=THUMB_QUALITY, optimize=True, progressive=True)
            size = os.path.getsize(tmp)
            os.remove(tmp)
            return size

        save_jpeg(image, thumb_path, THUMB_QUALITY)
        return os.path.getsize(thumb_path)


def human(bytes_):
    return "{:.1f} MB".format(bytes_ / 1048576.0) if bytes_ >= 1048576 else "{:.0f} KB".format(bytes_ / 1024.0)


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--dry-run", action="store_true", help="report sizes without writing files")
    parser.add_argument("--force", action="store_true", help="rebuild thumbnails that already exist")
    args = parser.parse_args()

    names = photo_filenames()
    if not names:
        sys.exit("optimize-gallery: no photos found in assets/gallery.json")

    os.makedirs(THUMB_DIR, exist_ok=True)

    missing = []
    before_total = after_total = thumb_total = 0
    changed = 0

    for name in names:
        path = os.path.join(PHOTO_DIR, name)
        if not os.path.exists(path):
            missing.append(name)
            continue

        before, after = optimise_original(path, args.dry_run)
        before_total += before
        after_total += after
        if after < before:
            changed += 1

        thumb_size = write_thumbnail(
            path, os.path.join(THUMB_DIR, name), args.dry_run, args.force
        )
        if thumb_size:
            thumb_total += thumb_size

    label = "would be" if args.dry_run else "are"
    print("photos: {}".format(len(names) - len(missing)))
    print("originals {} {} (was {})".format(label, human(after_total), human(before_total)))
    print("files rewritten: {}".format(changed))
    if thumb_total:
        print("new thumbnails {} {}".format(label, human(thumb_total)))
    if missing:
        print("missing files (skipped): {}".format(", ".join(missing)))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
