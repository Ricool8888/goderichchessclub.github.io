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
      400.html 403.html 404.html 500.html 503.html    Error pages

DATA (the files you edit to change what the site shows)

      assets/banner.json          announcement banners (home + error pages)
      assets/events.json          special events on the calendar
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
      assets/gallery/     gallery photos
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
        bar. Both need an internet connection and will simply stay empty if
        Lichess or the CDN is unreachable - that is not a site bug.
      - The page <head> carries a "SportsActivityLocation" structured-data
        block that repeats the meeting days, times and addresses for Google.
        If meeting details change, this block has to change too (section 9).

about.html - About Us
      What We Offer, Mandate, Vision Statement, and one profile card per board
      member (President, Vice-President, Treasurer). Profiles are ordinary
      HTML: name, role and a short paragraph.

posts-and-news.html - Posts / News
      An empty shell. Every post is rendered by assets/blog.js from
      assets/posts.json, with search, category filter and a month archive
      generated from the post dates. Visitors cannot submit posts; publishing
      means editing the JSON.

events-calendar.html - Events Calendar
      Month grid plus a list view (a visitor's last choice is remembered).
      Recurring Tuesday/Friday meetings are generated by assets/calendar.js,
      special events come from assets/events.json, and closures come from
      assets/closures.json. Clicking a day opens its details; there are
      "add to calendar" buttons that generate .ics files in the browser.
      Below the calendar is a short info paragraph and a link to the
      registration form.

tournaments.html - Tournaments
      Three tabs: Upcoming, Completed, and a first-timer guide (joining the
      CFC, registering, rules, notation, penalties). The tab content is
      rendered by assets/tournaments.js from assets/tournaments.json; the
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
      Photos grouped into sections by assets/gallery.js from
      assets/gallery.json. Each section gets its own heading and a row of
      photos with a lightbox. Photos are loaded lazily, so a large gallery
      does not slow the page down.

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
      "Last updated: September 29, 2026 - Version #1". That line is written by
      hand and is separate from the generated footer date. Bump it whenever the
      policy text changes.

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
            2. Set its <title>, meta description and canonical URL.
            3. Put a placeholder <header> / <footer> in it (copy from any
               page) and run the sync script - it fills in the real ones.
            4. Add the page to the NAV_HREF map in
               scripts/sync-shared-blocks.mjs so its menu link is marked
               active, and to partials/header.html if it belongs in the menu.
            5. Add its URL to sitemap.xml.

      The menu bar or footer
            Never hand-edit these in a page; they are generated. See
            section 5.

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
4.2 assets/events.json - special events
-------------------------------------------------------------------------------
Everything on the calendar that is not a regular Tuesday/Friday meeting.

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
Drives the Tournaments page tabs, and - together with events.json - the event
information search engines read. One object per tournament:

      id, status, date, endDate, title, format, location, entryFee,
      description, resultsUrl, extraLinks

      status        "upcoming" or "completed" - decides which tab it lands in.
      date/endDate  YYYY-MM-DD. A one-day event repeats the same date.
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

To add a photo you must do BOTH steps:

      1. Put the image file in assets/gallery/ - keep it at 1-2 MB at most,
         JPG or PNG, and keep the filename exact (capitalisation matters).
      2. Add an entry for it in assets/gallery.json.

      - "id" values only need to be unique; numbering can keep counting up.
      - "caption" may be "" if you do not want one.
      - "alt" describes the photo for visually impaired visitors and for
        search engines; a few words is enough.
      - To add a section, copy a whole { id, title, photos } block.

There is a short reminder of all this in assets/gallery/Gallery README.txt,
next to the photos.

-------------------------------------------------------------------------------
4.7 assets/books/descriptions.json
-------------------------------------------------------------------------------
A title -> description map for the books. The books page currently shows the
descriptions written in its own table (books-for-sale.html), and nothing reads
this file at runtime; it is kept as the source copy of that text. If you add a
book, edit the table (section 11); treat this file as reference material.

-------------------------------------------------------------------------------
4.8 assets/last-updated.json - generated, do not edit
-------------------------------------------------------------------------------
Written by a deploy script from git history and git-ignored, so it only exists
in the deployed copy. Hand edits are pointless: the next push overwrites it.


==============================================================================
5. SHARED HEADER, FOOTER AND SCRIPTS
==============================================================================

HEADER AND FOOTER

      The menu bar and the footer are identical on all 16 pages. They are kept
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

SHARED SCRIPTS (assets/)

      nav.js            Mobile menu: the hamburger opens it, Escape closes it
                        and returns focus to the button, a click outside closes
                        it. Included by every page.
      theme.js          Light/dark switch in the footer. The choice is saved in
                        the visitor's browser, not on the site.
      share.js          The share button: device share sheet where available,
                        otherwise Facebook / X / copy link.
      last-updated.js   Writes the copyright year and the footer date.
      style.css         Every style used on the site, including the mobile
                        and dark-mode rules. Page-specific blocks are commented.

      These are shared, so a change here affects every page. Test on a phone
      width and in both themes before pushing.


==============================================================================
6. AUTOMATIC STEPS THAT RUN ON EVERY PUSH
==============================================================================

.github/workflows/static.yml deploys the site. It runs when something is
pushed to main (or when someone starts it from the Actions tab), and it does
this in order:

      1. Check out the repository, with full history (the footer dates need it).
      2. Check the shared header and footer
             node scripts/sync-shared-blocks.mjs --check
         Fails the deploy if a page's header/footer differs from partials/.
      3. Stamp the footer dates and sitemap dates
             node scripts/stamp-last-updated.mjs
         Writes assets/last-updated.json from the commit that last touched each
         page, and updates each <lastmod> in sitemap.xml from the same dates.
      4. Generate event structured data
             node scripts/generate-event-schema.mjs
         Rebuilds the Event block in events-calendar.html's <head> from
         assets/tournaments.json and assets/events.json.
      5. Generate FAQ structured data
             node scripts/generate-faq-schema.mjs
         Rebuilds the FAQPage block in faq.html's <head> from the page's own
         question/answer markup.
      6. Upload the whole repository as the site, and deploy it to GitHub Pages.

Steps 3-5 edit files in the deploy copy only - they do not commit anything, so
the repository keeps its hand-written state. That also means you never need to
run them by hand, and you should not run them before committing: the dates
would be wrong.

The "structured data" blocks are what Google reads to show rich results.
Two of them are generated at deploy time and wrapped in HTML comment markers:

      faq.html
            <!-- faq-schema:start ... -->  ...  <!-- faq-schema:end -->
      events-calendar.html
            <!-- event-schema:start ... --> ...  <!-- event-schema:end -->

Editing inside those markers is pointless - the next deploy overwrites it.
Editing the visible questions/answers, or the tournaments and events data, is
exactly the right way to change what ends up there.

The third block - the "SportsActivityLocation" one in index.html's <head> -
is hand-written, so its meeting days, times, addresses and social links have to
be updated by hand (see section 9).

CHECKS THAT RUN ON PULL REQUESTS

.github/workflows/validate.yml runs on every pull request and on main. It
catches the mistakes that a browser quietly forgives:

      1. The shared header/footer check listed above.
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

Both tools are downloaded by the workflow, so the repository still has no
package.json and nothing to install. To run them before pushing:

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
      - Pages are not in sitemap.xml on purpose.


==============================================================================
8. FILES YOU RARELY SEE
==============================================================================

sitemap.xml
      The list of the site's real pages and their last-modified dates, used by
      search engines. It has 11 entries; error pages and the gallery of raw
      images are deliberately left out. Its dates are rewritten on every deploy
      from git history, so do not edit them by hand. If you add a page, add its
      <url> entry (a bare address, e.g. https://goderichchessclub.com/newpage)
      with any placeholder <lastmod> - the next deploy corrects it.

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
      output, and assets/last-updated.json (generated at deploy time).


==============================================================================
9. FACTS THAT LIVE IN MORE THAN ONE PLACE
==============================================================================

A static site has no single source of truth for text, so a few facts are
repeated. When one of them changes, update all the copies or the site will
contradict itself.

MEETING DAYS, TIMES AND ADDRESSES
      Change these together:
            - index.html - the hero sentence and the two meeting cards
            - index.html - the structured-data block in the <head>
              (dayOfWeek, opens, closes, streetAddress, postalCode)
            - assets/calendar.js - RECURRING_EVENTS at the top (dayOfWeek,
              time, description; dayOfWeek is 0 = Sunday ... 5 = Friday)
            - faq.html - the "Where is the chess club located?" and "When does
              the club meet?" answers
            - about.html and privacy.html if they mention the schedule
            - the Friday meeting only exists from its startDate in
              calendar.js (2026-07-24); leave that as is unless the club's
              history there changes.

CONTACT EMAIL
      Header "Contact Us", footer, page bodies, mailto links with preset
      subjects (merch and refund enquiries), the home-page structured data, and
      the tournament descriptions in assets/tournaments.json.

TOURNAMENT DETAILS
      assets/tournaments.json drives the Tournaments page tabs and the calendar
      structured data. assets/events.json is what puts a tournament on the
      Events Calendar. Adding a tournament properly means adding it to both,
      plus a banner in assets/banner.json if you want one counting down.

CLOSURES
      assets/closures.json is the only place the calendar looks, but a closure
      is usually also worth a post in assets/posts.json - that is what members
      read.

PRIVACY POLICY VERSION
      privacy.html carries its own "Last updated ... Version #N" line. Update
      it by hand whenever the policy text changes. It is separate from the
      generated footer date and should not be deleted.


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
      2. Add a matching entry to assets/events.json so it appears on the
         calendar.
      3. Optionally add a banner with the registration deadline.
      4. Commit and push. When it is over, flip "status" to "completed" and
         fill in resultsUrl.

ADD A PHOTO TO THE GALLERY
      1. Put the file in assets/gallery/ (under 1-2 MB).
      2. Add its entry to assets/gallery.json, filename matching exactly.
      3. Commit and push.

ADD A BOOK
      1. Add a <tr> row to the table in books-for-sale.html with title, author,
         description and price.
      2. Put its cover in assets/books/images/ named exactly "<Title>.jpg" -
         for example "Checkmate.jpg" for the row titled Checkmate. Watch
         apostrophes and punctuation; they must match the title character for
         character.
      3. Commit and push.

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
