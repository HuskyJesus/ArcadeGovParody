/* ============================================================
   ENUMERATED  —  counters "Flappy Bill" (Flappy Bird)
   Same eagle, same bill, same tap-to-fly. Opposite premise:
   the bill does not simply sail down the Mall to applause.
   It must fit through the gates. Earmarks make it heavy.
   Striking clauses makes it light. Small bills fly.
   ============================================================ */
(function () {
  "use strict";
  var P = Arcade.P;

  var W = 300, H = 280;
  var GROUND = H - 30;
  var GATE_W = 28;

  var STAGES = ["COMMITTEE","DEBATE","THE HOUSE","THE SENATE","CONFERENCE","THE DESK","THE COURTS","THE PEOPLE"];

  var RIDERS = [
    "A BRIDGE IN NO ONE'S DISTRICT", "A CARVE-OUT FOR ONE FIRM",
    "A MUSEUM NAMED FOR THE SPONSOR", "A SUBSIDY WITH A NAME ON IT",
    "AN EXEMPTION FOR THE AUTHORS", "A GRANT TO A DONOR'S COUSIN"
  ];

  // Wings up and wings down. The white head and gold beak read at a glance,
  // which matters when the bird is the only thing you are steering.
  var EAGLE_UP = [
    "..DD......",
    ".DDDD.....",
    "..DDDWWW..",
    "...DWWWWYY",
    "...BWWWKY.",
    "..BBBBBB..",
    "...BBBB...",
    "....BB...."
  ];
  var EAGLE_DOWN = [
    "......WWW.",
    ".....WWWWY",
    "....BWWWKY",
    "...BBBBBB.",
    "..BDBBBB..",
    ".DDDBBB...",
    ".DDD......",
    "..D......."
  ];
  var EAGLE_KEY = { W: "#f4ead8", Y: "#d9a441", B: "#6b4226", D: "#4a2f1c", K: "#1a1a1a" };

  var GAVEL = [
    ".GGGGG.",
    "GGGGGGG",
    ".GGGGG.",
    "...HH..",
    "...HH..",
    "...HH.."
  ];
  var GAVEL_KEY = { G: "#ffcb6b", H: "#8a5a3b" };

  var PORK = [
    ".RRRRR.",
    "RRRRRRR",
    "RLRRRLR",
    "RRRRRRR",
    ".RRRRR.",
    "..R.R.."
  ];
  var PORK_KEY = { R: "#b3313a", L: "#e8646d" };

  var bird, gates, pickups, spawnT, scroll, pages, stageIdx, toast, toastT,
      passed, clouds, farBg;

  function weight() { return 1 + (pages - 6) * 0.11; }
  function billH()  { return Arcade.clamp(7 + pages * 1.6, 11, 46); }

  function spawnGate(x) {
    var gap = Arcade.clamp(102 - passed * 1.7, 66, 102);
    var top = Arcade.randInt(24, GROUND - gap - 24);
    gates.push({ x: x, top: top, gap: gap, scored: false, label: STAGES[stageIdx % STAGES.length] });
    stageIdx++;

    var kind = Math.random() < 0.5 ? "strike" : "rider";
    pickups.push({
      x: x + 80, y: Arcade.randInt(30, GROUND - 34),
      kind: kind, taken: false,
      text: kind === "rider" ? Arcade.pick(RIDERS) : "STRIKE A CLAUSE"
    });
  }

  Arcade.create({
    id: "enumerated",
    canvas: "#screen",
    width: W, height: H,
    title: "ENUMERATED",
    subtitle: "Carry the bill through every gate in its way.",
    howto: "SPACE OR UP TO FLY - TAKE THE GAVELS - DODGE THE PORK",
    verse: '"THE POWERS DELEGATED BY THE CONSTITUTION ARE FEW AND DEFINED" FEDERALIST 45',
    scoreLabel: "GATES PASSED",
    moral: "THEIR BIRD CARRIES THE BILL UNOPPOSED. OURS EARNS EVERY GATE, AND FLIES HIGHER THE LESS IT CARRIES.",

    reset: function () {
      bird = { x: 62, y: H / 2, v: 0, flap: 0 };
      gates = []; pickups = [];
      spawnT = 0; scroll = 80; pages = 6; stageIdx = 0;
      toast = ""; toastT = 0; passed = 0;
      clouds = [];
      for (var i = 0; i < 5; i++) {
        clouds.push({ x: Arcade.rand(0, W), y: Arcade.rand(14, 70), s: Arcade.rand(0.3, 0.7), w: Arcade.randInt(16, 34) });
      }
      farBg = 0;
      spawnGate(W + 40);
    },

    update: function (g, dt) {
      var w = weight();

      if (g.pressed("action") || g.pressed("up")) {
        bird.v = -132 / Math.sqrt(w);
        bird.flap = 0.16;
        g.burst(bird.x + 2, bird.y + 8, "rgba(244,234,216,.5)", 3,
                { speed: 26, angle: Math.PI * 0.75, spread: 0.8, gravity: 30, life: 0.35 });
      }
      bird.v += 350 * w * dt;
      bird.y += bird.v * dt;
      if (bird.flap > 0) bird.flap -= dt;

      if (bird.y < 4) { bird.y = 4; bird.v = 0; }
      if (bird.y + billH() > GROUND) {
        g.kick(7); g.flash(P.crimson, 0.35);
        g.gameOver("The bill came down on the Mall. " + pages + " pages was too much to carry.");
        return;
      }

      if (toastT > 0) toastT -= dt;
      scroll = 80 + passed * 1.5;
      farBg += scroll * dt * 0.12;

      for (var i = 0; i < clouds.length; i++) {
        clouds[i].x -= scroll * dt * clouds[i].s * 0.25;
        if (clouds[i].x < -40) { clouds[i].x = W + 20; clouds[i].y = Arcade.rand(14, 70); }
      }

      for (i = gates.length - 1; i >= 0; i--) {
        var gt = gates[i];
        gt.x -= scroll * dt;
        var bh = billH();
        var hitX = bird.x + 20 > gt.x && bird.x < gt.x + GATE_W;
        if (hitX && (bird.y < gt.top || bird.y + bh > gt.top + gt.gap)) {
          g.kick(7); g.flash(P.crimson, 0.35);
          g.gameOver("Stopped at " + gt.label + ". A bill this size does not fit through.");
          return;
        }
        if (!gt.scored && gt.x + GATE_W < bird.x) {
          gt.scored = true; passed++;
          g.score += 25 + Math.max(0, (12 - pages)) * 5;
          toast = "PASSED " + gt.label; toastT = 1.8;
          g.burst(gt.x + GATE_W, gt.top + gt.gap / 2, P.goldLite, 6, { speed: 50, gravity: 10 });
        }
        if (gt.x < -GATE_W) gates.splice(i, 1);
      }

      for (i = pickups.length - 1; i >= 0; i--) {
        var pu = pickups[i];
        pu.x -= scroll * dt;
        if (!pu.taken &&
            Math.abs((bird.x + 10) - pu.x) < 13 &&
            Math.abs((bird.y + billH() / 2) - pu.y) < 15) {
          pu.taken = true;
          if (pu.kind === "strike") {
            pages = Math.max(2, pages - 2);
            g.score += 40;
            toast = "CLAUSE STRUCK. " + pages + " PAGES.";
            g.flash(P.gold, 0.2);
            g.burst(pu.x, pu.y, P.goldLite, 12, { speed: 70 });
          } else {
            pages += 3;
            toast = "RIDER ATTACHED: " + pu.text;
            g.kick(4); g.flash(P.crimson, 0.25);
            g.burst(pu.x, pu.y, P.crimsonLite, 12, { speed: 70 });
          }
          toastT = 2.4;
        }
        if (pu.x < -30) pickups.splice(i, 1);
      }

      spawnT += dt;
      if (spawnT > 1.95) { spawnT = 0; spawnGate(W + 30); }
    },

    draw: function (g) {
      /* ---- sky ---- */
      g.gradient(0, 0, W, GROUND, "#16234a", "#243a63", 8);
      // stars fading near the top
      for (var s = 0; s < 22; s++) {
        var sx = (s * 71) % W, sy = (s * 37) % 60;
        g.rect(sx, sy, 1, 1, "rgba(244,234,216,.22)");
      }

      /* ---- clouds ---- */
      for (var i = 0; i < clouds.length; i++) {
        var cl = clouds[i];
        g.rect(cl.x, cl.y, cl.w, 4, "rgba(127,178,221,.10)");
        g.rect(cl.x + 5, cl.y - 3, cl.w - 12, 3, "rgba(127,178,221,.10)");
      }

      /* ---- the Mall: dome, obelisk, memorial, in parallax ---- */
      // Two parallax layers: a far ridge of rooftops, then the monuments.
      var far = (farBg * 0.45) % 60;
      for (var fb = -60; fb < W + 60; fb += 60) {
        var fx = fb - far;
        g.rect(fx, GROUND - 26, 24, 26, "#15203c");
        g.rect(fx + 28, GROUND - 34, 16, 34, "#15203c");
        g.rect(fx + 46, GROUND - 20, 12, 20, "#15203c");
      }
      var px = farBg % 220;
      drawDome(g, 20 - px, 100);
      drawObelisk(g, 132 - px, 46);
      drawMemorial(g, 214 - px, 108);
      drawDome(g, 240 - px, 100);
      drawObelisk(g, 352 - px, 46);
      drawMemorial(g, 434 - px, 108);

      /* ---- ground: the Mall lawn and reflecting pool ---- */
      g.rect(0, GROUND, W, H - GROUND, "#1b2a1c");
      g.rect(0, GROUND, W, 2, "#3d5a34");
      var lawn = Math.floor((g.wall * scroll * 0.4) % 16);
      for (i = -16; i < W + 16; i += 16) {
        g.rect(i - lawn, GROUND + 5, 8, 1, "rgba(61,90,52,.6)");
      }

      /* ---- gates as marble columns ---- */
      for (i = 0; i < gates.length; i++) {
        var gt = gates[i];
        drawColumn(g, gt.x, 0, gt.top, true);
        drawColumn(g, gt.x, gt.top + gt.gap, GROUND - (gt.top + gt.gap), false);
        // the gate's name on a plaque above the gap
        var ly = Math.max(6, gt.top - 13);
        var lw = g.textWidth(gt.label, 1) + 6;
        g.rect(gt.x + GATE_W / 2 - lw / 2, ly - 2, lw, 11, "rgba(6,9,20,.8)");
        g.frameRect(gt.x + GATE_W / 2 - lw / 2, ly - 2, lw, 11, "rgba(217,164,65,.6)", 1);
        g.text(gt.label, gt.x + GATE_W / 2, ly + 1, 1, P.gold, "center");
      }

      /* ---- pickups ---- */
      for (i = 0; i < pickups.length; i++) {
        var pu = pickups[i];
        if (pu.taken) continue;
        var bob = Math.round(Math.sin(g.wall * 4 + pu.x * 0.05) * 2);
        if (pu.kind === "strike") {
          g.ctx.globalAlpha = 0.28;
          g.rect(pu.x - 9, pu.y - 8 + bob, 18, 16, P.goldLite);
          g.ctx.globalAlpha = 1;
          g.sprite(GAVEL, pu.x - 3, pu.y - 6 + bob, 1, GAVEL_KEY);
          g.text("STRIKE", pu.x, pu.y - 18 + bob, 1, P.goldLite, "center");
        } else {
          g.sprite(PORK, pu.x - 3, pu.y - 6 + bob, 1, PORK_KEY);
          g.text("PORK", pu.x, pu.y - 18 + bob, 1, P.crimsonLite, "center");
        }
      }

      /* ---- the eagle and the bill it is carrying ---- */
      var bh = billH();
      var art = bird.flap > 0 ? EAGLE_UP : EAGLE_DOWN;
      // the bill hangs from the talons and grows with every rider
      var bx = bird.x + 6, by = bird.y + 17;
      g.rect(bx, by, 13, bh, "#e6d8bd");
      g.rect(bx, by, 13, 1, "#fdf6e6");
      g.frameRect(bx, by, 13, bh, "#8a7a5a", 1);
      for (var ln = 3; ln < bh - 2; ln += 4) {
        g.rect(bx + 2, by + ln, 9, 1, "rgba(90,80,60,.5)");
      }
      if (pages > 10) g.rect(bx, by, 13, bh, "rgba(179,49,58,.12)");
      g.rect(bx + 1, by - 2, 2, 3, "#8a5a3b");                   // talons
      g.rect(bx + 10, by - 2, 2, 3, "#8a5a3b");
      g.sprite(art, bird.x - 4, bird.y - 4, 2, EAGLE_KEY);

      /* ---- HUD ---- */
      g.rect(0, 0, W, 20, "rgba(4,6,13,.72)");
      g.rect(0, 20, W, 1, "rgba(217,164,65,.3)");
      g.text("PAGES", 8, 4, 1, P.dim);
      g.text(String(pages), 8 + 38, 4, 1, pages > 10 ? P.crimsonLite : P.oliveLite);
      // a little page-weight bar
      var pw = Arcade.clamp(pages, 0, 24);
      g.rect(8, 13, 48, 3, "#141c33");
      g.rect(8, 13, Math.round(pw * 2), 3, pages > 10 ? P.crimson : P.olive);

      g.text("GATES " + passed, W / 2, 6, 1, P.parchment, "center");
      g.textShadow(String(g.score), W - 8, 5, 1, P.goldLite, "right");

      /* ---- ticker ---- */
      if (toastT > 0) {
        g.ctx.globalAlpha = Math.min(1, toastT * 2);
        var tc = toast.indexOf("RIDER") === 0 ? P.crimsonLite
               : toast.indexOf("CLAUSE") === 0 ? P.goldLite : P.parchment;
        g.textBlock(toast, W / 2, GROUND + 9, W - 16, 1, tc, "center");
        g.ctx.globalAlpha = 1;
      } else {
        g.text("A SHORT BILL FLIES HIGHER", W / 2, GROUND + 12, 1, "rgba(139,151,184,.5)", "center");
      }
    }
  });

  /* ---------- the Mall ---------- */

  function drawDome(g, x, baseY) {
    var c = "#1b2749", l = "#243358";
    g.rect(x, baseY, 52, 34, c);
    g.rect(x, baseY, 52, 1, l);
    for (var i = 3; i < 52; i += 6) g.rect(x + i, baseY + 4, 2, 30, "rgba(255,255,255,.05)");
    g.rect(x + 16, baseY - 16, 20, 16, c);
    g.rect(x + 19, baseY - 22, 14, 6, c);
    g.rect(x + 23, baseY - 27, 6, 5, c);
    g.rect(x + 25, baseY - 31, 2, 4, "#d9a441");
    g.rect(x + 16, baseY - 16, 20, 1, l);
  }

  function drawObelisk(g, x, topY) {
    g.rect(x, topY, 11, 90, "#1b2749");
    g.rect(x, topY, 1, 90, "#243358");
    g.rect(x + 2, topY - 5, 7, 5, "#1b2749");
    g.rect(x + 4, topY - 8, 3, 3, "#243358");
    g.rect(x + 3, topY + 30, 5, 1, "rgba(179,49,58,.5)");   // aircraft light
  }

  function drawMemorial(g, x, baseY) {
    g.rect(x, baseY, 40, 26, "#1b2749");
    g.rect(x, baseY, 40, 1, "#243358");
    g.rect(x - 3, baseY + 24, 46, 3, "#182240");
    for (var i = 2; i < 40; i += 5) g.rect(x + i, baseY + 3, 2, 21, "rgba(255,255,255,.05)");
  }

  function drawColumn(g, x, y, h, capitalAtBottom) {
    if (h <= 0) return;
    g.rect(x, y, GATE_W, h, "#2a3560");
    g.gradient(x, y, GATE_W, h, "#313e6e", "#232d54", 3);
    // fluting
    for (var f = 4; f < GATE_W - 3; f += 6) {
      g.rect(x + f, y + 2, 1, Math.max(0, h - 4), "rgba(255,255,255,.07)");
      g.rect(x + f + 1, y + 2, 1, Math.max(0, h - 4), "rgba(0,0,0,.14)");
    }
    g.frameRect(x, y, GATE_W, h, "rgba(217,164,65,.45)", 1);
    // a capital at the end nearest the gap
    var cy = capitalAtBottom ? y + h - 7 : y;
    g.rect(x - 2, cy, GATE_W + 4, 7, "#3a4878");
    g.rect(x - 2, cy, GATE_W + 4, 1, "#59689e");
    g.frameRect(x - 2, cy, GATE_W + 4, 7, "rgba(217,164,65,.55)", 1);
  }
})();
