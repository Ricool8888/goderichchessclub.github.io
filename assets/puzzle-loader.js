// Delays the Puzzle of the Day until it is close to the screen.
//
// The puzzle needs chessground and chess.js from jsDelivr plus three
// chessground stylesheets, and a puzzle API call. It sits well below the fold
// on the home page, so none of that is needed for someone who is reading the
// top of the page: this loads it when the widget comes within 600px of the
// viewport. puzzle.js itself is unchanged.
(function () {
  "use strict";

  var root = document.getElementById("puzzleWidget");
  if (!root) return;

  var VERSION = "9.2.1";
  var STYLES = [
    "https://cdn.jsdelivr.net/npm/chessground@" + VERSION + "/assets/chessground.base.css",
    "https://cdn.jsdelivr.net/npm/chessground@" + VERSION + "/assets/chessground.brown.css",
    "https://cdn.jsdelivr.net/npm/chessground@" + VERSION + "/assets/chessground.cburnett.css"
  ];

  var started = false;

  function addStyle(href) {
    return new Promise(function (resolve) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      // Resolve either way: a missing stylesheet should not leave the board
      // hidden behind a "Loading" message.
      link.onload = resolve;
      link.onerror = resolve;
      document.head.appendChild(link);
    });
  }

  function start() {
    if (started) return;
    started = true;

    Promise.all(STYLES.map(addStyle))
      .then(function () { return import("./puzzle.js"); })
      .catch(function () {
        var status = root.querySelector(".puzzle-status");
        if (!status) return;
        status.textContent = "Today\u2019s puzzle could not be loaded.";
        status.className = "puzzle-status is-bad";
      });
  }

  if (!("IntersectionObserver" in window)) {
    start();
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
    observer.disconnect();
    start();
  }, { rootMargin: "600px" });

  observer.observe(root);
})();
