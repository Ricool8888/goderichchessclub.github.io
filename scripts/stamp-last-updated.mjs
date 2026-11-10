#!/usr/bin/env node
/**
 * Writes assets/last-updated.json from git history, so the footer date on
 * every page comes from the last commit that touched that page instead of a
 * GitHub API request made by each visitor. The file is committed: the site is
 * published from the main branch, so a file that only exists inside a deploy
 * never reaches a visitor - the footer date fetches it and stays hidden when
 * it is missing.
 *
 * It also rebuilds sitemap.xml: one entry per page in the repository, with the
 * same date (search engines ignore changefreq and priority, but they do use
 * lastmod). That file is committed for the same reason.
 *
 * Run from the repository root, and commit the result whenever a page changes:
 *
 *   node scripts/stamp-last-updated.mjs
 *
 * Run with --check (the checks do) to fail instead of writing, so a page that
 * was edited without refreshing its date is caught before it ships.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const CHECK = process.argv.includes("--check");
const DATA_FILE = "assets/last-updated.json";
const SITEMAP = "sitemap.xml";
const SITE_URL = "https://goderichchessclub.com";

// Error pages answer bad addresses; they are not pages anyone should land on.
const NOT_A_PAGE = new Set(["400.html", "403.html", "404.html", "500.html", "503.html"]);

const pages = readdirSync(".")
  .filter((name) => name.endsWith(".html"))
  .sort();

function git(args) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch (err) {
    return "";
  }
}

function lastCommitDate(file) {
  return git(["log", "-1", "--format=%cs", "--", file]);
}

// A page being edited right now is dated today, so the date that gets
// committed with the page is the date of the change itself.
const dirty = new Set(
  git(["status", "--porcelain", "--", ...pages])
    .split("\n")
    .map((line) => line.slice(3).trim())
    .filter(Boolean)
);

const today = new Date().toISOString().slice(0, 10);
const dates = {};

for (const page of pages) {
  dates[page] = dirty.has(page) ? today : lastCommitDate(page) || today;
}

const out = {
  generatedAt: new Date().toISOString(),
  pages: dates,
};

// The list of pages is built from the files in the repository rather than kept
// by hand, so adding a page is enough: it appears in sitemap.xml on the next
// run with the date of the last commit that touched it.
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

if (CHECK) {
  const problems = [];

  let committed = {};
  try {
    committed = JSON.parse(readFileSync(DATA_FILE, "utf8")).pages || {};
  } catch (err) {
    problems.push(`${DATA_FILE} is missing or not valid JSON`);
  }
  for (const page of pages) {
    if (committed[page] === dates[page]) continue;
    problems.push(`${page}: ${DATA_FILE} says ${committed[page] || "nothing"}, git says ${dates[page]}`);
  }

  let committedSitemap = "";
  try {
    committedSitemap = readFileSync(SITEMAP, "utf8");
  } catch (err) {
    problems.push(`${SITEMAP} is missing`);
  }
  if (committedSitemap && committedSitemap !== sitemap) {
    problems.push(`${SITEMAP} does not match the pages in the repository`);
  }

  if (problems.length) {
    console.error(
      `stamp-last-updated: the committed footer dates are out of date\n  ` +
        problems.join("\n  ") +
        "\nRun `node scripts/stamp-last-updated.mjs` and commit the result."
    );
    process.exit(1);
  }
  console.log(`stamp-last-updated: ${pages.length} page dates and ${entries.length} sitemap entries are current`);
} else {
  writeFileSync(DATA_FILE, JSON.stringify(out, null, 2) + "\n");
  console.log(`stamp-last-updated: wrote ${pages.length} page dates`);
  writeFileSync(SITEMAP, sitemap);
  console.log(`stamp-last-updated: wrote ${entries.length} sitemap entries`);
}
