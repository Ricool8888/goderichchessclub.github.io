(function () {
  "use strict";

  var DISMISS_KEY = "gcc-dismissed-banner";

  function wasDismissed(id) {
    try {
      return window.localStorage.getItem(DISMISS_KEY) === id;
    } catch (e) {
      return false;
    }
  }

  function markDismissed(id) {
    try {
      window.localStorage.setItem(DISMISS_KEY, id);
    } catch (e) { /* storage unavailable, ignore */ }
  }

  function render(data) {
    if (!data || !data.enabled) return;
    if (!data.id || !data.message) return;
    if (wasDismissed(data.id)) return;

    var mount = document.getElementById("siteBanner");
    if (!mount) return;

    var bar = document.createElement("div");
    bar.className = "site-banner-bar site-banner-" + (data.style === "urgent" ? "urgent" : "info");
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Site announcement");

    var text = document.createElement("span");
    text.className = "site-banner-text";
    text.textContent = data.message;
    bar.appendChild(text);

    if (data.linkUrl && data.linkText) {
      var link = document.createElement("a");
      link.href = data.linkUrl;
      link.className = "site-banner-link";
      link.textContent = data.linkText + " \u2192";
      bar.appendChild(link);
    }

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "site-banner-close";
    closeBtn.setAttribute("aria-label", "Dismiss announcement");
    closeBtn.innerHTML = "&times;";
    closeBtn.addEventListener("click", function () {
      markDismissed(data.id);
      bar.remove();
    });
    bar.appendChild(closeBtn);

    mount.appendChild(bar);
  }

  function init() {
    fetch("assets/banner.json")
      .then(function (res) { if (!res.ok) throw new Error("no banner file"); return res.json(); })
      .then(render)
      .catch(function () { /* no banner configured, do nothing */ });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
