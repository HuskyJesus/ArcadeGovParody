/* ============================================================
   LUNCH LADY
   Trays come down the line already stamped by an inspector.
   Lift the lid and look. Serve the food that is actually fine;
   bin the food that has actually gone off. Bin a good tray and
   a kid goes hungry, which counts against you just as hard.
   ============================================================ */
(function () {
  "use strict";
  var P = Arcade.P;

  var W = 288, H = 300;
  var BELT_Y = 150, BELT_H = 30;
  var SCALE_X = 104, SCALE_W = 76;

  var MEALS = [
    { name: "PIZZA",  color: "#d97b41", dark: "#96501d" },
    { name: "TACOS",  color: "#c8a24a", dark: "#8b6f2c" },
    { name: "SLOPPY JOES", color: "#a0522d", dark: "#5d2f18" },
    { name: "NUGGETS",color: "#d9a441", dark: "#96701d" },
    { name: "SALAD",  color: "#4f7d5a", dark: "#2f4a36" },
    { name: "PASTA",  color: "#e6d8bd", dark: "#b3a68c" },
    { name: "CHILI",  color: "#b3313a", dark: "#71171e" },
    { name: "FISH",   color: "#9fbf5a", dark: "#6b8339" }
  ];

  // What the clipboard says, and what is actually under the lid.
  var STAMPS = ["FLAGGED", "NON-COMPLIANT", "REVIEW", "APPROVED", "CLEARED"];

  var crate, beltSpeed, trust, fraudBlocked, honestSold, wrongs,
      toast, toastT, ledger, tilt, tiltTarget, judged, judgedT;

  function newCrate() {
    var meal = Arcade.pick(MEALS);
    // Two independent facts: whether the food is actually fine, and what
    // the inspector's stamp claims. They agree about half the time.
    var fine = Math.random() < 0.64;
    var stamp = Math.random() < 0.5
      ? (fine ? "APPROVED" : "FLAGGED")           // stamp happens to be right
      : Arcade.pick(STAMPS);                      // stamp is just noise
    crate = { good: meal, stamp: stamp, fine: fine, honest: fine,
              x: W + 20, weighed: false, settled: false };
  }

  function judge(g, sold) {
    if (crate.settled) return;
    crate.settled = true;
    judged = null; judgedT = 1.5;

    if (sold && crate.honest) {
      g.score += 60; honestSold++; trust = Arcade.clamp(trust + 4, 0, 100);
      toast = "SERVED. " + crate.good.name + ", FINE ALL ALONG.";
      judged = { ok: true, word: "SERVED" };
      g.flash(P.olive, 0.22);
      g.burst(W - 40, BELT_Y + 10, P.oliveLite, 10, { speed: 60, lift: 20 });
      ledger.unshift({ t: "SERVED", ok: true, s: crate.good.name });
    } else if (!sold && !crate.honest) {
      g.score += 90; fraudBlocked++; trust = Arcade.clamp(trust + 6, 0, 100);
      toast = "GOOD CATCH. THE " + crate.good.name + " HAD TURNED.";
      judged = { ok: true, word: "BINNED" };
      g.flash(P.gold, 0.22);
      g.burst(40, BELT_Y + 10, P.goldLite, 10, { speed: 60, lift: 20 });
      ledger.unshift({ t: "BINNED", ok: true, s: crate.good.name });
    } else if (sold && !crate.honest) {
      wrongs++; trust -= 22;
      toast = "YOU SERVED SPOILED " + crate.good.name + ". THE NURSE WILL HEAR ABOUT IT.";
      judged = { ok: false, word: "SPOILED" };
      g.flash(P.crimson, 0.4); g.kick(6);
      ledger.unshift({ t: "SPOILED", ok: false, s: crate.good.name });
    } else {
      wrongs++; trust -= 16;
      toast = "PERFECTLY GOOD " + crate.good.name + ". A KID GETS NOTHING NOW.";
      judged = { ok: false, word: "HUNGRY" };
      g.flash(P.crimson, 0.4); g.kick(6);
      ledger.unshift({ t: "HUNGRY", ok: false, s: crate.good.name });
    }
    ledger = ledger.slice(0, 4);
    toastT = 2.8;
    beltSpeed = Math.min(72, beltSpeed + 1.6);
    if (trust <= 0) g.gameOver("They brought in a caterer. Your locker has been cleared out.");
  }

  Arcade.create({
    id: "lunch-lady",
    canvas: "#screen",
    width: W, height: H,
    title: "LUNCH LADY",
    subtitle: "Nobody eats last.",
    howto: "HOLD DOWN TO LIFT THE LID - RIGHT SERVES IT - LEFT BINS IT",
    verse: "THE STAMP IS OFTEN WRONG. THE LID IS NEVER WRONG. LOOK UNDER THE LID.",
    scoreLabel: "KIDS FED",
    moral: "THE LINE IS STILL OUT THE DOOR AND LUNCH IS OVER IN FORTY MINUTES.",

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
      var stampSaysBad = crate.stamp !== "APPROVED" && crate.stamp !== "CLEARED";
      tiltTarget = (crate.weighed && onScale)
        ? (crate.fine === stampSaysBad ? 5 : 0)   // tips when the stamp is wrong
        : 0;
      tilt += (tiltTarget - tilt) * Math.min(1, dt * 9);

      if (!crate.settled && onScale) {
        if (g.pressed("right")) judge(g, true);
        else if (g.pressed("left")) judge(g, false);
      }

      if (crate.x < -40) {
        if (!crate.settled) {
          trust -= 10;
          toast = "IT WENT PAST UNTOUCHED. SOMEBODY GOT AN EMPTY TRAY.";
          toastT = 2.8;
          g.flash(P.crimson, 0.25);
          if (trust <= 0) { g.gameOver("Too many empty trays. The line gave up on you."); return; }
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

      g.textShadow("LUNCH LADY", 12, 20, 2, P.goldLite);

      /* ---- reputation, not a licence ---- */
      g.text("THE LINE", 12, 42, 1, P.dim);
      var tw = Math.round(Arcade.clamp(trust, 0, 100) * 1.28);
      g.rect(12, 54, 128, 9, "#141d33");
      var tcol = trust > 45 ? P.olive : trust > 20 ? P.gold : P.crimson;
      g.rect(12, 54, tw, 9, tcol);
      for (var s = 0; s < tw; s += 4) g.rect(12 + s, 54, 1, 9, "rgba(0,0,0,.18)");
      g.frameRect(12, 54, 128, 9, "rgba(217,164,65,.5)", 1);
      if (trust <= 20 && Math.floor(g.wall * 4) % 2 === 0) {
        g.text("THEY ARE LOSING PATIENCE", 148, 55, 1, P.crimsonLite);
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

      /* ---- the inspector's clipboard, hung over the line ---- */
      var bx = SCALE_X + SCALE_W / 2, by = 88;
      for (var ch = 14; ch < 66; ch += 6) g.rect(bx, ch, 1, 4, "#6f7b99");
      g.rect(bx - 12, 66, 25, 22, "#d8cdb4");                  // the board
      g.rect(bx - 12, 66, 25, 3, "#8b97b8");                   // the clip
      g.rect(bx - 10, 72, 21, 1, "rgba(90,80,60,.5)");
      g.rect(bx - 10, 76, 21, 1, "rgba(90,80,60,.35)");
      g.rect(bx - 10, 80, 14, 1, "rgba(90,80,60,.35)");

      // What it says, and whether the lid agreed. The needle swings only
      // once you have looked, and only when the stamp turned out wrong.
      var lift = Math.round(tilt);
      g.text(crate.stamp, bx, by + 6, 1,
             crate.stamp === "APPROVED" || crate.stamp === "CLEARED" ? P.oliveLite : P.crimsonLite,
             "center");
      if (crate.weighed) {
        g.text(lift > 2 ? "STAMP WRONG" : "STAMP RIGHT", bx, by + 18, 1,
               lift > 2 ? P.crimsonLite : P.oliveLite, "center");
      } else {
        g.text("LID SHUT", bx, by + 18, 1, P.dimmer, "center");
      }

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

      /* ---- the tray ---- */
      var cx = Math.round(crate.x), cy = BELT_Y - 22;
      g.rect(cx, cy + 8, 34, 20, "#9aa6c4");                   // the tray
      g.rect(cx, cy + 8, 34, 1, "#cfd6e6");
      g.rect(cx, cy + 27, 34, 1, "#5a6489");
      g.rect(cx + 3, cy + 12, 12, 12, "#6f7b99");              // compartments
      g.rect(cx + 18, cy + 12, 13, 6, "#6f7b99");
      g.rect(cx + 18, cy + 19, 13, 5, "#6f7b99");

      if (crate.weighed) {
        // Lid up: the food, and whether it has turned.
        var col = crate.fine ? P.oliveLite : P.crimsonLite;
        g.rect(cx + 4, cy + 13, 10, 10, crate.good.color);
        g.rect(cx + 19, cy + 13, 11, 4, crate.good.dark);
        g.rect(cx + 19, cy + 20, 11, 3, crate.good.dark);
        if (!crate.fine) {                                     // a green bloom on it
          g.rect(cx + 6, cy + 15, 3, 3, "#7cc194");
          g.rect(cx + 10, cy + 19, 2, 2, "#7cc194");
          g.rect(cx + 22, cy + 14, 3, 2, "#7cc194");
        }
        g.rect(cx - 2, cy - 4, 38, 4, "#cfd6e6");              // the lid, tilted up
        g.rect(cx - 2, cy - 4, 38, 1, "#eef2f8");
        g.text(crate.fine ? "FINE" : "OFF", cx + 17, cy + 32, 1, col, "center");
      } else {
        // Lid down: all you have is the stamp.
        g.rect(cx - 1, cy + 4, 36, 6, "#cfd6e6");
        g.rect(cx - 1, cy + 4, 36, 1, "#eef2f8");
        g.rect(cx + 14, cy + 1, 6, 3, "#8b97b8");              // the handle
        if (!crate.settled && crate.x + 30 > SCALE_X && crate.x < SCALE_X + SCALE_W &&
            Math.floor(g.wall * 3) % 2 === 0) {
          g.text("HOLD DOWN", cx + 17, cy + 32, 1, P.dim, "center");
        }
      }

      // The inspector's verdict, slapped on the tray as a thumbs up or down.
      var ok = crate.stamp === "APPROVED" || crate.stamp === "CLEARED";
      var sc = ok ? "#2f4a36" : "#71171e";
      g.rect(cx + 8, cy - 14, 18, 10, "#e6d8bd");
      g.frameRect(cx + 8, cy - 14, 18, 10, sc, 1);
      g.text(ok ? "OK" : "NO", cx + 17, cy - 12, 1, sc, "center");

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
      drawBin(g, 8, binY, 78, "BIN IT", "◀", P.crimson, "rgba(179,49,58,.18)");
      drawBin(g, W - 86, binY, 78, "SERVE", "▶", P.olive, "rgba(79,125,90,.18)");

      /* ---- ticker ---- */
      if (toastT > 0) {
        g.ctx.globalAlpha = Math.min(1, toastT * 2);
        g.textBlock(toast, W / 2, binY + 34, W - 24, 1, P.parchment, "center");
        g.ctx.globalAlpha = 1;
      } else {
        g.text("LOOK UNDER THE LID BEFORE YOU DECIDE", W / 2, binY + 34, 1, "rgba(139,151,184,.5)", "center");
      }

      /* ---- the day book ---- */
      var ly = H - 52;
      g.rect(8, ly - 4, W - 16, 1, "rgba(217,164,65,.25)");
      g.text("TODAY", 10, ly, 1, P.dimmer);
      for (i = 0; i < ledger.length; i++) {
        g.text(ledger[i].t + " " + ledger[i].s, 10, ly + 11 + i * 9, 1,
               ledger[i].ok ? "rgba(124,193,148,.9)" : "rgba(232,100,109,.95)");
      }
      g.text("CAUGHT " + fraudBlocked, W - 10, ly, 1, P.gold, "right");
      g.text("FED " + honestSold, W - 10, ly + 11, 1, P.oliveLite, "right");
      g.text("MESSED UP " + wrongs, W - 10, ly + 22, 1, wrongs ? P.crimsonLite : P.dimmer, "right");
    }
  });

  function bracket(g, x, y, dx, dy) {
    g.rect(x, y, 7 * dx, 1, "rgba(255,203,107,.75)");
    g.rect(x, y, 1, 7 * dy, "rgba(255,203,107,.75)");
  }

  function drawBin(g, x, y, w, label, arrow, edge, fill) {
    g.rect(x, y, w, 26, fill);
    g.frameRect(x, y, w, 26, edge, 1);
    g.rect(x + 2, y + 2, w - 4, 1, "rgba(255,255,255,.10)");
    g.text(arrow + " " + label, x + w / 2, y + 9, 1, edge, "center");
  }
})();
