Put photo files in this folder (assets/gallery/).

Recommended:
- JPG or PNG, reasonably sized for the web (under ~1-2MB each ideally,
  so the gallery page doesn't load slowly on mobile / cellular data).
- Keep filenames lowercase-with-dashes and reasonably descriptive,
  e.g. summer-2026-tournament-01.jpg, tuesday-meeting-june.jpg

After adding a photo file here, you also need to add one entry for it
in assets/gallery.json so it actually shows up on the gallery page.
See the comments inside gallery.json's neighbouring gallery.html file
for the exact format to copy/paste.

Then build its thumbnails:

  npm install --no-save sharp        (first time only)
  node scripts/generate-gallery-thumbs.mjs

That writes two small WebP copies into assets/gallery/thumbs/ - one
480px and one 960px wide. The gallery grid shows those instead of the
full photo, while clicking one still opens the original. Commit the
thumbs folder along with the photo.
