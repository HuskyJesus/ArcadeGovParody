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

  var W = 260, H = 280;
  var BELT_Y = 120, BELT_H = 44;
  var SCALE_X = 96, SCALE_W = 66;          // the inspection window

  var GOODS = [
    { name: "FLOUR",  unit: "LB", color: "#e6d8bd" },
    { name: "OLIVES", unit: "LB", color: "#4f7d5a" },
    { name: "WOOL",   unit: "LB", color: "#f4ead8" },
    { name: "HONEY",  unit: "OZ", color: "#d9a441" },
    { name: "SALT",   unit: "LB", color: "#cfd6e6" },
    { name: "COPPER", unit: "LB", color: "#b87333" },
    { name: "BARLEY", unit: "LB", color: "#c8a24a" },
    { name: "OIL",    unit: "OZ", color: "#9fbf5a" }
  ];

  var crate, beltSpeed, trust, fraudBlocked, honestSold, wrongs, toast, toastT, flash, flashColor, ledger;

  function newCrate() {
    var g = Arcade.pick(GOODS);
    var label = Arcade.randInt(4, 20);
    // A third of suppliers shade the weight. The rest are honest and deserve the sale.
    var cheat = Math.random() < 0.36;
    var actual = label;
    if (cheat) {
      var short = Math.random() < 0.75;
      var delta = Math.max(1, Math.round(label * Arcade.rand(0.12, 0.35)));
      actual = short ? label - delta : label + delta;   // padded crates are a lie too
    }
    crate = {
      good: g, label: label, actual: actual, honest: !cheat,
      x: W + 20, weighed: false, settled: false
    };
  }

  function judge(g, sold) {
    if (crate.settled) return;
    crate.settled = true;

    if (sold && crate.honest) {
      g.score += 60; honestSold++; trust = Arcade.clamp(trust + 4, 0, 100);
      toast = "FAIR TRADE. " + crate.label + " " + crate.good.unit + " AS PROMISED.";
      flash = 0.3; flashColor = "rgba(79,125,90,.35)";
      ledger.unshift({ t: "SOLD", ok: true, s: crate.good.name });
    } else if (!sold && !crate.honest) {
      g.score += 90; fraudBlocked++; trust = Arcade.clamp(trust + 6, 0, 100);
      toast = "FALSE BALANCE CAUGHT. LABEL " + crate.label + ", TRUE " + crate.actual + ".";
      flash = 0.3; flashColor = "rgba(217,164,65,.35)";
      ledger.unshift({ t: "REFUSED", ok: true, s: crate.good.name });
    } else if (sold && !crate.honest) {
      wrongs++; trust -= 22;
      toast = "YOU SOLD A LIE. THE BUYER PAID FOR " + crate.label + " AND GOT " + crate.actual + ".";
      flash = 0.45; flashColor = "rgba(179,49,58,.45)";
      ledger.unshift({ t: "FRAUD", ok: false, s: crate.good.name });
    } else {
      wrongs++; trust -= 16;
      toast = "YOU REFUSED AN HONEST SUPPLIER. HE GOES HOME WITH NOTHING.";
      flash = 0.45; flashColor = "rgba(179,49,58,.45)";
      ledger.unshift({ t: "UNJUST", ok: false, s: crate.good.name });
    }
    ledger = ledger.slice(0, 5);
    toastT = 2.6;
    beltSpeed = Math.min(72, beltSpeed + 1.6);

    if (trust <= 0) {
      g.gameOver("Word got around. No one trades at a crooked stall.");
    }
  }

  var game = Arcade.create({
    id: "honest-scales",
    canvas: "#screen",
    width: W, height: H,
    title: "HONEST SCALES",
    subtitle: "A just weight is the whole of the law of trade.",
    howto: "DOWN weighs the crate.  RIGHT sells.  LEFT refuses. Judge the label, not the man.",
    verse: '"A false balance is an abomination; a just weight is his delight." Prov. 11:1',
    scoreLabel: "GOOD NAME",
    moral: "The state game asks whether food meets the slogan. This one asks whether the label tells the truth.",

    reset: function () {
      beltSpeed = 30; trust = 60;
      fraudBlocked = 0; honestSold = 0; wrongs = 0;
      toast = ""; toastT = 0; flash = 0; flashColor = ""; ledger = [];
      newCrate();
    },

    update: function (g, dt) {
      if (toastT > 0) toastT -= dt;
      if (flash > 0) flash -= dt;

      crate.x -= beltSpeed * dt;

      var onScale = crate.x + 30 > SCALE_X && crate.x < SCALE_X + SCALE_W;
      if (g.held("down") && onScale) crate.weighed = true;

      if (!crate.settled && onScale) {
        if (g.pressed("right")) judge(g, true);
        else if (g.pressed("left")) judge(g, false);
      }

      // Letting a crate run off the belt is its own kind of negligence.
      if (crate.x < -40) {
        if (!crate.settled) {
          trust -= 10;
          toast = "YOU LET IT PASS WITHOUT LOOKING. NEGLIGENCE IS NOT NEUTRALITY.";
          toastT = 2.6;
          if (trust <= 0) { g.gameOver("You stopped paying attention, and the stall lost its name."); return; }
        }
        newCrate();
      }
    },

    draw: function (g) {
      g.clear("#0b1220");

      if (flash > 0) g.rect(0, 0, W, H, flashColor);

      g.text("HONEST SCALES", 8, 6, 8, P.goldLite);
      g.text("GOOD NAME", 8, 22, 6, P.dim);

      // Trust meter — your reputation, not a government licence.
      var tw = Math.max(0, Math.round(trust * 1.4));
      g.rect(8, 32, 140, 8, "#151d33");
      g.rect(8, 32, tw, 8, trust > 45 ? P.olive : trust > 20 ? P.gold : P.crimson);
      g.frameRect(8, 32, 140, 8, "rgba(217,164,65,.5)", 1);
      g.text(String(g.score), 252, 22, 8, P.parchment, "right");

      // Belt
      g.rect(0, BELT_Y, W, BELT_H, "#1a2340");
      g.rect(0, BELT_Y, W, 2, "rgba(217,164,65,.4)");
      g.rect(0, BELT_Y + BELT_H - 2, W, 2, "rgba(217,164,65,.4)");
      var offset = Math.floor((g.time * beltSpeed) % 12);
      for (var i = -12; i < W + 12; i += 12) {
        g.rect(i - offset, BELT_Y + BELT_H - 6, 6, 3, "rgba(154,166,196,.25)");
      }

      // Inspection window
      g.frameRect(SCALE_X, BELT_Y - 12, SCALE_W, BELT_H + 24, "rgba(255,203,107,.55)", 1);
      g.text("THE SCALE", SCALE_X + SCALE_W / 2, BELT_Y - 24, 6, P.gold, "center");

      // Crate
      var cx = Math.round(crate.x), cy = BELT_Y + 8;
      g.rect(cx, cy, 30, 28, "#6b4226");
      g.rect(cx + 2, cy + 2, 26, 24, crate.good.color);
      g.rect(cx + 2, cy + 15, 26, 11, "rgba(0,0,0,.18)");
      g.frameRect(cx, cy, 30, 28, "#3a2415", 1);
      g.text(crate.good.name.slice(0, 4), cx + 15, cy + 4, 6, "#2a1c10", "center");

      // The label always claims something.
      g.text("LABEL: " + crate.label + " " + crate.good.unit, cx + 15, cy - 12, 6, P.parchment, "center");

      // The truth is only visible when you actually weigh it.
      if (crate.weighed) {
        var honest = crate.actual === crate.label;
        g.text("TRUE: " + crate.actual + " " + crate.good.unit, cx + 15, cy + 34, 6,
               honest ? P.oliveLite : P.crimson, "center");
      } else {
        g.text("HOLD DOWN TO WEIGH", cx + 15, cy + 34, 6, "rgba(154,166,196,.6)", "center");
      }

      // Bins
      var BIN_Y = BELT_Y + BELT_H + 14;
      g.rect(4, BIN_Y, 62, 22, "rgba(179,49,58,.22)");
      g.frameRect(4, BIN_Y, 62, 22, P.crimson, 1);
      g.text("< REFUSE", 35, BIN_Y + 8, 6, P.crimson, "center");

      g.rect(W - 66, BIN_Y, 62, 22, "rgba(79,125,90,.22)");
      g.frameRect(W - 66, BIN_Y, 62, 22, P.olive, 1);
      g.text("SELL >", W - 35, BIN_Y + 8, 6, P.oliveLite, "center");

      // Ticker — wraps to at most two lines at this width
      if (toastT > 0) {
        g.textBlock(toast, W / 2, BIN_Y + 30, W - 16, 6, P.parchment, "center");
      }

      // Ledger, along the bottom edge
      for (i = 0; i < ledger.length && i < 4; i++) {
        g.text(ledger[i].t + " " + ledger[i].s, 8, 246 + i * 8, 6,
               ledger[i].ok ? "rgba(124,193,148,.85)" : "rgba(179,49,58,.9)");
      }
      g.text("FRAUD STOPPED " + fraudBlocked, W - 8, 246, 6, P.gold, "right");
      g.text("FAIR SALES " + honestSold, W - 8, 256, 6, P.oliveLite, "right");
      g.text("WRONGS DONE " + wrongs, W - 8, 266, 6, P.crimson, "right");
    }
  });
})();
