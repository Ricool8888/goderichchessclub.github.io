// Meeting maps on the home page.
//
// A Google Maps embed is a third-party request made on the club's behalf, so
// each map is a button until the visitor asks for it. Clicking swaps the
// button for the iframe it describes, which keeps the address usable and the
// page free of third-party requests for anyone who never opens a map.
(function () {
  "use strict";

  document.querySelectorAll("[data-map-facade]").forEach(function (button) {
    button.addEventListener("click", function () {
      var frame = document.createElement("iframe");
      frame.className = "meeting-map";
      frame.loading = "lazy";
      frame.title = button.getAttribute("data-map-title") || "Map";
      frame.src = button.getAttribute("data-map-src") || "";
      button.replaceWith(frame);
    });
  });
})();
