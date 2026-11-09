// Evaluation bar for the Lichess TV embed on the home page.
//
// The embed is a cross-origin iframe, so we can't read its position directly.
// Instead we follow the same featured game through the public Lichess TV feed
// (https://lichess.org/api/tv/feed - every move arrives as a FEN) and evaluate
// each position with Stockfish 10, running in a Web Worker so the page stays
// responsive. The engine is ~1.6 MB, so nothing loads until the visitor asks
// for the evaluation with the "Show evaluation" button. Analysis pauses while
// the tab is in the background.
(function () {
  "use strict";

  var FEED_URL = "https://lichess.org/api/tv/feed";
  var ENGINE_URL = "https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js";
  var MOVETIME = 1500;      // ms of thinking per position
  var MIN_DEPTH = 6;        // ignore the very shallow first results

  var bar, fill, label;
  var worker = null;
  var searching = false;    // engine is busy with currentFen
  var currentFen = null;
  var pendingFen = null;    // newest position waiting for the engine
  var retryDelay = 5000;
  var paused = false;       // the visitor paused the live game
  var enabled = false;      // the visitor asked for the evaluation
  var started = false;      // the engine has been requested once
  var feedAbort = null;     // lets us stop the TV feed when switched off

  document.addEventListener("DOMContentLoaded", function () {
    bar = document.getElementById("evalBar");
    if (!bar) return;
    fill = bar.querySelector(".eval-bar-white");
    label = bar.querySelector(".eval-bar-label");

    if (!window.Worker || !window.Blob || !window.fetch || !window.TextDecoder) return unavailable();

    var toggle = document.getElementById("liveEvalToggle");
    if (toggle) {
      toggle.addEventListener("click", function () { setEnabled(!enabled); });
      return;
    }

    // Without the button (older cached markup) fall back to the previous
    // behaviour and start when the bar scrolls into view.
    if (!("IntersectionObserver" in window)) return setEnabled(true);
    var observer = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) {
        observer.disconnect();
        setEnabled(true);
      }
    }, { rootMargin: "200px" });
    observer.observe(bar);
  });

  // Called by the "Show evaluation" / "Hide evaluation" button.
  function setEnabled(value) {
    enabled = !!value;
    var toggle = document.getElementById("liveEvalToggle");

    if (toggle) {
      toggle.setAttribute("aria-pressed", enabled ? "true" : "false");
      toggle.textContent = enabled ? "Hide evaluation" : "Show evaluation";
    }

    bar.classList.toggle("is-off", !enabled);
    bar.setAttribute("aria-hidden", enabled ? "false" : "true");

    if (!enabled) {
      if (searching) send("stop");
      searching = false;
      pendingFen = null;
      if (feedAbort) { feedAbort.abort(); feedAbort = null; }
      return;
    }

    if (!started) {
      started = true;
      bar.setAttribute("aria-label", "Engine evaluation loading");
      start();
    } else if (pendingFen && !searching && !paused) {
      analyse(pendingFen);
    }
  }

  function start() {
    try {
      // A worker can't be created straight from another origin, so start a
      // tiny same-origin worker that imports the engine from the CDN.
      var src = 'importScripts("' + ENGINE_URL + '");';
      worker = new Worker(URL.createObjectURL(new Blob([src], { type: "application/javascript" })));
    } catch (e) {
      return unavailable();
    }
    worker.onmessage = function (e) { onEngineLine(String(e.data)); };
    worker.onerror = unavailable;
    send("uci");
    send("setoption name Hash value 16");
    send("isready");

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && !paused && pendingFen && !searching) analyse(pendingFen);
    });

    connectFeed();
  }

  // Called by the "Pause live game" button on the home page.
  window.GCCLiveEval = {
    setPaused: function (value) {
      paused = !!value;
      if (!bar) return;
      if (paused) {
        if (searching) send("stop");
        bar.classList.remove("is-ready");
      } else if (pendingFen && !searching) {
        analyse(pendingFen);
      }
    }
  };

  function send(cmd) { if (worker) worker.postMessage(cmd); }

  // ---- Lichess TV feed (newline-delimited JSON stream) ----

  function connectFeed() {
    if (!enabled) return;
    feedAbort = new AbortController();
    fetch(FEED_URL, { headers: { Accept: "application/x-ndjson" }, signal: feedAbort.signal })
      .then(function (res) {
        if (!res.ok || !res.body) throw new Error("HTTP " + res.status);
        retryDelay = 5000;
        var reader = res.body.getReader();
        var decoder = new TextDecoder();
        var buffer = "";
        return (function read() {
          return reader.read().then(function (chunk) {
            if (chunk.done) return;
            buffer += decoder.decode(chunk.value, { stream: true });
            var lines = buffer.split("\n");
            buffer = lines.pop();
            lines.forEach(onFeedLine);
            return read();
          });
        })();
      })
      .catch(function () { /* fall through to reconnect */ })
      .then(function () {
        // The stream can end (network change, server restart) - reconnect,
        // unless the visitor has switched the evaluation off.
        if (!enabled) return;
        setTimeout(connectFeed, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 60000);
      });
  }

  function onFeedLine(line) {
    if (!line.trim()) return;
    var msg;
    try { msg = JSON.parse(line); } catch (e) { return; }
    if (!msg || !msg.d || !msg.d.fen) return;
    if (msg.t === "featured") {
      // New game: match the embed's orientation (White at the bottom unless
      // Lichess shows it from Black's side).
      bar.classList.toggle("is-flipped", msg.d.orientation === "black");
    }
    analyse(msg.d.fen);
  }

  // ---- Engine ----

  function analyse(fen) {
    if (!enabled) { pendingFen = null; return; }
    if (paused || document.hidden || searching) {
      pendingFen = fen;
      if (searching && !document.hidden) send("stop");
      return;
    }
    pendingFen = null;
    currentFen = fen;
    searching = true;
    send("position fen " + fen);
    send("go movetime " + MOVETIME);
  }

  function onEngineLine(line) {
    if (line.indexOf("bestmove") === 0) {
      searching = false;
      if (pendingFen && !document.hidden && !paused) analyse(pendingFen);
      return;
    }
    // Skip results for a position that has already been replaced.
    if (line.indexOf("info ") !== 0 || paused || pendingFen || !currentFen) return;
    var depth = line.match(/ depth (\d+)/);
    var score = line.match(/ score (cp|mate) (-?\d+)/);
    if (!depth || !score || +depth[1] < MIN_DEPTH) return;

    // Stockfish scores from the side to move's point of view; the bar is White's.
    var whiteToMove = currentFen.split(" ")[1] !== "b";
    var value = +score[2] * (whiteToMove ? 1 : -1);
    if (score[1] === "mate") showMate(value, whiteToMove);
    else showCentipawns(value);
  }

  // ---- Bar ----

  function showCentipawns(cp) {
    // Lichess's own conversion from engine score to winning chances.
    var winning = 2 / (1 + Math.exp(-0.00368208 * cp)) - 1;
    var text = Math.abs(cp / 100).toFixed(1);
    var signed = (cp > 0 ? "+" : cp < 0 ? "−" : "") + text;
    render(50 + 50 * winning, text, cp >= 0, "Engine evaluation " + signed);
  }

  function showMate(moves, whiteToMove) {
    // "mate 0" means the side to move has been checkmated.
    var whiteWins = moves === 0 ? !whiteToMove : moves > 0;
    var text = moves === 0 ? "#" : "M" + Math.abs(moves);
    render(whiteWins ? 100 : 0, text, whiteWins,
      "Engine evaluation: " + (whiteWins ? "White" : "Black") +
      (moves === 0 ? " has checkmated" : " mates in " + Math.abs(moves)));
  }

  function render(whitePct, text, whiteAhead, description) {
    bar.classList.add("is-ready");
    fill.style.height = whitePct.toFixed(1) + "%";
    label.textContent = text;
    label.classList.toggle("is-white", whiteAhead);
    bar.setAttribute("aria-label", description);
    bar.title = description;
  }

  function unavailable() {
    if (worker) { worker.terminate(); worker = null; }
    if (bar) bar.hidden = true;
    var toggle = document.getElementById("liveEvalToggle");
    if (toggle) toggle.hidden = true;
  }
})();
