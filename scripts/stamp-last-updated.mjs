#!/usr/bin/env node
/**
 * Writes assets/last-updated.json from git history, so the footer date on
 * every page comes from the last commit that touched that page instead of a
 * GitHub API request made by each visitor.
 *
 * It also rebuilds sitemap.xml: one entry per page in the repository, with the
 * same date (search engines ignore changefreq and priority, but they do use
 * lastmod).
 *
 * Run from the repository root. Used by .github/workflows/static.yml before
 * the site is uploaded; running it locally is harmless.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const pages = readdirSync(".")
  .filter((name) => name.endsWith(".html"))
  .sort();

function lastCommitDate(file) {
  try {
    return execFileSync("git", ["log", "-1", "--format=%cs", "--", file], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch (err) {
    return "";
  }
}

const today = new Date().toISOString().slice(0, 10);
const dates = {};

for (const page of pages) {
  dates[page] = lastCommitDate(page) || today;
}

const out = {
  generatedAt: new Date().toISOString(),
  pages: dates,
};

writeFileSync("assets/last-updated.json", JSON.stringify(out, null, 2) + "\n");
console.log(`stamp-last-updated: wrote ${pages.length} page dates`);

// --- sitemap -----------------------------------------------------------------
//
// The list of pages is built from the files in the repository rather than kept
// by hand, so adding a page is enough: it appears in sitemap.xml on the next
// deploy with the date of the last commit that touched it.

const SITEMAP = "sitemap.xml";
const SITE_URL = "https://goderichchessclub.com";

// Error pages answer bad addresses; they are not pages anyone should land on.
const NOT_A_PAGE = new Set(["400.html", "403.html", "404.html", "500.html", "503.html"]);

const entries = pages
  .filter((page) => !NOT_A_PAGE.has(page))
  .map((page) => ({
    loc: page === "index.html" ? `${SITE_URL}/` : `${SITE_URL}/${page.replace(/\.html$/, "")}`,
    date: dates[page] || today,
  }))
  .sort((a, b) => {
    const home = `${SITE_URL}/`;
    if (a.loc === home) return -1;
    if (b.loc === home) return 1;
    return a.loc.localeCompare(b.loc);
  });

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...entries.map((entry) => `  <url>\n    <loc>${entry.loc}</loc>\n    <lastmod>${entry.date}</lastmod>\n  </url>`),
  "</urlset>",
  "",
].join("\n");

writeFileSync(SITEMAP, sitemap);
console.log(`stamp-last-updated: wrote ${entries.length} sitemap entries`);
