(function () {
  "use strict";

  // Share button in the social row. Uses the device share sheet where the
  // browser has one (phones, most desktops); otherwise opens a small menu
  // with Facebook, X and copy-link options.

  function shareData() {
    return { title: document.title, url: window.location.href };
  }

  function copyLink(url, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () { fallbackCopy(url, done); });
    } else {
      fallbackCopy(url, done);
    }
  }

  function fallbackCopy(url, done) {
    var input = document.createElement("textarea");
    input.value = url;
    input.setAttribute("readonly", "");
    input.style.position = "absolute";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.select();
    try { document.execCommand("copy"); done(); } catch (e) { /* ignore */ }
    document.body.removeChild(input);
  }

  function buildMenu(data) {
    var url = encodeURIComponent(data.url);
    var text = encodeURIComponent(data.title);
    var menu = document.createElement("div");
    menu.className = "share-menu";
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", "Share options");
    menu.hidden = true;
    menu.innerHTML =
      '<a role="menuitem" href="https://www.facebook.com/sharer/sharer.php?u=' + url + '" target="_blank" rel="noopener noreferrer">Facebook</a>' +
      '<a role="menuitem" href="https://x.com/intent/post?url=' + url + '&text=' + text + '" target="_blank" rel="noopener noreferrer">X</a>' +
      '<button type="button" role="menuitem" class="share-copy">Copy link</button>';
    return menu;
  }

  function init() {
    var buttons = document.querySelectorAll(".social-btn.share");
    Array.prototype.forEach.call(buttons, function (btn) {
      var wrap = document.createElement("span");
      wrap.className = "share-wrap";
      btn.parentNode.insertBefore(wrap, btn);
      wrap.appendChild(btn);

      var menu = buildMenu(shareData());
      wrap.appendChild(menu);
      var copyBtn = menu.querySelector(".share-copy");

      // role="menu" promises arrow-key behaviour, so the items are walked
      // with Up/Down (Home/End jump to the ends) and Tab closes the menu.
      function menuItems() {
        return Array.prototype.slice.call(menu.querySelectorAll('[role="menuitem"]'));
      }

      function focusItem(index) {
        var items = menuItems();
        if (!items.length) return;
        var wrapped = ((index % items.length) + items.length) % items.length;
        items[wrapped].focus();
      }

      function setOpen(open) {
        menu.hidden = !open;
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        // Opening the menu moves focus to its first item, as a menu should.
        if (open) focusItem(0);
      }

      btn.addEventListener("click", function () {
        if (navigator.share) {
          navigator.share(shareData()).catch(function () { /* cancelled */ });
          return;
        }
        setOpen(menu.hidden);
      });

      btn.addEventListener("keydown", function (e) {
        if (menu.hidden && e.key === "ArrowDown") {
          e.preventDefault();
          setOpen(true);
        }
      });

      menu.addEventListener("keydown", function (e) {
        var items = menuItems();
        var index = items.indexOf(document.activeElement);

        if (e.key === "ArrowDown") {
          e.preventDefault();
          focusItem(index + 1);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          focusItem(index - 1);
        } else if (e.key === "Home") {
          e.preventDefault();
          focusItem(0);
        } else if (e.key === "End") {
          e.preventDefault();
          focusItem(items.length - 1);
        } else if (e.key === "Tab") {
          // Leaving the menu closes it, so it is not left open behind focus.
          setOpen(false);
        }
      });

      copyBtn.addEventListener("click", function () {
        copyLink(window.location.href, function () {
          copyBtn.textContent = "Link copied!";
          setTimeout(function () { copyBtn.textContent = "Copy link"; setOpen(false); }, 1500);
        });
      });

      menu.addEventListener("click", function (e) {
        if (e.target.tagName === "A") setOpen(false);
      });

      document.addEventListener("click", function (e) {
        if (!wrap.contains(e.target)) setOpen(false);
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && !menu.hidden) { setOpen(false); btn.focus(); }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
