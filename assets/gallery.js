(function () {
  "use strict";

  /*
   * The photo grid itself is written into gallery.html from
   * assets/gallery.json by scripts/render-gallery.mjs, so the photos are part
   * of the page: they load with it, they are there without JavaScript, and
   * search engines can see them. This script adds the enlargement on top -
   * clicking a photo opens the full-size original in the lightbox.
   */

  // Every photo card on the page, in order, so the lightbox can step through
  // them across section boundaries.
  var photos = [];
  var currentPhotoIndex = -1;

  // The card that opened the lightbox, so focus can go back there on close.
  var returnFocusTo = null;

  function captionFor(card) {
    var caption = card.querySelector(".gallery-item-caption");
    return caption ? caption.textContent.trim() : "";
  }

  function altFor(card) {
    var img = card.querySelector("img");
    return img ? img.alt : "";
  }

  /*
   * Show one photo in the lightbox. Called both when a card is clicked and
   * when the visitor steps to the next / previous photo, so the caption,
   * counter and alt text always match.
   */
  function showPhoto(index) {
    if (!photos.length) return;

    // Wrap around at both ends, so the buttons never dead-end.
    currentPhotoIndex = ((index % photos.length) + photos.length) % photos.length;

    var photo = photos[currentPhotoIndex];
    var img = document.getElementById("lightboxImage");
    var caption = document.getElementById("lightboxCaption");
    var counter = document.getElementById("lightboxCounter");

    if (!img) return;

    // The lightbox always opens the full-size file: this is the one place
    // the extra detail of the original is worth the download.
    img.src = photo.src;
    img.alt = photo.alt;
    caption.textContent = photo.caption;

    if (counter) counter.textContent = currentPhotoIndex + 1 + " / " + photos.length;
  }

  function openLightbox(index, trigger) {
    returnFocusTo = trigger || document.activeElement;

    var overlay = document.getElementById("lightboxOverlay");
    if (!overlay) return;

    showPhoto(index);

    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");

    // Move focus into the overlay. The close button is the safest landing
    // spot: it is always present, and the arrow keys are handled for moving
    // between photos.
    var closeBtn = document.getElementById("lightboxCloseBtn");
    if (closeBtn) closeBtn.focus();
  }

  function closeLightbox() {
    var overlay = document.getElementById("lightboxOverlay");
    if (!overlay || !overlay.classList.contains("open")) return;

    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");

    // Send focus back to the card the visitor came from.
    if (returnFocusTo && returnFocusTo.isConnected) returnFocusTo.focus();
    returnFocusTo = null;
  }

  function init() {
    var overlay = document.getElementById("lightboxOverlay");
    var closeBtn = document.getElementById("lightboxCloseBtn");
    var prevBtn = document.getElementById("lightboxPrevBtn");
    var nextBtn = document.getElementById("lightboxNextBtn");

    photos = [];

    Array.prototype.slice.call(document.querySelectorAll(".gallery-item")).forEach(function (card) {
      var src = card.dataset.full;
      if (!src) return;

      photos.push({ src: src, caption: captionFor(card), alt: altFor(card), card: card });
    });

    photos.forEach(function (photo, index) {
      photo.card.addEventListener("click", function () {
        openLightbox(index, photo.card);
      });
    });

    if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
    if (prevBtn) prevBtn.addEventListener("click", function () { showPhoto(currentPhotoIndex - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { showPhoto(currentPhotoIndex + 1); });

    if (overlay) {
      overlay.addEventListener("click", function (e) {
        if (e.target === this) closeLightbox();
      });
    }

    /*
     * Escape closes the lightbox, the arrow keys step through the photos,
     * and Tab cycles between the three controls instead of wandering off
     * behind the overlay.
     */
    document.addEventListener("keydown", function (e) {
      if (!overlay || !overlay.classList.contains("open")) return;

      if (e.key === "Escape") {
        closeLightbox();
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        showPhoto(currentPhotoIndex - 1);
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        showPhoto(currentPhotoIndex + 1);
        return;
      }

      if (e.key === "Tab") {
        var controls = [prevBtn, nextBtn, closeBtn].filter(function (el) { return !!el; });
        if (!controls.length) return;

        var first = controls[0];
        var last = controls[controls.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // Swipe left / right on touch screens.
    var touchStartX = null;

    if (overlay) {
      overlay.addEventListener("touchstart", function (e) {
        touchStartX = e.changedTouches[0].clientX;
      }, { passive: true });

      overlay.addEventListener("touchend", function (e) {
        if (touchStartX === null) return;

        var dx = e.changedTouches[0].clientX - touchStartX;
        touchStartX = null;

        if (Math.abs(dx) < 40) return;

        showPhoto(currentPhotoIndex + (dx < 0 ? 1 : -1));
      }, { passive: true });
    }
  }

  /*
   * Bring back the gallery's fade-in: each card fades and rises as it
   * scrolls into view, and each photo fades in once it has loaded.
   *
   * Both are opt-in. The .gallery-reveal class is only added here, so a
   * visitor whose script never runs - or a search engine reading the page -
   * still sees every photo instead of a grid of empty squares.
   */
  function initReveal() {
    var grids = Array.prototype.slice.call(document.querySelectorAll(".gallery-grid"));
    if (!grids.length) return;

    var cards = Array.prototype.slice.call(document.querySelectorAll(".gallery-item"));
    var prefersReducedMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // No observer, or the visitor asked for less motion: leave everything
    // exactly as it is in the HTML.
    if (!("IntersectionObserver" in window) || prefersReducedMotion) {
      cards.forEach(function (card) { card.classList.add("gallery-item-visible"); });
      return;
    }

    grids.forEach(function (grid) { grid.classList.add("gallery-reveal"); });

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("gallery-item-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -60px 0px", threshold: 0.05 });

    cards.forEach(function (card) { revealObserver.observe(card); });

    // Fade each photo in when it finishes loading. A photo that is already
    // decoded from the cache still gets one frame at opacity 0, so the fade
    // does not depend on how fast the connection is.
    cards.forEach(function (card) {
      var img = card.querySelector("img");
      if (!img) return;

      img.classList.add("gallery-image-loading");

      var shown = function () {
        img.classList.remove("gallery-image-loading");
        img.classList.add("gallery-image-loaded");
      };

      if (img.complete && img.naturalWidth) {
        requestAnimationFrame(shown);
      } else {
        img.addEventListener("load", shown, { once: true });
        img.addEventListener("error", shown, { once: true });
      }
    });
  }

  // The grid markup sits above this script, so the cards exist already and
  // the fade can start before the first paint.
  initReveal();

  document.addEventListener("DOMContentLoaded", init);
})();
