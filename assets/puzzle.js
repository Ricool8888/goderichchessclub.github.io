// Interactive Lichess "Puzzle of the Day" for the home page.
//
// The puzzle comes from the public Lichess API (no account or key needed) and
// is played on chessground, the same board Lichess uses. chess.js checks that
// moves are legal. Both libraries are loaded from the jsDelivr CDN, pinned to
// exact versions so an upstream release can't change the page.
import { Chessground } from "https://cdn.jsdelivr.net/npm/chessground@9.2.1/+esm";
import { Chess } from "https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm";

var API_URL = "https://lichess.org/api/puzzle/daily";
var REPLY_DELAY = 500;   // pause before the opponent's reply (ms)
var WRONG_DELAY = 700;   // how long a wrong move stays on the board (ms)

var root = document.getElementById("puzzleWidget");
if (root) init(root);

function init(root) {
  var boardEl = root.querySelector(".puzzle-board");
  var statusEl = root.querySelector(".puzzle-status");
  var metaEl = root.querySelector(".puzzle-meta");
  var hintBtn = root.querySelector("[data-puzzle='hint']");
  var solutionBtn = root.querySelector("[data-puzzle='solution']");
  var retryBtn = root.querySelector("[data-puzzle='retry']");

  var puzzle = null;     // { id, fen, lastMove, solution: [uci...], rating }
  var chess = null;
  var cg = null;
  var step = 0;          // index of the next move in puzzle.solution
  var playerColor = "white";
  var busy = false;      // true while a reply/animation is pending

  fetch(API_URL, { headers: { Accept: "application/json" } })
    .then(function (res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
    .then(function (data) {
      puzzle = {
        id: data.puzzle.id,
        fen: data.puzzle.fen,
        lastMove: data.puzzle.lastMove,
        solution: data.puzzle.solution,
        rating: data.puzzle.rating
      };
      metaEl.innerHTML =
        'Rated ' + puzzle.rating + ' &middot; <a href="https://lichess.org/training/' +
        encodeURIComponent(puzzle.id) + '" target="_blank" rel="noopener noreferrer">View on Lichess</a>';
      start();
      hintBtn.addEventListener("click", showHint);
      solutionBtn.addEventListener("click", showSolution);
      retryBtn.addEventListener("click", start);
      root.classList.add("is-ready");
    })
    .catch(function () {
      setStatus(
        'Couldn’t load today’s puzzle. Try it on <a href="https://lichess.org/training" ' +
        'target="_blank" rel="noopener noreferrer">Lichess</a> instead.', "error", true);
    });

  function start() {
    chess = new Chess(puzzle.fen);
    step = 0;
    busy = false;
    playerColor = chess.turn() === "w" ? "white" : "black";

    var config = boardConfig();
    config.orientation = playerColor;
    config.lastMove = uciSquares(puzzle.lastMove);
    if (cg) cg.set(config); else cg = Chessground(boardEl, config);

    hintBtn.disabled = false;
    solutionBtn.disabled = false;
    setStatus(capitalize(playerColor) + " to move — find the best move.");
  }

  // Board state derived from the current chess.js position.
  function boardConfig() {
    var color = chess.turn() === "w" ? "white" : "black";
    var playing = !busy && step < puzzle.solution.length && color === playerColor;
    return {
      fen: chess.fen(),
      turnColor: color,
      check: chess.inCheck() ? color : false,
      coordinates: true,
      animation: { enabled: true, duration: 200 },
      highlight: { lastMove: true, check: true },
      premovable: { enabled: false },
      drawable: { enabled: true, autoShapes: [] },
      movable: {
        free: false,
        color: playing ? playerColor : undefined,
        dests: playing ? legalDests() : new Map(),
        showDests: true,
        events: { after: onUserMove }
      }
    };
  }

  function legalDests() {
    var dests = new Map();
    chess.moves({ verbose: true }).forEach(function (m) {
      if (!dests.has(m.from)) dests.set(m.from, []);
      dests.get(m.from).push(m.to);
    });
    return dests;
  }

  function onUserMove(orig, dest) {
    var expected = puzzle.solution[step];
    // Promote to whatever the solution expects on this square, otherwise a queen.
    var promotion = expected && expected.slice(0, 4) === orig + dest ? expected.charAt(4) || "q" : "q";
    var move = chess.move({ from: orig, to: dest, promotion: promotion });
    var uci = move.from + move.to + (move.promotion || "");

    // Like Lichess, any move that delivers checkmate counts as solving it.
    if (uci === expected || chess.isCheckmate()) {
      step++;
      if (chess.isCheckmate() || step >= puzzle.solution.length) return solved();
      setStatus("Best move! Keep going…", "good");
      busy = true;
      refresh(uci);
      setTimeout(playReply, REPLY_DELAY);
      return;
    }

    setStatus("Not the move — try again.", "bad");
    busy = true;
    refresh(uci);
    setTimeout(function () {
      chess.undo();
      busy = false;
      refresh(step === 0 ? puzzle.lastMove : puzzle.solution[step - 1]);
    }, WRONG_DELAY);
  }

  function playReply() {
    var uci = puzzle.solution[step];
    playUci(uci);
    step++;
    busy = false;
    refresh(uci);
    if (step >= puzzle.solution.length) solved();
  }

  function showHint() {
    if (busy || step >= puzzle.solution.length) return;
    var from = puzzle.solution[step].slice(0, 2);
    cg.set({ drawable: { autoShapes: [{ orig: from, brush: "green" }] } });
    setStatus("Hint: move the highlighted piece.");
  }

  // Plays the remaining solution moves one at a time.
  function showSolution() {
    if (busy || step >= puzzle.solution.length) return;
    busy = true;
    hintBtn.disabled = true;
    solutionBtn.disabled = true;
    setStatus("Showing the solution…");
    (function next() {
      if (step >= puzzle.solution.length) {
        busy = false;
        refresh(puzzle.solution[step - 1]);
        setStatus("That’s the solution. Press Retry to try it yourself.");
        return;
      }
      var uci = puzzle.solution[step];
      playUci(uci);
      step++;
      refresh(uci);
      setTimeout(next, REPLY_DELAY + 200);
    })();
  }

  function solved() {
    busy = false;
    refresh(puzzle.solution[puzzle.solution.length - 1]);
    hintBtn.disabled = true;
    solutionBtn.disabled = true;
    setStatus("Puzzle solved! Come back tomorrow for a new one.", "good");
  }

  function playUci(uci) {
    chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.charAt(4) || undefined });
  }

  function refresh(lastUci) {
    var config = boardConfig();
    if (lastUci) config.lastMove = uciSquares(lastUci);
    cg.set(config);
  }

  function setStatus(text, tone, isHtml) {
    if (isHtml) statusEl.innerHTML = text; else statusEl.textContent = text;
    statusEl.className = "puzzle-status" + (tone ? " is-" + tone : "");
  }
}

function uciSquares(uci) {
  return uci ? [uci.slice(0, 2), uci.slice(2, 4)] : undefined;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
