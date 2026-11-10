#!/usr/bin/env node
/**
 * Keeps the site header and footer identical on every page.
 *
 * The canonical markup lives in partials/header.html and partials/footer.html.
 * A page's own copy is replaced with that markup, with the nav link for the
 * current page marked active. Run with --check (the deploy workflow does) to
 * fail instead of writing, so a page that drifted is caught before it ships.
 *
 * Run from the repository root:  node scripts/sync-shared-blocks.mjs [--check]
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const CHECK = process.argv.includes("--check");

const BLOCKS = {
  header: { start: '<header class="site-header">', end: "</header>", partial: "partials/header.html" },
  footer: { start: '<footer class="site-footer">', end: "</footer>", partial: "partials/footer.html" },
};

/*
 * Error pages are served at whatever address the visitor mistyped -
 * /nope/deep/path shows 404.html - so a relative link in their header or
 * footer would point at /nope/deep/about instead of /about. Their copies of
 * the shared blocks are therefore rewritten to root-absolute paths. The
 * pages keep the same canonical markup; only the links differ.
 */
const ROOT_ABSOLUTE_PAGES = new Set(["400.html", "403.html", "404.html", "500.html", "503.html"]);

// Which nav link is "current" on each page. Error pages highlight nothing.
const NAV_HREF = {
  "index.html": "./",
  "about.html": "about",
  "posts-and-news.html": "posts-and-news",
  "events-calendar.html": "events-calendar",
  "tournaments.html": "tournaments",
  "sponsors.html": "sponsors",
  "merch.html": "merch",
  "gallery.html": "gallery",
  "faq.html": "faq",
  "books-for-sale.html": "books-for-sale",
};

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const canonical = Object.fromEntries(
  Object.entries(BLOCKS).map(([name, block]) => [name, readFileSync(block.partial, "utf8").replace(/\n$/, "")])
);

function activeHeader(headerHtml, href) {
  if (!href) return headerHtml;
  const link = new RegExp('<a href="' + escapeRegExp(href) + '" class="nav-item">');
  if (!link.test(headerHtml)) {
    throw new Error(`partials/header.html has no nav link for href="${href}"`);
  }
  return headerHtml.replace(link, `<a href="${href}" class="nav-item active" aria-current="page">`);
}

function rootAbsolute(html) {
  return html.replace(/\b(href|src)="([^"]*)"/g, (match, attr, url) => {
    // Leave alone anything already absolute, a fragment, or another scheme.
    if (!url || /^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(url)) return match;
    return `${attr}="/${url.replace(/^\.\//, "")}"`;
  });
}

function replaceBlock(html, block, replacement, file, name) {
  // Match from the opening tag to the first matching closing tag.
  const pattern = new RegExp(
    escapeRegExp(block.start) + "[\\s\\S]*?" + escapeRegExp(block.end),
    ""
  );
  if (!pattern.test(html)) {
    throw new Error(`${file}: no ${name} block found`);
  }
  return html.replace(pattern, () => replacement);
}

const pages = readdirSync(".").filter((name) => name.endsWith(".html")).sort();
const drifted = [];

for (const page of pages) {
  const original = readFileSync(page, "utf8");
  let updated = original;

  let header = activeHeader(canonical.header, NAV_HREF[page]);
  let footer = canonical.footer;

  if (ROOT_ABSOLUTE_PAGES.has(page)) {
    header = rootAbsolute(header);
    footer = rootAbsolute(footer);
  }

  updated = replaceBlock(updated, BLOCKS.header, header, page, "header");
  updated = replaceBlock(updated, BLOCKS.footer, footer, page, "footer");

  if (updated === original) continue;

  drifted.push(page);
  if (!CHECK) writeFileSync(page, updated);
}

if (CHECK) {
  if (drifted.length) {
    console.error(
      `sync-shared-blocks: ${drifted.length} page(s) differ from partials/\n  ` +
        drifted.join("\n  ") +
        "\nRun `node scripts/sync-shared-blocks.mjs` and commit the result."
    );
    process.exit(1);
  }
  console.log(`sync-shared-blocks: ${pages.length} pages match partials/`);
} else {
  console.log(
    drifted.length
      ? `sync-shared-blocks: updated ${drifted.length} page(s): ${drifted.join(", ")}`
      : `sync-shared-blocks: ${pages.length} pages already in sync`
  );
}
