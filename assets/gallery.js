(function () {
  "use strict";

  /*
   * Gallery performance:
   *
   * - Photos are NOT given a src immediately.
   * - IntersectionObserver watches each photo.
   * - A photo begins loading when it is approximately 400px
   *   away from entering the viewport.
   * - Images are decoded asynchronously.
   * - Gallery cards are created in small batches so the main
   *   thread remains responsive.
   */

  var LAZY_LOAD_MARGIN = "400px";
  var BATCH_SIZE = 8;

  var imageObserver = null;


  /* ---------------------------------------------------------
     Fetch gallery data
     --------------------------------------------------------- */

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


  /* ---------------------------------------------------------
     Lazy image loading
     --------------------------------------------------------- */

function loadImage(img) {
  if (!img) {
    return;
  }

  if (img.dataset.loaded === "true") {
    return;
  }

  var src = img.dataset.src;

  if (!src) {
    return;
  }

  /*
   * Start with the image transparent.
   * The CSS transition below will smoothly reveal it.
   */
  img.classList.add("gallery-image-loading");

  /*
   * Set the real source only when the image approaches
   * the viewport.
   */
  img.src = src;

  img.dataset.loaded = "true";

  img.decoding = "async";

  try {
    img.fetchPriority = "low";
  } catch (e) {}

  /*
   * When the actual photo has finished loading,
   * smoothly reveal it.
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
   * If the image fails to load, don't leave it
   * permanently transparent.
   */
  img.addEventListener(
    "error",
    function () {
      img.classList.remove("gallery-image-loading");
    },
    { once: true }
  );

  if (imageObserver) {
    imageObserver.unobserve(img);
  }
}


  function setupLazyLoading() {

    /*
     * IntersectionObserver is supported by all modern browsers.
     */
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
           * Begin loading the image before it actually
           * reaches the viewport.
           */
          rootMargin: LAZY_LOAD_MARGIN,

          /*
           * We only need to know whether the image has
           * entered the loading zone.
           */
          threshold: 0
        }
      );

      return;
    }


    /*
     * Fallback for very old browsers that don't support
     * IntersectionObserver.
     *
     * In that case, simply load all images.
     */
    imageObserver = null;
  }


  function observeImage(img) {

    if (imageObserver) {

      imageObserver.observe(img);

    } else {

      /*
       * Old-browser fallback.
       */
      loadImage(img);

    }
  }


  /* ---------------------------------------------------------
     Lightbox
     --------------------------------------------------------- */

  function openLightbox(photo) {

    var overlay =
      document.getElementById("lightboxOverlay");

    var img =
      document.getElementById("lightboxImage");

    var caption =
      document.getElementById("lightboxCaption");


    /*
     * The thumbnail may not have been loaded yet.
     *
     * The lightbox still loads the full-size image immediately
     * when the user actually clicks it.
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


  function closeLightbox() {

    var overlay =
      document.getElementById("lightboxOverlay");

    overlay.classList.remove("open");

    overlay.setAttribute(
      "aria-hidden",
      "true"
    );
  }


  /* ---------------------------------------------------------
     Create individual gallery item
     --------------------------------------------------------- */

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
     * We deliberately do NOT set img.src here.
     *
     * The URL is stored in data-src until the image approaches
     * the viewport.
     */
    img.dataset.src =
      "assets/gallery/" + photo.filename;


    img.alt =
      photo.alt || photo.caption || "";


    /*
     * Keep this as an additional browser hint.
     *
     * IntersectionObserver is controlling the actual loading,
     * while this tells supporting browsers that the image is
     * intended to be lazy.
     */
    img.loading = "lazy";

    img.decoding = "async";


    card.appendChild(img);


    if (photo.caption) {

      var cap =
        document.createElement("span");

      cap.className =
        "gallery-item-caption";

      cap.textContent =
        photo.caption;

      card.appendChild(cap);
    }


    card.addEventListener(
      "click",
      function () {

        openLightbox(photo);

      }
    );


    /*
     * Start watching this image for when it approaches
     * the viewport.
     */
    observeImage(img);


    return card;
  }


  /* ---------------------------------------------------------
     Create gallery section
     --------------------------------------------------------- */

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
     * Allows the browser to reduce rendering work for gallery
     * sections that are far below the current scroll position.
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


  /* ---------------------------------------------------------
     Empty gallery message
     --------------------------------------------------------- */

  function appendEmpty(grid, text) {

    var empty =
      document.createElement("div");

    empty.className =
      "empty-state";

    empty.textContent =
      text;

    grid.appendChild(empty);
  }


  /* ---------------------------------------------------------
     Schedule work for next animation frame
     --------------------------------------------------------- */

  function scheduleFrame(callback) {

    if (
      typeof window.requestAnimationFrame ===
      "function"
    ) {

      window.requestAnimationFrame(callback);

    } else {

      window.setTimeout(callback, 0);

    }
  }


  /* ---------------------------------------------------------
     Render gallery
     --------------------------------------------------------- */

  function renderSections(sections) {

    var container =
      document.getElementById(
        "galleryContainer"
      );


    container.innerHTML = "";


    if (!sections.length) {

      appendEmpty(
        container,
        "No photos have been added yet."
      );

      return;
    }


    /*
     * Create the IntersectionObserver before creating
     * the gallery images.
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
       * Only create a small number of gallery
       * cards per animation frame.
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
           * Yield to the browser before
           * creating the next batch.
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


  /* ---------------------------------------------------------
     Initialize
     --------------------------------------------------------- */

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


    document.addEventListener(
      "keydown",
      function (e) {

        if (e.key === "Escape") {

          closeLightbox();

        }

      }
    );


    /*
     * Fetch the gallery data and start rendering.
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
