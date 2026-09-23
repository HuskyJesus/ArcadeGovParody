/* ============================================================
   WELCOME WAGON
   Snake, except the line behind you is people who needed a
   lift. Pick them up, drive them to the welcome centre, go
   back out. Watch for red tape; it takes one every time.
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
    "SILAS", "NAOMI", "JONAH", "PHOEBE", "EZRA", "TAMAR", "DAVE",
    "DINAH", "OMAR", "SUSANNA", "MARISOL", "HENRY", "PRIYA", "YUSUF"
  ];

  var PERSON = [
    ".HH..",
    ".HH..",
    "CCCC.",
    "CCCC.",
    ".L.L."
  ];
  var PERSON_KEY = { H: "#e0b088", C: "#7fb2dd", L: "#3a4358" };
  var PERSON_KEY_B = { H: "#c98f6a", C: "#7cc194", L: "#3a4358" };

  var WAGON = [
    "..GGGGG.",
    ".YYYYYYY",
    "YYYYYYYY",
    "YYYYYYYY",
    ".W....W."
  ];
  var WAGON_KEY = { Y: "#d9a441", G: "#9fd0f0", W: "#2a2320" };

  // A tangle of red tape. It does not eat anybody; it processes them.
  var TAPE = [
    "R.RRR.",
    ".RR..R",
    "RR.RR.",
    ".R..RR",
    "RR.RR."
  ];
  var TAPE_KEY = { R: "#e8646d" };

  var wagon, riders, dir, nextDir, lost, centre, moveT, stepTime,
      dropped, toast, toastT, tape, tapeT, scrub, walkPhase, centreGlow;

  function cellFree(x, y) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
    for (var i = 0; i < riders.length; i++) if (riders[i].x === x && riders[i].y === y) return false;
    if (centre && centre.x === x && centre.y === y) return false;
    return !(wagon.x === x && wagon.y === y);
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
    if (side === 0) centre = { x: Arcade.randInt(1, COLS - 2), y: 0 };
    else if (side === 1) centre = { x: Arcade.randInt(1, COLS - 2), y: ROWS - 1 };
    else if (side === 2) centre = { x: 0, y: Arcade.randInt(1, ROWS - 2) };
    else centre = { x: COLS - 1, y: Arcade.randInt(1, ROWS - 2) };
  }

  Arcade.create({
    id: "welcome-wagon",
    canvas: "#screen",
    width: W, height: H,
    title: "WELCOME WAGON",
    subtitle: "Nobody walks.",
    howto: "ARROWS TO DRIVE - PICK EVERYBODY UP - DROP THEM AT THE CENTRE",
    verse: "A FULL WAGON PAYS BEST. RED TAPE TAKES ONE EVERY TIME IT CATCHES YOU.",
    scoreLabel: "DROPPED OFF",
    moral: "THERE IS ALWAYS SOMEBODY ELSE OUT THERE WAITING FOR A LIFT.",

    reset: function () {
      wagon = { x: 12, y: 10 };
      riders = [];
      dir = { x: 1, y: 0 }; nextDir = { x: 1, y: 0 };
      moveT = 0; stepTime = 0.16;
      dropped = 0; toast = ""; toastT = 0;
      tape = null; tapeT = 12; walkPhase = 0; centreGlow = 0;
      scrub = [];
      for (var i = 0; i < 70; i++) {
        scrub.push({ x: Arcade.randInt(0, PW - 4), y: Arcade.randInt(0, PH - 4),
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
      if (centreGlow > 0) centreGlow -= dt;
      if (lost) lost.bob += dt * 6;

      tapeT -= dt;
      if (!tape && tapeT <= 0 && riders.length >= 3) {
        tape = { x: Arcade.randInt(0, COLS - 1), y: Arcade.randInt(0, ROWS - 1), t: 0 };
        tapeT = 16;
      }
      if (tape) {
        tape.t += dt;
        if (tape.t >= 0.34) {
          tape.t = 0;
          var dx = Math.sign(wagon.x - tape.x), dy = Math.sign(wagon.y - tape.y);
          if (Math.abs(wagon.x - tape.x) > Math.abs(wagon.y - tape.y)) tape.x += dx;
          else tape.y += dy;
        }
      }

      moveT += dt;
      if (moveT < stepTime) return;
      moveT = 0;
      walkPhase ^= 1;

      dir = nextDir;
      var nx = wagon.x + dir.x, ny = wagon.y + dir.y;

      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) {
        g.gameOver(Arcade.pick([
          "Drove straight off the map. Everybody got out and walked.",
          "You left the county. Nobody followed."
        ]));
        return;
      }
      for (var i = 0; i < riders.length; i++) {
        if (riders[i].x === nx && riders[i].y === ny) {
          g.gameOver("You trampled your own riders. Lead them; do not drive them.");
          return;
        }
      }

      var prev = { x: wagon.x, y: wagon.y };
      wagon.x = nx; wagon.y = ny;
      for (i = 0; i < riders.length; i++) {
        var hold = { x: riders[i].x, y: riders[i].y };
        riders[i].x = prev.x; riders[i].y = prev.y;
        prev = hold;
      }

      if (tape && tape.x === wagon.x && tape.y === wagon.y) {
        if (riders.length) {
          var taken = riders.pop();
          toast = taken.name + " GOT PROCESSED";
          toastT = 2.2;
          g.kick(5); g.flash(P.crimson, 0.3);
          g.burst(OX + tape.x * CELL + 5, OY + tape.y * CELL + 5, P.crimsonLite, 12, { speed: 60 });
          tape = null; tapeT = 14;
        } else { g.gameOver("Red tape caught you with an empty wagon and filed you anyway."); return; }
      }

      if (lost && wagon.x === lost.x && wagon.y === lost.y) {
        riders.push({ x: prev.x, y: prev.y, name: lost.name });
        toast = "PICKED UP " + lost.name;
        toastT = 2.2;
        g.score += 10;
        g.burst(OX + lost.x * CELL + 5, OY + lost.y * CELL + 5, P.goldLite, 8, { speed: 44, lift: 14 });
        placeLost();
      }

      if (wagon.x === centre.x && wagon.y === centre.y && riders.length > 0) {
        var n = riders.length;
        dropped += n;
        g.score += n * n * 12;
        toast = n === 1 ? "ONE DROPPED OFF" : n + " DROPPED OFF";
        toastT = 2.6;
        centreGlow = 0.9;
        g.kick(Math.min(7, 2 + n));
        g.flash(P.olive, 0.3);
        for (i = 0; i < n * 4; i++) {
          g.burst(OX + centre.x * CELL + 5, OY + centre.y * CELL + 5,
                  Arcade.pick([P.oliveLite, P.goldLite, P.parchment]), 1,
                  { speed: 80, life: 1, gravity: 20 });
        }
        riders = [];
        stepTime = Math.max(0.085, stepTime - 0.006);
        placeFold();
      }
    },

    draw: function (g) {
      /* ---- sky, hills, then the lot ---- */
      g.gradient(0, 0, W, 52, "#101a33", "#1b2b4a", 6);
      // distant hills
      for (var hx = 0; hx < W; hx += 2) {
        var hh = 8 + Math.sin(hx * 0.05) * 4 + Math.sin(hx * 0.017) * 5;
        g.rect(hx, 52 - hh, 2, hh, "#152241");
      }

      g.textShadow("WELCOME WAGON", 12, 8, 2, P.goldLite);

      /* ---- scoreboard strip ---- */
      g.text("ABOARD", 12, 30, 1, P.dim);
      g.text(String(riders.length), 12 + 44, 30, 1, riders.length ? P.parchment : P.dimmer);
      g.text("DROPPED", 112, 30, 1, P.dim);
      g.text(String(dropped), 112 + 50, 30, 1, P.oliveLite);
      g.text(String(g.score), W - 12, 30, 1, P.goldLite, "right");

      /* ---- the lot ---- */
      g.rect(OX - 2, OY - 2, PW + 4, PH + 4, "#0f1a2c");
      g.frameRect(OX - 2, OY - 2, PW + 4, PH + 4, "rgba(217,164,65,.38)", 1);
      g.gradient(OX, OY, PW, PH, "#16283a", "#101d2c", 5);

      // grass scrub, so the field is a place rather than a grid
      for (var i = 0; i < scrub.length; i++) {
        var t = scrub[i];
        var col = ["#23422f", "#26492f", "#1e3a2a"][t.k];
        g.rect(OX + t.x, OY + t.y + 1, 3, 1, col);
        g.rect(OX + t.x + 1, OY + t.y, 1, 2, col);
        if (t.tall) g.rect(OX + t.x + 2, OY + t.y - 1, 1, 2, col);
      }

      /* ---- the welcome centre: lit doorway, banner over it ---- */
      var fx = OX + centre.x * CELL, fy = OY + centre.y * CELL;
      if (centreGlow > 0) {
        g.ctx.globalAlpha = centreGlow;
        g.rect(fx - 5, fy - 5, CELL + 10, CELL + 10, "rgba(124,193,148,.35)");
        g.ctx.globalAlpha = 1;
      }
      g.ctx.globalAlpha = 0.14 + 0.10 * (Math.sin(g.wall * 3) + 1) / 2;
      g.rect(fx - 5, fy - 5, CELL + 10, CELL + 10, P.oliveLite);
      g.ctx.globalAlpha = 1;
      g.rect(fx, fy + 2, CELL, CELL - 2, "#2b3a63");            // the building
      g.rect(fx - 1, fy, CELL + 2, 3, P.olive);                 // the banner
      g.rect(fx - 1, fy, CELL + 2, 1, P.oliveLite);
      var lit = Math.sin(g.wall * 3) > -0.4;
      g.rect(fx + 3, fy + 5, CELL - 6, CELL - 5, lit ? "#ffcb6b" : "#3a4358");   // the open door
      if (lit) g.rect(fx + 3, fy + 5, CELL - 6, 1, "#fff2cf");

      /* ---- riders, single file ---- */
      for (i = 0; i < riders.length; i++) {
        var s = riders[i];
        var lift = (i + walkPhase) % 2;
        g.sprite(PERSON, OX + s.x * CELL + 3, OY + s.y * CELL + 3 - lift, 1,
                 i % 2 ? PERSON_KEY_B : PERSON_KEY);
      }

      /* ---- the one still lost, marked so you can find it ---- */
      if (lost) {
        var bob = Math.sin(lost.bob) > 0 ? 0 : 1;
        var lx = OX + lost.x * CELL, ly = OY + lost.y * CELL;
        g.ctx.globalAlpha = 0.35 + 0.25 * (Math.sin(g.wall * 4) + 1) / 2;
        g.frameRect(lx - 1, ly - 1, CELL + 2, CELL + 2, P.goldLite, 1);
        g.ctx.globalAlpha = 1;
        g.sprite(PERSON, lx + 3, ly + 3 - bob, 1, PERSON_KEY);
        g.rect(lx + 7, ly - 1 - bob, 1, 3, P.goldLite);       // an arm, up, waving
        g.rect(lx + 8, ly - 3 - bob, 1, 2, P.goldLite);
      }

      /* ---- tape ---- */
      if (tape) {
        var wx = OX + tape.x * CELL, wy = OY + tape.y * CELL;
        g.sprite(TAPE, wx + 2, wy + 3, 1, TAPE_KEY);
      }

      /* ---- the wagon ---- */
      var sx = OX + wagon.x * CELL, sy = OY + wagon.y * CELL;
      g.sprite(WAGON, sx + 1, sy + 3 - walkPhase, 1, WAGON_KEY, dir.x < 0);
      // headlights, pointed where you are going
      var lampX = dir.x < 0 ? sx : sx + CELL - 1;
      g.rect(lampX, sy + 4, 1, 2, "#fff2cf");

      /* ---- ticker under the field ---- */
      var ty = OY + PH + 8;
      if (toastT > 0) {
        var c = toast.indexOf("PROCESSED") > 0 ? P.crimsonLite
              : toast.indexOf("DROPPED") > 0 ? P.oliveLite : P.goldLite;
        g.textShadow(toast, W / 2, ty, 1, c, "center");
      } else if (lost) {
        g.text(lost.name + " NEEDS A LIFT", W / 2, ty, 1, P.dim, "center");
      }

      /* ---- the riders you are carrying, by name ---- */
      var ny = ty + 14;
      g.text("ABOARD", 12, ny, 1, P.dimmer);
      if (!riders.length) {
        g.text("NOBODY YET", 12 + 48, ny, 1, P.dimmer);
      } else {
        var names = riders.slice(-3).map(function (f) { return f.name; }).join(" ");
        if (riders.length > 3) names = "+" + (riders.length - 3) + " " + names;
        g.text(names, 12 + 48, ny, 1, P.parchment);
      }
      g.text("DROP THEM AT THE WELCOME CENTRE", W / 2, ny + 12, 1, "rgba(139,151,184,.55)", "center");
    }
  });
})();
