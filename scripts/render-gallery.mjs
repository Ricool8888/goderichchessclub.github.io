#!/usr/bin/env node
/**
 * Writes the photo gallery into gallery.html from assets/gallery.json, so the
 * photos are in the page itself: they load with the page, show up in search
 * results, and appear even when JavaScript is off.
 *
 * assets/gallery.js still runs the lightbox; it reads each photo's original
 * file from its card in the page.
 *
 * Run from the repository root:
 *
 *   node scripts/render-gallery.mjs           rewrite the gallery
 *   node scripts/render-gallery.mjs --check   fail if it is out of date
 *
 * The deploy workflow runs it, and the validate workflow runs --check, so a
 * photo added to the JSON is caught before the page can fall behind it.
 */
import { readFileSync, writeFileSync } from "node:fs";

const PAGE = "gallery.html";
const JSON_FILE = "assets/gallery.json";
const START = "<!-- gallery:start - generated from assets/gallery.json by scripts/render-gallery.mjs -->";
const END = "<!-- gallery:end -->";
const checkOnly = process.argv.includes("--check");

const sections = JSON.parse(readFileSync(JSON_FILE, "utf8"));
const page = readFileSync(PAGE, "utf8");

const SIZES = "(max-width: 639px) 47vw, (max-width: 991px) 31vw, 280px";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function item(photo) {
  const full = `assets/gallery/${photo.filename}`;
  const thumb = `assets/gallery/thumbs/${photo.filename}`;
  const alt = escapeHtml(photo.alt || photo.caption || "");

  const caption = photo.caption
    ? `\n            <span class="gallery-item-caption">${escapeHtml(photo.caption)}</span>`
    : "";

  return `          <button type="button" class="gallery-item gallery-item-visible" data-full="${escapeHtml(full)}">
            <img src="${escapeHtml(thumb)}-960.webp"
                 srcset="${escapeHtml(thumb)}-480.webp 480w, ${escapeHtml(thumb)}-960.webp 960w"
                 sizes="${SIZES}"
                 alt="${alt}"
                 loading="lazy"
                 decoding="async">${caption}
          </button>`;
}

function section(sec) {
  const photos = Array.isArray(sec.photos) ? sec.photos : [];
  const body = photos.length
    ? photos.map(item).join("\n")
    : `          <div class="empty-state">No photos in this section yet.</div>`;

  const heading = sec.title
    ? `\n        <h2 class="section-heading">${escapeHtml(sec.title)}</h2>`
    : "";

  return `      <section class="content-section gallery-section">${heading}
        <div class="gallery-grid">
${body}
        </div>
      </section>`;
}

const block = [
  "      " + START,
  sections.length
    ? sections.map(section).join("\n\n")
    : '      <div class="empty-state">No photos have been added yet.</div>',
  "      " + END,
].join("\n");

const startIndex = page.indexOf(START);
const endIndex = page.indexOf(END);

if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
  console.error(`render-gallery: markers not found in ${PAGE}`);
  process.exit(1);
}

// Keep the markers' own indentation instead of writing them at column 0.
const before = page.slice(0, startIndex).replace(/[ \t]+$/, "");
const updated = before + block + page.slice(endIndex + END.length);

if (updated === page) {
  console.log(`${PAGE}: gallery matches ${JSON_FILE}`);
  process.exit();
}

if (checkOnly) {
  console.error(`${PAGE} is out of date - run: node scripts/render-gallery.mjs`);
  process.exitCode = 1;
  process.exit();
}

writeFileSync(PAGE, updated);
console.log(`${PAGE}: gallery rebuilt from ${JSON_FILE}`);
