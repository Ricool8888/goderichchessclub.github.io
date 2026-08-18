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
