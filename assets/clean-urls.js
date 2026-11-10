(function () {
  "use strict";

  // GitHub Pages serves every page at two addresses: /gallery and
  // /gallery.html. Only the clean one is canonical - it is what the menu, the
  // sitemap and every canonical tag point at - so a visit to the .html copy is
  // moved across, leaving one address per page.
  //
  // This runs with the other scripts at the end of the page rather than in
  // <head>, so it never delays the first paint. Every link on the site already
  // uses the clean address, so the redirect is only ever a safety net.
  //
  // Loaded by the content pages only. The error pages (400/403/404/500/503)
  // are excluded on purpose: they must stay on whatever address the visitor
  // asked for.

  var path = window.location.pathname;

  if (!/\.html$/i.test(path)) return;
  if (window.location.protocol === "file:") return;

  // Clean URLs are a GitHub Pages feature. The plain local server in the
  // README only knows /gallery.html, so redirecting there would break every
  // click while previewing; skip the addresses used for local previews.
  var host = window.location.hostname;

  var isLocalPreview =
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "[::1]" ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /\.style\.dev$/i.test(host) ||
    /\.local$/i.test(host);

  if (isLocalPreview) return;

  var clean = path.replace(/\/index\.html$/i, "/").replace(/\.html$/i, "");

  window.location.replace(clean + window.location.search + window.location.hash);
})();
