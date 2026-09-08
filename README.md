# The Free Arcade

A counter-arcade. Five playable browser games answering, one for one, the five
games published at [arcade.gov](https://www.whitehouse.gov/arcade) — same
mechanics, opposite premises.

Built on the conviction that a game is not a poster. A poster asks you to agree
with a claim; a game asks you to *enact* one, thousands of times, and rewards
you for getting better at it. The mechanic is the message. So the answer to a
game is another game — not a petition, and not a takedown request.

## The cabinets

| Theirs | Mechanic | Ours | What changes |
|---|---|---|---|
| Build the Wall | Tetris | **Living Stones** | The same falling blocks build a house, not a rampart. A cleared row is a named household given a roof. |
| Rio Run | Snake | **The Ninety-Nine** | The growing trail is a flock you are answerable for, not a tally of people collected. The gate you lead them to stands open. |
| Supply Line | Conveyor sort | **Honest Scales** | You are the merchant, not the censor. The only ground for refusal is a false label — and refusing an honest supplier costs you as much as selling a lie. |
| Flappy Bill | Flappy Bird | **Enumerated** | Every obstacle is a constitutional check, restored on purpose. Earmarks make the bill heavy; struck clauses make it fly. |
| Trump Savings Tycoon | Coin catcher | **Ten Talents** | You earn it and answer for it: give, invest, or keep. Every subsidy is real money plus a permanent string that shrinks your basket. |
| *(Coming Soon)* | — | **Jubilee** | Placeholder, as theirs is. |

The full argument is in [`about.html`](about.html).

## Running it

Pure static HTML, CSS and vanilla JavaScript. No build step, no dependencies,
no framework, no tracking. Open `index.html`, or serve the directory:

```sh
npx http-server -p 8080 .
# then visit http://127.0.0.1:8080
```

Everything runs in the browser. The only thing written to your machine is a
high score in `localStorage`, and the code degrades gracefully when storage is
unavailable.

## Layout

```
index.html                    the arcade floor + the ledger comparing cabinets
about.html                    the argument
games/*.html                  one page per cabinet
assets/css/arcade.css         cabinet chrome, CRT glass, typography
assets/css/fonts.css          @font-face for the self-hosted latin subsets
assets/fonts/*.woff2          Press Start 2P, EB Garamond, IBM Plex Mono
assets/js/pixelfont.js        hand-drawn 5x7 bitmap font for canvas text
assets/js/arcade.js           engine: canvas, loop, input, sprites, particles,
                              attract/pause/game-over cards, high scores
assets/js/attract.js          the looping vignettes on the lobby cabinets
assets/js/games/*.js          one file per cabinet
```

Each game declares a logical resolution and supplies `reset`, `update` and
`draw`; the engine owns the loop, input edge-detection, the overlay cards, screen
shake, particles and the high score. Every cabinet works with a keyboard and with
on-screen touch buttons.

## On the visuals

Three decisions do most of the work:

**Canvas text is a bitmap font, not `fillText`.** At 6-8px the browser rasteriser
antialiases, hinting shifts baselines, and the result differs on every OS. Every
glyph in `pixelfont.js` is a 5x7 grid drawn as integer rects, so text is exact at
any whole scale and identical everywhere. It folds em dashes, curly quotes and
accents onto glyphs it has, so prose never renders as a row of boxes.

**Fonts are self-hosted.** No CDN request, so the arcade looks right on a
locked-down network, a plane, or a kiosk — and there is no third party watching
who plays.

**The lobby cabinets are alive.** Each card runs a real looping vignette of its
game, complete with the same bitmap-font HUD the cabinet itself uses, all driven
from a single animation frame. Cards scrolled out of view stop drawing, and
`prefers-reduced-motion` gets one still frame instead.

## Terms

Original code, original art, original text. Nothing was taken from any
government site. This is an independent work of political satire and civic
commentary published by private citizens. It is not affiliated with, endorsed
by, or connected to the White House, the United States government, or any
agency, official, or campaign thereof. References to arcade.gov and its games
are for criticism and comment.
