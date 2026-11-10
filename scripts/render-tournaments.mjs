#!/usr/bin/env node
/**
 * Writes the tournament cards into tournaments.html from
 * assets/tournaments.json, so the page - and anything reading it, like
 * search engines or a visitor with JavaScript turned off - has the cards in
 * the HTML instead of building them in the browser.
 *
 * assets/tournaments.js still runs the tabs; it only shows and hides the two
 * lists this script writes.
 *
 * Run from the repository root:
 *
 *   node scripts/render-tournaments.mjs           rewrite the cards
 *   node scripts/render-tournaments.mjs --check   fail if they are out of date
 *
 * The deploy workflow runs it, and the validate workflow runs --check, so a
 * tournament edited in the JSON but not the page is caught before it reaches
 * the site.
 */
import { readFileSync, writeFileSync } from "node:fs";

const PAGE = "tournaments.html";
const JSON_FILE = "assets/tournaments.json";
const START = "<!-- tournaments:start - generated from assets/tournaments.json by scripts/render-tournaments.mjs -->";
const END = "<!-- tournaments:end -->";
const checkOnly = process.argv.includes("--check");

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const tournaments = JSON.parse(readFileSync(JSON_FILE, "utf8"));
const page = readFileSync(PAGE, "utf8");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// The JSON uses **bold** inside descriptions; everything else is plain text.
// Trailing spaces on a line are invisible on the page but show up as markup
// errors, so they are dropped here.
function richText(value) {
  const trimmed = String(value)
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, ""))
    .join("\n");
  return escapeHtml(trimmed).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function parts(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month, day };
}

function fullDate(iso) {
  const { year, month, day } = parts(iso);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

function dateRange(t) {
  if (!t.endDate || t.endDate === t.date) return fullDate(t.date);

  const start = parts(t.date);
  const end = parts(t.endDate);

  if (start.year === end.year && start.month === end.month) {
    return `${MONTHS[start.month - 1]} ${start.day}\u2013${end.day}, ${start.year}`;
  }
  if (start.year === end.year) {
    return `${MONTHS[start.month - 1]} ${start.day} \u2013 ${MONTHS[end.month - 1]} ${end.day}, ${start.year}`;
  }
  return `${fullDate(t.date)} \u2013 ${fullDate(t.endDate)}`;
}

function dateBlock(t) {
  const start = parts(t.date);
  const end = parts(t.endDate || t.date);

  if (t.endDate === t.date || !t.endDate) {
    return { month: MONTHS_SHORT[start.month - 1], day: String(start.day), year: String(start.year), compact: false };
  }
  if (start.year === end.year && start.month === end.month) {
    return { month: MONTHS_SHORT[start.month - 1], day: `${start.day}\u2013${end.day}`, year: String(start.year), compact: false };
  }
  return {
    month: "",
    day: `${MONTHS_SHORT[start.month - 1]} ${start.day}\u2013${MONTHS_SHORT[end.month - 1]} ${end.day}`,
    year: start.year === end.year ? String(start.year) : `${start.year}\u2013${end.year}`,
    compact: true,
  };
}

// Only real destinations become links; a placeholder such as "TBD" would be a
// broken link in the HTML.
function isLink(value) {
  return typeof value === "string" && (/^https?:\/\//i.test(value) || /^mailto:/i.test(value));
}

function parseTimeRange(timeStr) {
  if (!timeStr) return null;
  const matches = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi);
  if (!matches || matches.length < 2) return null;

  function to24Hour(part) {
    const m = part.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    let hour = parseInt(m[1], 10);
    const minute = m[2];
    const period = m[3].toUpperCase();
    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;
    return (hour < 10 ? "0" + hour : "" + hour) + ":" + minute;
  }

  return { start: to24Hour(matches[0]), end: to24Hour(matches[1]) };
}

const CALENDAR_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';

function card(t) {
  const block = dateBlock(t);
  const dayClass = block.compact ? "day range-compact" : "day";
  const statusClass = t.status === "upcoming" ? "upcoming" : "completed";
  const statusLabel = t.status === "upcoming" ? "Upcoming" : "Completed";

  const metas = [
    ["\uD83D\uDCC5", dateRange(t)],
    ["\uD83D\uDD52", t.time],
    ["\u265F", t.format],
    ["\uD83D\uDCCD", t.location],
    ["\uD83D\uDCB5", t.entryFee],
  ]
    .filter(([, value]) => value)
    .map(([icon, value]) => `                <span class="tournament-meta-item">${icon} <strong>${escapeHtml(value)}</strong></span>`)
    .join("\n");

  const links = [];

  if (isLink(t.registerUrl)) {
    const external = !/^mailto:/i.test(t.registerUrl);
    links.push(
      `                <a href="${escapeHtml(t.registerUrl)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>Register / Inquire \u2192</a>`
    );
  }

  if (isLink(t.resultsUrl)) {
    links.push(
      `                <a href="${escapeHtml(t.resultsUrl)}" target="_blank" rel="noopener noreferrer">View Full Results \u2192</a>`
    );
  }

  if (Array.isArray(t.extraLinks)) {
    for (const link of t.extraLinks) {
      if (!link || !isLink(link.url) || !link.label) continue;
      const external = !/^mailto:/i.test(link.url);
      links.push(
        `                <a href="${escapeHtml(link.url)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${escapeHtml(link.label)} \u2192</a>`
      );
    }
  }

  const timeRange = t.status === "upcoming" ? parseTimeRange(t.time) : null;
  if (timeRange) {
    links.push(
      [
        `                <button type="button" class="btn-calendar" data-ics-id="${escapeHtml(t.id)}"`,
        `                  data-ics-title="${escapeHtml(t.title)}"`,
        `                  data-ics-description="${escapeHtml((t.description || "").replace(/\*\*/g, ""))}"`,
        `                  data-ics-location="${escapeHtml(t.location || "")}"`,
        `                  data-ics-start-date="${escapeHtml(t.date)}"`,
        `                  data-ics-end-date="${escapeHtml(t.endDate || t.date)}"`,
        `                  data-ics-start-time="${escapeHtml(timeRange.start)}"`,
        `                  data-ics-end-time="${escapeHtml(timeRange.end)}">${CALENDAR_ICON} Add to Calendar</button>`,
      ].join("\n")
    );
  }

  const description = t.description
    ? `\n              <p class="tournament-desc">${richText(t.description)}</p>`
    : "";

  const linkBlock = links.length
    ? `\n              <div class="tournament-links">\n${links.join("\n")}\n              </div>`
    : "";

  return `          <article class="tournament-card">
            <div class="tournament-date-block">
              <div class="month">${block.month}</div>
              <div class="${dayClass}">${block.day}</div>
              <div class="year">${block.year}</div>
            </div>
            <div>
              <div class="tournament-body-top">
                <h3 class="tournament-title">${escapeHtml(t.title)}</h3>
                <span class="status-pill ${statusClass}">${statusLabel}</span>
              </div>
              <div class="tournament-meta-row">
${metas}
              </div>${description}${linkBlock}
            </div>
          </article>`;
}

function list(status, heading, emptyText) {
  const items = tournaments
    .filter((t) => t.status === status)
    .sort((a, b) => {
      const diff = new Date(a.date) - new Date(b.date);
      return status === "upcoming" ? diff : -diff;
    });

  const body = items.length
    ? items.map(card).join("\n")
    : `          <div class="empty-state">${emptyText}</div>`;

  // Both lists ship visible, so past results are readable without the tab
  // script - and if tournaments.js never loads. The script hides the list
  // that is not selected as soon as it starts, which is before the first
  // paint because it sits at the end of the page.
  return `        <div class="tournament-grid" id="${status}List" data-status="${status}">
          <h2 class="sr-only">${heading}</h2>
${body}
        </div>`;
}

const block = [
  "      " + START,
  list("upcoming", "Upcoming tournaments", "No upcoming tournaments scheduled yet - check back soon."),
  list("completed", "Past results", "No past tournaments recorded yet."),
  "      " + END,
].join("\n");

const startIndex = page.indexOf(START);
const endIndex = page.indexOf(END);

if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
  console.error(`render-tournaments: markers not found in ${PAGE}`);
  process.exit(1);
}

// Keep the markers' own indentation instead of writing them at column 0.
const before = page.slice(0, startIndex).replace(/[ \t]+$/, "");
const updated = before + block + page.slice(endIndex + END.length);

if (updated === page) {
  console.log(`${PAGE}: tournament cards match ${JSON_FILE}`);
  process.exit();
}

if (checkOnly) {
  console.error(`${PAGE} is out of date - run: node scripts/render-tournaments.mjs`);
  process.exitCode = 1;
  process.exit();
}

writeFileSync(PAGE, updated);
console.log(`${PAGE}: tournament cards rebuilt from ${JSON_FILE}`);
