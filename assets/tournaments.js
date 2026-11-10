(function () {
  "use strict";

  // The cards themselves are written into tournaments.html from
  // assets/tournaments.json by scripts/render-tournaments.mjs, so the page
  // works without this script. All that is left here is choosing which list
  // the tabs show, and the "Add to Calendar" buttons.
  var state = {
    activeTab: "upcoming"
  };

  function render() {
    var panel = document.getElementById("tournamentGrid");
    var firstSteps = document.getElementById("firstTournament");
    var showFirst = state.activeTab === "first";

    if (panel) panel.hidden = showFirst;
    if (firstSteps) firstSteps.hidden = !showFirst;

    ["upcoming", "completed"].forEach(function (status) {
      var list = document.getElementById(status + "List");
      if (list) list.hidden = showFirst || state.activeTab !== status;
    });
  }

  // The active tab is kept in the URL hash (e.g. tournaments#first) so the
  // browser's back button and shared links return to the same tab.
  function selectTab(name) {
    var tabs = document.querySelectorAll(".tab-btn");
    var match = null;
    tabs.forEach(function (b) { if (b.getAttribute("data-tab") === name) match = b; });
    if (!match) match = tabs[0];

    tabs.forEach(function (b) {
      var isActive = b === match;
      b.classList.toggle("active", isActive);
      b.setAttribute("aria-selected", isActive ? "true" : "false");
      // Roving tabindex: Tab reaches the tab row once, arrow keys move
      // between the tabs, as the ARIA tabs pattern expects.
      b.tabIndex = isActive ? 0 : -1;
    });

    // Both "Upcoming" and "Past Results" use the same panel, so its
    // accessible name follows whichever tab is selected.
    var panel = document.getElementById("tournamentGrid");
    if (panel && match.id) panel.setAttribute("aria-labelledby", match.id);

    state.activeTab = match.getAttribute("data-tab");
    render();
  }

  function tabFromHash() {
    return window.location.hash.replace(/^#/, "") || "upcoming";
  }

  // Each button carries the details the .ics file needs in data attributes,
  // so the calendar file can still be built without loading the JSON again.
  function initCalendarButtons() {
    document.querySelectorAll(".tournament-links .btn-calendar").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!window.GCCCalendar) return;

        var data = btn.dataset;
        window.GCCCalendar.downloadICS({
          uid: data.icsId,
          title: data.icsTitle,
          description: data.icsDescription,
          location: data.icsLocation,
          startDate: data.icsStartDate,
          endDate: data.icsEndDate,
          startTime: data.icsStartTime,
          endTime: data.icsEndTime
        }, data.icsId + ".ics");
      });
    });
  }

  function init() {
    document.querySelectorAll(".tab-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var name = btn.getAttribute("data-tab");
        history.replaceState(null, "", name === "upcoming"
          ? window.location.pathname + window.location.search
          : "#" + name);
        selectTab(name);
      });
    });

    // Arrow keys (and Home/End) move between tabs; Enter/Space is already
    // handled by the buttons themselves.
    var tabRow = document.querySelector(".tab-row");
    if (tabRow) {
      tabRow.addEventListener("keydown", function (e) {
        var keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
        if (keys.indexOf(e.key) === -1) return;

        var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab-btn"));
        var index = tabs.indexOf(document.activeElement);
        if (index === -1) return;

        e.preventDefault();

        var next = index;
        if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
        else if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") next = 0;
        else next = tabs.length - 1;

        tabs[next].focus();
        tabs[next].click();
      });
    }

    window.addEventListener("hashchange", function () { selectTab(tabFromHash()); });

    initCalendarButtons();
    selectTab(tabFromHash());
  }

  document.addEventListener("DOMContentLoaded", init);
})();
