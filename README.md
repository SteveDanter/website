# Steve Danter — Life in Motion

A static replacement for the WordPress site, built from the exported pages and original photographs.

Every story is now an ordinary HTML file. For example:

- `yamaha-sr250.html`
- `suzuki-ts100.html`
- `army.html`
- `france-2023.html`

Open a page in Visual Studio Code or Notepad and look for:

```html
<!-- EDIT YOUR STORY BETWEEN THESE TWO COMMENTS -->
```

The story text and photographs sit beneath that comment. Save the file and refresh your browser to see the change.

## Preview on a computer

You can double-click `index.html` or any individual story page to view it. For a preview that behaves exactly like the Pi, run a small web server in this folder:

```bash
python3 -m http.server 8090
```

Then visit `http://localhost:8090`.

## Run on the Raspberry Pi

Copy this entire folder to `/srv/docker/steve-life-site`, then run:

```bash
cd /srv/docker/steve-life-site
docker compose up -d --build
```

The new site will be available at `http://steve-pi:8090`. WordPress remains available at `http://steve-pi:8088`.

When the new site is approved, Nginx Proxy Manager can be changed to forward the chosen hostname to port `8090`.


## Clean story structure

The old WordPress block classes have been removed from the story pages. Story content now uses the site-owned `story-content` class, with simple helpers such as `content-grid`, `photo-pair`, and `photo-gallery`. The story hero colour follows the chapter palette used on the home page.
