#!/usr/bin/env node
/**
 * Regenerates the Event JSON-LD block in events-calendar.html from
 * assets/tournaments.json and assets/events.json, so structured data can never
 * drift from the tournaments the site actually shows.
 *
 * Run from the repository root:  node scripts/generate-event-schema.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const PAGE = "events-calendar.html";
const START = "<!-- event-schema:start";
const END = "<!-- event-schema:end -->";
const SITE_URL = "https://goderichchessclub.com";
const START_TIME = "09:00:00";
const END_TIME = "16:00:00";
const OFFSET = "-05:00"; // Eastern time; tournaments are daytime events

const tournaments = JSON.parse(readFileSync("assets/tournaments.json", "utf8"));
const events = JSON.parse(readFileSync("assets/events.json", "utf8"));

const today = new Date().toISOString().slice(0, 10);

function venueFrom(location) {
  const raw = String(location || "").trim();
  if (!raw) return null;
  // "Lakeshore United Church - 56 North St, Goderich, ON N7A 2T5"
  const [name, rest] = raw.split(/\s+-\s+/, 2);
  const address = { "@type": "PostalAddress", addressLocality: "Goderich", addressRegion: "ON", addressCountry: "CA" };
  if (rest) {
    const postal = rest.match(/\b([A-Z]\d[A-Z]\s?\d[A-Z]\d)\b/i);
    if (postal) address.postalCode = postal[1].toUpperCase();
    const street = rest.split(",")[0].trim();
    if (street) address.streetAddress = street;
  }
  return { "@type": "Place", name: rest ? name.trim() : raw, address };
}

function priceFrom(entryFee) {
  const match = String(entryFee || "").match(/(\d+(?:\.\d+)?)/);
  return match ? match[1] : null;
}

function registrationUrl(extraLinks) {
  if (!Array.isArray(extraLinks)) return null;
  const link = extraLinks.find((l) => l && /register|registration/i.test(l.label || ""));
  return link ? link.url : null;
}

function buildEvent({ title, date, endDate, location, description, entryFee, extraLinks, url }) {
  const price = priceFrom(entryFee);
  const event = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: title,
    description: description || undefined,
    startDate: `${date}T${START_TIME}${OFFSET}`,
    endDate: `${endDate || date}T${END_TIME}${OFFSET}`,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: [`${SITE_URL}/assets/logos/GCC%20large%20logo.png`],
    url: url || `${SITE_URL}/tournaments`,
    organizer: {
      "@type": "Organization",
      name: "Goderich Chess Club Inc.",
      url: `${SITE_URL}/`,
      email: "goderichchessclub@gmail.com",
    },
    performer: { "@type": "PerformingGroup", name: "Goderich Chess Club" },
  };

  const venue = venueFrom(location);
  if (venue) event.location = venue;

  if (price) {
    event.offers = {
      "@type": "Offer",
      price,
      priceCurrency: "CAD",
      availability: "https://schema.org/InStock",
      url: registrationUrl(extraLinks) || `${SITE_URL}/tournaments`,
      description: entryFee,
    };
  }

  return event;
}

function cleanDescription(text) {
  // Structured data wants plain text, not the card's line breaks and bold marks.
  return String(text || "")
    .replace(/\*\*/g, "")
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const seen = new Set();
const eventsOut = [];

for (const t of tournaments) {
  if (t.status !== "upcoming" || !t.date || t.date < today) continue;
  seen.add(`${t.date}|${t.title}`);
  eventsOut.push(
    buildEvent({
      title: t.title,
      date: t.date,
      endDate: t.endDate,
      location: t.location,
      description: cleanDescription(`${t.format}. ${t.location}.`),
      entryFee: t.entryFee,
      extraLinks: t.extraLinks,
      url: `${SITE_URL}/tournaments`,
    })
  );
}

// Special events live in events.json; skip anything already covered above.
for (const e of events) {
  if (!e.date || e.date < today) continue;
  if (seen.has(`${e.date}|${e.title}`)) continue;
  const location = (String(e.description || "").match(/Location:\s*([^\n]+)/i) || [])[1];
  eventsOut.push(
    buildEvent({
      title: e.title,
      date: e.date,
      location,
      description: cleanDescription(String(e.description || "").split(/\n\s*\n/)[0]),
      url: `${SITE_URL}/events-calendar`,
    })
  );
}

const html = readFileSync(PAGE, "utf8");
const startIndex = html.indexOf(START);
const endIndex = html.indexOf(END);

if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
  console.error(`generate-event-schema: markers not found in ${PAGE}`);
  process.exit(1);
}

const startedAt = html.slice(0, startIndex);
const endedAt = html.slice(endIndex + END.length);

const block = [
  `${START} — generated from assets/tournaments.json and assets/events.json by`,
  "  scripts/generate-event-schema.mjs; do not edit this block by hand -->",
  '<script type="application/ld+json">',
  JSON.stringify(eventsOut, null, 2),
  "</script>",
  END,
].join("\n");

writeFileSync(PAGE, startedAt + block + endedAt);
console.log(`generate-event-schema: wrote ${eventsOut.length} upcoming event(s) to ${PAGE}`);
