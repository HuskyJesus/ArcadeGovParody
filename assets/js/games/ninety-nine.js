/* ============================================================
   THE NINETY-NINE  —  counters "Rio Run" (Snake)
   The same growing trail. Opposite errand: you are a shepherd,
   not a patrol. What follows you is not a catch. It is a flock,
   and every one of them has a name and is walked home.
   ============================================================ */
(function () {
  "use strict";
  var P = Arcade.P;

  var W = 264, H = 296;
  var COLS = 24, ROWS = 20, CELL = 10;
  var OX = 12, OY = 52;
  var PW = COLS * CELL, PH = ROWS * CELL;      // 240 x 200

  var NAMES = [
    "MIRIAM", "TOBIAS", "ANNA", "LEVI", "RUTH", "AMOS", "ESTHER",
    "SILAS", "NAOMI", "JONAH", "PHOEBE", "EZRA", "TAMAR",
    "CLEMENT", "DINAH", "BARNABAS", "SUSANNA", "OMAR", "PERPETUA"
  ];

  var SHEEP = [
    ".WWWW.",
    "WWWWWF",
    "WWWWFF",
    ".L..L."
  ];
  var SHEEP_KEY = { W: "#f2ece0", F: "#3a3129", L: "#4a3f36" };

  var SHEPHERD = [
    "..HH..",
    ".RRRR.",
    "RRRRRR",
    ".RR.R.",
    ".L..L."
  ];
  var SHEPHERD_KEY = { H: "#e0b088", R: "#d9a441", L: "#6b4226" };

  var WOLF = [
    "E....E",
    "GGGGGG",
    "GRGGRG",
    "GGGGGG",
    ".G..G."
  ];
  var WOLF_KEY = { G: "#5a4a63", R: "#e8646d", E: "#3b2f44" };

  var shepherd, flock, dir, nextDir, lost, fold, moveT, stepTime,
      gathered, toast, toastT, wolf, wolfT, tufts, walkPhase, foldGlow;

  function cellFree(x, y) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
    for (var i = 0; i < flock.length; i++) if (flock[i].x === x && flock[i].y === y) return false;
    if (fold && fold.x === x && fold.y === y) return false;
    return !(shepherd.x === x && shepherd.y === y);
  }

  function placeLost() {
    var tries = 0, x, y;
    do {
      x = Arcade.randInt(0, COLS - 1); y = Arcade.randInt(0, ROWS - 1); tries++;
    } while (!cellFree(x, y) && tries < 300);
    lost = { x: x, y: y, name: Arcade.pick(NAMES), bob: 0 };
  }

  function placeFold() {
    var side = Arcade.randInt(0, 3);
    if (side === 0) fold = { x: Arcade.randInt(1, COLS - 2), y: 0 };
    else if (side === 1) fold = { x: Arcade.randInt(1, COLS - 2), y: ROWS - 1 };
    else if (side === 2) fold = { x: 0, y: Arcade.randInt(1, ROWS - 2) };
    else fold = { x: COLS - 1, y: Arcade.randInt(1, ROWS - 2) };
  }

  Arcade.create({
    id: "ninety-nine",
    canvas: "#screen",
    width: W, height: H,
    title: "THE NINETY-NINE",
    subtitle: "Leave the ninety-nine. Go after the one.",
    howto: "ARROWS TO WALK - GATHER THE LOST - LEAD THEM TO THE GATE",
    verse: '"WHAT MAN, HAVING A HUNDRED SHEEP, DOES NOT LEAVE THE NINETY-NINE?" LUKE 15:4',
    scoreLabel: "BROUGHT HOME",
    moral: "A BORDER GAME COUNTS WHO YOU TURNED AWAY. THIS ONE COUNTS WHO YOU CARRIED BACK.",

    reset: function () {
      shepherd = { x: 12, y: 10 };
      flock = [];
      dir = { x: 1, y: 0 }; nextDir = { x: 1, y: 0 };
      moveT = 0; stepTime = 0.16;
      gathered = 0; toast = ""; toastT = 0;
      wolf = null; wolfT = 12; walkPhase = 0; foldGlow = 0;
      tufts = [];
      for (var i = 0; i < 70; i++) {
        tufts.push({ x: Arcade.randInt(0, PW - 4), y: Arcade.randInt(0, PH - 4),
                     k: Arcade.randInt(0, 2), tall: Math.random() < 0.3 });
      }
      placeFold();
      placeLost();
    },

    update: function (g, dt) {
      if (g.pressed("left")  && dir.x === 0) nextDir = { x: -1, y: 0 };
      if (g.pressed("right") && dir.x === 0) nextDir = { x:  1, y: 0 };
      if (g.pressed("up")    && dir.y === 0) nextDir = { x: 0, y: -1 };
      if (g.pressed("down")  && dir.y === 0) nextDir = { x: 0, y:  1 };

      if (toastT > 0) toastT -= dt;
      if (foldGlow > 0) foldGlow -= dt;
      if (lost) lost.bob += dt * 6;

      wolfT -= dt;
      if (!wolf && wolfT <= 0 && flock.length >= 3) {
        wolf = { x: Arcade.randInt(0, COLS - 1), y: Arcade.randInt(0, ROWS - 1), t: 0 };
        wolfT = 16;
      }
      if (wolf) {
        wolf.t += dt;
        if (wolf.t >= 0.34) {
          wolf.t = 0;
          var dx = Math.sign(shepherd.x - wolf.x), dy = Math.sign(shepherd.y - wolf.y);
          if (Math.abs(shepherd.x - wolf.x) > Math.abs(shepherd.y - wolf.y)) wolf.x += dx;
          else wolf.y += dy;
        }
      }

      moveT += dt;
      if (moveT < stepTime) return;
      moveT = 0;
      walkPhase ^= 1;

      dir = nextDir;
      var nx = shepherd.x + dir.x, ny = shepherd.y + dir.y;

      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) {
        g.gameOver("You walked past the edge of the pasture. The flock scattered.");
        return;
      }
      for (var i = 0; i < flock.length; i++) {
        if (flock[i].x === nx && flock[i].y === ny) {
          g.gameOver("You trampled your own flock. Lead them; do not drive them.");
          return;
        }
      }

      var prev = { x: shepherd.x, y: shepherd.y };
      shepherd.x = nx; shepherd.y = ny;
      for (i = 0; i < flock.length; i++) {
        var hold = { x: flock[i].x, y: flock[i].y };
        flock[i].x = prev.x; flock[i].y = prev.y;
        prev = hold;
      }

      if (wolf && wolf.x === shepherd.x && wolf.y === shepherd.y) {
        if (flock.length) {
          var taken = flock.pop();
          toast = "A WOLF TOOK " + taken.name;
          toastT = 2.2;
          g.kick(5); g.flash(P.crimson, 0.3);
          g.burst(OX + wolf.x * CELL + 5, OY + wolf.y * CELL + 5, P.crimsonLite, 12, { speed: 60 });
          wolf = null; wolfT = 14;
        } else { g.gameOver("The wolf found you empty-handed."); return; }
      }

      if (lost && shepherd.x === lost.x && shepherd.y === lost.y) {
        flock.push({ x: prev.x, y: prev.y, name: lost.name });
        toast = "FOUND " + lost.name;
        toastT = 2.2;
        g.score += 10;
        g.burst(OX + lost.x * CELL + 5, OY + lost.y * CELL + 5, P.goldLite, 8, { speed: 44, lift: 14 });
        placeLost();
      }

      if (shepherd.x === fold.x && shepherd.y === fold.y && flock.length > 0) {
        var n = flock.length;
        gathered += n;
        g.score += n * n * 12;
        toast = n + (n === 1 ? " HOME SAFE" : " HOME SAFE");
        toastT = 2.6;
        foldGlow = 0.9;
        g.kick(Math.min(7, 2 + n));
        g.flash(P.olive, 0.3);
        for (i = 0; i < n * 4; i++) {
          g.burst(OX + fold.x * CELL + 5, OY + fold.y * CELL + 5,
                  Arcade.pick([P.oliveLite, P.goldLite, P.parchment]), 1,
                  { speed: 80, life: 1, gravity: 20 });
        }
        flock = [];
        stepTime = Math.max(0.085, stepTime - 0.006);
        placeFold();
      }
    },

    draw: function (g) {
      /* ---- sky, hills, then the pasture ---- */
      g.gradient(0, 0, W, 52, "#101a33", "#1b2b4a", 6);
      // distant hills
      for (var hx = 0; hx < W; hx += 2) {
        var hh = 8 + Math.sin(hx * 0.05) * 4 + Math.sin(hx * 0.017) * 5;
        g.rect(hx, 52 - hh, 2, hh, "#152241");
      }

      g.textShadow("THE NINETY-NINE", 12, 8, 2, P.goldLite);

      /* ---- scoreboard strip ---- */
      g.text("CARRYING", 12, 30, 1, P.dim);
      g.text(String(flock.length), 12 + 54, 30, 1, flock.length ? P.parchment : P.dimmer);
      g.text("HOME", 120, 30, 1, P.dim);
      g.text(String(gathered), 120 + 30, 30, 1, P.oliveLite);
      g.text(String(g.score), W - 12, 30, 1, P.goldLite, "right");

      /* ---- pasture ---- */
      g.rect(OX - 2, OY - 2, PW + 4, PH + 4, "#0f1a2c");
      g.frameRect(OX - 2, OY - 2, PW + 4, PH + 4, "rgba(217,164,65,.38)", 1);
      g.gradient(OX, OY, PW, PH, "#16283a", "#101d2c", 5);

      // grass tufts, so the field is a place rather than a grid
      for (var i = 0; i < tufts.length; i++) {
        var t = tufts[i];
        var col = ["#23422f", "#26492f", "#1e3a2a"][t.k];
        g.rect(OX + t.x, OY + t.y + 1, 3, 1, col);
        g.rect(OX + t.x + 1, OY + t.y, 1, 2, col);
        if (t.tall) g.rect(OX + t.x + 2, OY + t.y - 1, 1, 2, col);
      }

      /* ---- the fold: an open gate, drawn open on purpose ---- */
      var fx = OX + fold.x * CELL, fy = OY + fold.y * CELL;
      if (foldGlow > 0) {
        g.ctx.globalAlpha = foldGlow;
        g.rect(fx - 4, fy - 4, CELL + 8, CELL + 8, "rgba(124,193,148,.35)");
        g.ctx.globalAlpha = 1;
      }
      var pulse = Math.sin(g.wall * 3) > 0 ? 1 : 0;
      g.ctx.globalAlpha = 0.16 + 0.10 * (Math.sin(g.wall * 3) + 1) / 2;
      g.rect(fx - 5, fy - 5, CELL + 10, CELL + 10, P.oliveLite);
      g.ctx.globalAlpha = 1;
      g.rect(fx, fy, CELL, CELL, "rgba(79,125,90,.42)");
      g.rect(fx, fy, 2, CELL, "#8a5a3b");                    // gateposts
      g.rect(fx + CELL - 2, fy, 2, CELL, "#8a5a3b");
      g.rect(fx, fy, CELL, 2, "#8a5a3b");                    // lintel
      g.rect(fx + 2, fy + 3, CELL - 4, 1, "rgba(124,193,148," + (0.5 + pulse * 0.4) + ")");
      g.rect(fx + 2, fy + 6, CELL - 4, 1, "rgba(124,193,148," + (0.3 + pulse * 0.3) + ")");

      /* ---- flock, single file ---- */
      for (i = 0; i < flock.length; i++) {
        var s = flock[i];
        var lift = (i + walkPhase) % 2;
        g.sprite(SHEEP, OX + s.x * CELL + 2, OY + s.y * CELL + 3 - lift, 1, SHEEP_KEY);
      }

      /* ---- the one still lost, marked so you can find it ---- */
      if (lost) {
        var bob = Math.sin(lost.bob) > 0 ? 0 : 1;
        var lx = OX + lost.x * CELL, ly = OY + lost.y * CELL;
        g.ctx.globalAlpha = 0.35 + 0.25 * (Math.sin(g.wall * 4) + 1) / 2;
        g.frameRect(lx - 1, ly - 1, CELL + 2, CELL + 2, P.goldLite, 1);
        g.ctx.globalAlpha = 1;
        g.sprite(SHEEP, lx + 2, ly + 3 - bob, 1, SHEEP_KEY);
        g.rect(lx + 4, ly - 4 - bob, 1, 2, P.goldLite);       // a little bleat mark
        g.rect(lx + 6, ly - 5 - bob, 1, 2, P.goldLite);
      }

      /* ---- wolf ---- */
      if (wolf) {
        var wx = OX + wolf.x * CELL, wy = OY + wolf.y * CELL;
        g.sprite(WOLF, wx + 2, wy + 3, 1, WOLF_KEY, shepherd.x < wolf.x);
      }

      /* ---- shepherd, with staff ---- */
      var sx = OX + shepherd.x * CELL, sy = OY + shepherd.y * CELL;
      g.sprite(SHEPHERD, sx + 2, sy + 2 - walkPhase, 1, SHEPHERD_KEY, dir.x < 0);
      var staffX = dir.x < 0 ? sx : sx + CELL - 2;
      g.rect(staffX, sy - 3, 1, CELL + 3, "#8a5a3b");
      g.rect(staffX + (dir.x < 0 ? -1 : 0), sy - 4, 2, 1, "#8a5a3b");

      /* ---- ticker under the field ---- */
      var ty = OY + PH + 8;
      if (toastT > 0) {
        var c = toast.indexOf("WOLF") === 0 ? P.crimsonLite
              : toast.indexOf("HOME") > 0 ? P.oliveLite : P.goldLite;
        g.textShadow(toast, W / 2, ty, 1, c, "center");
      } else if (lost) {
        g.text("LOOKING FOR " + lost.name, W / 2, ty, 1, P.dim, "center");
      }

      /* ---- the flock you are carrying, by name ---- */
      var ny = ty + 14;
      g.text("IN YOUR CARE", 12, ny, 1, P.dimmer);
      if (!flock.length) {
        g.text("NOBODY YET", 12 + 78, ny, 1, P.dimmer);
      } else {
        var names = flock.slice(-3).map(function (f) { return f.name; }).join(" ");
        if (flock.length > 3) names = "+" + (flock.length - 3) + " " + names;
        g.text(names, 12 + 78, ny, 1, P.parchment);
      }
      g.text("LEAD THEM TO THE OPEN GATE", W / 2, ny + 12, 1, "rgba(139,151,184,.55)", "center");
    }
  });
})();
