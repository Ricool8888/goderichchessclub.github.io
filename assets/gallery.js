(function () {
  "use strict";

  /*
   * Gallery performance:
   * - Photos load only as they approach the viewport.
   * - IntersectionObserver starts loading images about 400px
   *   before they enter the screen.
   * - Images are decoded asynchronously.
   * - Gallery cards are created in small batches.
   * - Loaded photos fade smoothly into view.
   */

  var LAZY_LOAD_MARGIN = "800px";
  var BATCH_SIZE = 8;
  var imageObserver = null;

  function fetchSections() {
    return fetch("assets/gallery.json", {
      cache: "default"
    })
      .then(function (res) {
        if (!res.ok) {
          throw new Error("no gallery file");
        }

        return res.json();
      })
      .catch(function () {
        return [];
      });
  }

  /*
   * Load an image once it gets close to the viewport.
   */
  function loadImage(img) {
    if (!img || img.dataset.loaded === "true") {
      return;
    }

    var src = img.dataset.src;

    if (!src) {
      return;
    }

    /*
     * Keep the image transparent while it is loading.
     */
    img.classList.add("gallery-image-loading");

    /*
     * The grid shows a small WebP copy (see
     * scripts/generate-gallery-thumbs.mjs); the browser picks the
     * 480 px or 960 px version from srcset. If the small copy is
     * ever missing, the error handler below falls back to the
     * original photo so the gallery never shows a blank tile.
     */
    if (img.dataset.srcset) {
      img.srcset = img.dataset.srcset;
    }

    /*
     * Setting src here actually starts the image request.
     */
    img.src = src;
    img.dataset.loaded = "true";

    /*
     * Ask the browser to decode the image asynchronously.
     */
    img.decoding = "async";

    /*
     * Once the image has completely loaded, fade it into view.
     */
    img.addEventListener(
      "load",
      function () {
        img.classList.remove("gallery-image-loading");
        img.classList.add("gallery-image-loaded");
      },
      { once: true }
    );

    /*
     * If the small copy fails, try the original once. If that fails
     * too, don't leave the tile permanently invisible.
     */
    img.addEventListener("error", function () {
      var full = img.dataset.fullSrc;

      if (full && img.getAttribute("src") !== full) {
        img.removeAttribute("srcset");
        img.src = full;
        return;
      }

      img.classList.remove("gallery-image-loading");
    });

    /*
     * We no longer need to observe this image.
     */
    if (imageObserver) {
      imageObserver.unobserve(img);
    }
  }

  var revealObserver = null;

  function setupRevealAnimation() {
    if ("IntersectionObserver" in window) {
      revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("gallery-item-visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -60px 0px", threshold: 0.05 }
      );
    }
  }
  
  /*
   * Set up IntersectionObserver for progressive loading.
   */
  function setupLazyLoading() {
    if ("IntersectionObserver" in window) {
      imageObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              loadImage(entry.target);
            }
          });
        },
        {
          /*
           * Begin loading approximately 400px before
           * the image reaches the visible viewport.
           */
          rootMargin: LAZY_LOAD_MARGIN,

          threshold: 0
        }
      );
    } else {
      /*
       * Fallback for older browsers.
       */
      imageObserver = null;
    }
  }

  /*
   * Add an image to the lazy-loading observer.
   */
  function observeImage(img) {
    if (imageObserver) {
      imageObserver.observe(img);
    } else {
      /*
       * Older-browser fallback:
       * simply load the image.
       */
      loadImage(img);
    }
  }

  /*
   * Every photo on the page, in the order it appears, so the
   * lightbox can step forward and back between them.
   */
  var allPhotos = [];
  var currentPhotoIndex = -1;

  /*
   * The card that opened the lightbox, so focus can go
   * back there when it closes.
   */
  var returnFocusTo = null;

  /*
   * Show one photo in the lightbox. Called both when a card is
   * clicked and when the visitor steps to the next / previous
   * photo, so the caption, counter and alt text always match.
   */
  function showPhoto(index) {
    if (!allPhotos.length) {
      return;
    }

    /*
     * Wrap around at both ends, so the buttons never dead-end.
     */
    currentPhotoIndex =
      ((index % allPhotos.length) + allPhotos.length) % allPhotos.length;

    var photo = allPhotos[currentPhotoIndex];

    var img = document.getElementById("lightboxImage");
    var caption = document.getElementById("lightboxCaption");
    var counter = document.getElementById("lightboxCounter");

    if (!img) {
      return;
    }

    /*
     * The lightbox always opens the full-size file: this is the
     * one place the extra detail of the original is worth the
     * download.
     */
    img.src = "assets/gallery/" + photo.filename;
    img.alt = photo.alt || photo.caption || "";

    caption.textContent = photo.caption || "";

    if (counter) {
      counter.textContent =
        currentPhotoIndex + 1 + " / " + allPhotos.length;
    }
  }

  /*
   * Open the full-size photo lightbox.
   */
  function openLightbox(photo, trigger) {
    returnFocusTo =
      trigger || document.activeElement;

    var overlay =
      document.getElementById("lightboxOverlay");

    if (!overlay) {
      return;
    }

    showPhoto(allPhotos.indexOf(photo));

    overlay.classList.add("open");

    overlay.setAttribute(
      "aria-hidden",
      "false"
    );

    /*
     * Move focus into the overlay. The close button is the
     * safest landing spot: it is always present, and the arrow
     * keys are already handled for moving between photos.
     */
    var closeBtn =
      document.getElementById(
        "lightboxCloseBtn"
      );

    if (closeBtn) {
      closeBtn.focus();
    }
  }

  /*
   * Close the lightbox.
   */
  function closeLightbox() {
    var overlay =
      document.getElementById("lightboxOverlay");

    if (!overlay.classList.contains("open")) {
      return;
    }

    overlay.classList.remove("open");

    overlay.setAttribute(
      "aria-hidden",
      "true"
    );

    /*
     * Send focus back to the card the visitor came from.
     */
    if (returnFocusTo && returnFocusTo.isConnected) {
      returnFocusTo.focus();
    }

    returnFocusTo = null;
  }

  /*
   * Build one gallery card.
   */
  function buildGalleryItem(photo) {
    var card =
      document.createElement("button");

    card.type = "button";

    card.className =
      "gallery-item";

    var img =
      document.createElement("img");

    var fullSrc =
      "assets/gallery/" + photo.filename;

    var thumbBase =
      "assets/gallery/thumbs/" + photo.filename;

    /*
     * IMPORTANT:
     *
     * The actual image URL is stored in data-src.
     *
     * There is intentionally no img.src here.
     *
     * IntersectionObserver will assign the src when the
     * photo gets close to the viewport.
     */
    img.dataset.src =
      thumbBase + "-960.webp";

    img.dataset.fullSrc = fullSrc;

    img.dataset.srcset =
      thumbBase + "-480.webp 480w, " +
      thumbBase + "-960.webp 960w";

    /*
     * Match the grid: 2 columns on phones, 3 on tablets, 4 on
     * desktop, so the browser downloads the smallest copy that
     * still looks sharp on this screen.
     */
    img.sizes =
      "(max-width: 639px) 47vw, (max-width: 991px) 31vw, 280px";

    img.alt =
      photo.alt || photo.caption || "";

    /*
     * Keep the native browser hint as an additional
     * optimization.
     */

    img.decoding = "async";

    /*
     * Start transparent until the image finishes loading.
     */
    img.classList.add(
      "gallery-image-loading"
    );

    card.appendChild(img);

    /*
     * Add the caption if one exists.
     */
    if (photo.caption) {
      var cap =
        document.createElement("span");

      cap.className =
        "gallery-item-caption";

      cap.textContent =
        photo.caption;

      card.appendChild(cap);
    }

    /*
     * Open the lightbox when the card is clicked.
     */
    card.addEventListener(
      "click",
      function () {
        openLightbox(photo, card);
      }
    );

    /*
     * Begin watching the image for when it approaches
     * the viewport.
     */
    observeImage(img);

    /*
     * Fade the card in when it scrolls into view.
     */
    if (revealObserver) {
      revealObserver.observe(card);
    } else {
      card.classList.add("gallery-item-visible");
    }
    
    return card;
  }

  /*
   * Build the shell for a gallery section.
   */
  function buildSectionShell(section) {
    var wrap =
      document.createElement("section");

    wrap.className =
      "content-section gallery-section";

    if (section.title) {
      var heading =
        document.createElement("h2");

      heading.className =
        "section-heading";

      heading.textContent =
        section.title;

      wrap.appendChild(heading);
    }

    var grid =
      document.createElement("div");

    grid.className =
      "gallery-grid";

    /*
     * Allows the browser to reduce rendering work for
     * sections that are far below the current viewport.
     */

    wrap.appendChild(grid);

    return {
      wrap: wrap,
      grid: grid,
      photos: Array.isArray(section.photos)
        ? section.photos
        : []
    };
  }

  /*
   * Display an empty-state message.
   */
  function appendEmpty(grid, text) {
    var empty =
      document.createElement("div");

    empty.className =
      "empty-state";

    empty.textContent =
      text;

    grid.appendChild(empty);
  }

  /*
   * Run work on the next animation frame.
   *
   * This keeps large galleries from blocking scrolling
   * and other user interactions.
   */
  function scheduleFrame(callback) {
    if (
      typeof window.requestAnimationFrame ===
      "function"
    ) {
      window.requestAnimationFrame(
        callback
      );
    } else {
      window.setTimeout(
        callback,
        0
      );
    }
  }

  /*
   * Render all gallery sections.
   */
  function renderSections(sections) {
    var container =
      document.getElementById(
        "galleryContainer"
      );

    if (!container) {
      return;
    }

    container.innerHTML = "";

    /*
     * Keep one flat list of every photo on the page: the
     * lightbox steps through it with the arrow buttons and
     * keys, across section boundaries.
     */
    allPhotos = [];

    sections.forEach(function (section) {
      (section.photos || []).forEach(function (photo) {
        allPhotos.push(photo);
      });
    });

    if (!sections.length) {
      appendEmpty(
        container,
        "No photos have been added yet."
      );

      return;
    }

    /*
     * Set up image observation before creating
     * the gallery cards.
     */
    setupLazyLoading();
    setupRevealAnimation();

    var sectionIndex = 0;

    function renderNextSection() {
      if (
        sectionIndex >= sections.length
      ) {
        return;
      }

      var sectionData =
        buildSectionShell(
          sections[sectionIndex]
        );

      container.appendChild(
        sectionData.wrap
      );

      sectionIndex += 1;

      var photos =
        sectionData.photos;

      if (!photos.length) {
        appendEmpty(
          sectionData.grid,
          "No photos in this section yet."
        );

        scheduleFrame(
          renderNextSection
        );

        return;
      }

      var photoIndex = 0;

      /*
       * Build only a small number of cards per
       * animation frame.
       */
      function renderBatch() {
        var fragment =
          document.createDocumentFragment();

        var end =
          Math.min(
            photoIndex + BATCH_SIZE,
            photos.length
          );

        for (
          ;
          photoIndex < end;
          photoIndex += 1
        ) {
          fragment.appendChild(
            buildGalleryItem(
              photos[photoIndex]
            )
          );
        }

        sectionData.grid.appendChild(
          fragment
        );

        if (
          photoIndex < photos.length
        ) {
          /*
           * Yield to the browser before creating
           * the next group of cards.
           */
          scheduleFrame(
            renderBatch
          );
        } else {
          scheduleFrame(
            renderNextSection
          );
        }
      }

      renderBatch();
    }

    renderNextSection();
  }

  /*
   * Initialize the gallery.
   */
  function init() {
    var lightboxCloseBtn =
      document.getElementById(
        "lightboxCloseBtn"
      );

    var lightboxOverlay =
      document.getElementById(
        "lightboxOverlay"
      );

    if (lightboxCloseBtn) {
      lightboxCloseBtn.addEventListener(
        "click",
        closeLightbox
      );
    }

    if (lightboxOverlay) {
      lightboxOverlay.addEventListener(
        "click",
        function (e) {
          if (e.target === this) {
            closeLightbox();
          }
        }
      );
    }

    /*
     * Escape closes the lightbox, the arrow keys step through the
     * photos, and Tab cycles between the three controls instead of
     * wandering off behind the overlay.
     */
    var prevBtn =
      document.getElementById(
        "lightboxPrevBtn"
      );

    var nextBtn =
      document.getElementById(
        "lightboxNextBtn"
      );

    if (prevBtn) {
      prevBtn.addEventListener(
        "click",
        function () {
          showPhoto(
            currentPhotoIndex - 1
          );
        }
      );
    }

    if (nextBtn) {
      nextBtn.addEventListener(
        "click",
        function () {
          showPhoto(
            currentPhotoIndex + 1
          );
        }
      );
    }

    document.addEventListener(
      "keydown",
      function (e) {
        if (!lightboxOverlay || !lightboxOverlay.classList.contains("open")) {
          return;
        }

        if (e.key === "Escape") {
          closeLightbox();
          return;
        }

        if (e.key === "ArrowLeft") {
          e.preventDefault();
          showPhoto(
            currentPhotoIndex - 1
          );
          return;
        }

        if (e.key === "ArrowRight") {
          e.preventDefault();
          showPhoto(
            currentPhotoIndex + 1
          );
          return;
        }

        if (e.key === "Tab") {
          var controls =
            [prevBtn, nextBtn, lightboxCloseBtn].filter(
              function (el) {
                return !!el;
              }
            );

          if (!controls.length) {
            return;
          }

          var first =
            controls[0];

          var last =
            controls[controls.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    );

    /*
     * Swipe left / right on touch screens.
     */
    var touchStartX = null;

    if (lightboxOverlay) {
      lightboxOverlay.addEventListener(
        "touchstart",
        function (e) {
          touchStartX = e.changedTouches[0].clientX;
        },
        { passive: true }
      );

      lightboxOverlay.addEventListener(
        "touchend",
        function (e) {
          if (touchStartX === null) {
            return;
          }

          var dx =
            e.changedTouches[0].clientX - touchStartX;

          touchStartX = null;

          if (Math.abs(dx) < 40) {
            return;
          }

          showPhoto(
            currentPhotoIndex + (dx < 0 ? 1 : -1)
          );
        },
        { passive: true }
      );
    }

    /*
     * Fetch gallery data and begin rendering.
     */
    fetchSections().then(
      renderSections
    );
  }

  document.addEventListener(
    "DOMContentLoaded",
    init
  );

})();
