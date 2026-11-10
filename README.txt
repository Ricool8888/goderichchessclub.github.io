==============================================================================
GODERICH CHESS CLUB - WEBSITE HANDBOOK
goderichchessclub.com
==============================================================================

Repository:    https://github.com/Ricool8888/goderichchessclub.github.io
Live site:     https://goderichchessclub.com   (custom domain - see CNAME)
Who this is for: the club exec / site administrators

-------------------------------------------------------------------------------
WHAT THIS SITE IS
-------------------------------------------------------------------------------

A set of plain HTML pages, one stylesheet (assets/style.css) and a handful of
small JavaScript files. There is no database, no login and no server-side
code. A page either holds its text in the HTML file itself, or builds a list
(events, posts, tournaments, photos) from a JSON file in assets/.

GitHub Pages publishes the repository exactly as it is. Anything committed and
pushed to the "main" branch is live about a minute later. There is no separate
build you run by hand and no staging area, so treat every push to main as
publishing.

Because of that, "editing the site" is always one of three things:

      - editing a page's own HTML          (*.html in the repo root)
      - editing a data file                (assets/*.json)
      - editing the shared header/footer   (partials/*.html)

Everything else in this handbook is detail on those three things.

-------------------------------------------------------------------------------
CONTENTS
-------------------------------------------------------------------------------

      1.  Quick map - where everything lives
      2.  How each page works
      3.  What you edit by hand on a page
      4.  Data files - events, posts, photos, tournaments, banners
      5.  Shared header, footer and scripts
      6.  Automatic steps that run on every push
      7.  Error pages (400, 403, 404, 500, 503)
      8.  Files you rarely see (sitemap, robots, CNAME, and friends)
      9.  Facts that live in more than one place - keep them in sync
      10. Protected wording - do not reword
      11. Common tasks, step by step
      12. Troubleshooting


==============================================================================
1. QUICK MAP
==============================================================================

PAGES (one .html file per page, all in the repo root)

      index.html             Home
      about.html             About Us
      posts-and-news.html    Blog / news posts
      events-calendar.html   Calendar of meetings, events and closures
      tournaments.html       Tournament listings + first-timer guide
      sponsors.html          Sponsors and community supporters
      merch.html             Club merchandise + refund policy
      gallery.html           Photo gallery
      faq.html               Frequently asked questions
      books-for-sale.html    Book price list
      privacy.html           Privacy policy
      accessibility.html     Accessibility statement
      400.html 403.html 404.html 500.html 503.html    Error pages

DATA (the files you edit to change what the site shows)

      assets/banner.json          announcement banners (home + error pages)
      assets/events.json          calendar events that are not tournaments
      assets/meetings.json        the weekly Tuesday/Friday meetings
      assets/closures.json        dates the club is closed
      assets/posts.json           blog posts
      assets/tournaments.json     tournaments (upcoming and completed)
      assets/gallery.json         photo sections and captions
      assets/last-updated.json    GENERATED - never edit by hand

SHARED

      partials/header.html        the menu bar, identical on every page
      partials/footer.html        the footer, identical on every page
      assets/style.css            all styling
      assets/nav.js               mobile menu behaviour
      assets/theme.js             light / dark mode toggle
      assets/share.js             share button in the social row
      assets/last-updated.js      footer date + copyright year
      assets/puzzle-loader.js     starts the puzzle when it is nearly on screen
      assets/puzzle.js            the puzzle board itself
      assets/live-eval.js         the optional engine evaluation bar
      assets/live-game.js         the Live Games panel (Lichess TV)
      assets/map-facade.js        the "Show map" buttons on the home page
      assets/ics.js               builds the .ics files behind "add to calendar"
      assets/calendar.js          draws the Events Calendar page
      assets/vendor/              the two chess libraries the puzzle board uses

BUILD / DEPLOY

      .github/workflows/static.yml    the GitHub Actions deploy
      scripts/*.mjs                   the small Node scripts it runs
      sitemap.xml, robots.txt, CNAME, .nojekyll

FOLDERS OF IMAGES

      assets/logos/       club logos, favicons, app icons
      assets/sponsors/    sponsor logos
      assets/merch/       merch photos
      assets/books/images/  book cover images
      assets/tournaments/ logos used on the tournaments page
      assets/icons/       social media icons
      assets/gallery/     gallery photos (originals, kept as the archive)
      assets/gallery/thumbs/  generated WebP copies the grid and lightbox show
      assets/downloads/   the printable scoresheet PDF


==============================================================================
2. HOW EACH PAGE WORKS
==============================================================================

index.html - Home
      Hero heading and intro, the two meeting cards (Goderich Library on
      Tuesdays, Goderich Legion on Fridays), the mailing list card, the club
      rules list, "Puzzle of the Day" and "Live Games", then the social row.

      - The banner strip at the top comes from assets/banner.json (section 4).
      - The mailing list card embeds a Google Form (forms.gle). Signups are
        collected by Google, not by the site, so the member list lives in the
        Google account that owns the form.
      - Puzzle of the Day loads the public Lichess puzzle API and is played on
        chessground; Live Games embeds Lichess TV with a Stockfish evaluation
        bar. Both need an internet connection. The board libraries and their
        stylesheets now ship with the site (assets/vendor/), so the puzzle no
        longer depends on a third-party CDN; if Lichess itself cannot be
        reached, the puzzle says so and offers a link rather than sitting on
        "Loading". Live Games and the evaluation bar are the only parts that
        still fetch from outside (Lichess and cdnjs), and both wait for a
        click before they do.
      - The page <head> carries three structured-data blocks: a
        "SportsActivityLocation" one (hand-written - its address and venue
        list have to be updated by hand, section 9), an "Organization" one
        (also hand-written), and a recurring-meeting one built from
        assets/meetings.json on every deploy, so the Tuesday and Friday nights
        Google reads cannot drift from the calendar.
      - The page <head> also carries the social preview tags. They are
        generated, not hand-written: og:title, og:description and og:url come
        from the page's own <title>, description and canonical link (section
        5).

about.html - About Us
      What We Offer, Mandate, Vision Statement, and one profile card per board
      member (President, Vice-President, Treasurer). Profiles are ordinary
      HTML: name, role and a short paragraph.

posts-and-news.html - Posts / News
      Every post is written into the page from assets/posts.json by
      scripts/render-posts.mjs during deploy, so each one has its own address
      (#post-id), is readable with JavaScript off, and is listed in the page's
      BlogPosting structured data. assets/blog.js adds the search box, the
      category and month filters and the "Read more" buttons on top. Visitors
      cannot submit posts; publishing means editing the JSON.

events-calendar.html - Events Calendar
      Month grid plus a list view (a visitor's last choice is remembered).
      Recurring Tuesday/Friday meetings come from assets/meetings.json and are
      drawn by assets/calendar.js; tournaments come from
      assets/tournaments.json (the same file that writes
      the tournament cards, so a date is only typed once), any other event
      comes from assets/events.json, and closures come from
      assets/closures.json. Clicking a day opens its details; there are
      "add to calendar" buttons that generate .ics files in the browser.
      Below the calendar is a short info paragraph and a link to the
      registration form.

tournaments.html - Tournaments
      Three tabs: Upcoming, Completed, and a first-timer guide (joining the
      CFC, registering, rules, notation, penalties). The cards in the first two
      tabs are written into the page from assets/tournaments.json by
      scripts/render-tournaments.mjs during deploy, so they are in the HTML and
      do not need JavaScript; assets/tournaments.js only switches tabs. The
      guide text and the scoresheet download link are written in the HTML.

sponsors.html - Sponsors
      One card per sponsor: logo, name, description, "Visit website" link.
      Then a "Community Supporters" section, which is deliberately plainer -
      names only, no cards and no photos - followed by "Become a Sponsor".

merch.html - Merch
      One card per item: photo, name, description. Then "Interested in
      Ordering?" and the refund policy. Orders arrive by email, so there is
      nothing to update on the site when stock changes.

gallery.html - Gallery
      Photos grouped into sections, written into the page from
      assets/gallery.json by scripts/render-gallery.mjs during deploy. Each
      section gets its own heading and a row of photos. The grid shows the
      small WebP copies and loads them lazily, so a large gallery does not slow
      the page down. assets/gallery.js adds the fade-in as photos scroll into
      view and the lightbox, which opens the 1600 px WebP rather than the
      multi-megabyte camera original.

faq.html - FAQ
      Nineteen collapsible question/answer pairs written directly in the HTML.
      The page <head> also carries a "FAQPage" structured-data block that is
      regenerated from those same pairs during deploy, so the two cannot drift.

books-for-sale.html - Books for sale
      A hand-written price table: title, author, description, price. Hovering
      a row previews the cover; clicking the title opens the cover larger.
      Covers are looked up by name, so the image file must match the title
      exactly (see section 11).

privacy.html - Privacy policy
      Policy text with its own version line near the top:
      "Last updated: November 10, 2026 - Version #5". That line is written by
      hand and is separate from the generated footer date. Bump it whenever the
      policy text changes. The policy is protected wording (section 10), so
      any edit to it needs the exec's approval first.

accessibility.html - Accessibility statement
      What the site aims for (WCAG 2.2 AA), what it does, the known
      limitations, and how to report a barrier. Update the "Last reviewed" line
      when you re-check it.

Error pages - see section 7.


==============================================================================
3. WHAT YOU EDIT BY HAND ON A PAGE
==============================================================================

Most changes are just editing text in the .html file and committing. The
things worth knowing before you do:

      Page headings, paragraphs, lists, cards
            Edit the HTML directly. Keep the existing elements and class
            names - assets/style.css is written around them, and several
            scripts look for specific ids and classes.

      A whole new page
            1. Copy an existing page as a starting point.
            2. Set its <title>, meta description and canonical URL, then copy
               the two lines
                     <!-- social-preview:start -->
                     <!-- social-preview:end -->
               in after the canonical link. The sync script fills that block
               from the title, description and canonical you just set.
            3. Put a placeholder <header> / <footer> in it (copy from any
               page) and run the sync script - it fills in the real ones.
               (It also fills the preview tags, in the same run.)
            4. Add the page to the NAV_HREF map in
               scripts/sync-shared-blocks.mjs so its menu link is marked
               active, and to partials/header.html if it belongs in the menu.
            5. Nothing else. sitemap.xml is rebuilt from the pages in the
               repository on the next deploy (section 8).

      The menu bar or footer
            Never hand-edit these in a page; they are generated. See
            section 5.

      The social preview tags (og:title, twitter:image and friends)
            Also generated - from the page's own title, description and
            canonical link. Edit those instead. See section 5.

      Meeting days, times or addresses
            They appear in several places. See section 9 before changing them.

      The contact email
            It appears in the header "Contact Us" button, the footer, every
            page body, the home-page structured data, and some mailto links
            with a preset subject (merch and refund enquiries). Search the repo
            for goderichchessclub@gmail.com rather than editing page by page.

      Social media links
            The home page social row and the footer "Affiliated Platforms"
            line, plus the sameAs list in the home-page structured data.

      Copyright year
            Automatic. assets/last-updated.js writes the current year into the
            footer, so the HTML only holds a fallback.

      Footer "Last updated" date
            Automatic, from git history, written by a deploy script. Never set
            it by hand - editing the page is what changes it.


==============================================================================
4. DATA FILES - CHANGING EVENTS, POSTS, PHOTOS, TOURNAMENTS, BANNERS
==============================================================================

These files are JSON. Two rules cover almost every mistake:

      - Text must be inside "double quotes".
      - Every entry needs a comma after it except the last one in a list.

If a page goes blank or stops showing items after an edit, a missing or extra
comma is the usual cause. Paste the file into jsonlint.com to find it. Commit
the fix; there is nothing to rebuild.

-------------------------------------------------------------------------------
4.1 assets/banner.json - announcement banners
-------------------------------------------------------------------------------
The coloured strip at the top of the home page and the error pages.
Currently an array, and every entry in it is displayed:

      [
        {
          "enabled": true,
          "id": "banner-winter-rapid",
          "style": "urgent",
          "message": "Goderich Winter Rapid registration closes in:",
          "linkText": "Tournament Details",
          "linkUrl": "tournaments",
          "countdown": { "enabled": true, "deadlineUTC": "2027-01-16T02:00:00Z" }
        }
      ]

      enabled       false hides a banner without deleting it.
      style         "urgent" (red) or "info" (neutral).
      message       the sentence shown.
      linkText/linkUrl   optional button; linkUrl is a page name such as
                         "tournaments", or a full https:// address.
      countdown     optional. deadlineUTC is a UTC timestamp; when it passes the
                    banner hides itself automatically. That is why old event
                    banners can be left in the file - they stop showing on
                    their own. Do not delete past entries; there is no need,
                    and past-date banners are kept as a record.

To show a new banner, add another object to the array with a new "id". To
retire one immediately, set "enabled": false.

-------------------------------------------------------------------------------
4.2 assets/events.json - events that are not tournaments
-------------------------------------------------------------------------------
Calendar events that are not a regular Tuesday/Friday meeting and not a
tournament - a simul, a guest speaker, a club social. Tournaments belong in
assets/tournaments.json (section 4.5) and appear on the calendar from there, so
they are never typed twice.

      [
        {
          "id": "evt-2027-01-16-tourney",
          "date": "2027-01-16",
          "time": "9:00 AM - 4:00 PM",
          "title": "Goderich Winter Rapid",
          "description": "Location: ... \n \n Time Control: ..."
        }
      ]

      date          YYYY-MM-DD, in the local (Eastern) calendar.
      time          free text shown next to the title.
      description   use "\n \n" for a blank line between paragraphs, as the
                    existing entries do. Long event details work fine here.

Events stay on the calendar for past dates too; that is how the club's history
stays browsable. Delete an entry only if it was added by mistake.

-------------------------------------------------------------------------------
4.3 assets/closures.json - nights the club is closed
-------------------------------------------------------------------------------
      {
        "updated": "2026-11-08",
        "closures": [
          { "date": "2026-11-27", "reason": "Club closed" }
        ]
      }

Add one object per closed date. That day's weekly meeting disappears from the
calendar and the day is shown with the reason instead. Update "updated" to the
day you changed the file. Keep the dates sorted - it is easier to scan.

-------------------------------------------------------------------------------
4.4 assets/posts.json - blog posts
-------------------------------------------------------------------------------
      [
        {
          "id": "post-2026-11-04-holiday-closures",
          "date": "2026-11-04",
          "title": "Holiday closures",
          "category": "Club Update",
          "excerpt": "One or two sentences for the list view.",
          "content": "The full post.\n\nUse \n\n for a paragraph break."
        }
      ]

      - Newest date first; the page builds the month archive from "date".
      - "category" is free text but reuses existing values in the filter
        ("Announcement", "Club Update"). A brand-new category simply adds a new
        filter button.
      - "excerpt" shows in the list; "content" shows when the post is opened.
      - "id" must be unique - any unique string works.

-------------------------------------------------------------------------------
4.5 assets/tournaments.json - tournaments
-------------------------------------------------------------------------------
Drives the Tournaments page tabs, the Events Calendar and the event information
search engines read. One object per tournament:

      id, status, date, endDate, time, title, format, location, entryFee,
      description, resultsUrl, extraLinks

      status        "upcoming" or "completed" - decides which tab it lands in.
      date/endDate  YYYY-MM-DD. A one-day event repeats the same date.
      time          e.g. "9:00 AM - 4:00 PM". Shown on the card, on the Events
                    Calendar, and used by the card's Add to Calendar button.
      format        short line, e.g. "5 rounds . Swiss . 15+10 rapid".
      location      "Venue Name - Street, City, ON POSTAL" - the venue name and
                    address are split on the " - " to build structured data,
                    so keep that separator.
      entryFee      short line shown with the details.
      description   the long text. Basic **bold** markers are supported, and
                    "\n" starts a new line.
      resultsUrl    link to chess-results (or "TBD" while pending).
      extraLinks    optional list of { "label": ..., "url": ... } buttons such
                    as "Join the CFC" and "Register / Inquire".

When a tournament finishes, change "status" to "completed" and add the
resultsUrl. Nothing else needs to change.

-------------------------------------------------------------------------------
4.6 assets/gallery.json - photos
-------------------------------------------------------------------------------
A list of sections; each section has a title and its own list of photos:

      [
        {
          "id": "section-002",
          "title": "Goderich Beachside Rapid",
          "photos": [
            {
              "id": "photo-001",
              "filename": "IMG-20260905-WA0019.jpg",
              "caption": "Shown under the photo and in the lightbox",
              "alt": "Plain-language description for screen readers"
            }
          ]
        }
      ]

To add a photo you must do BOTH steps, plus a third one for the thumbnails:

      1. Put the image file in assets/gallery/ - keep it at 1-2 MB at most,
         JPG or PNG, and keep the filename exact (capitalisation matters).
      2. Add an entry for it in assets/gallery.json.
      3. Run:  node scripts/generate-gallery-thumbs.mjs
         (first time only: npm install --no-save sharp)

      - "id" values only need to be unique; numbering can keep counting up.
      - "caption" may be "" if you do not want one.
      - "alt" describes the photo for visually impaired visitors and for
        search engines; a few words is enough.
      - To add a section, copy a whole { id, title, photos } block.

Step 3 writes three WebP copies of each photo into assets/gallery/thumbs/:
480 px and 960 px for the grid, and a 1600 px copy that the lightbox opens. The
grid shows the small ones instead of the originals, which is what keeps the page
light: a 3 MB camera photo becomes a ~20 KB tile and a ~200 KB lightbox image
instead of the 3 MB original. The copies are committed with the photos, so the
published site never needs sharp.

The check in section 6 fails if a photo is missing its thumbnails, so it is not
possible to forget this step without noticing.

Nothing has to be copied into gallery.html: the photo cards there are written
from this file on every deploy (section 6, step 8), between the
<!-- gallery:start ... --> markers. Editing those cards by hand only lasts
until the next deploy.

There is a short reminder of all this in assets/gallery/Gallery README.txt,
next to the photos.

-------------------------------------------------------------------------------
4.7 assets/books/descriptions.json - the book descriptions
-------------------------------------------------------------------------------
A title -> description map for the books, and the only place the blurbs are
written. The description column of the table in books-for-sale.html is
generated from this file by:

      node scripts/generate-books-table.mjs

The key must match the book's title cell in the table exactly - "Checkmate",
not "Checkmate!" - and a \n in a description starts a new paragraph. The script
stops with a clear message if a book has no description, or a description is
left over with no book.

The deploy workflow runs the script, and the validate workflow runs it with
--check, so editing a description in only one place fails the check instead of
silently drifting. Never edit the generated cells by hand.

-------------------------------------------------------------------------------
4.8 assets/last-updated.json - generated, do not edit
-------------------------------------------------------------------------------
Written by a deploy script from git history and git-ignored, so it only exists
in the deployed copy. Hand edits are pointless: the next push overwrites it.


==============================================================================
5. SHARED HEADER, FOOTER AND SCRIPTS
==============================================================================

HEADER AND FOOTER

      The menu bar and the footer are identical on all 17 pages. They are kept
      in two files - partials/header.html and partials/footer.html - and copied
      into each page by a script.

      To change the menu or footer:

            1. Edit partials/header.html or partials/footer.html.
            2. Run:  node scripts/sync-shared-blocks.mjs
            3. Commit the partial and every page it reports as updated.

      The script also marks the current page's menu link as active, and it
      knows which page is which from the NAV_HREF map inside it. Error pages
      are not in that map, so they highlight nothing - which is correct.

      Do not hand-edit a header or footer in a page: the deploy workflow runs
      the same script with --check and fails the deploy if any page has
      drifted. If it fails, run the script without --check, commit, push again.

      `node scripts/sync-shared-blocks.mjs --check` is safe to run any time to
      see whether the pages agree with the partials.

SOCIAL PREVIEW TAGS

      The tags that decide what a link to a page looks like in Facebook,
      Messenger, WhatsApp, Slack, X or LinkedIn live in the <head> of every
      page, between two markers:

            <!-- social-preview:start ... -->
            ...
            <!-- social-preview:end -->

      They are generated, not typed: og:title, og:description and og:url are
      copied from that page's own <title>, <meta name="description"> and
      <link rel="canonical">, so a page states its title once. The share image
      is the club logo, and its size (196 x 292) is stated in the tags so
      Facebook and Twitter lay the card out correctly.

      To change what a page says when it is shared, edit its <title> or
      description - never the tags between the markers. Then run:

            node scripts/sync-shared-blocks.mjs

      The same script writes both, so one command keeps the header, the footer
      and the preview tags in step.

      The five error pages have no preview tags on purpose: they have no
      canonical address and are marked noindex.

      The share image is portrait, which is why twitter:card says "summary"
      rather than "summary_large_image". A landscape 1200x630 image would suit
      the large card better; if one is ever made, change the image path, the
      width, the height and the alt text in the SOCIAL map at the top of
      scripts/sync-shared-blocks.mjs, then re-run it.

SHARED SCRIPTS (assets/)

      nav.js            Mobile menu: the hamburger opens it, Escape closes it
                        and returns focus to the button, a click outside closes
                        it. Included by every page.
      clean-urls.js     Sends /page.html to /page, so each page has one address.
                        Loaded at the end of the content pages (so it never
                        delays the first paint), never by the error pages.
      theme.js          Light/dark switch in the footer. The choice is saved in
                        the visitor's browser, not on the site.
      share.js          The share button: device share sheet where available,
                        otherwise Facebook / X / copy link.
      last-updated.js   Writes the copyright year and the footer date.
      style.css         Every style used on the site, including the mobile
                        and dark-mode rules. Page-specific blocks are commented.
      ics.js            Builds the .ics file behind an "add to calendar"
                        button. Times carry the America/Toronto zone and its
                        daylight-saving rules, so an imported meeting lands at
                        the right hour on a phone set to any time zone.
      calendar.js       Draws the Events Calendar page from
                        assets/meetings.json, tournaments.json, events.json
                        and closures.json.
      banner.js         Shows the announcement strip written into the page
                        from assets/banner.json.
      puzzle-loader.js  Waits until the puzzle is nearly on screen, loads the
                        board, and gives up with a message if it cannot.
      puzzle.js         The puzzle board itself (chessground + chess.js).
      live-eval.js      The optional Stockfish evaluation bar. Downloads the
                        engine from cdnjs only after a click.
      live-game.js      The Live Games panel. Loads the Lichess TV frame only
                        after a click.
      map-facade.js     Turns the two meeting maps into "Show map" buttons, so
                        Google Maps is not contacted until asked.
      blog.js  faq.js  gallery.js  tournaments.js  books.js
                        Search, filters, collapsibles, the lightbox and the
                        tabs on those pages.

      assets/vendor/ holds two third-party libraries (chessground, chess.js)
      and their stylesheets. They are served from the site instead of a CDN,
      so the puzzle works even if that CDN is blocked. Do not edit them; the
      README.txt inside that folder says how to update them.

      These are shared, so a change here affects every page. Test on a phone
      width and in both themes before pushing.


==============================================================================
6. AUTOMATIC STEPS THAT RUN ON EVERY PUSH
==============================================================================

.github/workflows/static.yml deploys the site. It runs when something is
pushed to main (or when someone starts it from the Actions tab). Its first job
is the same set of checks a pull request runs (validate.yml), and the deploy job
waits for it, so a page that fails validation is never published. After the
checks pass it does this in order:

      1. Check out the repository, with full history (the footer dates need it).
      2. Check the shared header, footer and preview tags
             node scripts/sync-shared-blocks.mjs --check
         Fails the deploy if a page's header, footer or social preview tags
         differ from what partials/ and the page's own title say.
      3. Stamp the footer dates and rebuild the sitemap
             node scripts/stamp-last-updated.mjs
         Writes assets/last-updated.json from the commit that last touched each
         page, and rebuilds sitemap.xml from the pages in the repository with
         the same dates.
      4. Generate event structured data
             node scripts/generate-event-schema.mjs
         Rebuilds the Event block in events-calendar.html's <head> from
         assets/tournaments.json and assets/events.json.
      5. Generate FAQ structured data
             node scripts/generate-faq-schema.mjs
         Rebuilds the FAQPage block in faq.html's <head> from the page's own
         question/answer markup.
      6. Generate recurring-meeting structured data
             node scripts/generate-meeting-schema.mjs
         Rebuilds the weekly Tuesday and Friday Event blocks in index.html's
         <head> from assets/meetings.json, with the club closures carried as
         exception dates.
      7. Rebuild the book descriptions
             node scripts/generate-books-table.mjs
         Copies assets/books/descriptions.json into the description column of
         the table in books-for-sale.html (section 4.7).
      8. Rebuild the tournament cards
             node scripts/render-tournaments.mjs
         Writes assets/tournaments.json into the two lists in tournaments.html,
         between the <!-- tournaments:start ... --> markers.
      9. Rebuild the photo gallery
             node scripts/render-gallery.mjs
         Writes the sections and photo cards of assets/gallery.json into
         gallery.html, between the <!-- gallery:start ... --> markers.
      10. Rebuild the posts
             node scripts/render-posts.mjs
         Writes assets/posts.json into posts-and-news.html, between the
         <!-- posts:start ... --> markers, and their BlogPosting structured
         data between the post-schema markers.
      11. Rebuild the announcement banner
             node scripts/render-banner.mjs
         Writes assets/banner.json into index.html, between the banner markers.
      12. Check the data files
             node scripts/check-data.mjs
         Reads every JSON file the site is built from and fails the deploy on a
         missing photo file, a missing thumbnail, an impossible date, a
         duplicated id or a closure that falls on a day the club does not meet.
      13. Build the published site
             node scripts/build-site.mjs
         Copies the pages, assets/ and the root files a browser needs into
         dist/, and that folder is what gets uploaded. The handbook, the build
         scripts, the partials and the 39 MB of camera originals in
         assets/gallery/ stay in the repository but are no longer published.
         The script fails rather than upload a site with a file missing.
      14. Upload dist/ and deploy it to GitHub Pages.

Steps 3-12 edit files in the deploy copy only - they do not commit anything, so
the repository keeps its hand-written state. Step 13 only writes dist/. That
also means you never need to run any of them by hand, and you should not run
them before committing: the dates would be wrong.

The "structured data" blocks are what Google reads to show rich results.
Three of them are generated at deploy time and wrapped in HTML comment markers:

      faq.html
            <!-- faq-schema:start ... -->  ...  <!-- faq-schema:end -->
      events-calendar.html
            <!-- event-schema:start ... --> ...  <!-- event-schema:end -->
      index.html
            <!-- meetings-schema:start ... --> ... <!-- meetings-schema:end -->

Editing inside those markers is pointless - the next deploy overwrites it.
Editing the visible questions/answers, or the tournaments and events data, is
exactly the right way to change what ends up there.

The tournament lists, the photo gallery and the posts work the same way, with
markers of their own:

      tournaments.html
            <!-- tournaments:start ... --> ... <!-- tournaments:end -->
      gallery.html
            <!-- gallery:start ... --> ... <!-- gallery:end -->
      posts-and-news.html
            <!-- posts:start ... --> ... <!-- posts:end -->
            <!-- post-schema:start ... --> ... <!-- post-schema:end -->

They are filled from assets/tournaments.json, assets/gallery.json and
assets/posts.json on every deploy (section 6, steps 7 to 9), so edit the JSON,
not the cards.

The other two blocks in index.html's <head> - "SportsActivityLocation" and
"Organization" - are hand-written, so their addresses, venue list and social
links have to be updated by hand (see section 9).

CHECKS THAT RUN ON PULL REQUESTS AND BEFORE EVERY DEPLOY

.github/workflows/validate.yml runs on every pull request, and static.yml calls
the same workflow as its first job. It catches the mistakes that a browser
quietly forgives:

      1. Run the repository checks
             node scripts/check-all.mjs
         One script holding one list: the shared header, footer and preview
         tags; the data files; the weekly meeting details against the pages
         that state them in prose; the generated book, tournament, gallery,
         post and banner blocks; the event, FAQ and meeting structured data;
         and the syntax of every script in assets/. It runs them all and
         reports every failure, rather than stopping at the first, so one push
         shows all of the problems.
      2. Validate HTML
             npx --yes html-validate@9.7.1 '*.html'
         Reports malformed markup such as a list nested inside a <p>, a button
         with no type, or an aria attribute on an element that cannot take it.
         Rules live in .htmlvalidate.json.
      3. Check internal links
             lychee --config .lychee.toml '*.html'
         Reports a link to a page or #anchor that does not exist. Settings live
         in .lychee.toml; external sites are deliberately not checked, because
         a sponsor's website being down is not the club's problem.

The two tools are downloaded by the workflow, so the repository still has no
package.json and nothing to install for a normal content edit. (The gallery
thumbnail step is the one exception: it needs sharp, installed ad hoc and never
committed.) To run them before pushing:

      npx --yes html-validate@9.7.1 '*.html'
      lychee --config .lychee.toml '*.html'

RUNNING THE SITE LOCALLY

      Any static server works; serve from the repository root, because every
      path in the site is relative:

            python3 -m http.server 3000        then open localhost:3000

      Opening the .html files straight from disk is not enough - the calendar,
      gallery, posts and tournaments pages all fetch JSON, which browsers block
      on file:// addresses. The footer date also stays hidden without a server.

NODE

      The scripts need Node 18 or newer. Nothing needs installing - they use
      only Node's built-in modules.


==============================================================================
7. ERROR PAGES
==============================================================================

Five pages, all in the site's own style with the normal header, footer, banner
and theme switch, each with a chess joke heading, a short explanation and
buttons back to the main pages. They are marked noindex so search engines do
not list them.

      400.html   "That wasn't a legal move."
                 Bad request - the address the server received was malformed.
      403.html   "This square is off-limits."
                 Forbidden - the visitor is not allowed to view that resource.
      404.html   "This move isn't in the book."
                 Not found - the page does not exist, was moved, or a link is
                 broken. This is the one visitors actually see.
      500.html   "We've blundered somewhere."
                 Server error - something failed on the server's side.
      503.html   "Taking a short break."
                 Service unavailable - usually maintenance or an overload.

Worth knowing:

      - GitHub Pages only substitutes its own 404.html for missing pages. It
        cannot produce 400/403/500/503 responses, so those four files are not
        served automatically here; they are kept for a future host that does
        support custom error documents, and can be viewed directly at
        /400.html, /403.html and so on.
      - 404.html is published as-is and is used for any bad address on the
        domain, so a broken link shows it within a second of someone clicking.
      - All five share the standard header, footer, banner and theme switch.
        If you change the menu you do not need to touch them by hand - the sync
        script covers them.
      - Their links are root-absolute (/about, /assets/style.css) rather than
        relative, because 404.html is served at whatever address the visitor
        mistyped: on /nope/deep/path a relative "assets/style.css" would ask for
        /nope/deep/assets/style.css. The sync script writes the header and
        footer that way for these five pages only; the other pages keep
        relative links.
      - Pages are not in sitemap.xml on purpose.


==============================================================================
8. FILES YOU RARELY SEE
==============================================================================

sitemap.xml
      The list of the site's real pages and their last-modified dates, used by
      search engines. It is rebuilt on every deploy from the .html files in the
      repository, one entry per page with the date of the last commit that
      touched it, so adding a page is enough - do not edit this file by hand.
      The five error pages are excluded on purpose.

robots.txt
      Tells crawlers they may index everything, and points them at the
      sitemap. Nothing to maintain unless the site should stop being indexed.

CNAME
      One line - goderichchessclub.com - telling GitHub Pages which custom
      domain serves this repository. Do not delete or rename it: the site would
      fall back to the github.io address. DNS for the domain is managed at the
      registrar, not in this repository.

.nojekyll
      An empty file. It tells GitHub Pages to publish the files exactly as they
      are instead of running them through Jekyll, which would ignore some files
      and folders. Leave it alone.

.github/workflows/static.yml
      The deploy workflow described in section 6. Edit it only to add or
      reorder build steps; a broken workflow means the site stops updating.

favicon.ico and assets/logos/
      favicon.ico sits in the root because some browsers request it by name.
      The PNG icons (favicon-192.png, apple-touch-icon.png) and the two club
      logos also live in assets/logos/. Every page links to them in its <head>.

assets/vendor/
      Two open-source chess libraries (chessground 9.2.1, GPL-3.0-or-later, and
      chess.js 1.4.0, BSD-2-Clause) plus three chessground stylesheets, served
      from this site so the home page's puzzle board does not depend on a
      third-party CDN. The files are unmodified except that the trailing
      source-map comment was removed. Do not edit them: the README.txt in that
      folder lists the upstream links and the steps for updating them.

goderich-chess.vcf
      A downloadable contact card (name, email, website, address) so a visitor
      can save the club to their phone in one tap. It powers the "Save contact"
      button in the home-page hero. Edit the text inside it if contact details
      change, and keep the filename - the button links to it by name.

assets/downloads/goderich-chess-club-scoresheet.pdf
      The printable scoresheet linked from the Tournaments page. Replace the
      file to update it; keep the filename so the link keeps working.

assets/gallery/Gallery README.txt
      A short note for whoever adds photos, sitting next to the images.

freebuff-sites-build/
      Output from the editor tooling used to maintain the site (assets,
      worker.js, manifest.json, a build log). It is git-ignored, is not part of
      the published site, and can be regenerated - do not edit it and do not
      commit it.

.gitignore
      Lists what git should not track: local server folders, that build
      output, dist/, and assets/last-updated.json (generated at deploy time).

dist/
      Made by node scripts/build-site.mjs and uploaded to GitHub Pages. It is
      rebuilt from scratch on every deploy and is never committed. To see
      exactly what the public gets, run that script and look in dist/.

WHAT IS NOT PUBLISHED
      README.txt, scripts/, partials/, .github/, artifacts/, the
      freebuff-sites-build/ output, the note inside assets/gallery/, and the
      camera originals in assets/gallery/ (39 MB - the grid, the lightbox and
      the pages all use the WebP copies in assets/gallery/thumbs/). They stay
      in the repository; they are simply not part of the site. build-site.mjs
      fails if one of them ends up in dist/, or if a page or asset it expects
      is missing.


==============================================================================
9. FACTS THAT LIVE IN MORE THAN ONE PLACE
==============================================================================

A static site has no single source of truth for text, so a few facts are
repeated. When one of them changes, update all the copies or the site will
contradict itself.

MEETING DAYS, TIMES AND ADDRESSES
      assets/meetings.json is the single copy of the weekly meetings. The
      calendar, the two "add to calendar" buttons, the .ics files and the
      recurring-meeting structured data are all built from it. Change these
      together:
            - assets/meetings.json - one object per meeting. dayOfWeek is
              0 = Sunday ... 6 = Saturday; start and end are "HH:MM" on the
              24-hour clock; time is how it is printed on the calendar
              ("6:00 PM - 8:00 PM"); venueName, location (one line, the way a
              calendar app should show it), address, description, firstDate
              (the first night that meeting happens) and calendarStartDate
              (the first night the calendar shows it, or null)
            - index.html - the hero sentence and the two meeting cards
            - index.html - the hand-written structured-data blocks in the
              <head>: the "SportsActivityLocation" address and "location"
              list, and the "Organization" address
            - faq.html - the "Where is the chess club located?" and "When does
              the club meet?" answers
            - about.html and privacy.html if they mention the schedule
            - the Friday meeting only exists from its calendarStartDate
              (2026-07-24); leave that as is unless the club's history there
              changes.

      node scripts/check-meetings.mjs reads the time ranges out of index.html
      and faq.html and fails if they no longer match meetings.json, so a change
      made in one place and not the other is caught before it ships. It never
      edits those pages - they are protected wording (section 10).

CONTACT EMAIL
      Header "Contact Us", footer, page bodies, mailto links with preset
      subjects (merch and refund enquiries), the home-page structured data, and
      the tournament descriptions in assets/tournaments.json.

TOURNAMENT DETAILS
      assets/tournaments.json drives the Tournaments page tabs, the Events
      Calendar and the calendar structured data - a date, venue or title is
      typed once. Adding a tournament means one entry in that file, plus a
      banner in assets/banner.json if you want one counting down.
      assets/events.json is only for calendar events that are not tournaments.

CLOSURES
      assets/closures.json is the only place the calendar looks, but a closure
      is usually also worth a post in assets/posts.json - that is what members
      read.

PRIVACY POLICY VERSION
      privacy.html carries its own "Last updated ... Version #N" line. Update
      it by hand whenever the policy text changes. It is separate from the
      generated footer date and should not be deleted. The current policy is
      Version #5.

PRIVACY POLICY AND THE PUZZLE LIBRARIES - NEEDS AN EXEC DECISION
      The policy says the puzzle board's two libraries are loaded "from the
      jsDelivr content network" and that jsDelivr may record a visitor's IP
      address. Since those libraries now ship from assets/vendor/, the site
      never contacts jsDelivr. The sentence is out of date but it is protected
      wording (section 10), so it has been left alone. Nothing in it is untrue
      in a way that misleads - the site now does less than the policy says -
      but it should be amended when the exec is next reviewing the policy.


==============================================================================
10. PROTECTED WORDING - DO NOT REWORD
==============================================================================

Some text on this site is approved wording - legal, official or otherwise
sensitive. Keep it exactly as written, and do not "improve" it while doing
unrelated work (including with automated tools or AI assistants). Formatting
and layout around it can change; the words cannot.

      Index page
            - Intro paragraphs
            - Addresses of Goderich Library and Goderich Legion
            - Mailing list card
            - Club rules

      About Us page
            - Mandate
            - Vision Statement
            - Person profiles (board of directors)

      Posts / news page
            - The Legion partnership announcement post

      Events calendar page
            - Info paragraph

      Tournaments page
            - Info paragraph
            - The rules / first-timer guide text

      Sponsors page
            - Info paragraph
            - Each sponsor's description
            - Community supporters stay name-only: no card, no photo

      Merch page
            - Info paragraph
            - Each merch item's description
            - Refund policy

      FAQ page
            - Every answer

      Books for sale page
            - Book titles, authors and prices

      Privacy page
            - The whole policy, including its version line

      Gallery page
            - Photo captions and alt text (they describe real people)

If a change seems to require touching any of the above, raise it with the exec
first rather than editing it.


==============================================================================
11. COMMON TASKS, STEP BY STEP
==============================================================================

ADD A BLOG POST
      1. Add an object to the top of assets/posts.json.
      2. Commit and push.

ADD A SPECIAL EVENT TO THE CALENDAR
      1. Add it to assets/events.json.
      2. Optionally add its date to assets/tournaments.json (section 9).
      3. Optionally add a banner with a countdown to assets/banner.json.
      4. Commit and push.

CLOSE THE CLUB ON A DATE
      1. Add the date to assets/closures.json and update "updated".
      2. Optionally write a post so members see it.
      3. Commit and push.

ADD A TOURNAMENT
      1. Add it to assets/tournaments.json with "status": "upcoming".
         (Nothing to add to tournaments.html - the card is written from this
         file on the next deploy.)
      2. Add a matching entry to assets/events.json so it appears on the
         calendar.
      3. Optionally add a banner with the registration deadline.
      4. Commit and push. When it is over, flip "status" to "completed" and
         fill in resultsUrl.

ADD A PHOTO TO THE GALLERY
      1. Put the file in assets/gallery/ (under 1-2 MB).
      2. Add its entry to assets/gallery.json, filename matching exactly.
      3. Run:  node scripts/generate-gallery-thumbs.mjs
         (first time only: npm install --no-save sharp)
      4. Commit the photo, the JSON entry and the new files in
         assets/gallery/thumbs/. Push.

ADD A BOOK
      1. Add a <tr> row to the table in books-for-sale.html with its title,
         author and price. Leave the description cell empty - it is generated.
      2. Add the description to assets/books/descriptions.json, keyed by the
         title exactly as written in the table.
      3. Run:  node scripts/generate-books-table.mjs
      4. Put its cover in assets/books/images/ named exactly "<Title>.jpg" -
         for example "Checkmate.jpg" for the row titled Checkmate. Watch
         apostrophes and punctuation; they must match the title character for
         character.
      5. Commit and push.

CHANGE A MEETING'S DAY OR TIME
      1. Edit assets/meetings.json (the fields are described in section 9).
      2. Run:  node scripts/generate-meeting-schema.mjs
      3. Update the hero sentence and the meeting cards in index.html, and the
         two answers in faq.html. Those three are protected wording: raise the
         wording change with the exec.
      4. Run:  node scripts/check-meetings.mjs   (it should pass)
      5. Commit and push.

CHANGE THE MENU
      1. Edit partials/header.html.
      2. Run:  node scripts/sync-shared-blocks.mjs
      3. Commit the partial and the pages it lists. Push.

CHANGE A SPONSOR
      1. Edit the card in sponsors.html.
      2. Put the logo in assets/sponsors/ and point the <img> at it.
      3. Commit and push.

CHANGE THEME COLOURS OR LAYOUT
      Everything is in assets/style.css. Check the result on a narrow window
      (phone menu) and in dark mode, then commit.


==============================================================================
12. TROUBLESHOOTING
==============================================================================

A data page is empty, or stops after a few items
      Almost always JSON: a missing comma, a stray comma before a closing
      bracket, or an unescaped " inside text. Run the file through
      jsonlint.com, fix, commit.

A photo or logo does not appear
      Filename mismatch. GitHub Pages is case-sensitive: "Photo.JPG" is not
      "photo.jpg". Check the path and the exact spelling, and that the file was
      actually committed.

The deploy fails with "page(s) differ from partials"
      A page's header or footer was edited by hand. Run
      node scripts/sync-shared-blocks.mjs, commit, push again.

The checks fail with "does not mention the Tuesday ... meeting"
      assets/meetings.json and the wording on index.html or faq.html have
      drifted apart. Decide which one is right. If the JSON is wrong, fix it.
      If the pages are wrong, they are protected wording: ask the exec before
      changing them. node scripts/check-meetings.mjs shows both sides.

A page or file 404s after a deploy, but it is in the repository
      The deploy now uploads dist/, built by node scripts/build-site.mjs. If a
      file was added in a new top-level folder or with a new extension, or a
      new page was added, run that script and check the file appears in dist/.
      The script already fails on a missing page, a missing asset or something
      that must not be published, so a 404 usually means the browser is asking
      for a file the site never had.

The footer date is missing on a page
      The date comes from git history and only appears on the deployed site.
      It also stays hidden if assets/last-updated.json has no entry for that
      page - which happens when the page was never committed with that exact
      filename. Commit the page and it will appear after the next deploy.

A change is not live yet
      Deploys take about a minute. Check the Actions tab for the run; a failed
      run means nothing new was published, and the previous version stays up.

The site is up but a section looks unstyled or broken
      Most likely a script error introduced in assets/style.css or one of the
      shared scripts. Use the browser console (F12) to see the error; the
      previous version keeps serving until the fix is pushed.

Something is wrong with an error page
      Remember only 404.html is used automatically on GitHub Pages (section 7).

A banner will not go away
      Its countdown has not expired and "enabled" is true. Set "enabled":
      false, or correct the deadline in assets/banner.json. Do not delete past
      event entries - they hide on their own once their deadline passes.


==============================================================================
Questions, or a change that does not fit anything above: open an issue in the
repository, or email goderichchessclub@gmail.com.
==============================================================================
