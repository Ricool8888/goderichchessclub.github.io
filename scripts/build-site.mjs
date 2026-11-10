#!/usr/bin/env node
/**
 * Copies the files that make up the published site into dist/, which is what
 * the deploy workflow uploads to GitHub Pages.
 *
 * Until now the workflow uploaded the whole repository, so the handbook
 * (README.txt), the scripts that build the pages, the partials, and all 39 MB
 * of camera originals in assets/gallery/ were live URLs. They are still in
 * the repository - the originals are the club's archive - but they are no
 * longer served.
 *
 * Run from the repository root (the deploy workflow runs it after the
 * generators have written their blocks):
 *
 *   node scripts/build-site.mjs
 *
 * It always starts from an empty dist/, checks that every root page and every
 * required file arrived, and refuses to finish if something that must not be
 * published slipped in. A failure here stops the deploy rather than publishing
 * a broken site.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const OUT = "dist";

// Every .html file in the repository root is a page, and is checked for below.
const ROOT_FILES = [
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "CNAME",
  ".nojekyll",
  "goderich-chess.vcf",
];

// Never published, and not even copied: documentation, tooling, and the
// gallery originals (the pages and the lightbox use the WebP copies in
// assets/gallery/thumbs/, never these).
const EXCLUDE = [
  "assets/gallery/Gallery README.txt",
  "assets/vendor/README.txt",
];

const EXCLUDE_PATTERNS = [
  /^assets\/gallery\/[^/]+\.jpe?g$/i, // camera originals, ~39 MB
  /(^|\/)\.DS_Store$/,
];

function excluded(relPath) {
  if (EXCLUDE.includes(relPath)) return true;
  return EXCLUDE_PATTERNS.some((pattern) => pattern.test(relPath));
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const pages = readdirSync(".").filter((name) => name.endsWith(".html")).sort();

cpSync("assets", join(OUT, "assets"), {
  recursive: true,
  filter: (src) => !excluded(relative(".", src).split("\\").join("/")),
});
for (const file of ROOT_FILES) cpSync(file, join(OUT, file));
for (const page of pages) cpSync(page, join(OUT, page));

// ---- checks -----------------------------------------------------------------

const missing = [
  ...ROOT_FILES,
  ...pages,
  "assets/style.css",
  "assets/nav.js",
  "assets/calendar.js",
  "assets/meetings.json",
  "assets/last-updated.json",
  "assets/tournaments.json",
  "assets/gallery.json",
  "assets/closures.json",
  "assets/posts.json",
  "assets/banner.json",
  "assets/vendor/chessground.js",
  "assets/vendor/chess.js",
  "assets/vendor/chessground.base.css",
  "assets/logos/favicon-192.png",
  "assets/gallery/thumbs",
].filter((path) => !existsSync(join(OUT, path)));

if (missing.length) {
  console.error(
    `build-site: ${missing.length} file(s) missing from ${OUT}/ - the deploy would publish a broken site:\n  ` +
      missing.join("\n  ")
  );
  process.exit(1);
}

function walk(dir, found = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, found);
    else found.push(relative(OUT, path).split("\\").join("/"));
  }
  return found;
}

const published = walk(OUT);
const leaked = published.filter(
  (path) =>
    !path.endsWith(".html") &&
    (/^scripts\//.test(path) ||
      /^partials\//.test(path) ||
      /^\.github\//.test(path) ||
      /^artifacts\//.test(path) ||
      /^freebuff-sites-build\//.test(path) ||
      /^README\.txt$/.test(path) ||
      /\.(mjs|md)$/.test(path) ||
      /^assets\/gallery\/[^/]+\.jpe?g$/i.test(path))
);

if (leaked.length) {
  console.error(
    `build-site: ${leaked.length} file(s) that must not be published are in ${OUT}/:\n  ` + leaked.join("\n  ")
  );
  process.exit(1);
}

const htmlCount = published.filter((path) => path.endsWith(".html")).length;
const bytes = published.reduce((total, path) => total + statSync(join(OUT, path)).size, 0);
const originals = readdirSync("assets/gallery").filter((name) => /\.jpe?g$/i.test(name));

console.log(`build-site: ${published.length} files, ${(bytes / 1024 / 1024).toFixed(1)} MB in ${OUT}/`);
console.log(
  `  ${htmlCount} pages, gallery originals left out (${originals.length} files, ` +
    `${(originals.reduce((total, name) => total + statSync(join("assets/gallery", name)).size, 0) / 1024 / 1024).toFixed(1)} MB)`
);
console.log("  not published: README.txt, scripts/, partials/, .github/, artifacts/, freebuff-sites-build/");
