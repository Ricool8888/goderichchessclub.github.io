#!/usr/bin/env node
/**
 * Builds the small WebP copies the gallery grid actually shows, so a visitor
 * never downloads a 3 MB camera photo just to see a 200 px thumbnail.
 *
 * For every photo in assets/gallery.json it writes:
 *
 *   assets/gallery/thumbs/<filename>-480.webp   (~20 KB, phones)
 *   assets/gallery/thumbs/<filename>-960.webp   (~60 KB, laptops / retina)
 *
 * The originals stay untouched and are still what the lightbox opens.
 *
 * Run from the repository root after adding photos:
 *
 *   npm install --no-save sharp
 *   node scripts/generate-gallery-thumbs.mjs
 *
 * Then commit the new files in assets/gallery/thumbs/. sharp is only needed
 * for this one step - the published site is static, so it is not a dependency.
 */
import { mkdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const PHOTO_DIR = "assets/gallery";
const THUMB_DIR = "assets/gallery/thumbs";
const WIDTHS = [480, 960];
const QUALITY = 72;

const sections = JSON.parse(readFileSync("assets/gallery.json", "utf8"));
const photos = sections.flatMap((section) => section.photos || []);

let written = 0;
let skipped = 0;

mkdirSync(THUMB_DIR, { recursive: true });

for (const photo of photos) {
  const source = join(PHOTO_DIR, photo.filename);

  if (!existsSync(source)) {
    console.error(`missing photo file: ${source}`);
    process.exitCode = 1;
    continue;
  }

  for (const width of WIDTHS) {
    const out = join(THUMB_DIR, `${photo.filename}-${width}.webp`);

    if (existsSync(out) && statSync(out).mtimeMs >= statSync(source).mtimeMs) {
      skipped += 1;
      continue;
    }

    await sharp(source)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 5 })
      .toFile(out);

    written += 1;
  }
}

console.log(`gallery thumbnails: ${written} written, ${skipped} already up to date`);
