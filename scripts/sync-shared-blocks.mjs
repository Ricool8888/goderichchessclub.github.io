#!/usr/bin/env node
/**
 * Keeps the repeated parts of every page identical.
 *
 * Two things are managed here:
 *
 *   1. The header and the footer. Their canonical markup lives in
 *      partials/header.html and partials/footer.html; each page's copy is
 *      replaced with that markup, with the nav link for the current page
 *      marked active.
 *
 *   2. The social preview tags (<head>, between the social-preview markers).
 *      They are not written by hand: og:title, og:description and og:url come
 *      from the page's own <title>, description and canonical link, so a page
 *      only states its title once and the preview cannot drift from it.
 *
 * Run with --check (the checks do) to fail instead of writing, so a page that
 * drifted is caught before it ships.
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

/*
 * Social preview tags.
 *
 * The share image is the club logo. It is portrait (196x292), so the Twitter
 * card is "summary" rather than "summary_large_image". The width and height
 * are stated so a network can lay the card out before the image arrives. If
 * the logo is ever replaced with a landscape image, update the three numbers
 * and the alt text here.
 */
const SOCIAL = {
  start: "<!-- social-preview:start",
  end: "<!-- social-preview:end -->",
  siteName: "Goderich Chess Club",
  siteUrl: "https://goderichchessclub.com/",
  image: "https://goderichchessclub.com/assets/logos/Goderich%20Chess%20Club%20smaller%20logo.png",
  imageType: "image/png",
  imageWidth: "196",
  imageHeight: "292",
  imageAlt: "Goderich Chess Club logo",
};

// Error pages carry no canonical link and no description, and search engines
// are told not to index them, so they get no preview tags.
const NO_SOCIAL = new Set(["400.html", "403.html", "404.html", "500.html", "503.html"]);

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

// Attribute values in these pages are plain text, so the only characters that
// need escaping are the ones that would end the attribute or start an entity.
function attr(value) {
  return value
    .replace(/&(?!(?:[a-zA-Z]+|#[0-9]+|#x[0-9a-fA-F]+);)/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function pageMeta(html, file) {
  const title = html.match(/<title>([\s\S]*?)<\/title>/);
  const description = html.match(/<meta name="description" content="([^"]*)">/);
  const canonical = html.match(/<link rel="canonical" href="([^"]*)">/);

  const missing = [
    title ? null : "a <title>",
    description ? null : 'a <meta name="description">',
    canonical ? null : 'a <link rel="canonical">',
  ].filter(Boolean);

  if (missing.length) {
    throw new Error(
      `${file}: social preview tags need ${missing.join(", ")} - add ${missing.length > 1 ? "them" : "it"} or drop the ${SOCIAL.start} block`
    );
  }

  return {
    title: title[1].replace(/\s+/g, " ").trim(),
    description: description[1].replace(/\s+/g, " ").trim(),
    url: canonical[1].trim(),
  };
}

function socialBlock(html, file) {
  const meta = pageMeta(html, file);
  const lines = [
    `${SOCIAL.start} - generated from this page's title, description and canonical link by scripts/sync-shared-blocks.mjs. Do not edit by hand. -->`,
    `<meta property="og:site_name" content="${attr(SOCIAL.siteName)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:locale" content="en_CA">`,
    `<meta property="og:title" content="${attr(meta.title)}">`,
    `<meta property="og:description" content="${attr(meta.description)}">`,
    `<meta property="og:url" content="${attr(meta.url)}">`,
    `<meta property="og:image" content="${attr(SOCIAL.image)}">`,
    `<meta property="og:image:type" content="${SOCIAL.imageType}">`,
    `<meta property="og:image:width" content="${SOCIAL.imageWidth}">`,
    `<meta property="og:image:height" content="${SOCIAL.imageHeight}">`,
    `<meta property="og:image:alt" content="${attr(SOCIAL.imageAlt)}">`,
    `<meta name="twitter:card" content="summary">`,
    `<meta name="twitter:title" content="${attr(meta.title)}">`,
    `<meta name="twitter:description" content="${attr(meta.description)}">`,
    `<meta name="twitter:image" content="${attr(SOCIAL.image)}">`,
    SOCIAL.end,
  ];
  return lines.join("\n");
}

function replaceSocial(html, file) {
  const start = html.indexOf(SOCIAL.start);
  if (start === -1) return html;
  const end = html.indexOf(SOCIAL.end, start);
  if (end === -1) throw new Error(`${file}: ${SOCIAL.start} block has no ${SOCIAL.end}`);
  return html.slice(0, start) + socialBlock(html, file) + html.slice(end + SOCIAL.end.length);
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
  if (!NO_SOCIAL.has(page)) updated = replaceSocial(updated, page);

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
  console.log(`sync-shared-blocks: ${pages.length} pages match partials/ and their preview tags`);
} else {
  console.log(
    drifted.length
      ? `sync-shared-blocks: updated ${drifted.length} page(s): ${drifted.join(", ")}`
      : `sync-shared-blocks: ${pages.length} pages already in sync`
  );
}
