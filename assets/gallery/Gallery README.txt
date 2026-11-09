Put photo files in this folder (assets/gallery/).

Recommended:
- JPG, portrait or landscape, straight off a phone is fine - do not worry
  about resizing it yourself, the optimiser below does that.
- Keep filenames lowercase-with-dashes and reasonably descriptive,
  e.g. summer-2026-tournament-01.jpg, tuesday-meeting-june.jpg

AFTER uploading a photo, run this once from the repository root:

    python3 scripts/optimize-gallery.py

It shrinks every original to at most 1600px on its longest side and writes
the 640px thumbnail the gallery grid loads into assets/gallery/thumbs/.
Phones upload 2-4MB photos; the gallery used to load 38MB because of that.
The script needs Python 3 with Pillow (pip install Pillow). It is safe to
run as often as you like - photos that are already done are skipped.

Commit both assets/gallery/<file> and assets/gallery/thumbs/<file>.
A photo with no thumbnail still appears (the page falls back to the large
file), it just loads slowly for visitors on mobile data.

After adding a photo file here, you also need to add one entry for it
in assets/gallery.json so it actually shows up on the gallery page.
See the comments inside gallery.html for the exact format to copy/paste.
