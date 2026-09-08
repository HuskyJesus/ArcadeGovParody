/* ============================================================
   TEN TALENTS  —  counters "Trump Savings Tycoon" (coin catcher)
   Same basket, same falling money. Opposite lesson: the money
   is not handed to you by a government account with your
   patron's name on it. You earn it, and then you must decide
   what it is for - because a subsidy always comes with strings,
   and every string narrows what you are free to do.
   ============================================================ */
(function () {
  "use strict";
  var P = Arcade.P;

  var W = 300, H = 300;
  var FLOOR = H - 62;
  var ROUND = 90;

  var GIFTS = [
    "A NEIGHBOUR'S ROOF", "A WIDOW'S RENT", "AN APPRENTICE'S TOOLS",
    "A SICK MAN'S DOCTOR", "A STRANGER'S FARE", "A CHILD'S SCHOOLING"
  ];

  var SUBSIDY = [
    ".RRRRRRR.",
    "RRRRRRRRR",
    "RRLLLLLRR",
    "RRLSSSLRR",
    "RRLLLLLRR",
    "RRRRRRRRR",
    ".RRRRRRR."
  ];
  var SUBSIDY_KEY = { R: "#b3313a", L: "#e8646d", S: "#4a0d13" };

  var GIFT = [
    "..GGG..",
    ".GGGGG.",
    "GGGGGGG",
    "GGLLLGG",
    "GGGGGGG",
    ".GGGGG.",
    "..GGG.."
  ];
  var GIFT_KEY = { G: "#4f7d5a", L: "#7cc194" };

  var basket, coins, strings, give, invest, keep, neighbors, inflationT,
      spawnT, toast, toastT, split, alloc, subsidiesTaken, houseLights, lastEarn;

  function basketW() { return Math.max(28, 62 - strings * 6); }

  function spawnCoin() {
    var r = Math.random();
    var kind = r < 0.10 ? "subsidy" : r < 0.18 ? "gift" : "wage";
    coins.push({
      x: Arcade.rand(16, W - 16), y: -12,
      v: Arcade.rand(54, 92), kind: kind, spin: Math.random() * 6
    });
  }

  Arcade.create({
    id: "ten-talents",
    canvas: "#screen",
    width: W, height: H,
    title: "TEN TALENTS",
    subtitle: "It is not what you catch. It is what it is for.",
    howto: "LEFT RIGHT TO WORK - SPACE PICKS A SLICE - UP DOWN MOVES IT - DODGE THE SUBSIDY",
    verse: '"WELL DONE, GOOD AND FAITHFUL SERVANT; YOU WERE FAITHFUL OVER A LITTLE" MATT. 25:21',
    scoreLabel: "THE ESTATE",
    moral: "THEIR GAME FILLS AN ACCOUNT THE STATE OPENED FOR YOUR CHILD. THIS ONE ASKS WHAT A FREE MAN DOES WITH HIS OWN.",

    reset: function () {
      basket = { x: W / 2 };
      coins = []; strings = 0; subsidiesTaken = 0;
      give = 0; invest = 0; keep = 0; neighbors = 0;
      inflationT = 0; spawnT = 0; toast = ""; toastT = 0;
      alloc = 0; split = [20, 45, 35]; lastEarn = 0;
      houseLights = [];
    },

    update: function (g, dt) {
      if (g.time > ROUND) {
        g.score = Math.round(invest + keep + neighbors * 55);
        g.gameOver("Invested " + Math.round(invest) + ", kept " + Math.round(keep) +
                   ", and " + neighbors + " neighbours who would do the same for you.");
        return;
      }

      var speed = 158;
      if (g.held("left")) basket.x -= speed * dt;
      if (g.held("right")) basket.x += speed * dt;
      basket.x = Arcade.clamp(basket.x, basketW() / 2, W - basketW() / 2);

      if (g.pressed("action")) alloc = (alloc + 1) % 3;
      if (g.pressed("up")) shift(alloc, 5);
      if (g.pressed("down")) shift(alloc, -5);

      spawnT += dt;
      var rate = Arcade.clamp(0.62 - g.time * 0.003, 0.28, 0.62);
      if (spawnT > rate) { spawnT = 0; spawnCoin(); }
      if (neighbors > 0 && Math.random() < neighbors * 0.006) spawnCoin();

      var i;
      for (i = coins.length - 1; i >= 0; i--) {
        var c = coins[i];
        c.y += c.v * dt;
        c.spin += dt * 5;

        var bw = basketW();
        if (c.y > FLOOR - 16 && c.y < FLOOR + 8 && Math.abs(c.x - basket.x) < bw / 2 + 6) {
          coins.splice(i, 1);
          if (c.kind === "subsidy") {
            strings++; subsidiesTaken++; keep += 120;
            toast = "SUBSIDY TAKEN. +120, AND A STRING. YOUR BASKET IS SMALLER NOW.";
            toastT = 3.2;
            g.kick(6); g.flash(P.crimson, 0.35);
            g.burst(c.x, FLOOR - 8, P.crimsonLite, 14, { speed: 80, lift: 26 });
          } else if (c.kind === "gift") {
            neighbors++;
            toast = "A NEIGHBOUR REPAID A KINDNESS.";
            toastT = 2.2;
            g.flash(P.olive, 0.2);
            g.burst(c.x, FLOOR - 8, P.oliveLite, 12, { speed: 66, lift: 22 });
          } else {
            earn(24);
            lastEarn = 0.3;
            g.burst(c.x, FLOOR - 8, P.goldLite, 6, { speed: 52, lift: 18, life: 0.5 });
          }
          continue;
        }
        if (c.y > H + 12) coins.splice(i, 1);
      }

      inflationT += dt;
      if (inflationT > 1) {
        inflationT = 0;
        keep *= 0.985;
        keep -= strings * 1.2;
        if (keep < 0) keep = 0;
        invest *= 1.012;
        // a window lights up for each neighbour made
        while (houseLights.length < neighbors) {
          houseLights.push({ i: houseLights.length, t: 0 });
        }
      }

      if (toastT > 0) toastT -= dt;
      if (lastEarn > 0) lastEarn -= dt;
      g.score = Math.round(invest + keep + neighbors * 55);
    },

    draw: function (g) {
      /* ---- evening sky over a street ---- */
      g.gradient(0, 0, W, FLOOR + 10, "#0a1020", "#152040", 8);
      for (var s = 0; s < 26; s++) {
        var sx = (s * 61) % W, sy = 62 + (s * 43) % 110;
        g.rect(sx, sy, 1, 1, "rgba(244,234,216,.14)");
      }

      /* ---- the street: your house and your neighbours' ---- */
      var groundY = FLOOR + 8;
      g.rect(0, groundY, W, H - groundY, "#0d1424");
      g.rect(0, groundY, W, 2, "#1c2748");

      // your own house on the right, windows lighting as neighbours are made
      drawHouse(g, W - 56, groundY - 34, 46, 34, neighbors, g.wall);
      // neighbours' houses receding to the left
      for (var n = 0; n < Math.min(neighbors, 5); n++) {
        drawHouse(g, W - 96 - n * 34, groundY - 24, 26, 24, 1, g.wall + n);
      }

      /* ---- falling money ---- */
      for (i = 0; i < coins.length; i++) {
        var c = coins[i];
        if (c.kind === "subsidy") {
          // the strings it is already trailing, before you touch it
          for (var t = 0; t < 3; t++) {
            g.rect(c.x - 5 + t * 5, Math.max(0, c.y - 22), 1, 15, "rgba(179,49,58,.55)");
          }
          g.ctx.globalAlpha = 0.22 + 0.1 * Math.sin(g.wall * 6);
          g.rect(c.x - 13, c.y - 11, 26, 24, P.crimson);
          g.ctx.globalAlpha = 1;
          g.sprite(SUBSIDY, c.x - 9, c.y - 7, 2, SUBSIDY_KEY);
          // label only while the crate is in the play field: behind the HUD
          // above, and past the basket below, it would cross other text
          if (c.y + 10 > 62 && c.y + 17 < FLOOR - 6) {
            g.text("STRINGS", c.x, c.y + 10, 1, P.crimsonLite, "center");
          }
        } else if (c.kind === "gift") {
          g.sprite(GIFT, c.x - 7, c.y - 7, 2, GIFT_KEY);
        } else {
          // a coin, tumbling: its width narrows as it spins
          var wob = Math.max(2, Math.round(Math.abs(Math.sin(c.spin)) * 8) + 1);
          g.rect(c.x - wob / 2, c.y - 5, wob, 10, P.goldDeep);
          g.rect(c.x - wob / 2, c.y - 5, wob, 8, P.gold);
          g.rect(c.x - wob / 2 + 1, c.y - 4, Math.max(1, wob - 2), 3, P.goldLite);
        }
      }

      /* ---- the strings that tether your basket ---- */
      var bw = basketW();
      for (var st = 0; st < strings; st++) {
        var tx = basket.x - bw / 2 + 5 + st * 7;
        var sway = Math.sin(g.wall * 2 + st) * 1.5;
        g.rect(tx + sway, 63, 1, FLOOR - 71, "rgba(179,49,58,.4)");
      }

      /* ---- basket ---- */
      var bxx = basket.x - bw / 2, byy = FLOOR - 10;
      g.rect(bxx, byy, bw, 14, "#6b4226");
      g.rect(bxx + 1, byy + 1, bw - 2, 12, "#8a5a3b");
      for (var wv = 3; wv < bw - 2; wv += 5) g.rect(bxx + wv, byy + 1, 1, 12, "rgba(0,0,0,.28)");
      g.rect(bxx, byy + 2, bw, 1, "rgba(0,0,0,.25)");
      g.rect(bxx, byy + 7, bw, 1, "rgba(0,0,0,.25)");
      g.rect(bxx, byy, bw, 2, strings ? P.crimson : P.gold);      // rim
      g.frameRect(bxx, byy, bw, 14, strings ? "rgba(179,49,58,.8)" : "rgba(217,164,65,.7)", 1);

      /* ---- HUD, drawn last so nothing falls across it: coins spawn
             above the fold and emerge from behind the panel ---- */
      g.rect(0, 0, W, 62, "#070c18");
      g.rect(0, 62, W, 1, "rgba(217,164,65,.3)");
      g.textShadow("TEN TALENTS", 8, 5, 2, P.goldLite);

      var left = Math.max(0, Math.ceil(ROUND - g.time));
      var urgent = left < 15;
      g.text("TIME", W - 8 - g.textWidth("00", 2) - 30, 6, 1, P.dim);
      g.textShadow(String(left), W - 8, 4, 2, urgent && Math.floor(g.wall * 4) % 2 === 0 ? P.crimsonLite
                   : urgent ? P.crimson : P.parchment, "right");

      g.text("ESTATE", 8, 24, 1, P.dim);
      g.textShadow(String(Math.round(invest + keep + neighbors * 55)), 8 + 44, 23, 1,
                   lastEarn > 0 ? P.white : P.oliveLite);
      if (strings) {
        g.text("STRINGS " + strings, W - 8, 25, 1, P.crimsonLite, "right");
      } else {
        g.text("NO STRINGS", W - 8, 25, 1, P.dimmer, "right");
      }

      // the split, three slices you steer while you work
      var labels = ["GIVE", "INVEST", "KEEP"];
      var colors = [P.oliveLite, P.goldLite, P.sky];
      for (var i = 0; i < 3; i++) {
        var bx = 8 + i * 96, bw2 = 88;
        var sel = alloc === i;
        if (sel) {
          g.rect(bx - 3, 34, bw2 + 6, 22, "rgba(255,255,255,.07)");
          g.frameRect(bx - 3, 34, bw2 + 6, 22, "rgba(244,234,216,.55)", 1);
        }
        g.text(labels[i], bx, 37, 1, sel ? P.parchment : P.dim);
        g.text(Math.round(split[i]) + "%", bx + bw2, 37, 1, sel ? P.parchment : P.dimmer, "right");
        g.rect(bx, 48, bw2, 5, "#141d33");
        g.rect(bx, 48, Math.round(split[i] / 100 * bw2), 5, colors[i]);
        g.frameRect(bx, 48, bw2, 5, "rgba(0,0,0,.4)", 1);
      }

      /* ---- ticker ---- */
      if (toastT > 0) {
        g.ctx.globalAlpha = Math.min(1, toastT * 2);
        g.textBlock(toast, W / 2, FLOOR + 16, W - 16, 1,
                    strings && toast.indexOf("SUBSIDY") === 0 ? P.crimsonLite : P.parchment, "center");
        g.ctx.globalAlpha = 1;
      } else {
        g.text("SPACE PICKS A SLICE - UP AND DOWN MOVE IT", W / 2, FLOOR + 18, 1,
               "rgba(139,151,184,.5)", "center");
      }

      /* ---- the books ---- */
      var ly = H - 30;
      g.rect(8, ly - 5, W - 16, 1, "rgba(217,164,65,.22)");
      g.text("GIVEN " + Math.round(give), 8, ly, 1, P.oliveLite);
      g.text("INVESTED " + Math.round(invest), 8, ly + 11, 1, P.goldLite);
      g.text("KEPT " + Math.round(keep), 8 + 118, ly, 1, P.sky);
      g.text("NEIGHBOURS " + neighbors, 8 + 118, ly + 11, 1, neighbors ? P.oliveLite : P.dimmer);
      if (subsidiesTaken) {
        g.text("STRINGS " + strings, W - 8, ly + 11, 1, P.crimsonLite, "right");
      }
    }
  });

  /* ---------- allocation ---------- */

  function earn(amount) {
    give += amount * split[0] / 100;
    invest += amount * split[1] / 100;
    keep += amount * split[2] / 100;
    if (give >= (neighbors + 1) * 90) {
      neighbors++;
      toast = "YOU PAID FOR " + Arcade.pick(GIFTS) + ".";
      toastT = 2.6;
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
    if (pool <= 0) { split[others[0]] = need / 2; split[others[1]] = need / 2; }
    else {
      split[others[0]] = split[others[0]] / pool * need;
      split[others[1]] = split[others[1]] / pool * need;
    }
  }

  function drawHouse(g, x, y, w, h, lit, phase) {
    g.rect(x, y + 6, w, h - 6, "#1a2440");
    g.rect(x, y + 6, w, 1, "#26325a");
    // roof
    for (var r = 0; r < 7; r++) g.rect(x - 3 + r, y + r, w + 6 - r * 2, 1, "#2b3a63");
    // windows
    var cols = Math.floor((w - 6) / 9);
    for (var i = 0; i < cols; i++) {
      var on = lit > 0 && (Math.sin(phase * 0.7 + i * 2) > -0.6);
      g.rect(x + 4 + i * 9, y + 12, 6, 6, on ? "#ffcb6b" : "#101a30");
      if (on) g.rect(x + 4 + i * 9, y + 12, 6, 1, "#fff2cf");
    }
    g.rect(x + Math.floor(w / 2) - 3, y + h - 9, 6, 9, "#3a2415");
  }

  // Number keys give direct control over the split.
  window.addEventListener("keydown", function (e) {
    var map = { Digit1: 0, Digit2: 1, Digit3: 2 };
    if (!(e.code in map)) return;
    e.preventDefault();
    alloc = map[e.code];
    shift(alloc, 5);
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-alloc]"), function (el) {
    el.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      alloc = parseInt(el.getAttribute("data-alloc"), 10);
      shift(alloc, 5);
    });
  });
})();
