(function () {
  "use strict";

  // Cover images are named after the table title, e.g. "Checkmate.jpg".
  var IMAGES_DIR = "assets/books/images/";
  var CURSOR_OFFSET = 16;

  function coverSrc(title) {
    return IMAGES_DIR + encodeURIComponent(title) + ".jpg";
  }

  // Mouse users: the cover follows the cursor while hovering a row.
  function initHoverPreview(rows) {
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

    rows.forEach(function (row) {
      var src = coverSrc(row.cells[0].textContent.trim());
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

  // Touch screens: tapping a row opens the cover in a lightbox.
  function initTapLightbox(rows) {
    var overlay = document.getElementById("lightboxOverlay");
    var img = document.getElementById("lightboxImage");
    var caption = document.getElementById("lightboxCaption");
    if (!overlay) return;

    function open(title) {
      img.src = coverSrc(title);
      img.alt = "Cover of " + title;
      caption.textContent = title;
      overlay.classList.add("open");
      overlay.setAttribute("aria-hidden", "false");
    }

    function close() {
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");
    }

    img.onerror = close;

    rows.forEach(function (row) {
      row.classList.add("has-cover");
      row.addEventListener("click", function () {
        open(row.cells[0].textContent.trim());
      });
    });

    // A tap anywhere on the overlay, including the close button, dismisses it.
    overlay.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }

  function init() {
    var rows = Array.prototype.slice.call(document.querySelectorAll(".price-table tbody tr"));
    if (window.matchMedia("(hover: hover)").matches) {
      initHoverPreview(rows);
    } else {
      initTapLightbox(rows);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
