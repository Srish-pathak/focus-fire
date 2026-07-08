# 🔥 Focus Fire

A small, honest focus timer. Start a session and a campfire builds — spark, kindling, flame, roaring — as you stay with it. Walk away early and the fire just goes out. No streaks lost, no guilt. Just start again when you're ready.

No accounts, no backend, no build step. Session history lives in your browser via `localStorage`.

## Features

- Pick a session length (15 / 25 / 45 / 60 minutes)
- A campfire grows in real time as the session progresses, with rising embers once it catches
- A session only logs once it finishes fully — pausing is fine, resetting early just lets the fire go out
- Today's total focused time and a running log of past sessions, styled like a woodpile
- Fully static: works by opening `index.html`, deploys instantly to GitHub Pages
- Responsive, keyboard-accessible, respects `prefers-reduced-motion`

## Running locally

No install, no dependencies. Just open the file:

```bash
open index.html   # macOS
# or
xdg-open index.html   # Linux
```

Or serve it locally (recommended, since some browsers restrict `localStorage` on `file://` URLs):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploying to GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`.
4. Choose the `main` branch and `/ (root)` folder, then save.
5. Your fire will be live at `https://<your-username>.github.io/<repo-name>/` within a minute or two.

## Project structure

```
focus-fire/
├── index.html      # markup
├── style.css        # design tokens + styles
├── script.js         # timer state, fire rendering, session log
├── README.md
└── LICENSE
```

## How it works

Choosing a duration sets a countdown. Starting it grows the fire's SVG scale in proportion to elapsed time, and once you're roughly a third of the way in, embers start rising. Finishing the full countdown logs the session — minutes and a timestamp — to your local history. Pausing just holds the fire steady; resetting lets it die down without logging anything, honestly, with no penalty.

## License

MIT — see [LICENSE](LICENSE).
