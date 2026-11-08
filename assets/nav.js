(function () {
  "use strict";

  // Mobile menu: the button toggles it, Escape closes it and returns focus to
  // the button, and a click anywhere outside closes it. Shared by every page
  // instead of an inline copy in each one.
  document.addEventListener("DOMContentLoaded", function () {
    var toggle = document.getElementById("navToggle");
    var nav = document.getElementById("primaryNav");
    if (!toggle || !nav) return;

    function isOpen() {
      return nav.classList.contains("open");
    }

    function setOpen(open) {
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    }

    toggle.addEventListener("click", function () {
      setOpen(!isOpen());
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" && event.key !== "Esc") return;
      if (!isOpen()) return;
      setOpen(false);
      toggle.focus();
    });

    document.addEventListener("click", function (event) {
      if (!isOpen()) return;
      var target = event.target;
      if (toggle.contains(target) || nav.contains(target)) return;
      setOpen(false);
    });
  });
})();
