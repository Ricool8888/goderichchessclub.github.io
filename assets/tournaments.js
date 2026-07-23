(function () {
  "use strict";

  var MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  var state = {
    tournaments: [],
    activeTab: "upcoming"
  };

  function fetchTournaments() {
    return fetch("assets/tournaments.json")
      .then(function (res) { if (!res.ok) throw new Error("no tournaments file"); return res.json(); })
      .catch(function () { return []; });
  }

  function sorted(list, ascending) {
    return list.slice().sort(function (a, b) {
      var diff = new Date(a.date) - new Date(b.date);
      return ascending ? diff : -diff;
    });
  }

  function buildDateBlock(iso) {
    var d = new Date(iso + "T00:00:00");
    var wrap = document.createElement("div");
    wrap.className = "tournament-date-block";
    wrap.innerHTML =
      '<div class="month">' + MONTH_SHORT[d.getMonth()] + '</div>' +
      '<div class="day">' + d.getDate() + '</div>' +
      '<div class="year">' + d.getFullYear() + '</div>';
    return wrap;
  }

  function formatFullDate(iso) {
    var d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }

  function buildCard(t) {
    var card = document.createElement("article");
    card.className = "tournament-card";
    card.appendChild(buildDateBlock(t.date));

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
      ["\uD83D\uDCC5", formatFullDate(t.date)],
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
      desc.textContent = t.description;
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
    if (links.childNodes.length) body.appendChild(links);

    card.appendChild(body);
    return card;
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
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
