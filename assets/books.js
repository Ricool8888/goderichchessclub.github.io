(function () {
  "use strict";

  var DESCRIPTIONS_URL = "assets/books/descriptions.json";

  // Match titles loosely so "Checkmate" finds "Checkmate!" and
  // "How to Think in Chess" finds "How To Think In Chess".
  function normalize(title) {
    return title.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function fillCell(cell, text) {
    text.split(/\n+/).forEach(function (para) {
      var p = document.createElement("p");
      p.textContent = para;
      cell.appendChild(p);
    });
  }

  // Cover images are named after the table title, e.g. "Checkmate.jpg".
  var IMAGES_DIR = "assets/books/images/";
  var CURSOR_OFFSET = 16;

  function initCoverPreview() {
    if (!window.matchMedia("(hover: hover)").matches) return;

    var preview = document.createElement("img");
    preview.className = "book-preview";
    preview.alt = "";
    preview.setAttribute("aria-hidden", "true");
    document.body.appendChild(preview);

    function position(e) {
      var x = e.clientX + CURSOR_OFFSET;
      var y = e.clientY + CURSOR_OFFSET;
      // Flip to the other side of the cursor rather than running off-screen.
      if (x + preview.offsetWidth > window.innerWidth) x = e.clientX - CURSOR_OFFSET - preview.offsetWidth;
      if (y + preview.offsetHeight > window.innerHeight) y = e.clientY - CURSOR_OFFSET - preview.offsetHeight;
      preview.style.left = Math.max(0, x) + "px";
      preview.style.top = Math.max(0, y) + "px";
    }

    document.querySelectorAll(".price-table tbody tr").forEach(function (row) {
      var src = IMAGES_DIR + encodeURIComponent(row.cells[0].textContent.trim()) + ".jpg";
      var lastEvent;
      new Image().src = src; // preload so the cover appears instantly

      row.addEventListener("mouseenter", function (e) {
        lastEvent = e;
        preview.onload = function () { if (lastEvent) position(lastEvent); };
        preview.onerror = function () { preview.classList.remove("visible"); };
        preview.src = src;
        preview.classList.add("visible");
        position(e);
      });
      row.addEventListener("mousemove", function (e) {
        lastEvent = e;
        position(e);
      });
      row.addEventListener("mouseleave", function () {
        lastEvent = null;
        preview.classList.remove("visible");
      });
    });
  }

  function init() {
    initCoverPreview();
    fetch(DESCRIPTIONS_URL)
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (raw) {
        var descriptions = {};
        Object.keys(raw).forEach(function (key) {
          if (typeof raw[key] === "string") descriptions[normalize(key)] = raw[key].trim();
        });

        document.querySelectorAll(".price-table tbody tr").forEach(function (row) {
          var cell = row.querySelector(".desc-col");
          var text = descriptions[normalize(row.cells[0].textContent)];
          if (cell && text) fillCell(cell, text);
        });
      })
      .catch(function (err) {
        console.warn("Could not load book descriptions:", err);
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
