(function () {
  "use strict";

  var MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  var state = {
    publishedPosts: [], // loaded from assets/posts.json - the only source of posts
    filterYear: null,
    filterMonth: null, // 0-indexed
    filterCategory: null,
    searchTerm: "",
    expandedId: null
  };

  function fetchPublishedPosts() {
    return fetch("assets/posts.json")
      .then(function (res) { if (!res.ok) throw new Error("no posts file"); return res.json(); })
      .catch(function () { return []; });
  }

  function allPosts() {
    return state.publishedPosts.slice().sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });
  }

  function formatDate(iso) {
    var d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }

  function filteredPosts() {
    return allPosts().filter(function (p) {
      var d = new Date(p.date + "T00:00:00");
      if (state.filterYear !== null && d.getFullYear() !== state.filterYear) return false;
      if (state.filterMonth !== null && d.getMonth() !== state.filterMonth) return false;
      if (state.filterCategory && p.category !== state.filterCategory) return false;
      if (state.searchTerm) {
        var haystack = (p.title + " " + p.excerpt + " " + (p.content || "")).toLowerCase();
        if (haystack.indexOf(state.searchTerm.toLowerCase()) === -1) return false;
      }
      return true;
    });
  }

  function buildArchive() {
    var byYear = {};
    allPosts().forEach(function (p) {
      var d = new Date(p.date + "T00:00:00");
      var y = d.getFullYear(), m = d.getMonth();
      byYear[y] = byYear[y] || {};
      byYear[y][m] = (byYear[y][m] || 0) + 1;
    });
    return byYear;
  }

  function renderArchive() {
    var container = document.getElementById("archiveList");
    container.innerHTML = "";
    var byYear = buildArchive();
    var years = Object.keys(byYear).map(Number).sort(function (a, b) { return b - a; });

    if (!years.length) {
      var p = document.createElement("p");
      p.style.color = "#94A3B8";
      p.style.fontSize = "14px";
      p.textContent = "No posts yet.";
      container.appendChild(p);
      return;
    }

    years.forEach(function (y) {
      var yearWrap = document.createElement("div");
      yearWrap.className = "archive-year";
      var yearLabel = document.createElement("div");
      yearLabel.className = "archive-year-label";
      yearLabel.textContent = y;
      yearWrap.appendChild(yearLabel);

      var months = Object.keys(byYear[y]).map(Number).sort(function (a, b) { return b - a; });
      months.forEach(function (m) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "archive-month-btn";
        if (state.filterYear === y && state.filterMonth === m) btn.classList.add("active");
        var label = document.createElement("span");
        label.textContent = MONTH_NAMES[m];
        var count = document.createElement("span");
        count.className = "archive-count";
        count.textContent = byYear[y][m];
        btn.appendChild(label);
        btn.appendChild(count);
        btn.addEventListener("click", function () {
          if (state.filterYear === y && state.filterMonth === m) {
            state.filterYear = null; state.filterMonth = null;
          } else {
            state.filterYear = y; state.filterMonth = m;
          }
          renderAll();
        });
        yearWrap.appendChild(btn);
      });
      container.appendChild(yearWrap);
    });
  }

  function renderCategories() {
    var container = document.getElementById("categoryList");
    container.innerHTML = "";
    var cats = {};
    allPosts().forEach(function (p) { if (p.category) cats[p.category] = true; });
    Object.keys(cats).sort().forEach(function (c) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "category-pill";
      if (state.filterCategory === c) btn.classList.add("active");
      btn.textContent = c;
      btn.addEventListener("click", function () {
        state.filterCategory = (state.filterCategory === c) ? null : c;
        renderAll();
      });
      container.appendChild(btn);
    });
  }

  function renderList() {
    var listEl = document.getElementById("blogList");
    var posts = filteredPosts();
    listEl.innerHTML = "";

    if (!posts.length) {
      var empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "No posts match your filters yet.";
      listEl.appendChild(empty);
      return;
    }

    posts.forEach(function (p) {
      var card = document.createElement("article");
      card.className = "post-card";
      if (state.expandedId === p.id) card.classList.add("expanded");

      var meta = document.createElement("div");
      meta.className = "post-meta";
      var date = document.createElement("span");
      date.className = "post-date";
      date.textContent = formatDate(p.date);
      meta.appendChild(date);
      if (p.category) {
        var cat = document.createElement("span");
        cat.className = "post-category";
        cat.textContent = p.category;
        meta.appendChild(cat);
      }

      var title = document.createElement("h2");
      title.className = "post-title";
      var titleLink = document.createElement("a");
      titleLink.href = "#" + p.id;
      titleLink.textContent = p.title;
      title.appendChild(titleLink);

      var excerpt = document.createElement("p");
      excerpt.className = "post-excerpt";
      excerpt.textContent = p.excerpt;

      var full = document.createElement("div");
      full.className = "post-full";
      full.textContent = p.content || p.excerpt;

      var readMore = document.createElement("a");
      readMore.href = "#" + p.id;
      readMore.className = "post-readmore";
      readMore.textContent = state.expandedId === p.id ? "Show less \u2191" : "Read more \u2192";
      readMore.addEventListener("click", function (e) {
        e.preventDefault();
        state.expandedId = (state.expandedId === p.id) ? null : p.id;
        renderList();
      });

      card.appendChild(meta);
      card.appendChild(title);
      card.appendChild(excerpt);
      card.appendChild(full);
      card.appendChild(readMore);
      listEl.appendChild(card);
    });
  }

  function renderAll() {
    renderArchive();
    renderCategories();
    renderList();
    var resetBtn = document.getElementById("resetFiltersBtn");
    if (resetBtn) {
      var hasFilter = state.filterYear !== null || state.filterCategory || state.searchTerm;
      resetBtn.style.display = hasFilter ? "inline" : "none";
    }
  }

  function init() {
    var searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", function (e) {
        state.searchTerm = e.target.value;
        renderAll();
      });
    }

    var resetBtn = document.getElementById("resetFiltersBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        state.filterYear = null;
        state.filterMonth = null;
        state.filterCategory = null;
        state.searchTerm = "";
        if (searchInput) searchInput.value = "";
        renderAll();
      });
    }

    fetchPublishedPosts().then(function (posts) {
      state.publishedPosts = posts;
      renderAll();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    try {
      init();
    } catch (err) {
      console.error("blog.js failed to initialize:", err);
      // Still try to load and show posts even if a sidebar control is missing
      fetchPublishedPosts().then(function (posts) {
        state.publishedPosts = posts;
        renderAll();
      });
    }
  });
})();
