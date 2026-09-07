(function () {
  "use strict";

  function fetchPhotos() {
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

  function renderGrid(photos) {
    var grid = document.getElementById("galleryGrid");
    grid.innerHTML = "";

    if (!photos.length) {
      var empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "No photos have been added yet.";
      grid.appendChild(empty);
      return;
    }

    photos.forEach(function (photo) {
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
      grid.appendChild(card);
    });
  }

  function init() {
    document.getElementById("lightboxCloseBtn").addEventListener("click", closeLightbox);
    document.getElementById("lightboxOverlay").addEventListener("click", function (e) {
      if (e.target === this) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLightbox();
    });

    fetchPhotos().then(renderGrid);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
