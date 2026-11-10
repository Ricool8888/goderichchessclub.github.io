(function () {
  "use strict";

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function escapeICS(str) {
    return String(str || "")
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  }

  function foldLine(line) {
    // ICS spec: lines should be folded at 75 octets. Keeps generated
    // files well-formed for stricter calendar apps (e.g. Outlook).
    if (line.length <= 75) return line;
    var out = "";
    var i = 0;
    while (i < line.length) {
      var chunk = line.slice(i, i + 74);
      out += (i === 0 ? "" : "\r\n ") + chunk;
      i += 74;
    }
    return out;
  }

  /*
   * Goderich, Ontario is in the Eastern time zone. A calendar file should
   * name the zone and carry its daylight-saving rules: a time with no zone
   * at all ("floating") is read as the reader's own local time, so a meeting
   * imported onto a phone set to another time zone would land at the wrong
   * hour. The VTIMEZONE below is the standard America/Toronto definition -
   * second Sunday in March to first Sunday in November.
   */
  var TIMEZONE = "America/Toronto";

  var VTIMEZONE = [
    "BEGIN:VTIMEZONE",
    "TZID:" + TIMEZONE,
    "X-LIC-LOCATION:" + TIMEZONE,
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:-0500",
    "TZOFFSETTO:-0400",
    "TZNAME:EDT",
    "DTSTART:19700308T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:-0400",
    "TZOFFSETTO:-0500",
    "TZNAME:EST",
    "DTSTART:19701101T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
    "END:STANDARD",
    "END:VTIMEZONE"
  ];

  // "2027-01-16" + "09:00" -> "TZID=America/Toronto:20270116T090000", the
  // local wall-clock time in Goderich with the zone attached.
  function localDateTime(dateISO, time) {
    return "TZID=" + TIMEZONE + ":" +
      dateISO.replace(/-/g, "") + "T" + time.replace(/:/g, "") + "00";
  }

  function nowStamp() {
    var d = new Date();
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + "T" +
      pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + "Z";
  }

  // opts: { uid, title, description, location, startDate ("YYYY-MM-DD"),
  //         startTime ("HH:MM" 24hr), endTime ("HH:MM" 24hr),
  //         endDate (optional "YYYY-MM-DD" - for multi-day events; defaults
  //         to startDate when omitted), rrule (optional, e.g. "FREQ=WEEKLY;BYDAY=TU"),
  //         exdates (optional array of "YYYY-MM-DD" dates the recurring
  //         event skips, e.g. club closures) }
  function buildICS(opts) {
    var endDate = opts.endDate || opts.startDate;

    var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Goderich Chess Club//Events//EN", "CALSCALE:GREGORIAN"]
      .concat(VTIMEZONE)
      .concat([
        "BEGIN:VEVENT",
        "UID:" + opts.uid + "@goderichchessclub.github.io",
        "DTSTAMP:" + nowStamp(),
        "DTSTART;" + localDateTime(opts.startDate, opts.startTime),
        "DTEND;" + localDateTime(endDate, opts.endTime)
      ]);

    if (opts.rrule) lines.push("RRULE:" + opts.rrule);

    // Skipped dates (club closures) travel with the recurring event so the
    // imported calendar matches what the website shows.
    if (opts.exdates && opts.exdates.length) {
      lines.push("EXDATE;TZID=" + TIMEZONE + ":" + opts.exdates.map(function (date) {
        return date.replace(/-/g, "") + "T" + opts.startTime.replace(/:/g, "") + "00";
      }).join(","));
    }

    lines.push("SUMMARY:" + escapeICS(opts.title));
    if (opts.location) lines.push("LOCATION:" + escapeICS(opts.location));
    if (opts.description) lines.push("DESCRIPTION:" + escapeICS(opts.description));

    lines.push("END:VEVENT", "END:VCALENDAR");

    return lines.map(foldLine).join("\r\n");
  }

  function downloadICS(opts, filename) {
    var content = buildICS(opts);
    var blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename || "event.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  window.GCCCalendar = { downloadICS: downloadICS };
})();
