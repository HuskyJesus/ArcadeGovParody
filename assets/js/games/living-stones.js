/* ============================================================
   LIVING STONES  —  counters "Build the Wall" (Tetris)
   Same falling-block fitting. Opposite purpose: the stones are
   timber and brick, and a completed row is a family housed.
   Nothing is walled out; something is raised up.
   ============================================================ */
(function () {
  "use strict";
  var P = Arcade.P;

  var COLS = 10, ROWS = 18, CELL = 12;
  var BX = 14, BY = 22;                 // board origin on the 240x260 screen

  var SHAPES = {
    I: [[0,1],[1,1],[2,1],[3,1]],
    O: [[1,0],[2,0],[1,1],[2,1]],
    T: [[1,0],[0,1],[1,1],[2,1]],
    S: [[1,0],[2,0],[0,1],[1,1]],
    Z: [[0,0],[1,0],[1,1],[2,1]],
    J: [[0,0],[0,1],[1,1],[2,1]],
    L: [[2,0],[0,1],[1,1],[2,1]]
  };
  var COLORS = {
    I: "#8a5a3b", O: "#b3813a", T: "#a0522d",
    S: "#4f7d5a", Z: "#6b4226", J: "#7fb2dd", L: "#d9a441"
  };
  var KINDS = ["I","O","T","S","Z","J","L"];

  // Every cleared row houses a household. Names, not numbers.
  var HOUSEHOLDS = [
    "THE RUIZ FAMILY", "A WIDOW, AGE 81", "THREE ORPHANS",
    "A NIGHT NURSE", "A DAY LABORER", "THE OKONKWO FAMILY",
    "A REFUGEE COUPLE", "A VETERAN", "THE NGUYEN FAMILY",
    "A SINGLE FATHER", "A FARMHAND", "THE HALEVI FAMILY"
  ];

  var board, piece, nextKind, dropTimer, dropSpeed, housed, lastHousehold, toastT, shakeT, moveTimer;

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
    // Rotate about the piece's local centre, then wall-kick a step at a time.
    var maxX = 0, maxY = 0, i;
    for (i = 0; i < p.cells.length; i++) {
      maxX = Math.max(maxX, p.cells[i][0]);
      maxY = Math.max(maxY, p.cells[i][1]);
    }
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
      board[y][x] = COLORS[piece.kind];
    }
    clearRows(g);
    piece = spawn(nextKind);
    nextKind = Arcade.pick(KINDS);
    if (occupied(piece.cells, piece.x, piece.y)) {
      g.gameOver("The site is full to the rafters. Rest, and start again.");
    }
  }

  function clearRows(g) {
    var cleared = 0;
    for (var r = ROWS - 1; r >= 0; r--) {
      var full = true;
      for (var c = 0; c < COLS; c++) if (!board[r][c]) { full = false; break; }
      if (full) {
        board.splice(r, 1);
        board.unshift(new Array(COLS).fill(null));
        cleared++;
        r++;
      }
    }
    if (!cleared) return;
    housed += cleared;
    // Four at once is a whole tenement raised: honoured accordingly.
    var bonus = [0, 100, 260, 460, 800][cleared];
    g.score += bonus;
    lastHousehold = Arcade.pick(HOUSEHOLDS);
    toastT = 2.2;
    shakeT = 0.18;
    dropSpeed = Math.max(0.11, 0.62 - housed * 0.022);
  }

  var game = Arcade.create({
    id: "living-stones",
    canvas: "#screen",
    width: 240, height: 260,
    title: "LIVING STONES",
    subtitle: "Build a house, not a barrier.",
    howto: "LEFT/RIGHT move  UP rotate  DOWN hurry  SPACE drop",
    verse: '"The stranger who sojourns with you shall be to you as the native among you." Lev. 19:34',
    scoreLabel: "SHELTER",
    moral: "A wall counts who is kept out. A house counts who is taken in.",

    reset: function (g) {
      board = emptyBoard();
      piece = spawn(Arcade.pick(KINDS));
      nextKind = Arcade.pick(KINDS);
      dropTimer = 0; dropSpeed = 0.62;
      housed = 0; lastHousehold = ""; toastT = 0; shakeT = 0;
      moveTimer = 0;
    },

    update: function (g, dt) {
      // Horizontal movement: a tap steps once, a hold auto-repeats.
      if (g.pressed("left") && !occupied(piece.cells, piece.x - 1, piece.y)) { piece.x--; moveTimer = 0.17; }
      if (g.pressed("right") && !occupied(piece.cells, piece.x + 1, piece.y)) { piece.x++; moveTimer = 0.17; }
      moveTimer -= dt;
      if (moveTimer <= 0) {
        if (g.held("left") && !occupied(piece.cells, piece.x - 1, piece.y)) { piece.x--; moveTimer = 0.06; }
        else if (g.held("right") && !occupied(piece.cells, piece.x + 1, piece.y)) { piece.x++; moveTimer = 0.06; }
      }

      if (g.pressed("up")) rotate(piece);

      if (g.pressed("action")) {                 // hard drop
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
      if (shakeT > 0) shakeT -= dt;
    },

    draw: function (g, ctx) {
      g.clear("#070b16");

      var shake = shakeT > 0 ? Math.round(Math.sin(shakeT * 90) * 2) : 0;
      ctx.save();
      ctx.translate(0, shake);

      // Header
      g.text("LIVING STONES", 8, 6, 8, P.goldLite);
      g.text("HOUSED " + (housed || 0), 232, 7, 7, P.oliveLite, "right");

      // Board well
      g.rect(BX - 2, BY - 2, COLS * CELL + 4, ROWS * CELL + 4, "#151d33");
      g.frameRect(BX - 2, BY - 2, COLS * CELL + 4, ROWS * CELL + 4, "rgba(217,164,65,.45)", 1);

      var r, c;
      for (r = 0; r < ROWS; r++) {
        for (c = 0; c < COLS; c++) {
          var px = BX + c * CELL, py = BY + r * CELL;
          if (board[r][c]) drawStone(g, px, py, board[r][c]);
          else if ((r + c) % 2 === 0) g.rect(px, py, CELL, CELL, "#0d1424");
        }
      }

      // Ghost: where the stone will come to rest.
      var gy = piece.y;
      while (!occupied(piece.cells, piece.x, gy + 1)) gy++;
      for (var i = 0; i < piece.cells.length; i++) {
        var gx = BX + (piece.cells[i][0] + piece.x) * CELL;
        var gyy = BY + (piece.cells[i][1] + gy) * CELL;
        g.frameRect(gx, gyy, CELL, CELL, "rgba(255,203,107,.28)", 1);
      }

      for (i = 0; i < piece.cells.length; i++) {
        var x = BX + (piece.cells[i][0] + piece.x) * CELL;
        var y = BY + (piece.cells[i][1] + piece.y) * CELL;
        if (y >= BY - CELL) drawStone(g, x, y, COLORS[piece.kind]);
      }

      // Side panel
      var sx = BX + COLS * CELL + 12;
      g.text("NEXT", sx, BY + 2, 7, P.dim);
      var np = SHAPES[nextKind];
      for (i = 0; i < np.length; i++) {
        drawStone(g, sx + np[i][0] * 9, BY + 16 + np[i][1] * 9, COLORS[nextKind], 9);
      }

      g.text("SHELTER", sx, BY + 50, 7, P.dim);
      g.text(String(g.score), sx, BY + 62, 8, P.goldLite);
      g.text("BEST", sx, BY + 84, 7, P.dim);
      g.text(String(g.best), sx, BY + 96, 7, P.parchment);

      // A cleared row is a household with a name.
      if (toastT > 0) {
        g.rect(sx - 2, BY + 122, 66, 46, "rgba(79,125,90,.25)");
        g.frameRect(sx - 2, BY + 122, 66, 46, P.oliveLite, 1);
        g.textBlock("HOUSED:", sx + 2, BY + 127, 60, 6, P.oliveLite);
        g.textBlock(lastHousehold, sx + 2, BY + 139, 60, 6, P.parchment);
      }

      ctx.restore();
    }
  });

  function drawStone(g, x, y, color, size) {
    var s = size || CELL;
    g.rect(x, y, s, s, color);
    g.rect(x, y, s, 1, "rgba(255,255,255,.30)");          // mortar highlight
    g.rect(x, y + s - 1, s, 1, "rgba(0,0,0,.35)");
    g.rect(x + s - 1, y, 1, s, "rgba(0,0,0,.30)");
  }
})();
