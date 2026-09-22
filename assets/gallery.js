(function () {
  "use strict";

  /*
   * Gallery performance notes:
   * - Images remain lazy-loaded and are decoded asynchronously.
   * - Thumbnail requests are given low priority so they do not compete with
   *   controls such as the light/dark theme toggle.
   * - Gallery DOM creation is batched across animation frames. The previous
   *   version created every card synchronously in one task, which could block
   *   clicks while a large gallery was being built.
   */

  function fetchSections() {
    return fetch("assets/gallery.json", {
      cache: "default"
    })
      .then(function (res) {
        if (!res.ok) throw new Error("no gallery file");
        return res.json();
      })
      .catch(function () {
        return [];
      });
  }

  function openLightbox(photo) {
    var overlay = document.getElementById("lightboxOverlay");
    var img = document.getElementById("lightboxImage");
    var caption = document.getElementById("lightboxCaption");

    img.src = "assets/gallery/" + photo.filename;
    img.alt = photo.alt || photo.caption || "";
    caption.textContent = photo.caption || "";

    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
  }

  function closeLightbox() {
    var overlay = document.getElementById("lightboxOverlay");
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
  }

  function buildGalleryItem(photo) {
    var card = document.createElement("button");
    card.type = "button";
    card.className = "gallery-item";

    var img = document.createElement("img");
    img.src = "assets/gallery/" + photo.filename;
    img.alt = photo.alt || photo.caption || "";
    img.loading = "lazy";
    img.decoding = "async";

    try {
      img.fetchPriority = "low";
    } catch (e) {}

    card.appendChild(img);

    if (photo.caption) {
      var cap = document.createElement("span");
      cap.className = "gallery-item-caption";
      cap.textContent = photo.caption;
      card.appendChild(cap);
    }

    card.addEventListener("click", function () {
      openLightbox(photo);
    });

    return card;
  }

  function buildSectionShell(section) {
    var wrap = document.createElement("section");
    wrap.className = "content-section gallery-section";

    if (section.title) {
      var heading = document.createElement("h2");
      heading.className = "section-heading";
      heading.textContent = section.title;
      wrap.appendChild(heading);
    }

    var grid = document.createElement("div");
    grid.className = "gallery-grid";

    /*
     * Allows the browser to skip rendering work for gallery sections
     * that are currently off-screen.
     */
    grid.style.contentVisibility = "auto";
    grid.style.containIntrinsicSize = "600px";

    wrap.appendChild(grid);

    return {
      wrap: wrap,
      grid: grid,
      photos: Array.isArray(section.photos) ? section.photos : []
    };
  }

  function appendEmpty(grid, text) {
    var empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = text;
    grid.appendChild(empty);
  }

  function scheduleFrame(callback) {
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(callback);
    } else {
      window.setTimeout(callback, 0);
    }
  }

  function renderSections(sections) {
    var container = document.getElementById("galleryContainer");
    container.innerHTML = "";

    if (!sections.length) {
      appendEmpty(container, "No photos have been added yet.");
      return;
    }

    var sectionIndex = 0;

    function renderNextSection() {
      if (sectionIndex >= sections.length) {
        return;
      }

      var sectionData = buildSectionShell(sections[sectionIndex]);

      container.appendChild(sectionData.wrap);
      sectionIndex += 1;

      var photos = sectionData.photos;

      if (!photos.length) {
        appendEmpty(
          sectionData.grid,
          "No photos in this section yet."
        );

        scheduleFrame(renderNextSection);
        return;
      }

      var photoIndex = 0;

      /*
       * Only create a small number of cards per animation frame.
       * This prevents the gallery from monopolizing the main thread.
       */
      var BATCH_SIZE = 8;

      function renderBatch() {
        var fragment = document.createDocumentFragment();

        var end = Math.min(
          photoIndex + BATCH_SIZE,
          photos.length
        );

        for (; photoIndex < end; photoIndex += 1) {
          fragment.appendChild(
            buildGalleryItem(photos[photoIndex])
          );
        }

        sectionData.grid.appendChild(fragment);

        if (photoIndex < photos.length) {
          /*
           * Yield back to the browser before creating the next batch.
           * This allows theme clicks and other UI interactions to respond.
           */
          scheduleFrame(renderBatch);
        } else {
          scheduleFrame(renderNextSection);
        }
      }

      renderBatch();
    }

    renderNextSection();
  }

  function init() {
    var lightboxCloseBtn =
      document.getElementById("lightboxCloseBtn");

    var lightboxOverlay =
      document.getElementById("lightboxOverlay");

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

    fetchSections().then(renderSections);
  }

  document.addEventListener(
    "DOMContentLoaded",
    init
  );
})();
