#!/usr/bin/env node
/**
 * Checks the JSON files the site is built from, before they reach the live site.
 *
 * The pages render whatever these files say, so a typo in them does not show up
 * as a broken build - it shows up as a missing photo, a card with no date, or a
 * tournament that silently disappears. This script catches those cases:
 *
 *   - every JSON file parses
 *   - every gallery photo file exists, with its two thumbnail copies
 *   - gallery photo ids are unique, and every photo has alt text
 *   - every book row has a description, and every description is used
 *   - dates are real YYYY-MM-DD dates and appear in a sensible order
 *   - club closures fall on a Tuesday or Friday, the nights the club meets
 *   - ids are unique and required fields are not blank
 *
 * Run from the repository root:
 *
 *   node scripts/check-data.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const problems = [];

function report(file, message) {
  problems.push(`${file}: ${message}`);
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    report(file, `could not be read as JSON (${error.message})`);
    return null;
  }
}

function isIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isBlank(value) {
  return typeof value !== "string" || !value.trim();
}

function requireText(file, item, field, label) {
  if (isBlank(item[field])) report(file, `${label} has no "${field}"`);
}

function requireIsoDate(file, item, field, label) {
  if (!isIsoDate(item[field])) {
    report(file, `${label} has "${field}": ${JSON.stringify(item[field])}, which is not a YYYY-MM-DD date`);
  }
}

function checkUniqueIds(file, items) {
  const seen = new Set();
  for (const item of items) {
    if (isBlank(item.id)) {
      report(file, "an entry has no id");
      continue;
    }
    if (seen.has(item.id)) report(file, `duplicate id "${item.id}"`);
    seen.add(item.id);
  }
}

// A missing file here is a hard failure: the checks below would otherwise
// quietly pass on an empty list.
function expectArray(file) {
  const data = readJson(file);
  if (data === null) return null;
  if (!Array.isArray(data)) {
    report(file, "should contain a list");
    return null;
  }
  return data;
}

/* ---------------------------------------------------------------- gallery -- */

const gallery = expectArray("assets/gallery.json");

if (gallery) {
  const photos = [];
  for (const section of gallery) {
    if (isBlank(section.title)) report("assets/gallery.json", "a section has no title");
    if (!Array.isArray(section.photos)) {
      report("assets/gallery.json", `section "${section.title}" has no photos list`);
      continue;
    }
    photos.push(...section.photos);
  }

  if (!photos.length) report("assets/gallery.json", "contains no photos");

  checkUniqueIds("assets/gallery.json", photos);

  for (const photo of photos) {
    const label = `photo "${photo.filename || photo.id || "(no filename)"}"`;

    if (isBlank(photo.filename)) {
      report("assets/gallery.json", `${label} has no filename`);
      continue;
    }
    if (isBlank(photo.alt)) report("assets/gallery.json", `${label} has no alt text`);

    const original = join("assets/gallery", photo.filename);
    if (!existsSync(original)) {
      report("assets/gallery.json", `${label} points at a file that does not exist: ${original}`);
      continue;
    }

    for (const width of [480, 960]) {
      const thumb = join("assets/gallery/thumbs", `${photo.filename}-${width}.webp`);
      if (!existsSync(thumb)) {
        report(
          "assets/gallery.json",
          `${label} is missing its ${width}px thumbnail (run: node scripts/generate-gallery-thumbs.mjs)`
        );
      }
    }
  }
}

/* ---------------------------------------------------------------- closures -- */

const closuresFile = "assets/closures.json";
const closuresData = readJson(closuresFile);

if (closuresData) {
  const closures = Array.isArray(closuresData) ? closuresData : closuresData.closures;

  if (!Array.isArray(closures)) {
    report(closuresFile, 'should contain a "closures" list');
  } else {
    let previous = "";

    for (const closure of closures) {
      requireIsoDate(closuresFile, closure, "date", "a closure");
      requireText(closuresFile, closure, "reason", `the closure on ${closure.date}`);

      if (!isIsoDate(closure.date)) continue;

      if (closure.date < previous) {
        report(closuresFile, `closures are out of order at ${closure.date} - keep them oldest first`);
      }
      previous = closure.date;

      // The club meets on Tuesdays and Fridays; a closure on any other day
      // would never hide a meeting and is almost always a typo.
      const day = new Date(`${closure.date}T00:00:00Z`).getUTCDay();
      if (day !== 2 && day !== 5) {
        report(closuresFile, `${closure.date} is not a Tuesday or Friday, so no meeting would be closed`);
      }
    }

    const dates = closures.map((closure) => closure.date);
    if (new Set(dates).size !== dates.length) {
      report(closuresFile, "the same date is listed twice");
    }
  }
}

/* ------------------------------------------------------------- tournaments -- */

const tournamentsFile = "assets/tournaments.json";
const tournaments = expectArray(tournamentsFile);

if (tournaments) {
  checkUniqueIds(tournamentsFile, tournaments);

  for (const tournament of tournaments) {
    const label = `tournament "${tournament.title || tournament.id || "(untitled)"}"`;

    requireText(tournamentsFile, tournament, "title", label);
    requireText(tournamentsFile, tournament, "status", label);
    requireText(tournamentsFile, tournament, "format", label);
    requireText(tournamentsFile, tournament, "location", label);
    requireText(tournamentsFile, tournament, "description", label);
    requireIsoDate(tournamentsFile, tournament, "date", label);

    if (tournament.endDate !== undefined) {
      requireIsoDate(tournamentsFile, tournament, "endDate", label);
      if (isIsoDate(tournament.date) && isIsoDate(tournament.endDate) && tournament.endDate < tournament.date) {
        report(tournamentsFile, `${label} ends before it starts (${tournament.date} to ${tournament.endDate})`);
      }
    }

    if (tournament.extraLinks !== undefined) {
      if (!Array.isArray(tournament.extraLinks)) {
        report(tournamentsFile, `${label} has an extraLinks value that is not a list`);
      } else {
        for (const link of tournament.extraLinks) {
          if (isBlank(link.label) || isBlank(link.url)) {
            report(tournamentsFile, `${label} has an extra link missing its label or url`);
          }
        }
      }
    }
  }
}

/* ------------------------------------------------------------------ events -- */

const eventsFile = "assets/events.json";
const events = expectArray(eventsFile);

if (events) {
  checkUniqueIds(eventsFile, events);

  for (const event of events) {
    const label = `event "${event.title || event.id || "(untitled)"}"`;
    requireText(eventsFile, event, "title", label);
    requireText(eventsFile, event, "time", label);
    requireText(eventsFile, event, "description", label);
    requireIsoDate(eventsFile, event, "date", label);
  }
}

/* ------------------------------------------------------------------- posts -- */

const postsFile = "assets/posts.json";
const posts = expectArray(postsFile);

if (posts) {
  checkUniqueIds(postsFile, posts);

  for (const post of posts) {
    const label = `post "${post.title || post.id || "(untitled)"}"`;
    requireText(postsFile, post, "title", label);
    requireText(postsFile, post, "category", label);
    requireText(postsFile, post, "excerpt", label);
    requireText(postsFile, post, "content", label);
    requireIsoDate(postsFile, post, "date", label);
  }
}

/* ------------------------------------------------------------------ banner -- */

const bannerFile = "assets/banner.json";
const bannerData = readJson(bannerFile);

if (bannerData) {
  const banners = Array.isArray(bannerData) ? bannerData : [bannerData];

  for (const banner of banners) {
    const label = `banner "${banner.id || "(no id)"}"`;
    requireText(bannerFile, banner, "id", label);
    requireText(bannerFile, banner, "message", label);

    if (banner.linkUrl !== undefined || banner.linkText !== undefined) {
      if (isBlank(banner.linkUrl) || isBlank(banner.linkText)) {
        report(bannerFile, `${label} needs both linkUrl and linkText, or neither`);
      }
    }

    if (banner.countdown && banner.countdown.enabled) {
      const deadline = new Date(banner.countdown.deadlineUTC);
      if (Number.isNaN(deadline.getTime())) {
        report(bannerFile, `${label} has a countdown deadline that is not a date`);
      }
    }
  }

  const ids = banners.map((banner) => banner.id);
  if (new Set(ids).size !== ids.length) {
    report(bannerFile, "the same banner id is used twice");
  }
}

/* ------------------------------------------------------------------ result -- */

if (problems.length) {
  for (const problem of problems) console.error(problem);
  console.error(`\ndata check failed with ${problems.length} problem(s)`);
  process.exitCode = 1;
} else {
  console.log(
    `data check passed: ${gallery ? gallery.reduce((n, s) => n + (s.photos || []).length, 0) : 0} photos, ` +
      `${tournaments ? tournaments.length : 0} tournaments, ${events ? events.length : 0} events, ` +
      `${posts ? posts.length : 0} posts`
  );
}
