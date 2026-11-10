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

  document.addEventListener("DOMContentLoaded", init);
})();
