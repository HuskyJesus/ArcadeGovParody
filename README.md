# The Free Arcade

Five free arcade games. No seal. No subsidy. No account with anybody's name on it.

| Cabinet | Plays like | Tagline |
|---|---|---|
| **Build the Bridge** | falling blocks | Everybody gets across. |
| **Welcome Wagon** | snake | Nobody walks. |
| **Lunch Lady** | conveyor sort | Nobody eats last. |
| **How a Bill Becomes Law** | one-button flyer | Spoiler: it usually doesn't. |
| **No Strings Attached** | catcher | Free money. Read the fine print. |
| *Clean Slate* | — | Out of order. |

## Running it

Plain static HTML, CSS and JavaScript. No build step, no dependencies, no tracking.
Open `index.html`, or serve the folder:

```sh
npx http-server -p 8080 .
```

High scores live in `localStorage` and never leave the browser.

## Layout

```
index.html                  the floor
about.html                  a short FAQ
games/*.html                one page per cabinet
assets/css/arcade.css       cabinet chrome, CRT glass, typography
assets/css/fonts.css        @font-face for the self-hosted fonts
assets/fonts/*.woff2        Press Start 2P, EB Garamond, IBM Plex Mono
assets/js/pixelfont.js      hand-drawn 5x7 bitmap font for canvas text
assets/js/arcade.js         engine: canvas, loop, input, sprites, particles,
                            title/pause/game-over cards, high scores
assets/js/attract.js        the looping previews on the lobby cabinets
assets/js/games/*.js        one file per cabinet
```

Each game supplies `reset`, `update` and `draw`; the engine owns the loop, input,
overlay cards, screen shake, particles and the high score. Every cabinet works with
a keyboard and with on-screen touch buttons.

## Terms

Satire. Not a government website, not affiliated with or endorsed by any government,
agency, official or campaign. All code, art and text are original. The fonts are
OFL/Apache-licensed and redistributed unmodified.
