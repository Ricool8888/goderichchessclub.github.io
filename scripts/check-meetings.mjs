#!/usr/bin/env node
/**
 * Checks that the weekly meeting details in assets/meetings.json still agree
 * with the pages that state them in prose.
 *
 * assets/meetings.json is the single copy for the calendar, the .ics downloads
 * and the structured data, but two pages also say the times in words:
 *
 *   index.html   the hero sentence and the two meeting cards
 *   faq.html     "When does the club meet?" and "Where is the chess club?"
 *
 * Those pages are protected wording (README section 10), so this script never
 * edits them. It reads the time ranges out of the page, converts them to 24
 * hour times, and fails if a meeting's start/end, weekday or venue is not
 * mentioned at all - which is what happens when the club changes its hours in
 * meetings.json and forgets one of the pages, or edits a page and forgets
 * meetings.json.
 *
 * Run from the repository root:  node scripts/check-meetings.mjs
 */
import { readFileSync } from "node:fs";
import { DAY_NAMES, weekdayOf } from "./lib/toronto-time.mjs";

const PAGES = ["index.html", "faq.html"];
const problems = [];

function fail(message) {
  problems.push(message);
}

function stripToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&ndash;|&#8211;|&#x2013;/gi, "-")
    .replace(/&mdash;|&#8212;/gi, "-")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ");
}

function to24Hour(hour, minute, meridiem) {
  let h = Number(hour);
  const m = Number(minute || 0);
  if (meridiem) {
    const pm = /^p/i.test(meridiem);
    if (pm && h !== 12) h += 12;
    if (!pm && h === 12) h = 0;
  }
  if (h > 23 || m > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Every "6-8 PM", "6:00 PM to 9:00 PM" or "18:00-20:00" range in a page, as
 * { start, end } in 24-hour time. A meridiem written once at the end applies to
 * both halves, which is how the pages write it.
 */
function timeRanges(text) {
  const ranges = [];
  const pattern =
    /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|—|\bto\b)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/gi;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const meridiem = match[3] || match[6];
    const start = to24Hour(match[1], match[2], match[3] || match[6]);
    const end = to24Hour(match[4], match[5], match[6]);
    if (start && end && meridiem) ranges.push({ start, end });
  }
  return ranges;
}

const meetingsFile = JSON.parse(readFileSync("assets/meetings.json", "utf8"));
const meetings = meetingsFile.meetings || [];

if (!meetings.length) fail("assets/meetings.json lists no meetings");

for (const meeting of meetings) {
  const where = `assets/meetings.json ${meeting.id || "(no id)"}`;
  for (const field of ["id", "title", "dayName", "start", "end", "time", "venueName", "location", "description", "firstDate", "byDay"]) {
    if (!meeting[field] && meeting[field] !== 0) fail(`${where}: missing "${field}"`);
  }
  if (!/^\d{2}:\d{2}$/.test(meeting.start || "") || !/^\d{2}:\d{2}$/.test(meeting.end || "")) {
    fail(`${where}: start and end must be HH:MM`);
  } else if (meeting.start >= meeting.end) {
    fail(`${where}: start ${meeting.start} is not before end ${meeting.end}`);
  }
  if (typeof meeting.dayOfWeek !== "number" || meeting.dayOfWeek < 0 || meeting.dayOfWeek > 6) {
    fail(`${where}: dayOfWeek must be 0-6`);
  } else if (meeting.dayName && DAY_NAMES[meeting.dayOfWeek] !== meeting.dayName) {
    fail(`${where}: dayName "${meeting.dayName}" does not match dayOfWeek ${meeting.dayOfWeek}`);
  }
  for (const dateField of ["firstDate", "calendarStartDate"]) {
    const value = meeting[dateField];
    if (!value || dateField === "calendarStartDate" && value === null) continue;
    if (weekdayOf(value) !== meeting.dayOfWeek) {
      fail(`${where}: ${dateField} ${value} is a ${DAY_NAMES[weekdayOf(value)]}, not a ${meeting.dayName}`);
    }
  }
  if (!meeting.address || !meeting.address.streetAddress || !meeting.address.postalCode) {
    fail(`${where}: needs a full address (street and postal code) for search engines`);
  }
}

const ids = meetings.map((meeting) => meeting.id).filter(Boolean);
if (new Set(ids).size !== ids.length) fail("assets/meetings.json: two meetings share an id");

for (const page of PAGES) {
  let text;
  try {
    text = stripToText(readFileSync(page, "utf8"));
  } catch {
    fail(`${page}: could not be read`);
    continue;
  }

  const ranges = timeRanges(text);

  for (const meeting of meetings) {
    const label = `${meeting.dayName || meeting.id} ${meeting.start}-${meeting.end}`;
    const found = ranges.some((range) => range.start === meeting.start && range.end === meeting.end);
    if (!found) {
      fail(
        `${page}: does not mention the ${label} meeting (${meeting.venueName}). ` +
          `Found these time ranges: ${ranges.map((r) => `${r.start}-${r.end}`).join(", ") || "none"}`
      );
    }
    if (meeting.dayName && !text.toLowerCase().includes(meeting.dayName.toLowerCase())) {
      fail(`${page}: does not mention ${meeting.dayName}`);
    }
    if (meeting.venueName && !text.includes(meeting.venueName)) {
      fail(`${page}: does not mention ${meeting.venueName}`);
    }
  }
}

if (problems.length) {
  console.error(`check-meetings: ${problems.length} problem(s)\n  ` + problems.join("\n  "));
  console.error(
    "\nThe pages are protected wording (README section 10): raise a wording change\n" +
      "with the exec rather than editing them, or fix assets/meetings.json if it is\n" +
      "the file that is out of date."
  );
  process.exit(1);
}

console.log(
  `check-meetings: ${meetings.length} meetings match ${PAGES.join(" and ")} ` +
    `(${meetings.map((m) => `${m.dayName} ${m.start}-${m.end}`).join(", ")})`
);
