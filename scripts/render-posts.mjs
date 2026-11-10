#!/usr/bin/env node
/**
 * Writes the news posts into posts-and-news.html from assets/posts.json, so
 * every post is part of the page: it can be linked to directly (#post-id),
 * read with JavaScript off, and found by search engines. Each post also gets a
 * BlogPosting entry in the page's structured data.
 *
 * assets/blog.js still runs the search, filters and "Read more" buttons; it
 * now works on the cards this script writes instead of building them.
 *
 * Run from the repository root:
 *
 *   node scripts/render-posts.mjs           rewrite the posts
 *   node scripts/render-posts.mjs --check   fail if they are out of date
 *
 * The deploy workflow runs it, and the validate workflow runs --check, so a
 * post added to the JSON but not the page is caught before it goes live.
 */
import { readFileSync, writeFileSync } from "node:fs";

const PAGE = "posts-and-news.html";
const JSON_FILE = "assets/posts.json";
const SITE_URL = "https://goderichchessclub.com";
const START = "<!-- posts:start - generated from assets/posts.json by scripts/render-posts.mjs -->";
const END = "<!-- posts:end -->";
const SCHEMA_START = "<!-- post-schema:start - generated from assets/posts.json by scripts/render-posts.mjs -->";
const SCHEMA_END = "<!-- post-schema:end -->";
const checkOnly = process.argv.includes("--check");

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const posts = JSON.parse(readFileSync(JSON_FILE, "utf8"))
  .slice()
  .sort((a, b) => new Date(b.date) - new Date(a.date));

const page = readFileSync(PAGE, "utf8");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function displayDate(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

function card(post) {
  const category = post.category
    ? `\n            <span class="post-category">${escapeHtml(post.category)}</span>`
    : "";

  return `        <article class="post-card" id="${escapeHtml(post.id)}" data-date="${escapeHtml(post.date)}" data-category="${escapeHtml(post.category || "")}">
          <div class="post-meta">
            <span class="post-date">${displayDate(post.date)}</span>${category}
          </div>
          <h2 class="post-title"><a href="#${escapeHtml(post.id)}">${escapeHtml(post.title)}</a></h2>
          <p class="post-excerpt">${escapeHtml(post.excerpt)}</p>
          <div class="post-full">${escapeHtml(post.content || post.excerpt)}</div>
          <button type="button" class="post-readmore" aria-expanded="false">Read more \u2192</button>
        </article>`;
}

const list = posts.length
  ? posts.map(card).join("\n")
  : `        <div class="empty-state">No posts yet.</div>`;

const body = [START, list, `      ${END}`].join("\n");

const schema = {
  "@context": "https://schema.org",
  "@graph": posts.map((post) => ({
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    url: `${SITE_URL}/posts-and-news#${post.id}`,
    mainEntityOfPage: `${SITE_URL}/posts-and-news`,
    author: { "@type": "Organization", name: "Goderich Chess Club", url: `${SITE_URL}/` },
    publisher: {
      "@type": "Organization",
      name: "Goderich Chess Club",
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/assets/logos/GCC%20large%20logo%20rounded.png`,
    },
  })),
};

const schemaBlock = [
  SCHEMA_START,
  '<script type="application/ld+json">',
  JSON.stringify(schema, null, 2),
  "</script>",
  SCHEMA_END,
].join("\n");

function replaceSection(html, startMarker, endMarker, block, label) {
  const startIndex = html.indexOf(startMarker);
  const endIndex = html.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(`render-posts: ${label} markers not found in ${PAGE}`);
  }

  const before = html.slice(0, startIndex).replace(/[ \t]+$/, "");
  return before + block + html.slice(endIndex + endMarker.length);
}

let updated = replaceSection(page, START, END, body, "posts");
updated = replaceSection(updated, SCHEMA_START, SCHEMA_END, schemaBlock, "post-schema");

if (updated === page) {
  console.log(`${PAGE}: posts match ${JSON_FILE}`);
  process.exit();
}

if (checkOnly) {
  console.error(`${PAGE} is out of date - run: node scripts/render-posts.mjs`);
  process.exitCode = 1;
  process.exit();
}

writeFileSync(PAGE, updated);
console.log(`${PAGE}: ${posts.length} post(s) rebuilt from ${JSON_FILE}`);
