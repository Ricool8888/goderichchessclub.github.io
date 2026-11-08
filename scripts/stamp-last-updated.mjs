#!/usr/bin/env node
/**
 * Writes assets/last-updated.json from git history, so the footer date on
 * every page comes from the last commit that touched that page instead of a
 * GitHub API request made by each visitor. Also refreshes the <lastmod> of each
 * sitemap entry from the same dates (search engines ignore changefreq and
 * priority, but they do use lastmod).
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

// --- sitemap <lastmod> -----------------------------------------------------

const SITEMAP = "sitemap.xml";

function pageForUrl(url) {
  const path = url.replace(/^https?:\/\/[^/]+/, "").replace(/^\//, "").replace(/\/$/, "");
  return path === "" ? "index.html" : `${path}.html`;
}

const sitemap = readFileSync(SITEMAP, "utf8");
let stamped = 0;

const updatedSitemap = sitemap.replace(/[ \t]*<url>[\s\S]*?<\/url>/g, (entry) => {
  const loc = (entry.match(/<loc>([^<]+)<\/loc>/) || [])[1];
  if (!loc) return entry;
  const date = dates[pageForUrl(loc.trim())] || today;
  stamped++;
  // changefreq and priority are ignored by Google, so only loc and lastmod ship.
  return `  <url>\n    <loc>${loc.trim()}</loc>\n    <lastmod>${date}</lastmod>\n  </url>`;
});

writeFileSync(SITEMAP, updatedSitemap);
console.log(`stamp-last-updated: stamped ${stamped} sitemap lastmod dates`);
