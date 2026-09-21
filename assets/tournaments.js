(function () {
  "use strict";

  var MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  var state = {
    tournaments: [],
    activeTab: "upcoming"
  };

  function fetchTournaments() {
    return fetch("/assets/tournaments.json")
      .then(function (res) { if (!res.ok) throw new Error("no tournaments file"); return res.json(); })
      .catch(function () { return []; });
  }

  function sorted(list, ascending) {
    return list.slice().sort(function (a, b) {
      var diff = new Date(a.date) - new Date(b.date);
      return ascending ? diff : -diff;
    });
  }

  function buildDateBlock(t) {
    var start = new Date(t.date + "T00:00:00");
    var endIso = t.endDate || t.date;
    var end = new Date(endIso + "T00:00:00");

    var wrap = document.createElement("div");
    wrap.className = "tournament-date-block";

    var monthHtml, dayHtml, yearHtml, dayClass = "day";

    if (endIso === t.date) {
      // Single-day event - unchanged from before.
      monthHtml = MONTH_SHORT[start.getMonth()];
      dayHtml = start.getDate();
      yearHtml = start.getFullYear();
    } else if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
      // Multi-day, same month (the common case - a weekend tournament etc.)
      monthHtml = MONTH_SHORT[start.getMonth()];
      dayHtml = start.getDate() + "\u2013" + end.getDate();
      yearHtml = start.getFullYear();
    } else {
      // Multi-day spanning different months (and/or years) - fall back to a
      // smaller, compact full range rather than trying to force it into the
      // normal month/day layout.
      dayClass = "day range-compact";
      monthHtml = "";
      dayHtml = MONTH_SHORT[start.getMonth()] + " " + start.getDate() + "\u2013" + MONTH_SHORT[end.getMonth()] + " " + end.getDate();
      yearHtml = (start.getFullYear() === end.getFullYear())
        ? start.getFullYear()
        : (start.getFullYear() + "\u2013" + end.getFullYear());
    }

    wrap.innerHTML =
      '<div class="month">' + monthHtml + '</div>' +
      '<div class="' + dayClass + '">' + dayHtml + '</div>' +
      '<div class="year">' + yearHtml + '</div>';
    return wrap;
  }

  function formatFullDate(iso) {
    var d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }

  // Formats a tournament's date (or date range, when endDate is present and
  // different from date) for the meta row - e.g. "September 5, 2026",
  // "September 5-7, 2026", or "September 30 - October 2, 2026".
  function formatDateRange(t) {
    if (!t.endDate || t.endDate === t.date) return formatFullDate(t.date);

    var start = new Date(t.date + "T00:00:00");
    var end = new Date(t.endDate + "T00:00:00");

    if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
      var monthName = start.toLocaleDateString(undefined, { month: "long" });
      return monthName + " " + start.getDate() + "\u2013" + end.getDate() + ", " + start.getFullYear();
    }
    if (start.getFullYear() === end.getFullYear()) {
      var startPart = start.toLocaleDateString(undefined, { month: "long", day: "numeric" });
      var endPart = end.toLocaleDateString(undefined, { month: "long", day: "numeric" });
      return startPart + " \u2013 " + endPart + ", " + start.getFullYear();
    }
    return formatFullDate(t.date) + " \u2013 " + formatFullDate(t.endDate);
  }

  function buildCard(t) {
    var card = document.createElement("article");
    card.className = "tournament-card";
    card.appendChild(buildDateBlock(t));

    var body = document.createElement("div");

    var top = document.createElement("div");
    top.className = "tournament-body-top";
    var title = document.createElement("h3");
    title.className = "tournament-title";
    title.textContent = t.title;
    var pill = document.createElement("span");
    pill.className = "status-pill " + (t.status === "upcoming" ? "upcoming" : "completed");
    pill.textContent = t.status === "upcoming" ? "Upcoming" : "Completed";
    top.appendChild(title);
    top.appendChild(pill);
    body.appendChild(top);

    var metaRow = document.createElement("div");
    metaRow.className = "tournament-meta-row";
    var metas = [
      ["\uD83D\uDCC5", formatDateRange(t)],
      ["\uD83D\uDD52", t.time],
      ["\u265F", t.format],
      ["\uD83D\uDCCD", t.location],
      ["\uD83D\uDCB5", t.entryFee]
    ];
    metas.forEach(function (m) {
      if (!m[1]) return;
      var item = document.createElement("span");
      item.className = "tournament-meta-item";
      item.innerHTML = m[0] + " <strong>" + escapeHtml(m[1]) + "</strong>";
      metaRow.appendChild(item);
    });
    body.appendChild(metaRow);

    if (t.description) {
      var desc = document.createElement("p");
      desc.className = "tournament-desc";
      desc.innerHTML = formatRichText(t.description);
      body.appendChild(desc);
    }

    var links = document.createElement("div");
    links.className = "tournament-links";
    if (t.registerUrl) {
      var reg = document.createElement("a");
      reg.href = t.registerUrl;
      reg.textContent = "Register / Inquire \u2192";
      if (!/^mailto:/.test(t.registerUrl)) { reg.target = "_blank"; reg.rel = "noopener noreferrer"; }
      links.appendChild(reg);
    }
    if (t.resultsUrl) {
      var res = document.createElement("a");
      res.href = t.resultsUrl;
      res.target = "_blank";
      res.rel = "noopener noreferrer";
      res.textContent = "View Full Results \u2192";
      links.appendChild(res);
    }
    if (Array.isArray(t.extraLinks)) {
      t.extraLinks.forEach(function (link) {
        if (!link || !link.url || !link.label) return;
        var a = document.createElement("a");
        a.href = link.url;
        if (!/^mailto:/.test(link.url)) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
        a.textContent = link.label + " \u2192";
        links.appendChild(a);
      });
    }

    if (t.status === "upcoming") {
      var timeRange = parseTimeRange(t.time);
      if (timeRange) {
        var calBtn = document.createElement("button");
        calBtn.type = "button";
        calBtn.className = "btn-calendar";
        calBtn.style.marginTop = "4px";
        calBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> Add to Calendar';
        calBtn.addEventListener("click", function () {
          if (window.GCCCalendar) {
            window.GCCCalendar.downloadICS({
              uid: t.id,
              title: t.title,
              description: (t.description || "").replace(/\*\*/g, ""),
              location: t.location,
              startDate: t.date,
              endDate: t.endDate,
              startTime: timeRange.start,
              endTime: timeRange.end
            }, t.id + ".ics");
          }
        });
        links.appendChild(calBtn);
      }
    }

    if (links.childNodes.length) body.appendChild(links);

    card.appendChild(body);
    return card;
  }

  function parseTimeRange(timeStr) {
    if (!timeStr) return null;
    var matches = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi);
    if (!matches || matches.length < 2) return null;

    function to24Hour(part) {
      var m = part.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      var hour = parseInt(m[1], 10);
      var minute = m[2];
      var period = m[3].toUpperCase();
      if (period === "PM" && hour !== 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;
      return (hour < 10 ? "0" + hour : "" + hour) + ":" + minute;
    }

    return { start: to24Hour(matches[0]), end: to24Hour(matches[1]) };
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // Very small "markdown-lite" formatter: escapes all HTML first (so nothing
  // unsafe or broken can be injected via the JSON), then turns **text** into
  // bold. Line breaks are already handled by the .tournament-desc CSS
  // (white-space: pre-line), so plain \n in the JSON still works as before.
  function formatRichText(str) {
    var escaped = escapeHtml(str);
    return escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  }

  function render() {
    var grid = document.getElementById("tournamentGrid");
    grid.innerHTML = "";

    var list = state.tournaments.filter(function (t) { return t.status === state.activeTab; });
    list = sorted(list, state.activeTab === "upcoming");

    if (!list.length) {
      var empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = state.activeTab === "upcoming"
        ? "No upcoming tournaments scheduled yet - check back soon."
        : "No past tournaments recorded yet.";
      grid.appendChild(empty);
      return;
    }

    list.forEach(function (t) { grid.appendChild(buildCard(t)); });
  }

  function init() {
    var tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach(function (btn) {
      btn.addEventListener("click", function () {
        tabs.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        state.activeTab = btn.getAttribute("data-tab");
        render();
      });
    });

    fetchTournaments().then(function (data) {
      state.tournaments = data;
      render();
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
