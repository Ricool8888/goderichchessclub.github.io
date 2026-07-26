(function () {
  "use strict";

  var STORAGE_KEY = "gcc-theme";

  function getStoredTheme() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function storeTheme(theme) {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) { /* storage unavailable, ignore */ }
  }

  function applyTheme(theme) {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  function init() {
    var toggle = document.getElementById("themeToggle");
    if (!toggle) return;

    toggle.addEventListener("click", function () {
      var isLight = document.documentElement.getAttribute("data-theme") === "light";
      var next = isLight ? "dark" : "light";
      applyTheme(next);
      storeTheme(next);
      toggle.setAttribute("aria-pressed", next === "light" ? "true" : "false");
    });

    // Reflect whatever theme is already active (set by the inline
    // head script before the page painted) in the button's state.
    var current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    toggle.setAttribute("aria-pressed", current === "light" ? "true" : "false");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
