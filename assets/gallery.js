(function () {
  "use strict";

  function fetchSections() {
    return fetch("assets/gallery.json")
      .then(function (res) { if (!res.ok) throw new Error("no gallery file"); return res.json(); })
      .catch(function () { return []; });
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
    card.appendChild(img);

    if (photo.caption) {
      var cap = document.createElement("span");
      cap.className = "gallery-item-caption";
      cap.textContent = photo.caption;
      card.appendChild(cap);
    }

    card.addEventListener("click", function () { openLightbox(photo); });
    return card;
  }

  function buildSection(section) {
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

    var photos = Array.isArray(section.photos) ? section.photos : [];
    if (!photos.length) {
      var empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "No photos in this section yet.";
      grid.appendChild(empty);
    } else {
      photos.forEach(function (photo) { grid.appendChild(buildGalleryItem(photo)); });
    }

    wrap.appendChild(grid);
    return wrap;
  }

  function render(sections) {
    var container = document.getElementById("galleryContainer");
    container.innerHTML = "";

    if (!sections.length) {
      var empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "No photos have been added yet.";
      container.appendChild(empty);
      return;
    }

    sections.forEach(function (section) { container.appendChild(buildSection(section)); });
  }

  function init() {
    document.getElementById("lightboxCloseBtn").addEventListener("click", closeLightbox);
    document.getElementById("lightboxOverlay").addEventListener("click", function (e) {
      if (e.target === this) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLightbox();
    });

    fetchSections().then(render);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
