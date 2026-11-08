(function () {
  "use strict";

  // Page dates are written by scripts/stamp-last-updated.mjs during the deploy
  // workflow, so the footer needs no third-party request (the old GitHub API
  // lookup was rate-limited per visitor IP and fell back to a stale date).
  var DATA_URL = "assets/last-updated.json";

  var MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  function formatDate(iso) {
    var parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!parts) return "";
    var month = MONTH_NAMES[parseInt(parts[2], 10) - 1];
    if (!month) return "";
    return month + " " + parseInt(parts[3], 10) + ", " + parts[1];
  }

  function currentFilePath() {
    var segment = window.location.pathname.split("/").pop();
    if (!segment) return "index.html"; // request for a trailing-slash directory URL
    segment = decodeURIComponent(segment);
    // Links omit the .html extension (GitHub Pages resolves /about to about.html)
    if (segment.indexOf(".") === -1) segment += ".html";
    return segment;
  }

  function init() {
    // Keep the footer copyright year current.
    var yearEl = document.getElementById("copyrightYear");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    var el = document.getElementById("lastUpdatedText");
    if (!el) return;

    var wrapper = el.closest ? el.closest(".last-updated") : el.parentNode;
    var path = currentFilePath();

    fetch(DATA_URL, { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("Missing last-updated data");
        return res.json();
      })
      .then(function (data) {
        var dates = (data && data.pages) || {};
        var text = formatDate(dates[path]);
        if (!text) throw new Error("No date for " + path);
        el.textContent = text;
        // The paragraph ships hidden so visitors never see an empty or stale
        // date; it only appears once a real one is available.
        if (wrapper) wrapper.hidden = false;
      })
      .catch(function () {
        // Leave the footer date hidden rather than showing a hardcoded date
        // that goes stale whenever the page is edited.
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
