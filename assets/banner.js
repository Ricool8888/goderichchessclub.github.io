(function () {
  "use strict";

  var PAUSE_KEY = "gcc-countdown-paused";
  var PAUSE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>';
  var PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  // The visitor's pause choice is remembered across pages. With no stored
  // choice, the countdown starts paused for visitors who ask for reduced motion.
  function isPaused() {
    var stored = null;
    try { stored = window.localStorage.getItem(PAUSE_KEY); } catch (e) { /* storage unavailable */ }
    if (stored !== null) return stored === "true";
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function storePaused(paused) {
    try { window.localStorage.setItem(PAUSE_KEY, paused ? "true" : "false"); } catch (e) { /* storage unavailable */ }
  }

  function plural(n, unit) { return n + " " + unit + (n === 1 ? "" : "s"); }

  // What a paused countdown shows: the time left, rounded down, with no seconds
  // so it doesn't look like a clock that has stopped.
  function formatStatic(msRemaining) {
    var totalMinutes = Math.max(0, Math.floor(msRemaining / 60000));
    if (totalMinutes >= 1440) return plural(Math.floor(totalMinutes / 1440), "day");
    if (totalMinutes >= 60) return plural(Math.floor(totalMinutes / 60), "hour");
    return plural(totalMinutes, "minute");
  }

  function formatCountdown(msRemaining) {
    var totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
    var days = Math.floor(totalSeconds / 86400);
    var hours = Math.floor((totalSeconds % 86400) / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;

    if (days > 0) {
      return days + "d " + pad(hours) + "h " + pad(minutes) + "m " + pad(seconds) + "s";
    }
    return pad(hours) + "h " + pad(minutes) + "m " + pad(seconds) + "s";
  }

  // Renders exactly one banner. Banners are permanent (no dismiss control) -
  // the only way a banner disappears is if its own countdown expires, or
  // you set "enabled": false / remove it from banner.json.
  function renderOne(data, mount) {
    if (!data || !data.enabled) return;
    if (!data.id || !data.message) return;

    var deadline = null;
    var pauseBtn = null;
    if (data.countdown && data.countdown.enabled && data.countdown.deadlineUTC) {
      deadline = new Date(data.countdown.deadlineUTC);
      // Auto-expire: once the deadline has passed, don't show this banner
      // at all. No manual cleanup needed after the tournament.
      if (isNaN(deadline.getTime()) || deadline.getTime() <= Date.now()) {
        return;
      }
    }

    var bar = document.createElement("div");
    bar.className = "site-banner-bar site-banner-" + (data.style === "urgent" ? "urgent" : "info");
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Site announcement");

    var text = document.createElement("span");
    text.className = "site-banner-text";
    text.textContent = data.message;
    bar.appendChild(text);

    if (deadline) {
      var countdownEl = document.createElement("span");
      countdownEl.className = "site-banner-countdown";
      countdownEl.setAttribute("aria-live", "off");
      bar.appendChild(countdownEl);

      pauseBtn = document.createElement("button");
      pauseBtn.type = "button";
      pauseBtn.className = "site-banner-pause";

      var paused = isPaused();
      var update = function () {
        var remaining = deadline.getTime() - Date.now();
        if (remaining <= 0) {
          clearInterval(localInterval);
          bar.remove();
          return;
        }
        // Paused: the text only changes when the page is next loaded.
        if (!paused) countdownEl.textContent = formatCountdown(remaining);
      };
      var showState = function () {
        var remaining = deadline.getTime() - Date.now();
        countdownEl.textContent = paused ? formatStatic(remaining) : formatCountdown(remaining);
        pauseBtn.innerHTML = paused ? PLAY_ICON : PAUSE_ICON;
        pauseBtn.setAttribute("aria-label", paused ? "Resume countdown" : "Pause countdown");
        pauseBtn.title = paused ? "Resume countdown" : "Pause countdown";
      };
      pauseBtn.addEventListener("click", function () {
        paused = !paused;
        storePaused(paused);
        showState();
      });
      showState();
      var localInterval = setInterval(update, 1000);
    }

    if (data.linkUrl && data.linkText) {
      var link = document.createElement("a");
      link.href = data.linkUrl;
      link.className = "site-banner-link";
      link.textContent = data.linkText + " \u2192";
      bar.appendChild(link);
    }

    if (pauseBtn) bar.appendChild(pauseBtn);

    mount.appendChild(bar);
  }

  function init() {
    var mount = document.getElementById("siteBanner");
    if (!mount) return;

    fetch("assets/banner.json")
      .then(function (res) { if (!res.ok) throw new Error("no banner file"); return res.json(); })
      .then(function (data) {
        // Accept either a single banner object (older format) or an
        // array of banners (current format) so nothing breaks either way.
        var banners = Array.isArray(data) ? data : [data];
        banners.forEach(function (banner) { renderOne(banner, mount); });
      })
      .catch(function () { /* no banner configured, do nothing */ });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
