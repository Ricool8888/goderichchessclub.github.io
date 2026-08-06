(function () {
  "use strict";

  // Update these if the repo ever moves to a different owner/name.
  var REPO_OWNER = "Ricool8888";
  var REPO_NAME = "goderichchessclub.github.io";

  var MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  function formatDate(d) {
    return MONTH_NAMES[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  }

  function currentFilePath() {
    var segment = window.location.pathname.split("/").pop();
    if (!segment) return "index.html"; // request for a trailing-slash directory URL
    return decodeURIComponent(segment);
  }

  function init() {
    var el = document.getElementById("lastUpdatedText");
    if (!el) return;

    var path = currentFilePath();
    var apiUrl = "https://api.github.com/repos/" + REPO_OWNER + "/" + REPO_NAME +
      "/commits?path=" + encodeURIComponent(path) + "&per_page=1";

    fetch(apiUrl, { headers: { "Accept": "application/vnd.github+json" } })
      .then(function (res) {
        if (!res.ok) throw new Error("GitHub API request failed");
        return res.json();
      })
      .then(function (commits) {
        if (!commits || !commits.length) throw new Error("No commit history found");
        var dateStr = commits[0].commit && commits[0].commit.committer && commits[0].commit.committer.date;
        if (!dateStr) throw new Error("No commit date in response");
        var date = new Date(dateStr);
        if (isNaN(date.getTime())) throw new Error("Unparseable date");
        el.textContent = formatDate(date);
      })
      .catch(function () {
        // If the API is unreachable, rate-limited, or the repo/path lookup
        // fails for any reason, silently keep whatever fallback text is
        // already in the HTML rather than showing an error to visitors.
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
