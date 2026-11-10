#!/usr/bin/env node
/**
 * Writes the recurring weekly meetings into index.html as Event structured
 * data, between the meetings-schema markers in the <head>.
 *
 * The meetings themselves live in assets/meetings.json - the same file the
 * calendar draws its Tuesday and Friday nights from and that the Events
 * Calendar page builds its .ics downloads from - so a day, time or venue is
 * still typed only once.
 *
 * Each Event carries an eventSchedule (byDay, startTime, endTime,
 * repeatFrequency P1W) so a search engine can show "Tuesdays 6-9pm" rather
 * than a single date, and exceptDate for every club closure that falls on
 * that meeting's weekday.
 *
 * Run from the repository root:
 *   node scripts/generate-meeting-schema.mjs [--check]
 *
 * --check writes nothing and exits non-zero if index.html has fallen behind,
 * which is what the checks in .github/workflows/validate.yml do.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { DAY_NAMES, isoDateTime, offsetFor, weekdayOf } from "./lib/toronto-time.mjs";

const CHECK = process.argv.includes("--check");
const PAGE = "index.html";
const START = "<!-- meetings-schema:start";
const END = "<!-- meetings-schema:end -->";
const SITE = "https://goderichchessclub.com/";

const meetingsFile = JSON.parse(readFileSync("assets/meetings.json", "utf8"));
const closuresFile = JSON.parse(readFileSync("assets/closures.json", "utf8"));

const meetings = meetingsFile.meetings || [];
const closures = closuresFile.closures || [];
const timezone = meetingsFile.timezone || "America/Toronto";

if (!meetings.length) throw new Error("assets/meetings.json lists no meetings");

function meetingEvent(meeting) {
  const dayName = DAY_NAMES[meeting.dayOfWeek];
  if (!dayName) throw new Error(`${meeting.id}: dayOfWeek must be 0-6`);

  if (weekdayOf(meeting.firstDate) !== meeting.dayOfWeek) {
    throw new Error(
      `${meeting.id}: firstDate ${meeting.firstDate} is a ${DAY_NAMES[weekdayOf(meeting.firstDate)]}, not a ${dayName}`
    );
  }

  // A closure only belongs on this meeting if the closed night is that
  // weekday, so a closed Saturday never cancels the Tuesday meeting.
  const exceptDates = closures
    .filter((closure) => closure && closure.date && weekdayOf(closure.date) === meeting.dayOfWeek)
    .map((closure) => isoDateTime(closure.date, meeting.start))
    .sort();

  const eventSchedule = {
    "@type": "Schedule",
    byDay: `https://schema.org/${dayName}`,
    startTime: meeting.start,
    endTime: meeting.end,
    repeatFrequency: "P1W",
  };
  if (exceptDates.length) eventSchedule.exceptDate = exceptDates;

  return {
    "@type": "Event",
    name: `${meeting.title} at ${meeting.venueName}`,
    description: meeting.description,
    url: `${SITE}events-calendar`,
    startDate: isoDateTime(meeting.firstDate, meeting.start),
    endDate: isoDateTime(meeting.firstDate, meeting.end),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    isAccessibleForFree: true,
    location: {
      "@type": "Place",
      name: meeting.venueName,
      address: {
        "@type": "PostalAddress",
        streetAddress: meeting.address.streetAddress,
        addressLocality: meeting.address.addressLocality,
        addressRegion: meeting.address.addressRegion,
        postalCode: meeting.address.postalCode,
        addressCountry: meeting.address.addressCountry,
      },
    },
    organizer: {
      "@type": "Organization",
      name: "Goderich Chess Club",
      url: SITE,
      email: "goderichchessclub@gmail.com",
    },
    eventSchedule,
  };
}

const graph = {
  "@context": "https://schema.org",
  "@graph": meetings.map(meetingEvent),
};

const block = [
  `${START} - generated from assets/meetings.json by scripts/generate-meeting-schema.mjs. Do not edit by hand. -->`,
  '<script type="application/ld+json">',
  JSON.stringify(graph, null, 2),
  "</script>",
  END,
].join("\n");

const page = readFileSync(PAGE, "utf8");
const start = page.indexOf(START);
if (start === -1) throw new Error(`${PAGE}: no ${START} marker found`);
const end = page.indexOf(END, start);
if (end === -1) throw new Error(`${PAGE}: the ${START} block has no ${END}`);

const updated = page.slice(0, start) + block + page.slice(end + END.length);

if (updated === page) {
  console.log(
    `meeting schema: ${PAGE} is up to date (${meetings.length} recurring meetings, ${timezone}, first offset ${offsetFor(meetings[0].firstDate)})`
  );
  process.exit(0);
}

if (CHECK) {
  console.error(
    `meeting schema: ${PAGE} does not match assets/meetings.json\n` +
      "  Run `node scripts/generate-meeting-schema.mjs` and commit the result."
  );
  process.exit(1);
}

writeFileSync(PAGE, updated);
console.log(`meeting schema: rebuilt the recurring-meeting block in ${PAGE} (${graph["@graph"].length} events)`);
