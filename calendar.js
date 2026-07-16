(function () {
  "use strict";

  var STORAGE_KEY = "gcc_draft_events_v1";
  var MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  var state = {
    viewYear: new Date().getFullYear(),
    viewMonth: new Date().getMonth(), // 0-indexed
    publishedEvents: [], // loaded from assets/events.json
    draftEvents: []      // loaded from localStorage (this browser only, not yet published)
  };

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function toISODate(y, m, d) {
    return y + "-" + pad(m + 1) + "-" + pad(d);
  }

  function loadDraftEvents() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveDraftEvents() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.draftEvents));
    } catch (e) { /* storage unavailable, ignore */ }
  }

  function fetchPublishedEvents() {
    return fetch("assets/events.json")
      .then(function (res) { if (!res.ok) throw new Error("no events file"); return res.json(); })
      .catch(function () { return []; });
  }

  function eventsForDate(iso) {
    var all = state.publishedEvents.concat(state.draftEvents);
    return all.filter(function (e) { return e.date === iso; });
  }

  function isTuesday(y, m, d) {
    return new Date(y, m, d).getDay() === 2;
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
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "calendar-day";
      if (iso === todayISO) btn.classList.add("today");

      var dayEvents = eventsForDate(iso);
      var tuesday = isTuesday(state.viewYear, state.viewMonth, d);
      if (dayEvents.length || tuesday) btn.classList.add("has-event");

      var num = document.createElement("span");
      num.className = "day-number";
      num.textContent = d;
      btn.appendChild(num);

      if (tuesday) {
        var meetingDot = document.createElement("span");
        meetingDot.className = "day-event-dot recurring";
        meetingDot.textContent = "Club Meeting";
        btn.appendChild(meetingDot);
      }

      dayEvents.slice(0, 2).forEach(function (ev) {
        var dot = document.createElement("span");
        dot.className = "day-event-dot";
        dot.textContent = ev.title;
        btn.appendChild(dot);
      });

      btn.setAttribute("aria-label", MONTH_NAMES[state.viewMonth] + " " + d + (tuesday ? ", club meeting" : "") + (dayEvents.length ? ", " + dayEvents.length + " event(s)" : ""));
      btn.addEventListener("click", function (isoDate, tues) {
        return function () { openDayModal(isoDate, tues); };
      }(iso, tuesday));

      grid.appendChild(btn);
    }
  }

  function openDayModal(iso, tuesday) {
    var overlay = document.getElementById("dayModalOverlay");
    var titleEl = document.getElementById("dayModalTitle");
    var listEl = document.getElementById("dayModalEvents");
    var dateObj = new Date(iso + "T00:00:00");

    titleEl.textContent = dateObj.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    listEl.innerHTML = "";
    if (tuesday) {
      listEl.appendChild(buildEventItem({ time: "6:00 PM - 8:00 PM", title: "Weekly Club Meeting", description: "Open play at Goderich Library. All skill levels welcome, free admission." }));
    }
    eventsForDate(iso).forEach(function (ev) { listEl.appendChild(buildEventItem(ev)); });
    if (!tuesday && eventsForDate(iso).length === 0) {
      var p = document.createElement("p");
      p.style.color = "#94A3B8";
      p.style.fontSize = "14px";
      p.textContent = "No events scheduled for this day yet.";
      listEl.appendChild(p);
    }

    document.getElementById("addEventDate").value = iso;
    document.getElementById("addEventForm").reset();
    document.getElementById("addEventDate").value = iso;
    document.getElementById("publishBox").style.display = "none";

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

  function handleAddEvent(e) {
    e.preventDefault();
    var date = document.getElementById("addEventDate").value;
    var time = document.getElementById("addEventTime").value.trim();
    var title = document.getElementById("addEventTitle").value.trim();
    var description = document.getElementById("addEventDesc").value.trim();
    if (!date || !title) return;

    var newEvent = {
      id: "draft-" + Date.now(),
      date: date,
      time: time,
      title: title,
      description: description
    };
    state.draftEvents.push(newEvent);
    saveDraftEvents();
    render();
    var parts = date.split("-").map(Number);
    var tuesdayCheck = isTuesday(parts[0], parts[1] - 1, parts[2]);
    openDayModal(date, tuesdayCheck);

    var box = document.getElementById("publishBox");
    var textarea = document.getElementById("publishJson");
    textarea.value = JSON.stringify(state.publishedEvents.concat(state.draftEvents), null, 2);
    box.style.display = "block";
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
    document.getElementById("addEventForm").addEventListener("submit", handleAddEvent);

    var copyBtn = document.getElementById("copyJsonBtn");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var textarea = document.getElementById("publishJson");
        textarea.select();
        try {
          document.execCommand("copy");
          copyBtn.textContent = "Copied!";
          setTimeout(function () { copyBtn.textContent = "Copy JSON"; }, 1500);
        } catch (e) { /* clipboard unavailable */ }
      });
    }

    state.draftEvents = loadDraftEvents();
    fetchPublishedEvents().then(function (events) {
      state.publishedEvents = events;
      render();
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
