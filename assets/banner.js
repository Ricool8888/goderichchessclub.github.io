(function () {
  "use strict";

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

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
      countdownEl.textContent = formatCountdown(deadline.getTime() - Date.now());
      bar.appendChild(countdownEl);

      var localInterval = setInterval(function () {
        var remaining = deadline.getTime() - Date.now();
        if (remaining <= 0) {
          clearInterval(localInterval);
          bar.remove();
          return;
        }
        countdownEl.textContent = formatCountdown(remaining);
      }, 1000);
    }

    if (data.linkUrl && data.linkText) {
      var link = document.createElement("a");
      link.href = data.linkUrl;
      link.className = "site-banner-link";
      link.textContent = data.linkText + " \u2192";
      bar.appendChild(link);
    }

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
