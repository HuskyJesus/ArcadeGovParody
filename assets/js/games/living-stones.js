/* ============================================================
   LIVING STONES  —  counters "Build the Wall" (Tetris)
   Same falling-block fitting. Opposite purpose: the stones are
   timber and brick, and a completed row is a family housed.
   Nothing is walled out; something is raised up.
   ============================================================ */
(function () {
  "use strict";
  var P = Arcade.P;

  var W = 264, H = 288;
  var COLS = 10, ROWS = 18, CELL = 12;
  var BX = 12, BY = 46;
  var BW = COLS * CELL, BH = ROWS * CELL;      // 120 x 216
  var PANEL_X = BX + BW + 12;                  // 144

  var SHAPES = {
    I: [[0,1],[1,1],[2,1],[3,1]],
    O: [[1,0],[2,0],[1,1],[2,1]],
    T: [[1,0],[0,1],[1,1],[2,1]],
    S: [[1,0],[2,0],[0,1],[1,1]],
    Z: [[0,0],[1,0],[1,1],[2,1]],
    J: [[0,0],[0,1],[1,1],[2,1]],
    L: [[2,0],[0,1],[1,1],[2,1]]
  };

  // Each piece is a different building material, and reads differently.
  var MAT = {
    I: { base: "#8a5a3b", lite: "#b07a52", dark: "#4a2f1c", kind: "beam"   },
    O: { base: "#b3813a", lite: "#dba95c", dark: "#6b4a19", kind: "brick"  },
    T: { base: "#a0522d", lite: "#c87a4e", dark: "#5d2f18", kind: "brick"  },
    S: { base: "#4f7d5a", lite: "#7cc194", dark: "#2b4632", kind: "shingle"},
    Z: { base: "#6b4226", lite: "#96643d", dark: "#3a2415", kind: "beam"   },
    J: { base: "#5f7fa8", lite: "#8fb2d6", dark: "#33455e", kind: "stone"  },
    L: { base: "#d9a441", lite: "#ffcb6b", dark: "#8a6420", kind: "stone"  }
  };
  var KINDS = ["I","O","T","S","Z","J","L"];

  var HOUSEHOLDS = [
    "THE RUIZ FAMILY", "A WIDOW, AGE 81", "THREE ORPHANS",
    "A NIGHT NURSE", "A DAY LABOURER", "THE OKONKWO FAMILY",
    "A REFUGEE COUPLE", "A VETERAN", "THE NGUYEN FAMILY",
    "A SINGLE FATHER", "A FARMHAND", "THE HALEVI FAMILY"
  ];

  var HOUSE = [
    "..###..",
    ".#####.",
    "#######",
    "#.###.#",
    "#.#.#.#",
    "#.###.#",
    "#.....#"
  ];

  var board, piece, nextKind, dropTimer, dropSpeed, housed, lastHousehold,
      toastT, moveTimer, clearAnim, stars, lockFlash;

  function emptyBoard() {
    var b = [], r, c;
    for (r = 0; r < ROWS; r++) { b[r] = []; for (c = 0; c < COLS; c++) b[r][c] = null; }
    return b;
  }

  function spawn(kind) {
    return { kind: kind, cells: SHAPES[kind].map(function (p) { return [p[0], p[1]]; }), x: 3, y: 0 };
  }

  function occupied(cells, ox, oy) {
    for (var i = 0; i < cells.length; i++) {
      var x = cells[i][0] + ox, y = cells[i][1] + oy;
      if (x < 0 || x >= COLS || y >= ROWS) return true;
      if (y >= 0 && board[y][x]) return true;
    }
    return false;
  }

  function rotate(p) {
    var maxY = 0, i;
    for (i = 0; i < p.cells.length; i++) maxY = Math.max(maxY, p.cells[i][1]);
    var turned = p.cells.map(function (c) { return [maxY - c[1], c[0]]; });
    var kicks = [0, -1, 1, -2, 2];
    for (i = 0; i < kicks.length; i++) {
      if (!occupied(turned, p.x + kicks[i], p.y)) { p.cells = turned; p.x += kicks[i]; return; }
    }
  }

  function lock(g) {
    for (var i = 0; i < piece.cells.length; i++) {
      var x = piece.cells[i][0] + piece.x, y = piece.cells[i][1] + piece.y;
      if (y < 0) { g.gameOver("The site is full to the rafters. Rest, and start again."); return; }
      board[y][x] = piece.kind;
      g.burst(BX + x * CELL + CELL / 2, BY + y * CELL + CELL / 2,
              MAT[piece.kind].lite, 3, { speed: 26, life: 0.32, gravity: 60 });
    }
    lockFlash = 0.1;
    clearRows(g);
    piece = spawn(nextKind);
    nextKind = Arcade.pick(KINDS);
    if (occupied(piece.cells, piece.x, piece.y)) {
      g.gameOver("The site is full to the rafters. Rest, and start again.");
    }
  }

  function clearRows(g) {
    var cleared = 0, r, c;
    for (r = ROWS - 1; r >= 0; r--) {
      var full = true;
      for (c = 0; c < COLS; c++) if (!board[r][c]) { full = false; break; }
      if (full) {
        for (c = 0; c < COLS; c++) {
          g.burst(BX + c * CELL + CELL / 2, BY + r * CELL + CELL / 2,
                  Arcade.pick([P.goldLite, P.gold, P.parchment]), 6,
                  { speed: 70, life: 0.85, gravity: 40, lift: 20 });
        }
        board.splice(r, 1);
        board.unshift(new Array(COLS).fill(null));
        cleared++;
        r++;
      }
    }
    if (!cleared) return;
    housed += cleared;
    g.score += [0, 100, 260, 460, 800][cleared];
    lastHousehold = Arcade.pick(HOUSEHOLDS);
    toastT = 2.4;
    clearAnim = 0.5;
    g.kick(cleared >= 3 ? 6 : 3);
    g.flash(cleared >= 4 ? P.goldLite : P.olive, 0.28);
    dropSpeed = Math.max(0.11, 0.62 - housed * 0.022);
  }

  Arcade.create({
    id: "living-stones",
    canvas: "#screen",
    width: W, height: H,
    title: "LIVING STONES",
    subtitle: "Build a house, not a barrier.",
    howto: "LEFT RIGHT MOVE - UP TURN - DOWN HURRY - SPACE DROP",
    verse: '"THE STRANGER WHO SOJOURNS WITH YOU SHALL BE AS THE NATIVE AMONG YOU" LEV. 19:34',
    scoreLabel: "SHELTER RAISED",
    moral: "A WALL COUNTS WHO IS KEPT OUT. A HOUSE COUNTS WHO IS TAKEN IN.",

    reset: function () {
      board = emptyBoard();
      piece = spawn(Arcade.pick(KINDS));
      nextKind = Arcade.pick(KINDS);
      dropTimer = 0; dropSpeed = 0.62; moveTimer = 0;
      housed = 0; lastHousehold = ""; toastT = 0; clearAnim = 0; lockFlash = 0;
      stars = [];
      for (var i = 0; i < 30; i++) {
        stars.push({ x: Arcade.randInt(0, W), y: Arcade.randInt(0, 44), p: Math.random() * 6 });
      }
    },

    update: function (g, dt) {
      if (g.pressed("left") && !occupied(piece.cells, piece.x - 1, piece.y)) { piece.x--; moveTimer = 0.17; }
      if (g.pressed("right") && !occupied(piece.cells, piece.x + 1, piece.y)) { piece.x++; moveTimer = 0.17; }
      moveTimer -= dt;
      if (moveTimer <= 0) {
        if (g.held("left") && !occupied(piece.cells, piece.x - 1, piece.y)) { piece.x--; moveTimer = 0.06; }
        else if (g.held("right") && !occupied(piece.cells, piece.x + 1, piece.y)) { piece.x++; moveTimer = 0.06; }
      }

      if (g.pressed("up")) rotate(piece);

      if (g.pressed("action")) {
        while (!occupied(piece.cells, piece.x, piece.y + 1)) piece.y++;
        g.score += 6;
        lock(g);
        return;
      }

      dropTimer += dt * (g.held("down") ? 9 : 1);
      if (dropTimer >= dropSpeed) {
        dropTimer = 0;
        if (!occupied(piece.cells, piece.x, piece.y + 1)) piece.y++;
        else lock(g);
      }

      if (toastT > 0) toastT -= dt;
      if (clearAnim > 0) clearAnim -= dt;
      if (lockFlash > 0) lockFlash -= dt;
    },

    draw: function (g) {
      /* ---- night sky over the building site ---- */
      g.gradient(0, 0, W, 46, "#0c1428", "#16203c", 6);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var tw = Math.sin(g.wall * 1.4 + s.p) > -0.2;
        if (tw) g.rect(s.x, s.y, 1, 1, i % 5 === 0 ? P.goldLite : "rgba(244,234,216,.55)");
      }
      // A waxing moon over the site.
      var mx = W - 32, my = 8;
      g.rect(mx + 3, my,      8, 1, "#e8e2d4");
      g.rect(mx + 2, my + 1,  10, 1, "#e8e2d4");
      g.rect(mx + 1, my + 2,  11, 3, "#e8e2d4");
      g.rect(mx + 1, my + 5,  11, 3, "#e8e2d4");
      g.rect(mx + 1, my + 8,  11, 2, "#e8e2d4");
      g.rect(mx + 2, my + 10, 10, 1, "#e8e2d4");
      g.rect(mx + 3, my + 11, 8, 1, "#e8e2d4");
      // the shadowed limb, cut back out of it
      g.rect(mx,     my + 2,  4, 8, "#0e1730");
      g.rect(mx + 1, my + 1,  3, 2, "#0e1730");
      g.rect(mx + 1, my + 10, 3, 2, "#0e1730");
      g.rect(mx + 6, my + 3,  2, 2, "#cfc7b4");
      g.rect(mx + 8, my + 7,  2, 2, "#cfc7b4");

      g.gradient(0, 46, W, H - 46, "#0a1120", "#070b16", 4);

      /* ---- title bar ---- */
      g.textShadow("LIVING STONES", 10, 10, 2, P.goldLite);
      g.text("BUILD A HOUSE, NOT A BARRIER", 10, 30, 1, P.dim);

      /* ---- the site: a foundation the board rests on ---- */
      g.rect(BX - 4, BY - 3, BW + 8, BH + 8, "#0c1322");
      g.frameRect(BX - 4, BY - 3, BW + 8, BH + 8, "rgba(217,164,65,.4)", 1);
      g.rect(BX - 4, BY + BH + 5, BW + 8, 3, "#2a3560");         // the ground it stands on

      // faint grid, so shapes read against the well
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          if ((r + c) % 2 === 0) g.rect(BX + c * CELL, BY + r * CELL, CELL, CELL, "#0d1526");
        }
      }
      // scaffolding uprights
      for (r = 0; r <= ROWS; r += 6) g.rect(BX, BY + r * CELL, BW, 1, "rgba(127,178,221,.07)");

      /* ---- settled stones ---- */
      for (r = 0; r < ROWS; r++) {
        for (c = 0; c < COLS; c++) {
          if (board[r][c]) drawStone(g, BX + c * CELL, BY + r * CELL, board[r][c], CELL);
        }
      }

      /* ---- ghost: where the stone will come to rest ---- */
      var gy = piece.y;
      while (!occupied(piece.cells, piece.x, gy + 1)) gy++;
      for (i = 0; i < piece.cells.length; i++) {
        var gx = BX + (piece.cells[i][0] + piece.x) * CELL;
        var gyy = BY + (piece.cells[i][1] + gy) * CELL;
        g.frameRect(gx, gyy, CELL, CELL, "rgba(255,203,107,.22)", 1);
        g.rect(gx + CELL / 2 - 1, gyy + CELL / 2 - 1, 2, 2, "rgba(255,203,107,.30)");
      }

      /* ---- the stone in hand ---- */
      for (i = 0; i < piece.cells.length; i++) {
        var x = BX + (piece.cells[i][0] + piece.x) * CELL;
        var y = BY + (piece.cells[i][1] + piece.y) * CELL;
        if (y >= BY - CELL) drawStone(g, x, y, piece.kind, CELL, lockFlash > 0);
      }

      /* ---- builder's board on the right ---- */
      var px = PANEL_X, pw = W - PANEL_X - 10;

      g.panel(px, BY - 3, pw, 56, "#111a2e", "rgba(217,164,65,.35)");
      g.text("NEXT", px + 6, BY + 3, 1, P.dim);
      var np = SHAPES[nextKind], minx = 9, miny = 9;
      for (i = 0; i < np.length; i++) { minx = Math.min(minx, np[i][0]); miny = Math.min(miny, np[i][1]); }
      for (i = 0; i < np.length; i++) {
        drawStone(g, px + 22 + (np[i][0] - minx) * 10, BY + 18 + (np[i][1] - miny) * 10, nextKind, 10);
      }

      g.panel(px, BY + 62, pw, 44, "#111a2e", "rgba(217,164,65,.35)");
      g.text("SHELTER", px + 6, BY + 68, 1, P.dim);
      g.textShadow(String(g.score), px + 6, BY + 80, 2, P.goldLite);

      g.panel(px, BY + 112, pw, 34, "#111a2e", "rgba(217,164,65,.35)");
      g.text("BEST", px + 6, BY + 118, 1, P.dim);
      g.text(String(g.best), px + 6, BY + 130, 1, P.parchment);

      // The last household taken in, announced by name.
      if (toastT > 0) {
        var a = Math.min(1, toastT * 2);
        g.ctx.globalAlpha = a;
        g.panel(px, BY + 152, pw, 54, "rgba(79,125,90,.30)", P.oliveLite);
        g.text("HOUSED", px + 6, BY + 158, 1, P.oliveLite);
        g.textBlock(lastHousehold, px + 6, BY + 172, pw - 12, 1, P.parchment);
        g.ctx.globalAlpha = 1;
      } else {
        g.panel(px, BY + 152, pw, 54, "rgba(28,39,72,.35)", "rgba(217,164,65,.18)");
        g.textBlock("CLEAR A ROW TO TAKE A HOUSEHOLD IN", px + 6, BY + 158, pw - 12, 1, P.dimmer);
      }

      /* ---- the street below: one house per household ---- */
      var sy = BY + BH + 6;                       // 268; screen is 288 tall
      g.text("HOUSED", 10, sy, 1, P.dim);
      if (!housed) {
        g.text("NOBODY YET", 52, sy, 1, P.dimmer);
      }
      var shown = Math.min(housed, 19);
      for (i = 0; i < shown; i++) {
        var hx = 10 + i * 12;
        var pop = clearAnim > 0 && i >= housed - 4 ? 1 : 0;
        g.sprite(HOUSE, hx, sy + 11 - pop, 1, { "#": i % 3 === 0 ? P.gold : P.oliveLite });
      }
      if (housed > 19) g.text("+" + (housed - 19), 10 + 19 * 12, sy + 13, 1, P.gold);
    }
  });

  /* ---------- materials ---------- */

  function drawStone(g, x, y, kind, size, hot) {
    var m = MAT[kind];
    g.rect(x, y, size, size, hot ? m.lite : m.base);
    g.rect(x, y, size, 1, m.lite);                       // lit top edge
    g.rect(x, y, 1, size, "rgba(255,255,255,.14)");
    g.rect(x, y + size - 1, size, 1, m.dark);            // shadowed underside
    g.rect(x + size - 1, y, 1, size, m.dark);

    if (m.kind === "brick") {
      g.rect(x + 1, y + Math.floor(size / 2), size - 2, 1, "rgba(0,0,0,.28)");
      g.rect(x + Math.floor(size / 2), y + 1, 1, Math.floor(size / 2) - 1, "rgba(0,0,0,.22)");
    } else if (m.kind === "beam") {
      g.rect(x + 2, y + 3, size - 4, 1, "rgba(0,0,0,.20)");
      g.rect(x + 2, y + size - 4, size - 4, 1, "rgba(0,0,0,.20)");
    } else if (m.kind === "shingle") {
      g.rect(x + 1, y + 3, size - 2, 1, "rgba(0,0,0,.25)");
      g.rect(x + 1, y + 7, size - 2, 1, "rgba(0,0,0,.25)");
    } else {                                              // stone: a chipped face
      g.rect(x + 3, y + 3, 2, 2, "rgba(255,255,255,.16)");
      g.rect(x + size - 5, y + size - 5, 2, 2, "rgba(0,0,0,.20)");
    }
  }
})();
