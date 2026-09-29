When modifying / changing files from claude ensure the following wording is updated / kept:

Index page:
      Intro paragraphs
      Addresses of Goderich Library and Goderich Legion
      Mailing list card
      Club rules

About us page:
      Mandate
      Vision Statement
      Person profiles (board of directors)

Posts / news page:
      Partnership with the Legion annoucement

Events calendar page:
      Info paragraph

Tournaments page:
      Info paragraph

Sponsors page: 
      Info paragraph
      Each sponsor's description
      Ensure community sponsors only have their name, no card or photo

Merch page:
      Info paragraph
      Each merch item's description

FAQ page:
      All answers for FAQ questions

Books for sale page:
      Book titles, author, and prices

Gallery page:

      <!-- =====================================================================
         HOW TO ADD PHOTOS TO THIS GALLERY
         =====================================================================
         This gallery is data-driven, same idea as events.json / posts.json /
         tournaments.json elsewhere on this site. Photos are grouped into
         SECTIONS - each section gets its own heading (e.g. a tournament
         name) followed by its own row of photos underneath it.

         There are TWO steps to add a new photo - you need to do BOTH or it
         won't show up:

         STEP 1 - Upload the actual image file
         ---------------------------------------
         Put the photo file inside:  assets/gallery/
         (There's a README.txt in that folder with naming tips too.)

         Keep the file reasonably small for the web (ideally under
         1-2MB) so the gallery page loads quickly, especially on mobile.

         STEP 2 - Add an entry for it in assets/gallery.json
         ---------------------------------------------------
         Open assets/gallery.json. The file is a list of SECTIONS, and each
         section has a "title" and its own "photos" list, like this:

         [
           {
             "id": "section-001",
             "title": "Summer 2026 Tournament",
             "photos": [
               {
                 "id": "photo-001",
                 "filename": "summer-2026-01.jpg",
                 "caption": "A short caption shown under the photo",
                 "alt": "A plain-language description for screen readers"
               }
             ]
           },
           {
             "id": "section-002",
             "title": "Fall 2026 Tournament",
             "photos": [
               { "id": "photo-002", "filename": "fall-2026-01.jpg", "caption": "", "alt": "..." }
             ]
           }
         ]

         TO ADD A NEW PHOTO TO AN EXISTING TOURNAMENT/SECTION:
         Just add another object to that section's "photos" list, with a
         comma after the previous photo entry.

         TO ADD A WHOLE NEW TOURNAMENT/SECTION:
         Copy an entire { "id": ..., "title": ..., "photos": [...] } block
         and add it to the outer list, with a comma after the previous
         section's closing "}".

         Notes:
         - "id" values just need to be unique - increment the number each
           time (section-001, section-002, ... and photo-001, photo-002, ...
           the photo numbering can just keep counting up site-wide, it
           doesn't need to restart for each section).
         - "filename" must exactly match the file you uploaded in Step 1,
           including capitalization.
         - "caption" is optional (shows on hover and in the enlarged view) -
           you can leave it as an empty string "" if you don't want one.
         - "alt" should describe the photo for visually impaired visitors
           and for search engines - a few words is enough.
         - JSON needs a comma after every entry except the very last one in
           each list. If the gallery stops showing photos after an edit,
           this is the most common cause - paste the file into
           jsonlint.com to check for a missing/extra comma.

         The starter section/photo currently in gallery.json is just a
         placeholder - replace it with your first real tournament and
         photos, or delete it once you've added real ones.
         ===================================================================== -->

How pages work:

      Posts and news page:
            How this blog works: posts come from assets/posts.json. To publish
            a new post, add it directly to that file in the repo and commit —
            visitors can read, search, and filter posts, but can't submit
            their own.

      Events calendar page:
            How this calendar works: weekly meetings show automatically every
            Tuesday and Friday. Special events come from assets/events.json.
            Click a day to view what's scheduled. To add a new event yourself,
            edit assets/events.json directly in the repo and commit the change —
            visitors can view the calendar but can't submit events.

      Tournaments page:
            How this page works: tournaments are listed in assets/tournaments.json.
            To add a new one or mark one as complete, edit that file in the repo
            and commit the change.

      Banners on index.html
            There are 2 styles of banners: info and urgent.  To add a banner, add json
            to the banner.json file and the next banner should appear.  If the banner
            doesn't appear, make sure the json is correct.  

Description of extra pages
      - Robots.txt tells automated web crawlers and search engine bots which pages and files they can or cannot visit on a website.
      - 400.html is a custom error page that a web server displays when a user tries to visit a web page with a broken URL or invalid request
      - 403.html is a custom error page that a web server displays when a user tries to visit a web page without proper access
      - 404.html is a custom error page that a web server displays when a user tries to visit a web page that does not exist, has been moved, or has a broken link
      - 500.html is a custom error page that a web server displays when a user tries to visit a web page and the webpage has an internal server error
      - 503.html is a custom error page that a web server displays when a user tries to visit a web page that has active maintenance ongoing
      - sitemap.xml acts as a roadmap for your website. It lists all your important URLs and tells search engines like Google how to find and crawl your content.
      - .nojekyll is an empty configuration file placed in the root directory of a GitHub Pages repository. It tells GitHub to skip running the site through the Jekyll static site generator. This prevents Jekyll from ignoring files or folders that start with an underscore
      - static.yml file is most commonly used as a GitHub Actions workflow configuration template. It automates building and deploying static web content—such as HTML, CSS, and JavaScript—directly to hosting platforms like GitHub Pages whenever you push code changes to your repository.
