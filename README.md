# Sojourn Exchange — demo (v3)

Live link: https://claude.ai/artifact/W6AdsHEYiudyeqHhMmEz1D

## What changed in v3
- 50 **real public listings**, luxury residences (typically $5M–$100M), 20–24 photographs each (1,178 photos). Sourced from
  Sotheby's International Realty affiliate listings (see `docs/listings-manifest.tsv` for the source URL of each).
  Demo only — Sojourn is not affiliated with the brokers and the owners have not joined the exchange.
- New mechanics: **publish free → receive 7 nights → +1 night for every night you host**; no membership —
  you *list your property* (stringently vetted); commission **0.5% from buyer and 0.5% from seller** on completion.
- Every residence lists its **nearest private-aviation field and international airport** with a rough
  chauffeured (Maybach / limousine) drive time; launch/tender/helicopter legs are noted where relevant.
- Multi-residence rotating hero on the home page; 20+ photo galleries with lightbox; "Shortest drive from jet" sort.

## Run locally
Double-click `Start Sojourn.command` (or `cd site && python3 -m http.server 8080`) and open http://localhost:8080.
`site/index.html` also works from `file://` because data ships as `data/properties.js`.

## Folder
- `site/` — the app (static HTML/CSS/JS, no build step)
- `site/assets/img/properties/rNN/01..24.jpg` — individual photographs (local build)
- `docs/photo-urls.tsv` — original photo URLs; `fetch_photos.sh` re-downloads them
- `docs/listings-manifest.tsv` — the 50 listings with prices, specs and source links

## Hosted vs local images
The hosted artifact is capped at 512 files, so there each residence's photos are packed into two vertical
"strip" JPEGs (`strip-a.jpg`, `strip-b.jpg`) and rendered as sprites (`sprite` field in `data/properties.js`).
The local build uses the individual files. The app supports both.

## Deployment

- **Production:** https://sojourn-exchange-seven.vercel.app (also `sojourn-exchange-pantheon-labs1.vercel.app`)
- **Vercel project:** `sojourn-exchange` on team Pantheon Labs, linked to GitHub `aotearoafeli/sojourn-exchange`
- Every push to `main` auto-deploys to production; other branches get preview URLs.
- Static site, no build step (`vercel.json` sets clean URLs and long-lived caching for `/assets`).

## Demo account

- `phillip.dimitrov@gmail.com` / `test1234` (Founding Principal, seeded on first load)
