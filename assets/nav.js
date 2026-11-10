(function () {
  "use strict";

  // Mobile menu: the button toggles it, says whether pressing it opens or
  // closes the menu, moves focus into the menu when it opens, and Escape
  // closes it and returns focus to the button. A click anywhere outside
  // closes it. Shared by every page instead of an inline copy in each one.
  document.addEventListener("DOMContentLoaded", function () {
    var toggle = document.getElementById("navToggle");
    var nav = document.getElementById("primaryNav");
    if (!toggle || !nav) return;

    function isOpen() {
      return nav.classList.contains("open");
    }

    function setOpen(open, focusFirstLink) {
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");

      if (!open) return;

      // Opening the menu is the visitor asking to use it, so put focus on its
      // first link instead of leaving it on the button they just pressed.
      var firstLink = nav.querySelector("a");
      if (focusFirstLink && firstLink) firstLink.focus();
    }

    toggle.addEventListener("click", function () {
      var opening = !isOpen();
      setOpen(opening, opening);
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
