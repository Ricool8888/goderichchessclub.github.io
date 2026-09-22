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

  var LAZY_LOAD_MARGIN = "400px";
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
     * Setting src here actually starts the image request.
     */
    img.src = src;
    img.dataset.loaded = "true";

    /*
     * Ask the browser to decode the image asynchronously.
     */
    img.decoding = "async";

    /*
     * Keep gallery thumbnails lower priority than more
     * important page resources.
     */
    try {
      img.fetchPriority = "low";
    } catch (e) {}

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
     * If the image fails, don't leave it permanently invisible.
     */
    img.addEventListener(
      "error",
      function () {
        img.classList.remove("gallery-image-loading");
      },
      { once: true }
    );

    /*
     * We no longer need to observe this image.
     */
    if (imageObserver) {
      imageObserver.unobserve(img);
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
   * Open the full-size photo lightbox.
   */
  function openLightbox(photo) {
    var overlay =
      document.getElementById("lightboxOverlay");

    var img =
      document.getElementById("lightboxImage");

    var caption =
      document.getElementById("lightboxCaption");

    /*
     * The full-size image is intentionally loaded immediately
     * when the visitor clicks the gallery card.
     */
    img.src =
      "assets/gallery/" + photo.filename;

    img.alt =
      photo.alt || photo.caption || "";

    caption.textContent =
      photo.caption || "";

    overlay.classList.add("open");

    overlay.setAttribute(
      "aria-hidden",
      "false"
    );
  }

  /*
   * Close the lightbox.
   */
  function closeLightbox() {
    var overlay =
      document.getElementById("lightboxOverlay");

    overlay.classList.remove("open");

    overlay.setAttribute(
      "aria-hidden",
      "true"
    );
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
      "assets/gallery/" + photo.filename;

    img.alt =
      photo.alt || photo.caption || "";

    /*
     * Keep the native browser hint as an additional
     * optimization.
     */
    img.loading = "lazy";

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
        openLightbox(photo);
      }
    );

    /*
     * Begin watching the image for when it approaches
     * the viewport.
     */
    observeImage(img);

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
    grid.style.contentVisibility =
      "auto";

    grid.style.containIntrinsicSize =
      "600px";

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
     * Allow Escape to close the lightbox.
     */
    document.addEventListener(
      "keydown",
      function (e) {
        if (e.key === "Escape") {
          closeLightbox();
        }
      }
    );

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
