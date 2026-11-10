// Delays the Puzzle of the Day until it is close to the screen, and makes sure
// the widget can never sit on "Loading" for ever.
//
// The puzzle needs chessground and chess.js plus three chessground
// stylesheets - all now served from assets/vendor/, not from a CDN - and a
// puzzle API call. It sits well below the fold on the home page, so none of
// that is needed by someone reading the top of the page: this starts it when
// the widget comes within 600px of the viewport.
// puzzle.js itself is unchanged apart from announcing when it is ready.
//
// Three things used to leave the widget saying "Loading today's puzzle…" with
// nothing to click:
//
//   1. Starting depended only on an IntersectionObserver callback. A plain
//      scroll/resize check runs alongside it, so the load starts either way.
//   2. The board module was imported only after all three stylesheets had
//      fired their load event, so a load event that never fired stopped the
//      puzzle from loading at all. The styles are now requested alongside the
//      import.
//   3. Nothing ever gave up. If the fetch stalls, this now says so and points
//      at Lichess instead of spinning indefinitely.
(function () {
  "use strict";

  var root = document.getElementById("puzzleWidget");
  if (!root) return;

  var status = root.querySelector(".puzzle-status");
  // chessground's stylesheets live with the site (assets/vendor/) so the board
  // does not depend on a third-party network being reachable. Update them
  // together with assets/vendor/chessground.js - same version, 9.2.1.
  var STYLES = [
    "assets/vendor/chessground.base.css",
    "assets/vendor/chessground.brown.css",
    "assets/vendor/chessground.cburnett.css"
  ];
  var NEAR_PX = 600;    // how close to the viewport counts as "about to be read"
  var GIVE_UP_MS = 12000;

  var started = false;
  var ready = false;
  var giveUpTimer = null;
  var observer = null;

  function announce(text, tone) {
    if (!status) return;
    status.className = "puzzle-status" + (tone ? " is-" + tone : "");
    status.textContent = text;
  }

  function addStyles() {
    STYLES.forEach(function (href) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    });
  }

  function giveUp() {
    if (ready) return;
    if (!status) return;
    status.className = "puzzle-status is-error";
    status.innerHTML =
      'Today\u2019s puzzle didn\u2019t load. Check your connection and reload the page, ' +
      'or solve it on <a href="https://lichess.org/training" target="_blank" ' +
      'rel="noopener noreferrer">Lichess</a>.';
  }

  function start() {
    if (started) return;
    started = true;

    if (observer) observer.disconnect();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
    window.removeEventListener("load", onScroll);

    addStyles();
    giveUpTimer = setTimeout(giveUp, GIVE_UP_MS);

    import("./puzzle.js").catch(function () {
      // puzzle.js reports its own fetch failures; reaching here means the
      // module itself never loaded (offline, bad MIME type, missing file).
      clearTimeout(giveUpTimer);
      giveUp();
    });
  }

  // Fallback for the observer: is the widget at, or above, the bottom edge of
  // the screen plus a screen's worth of margin? Also true when the page opens
  // already scrolled down to it.
  function onScroll() {
    if (started) return;
    var box = root.getBoundingClientRect();
    if (box.top < window.innerHeight + NEAR_PX) start();
  }

  document.addEventListener("puzzle:ready", function () {
    ready = true;
    if (giveUpTimer) clearTimeout(giveUpTimer);
    giveUpTimer = null;
  });

  document.addEventListener("puzzle:failed", function () {
    if (giveUpTimer) clearTimeout(giveUpTimer);
    giveUpTimer = null;
  });

  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(function (entries) {
      if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
      start();
    }, { rootMargin: NEAR_PX + "px" });
    observer.observe(root);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  window.addEventListener("load", onScroll);
  onScroll();
})();
