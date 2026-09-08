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

  var W = 280, H = 260;
  var GROUND = H - 26;
  var GATE_W = 26;

  var STAGES = [
    "COMMITTEE", "FLOOR DEBATE", "THE HOUSE", "THE SENATE",
    "CONFERENCE", "THE PRESIDENT", "THE COURTS", "THE PEOPLE"
  ];

  var RIDERS = [
    "A BRIDGE IN NO ONE'S DISTRICT", "A CARVE-OUT FOR ONE FIRM",
    "A MUSEUM OF THE SPONSOR", "A SUBSIDY WITH A NAME ON IT",
    "AN EXEMPTION FOR THE AUTHORS", "A GRANT TO A DONOR'S COUSIN"
  ];

  var bird, gates, pickups, spawnT, scroll, pages, stage, toast, toastT, passed;

  function reset() {
    bird = { x: 58, y: H / 2, v: 0, flap: 0 };
    gates = []; pickups = [];
    spawnT = 0; scroll = 76; pages = 6; stage = 0;
    toast = ""; toastT = 0; passed = 0;
    spawnGate(W + 40);
  }

  // Heavier bills sink faster and take a bigger flap to lift. That is the whole argument.
  function weight() { return 1 + (pages - 6) * 0.11; }
  function billH()  { return Arcade.clamp(8 + pages * 1.5, 12, 44); }

  function spawnGate(x) {
    var gap = Arcade.clamp(96 - passed * 1.6, 62, 96);
    var top = Arcade.randInt(26, GROUND - gap - 26);
    gates.push({ x: x, top: top, gap: gap, scored: false, label: STAGES[stage % STAGES.length] });
    stage++;

    // Between gates: a clause you may strike, or an earmark you should dodge.
    var kind = Math.random() < 0.5 ? "strike" : "rider";
    pickups.push({
      x: x + 74,
      y: Arcade.randInt(32, GROUND - 32),
      kind: kind,
      taken: false,
      text: kind === "rider" ? Arcade.pick(RIDERS) : "STRIKE A CLAUSE"
    });
  }

  var game = Arcade.create({
    id: "enumerated",
    canvas: "#screen",
    width: W, height: H,
    title: "ENUMERATED",
    subtitle: "Carry the bill through every gate that stands in its way.",
    howto: "SPACE or UP to fly. Take the GAVELS to strike clauses. Dodge the PORK.",
    verse: '"The powers delegated by the Constitution are few and defined." Federalist 45',
    scoreLabel: "GATES PASSED",
    moral: "Their bird carries the bill unopposed. Ours has to earn every gate — and the fewer pages it carries, the higher it flies.",

    reset: reset,

    update: function (g, dt) {
      var w = weight();

      if (g.pressed("action") || g.pressed("up")) {
        bird.v = -128 / Math.sqrt(w);
        bird.flap = 0.16;
      }
      bird.v += 340 * w * dt;
      bird.y += bird.v * dt;
      if (bird.flap > 0) bird.flap -= dt;

      if (bird.y < 6) { bird.y = 6; bird.v = 0; }
      if (bird.y + billH() > GROUND) {
        g.gameOver("The bill came down on the Mall. " + pages + " pages was too much to carry.");
        return;
      }

      if (toastT > 0) toastT -= dt;
      scroll = 76 + passed * 1.4;

      var i;
      for (i = gates.length - 1; i >= 0; i--) {
        var gt = gates[i];
        gt.x -= scroll * dt;

        var bh = billH();
        var hitX = bird.x + 20 > gt.x && bird.x < gt.x + GATE_W;
        if (hitX && (bird.y < gt.top || bird.y + bh > gt.top + gt.gap)) {
          g.gameOver("Stopped at " + gt.label + ". A bill this size does not fit through.");
          return;
        }
        if (!gt.scored && gt.x + GATE_W < bird.x) {
          gt.scored = true; passed++; g.score += 25 + Math.max(0, (12 - pages)) * 5;
          toast = "PASSED " + gt.label; toastT = 1.6;
        }
        if (gt.x < -GATE_W) gates.splice(i, 1);
      }

      for (i = pickups.length - 1; i >= 0; i--) {
        var pu = pickups[i];
        pu.x -= scroll * dt;
        if (!pu.taken &&
            Math.abs((bird.x + 10) - pu.x) < 12 &&
            Math.abs((bird.y + billH() / 2) - pu.y) < 14) {
          pu.taken = true;
          if (pu.kind === "strike") {
            pages = Math.max(2, pages - 2);
            g.score += 40;
            toast = "CLAUSE STRUCK. " + pages + " PAGES.";
          } else {
            pages += 3;
            toast = "RIDER ATTACHED: " + pu.text;
          }
          toastT = 2.2;
        }
        if (pu.x < -30) pickups.splice(i, 1);
      }

      spawnT += dt;
      if (spawnT > 1.95) { spawnT = 0; spawnGate(W + 30); }
    },

    draw: function (g) {
      // Sky over the Mall
      g.clear("#101a33");
      g.rect(0, 0, W, 90, "#16234a");
      for (var s = 0; s < 26; s++) {
        var sx = (s * 47) % W, sy = (s * 29) % 80;
        g.rect(sx, sy, 1, 1, "rgba(244,234,216,.35)");
      }

      // Skyline: a dome and a monument, drawn plainly
      var px = (g.time * 12) % 120;
      g.rect(30 - px, 62, 44, 28, "#1b2749");
      g.rect(44 - px, 46, 16, 18, "#1b2749");
      g.rect(50 - px, 40, 4, 8, "#22315c");
      g.rect(150 - px, 34, 10, 56, "#1b2749");
      g.rect(210 - px, 66, 34, 24, "#1b2749");

      // Ground
      g.rect(0, GROUND, W, H - GROUND, "#1d2a1c");
      g.rect(0, GROUND, W, 2, "#3d5a34");

      // Gates
      for (var i = 0; i < gates.length; i++) {
        var gt = gates[i];
        g.rect(gt.x, 0, GATE_W, gt.top, "#2a3560");
        g.frameRect(gt.x, 0, GATE_W, gt.top, "rgba(217,164,65,.5)", 1);
        var by = gt.top + gt.gap;
        g.rect(gt.x, by, GATE_W, GROUND - by, "#2a3560");
        g.frameRect(gt.x, by, GATE_W, GROUND - by, "rgba(217,164,65,.5)", 1);
        // Fluting, so the gates read as columns
        for (var f = 4; f < GATE_W - 3; f += 6) {
          g.rect(gt.x + f, 2, 1, Math.max(0, gt.top - 4), "rgba(255,255,255,.06)");
          g.rect(gt.x + f, by + 2, 1, Math.max(0, GROUND - by - 4), "rgba(255,255,255,.06)");
        }
        g.text(gt.label.slice(0, 9), gt.x + GATE_W / 2, Math.max(4, gt.top - 12), 5, P.gold, "center");
      }

      // Pickups
      for (i = 0; i < pickups.length; i++) {
        var pu = pickups[i];
        if (pu.taken) continue;
        if (pu.kind === "strike") {
          g.rect(pu.x - 6, pu.y - 3, 12, 5, P.goldLite);      // gavel head
          g.rect(pu.x - 1, pu.y + 2, 3, 9, "#8a5a3b");        // handle
          g.text("STRIKE", pu.x, pu.y - 14, 5, P.goldLite, "center");
        } else {
          g.rect(pu.x - 7, pu.y - 6, 14, 12, P.crimson);
          g.rect(pu.x - 5, pu.y - 4, 10, 8, "#d1616a");
          g.text("PORK", pu.x, pu.y - 16, 5, P.crimson, "center");
        }
      }

      // Eagle carrying the bill
      var bh = billH();
      var flap = bird.flap > 0 ? -3 : 2;
      g.rect(bird.x, bird.y, 18, 12, "#6b4226");             // body
      g.rect(bird.x + 2, bird.y - 4, 10, 6, "#f4ead8");      // white head
      g.rect(bird.x + 12, bird.y - 2, 4, 3, P.gold);         // beak
      g.rect(bird.x + 3, bird.y - 3, 2, 2, "#1a1a1a");       // eye
      g.rect(bird.x - 5, bird.y + flap, 10, 4, "#4a2f1c");   // wing
      // the bill itself, growing with every rider it carries
      g.rect(bird.x + 3, bird.y + 12, 13, bh, "#e6d8bd");
      g.frameRect(bird.x + 3, bird.y + 12, 13, bh, "#8a7a5a", 1);
      for (var ln = 3; ln < bh - 2; ln += 4) {
        g.rect(bird.x + 5, bird.y + 12 + ln, 9, 1, "rgba(90,80,60,.55)");
      }

      // HUD
      g.rect(0, 0, W, 18, "rgba(4,6,13,.72)");
      g.text("PAGES " + pages, 6, 5, 7, pages > 10 ? P.crimson : P.oliveLite);
      g.text("GATES " + passed, W / 2, 5, 7, P.parchment, "center");
      g.text(String(g.score), W - 6, 5, 7, P.goldLite, "right");

      if (toastT > 0) {
        g.textBlock(toast, W / 2, GROUND + 6, W - 16, 6, P.parchment, "center");
      } else {
        g.text("A SHORT BILL FLIES HIGHER", W / 2, GROUND + 8, 6, "rgba(154,166,196,.6)", "center");
      }
    }
  });
})();
