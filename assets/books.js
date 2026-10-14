(function () {
  "use strict";

  // Cover images are named after the table title, e.g. "Checkmate.jpg".
  var IMAGES_DIR = "assets/books/images/";
  var HIDE_DELAY = 200; // ms - long enough to move the pointer from a row onto its preview
  var EDGE_GAP = 8;

  function coverSrc(title) {
    return IMAGES_DIR + encodeURIComponent(title) + ".jpg";
  }

  function rowTitle(row) {
    return row.cells[0].textContent.trim();
  }

  // The cover opens in a lightbox. Returns { open, close }.
  function initLightbox() {
    var overlay = document.getElementById("lightboxOverlay");
    var img = document.getElementById("lightboxImage");
    var caption = document.getElementById("lightboxCaption");
    var closeBtn = document.getElementById("lightboxCloseBtn");
    if (!overlay) return null;

    var returnFocusTo = null;

    function isOpen() {
      return overlay.classList.contains("open");
    }

    function open(title, trigger) {
      returnFocusTo = trigger || null;
      img.src = coverSrc(title);
      img.alt = "Cover of " + title;
      caption.textContent = title;
      overlay.classList.add("open");
      overlay.setAttribute("aria-hidden", "false");
      closeBtn.focus();
    }

    function close() {
      if (!isOpen()) return;
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");
      if (returnFocusTo) returnFocusTo.focus();
      returnFocusTo = null;
    }

    img.onerror = close;

    // A click anywhere on the overlay, including the close button, dismisses it.
    overlay.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (!isOpen()) return;
      if (e.key === "Escape") close();
      // The close button is the only control, so keep focus on it.
      if (e.key === "Tab") { e.preventDefault(); closeBtn.focus(); }
    });

    return { open: open, close: close };
  }

  // Each title becomes a button, so the cover can be opened from the keyboard
  // as well as with a mouse or by touch.
  function initTitleButtons(rows, lightbox, beforeOpen) {
    rows.forEach(function (row) {
      var cell = row.cells[0];
      var title = rowTitle(row);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "book-title-btn";
      btn.textContent = title;
      btn.setAttribute("aria-label", title + ", view cover");
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (beforeOpen) beforeOpen();
        lightbox.open(title, btn);
      });
      cell.textContent = "";
      cell.appendChild(btn);
    });
  }

  // Mouse users: the cover appears beside the title while hovering a row. It
  // stays up while the pointer is over the row or the cover itself, and
  // Escape dismisses it. Returns a function that hides the preview.
  function initHoverPreview(rows) {
    var preview = document.createElement("img");
    preview.className = "book-preview";
    preview.alt = "";
    preview.setAttribute("aria-hidden", "true");
    document.body.appendChild(preview);

    var activeRow = null;
    var hideTimer = null;

    function position() {
      if (!activeRow) return;
      var cell = activeRow.cells[0].getBoundingClientRect();
      var row = activeRow.getBoundingClientRect();
      var x = cell.right - EDGE_GAP;
      var y = row.top + row.height / 2 - preview.offsetHeight / 2;
      x = Math.min(x, window.innerWidth - preview.offsetWidth - EDGE_GAP);
      y = Math.min(y, window.innerHeight - preview.offsetHeight - EDGE_GAP);
      preview.style.left = Math.max(EDGE_GAP, x) + "px";
      preview.style.top = Math.max(EDGE_GAP, y) + "px";
    }

    function show(row, src) {
      clearTimeout(hideTimer);
      if (activeRow === row) return;
      activeRow = row;
      preview.src = src;
      preview.classList.add("visible");
      position();
    }

    function hide() {
      clearTimeout(hideTimer);
      activeRow = null;
      preview.classList.remove("visible");
    }

    function hideSoon() {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(hide, HIDE_DELAY);
    }

    preview.onload = position;
    preview.onerror = hide;
    preview.addEventListener("mouseenter", function () { clearTimeout(hideTimer); });
    preview.addEventListener("mouseleave", hideSoon);

    rows.forEach(function (row) {
      var src = coverSrc(rowTitle(row));
      new Image().src = src; // preload so the cover appears instantly
      row.addEventListener("mouseenter", function () { show(row, src); });
      row.addEventListener("mouseleave", hideSoon);
    });

    // The preview is pinned to the viewport, so it would drift off its row.
    window.addEventListener("scroll", hide, { passive: true });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") hide();
    });

    return hide;
  }

  function init() {
    var rows = Array.prototype.slice.call(document.querySelectorAll(".price-table tbody tr"));
    var lightbox = initLightbox();
    if (!lightbox) return;

    var hidePreview = null;
    if (window.matchMedia("(hover: hover)").matches) {
      hidePreview = initHoverPreview(rows);
    } else {
      // Touch screens: tapping anywhere on a row opens the cover.
      rows.forEach(function (row) {
        row.classList.add("has-cover");
        row.addEventListener("click", function () {
          lightbox.open(rowTitle(row), row.querySelector(".book-title-btn"));
        });
      });
    }

    initTitleButtons(rows, lightbox, hidePreview);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
