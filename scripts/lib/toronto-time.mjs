/**
 * Goderich, Ontario runs on Eastern time: EST (-05:00) in winter, EDT
 * (-04:00) from the second Sunday in March to the first Sunday in November.
 *
 * Structured data and .ics files have to say which offset a wall-clock time
 * means, and the answer changes twice a year, so it must be derived from the
 * date rather than hard-coded. This is the one place that derivation lives;
 * anything else that needs it should import from here.
 *
 *   import { offsetFor, isoDateTime } from "./lib/toronto-time.mjs";
 *   offsetFor("2026-07-24")            // "-04:00"
 *   isoDateTime("2026-07-24", "18:00") // "2026-07-24T18:00:00-04:00"
 */
export const TIMEZONE = "America/Toronto";

// Throws on an impossible date such as "2026-02-30" rather than quietly
// rolling it forward the way the Date constructor would.
function assertRealDate(dateISO) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO);
  if (!m) throw new Error(`"${dateISO}" is not a YYYY-MM-DD date`);
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    throw new Error(`"${dateISO}" is not a real date`);
  }
}

/**
 * The UTC offset in force at noon on that date in Toronto, as "+hh:mm" or
 * "-hh:mm". Noon is used because the clocks change at 02:00, so the middle of
 * the day is safely on one side of a change.
 */
export function offsetFor(dateISO) {
  assertRealDate(dateISO);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    timeZoneName: "longOffset",
  }).formatToParts(new Date(`${dateISO}T12:00:00Z`));

  const zone = parts.find((part) => part.type === "timeZoneName");
  const offset = zone && /GMT([+-]\d{2}:\d{2})/.exec(zone.value);
  if (!offset) {
    throw new Error(
      `could not read the ${TIMEZONE} offset for ${dateISO} (this Node build may have no full ICU data)`
    );
  }
  return offset[1];
}

/** "2026-07-24" + "18:00" -> "2026-07-24T18:00:00-04:00" */
export function isoDateTime(dateISO, timeHHMM) {
  if (!/^\d{2}:\d{2}$/.test(timeHHMM || "")) {
    throw new Error(`"${timeHHMM}" is not an HH:MM time`);
  }
  return `${dateISO}T${timeHHMM}:00${offsetFor(dateISO)}`;
}

/** 0 = Sunday ... 6 = Saturday, for a YYYY-MM-DD date. */
export function weekdayOf(dateISO) {
  assertRealDate(dateISO);
  return new Date(`${dateISO}T12:00:00Z`).getUTCDay();
}

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
