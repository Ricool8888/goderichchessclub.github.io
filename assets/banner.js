// The announcement banner's live behaviour.
//
// The banner itself is already in the page: scripts/render-banner.mjs writes it
// from assets/banner.json at build time, which is why it no longer shifts the
// page when it appears and why the closing date is readable with scripts off.
// This file only turns that closing date into a ticking countdown, and removes
// the banner when its deadline passes. With scripts off the date simply stays
// as text.
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

  function hydrate(bar) {
    var deadline = new Date(bar.getAttribute("data-banner-deadline"));
    if (isNaN(deadline.getTime()) || deadline.getTime() <= Date.now()) {
      bar.remove();
      return;
    }

    var countdownEl = bar.querySelector(".site-banner-countdown");
    if (!countdownEl) return;

    // The clock changes every second, so a screen reader should not read that
    // out. The exact closing moment is given once, as a sentence.
    countdownEl.setAttribute("aria-hidden", "true");

    var deadlineText = document.createElement("span");
    deadlineText.className = "sr-only";
    deadlineText.textContent = deadline.toLocaleString("en-CA", {
      timeZone: "America/Toronto",
      dateStyle: "long",
      timeStyle: "short"
    }) + " Eastern time.";
    countdownEl.parentNode.insertBefore(deadlineText, countdownEl.nextSibling);

    var timer = null;
    var update = function () {
      var remaining = deadline.getTime() - Date.now();
      if (remaining <= 0) {
        clearInterval(timer);
        bar.remove();
        return;
      }
      countdownEl.textContent = formatCountdown(remaining);
    };

    update();
    timer = setInterval(update, 1000);
  }

  function init() {
    var mount = document.getElementById("siteBanner");
    if (!mount) return;
    Array.prototype.forEach.call(mount.querySelectorAll("[data-banner-deadline]"), hydrate);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
