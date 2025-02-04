# XBL Broadcast Ticker

_Credit to [spacemanspumoni](https://github.com/spacemanspumoni/xbl-ticker) for the original ticker._

Renders a 1920x1080 ticker with [XBL scores and stats](https://www.xblbaseball.com) across the bottom of the screen. This ticker is meant for use in OBS (or similar broadcasting software).

## Usage

In your broadcasting software, add a browser source pointed to [https://cameronwp.github.io/xbl-ticker/](). Put the browser layer below your content.

### Regular Season vs Playoffs

By default, you'll see regular season games and stats. If you want playoff games and stats, use one of these links:

* Every league in playoffs: [https://cameronwp.github.io/xbl-ticker/?xbl-playoffs=true&aaa-playoffs=true&aa-playoffs=true]()
* Only AA in playoffs: [https://cameronwp.github.io/xbl-ticker/?aa-playoffs=true]()

### Blank Ticker

Maybe you want a nice looking place to overlay text in your broadcast. You can render the blank version of the ticker to do so. (By the way, our font is called [Oswald](https://fonts.google.com/specimen/Oswald)).

* To render a bar that shows the XBL logo and nothing else: [https://cameronwp.github.io/xbl-ticker/?blank=true]()

## Dev

We load every single score and marquee element into the page on the first load, then we use CSS animations (with `overflow: hidden`) to scroll through them. The animations are programmatically generated beforehand using the `calc-keyframes.py` script, which does all the math to make sure animation keyframes make sense and are mostly synced up.

### Testing

OBS uses a Chromium renderer, so we recommend you do the same when testing changes.

### Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.


### Building

```bash
npm run build
```

Then you need to serve the `out/` directory. An easy way to do so is:

```bash
python -m http.server -d out 8000
```