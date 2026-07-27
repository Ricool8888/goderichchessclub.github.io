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

  function nowStamp() {
    var d = new Date();
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + "T" +
      pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + "Z";
  }

  // opts: { uid, title, description, location, startDate ("YYYY-MM-DD"),
  //         startTime ("HH:MM" 24hr), endTime ("HH:MM" 24hr), rrule (optional, e.g. "FREQ=WEEKLY;BYDAY=TU") }
  function buildICS(opts) {
    var dtStart = opts.startDate.replace(/-/g, "") + "T" + opts.startTime.replace(":", "") + "00";
    var dtEnd = opts.startDate.replace(/-/g, "") + "T" + opts.endTime.replace(":", "") + "00";

    var lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Goderich Chess Club//Events//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      "UID:" + opts.uid + "@goderichchessclub.github.io",
      "DTSTAMP:" + nowStamp(),
      "DTSTART:" + dtStart,
      "DTEND:" + dtEnd
    ];

    if (opts.rrule) lines.push("RRULE:" + opts.rrule);

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
