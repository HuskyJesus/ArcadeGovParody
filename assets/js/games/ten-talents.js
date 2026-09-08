/* ============================================================
   TEN TALENTS  —  counters "Trump Savings Tycoon" (coin catcher)
   Same basket, same falling money. Opposite lesson: the money
   is not handed to you by a government account with your
   patron's name on it. You earn it, and then you must decide
   what it is FOR — because a subsidy always comes with strings,
   and every string narrows what you are free to do.
   ============================================================ */
(function () {
  "use strict";
  var P = Arcade.P;

  var W = 280, H = 280;
  var FLOOR = H - 56;
  var ROUND = 100;                       // seconds of working life

  var basket, coins, strings, give, invest, keep, neighbors, inflationT,
      spawnT, toast, toastT, split, subsidiesTaken, alloc;

  var GIFTS = [
    "A NEIGHBOUR'S ROOF", "A WIDOW'S RENT", "AN APPRENTICE'S TOOLS",
    "A SICK MAN'S DOCTOR", "A STRANGER'S FARE", "A CHILD'S SCHOOLING"
  ];

  function basketW() { return Math.max(26, 58 - strings * 6); }

  function spawnCoin() {
    var r = Math.random();
    var kind = r < 0.10 ? "subsidy" : r < 0.18 ? "gift" : "wage";
    coins.push({
      x: Arcade.rand(14, W - 14),
      y: -10,
      v: Arcade.rand(52, 88),
      kind: kind,
      spin: Math.random() * 6
    });
  }

  var game = Arcade.create({
    id: "ten-talents",
    canvas: "#screen",
    width: W, height: H,
    title: "TEN TALENTS",
    subtitle: "It is not what you catch. It is what you do with it.",
    howto: "LEFT/RIGHT move the basket. SPACE picks a slice, UP/DOWN moves it. Dodge the SUBSIDY.",
    verse: '"Well done, good and faithful servant; you were faithful over a little." Matt. 25:21',
    scoreLabel: "ESTATE",
    moral: "Their game fills an account the state opened for your child. This one asks what a free man does with his own.",

    reset: function () {
      basket = { x: W / 2 };
      coins = []; strings = 0; subsidiesTaken = 0;
      give = 0; invest = 0; keep = 0; neighbors = 0;
      inflationT = 0; spawnT = 0; toast = ""; toastT = 0;
      alloc = 0;                          // 0 give, 1 invest, 2 keep
      split = [20, 45, 35];
    },

    update: function (g, dt) {
      if (g.time > ROUND) {
        var estate = Math.round(invest + keep + neighbors * 55);
        g.score = estate;
        g.gameOver("Invested " + Math.round(invest) + " · Kept " + Math.round(keep) +
                   " · " + neighbors + " neighbours who would do the same for you.");
        return;
      }

      // Move the basket. Strings make it smaller, never faster.
      var speed = 150;
      if (g.held("left")) basket.x -= speed * dt;
      if (g.held("right")) basket.x += speed * dt;
      basket.x = Arcade.clamp(basket.x, basketW() / 2, W - basketW() / 2);

      // SPACE picks which slice you are steering; UP/DOWN moves it.
      if (g.pressed("action")) alloc = (alloc + 1) % 3;
      if (g.pressed("up")) shift(alloc, 5);
      if (g.pressed("down")) shift(alloc, -5);

      spawnT += dt;
      var rate = Arcade.clamp(0.62 - g.time * 0.003, 0.28, 0.62);
      if (spawnT > rate) { spawnT = 0; spawnCoin(); }

      // Neighbours you helped send work back your way.
      if (neighbors > 0 && Math.random() < neighbors * 0.006) spawnCoin();

      var i;
      for (i = coins.length - 1; i >= 0; i--) {
        var c = coins[i];
        c.y += c.v * dt;
        c.spin += dt * 5;

        var bw = basketW();
        if (c.y > FLOOR - 14 && c.y < FLOOR + 8 &&
            Math.abs(c.x - basket.x) < bw / 2 + 6) {
          coins.splice(i, 1);
          if (c.kind === "subsidy") {
            strings++; subsidiesTaken++;
            keep += 120;                            // the money is real
            toast = "SUBSIDY TAKEN. +120, AND A STRING. YOUR BASKET IS SMALLER NOW.";
            toastT = 3;
          } else if (c.kind === "gift") {
            neighbors++;
            toast = "A NEIGHBOUR REPAID A KINDNESS.";
            toastT = 2;
          } else {
            earn(24);
          }
          continue;
        }
        if (c.y > H + 12) coins.splice(i, 1);
      }

      // Inflation eats what sits idle. Invested capital and given money do not sit.
      inflationT += dt;
      if (inflationT > 1) {
        inflationT = 0;
        keep *= 0.985;
        keep -= strings * 1.2;                      // compliance costs money too
        if (keep < 0) keep = 0;
        invest *= 1.012;                            // patient capital compounds
      }

      if (toastT > 0) toastT -= dt;
      g.score = Math.round(invest + keep + neighbors * 55);
    },

    draw: function (g) {
      g.clear("#0a1020");

      // Sky and a plain house on the horizon: what an estate is actually for.
      g.rect(0, FLOOR + 10, W, H - FLOOR - 10, "#141d33");
      g.rect(W - 62, FLOOR - 12, 34, 22, "#1d2846");
      g.rect(W - 66, FLOOR - 20, 42, 9, "#2b3a63");
      g.rect(W - 52, FLOOR - 4, 8, 14, "#3a2415");

      // HUD
      g.rect(0, 0, W, 58, "rgba(4,6,13,.68)");
      g.text("TEN TALENTS", 6, 5, 8, P.goldLite);
      var left = Math.max(0, Math.ceil(ROUND - g.time));
      g.text(left + "s", W - 6, 6, 8, left < 15 ? P.crimson : P.parchment, "right");

      g.text("ESTATE " + Math.round(invest + keep + neighbors * 55), 6, 20, 7, P.oliveLite);
      g.text("STRINGS " + strings, W - 6, 21, 7, strings ? P.crimson : P.dim, "right");

      // The split: three slices you steer while you work.
      var labels = ["GIVE", "INVEST", "KEEP"];
      var colors = [P.oliveLite, P.goldLite, P.sky];
      for (var s = 0; s < 3; s++) {
        var bx = 6 + s * 90;
        var sel = alloc === s;
        g.text(labels[s] + " " + Math.round(split[s]) + "%", bx, 34, 6, sel ? P.parchment : P.dim);
        g.rect(bx, 44, 82, 6, "#151d33");
        g.rect(bx, 44, Math.round(split[s] * 0.82), 6, colors[s]);
        if (sel) g.frameRect(bx - 2, 42, 86, 10, P.parchment, 1);
      }

      // Falling money
      for (var i = 0; i < coins.length; i++) {
        var c = coins[i];
        var wob = Math.abs(Math.sin(c.spin)) * 3 + 3;
        if (c.kind === "subsidy") {
          g.rect(c.x - 8, c.y - 8, 16, 16, P.crimson);
          g.rect(c.x - 5, c.y - 5, 10, 10, "#d1616a");
          g.text("$", c.x, c.y - 4, 6, "#3a0d10", "center");
          g.text("STRINGS", c.x, c.y + 10, 5, P.crimson, "center");
        } else if (c.kind === "gift") {
          g.rect(c.x - 6, c.y - 6, 12, 12, P.olive);
          g.rect(c.x - 1, c.y - 8, 3, 16, P.oliveLite);
          g.rect(c.x - 8, c.y - 1, 16, 3, P.oliveLite);
        } else {
          g.rect(c.x - wob / 2, c.y - 6, wob, 12, P.gold);
          g.rect(c.x - wob / 2, c.y - 4, wob, 8, P.goldLite);
        }
      }

      // Basket — it shrinks with every string attached
      var bw = basketW();
      g.rect(basket.x - bw / 2, FLOOR - 8, bw, 12, "#8a5a3b");
      g.rect(basket.x - bw / 2 + 2, FLOOR - 6, bw - 4, 8, "#6b4226");
      for (var w = 4; w < bw - 3; w += 6) {
        g.rect(basket.x - bw / 2 + w, FLOOR - 6, 1, 8, "rgba(0,0,0,.3)");
      }
      g.frameRect(basket.x - bw / 2, FLOOR - 8, bw, 12, strings ? P.crimson : P.gold, 1);

      // Strings, drawn as literal tethers from above
      for (var st = 0; st < strings; st++) {
        var tx = basket.x - bw / 2 + 6 + st * 7;
        g.rect(tx, 58, 1, FLOOR - 66, "rgba(179,49,58,.45)");
      }

      // Ticker, then the ledger along the bottom edge
      if (toastT > 0) {
        g.textBlock(toast, W / 2, FLOOR + 14, W - 14, 6,
                    strings ? P.crimson : P.parchment, "center");
      } else {
        g.text("1/2/3 PICKS A SLICE  ·  LEFT/RIGHT TO WORK", W / 2, FLOOR + 16, 5,
               "rgba(154,166,196,.6)", "center");
      }

      g.text("GIVEN " + Math.round(give), 6, FLOOR + 30, 6, P.oliveLite);
      g.text("INVESTED " + Math.round(invest), 6, FLOOR + 40, 6, P.goldLite);
      g.text("KEPT " + Math.round(keep), 6, FLOOR + 50, 6, P.sky);
      g.text("NEIGHBOURS " + neighbors, W - 6, FLOOR + 30, 6, P.oliveLite, "right");
    }
  });

  // ---- allocation ------------------------------------------------------

  function earn(amount) {
    var giving = amount * split[0] / 100;
    var investing = amount * split[1] / 100;
    var keeping = amount * split[2] / 100;

    give += giving;
    invest += investing;
    keep += keeping;

    // Charity is not a cost centre. Enough of it makes a neighbour.
    if (give >= (neighbors + 1) * 90) {
      neighbors++;
      toast = "YOU PAID FOR " + Arcade.pick(GIFTS) + ".";
      toastT = 2.4;
    }
  }

  function shift(index, delta) {
    if (!split) return;
    split[index] = Arcade.clamp(split[index] + delta, 0, 100);
    normalise(index);
  }

  function normalise(fixed) {
    var total = split[0] + split[1] + split[2];
    if (Math.abs(total - 100) < 0.001) return;
    var others = [0, 1, 2].filter(function (i) { return i !== fixed; });
    var pool = split[others[0]] + split[others[1]];
    var need = 100 - split[fixed];
    if (pool <= 0) {
      split[others[0]] = need / 2;
      split[others[1]] = need / 2;
    } else {
      split[others[0]] = split[others[0]] / pool * need;
      split[others[1]] = split[others[1]] / pool * need;
    }
  }

  // Number keys give direct, obvious control over the split.
  window.addEventListener("keydown", function (e) {
    var map = { Digit1: 0, Digit2: 1, Digit3: 2 };
    if (!(e.code in map)) return;
    e.preventDefault();
    var i = map[e.code];
    alloc = i;
    shift(i, 5);
  });

  // Touch buttons: <button data-alloc="0">
  Array.prototype.forEach.call(document.querySelectorAll("[data-alloc]"), function (el) {
    el.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      var i = parseInt(el.getAttribute("data-alloc"), 10);
      alloc = i;
      shift(i, 5);
    });
  });
})();
