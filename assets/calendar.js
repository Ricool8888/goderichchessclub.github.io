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

  var state = {
    viewYear: new Date().getFullYear(),
    viewMonth: new Date().getMonth(),
    publishedEvents: []
  };

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function toISODate(y, m, d) {
    return y + "-" + pad(m + 1) + "-" + pad(d);
  }

  function fetchPublishedEvents() {
    return fetch("assets/events.json")
      .then(function (res) { if (!res.ok) throw new Error("no events file"); return res.json(); })
      .catch(function () { return []; });
  }

  function eventsForDate(iso) {
    return state.publishedEvents.filter(function (e) { return e.date === iso; });
  }

  function recurringEventsForDate(iso, dayOfWeek) {
    return RECURRING_EVENTS.filter(function (r) {
      if (r.dayOfWeek !== dayOfWeek) return false;
      if (r.startDate && iso < r.startDate) return false;
      return true;
    });
  }

  function render() {
    var grid = document.getElementById("calendarGrid");
    var label = document.getElementById("calendarMonthLabel");
    label.textContent = MONTH_NAMES[state.viewMonth] + " " + state.viewYear;

    grid.innerHTML = "";
    WEEKDAYS.forEach(function (w) {
      var el = document.createElement("div");
      el.className = "calendar-weekday";
      el.textContent = w;
      grid.appendChild(el);
    });

    var firstDay = new Date(state.viewYear, state.viewMonth, 1).getDay();
    var daysInMonth = new Date(state.viewYear, state.viewMonth + 1, 0).getDate();
    var today = new Date();
    var todayISO = toISODate(today.getFullYear(), today.getMonth(), today.getDate());

    for (var i = 0; i < firstDay; i++) {
      var empty = document.createElement("div");
      empty.className = "calendar-day empty";
      grid.appendChild(empty);
    }

    for (var d = 1; d <= daysInMonth; d++) {
      var iso = toISODate(state.viewYear, state.viewMonth, d);
      var dayOfWeek = new Date(state.viewYear, state.viewMonth, d).getDay();
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "calendar-day";
      if (iso === todayISO) btn.classList.add("today");

      var dayEvents = eventsForDate(iso);
      var recurring = recurringEventsForDate(iso, dayOfWeek);
      if (dayEvents.length || recurring.length) btn.classList.add("has-event");

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

      var ariaLabel = MONTH_NAMES[state.viewMonth] + " " + d;
      if (recurring.length) ariaLabel += ", " + recurring.map(function (r) { return r.title; }).join(", ");
      if (dayEvents.length) ariaLabel += ", " + dayEvents.length + " event(s)";
      btn.setAttribute("aria-label", ariaLabel);

      btn.addEventListener("click", function (isoDate, dow) {
        return function () { openDayModal(isoDate, dow); };
      }(iso, dayOfWeek));

      grid.appendChild(btn);
    }
  }

  function openDayModal(iso, dayOfWeek) {
    var overlay = document.getElementById("dayModalOverlay");
    var titleEl = document.getElementById("dayModalTitle");
    var listEl = document.getElementById("dayModalEvents");
    var dateObj = new Date(iso + "T00:00:00");

    titleEl.textContent = dateObj.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    listEl.innerHTML = "";
    var recurring = recurringEventsForDate(iso, dayOfWeek);
    recurring.forEach(function (r) { listEl.appendChild(buildEventItem(r)); });
    eventsForDate(iso).forEach(function (ev) { listEl.appendChild(buildEventItem(ev)); });

    if (!recurring.length && eventsForDate(iso).length === 0) {
      var p = document.createElement("p");
      p.style.color = "#94A3B8";
      p.style.fontSize = "14px";
      p.textContent = "No events scheduled for this day.";
      listEl.appendChild(p);
    }

    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
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
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
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
    document.getElementById("modalCloseBtn").addEventListener("click", closeDayModal);
    document.getElementById("dayModalOverlay").addEventListener("click", function (e) {
      if (e.target === this) closeDayModal();
    });

    fetchPublishedEvents().then(function (events) {
      state.publishedEvents = events;
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
