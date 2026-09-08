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
assets/css/arcade.css         shared styling
assets/js/arcade.js           shared engine: fixed-resolution canvas, loop,
                              input (keyboard + touch), attract/pause/game-over
assets/js/games/*.js          one file per cabinet
```

Each game declares a logical resolution and supplies `reset`, `update` and
`draw`; the engine owns the loop, the input edge-detection, the title card, the
pause banner, the game-over card and the high score. Every cabinet works with a
keyboard and with on-screen touch buttons.

## Terms

Original code, original art, original text. Nothing was taken from any
government site. This is an independent work of political satire and civic
commentary published by private citizens. It is not affiliated with, endorsed
by, or connected to the White House, the United States government, or any
agency, official, or campaign thereof. References to arcade.gov and its games
are for criticism and comment.
