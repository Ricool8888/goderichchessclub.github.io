(function () {
  "use strict";

  /*
   * The posts themselves are written into posts-and-news.html from
   * assets/posts.json by scripts/render-posts.mjs, so each one has a real
   * address (#post-id), is readable without JavaScript, and can be indexed.
   *
   * This script adds the extras on top: the search box, the year and category
   * filters, and the "Read more" buttons. It works on the cards already in the
   * page instead of building them, so nothing here is required to read a post.
   */

  var MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  var state = {
    posts: [],        // one entry per card in the page
    filterYear: null,
    filterMonth: null, // 0-indexed
    filterCategory: null,
    searchTerm: "",
    expandedId: null
  };

  function readPosts() {
    return Array.prototype.slice.call(document.querySelectorAll("#blogList .post-card")).map(function (card) {
      var date = new Date(card.getAttribute("data-date") + "T00:00:00");

      return {
        card: card,
        id: card.id,
        year: date.getFullYear(),
        month: date.getMonth(),
        category: card.getAttribute("data-category") || "",
        // Everything the visitor can read in the card, lower-cased once, so
        // search does not have to walk the DOM on every keystroke.
        haystack: (card.textContent || "").toLowerCase().replace(/\s+/g, " "),
        button: card.querySelector(".post-readmore")
      };
    });
  }

  function hasFilter() {
    return state.filterYear !== null || state.filterCategory !== null || state.searchTerm !== "";
  }

  /* ---------------------------------------------------------------- filters */

  function matches(post) {
    if (state.filterYear !== null && post.year !== state.filterYear) return false;
    if (state.filterMonth !== null && post.month !== state.filterMonth) return false;
    if (state.filterCategory && post.category !== state.filterCategory) return false;
    if (state.searchTerm && post.haystack.indexOf(state.searchTerm.toLowerCase()) === -1) return false;
    return true;
  }

  function renderList() {
    var visible = 0;

    state.posts.forEach(function (post) {
      var show = matches(post);
      post.card.hidden = !show;
      if (show) visible += 1;
    });

    var empty = document.getElementById("blogEmpty");
    if (empty) empty.hidden = visible > 0;

    syncArchive();
    syncCategories();

    var resetBtn = document.getElementById("resetFiltersBtn");
    if (resetBtn) resetBtn.style.display = hasFilter() ? "inline" : "none";
  }

  /* ---------------------------------------------------------------- archive */

  function buildArchive() {
    var container = document.getElementById("archiveList");
    if (!container) return;

    container.innerHTML = "";

    var byYear = {};
    state.posts.forEach(function (post) {
      byYear[post.year] = byYear[post.year] || {};
      byYear[post.year][post.month] = (byYear[post.year][post.month] || 0) + 1;
    });

    var years = Object.keys(byYear).map(Number).sort(function (a, b) { return b - a; });

    if (!years.length) {
      var none = document.createElement("p");
      none.className = "muted-note";
      none.textContent = "No posts yet.";
      container.appendChild(none);
      return;
    }

    years.forEach(function (year) {
      var wrap = document.createElement("div");
      wrap.className = "archive-year";

      var label = document.createElement("h3");
      label.className = "archive-year-label";
      label.textContent = year;
      wrap.appendChild(label);

      Object.keys(byYear[year]).map(Number).sort(function (a, b) { return b - a; }).forEach(function (month) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "archive-month-btn";
        btn.setAttribute("data-year", year);
        btn.setAttribute("data-month", month);

        var name = document.createElement("span");
        name.textContent = MONTH_NAMES[month];

        var count = document.createElement("span");
        count.className = "archive-count";
        count.textContent = byYear[year][month];

        btn.appendChild(name);
        btn.appendChild(count);

        btn.addEventListener("click", function () {
          if (state.filterYear === year && state.filterMonth === month) {
            state.filterYear = null;
            state.filterMonth = null;
          } else {
            state.filterYear = year;
            state.filterMonth = month;
          }
          renderList();
        });

        wrap.appendChild(btn);
      });

      container.appendChild(wrap);
    });
  }

  function syncArchive() {
    Array.prototype.slice.call(document.querySelectorAll(".archive-month-btn")).forEach(function (btn) {
      var active = Number(btn.getAttribute("data-year")) === state.filterYear &&
        Number(btn.getAttribute("data-month")) === state.filterMonth;
      btn.classList.toggle("active", active);
    });
  }

  /* ------------------------------------------------------------- categories */

  function buildCategories() {
    var container = document.getElementById("categoryList");
    if (!container) return;

    container.innerHTML = "";

    var seen = {};
    state.posts.forEach(function (post) { if (post.category) seen[post.category] = true; });

    Object.keys(seen).sort().forEach(function (category) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "category-pill";
      btn.setAttribute("data-category", category);
      btn.textContent = category;

      btn.addEventListener("click", function () {
        state.filterCategory = state.filterCategory === category ? null : category;
        renderList();
      });

      container.appendChild(btn);
    });
  }

  function syncCategories() {
    Array.prototype.slice.call(document.querySelectorAll(".category-pill")).forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-category") === state.filterCategory);
    });
  }

  /* ------------------------------------------------------- Read more / less */

  function setExpanded(id) {
    state.expandedId = id;

    state.posts.forEach(function (post) {
      var open = post.id === id;

      post.card.classList.toggle("expanded", open);
      // Collapsed is the default once the script is running: without it the
      // full text stays visible, which is what a visitor without JavaScript
      // should get.
      post.card.classList.toggle("collapsed", !open);

      if (post.button) {
        post.button.setAttribute("aria-expanded", open ? "true" : "false");
        post.button.textContent = open ? "Show less \u2191" : "Read more \u2192";
      }
    });
  }

  function init() {
    state.posts = readPosts();

    state.posts.forEach(function (post) {
      if (!post.button) return;
      post.button.addEventListener("click", function () {
        setExpanded(state.expandedId === post.id ? null : post.id);
      });
    });

    // A link such as /posts-and-news#post-2026-11-09-winter-rapid opens that
    // post, whichever way the visitor arrived.
    function expandFromHash() {
      var id = window.location.hash.replace(/^#/, "");
      if (!id) return;
      if (state.posts.some(function (post) { return post.id === id; })) setExpanded(id);
    }

    window.addEventListener("hashchange", expandFromHash);

    buildArchive();
    buildCategories();

    var searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", function (e) {
        state.searchTerm = e.target.value;
        renderList();
      });
    }

    var resetBtn = document.getElementById("resetFiltersBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        state.filterYear = null;
        state.filterMonth = null;
        state.filterCategory = null;
        state.searchTerm = "";
        if (searchInput) {
          searchInput.value = "";
          searchInput.focus();
        }
        renderList();
      });
    }

    renderList();

    // Start with every post as an excerpt plus "Read more", like the list has
    // always looked. The full text is only in the HTML so a visitor without
    // JavaScript can still read it.
    setExpanded(null);
    expandFromHash();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
