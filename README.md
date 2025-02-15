# XBL Broadcast Ticker

_Credit to [spacemanspumoni](https://github.com/spacemanspumoni/xbl-ticker) for the original ticker._

Renders a 1920x1080 ticker with [XBL scores and stats](https://www.xblbaseball.com) across the bottom of the screen. This ticker is meant for use in OBS (or similar broadcasting software).

## Usage

In your broadcasting software, add a browser source pointed to [https://xblbaseball.github.io/ticker/](). Put the browser layer below your content.

### Regular Season vs Playoffs

By default, you'll see regular season games and stats. If you want playoff games and stats, use one of these links:

* Every league in playoffs: [https://xblbaseball.github.io/ticker/?xbl-playoffs=true&aaa-playoffs=true&aa-playoffs=true]()
* Only AA in playoffs: [https://xblbaseball.github.io/ticker/?aa-playoffs=true]()

## Development

We load every single score and marquee element into the page on the first load, then we use CSS animations (with `overflow: hidden`) to scroll through them. The animations are programmatically generated beforehand using the `calc-keyframes.py` script, which does all the math to make sure animation keyframes make sense and are mostly synced up.

### Environment Variables

Create a `.env` file at the root of this repo with the following variables:

```
G_SHEETS_API_KEY=
```

You'll need a developer to give you the API key for google sheets

### Collecting Stats

There's a bunch of python in this repo for collecting and parsing stats.

* Python 3.10

Test with

```sh
python -m unittest discover stats/tests/
```

Collect and parse stats with

```sh
python scripts/get-sheets.py
python stats/main.py --season 18
```

If you change any of the models in `stats/models/models.py`, update the equivalent TS types by doing the following:

```sh
# save JSON schemas from the models
python stats/models/models.py
# turn the JSON schemas into interfaces
npm run types
```

Then commit the changes.

### Testing the Ticker

OBS uses a Chromium renderer, so we recommend you do the same when testing changes.

### Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. The page auto-updates as you edit files.

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
