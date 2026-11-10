// Lichess TV for the home page, loaded on request.
//
// The embed is a whole application: about 200 KB over 40-odd requests plus a
// live socket, none of which most visitors need. The page therefore ships a
// link to lichess.org/tv instead (which works with scripts off), and this file
// swaps it for the embed in place when the visitor asks for it.
//
// It also keeps the embed's colours matched to the site theme and wires up the
// "Pause live game" button, which used to be an inline script in index.html.
(function () {
  "use strict";

  var FRAME_URL = "https://lichess.org/tv/frame?theme=brown&bg=";

  document.addEventListener("DOMContentLoaded", function () {
    var facade = document.querySelector("[data-tv-facade]");
    if (!facade) return;

    var liveGame = facade.closest(".live-game");
    var pauseBtn = document.getElementById("liveGamePause");
    var pausedNote = liveGame ? liveGame.querySelector(".live-game-paused-note") : null;

    facade.addEventListener("click", function (event) {
      // Modified clicks and anything we cannot handle in place still open
      // Lichess in a new tab, as the link says.
      if (!liveGame || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      loadBoard();
    });

    function theme() {
      return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    }

    function loadBoard() {
      var frame = document.createElement("iframe");
      frame.className = "puzzle-frame";
      frame.setAttribute("data-lichess-frame", "tv");
      frame.title = "Lichess TV live game";
      frame.src = FRAME_URL + theme();
      // Focus lands on the frame rather than being lost with the link, so a
      // screen reader announces the board that just appeared.
      frame.tabIndex = -1;

      liveGame.replaceChild(frame, facade);
      liveGame.classList.add("is-loaded");
      frame.focus();

      if (pauseBtn) {
        pauseBtn.addEventListener("click", function () {
          var paused = !frame.hasAttribute("data-paused");
          frame.toggleAttribute("data-paused", paused);
          liveGame.classList.toggle("is-paused", paused);
          if (pausedNote) pausedNote.hidden = !paused;
          pauseBtn.textContent = paused ? "Resume live game" : "Pause live game";
          frame.src = paused ? "about:blank" : FRAME_URL + theme();
          if (window.GCCLiveEval) window.GCCLiveEval.setPaused(paused);
        });
      }

      // Follow the site's light/dark switch, unless the game is paused.
      new MutationObserver(function () {
        if (frame.hasAttribute("data-paused")) return;
        var src = FRAME_URL + theme();
        if (frame.src !== src) frame.src = src;
      }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    }
  });
})();
