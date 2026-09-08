/* ============================================================
   THE NINETY-NINE  —  counters "Rio Run" (Snake)
   The same growing trail. Opposite errand: you are a shepherd,
   not a patrol. What follows you is not a catch. It is a flock,
   and every one of them has a name and is walked home.
   ============================================================ */
(function () {
  "use strict";
  var P = Arcade.P;

  var COLS = 24, ROWS = 20, CELL = 10;
  var OX = 0, OY = 40;                    // play area origin (240 x 240 screen)

  var NAMES = [
    "MIRIAM", "TOBIAS", "SHEPHARD", "ANNA", "LEVI", "RUTH", "AMOS",
    "ESTHER", "SILAS", "NAOMI", "JONAH", "PHOEBE", "EZRA", "TAMAR",
    "CLEMENT", "DINAH", "BARNABAS", "SUSANNA", "OMAR", "PERPETUA"
  ];

  var shepherd, flock, dir, nextDir, lost, fold, moveT, stepTime, gathered, toast, toastT, wolf, wolfT;

  function cellFree(x, y, ignoreTail) {
    var i;
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
    for (i = 0; i < flock.length - (ignoreTail ? 1 : 0); i++) {
      if (flock[i].x === x && flock[i].y === y) return false;
    }
    return !(shepherd.x === x && shepherd.y === y);
  }

  function placeLost() {
    var tries = 0, x, y;
    do {
      x = Arcade.randInt(0, COLS - 1);
      y = Arcade.randInt(0, ROWS - 1);
      tries++;
    } while (!cellFree(x, y) && tries < 300);
    lost = { x: x, y: y, name: Arcade.pick(NAMES), bob: 0 };
  }

  function placeFold() {
    // The fold sits on an edge: the flock is led somewhere, not just collected.
    var side = Arcade.randInt(0, 3);
    if (side === 0) fold = { x: Arcade.randInt(1, COLS - 2), y: 0 };
    else if (side === 1) fold = { x: Arcade.randInt(1, COLS - 2), y: ROWS - 1 };
    else if (side === 2) fold = { x: 0, y: Arcade.randInt(1, ROWS - 2) };
    else fold = { x: COLS - 1, y: Arcade.randInt(1, ROWS - 2) };
  }

  var game = Arcade.create({
    id: "ninety-nine",
    canvas: "#screen",
    width: 240, height: 280,
    title: "THE NINETY-NINE",
    subtitle: "Leave the ninety-nine. Go after the one.",
    howto: "ARROWS to walk. Gather the lost, then lead them to the FOLD.",
    verse: '"What man, having a hundred sheep, does not leave the ninety-nine?" Luke 15:4',
    scoreLabel: "BROUGHT HOME",
    moral: "A border game counts how many you turned away. This one counts how many you carried back.",

    reset: function () {
      shepherd = { x: 12, y: 10 };
      flock = [];
      dir = { x: 1, y: 0 };
      nextDir = { x: 1, y: 0 };
      moveT = 0; stepTime = 0.16;
      gathered = 0; toast = ""; toastT = 0;
      wolf = null; wolfT = 12;
      placeLost();
      placeFold();
    },

    update: function (g, dt) {
      if (g.pressed("left")  && dir.x === 0) nextDir = { x: -1, y: 0 };
      if (g.pressed("right") && dir.x === 0) nextDir = { x:  1, y: 0 };
      if (g.pressed("up")    && dir.y === 0) nextDir = { x: 0, y: -1 };
      if (g.pressed("down")  && dir.y === 0) nextDir = { x: 0, y:  1 };

      if (toastT > 0) toastT -= dt;
      if (lost) lost.bob += dt * 6;

      // A wolf appears once the flock is worth stealing.
      wolfT -= dt;
      if (!wolf && wolfT <= 0 && flock.length >= 3) {
        wolf = { x: Arcade.randInt(0, COLS - 1), y: Arcade.randInt(0, ROWS - 1), t: 0 };
        wolfT = 16;
      }
      if (wolf) {
        wolf.t += dt;
        if (wolf.t >= 0.34) {                    // the wolf moves slower than you can walk
          wolf.t = 0;
          var dx = Math.sign(shepherd.x - wolf.x), dy = Math.sign(shepherd.y - wolf.y);
          if (Math.abs(shepherd.x - wolf.x) > Math.abs(shepherd.y - wolf.y)) wolf.x += dx;
          else wolf.y += dy;
        }
      }

      moveT += dt;
      if (moveT < stepTime) return;
      moveT = 0;

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

      // The flock walks single file behind the shepherd.
      var prev = { x: shepherd.x, y: shepherd.y };
      shepherd.x = nx; shepherd.y = ny;
      for (i = 0; i < flock.length; i++) {
        var hold = { x: flock[i].x, y: flock[i].y };
        flock[i].x = prev.x; flock[i].y = prev.y;
        prev = hold;
      }

      if (wolf && wolf.x === shepherd.x && wolf.y === shepherd.y) {
        if (flock.length) {
          flock.pop();                            // the hireling flees; the shepherd loses one
          toast = "A WOLF TOOK ONE"; toastT = 2;
          wolf = null; wolfT = 14;
        } else {
          g.gameOver("The wolf found you empty-handed.");
          return;
        }
      }

      if (lost && shepherd.x === lost.x && shepherd.y === lost.y) {
        flock.push({ x: prev.x, y: prev.y, name: lost.name });
        toast = "FOUND " + lost.name; toastT = 2;
        g.score += 10;
        placeLost();
      }

      // Deliver the whole flock to the fold: they are safe, and you go out again light.
      if (shepherd.x === fold.x && shepherd.y === fold.y && flock.length > 0) {
        var n = flock.length;
        gathered += n;
        g.score += n * n * 12;                    // leading many home at once is the whole point
        toast = n + " HOME SAFE"; toastT = 2.4;
        flock = [];
        stepTime = Math.max(0.085, stepTime - 0.006);
        placeFold();
      }
    },

    draw: function (g) {
      g.clear("#0b1220");

      // Header
      g.text("THE NINETY-NINE", 8, 6, 8, P.goldLite);
      g.text("HOME " + gathered, 232, 8, 7, P.oliveLite, "right");
      g.text("CARRYING " + flock.length, 8, 22, 7, P.dim);
      g.text("SCORE " + g.score, 232, 23, 7, P.parchment, "right");

      // Pasture
      g.rect(OX, OY, COLS * CELL, ROWS * CELL, "#101a2c");
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          if ((r + c) % 2 === 0) g.rect(OX + c * CELL, OY + r * CELL, CELL, CELL, "#0d1526");
        }
      }
      g.frameRect(OX, OY, COLS * CELL, ROWS * CELL, "rgba(217,164,65,.35)", 1);

      // The fold: an open gate, drawn open on purpose.
      var fx = OX + fold.x * CELL, fy = OY + fold.y * CELL;
      g.rect(fx, fy, CELL, CELL, "rgba(79,125,90,.55)");
      g.frameRect(fx, fy, CELL, CELL, P.oliveLite, 1);
      g.rect(fx + 2, fy + CELL - 3, CELL - 4, 2, P.gold);

      // Flock
      for (var i = 0; i < flock.length; i++) {
        var s = flock[i];
        g.rect(OX + s.x * CELL + 1, OY + s.y * CELL + 2, CELL - 2, CELL - 3, "#e8e2d4");
        g.rect(OX + s.x * CELL + CELL - 4, OY + s.y * CELL + 1, 3, 3, "#4a3f36");
      }

      // The one still lost, bobbing so you can find it
      if (lost) {
        var bob = Math.sin(lost.bob) > 0 ? 0 : 1;
        g.rect(OX + lost.x * CELL + 1, OY + lost.y * CELL + 2 - bob, CELL - 2, CELL - 3, "#f4ead8");
        g.rect(OX + lost.x * CELL + CELL - 4, OY + lost.y * CELL + 1 - bob, 3, 3, "#4a3f36");
        g.frameRect(OX + lost.x * CELL, OY + lost.y * CELL - bob, CELL, CELL, "rgba(255,203,107,.7)", 1);
      }

      // Wolf
      if (wolf) {
        g.rect(OX + wolf.x * CELL + 1, OY + wolf.y * CELL + 2, CELL - 2, CELL - 3, "#5a3050");
        g.rect(OX + wolf.x * CELL + 2, OY + wolf.y * CELL + 3, 2, 2, P.crimson);
        g.rect(OX + wolf.x * CELL + CELL - 4, OY + wolf.y * CELL + 3, 2, 2, P.crimson);
      }

      // Shepherd, with staff
      var sx = OX + shepherd.x * CELL, sy = OY + shepherd.y * CELL;
      g.rect(sx + 1, sy + 1, CELL - 2, CELL - 2, P.gold);
      g.rect(sx + 3, sy + 3, 2, 2, "#4a3f36");
      g.rect(sx + CELL - 2, sy - 2, 1, CELL + 2, "#8a5a3b");

      // Ticker
      if (toastT > 0) {
        g.text(toast, 120, OY + ROWS * CELL + 6, 7, P.oliveLite, "center");
      } else if (lost) {
        g.text("LOOKING FOR " + lost.name, 120, OY + ROWS * CELL + 6, 7, P.dim, "center");
      }
      g.text("LEAD THEM TO THE OPEN GATE", 120, OY + ROWS * CELL + 20, 6, "rgba(154,166,196,.75)", "center");
    }
  });
})();
