(function () {
  "use strict";

  var MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  var RECURRING_EVENTS = [
    {
      id: "recurring-tuesday-library",
      dayOfWeek: 2,
      startDate: null,
      cssClass: "recurring",
      time: "6:00 PM - 8:00 PM",
      title: "Weekly Club Meeting",
      description: "Open play at Goderich Library. All skill levels welcome, free admission."
    },
    {
      id: "recurring-friday-legion",
      dayOfWeek: 5,
      startDate: "2026-07-24",
      cssClass: "recurring-alt",
      time: "6:00 PM - 9:00 PM",
      title: "Weekly Club Meeting",
      description: "Open play at Goderich Legion. All skill levels welcome, free admission."
    }
  ];

  var VIEW_KEY = "gcc-calendar-view";

  var state = {
    viewYear: new Date().getFullYear(),
    viewMonth: new Date().getMonth(),
    view: initialView(),
    publishedEvents: [],
    // "YYYY-MM-DD" -> closure reason, from assets/closures.json
    closures: {},
    // Which day button in the month grid is in the tab order.
    gridFocusIso: null
  };

  // A visitor's last choice wins; otherwise small screens start in list
  // view, where the month grid gets cramped.
  function initialView() {
    var saved = null;
    try { saved = window.localStorage.getItem(VIEW_KEY); } catch (e) { /* storage unavailable */ }
    if (saved === "month" || saved === "list") return saved;
    return window.matchMedia && window.matchMedia("(max-width: 640px)").matches ? "list" : "month";
  }

  function setView(view) {
    state.view = view;
    try { window.localStorage.setItem(VIEW_KEY, view); } catch (e) { /* storage unavailable */ }
    render();
  }

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function toISODate(y, m, d) {
    return y + "-" + pad(m + 1) + "-" + pad(d);
  }

  function fetchPublishedEvents() {
    return fetch("assets/events.json")
      .then(function (res) { if (!res.ok) throw new Error("no events file"); return res.json(); })
      .catch(function () { return []; });
  }

  /*
   * Tournaments are read from assets/tournaments.json - the same file that
   * writes the tournament cards - so a date, venue or title is only ever
   * typed once. events.json is left for events that are not tournaments
   * (a simul, a guest speaker, a club social).
   */
  function fetchTournaments() {
    return fetch("assets/tournaments.json")
      .then(function (res) { if (!res.ok) throw new Error("no tournaments file"); return res.json(); })
      .catch(function () { return []; });
  }

  function tournamentsAsEvents(list) {
    return (list || []).map(function (t) {
      if (!t || !t.date || !t.title) return null;

      var details = String(t.description || "").replace(/\*\*/g, "").trim();
      var lines = [];
      if (t.location) lines.push("Location: " + t.location);
      if (details) lines.push(details);

      return {
        id: t.id,
        date: t.date,
        time: t.time || "",
        title: t.title,
        description: lines.join("\n\n")
      };
    }).filter(Boolean);
  }

  function fetchClosures() {
    return fetch("assets/closures.json")
      .then(function (res) { if (!res.ok) throw new Error("no closures file"); return res.json(); })
      .then(function (data) {
        var map = {};
        ((data && data.closures) || []).forEach(function (c) {
          if (c && c.date) map[c.date] = c.reason || "Club closed";
        });
        return map;
      })
      .catch(function () { return {}; });
  }

  function eventsForDate(iso) {
    return state.publishedEvents.filter(function (e) { return e.date === iso; });
  }

  function closureForDate(iso) {
    return state.closures[iso] || null;
  }

  function recurringEventsForDate(iso, dayOfWeek) {
    // A closure overrides the weekly meeting, so the calendar never
    // advertises a club night on a day the club is closed.
    if (state.closures[iso]) return [];
    return RECURRING_EVENTS.filter(function (r) {
      if (r.dayOfWeek !== dayOfWeek) return false;
      if (r.startDate && iso < r.startDate) return false;
      return true;
    });
  }

  function render() {
    var label = document.getElementById("calendarMonthLabel");
    label.textContent = MONTH_NAMES[state.viewMonth] + " " + state.viewYear;

    var isList = state.view === "list";
    document.getElementById("calendarGrid").hidden = isList;
    document.getElementById("calendarList").hidden = !isList;
    document.getElementById("monthViewBtn").setAttribute("aria-pressed", isList ? "false" : "true");
    document.getElementById("listViewBtn").setAttribute("aria-pressed", isList ? "true" : "false");

    if (isList) renderList(); else renderGrid();
  }

  function renderGrid() {
    var grid = document.getElementById("calendarGrid");
    grid.innerHTML = "";
    grid.setAttribute("aria-labelledby", "calendarMonthLabel");

    function addRow() {
      var row = document.createElement("div");
      row.className = "calendar-row";
      row.setAttribute("role", "row");
      grid.appendChild(row);
      return row;
    }

    function emptyCell() {
      var cell = document.createElement("div");
      cell.setAttribute("role", "gridcell");
      return cell;
    }

    var headerRow = addRow();
    WEEKDAYS.forEach(function (w) {
      var el = document.createElement("div");
      el.className = "calendar-weekday";
      el.setAttribute("role", "columnheader");
      el.textContent = w;
      headerRow.appendChild(el);
    });

    var firstDay = new Date(state.viewYear, state.viewMonth, 1).getDay();
    var daysInMonth = new Date(state.viewYear, state.viewMonth + 1, 0).getDate();
    var today = new Date();
    var todayISO = toISODate(today.getFullYear(), today.getMonth(), today.getDate());
    var monthPrefix = state.viewYear + "-" + pad(state.viewMonth + 1) + "-";

    // Only one day button is in the tab order; the arrow keys move from it,
    // as the ARIA grid pattern expects. Start on today, or on the first of
    // the month when today is in a different month.
    if (!state.gridFocusIso || state.gridFocusIso.indexOf(monthPrefix) !== 0) {
      state.gridFocusIso = todayISO.indexOf(monthPrefix) === 0
        ? todayISO
        : monthPrefix + "01";
    }

    var week = addRow();

    for (var i = 0; i < firstDay; i++) {
      week.appendChild(emptyCell());
    }

    for (var d = 1; d <= daysInMonth; d++) {
      if (week.children.length === 7) week = addRow();

      var iso = toISODate(state.viewYear, state.viewMonth, d);
      var dayOfWeek = new Date(state.viewYear, state.viewMonth, d).getDay();
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "calendar-day";
      btn.dataset.iso = iso;
      btn.tabIndex = iso === state.gridFocusIso ? 0 : -1;
      if (iso === todayISO) btn.classList.add("today");

      var dayEvents = eventsForDate(iso);
      var recurring = recurringEventsForDate(iso, dayOfWeek);
      var closure = closureForDate(iso);
      if (dayEvents.length || recurring.length || closure) btn.classList.add("has-event");

      // Special events (from events.json) take visual priority over a
      // recurring weekly meeting if a day happens to have both.
      if (closure) {
        btn.classList.add("day-closed");
      } else if (dayEvents.length) {
        btn.classList.add("day-special-event");
      } else if (recurring.some(function (r) { return r.cssClass === "recurring"; })) {
        btn.classList.add("day-tuesday-meeting");
      } else if (recurring.some(function (r) { return r.cssClass === "recurring-alt"; })) {
        btn.classList.add("day-friday-meeting");
      }

      var num = document.createElement("span");
      num.className = "day-number";
      num.textContent = d;
      btn.appendChild(num);

      recurring.forEach(function (r) {
        var dot = document.createElement("span");
        dot.className = "day-event-dot " + r.cssClass;
        dot.textContent = r.title;
        btn.appendChild(dot);
      });

      dayEvents.slice(0, 2).forEach(function (ev) {
        var dot = document.createElement("span");
        dot.className = "day-event-dot";
        dot.textContent = ev.title;
        btn.appendChild(dot);
      });

      if (closure) {
        var closedDot = document.createElement("span");
        closedDot.className = "day-event-dot closed";
        closedDot.textContent = "No meeting — " + closure.toLowerCase();
        btn.appendChild(closedDot);
      }

      var ariaLabel = MONTH_NAMES[state.viewMonth] + " " + d;
      if (closure) ariaLabel += ", no meeting, " + closure.toLowerCase();
      if (recurring.length) ariaLabel += ", " + recurring.map(function (r) { return r.title; }).join(", ");
      if (dayEvents.length) ariaLabel += ", " + dayEvents.length + " event(s)";
      btn.setAttribute("aria-label", ariaLabel);

      btn.addEventListener("click", function (isoDate, dow) {
        return function () { openDayModal(isoDate, dow); };
      }(iso, dayOfWeek));

      var cell = document.createElement("div");
      cell.setAttribute("role", "gridcell");
      cell.appendChild(btn);
      week.appendChild(cell);
    }

    // Complete the last week so every row has seven cells.
    while (week.children.length < 7) week.appendChild(emptyCell());
  }

  // Move the single tab stop to the given day button.
  function focusGridDay(btn) {
    var buttons = document.querySelectorAll("#calendarGrid .calendar-day");
    for (var i = 0; i < buttons.length; i++) buttons[i].tabIndex = -1;
    btn.tabIndex = 0;
    state.gridFocusIso = btn.dataset.iso;
    btn.focus();
  }

  // List view: every day in the shown month that has something on, starting
  // from today when the shown month is the current one.
  function renderList() {
    var list = document.getElementById("calendarList");
    list.innerHTML = "";

    var daysInMonth = new Date(state.viewYear, state.viewMonth + 1, 0).getDate();
    var today = new Date();
    var todayISO = toISODate(today.getFullYear(), today.getMonth(), today.getDate());

    for (var d = 1; d <= daysInMonth; d++) {
      var iso = toISODate(state.viewYear, state.viewMonth, d);
      if (iso < todayISO) continue;
      var dateObj = new Date(state.viewYear, state.viewMonth, d);
      var recurring = recurringEventsForDate(iso, dateObj.getDay());
      var dayEvents = eventsForDate(iso);
      var closure = closureForDate(iso);
      if (!recurring.length && !dayEvents.length && !closure) continue;

      var day = document.createElement("section");
      day.className = "calendar-list-day";
      if (iso === todayISO) day.classList.add("today");

      var heading = document.createElement("h3");
      heading.className = "calendar-list-date";
      heading.textContent = dateObj.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
      if (iso === todayISO) {
        var badge = document.createElement("span");
        badge.className = "calendar-list-today";
        badge.textContent = "Today";
        heading.appendChild(badge);
      }
      day.appendChild(heading);

      recurring.forEach(function (r) {
        day.appendChild(buildListItem(r, r.cssClass === "recurring" ? "tuesday" : "friday"));
      });
      dayEvents.forEach(function (ev) { day.appendChild(buildListItem(ev, "special")); });
      if (closure) {
        day.appendChild(buildListItem({
          time: "",
          title: "No meeting",
          description: closure.charAt(0) + closure.slice(1).toLowerCase() + " — the club is not meeting this day."
        }, "closed"));
      }

      list.appendChild(day);
    }

    if (!list.children.length) {
      var p = document.createElement("p");
      p.className = "muted-note";
      var monthStart = toISODate(state.viewYear, state.viewMonth, 1);
      p.textContent = monthStart > todayISO || state.viewMonth === today.getMonth() && state.viewYear === today.getFullYear()
        ? "No upcoming events this month."
        : "This month has passed — use the arrows or Today to see upcoming events.";
      list.appendChild(p);
    }
  }

  function buildListItem(ev, kind) {
    var item = buildEventItem(ev);
    item.classList.add("calendar-list-item", "calendar-list-" + kind);
    var marker = document.createElement("span");
    marker.className = "legend-dot legend-dot-" + kind;
    marker.setAttribute("aria-hidden", "true");
    item.insertBefore(marker, item.firstChild);
    return item;
  }

  // The day button that opened the modal, so focus can go back to it on close.
  var dayModalReturnFocus = null;

  function openDayModal(iso, dayOfWeek) {
    var overlay = document.getElementById("dayModalOverlay");
    var titleEl = document.getElementById("dayModalTitle");
    var listEl = document.getElementById("dayModalEvents");
    var dateObj = new Date(iso + "T00:00:00");

    titleEl.textContent = dateObj.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    listEl.innerHTML = "";
    var recurring = recurringEventsForDate(iso, dayOfWeek);
    var closure = closureForDate(iso);
    recurring.forEach(function (r) { listEl.appendChild(buildEventItem(r)); });
    eventsForDate(iso).forEach(function (ev) { listEl.appendChild(buildEventItem(ev)); });

    if (closure) {
      var closedNote = document.createElement("p");
      closedNote.className = "muted-note";
      closedNote.textContent = closure + " — no meeting on this day.";
      listEl.appendChild(closedNote);
    } else if (!recurring.length && eventsForDate(iso).length === 0) {
      var p = document.createElement("p");
      p.className = "muted-note";
      p.textContent = "No events scheduled for this day.";
      listEl.appendChild(p);
    }

    dayModalReturnFocus = document.activeElement;

    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");

    // Move focus into the dialog, otherwise a keyboard visitor is still
    // "inside" the day button behind the overlay and cannot reach Close.
    var closeBtn = document.getElementById("modalCloseBtn");
    if (closeBtn) closeBtn.focus();
  }

  function buildEventItem(ev) {
    var wrap = document.createElement("div");
    wrap.className = "existing-event-item";
    var t = document.createElement("div");
    t.className = "ev-time";
    t.textContent = ev.time || "";
    var title = document.createElement("div");
    title.className = "ev-title";
    title.textContent = ev.title;
    var desc = document.createElement("div");
    desc.className = "ev-desc";
    desc.textContent = ev.description || "";
    wrap.appendChild(t);
    wrap.appendChild(title);
    if (ev.description) wrap.appendChild(desc);
    return wrap;
  }

  function closeDayModal() {
    var overlay = document.getElementById("dayModalOverlay");
    if (!overlay.classList.contains("open")) return;
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");

    // Put focus back on the day that was opened, so keyboard users keep
    // their place in the month instead of starting over at the top.
    if (dayModalReturnFocus && dayModalReturnFocus.isConnected) {
      dayModalReturnFocus.focus();
    }
    dayModalReturnFocus = null;
  }

  function init() {
    document.getElementById("prevMonthBtn").addEventListener("click", function () {
      state.viewMonth--;
      if (state.viewMonth < 0) { state.viewMonth = 11; state.viewYear--; }
      render();
    });
    document.getElementById("nextMonthBtn").addEventListener("click", function () {
      state.viewMonth++;
      if (state.viewMonth > 11) { state.viewMonth = 0; state.viewYear++; }
      render();
    });
    document.getElementById("todayBtn").addEventListener("click", function () {
      var now = new Date();
      state.viewYear = now.getFullYear();
      state.viewMonth = now.getMonth();
      render();
    });
    document.getElementById("monthViewBtn").addEventListener("click", function () { setView("month"); });
    document.getElementById("listViewBtn").addEventListener("click", function () { setView("list"); });

    // Arrow keys move between days, Home/End jump to the ends of the week.
    // Tab moves out of the grid instead of stepping through thirty buttons.
    document.getElementById("calendarGrid").addEventListener("keydown", function (e) {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].indexOf(e.key) === -1) return;

      var btn = e.target;
      if (!btn || !btn.parentNode || btn.parentNode.getAttribute("role") !== "gridcell") return;

      var cell = btn.parentNode;
      var rowEl = cell.parentNode;
      var rows = Array.prototype.slice.call(this.querySelectorAll(".calendar-row")).slice(1);
      var rowIndex = rows.indexOf(rowEl);
      var col = Array.prototype.indexOf.call(rowEl.children, cell);
      if (rowIndex === -1) return;

      e.preventDefault();

      var target = null;

      if (e.key === "Home" || e.key === "End") {
        var cells = Array.prototype.slice.call(rowEl.children);
        if (e.key === "End") cells.reverse();
        for (var i = 0; i < cells.length; i++) {
          var found = cells[i].querySelector(".calendar-day");
          if (found) { target = found; break; }
        }
      } else {
        var nextRow = rowIndex + (e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0);
        var nextCol = col + (e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0);
        var rowNode = rows[nextRow];
        var cellNode = rowNode && rowNode.children[nextCol];
        target = cellNode ? cellNode.querySelector(".calendar-day") : null;
      }

      if (target) focusGridDay(target);
    });
    document.getElementById("modalCloseBtn").addEventListener("click", closeDayModal);
    document.getElementById("dayModalOverlay").addEventListener("click", function (e) {
      if (e.target === this) closeDayModal();
    });

    // Escape closes the day dialog and Tab stays inside it: Close is its
    // only control, so focus must not wander off behind the overlay.
    document.addEventListener("keydown", function (e) {
      if (!document.getElementById("dayModalOverlay").classList.contains("open")) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeDayModal();
      } else if (e.key === "Tab") {
        e.preventDefault();
        var closeBtn = document.getElementById("modalCloseBtn");
        if (closeBtn) closeBtn.focus();
      }
    });

    Promise.all([fetchTournaments(), fetchPublishedEvents(), fetchClosures()]).then(function (results) {
      var tournaments = tournamentsAsEvents(results[0]);
      var specials = results[1] || [];

      // A tournament that still appears in events.json must not be drawn
      // twice; the tournament file wins.
      var seen = {};
      tournaments.forEach(function (ev) { seen[ev.date + "|" + ev.title] = true; });

      state.publishedEvents = tournaments.concat(specials.filter(function (ev) {
        return ev && !seen[ev.date + "|" + ev.title];
      }));
      state.closures = results[2];
      render();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    try {
      init();
    } catch (err) {
      console.error("calendar.js failed to initialize:", err);
    }
  });
})();
