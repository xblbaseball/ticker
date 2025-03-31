# XBL Broadcast Ticker

_Credit to [spacemanspumoni](https://github.com/spacemanspumoni/xbl-ticker) for the original ticker._

Renders a 1920x1080 ticker with [XBL scores and stats](https://www.xblbaseball.com) across the bottom of the screen. This ticker is meant for use in OBS (or similar broadcasting software).

## Usage

In your broadcasting software, add a browser source pointed to either:

* [https://xblbaseball.github.io/ticker/]() for a small bar at the bottom of the screen
* [https://xblbaseball.github.io/ticker/news]() for the full sports news style frame

Put the browser layer below your content.

### Regular Season vs Playoffs

By default, you'll see regular season games and stats. If you want playoff games and stats, use one of these links:

* Every league in playoffs: [https://xblbaseball.github.io/ticker/?xbl-playoffs=true&aaa-playoffs=true&aa-playoffs=true]()
* Only AA in playoffs: [https://xblbaseball.github.io/ticker/?aa-playoffs=true]()

## Development

We load every single score and marquee element into the page on the first load, then we use CSS animations (with `overflow: hidden`) to scroll through them. The animations are programmatically generated beforehand using the `calc-keyframes.py` script, which does all the math to make sure animation keyframes make sense and are mostly synced up.

### Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. The page auto-updates as you edit files. OBS uses a Chromium renderer, so we recommend you do the same when testing changes.

### Building

To see the same static HTML, CSS, JS files that are served on GH Pages, you need to:

1. Build the site.
  ```bash
  npm run build
  ```
2. Serve the `out/` directory. An easy way to do so is:
  ```bash
  python3 -m http.server -d out 8000
  ```
3. Navigate Chrome to [http://localhost:8000](http://localhost:8000)

### Models and TS Types

If the models in the [stats repo](https://github.com/xblbaseball/stats) have changed, collect the new JSON schemas and rebuild our TS type interfaces.

```sh
# download new schemas and turn the JSON schemas into TS interfaces
npm run types
```

Then commit the changes to `src/typings`.
