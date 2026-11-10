#!/usr/bin/env node
/**
 * Writes the announcement banner into index.html from assets/banner.json, so
 * it is part of the page instead of being built by JavaScript after the page
 * has painted.
 *
 * That fixes two things: the banner no longer pushes the page down when it
 * appears (it was the only layout shift on the site), and its message is
 * readable with scripts off. assets/banner.js keeps doing the live work - it
 * replaces the closing date with the ticking countdown and removes the banner
 * once the deadline passes.
 *
 * Run from the repository root:
 *
 *   node scripts/render-banner.mjs           rewrite the banner
 *   node scripts/render-banner.mjs --check   fail if it is out of date
 *
 * The deploy workflow runs it, and the validate workflow runs --check, so a
 * banner edited in the JSON but not in the page is caught before it ships.
 */
import { readFileSync, writeFileSync } from "node:fs";

const PAGE = "index.html";
const JSON_FILE = "assets/banner.json";
const START = "<!-- banner:start - generated from assets/banner.json by scripts/render-banner.mjs -->";
const END = "<!-- banner:end -->";
const checkOnly = process.argv.includes("--check");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// The date a visitor without JavaScript sees, in the club's own time zone. It
// is kept short on purpose: the banner has to be the same height before and
// after scripts run, so this sits in the same single line as the ticking clock.
function closingDate(iso) {
  const date = new Date(iso).toLocaleString("en-CA", {
    timeZone: "America/Toronto",
    month: "short",
    day: "numeric"
  });
  const time = new Date(iso).toLocaleString("en-CA", {
    timeZone: "America/Toronto",
    hour: "numeric",
    minute: "2-digit"
  });
  return date + ", " + time;
}

const configured = JSON.parse(readFileSync(JSON_FILE, "utf8"));
const banners = Array.isArray(configured) ? configured : [configured];

const live = banners.filter(function (banner) {
  if (!banner || !banner.enabled || !banner.id || !banner.message) return false;
  const countdown = banner.countdown;
  if (!countdown || !countdown.enabled || !countdown.deadlineUTC) return true;
  const deadline = new Date(countdown.deadlineUTC);
  // An expired banner is left out of the page entirely, the same rule
  // banner.js applies at runtime.
  return !isNaN(deadline.getTime()) && deadline.getTime() > Date.now();
});

const markup = live.map(function (banner) {
  const style = banner.style === "urgent" ? "urgent" : "info";
  const countdown = banner.countdown;
  const hasCountdown = !!(countdown && countdown.enabled && countdown.deadlineUTC);

  const parts = [
    '      <section class="site-banner-bar site-banner-' + style + '" aria-label="Site announcement"' +
      (hasCountdown ? ' data-banner-deadline="' + escapeHtml(countdown.deadlineUTC) + '"' : "") + ">",
    '        <span class="site-banner-text">' + escapeHtml(banner.message) + "</span>"
  ];

  if (hasCountdown) {
    parts.push('        <span class="site-banner-countdown">' + escapeHtml(closingDate(countdown.deadlineUTC)) + "</span>");
  }

  if (banner.linkUrl && banner.linkText) {
    parts.push(
      '        <a href="' + escapeHtml(banner.linkUrl) + '" class="site-banner-link">' +
        escapeHtml(banner.linkText) + " \u2192</a>"
    );
  }

  parts.push("      </section>");
  return parts.join("\n");
});

const body = [START, markup.join("\n"), "      " + END].join("\n");

const page = readFileSync(PAGE, "utf8");
const startIndex = page.indexOf(START);
const endIndex = page.indexOf(END);

if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
  throw new Error(`render-banner: markers not found in ${PAGE}`);
}

const updated =
  page.slice(0, startIndex).replace(/[ \t]+$/, "") +
  body +
  page.slice(endIndex + END.length);

if (updated === page) {
  console.log(`${PAGE}: banner matches ${JSON_FILE}`);
  process.exit();
}

if (checkOnly) {
  console.error(`${PAGE} is out of date - run: node scripts/render-banner.mjs`);
  process.exitCode = 1;
  process.exit();
}

writeFileSync(PAGE, updated);
console.log(`${PAGE}: ${live.length} banner(s) rebuilt from ${JSON_FILE}`);
