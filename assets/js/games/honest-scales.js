/* ============================================================
   HONEST SCALES  —  counters "Supply Line" (Tapper-style sorting)
   The same conveyor and the same two-key sort. Opposite standard:
   you are not a censor enforcing a slogan on other people's food.
   You are a merchant, and the only thing you reject is a lie.
   Reject an honest crate and you have wronged an honest supplier.
   ============================================================ */
(function () {
  "use strict";
  var P = Arcade.P;

  var W = 288, H = 300;
  var BELT_Y = 150, BELT_H = 30;
  var SCALE_X = 104, SCALE_W = 76;

  var GOODS = [
    { name: "FLOUR",  unit: "LB", color: "#e6d8bd", dark: "#b3a68c" },
    { name: "OLIVES", unit: "LB", color: "#4f7d5a", dark: "#2f4a36" },
    { name: "WOOL",   unit: "LB", color: "#f4ead8", dark: "#c0b49c" },
    { name: "HONEY",  unit: "OZ", color: "#d9a441", dark: "#96701d" },
    { name: "SALT",   unit: "LB", color: "#cfd6e6", dark: "#98a1b5" },
    { name: "COPPER", unit: "LB", color: "#b87333", dark: "#7d4d20" },
    { name: "BARLEY", unit: "LB", color: "#c8a24a", dark: "#8b6f2c" },
    { name: "OIL",    unit: "OZ", color: "#9fbf5a", dark: "#6b8339" }
  ];

  var crate, beltSpeed, trust, fraudBlocked, honestSold, wrongs,
      toast, toastT, ledger, tilt, tiltTarget, judged, judgedT;

  function newCrate() {
    var gd = Arcade.pick(GOODS);
    var label = Arcade.randInt(4, 20);
    var cheat = Math.random() < 0.36;
    var actual = label;
    if (cheat) {
      var short = Math.random() < 0.75;
      var delta = Math.max(1, Math.round(label * Arcade.rand(0.12, 0.35)));
      actual = short ? label - delta : label + delta;
    }
    crate = { good: gd, label: label, actual: actual, honest: !cheat,
              x: W + 20, weighed: false, settled: false };
  }

  function judge(g, sold) {
    if (crate.settled) return;
    crate.settled = true;
    judged = null; judgedT = 1.5;

    if (sold && crate.honest) {
      g.score += 60; honestSold++; trust = Arcade.clamp(trust + 4, 0, 100);
      toast = "FAIR TRADE. " + crate.label + " " + crate.good.unit + " AS PROMISED.";
      judged = { ok: true, word: "FAIR" };
      g.flash(P.olive, 0.22);
      g.burst(W - 40, BELT_Y + 10, P.oliveLite, 10, { speed: 60, lift: 20 });
      ledger.unshift({ t: "SOLD", ok: true, s: crate.good.name });
    } else if (!sold && !crate.honest) {
      g.score += 90; fraudBlocked++; trust = Arcade.clamp(trust + 6, 0, 100);
      toast = "FALSE BALANCE CAUGHT. LABEL " + crate.label + ", TRUE " + crate.actual + ".";
      judged = { ok: true, word: "CAUGHT" };
      g.flash(P.gold, 0.22);
      g.burst(40, BELT_Y + 10, P.goldLite, 10, { speed: 60, lift: 20 });
      ledger.unshift({ t: "REFUSED", ok: true, s: crate.good.name });
    } else if (sold && !crate.honest) {
      wrongs++; trust -= 22;
      toast = "YOU SOLD A LIE. THE BUYER PAID FOR " + crate.label + " AND GOT " + crate.actual + ".";
      judged = { ok: false, word: "FRAUD" };
      g.flash(P.crimson, 0.4); g.kick(6);
      ledger.unshift({ t: "FRAUD", ok: false, s: crate.good.name });
    } else {
      wrongs++; trust -= 16;
      toast = "YOU REFUSED AN HONEST SUPPLIER. HE GOES HOME WITH NOTHING.";
      judged = { ok: false, word: "UNJUST" };
      g.flash(P.crimson, 0.4); g.kick(6);
      ledger.unshift({ t: "UNJUST", ok: false, s: crate.good.name });
    }
    ledger = ledger.slice(0, 4);
    toastT = 2.8;
    beltSpeed = Math.min(72, beltSpeed + 1.6);
    if (trust <= 0) g.gameOver("Word got around. No one trades at a crooked stall.");
  }

  Arcade.create({
    id: "honest-scales",
    canvas: "#screen",
    width: W, height: H,
    title: "HONEST SCALES",
    subtitle: "A just weight is the whole of the law of trade.",
    howto: "DOWN WEIGHS IT - RIGHT SELLS - LEFT REFUSES - JUDGE THE LABEL, NOT THE MAN",
    verse: '"A FALSE BALANCE IS AN ABOMINATION; A JUST WEIGHT IS HIS DELIGHT" PROV. 11:1',
    scoreLabel: "GOOD NAME",
    moral: "THEIR GAME ASKS IF FOOD MEETS THE SLOGAN. THIS ONE ASKS IF THE LABEL TELLS THE TRUTH.",

    reset: function () {
      beltSpeed = 30; trust = 60;
      fraudBlocked = 0; honestSold = 0; wrongs = 0;
      toast = ""; toastT = 0; ledger = [];
      tilt = 0; tiltTarget = 0; judged = null; judgedT = 0;
      newCrate();
    },

    update: function (g, dt) {
      if (toastT > 0) toastT -= dt;
      if (judgedT > 0) judgedT -= dt;

      crate.x -= beltSpeed * dt;
      var onScale = crate.x + 30 > SCALE_X && crate.x < SCALE_X + SCALE_W;

      if (g.held("down") && onScale) crate.weighed = true;

      // The beam settles toward the true weight only while you are weighing.
      tiltTarget = (crate.weighed && onScale)
        ? Arcade.clamp((crate.actual - crate.label) * 0.9, -5, 5) : 0;
      tilt += (tiltTarget - tilt) * Math.min(1, dt * 9);

      if (!crate.settled && onScale) {
        if (g.pressed("right")) judge(g, true);
        else if (g.pressed("left")) judge(g, false);
      }

      if (crate.x < -40) {
        if (!crate.settled) {
          trust -= 10;
          toast = "YOU LET IT PASS WITHOUT LOOKING. NEGLIGENCE IS NOT NEUTRALITY.";
          toastT = 2.8;
          g.flash(P.crimson, 0.25);
          if (trust <= 0) { g.gameOver("You stopped paying attention, and the stall lost its name."); return; }
        }
        newCrate();
      }
    },

    draw: function (g) {
      /* ---- the stall ---- */
      g.gradient(0, 0, W, H, "#0c1322", "#080d18", 6);

      // awning stripes across the top
      for (var i = 0; i < W; i += 16) {
        g.rect(i, 0, 8, 10, "rgba(179,49,58,.55)");
        g.rect(i + 8, 0, 8, 10, "rgba(230,216,189,.16)");
      }
      g.rect(0, 10, W, 2, "rgba(217,164,65,.45)");

      g.textShadow("HONEST SCALES", 12, 20, 2, P.goldLite);

      /* ---- reputation, not a licence ---- */
      g.text("GOOD NAME", 12, 42, 1, P.dim);
      var tw = Math.round(Arcade.clamp(trust, 0, 100) * 1.28);
      g.rect(12, 54, 128, 9, "#141d33");
      var tcol = trust > 45 ? P.olive : trust > 20 ? P.gold : P.crimson;
      g.rect(12, 54, tw, 9, tcol);
      for (var s = 0; s < tw; s += 4) g.rect(12 + s, 54, 1, 9, "rgba(0,0,0,.18)");
      g.frameRect(12, 54, 128, 9, "rgba(217,164,65,.5)", 1);
      if (trust <= 20 && Math.floor(g.wall * 4) % 2 === 0) {
        g.text("YOUR NAME IS GOING", 148, 55, 1, P.crimsonLite);
      }
      g.textShadow(String(g.score), W - 12, 42, 2, P.goldLite, "right");

      /* ---- the inspection bay: a tinted column with corner brackets,
             rather than a floating rectangle ---- */
      var winY = 76, winH = BELT_Y + BELT_H + 6 - winY;
      g.rect(SCALE_X, winY, SCALE_W, winH, "rgba(255,203,107,.045)");
      bracket(g, SCALE_X, winY, 1, 1);
      bracket(g, SCALE_X + SCALE_W - 1, winY, -1, 1);
      bracket(g, SCALE_X, winY + winH - 1, 1, -1);
      bracket(g, SCALE_X + SCALE_W - 1, winY + winH - 1, -1, -1);

      /* ---- the balance, chained to the awning ---- */
      var bx = SCALE_X + SCALE_W / 2, by = 92;
      for (var ch = 14; ch < 72; ch += 6) {                    // chain
        g.rect(bx, ch, 1, 4, "#6f7b99");
      }
      g.rect(bx - 3, 72, 7, 3, "#8b97b8");                     // yoke
      g.text("THE SCALE", bx, 78, 1, P.gold, "center");

      var lift = Math.round(tilt);
      g.rect(bx - 28, by - lift, 56, 2, "#cfd6e6");            // the beam
      g.rect(bx - 28, by - lift, 56, 1, "#eef2f8");
      g.rect(bx - 1, by - 6, 3, 8, "#8b97b8");                 // fulcrum
      pan(g, bx - 30, by + 2 - lift, "LABEL", P.cream);
      pan(g, bx + 24, by + 2 + lift, "TRUE", crateTruthColour());

      /* ---- conveyor ---- */
      g.rect(0, BELT_Y, W, BELT_H, "#1a2340");
      g.gradient(0, BELT_Y, W, BELT_H, "#202b4d", "#141c33", 4);
      g.rect(0, BELT_Y, W, 2, "rgba(217,164,65,.45)");
      g.rect(0, BELT_Y + BELT_H - 2, W, 2, "rgba(217,164,65,.45)");
      var off = Math.floor((g.wall * beltSpeed) % 14);
      for (i = -14; i < W + 14; i += 14) {
        g.rect(i - off, BELT_Y + BELT_H - 7, 7, 3, "rgba(139,151,184,.22)");
      }
      // rollers at each end
      for (var rr = 0; rr < 2; rr++) {
        var rx = rr ? W - 10 : 2;
        g.rect(rx, BELT_Y + 4, 8, BELT_H - 8, "#26304f");
        var spin = Math.floor(g.wall * beltSpeed / 6) % 4;
        g.rect(rx + 3, BELT_Y + 6 + spin * 4, 3, 3, "rgba(139,151,184,.4)");
      }

      /* ---- the crate ---- */
      var cx = Math.round(crate.x), cy = BELT_Y - 22;
      g.rect(cx, cy, 32, 28, "#6b4226");
      g.rect(cx + 2, cy + 2, 28, 24, crate.good.color);
      g.rect(cx + 2, cy + 2, 28, 1, "rgba(255,255,255,.30)");
      g.rect(cx + 2, cy + 25, 28, 1, "rgba(0,0,0,.30)");
      g.rect(cx, cy, 32, 2, "#8a5a3b");                        // slats
      g.rect(cx, cy + 13, 32, 2, "#8a5a3b");
      g.rect(cx, cy + 26, 32, 2, "#8a5a3b");
      g.frameRect(cx, cy, 32, 28, "#3a2415", 1);
      g.text(crate.good.name.slice(0, 5), cx + 16, cy + 6, 1, "#2a1c10", "center");

      // The label always claims something.
      g.rect(cx - 2, cy - 14, 36, 11, "#e6d8bd");
      g.frameRect(cx - 2, cy - 14, 36, 11, "#8a7a5a", 1);
      g.text(crate.label + " " + crate.good.unit, cx + 16, cy - 11, 1, "#2a1c10", "center");

      // The truth is visible only if you actually weigh it.
      if (crate.weighed) {
        var honest = crate.actual === crate.label;
        var col = honest ? P.oliveLite : P.crimsonLite;
        g.rect(cx - 2, cy + 32, 36, 11, "rgba(4,6,13,.85)");
        g.frameRect(cx - 2, cy + 32, 36, 11, col, 1);
        g.text(crate.actual + " " + crate.good.unit, cx + 16, cy + 35, 1, col, "center");
      } else if (crate.x + 30 > SCALE_X && crate.x < SCALE_X + SCALE_W) {
        if (Math.floor(g.wall * 3) % 2 === 0) {
          g.text("HOLD DOWN", cx + 16, cy + 34, 1, P.dim, "center");
        }
      }

      // The verdict stamp, straight onto the crate.
      if (judgedT > 0 && judged) {
        var jc = judged.ok ? P.oliveLite : P.crimsonLite;
        g.ctx.globalAlpha = Math.min(1, judgedT * 1.5);
        var jw = g.textWidth(judged.word, 1) + 8;
        g.rect(cx + 16 - jw / 2, cy + 8, jw, 12, "rgba(4,6,13,.8)");
        g.frameRect(cx + 16 - jw / 2, cy + 8, jw, 12, jc, 1);
        g.text(judged.word, cx + 16, cy + 11, 1, jc, "center");
        g.ctx.globalAlpha = 1;
      }

      /* ---- bins ---- */
      var binY = BELT_Y + BELT_H + 12;
      drawBin(g, 8, binY, 78, "REFUSE", "◀", P.crimson, "rgba(179,49,58,.18)");
      drawBin(g, W - 86, binY, 78, "SELL", "▶", P.olive, "rgba(79,125,90,.18)");

      /* ---- ticker ---- */
      if (toastT > 0) {
        g.ctx.globalAlpha = Math.min(1, toastT * 2);
        g.textBlock(toast, W / 2, binY + 34, W - 24, 1, P.parchment, "center");
        g.ctx.globalAlpha = 1;
      } else {
        g.text("WEIGH IT BEFORE YOU JUDGE IT", W / 2, binY + 34, 1, "rgba(139,151,184,.5)", "center");
      }

      /* ---- the day book ---- */
      var ly = H - 52;
      g.rect(8, ly - 4, W - 16, 1, "rgba(217,164,65,.25)");
      g.text("DAY BOOK", 10, ly, 1, P.dimmer);
      for (i = 0; i < ledger.length; i++) {
        g.text(ledger[i].t + " " + ledger[i].s, 10, ly + 11 + i * 9, 1,
               ledger[i].ok ? "rgba(124,193,148,.9)" : "rgba(232,100,109,.95)");
      }
      g.text("FRAUD STOPPED " + fraudBlocked, W - 10, ly, 1, P.gold, "right");
      g.text("FAIR SALES " + honestSold, W - 10, ly + 11, 1, P.oliveLite, "right");
      g.text("WRONGS DONE " + wrongs, W - 10, ly + 22, 1, wrongs ? P.crimsonLite : P.dimmer, "right");
    }
  });

  function bracket(g, x, y, dx, dy) {
    g.rect(x, y, 7 * dx, 1, "rgba(255,203,107,.75)");
    g.rect(x, y, 1, 7 * dy, "rgba(255,203,107,.75)");
  }

  // A hanging pan with its label beneath it.
  function pan(g, x, y, label, colour) {
    g.rect(x + 5, y, 1, 6, "#8b97b8");
    g.rect(x, y + 6, 12, 2, "#cfd6e6");
    g.rect(x, y + 6, 12, 1, "#eef2f8");
    g.text(label, x + 6, y + 11, 1, colour, "center");
  }

  // The right-hand pan is only coloured once you have actually weighed it.
  function crateTruthColour() {
    if (!crate || !crate.weighed) return P.dimmer;
    return crate.actual === crate.label ? P.oliveLite : P.crimsonLite;
  }

  function drawBin(g, x, y, w, label, arrow, edge, fill) {
    g.rect(x, y, w, 26, fill);
    g.frameRect(x, y, w, 26, edge, 1);
    g.rect(x + 2, y + 2, w - 4, 1, "rgba(255,255,255,.10)");
    g.text(arrow + " " + label, x + w / 2, y + 9, 1, edge, "center");
  }
})();
