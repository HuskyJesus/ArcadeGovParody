/* ============================================================
   Attract mode for the lobby.

   Each cabinet card on the floor runs a tiny looping vignette of
   its game, all driven from one animation frame so the page stays
   cheap. Cards that scroll out of view stop drawing; a viewer who
   asked for reduced motion gets a single still frame instead.
   ============================================================ */
(function () {
  "use strict";

  var CW = 120, CH = 90;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var C = {
    ink: "#05070f", night: "#0c1428", deep: "#101a2c",
    gold: "#d9a441", goldLite: "#ffcb6b", cream: "#e6d8bd", parchment: "#f4ead8",
    crimson: "#b3313a", crimsonLite: "#e8646d",
    olive: "#4f7d5a", oliveLite: "#7cc194",
    sky: "#7fb2dd", brown: "#8a5a3b", brownDeep: "#4a2f1c",
    slate: "#1c2748", steel: "#2a3560", dim: "#5a6489"
  };

  function px(ctx, x, y, w, h, col) {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  // The same bitmap font the cabinets themselves use, so the little HUDs
  // in attract mode are the real thing rather than an imitation of it.
  function txt(ctx, str, x, y, col, align) {
    if (!window.PixelFont) return;
    var w = window.PixelFont.measure(str, 1);
    var px2 = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
    window.PixelFont.draw(ctx, str, px2, y, 1, col);
  }

  function stars(ctx, t, n, h) {
    for (var i = 0; i < n; i++) {
      var x = (i * 47) % CW, y = (i * 29) % h;
      if (Math.sin(t * 1.5 + i) > -0.4) px(ctx, x, y, 1, 1, "rgba(244,234,216,.45)");
    }
  }

  /* ---- Living Stones: blocks fall and a row lights up ---- */
  function livingStones(ctx, t) {
    px(ctx, 0, 0, CW, CH, C.night);
    stars(ctx, t, 12, 30);
    var loop = t % 4.2;
    var drop = Math.min(34, loop * 22);
    var settled = loop > 1.9;

    var baseY = 56;
    var rows = [
      [1,1,1,1,1,1,0,0],
      [1,1,1,1,1,1,1,1]
    ];
    // the roof, drawn over the course as soon as it completes
    if (settled) {
      for (var k = 0; k <= 12; k++) {
        var a = 1 - Math.min(1, (loop - 1.9) * 2.2);
        var col = "rgba(255,203,107," + (0.75 - a * 0.5) + ")";
        px(ctx, 60 - k * 3, baseY - 4 - k, 3, 1, col);
        px(ctx, 60 + k * 3, baseY - 4 - k, 3, 1, col);
      }
      px(ctx, 58, baseY - 18, 5, 3, C.goldLite);
    }
    for (var r = 0; r < rows.length; r++) {
      for (var c = 0; c < rows[r].length; c++) {
        if (!rows[r][c]) continue;
        var lit = settled && r === 0;
        stone(ctx, 22 + c * 10, baseY + r * 10, lit ? C.goldLite : (c % 2 ? C.brown : "#a0522d"));
      }
    }
    if (!settled) {
      stone(ctx, 82, 20 + drop, "#4f7d5a");
      stone(ctx, 92, 20 + drop, "#4f7d5a");
    } else {
      stone(ctx, 82, baseY, C.goldLite);
      stone(ctx, 92, baseY, C.goldLite);
      // a short, deliberate shower rather than a scatter
      var lift = (loop - 1.9) * 46;
      for (var s2 = 0; s2 < 6; s2++) {
        px(ctx, 28 + s2 * 13, baseY - lift + Math.sin(s2 * 1.7) * 4, 1, 2, C.goldLite);
      }
    }
    px(ctx, 0, 78, CW, 2, C.steel);
    px(ctx, 0, 80, CW, 10, "#0a1120");
    txt(ctx, "HOUSED", 4, 82, C.dim);
    txt(ctx, settled ? "1" : "0", 44, 82, settled ? C.oliveLite : C.dim);
    txt(ctx, "SHELTER", 116, 82, C.gold, "right");
  }
  function stone(ctx, x, y, col) {
    px(ctx, x, y, 9, 9, col);
    px(ctx, x, y, 9, 1, "rgba(255,255,255,.28)");
    px(ctx, x, y + 8, 9, 1, "rgba(0,0,0,.35)");
    px(ctx, x + 1, y + 4, 7, 1, "rgba(0,0,0,.22)");
  }

  /* ---- The Ninety-Nine: a shepherd leads a flock to an open gate ---- */
  function ninetyNine(ctx, t) {
    px(ctx, 0, 0, CW, CH, C.deep);
    // hills behind the pasture
    for (var h = 0; h < CW; h += 2) {
      var hh = 6 + Math.sin(h * 0.06) * 4 + Math.sin(h * 0.02) * 3;
      px(ctx, h, 24 - hh, 2, hh + 2, "#152241");
    }
    for (var g = 0; g < 22; g++) {
      px(ctx, (g * 23) % CW, 28 + (g * 31) % 48, 3, 1, "#1e3a2c");
    }
    var loop = (t * 15) % 150;
    var hx = -18 + loop;
    var lineY = 52;

    // the gate, standing open
    px(ctx, 98, lineY - 12, 3, 22, C.brown);
    px(ctx, 114, lineY - 12, 3, 22, C.brown);
    px(ctx, 98, lineY - 12, 19, 3, C.brown);
    var pulse = Math.sin(t * 3) > 0 ? 0.8 : 0.42;
    px(ctx, 101, lineY - 4, 13, 1, "rgba(124,193,148," + pulse + ")");
    px(ctx, 101, lineY + 2, 13, 1, "rgba(124,193,148," + (pulse - 0.22) + ")");

    for (var i = 0; i < 4; i++) {
      var sx = hx - 12 - i * 11;
      if (sx < -10) continue;
      sheep(ctx, sx, lineY + 2 - ((Math.floor(t * 6) + i) % 2));
    }
    // the one still lost, bleating up ahead
    if (loop < 100) {
      var lb = Math.sin(t * 7) > 0 ? 0 : 1;
      sheep(ctx, 58, 30 - lb);
      px(ctx, 64, 25 - lb, 1, 2, C.goldLite);
      px(ctx, 67, 23 - lb, 1, 2, C.goldLite);
    }
    // shepherd with staff
    px(ctx, hx, lineY, 7, 8, C.gold);
    px(ctx, hx + 2, lineY - 2, 4, 3, "#e0b088");
    px(ctx, hx + 7, lineY - 4, 1, 13, C.brown);

    px(ctx, 0, 78, CW, 2, "#132033");
    px(ctx, 0, 80, CW, 10, "#0a1120");
    txt(ctx, "CARRYING", 4, 82, C.dim);
    txt(ctx, "4", 52, 82, C.parchment);
    txt(ctx, "HOME 12", 116, 82, C.oliveLite, "right");
  }
  function sheep(ctx, x, y) {
    px(ctx, x, y, 8, 5, "#f2ece0");
    px(ctx, x + 7, y + 1, 2, 3, "#3a3129");
    px(ctx, x + 1, y + 5, 1, 2, "#4a3f36");
    px(ctx, x + 5, y + 5, 1, 2, "#4a3f36");
  }

  /* ---- Honest Scales: a balance tips, a crate rides the belt ---- */
  function honestScales(ctx, t) {
    px(ctx, 0, 0, CW, CH, "#0b1220");
    for (var i = 0; i < CW; i += 12) {
      px(ctx, i, 0, 6, 5, "rgba(179,49,58,.55)");
      px(ctx, i + 6, 0, 6, 5, "rgba(230,216,189,.16)");
    }
    px(ctx, 0, 5, CW, 1, "rgba(217,164,65,.45)");

    var loop = t % 3.6;
    var honest = Math.floor(t / 3.6) % 2 === 0;
    var tilt = loop > 1.5 ? (honest ? 0 : 4) : 0;

    // the balance, hung on a chain, centred over the inspection bay
    var bx = 60;
    for (var ch = 8; ch < 24; ch += 5) px(ctx, bx, ch, 1, 3, "#6f7b99");
    px(ctx, bx - 16, 26 - tilt, 33, 2, "#cfd6e6");
    px(ctx, bx - 1, 24, 3, 4, "#8b97b8");
    px(ctx, bx - 18, 28 - tilt, 8, 1, "#cfd6e6");
    px(ctx, bx + 12, 28 + tilt, 8, 1, "#cfd6e6");

    // the inspection bay, marked by corner brackets
    var bay = [40, 16, 41, 56];
    px(ctx, bay[0], bay[1], 6, 1, "rgba(255,203,107,.7)");
    px(ctx, bay[0], bay[1], 1, 6, "rgba(255,203,107,.7)");
    px(ctx, bay[0] + bay[2] - 6, bay[1], 6, 1, "rgba(255,203,107,.7)");
    px(ctx, bay[0] + bay[2] - 1, bay[1], 1, 6, "rgba(255,203,107,.7)");
    px(ctx, bay[0], bay[1] + bay[3] - 1, 6, 1, "rgba(255,203,107,.7)");
    px(ctx, bay[0], bay[1] + bay[3] - 6, 1, 6, "rgba(255,203,107,.7)");
    px(ctx, bay[0] + bay[2] - 6, bay[1] + bay[3] - 1, 6, 1, "rgba(255,203,107,.7)");
    px(ctx, bay[0] + bay[2] - 1, bay[1] + bay[3] - 6, 1, 6, "rgba(255,203,107,.7)");

    // belt
    px(ctx, 0, 62, CW, 12, "#1a2340");
    px(ctx, 0, 62, CW, 1, "rgba(217,164,65,.5)");
    px(ctx, 0, 73, CW, 1, "rgba(217,164,65,.5)");
    var off = Math.floor((t * 24) % 10);
    for (i = -10; i < CW + 10; i += 10) px(ctx, i - off, 70, 5, 2, "rgba(139,151,184,.28)");

    // the crate crossing the bay
    var cx = 106 - (loop / 3.6) * 112;
    px(ctx, cx + 1, 34, 18, 5, C.cream);                       // the label it claims
    px(ctx, cx, 42, 20, 20, C.brown);
    px(ctx, cx + 2, 44, 16, 16, honest ? C.cream : "#c8a24a");
    px(ctx, cx, 48, 20, 1, "rgba(0,0,0,.3)");
    px(ctx, cx, 55, 20, 1, "rgba(0,0,0,.3)");
    if (loop > 1.9) {
      var col = honest ? C.oliveLite : C.crimsonLite;
      px(ctx, cx - 1, 46, 22, 9, "rgba(4,6,13,.8)");
      px(ctx, cx - 1, 46, 22, 1, col); px(ctx, cx - 1, 54, 22, 1, col);
      px(ctx, cx - 1, 46, 1, 9, col);  px(ctx, cx + 20, 46, 1, 9, col);
      txt(ctx, honest ? "FAIR" : "FALSE", cx + 10, 48, col, "center");
    }

    px(ctx, 4, 78, 34, 8, "rgba(179,49,58,.25)");
    txt(ctx, "REFUSE", 21, 79, C.crimsonLite, "center");
    px(ctx, 82, 78, 34, 8, "rgba(79,125,90,.25)");
    txt(ctx, "SELL", 99, 79, C.oliveLite, "center");
  }

  /* ---- Enumerated: the eagle threads a gate, its bill trailing ---- */
  function enumerated(ctx, t) {
    px(ctx, 0, 0, CW, CH, "#16234a");
    stars(ctx, t, 10, 34);
    var sx = -(t * 7) % 120;
    // the Mall behind
    px(ctx, 8 + sx, 50, 20, 24, "#1b2749");
    px(ctx, 14 + sx, 42, 8, 8, "#1b2749");
    px(ctx, 17 + sx, 38, 2, 4, C.gold);
    px(ctx, 60 + sx, 30, 5, 44, "#1b2749");
    px(ctx, 92 + sx, 56, 18, 18, "#1b2749");
    px(ctx, 0, 74, CW, 16, "#1b2a1c");
    px(ctx, 0, 74, CW, 1, "#3d5a34");
    var mow = Math.floor((t * 24) % 12);
    for (var gq = -12; gq < CW + 12; gq += 12) px(ctx, gq - mow, 79, 6, 1, "rgba(61,90,52,.55)");

    // the gate slides across and wraps; its plaque only draws while the
    // gate is actually on the glass, or it smears across the HUD
    var gx = 108 - (t * 24) % 128;
    var top = 16, gap = 38;
    column(ctx, gx, 0, top);
    column(ctx, gx, top + gap, 74 - top - gap);
    if (gx > 4 && gx < CW - 18) txt(ctx, "SENATE", gx + 7, top + 2, C.gold, "center");

    // eagle: white head, gold beak, one wing beating
    var flap = Math.sin(t * 9) > 0;
    var by = Math.round(28 + Math.sin(t * 2.1) * 8);
    px(ctx, 22, by + 2, 13, 6, "#6b4226");                   // body
    px(ctx, 30, by - 2, 7, 5, C.parchment);                  // head
    px(ctx, 37, by, 3, 2, C.gold);                           // beak
    px(ctx, 32, by - 1, 1, 1, "#1a1a1a");                    // eye
    px(ctx, 16, by + (flap ? -3 : 4), 9, 4, "#4a2f1c");      // wing
    px(ctx, 25, by + 8, 2, 2, "#8a5a3b");                    // talons
    px(ctx, 31, by + 8, 2, 2, "#8a5a3b");
    px(ctx, 24, by + 10, 11, 15, C.cream);                   // the bill it carries
    px(ctx, 24, by + 10, 11, 1, "#fdf6e6");
    for (var l = 3; l < 14; l += 4) px(ctx, 26, by + 10 + l, 7, 1, "rgba(90,80,60,.55)");

    // a gavel drifting past
    var pk = 116 - (t * 24 + 66) % 132;
    px(ctx, pk - 4, 52, 9, 3, C.goldLite);
    px(ctx, pk - 1, 55, 2, 5, C.brown);

    px(ctx, 0, 0, CW, 9, "rgba(4,6,13,.72)");
    txt(ctx, "PAGES 6", 3, 1, C.oliveLite);
    txt(ctx, "GATES 4", 117, 1, C.goldLite, "right");
  }
  function column(ctx, x, y, h) {
    if (h <= 0) return;
    px(ctx, x, y, 14, h, "#2a3560");
    for (var f = 3; f < 12; f += 4) px(ctx, x + f, y + 1, 1, h - 2, "rgba(255,255,255,.09)");
    px(ctx, x - 1, y + (h > 20 ? 0 : h - 4), 16, 4, "#3a4878");
    px(ctx, x, y, 14, 1, "rgba(217,164,65,.6)");
    px(ctx, x, y + h - 1, 14, 1, "rgba(217,164,65,.6)");
  }

  /* ---- Ten Talents: coins fall to a basket; a subsidy trails strings ---- */
  function tenTalents(ctx, t) {
    px(ctx, 0, 0, CW, CH, "#0a1020");
    stars(ctx, t, 14, 50);
    // house with a lit window
    px(ctx, 88, 56, 26, 20, "#1a2440");
    for (var r = 0; r < 5; r++) px(ctx, 86 + r, 51 + r, 30 - r * 2, 1, "#2b3a63");
    var on = Math.sin(t * 1.4) > -0.5;
    px(ctx, 93, 61, 6, 6, on ? C.goldLite : "#101a30");
    px(ctx, 104, 61, 6, 6, on ? C.goldLite : "#101a30");

    var bx = 30 + Math.sin(t * 1.1) * 18;
    // falling coins
    for (var i = 0; i < 3; i++) {
      var cy = ((t * 34 + i * 30) % 74) + 4;
      var cx = 18 + i * 22 + Math.sin(i * 2) * 4;
      var w = Math.max(2, Math.round(Math.abs(Math.sin(t * 5 + i)) * 6) + 1);
      px(ctx, cx - w / 2, cy, w, 7, "#a8761f");
      px(ctx, cx - w / 2, cy, w, 5, C.gold);
      px(ctx, cx - w / 2 + 1, cy + 1, Math.max(1, w - 2), 2, C.goldLite);
    }
    // the subsidy, trailing its strings
    var sy = ((t * 26 + 40) % 96) - 12;
    px(ctx, 68, sy, 12, 10, C.crimson);
    px(ctx, 70, sy + 2, 8, 6, C.crimsonLite);
    for (var s = 0; s < 3; s++) px(ctx, 70 + s * 4, Math.max(0, sy - 14), 1, 14, "rgba(179,49,58,.55)");

    // basket
    px(ctx, bx, 72, 30, 9, "#6b4226");
    px(ctx, bx + 1, 73, 28, 7, C.brown);
    for (var wv = 3; wv < 28; wv += 5) px(ctx, bx + wv, 73, 1, 7, "rgba(0,0,0,.3)");
    px(ctx, bx, 72, 30, 2, C.gold);

    // the split, as the cabinet shows it
    px(ctx, 0, 0, CW, 9, "rgba(4,6,13,.72)");
    txt(ctx, "GIVE", 3, 1, C.oliveLite);
    px(ctx, 27, 2, 14, 4, "#141d33"); px(ctx, 27, 2, 4, 4, C.oliveLite);
    txt(ctx, "INV", 45, 1, C.goldLite);
    px(ctx, 65, 2, 14, 4, "#141d33"); px(ctx, 65, 2, 7, 4, C.goldLite);
    txt(ctx, "KEEP", 83, 1, C.sky);
    px(ctx, 108, 2, 10, 4, "#141d33"); px(ctx, 108, 2, 4, 4, C.sky);
  }

  var RENDERERS = {
    "living-stones": livingStones,
    "ninety-nine": ninetyNine,
    "honest-scales": honestScales,
    "enumerated": enumerated,
    "ten-talents": tenTalents
  };

  /* ---- Jubilee: the locked cabinet, still keeping its own time ---- */
  function jubilee(ctx, t) {
    px(ctx, 0, 0, CW, CH, "#05070f");
    txt(ctx, "JUBILEE", 60, 16, C.gold, "center");
    var lit = Math.floor(t) % 8;
    for (var i = 0; i < 7; i++) {
      var on = i < lit;
      px(ctx, 25 + i * 11, 34, 8, 8, on ? C.gold : "#141d33");
      if (on) px(ctx, 25 + i * 11, 34, 8, 1, C.goldLite);
    }
    px(ctx, 25, 47, 73, 1, "rgba(217,164,65,.3)");
    // a ledger line, struck through once the seventh seven lands
    txt(ctx, "DEBT OWED", 60, 55, lit >= 7 ? C.dim : C.parchment, "center");
    if (lit >= 7) px(ctx, 32, 58, 56, 1, C.crimson);
    txt(ctx, lit >= 7 ? "FORGIVEN" : "YEAR " + lit, 60, 70, lit >= 7 ? C.oliveLite : C.dim, "center");
  }

  RENDERERS.jubilee = jubilee;

  /* ---- driver ---- */

  var screens = [];
  Array.prototype.forEach.call(document.querySelectorAll("canvas[data-attract]"), function (cv) {
    var name = cv.getAttribute("data-attract");
    if (!RENDERERS[name]) return;
    cv.width = CW; cv.height = CH;
    var ctx = cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    screens.push({ cv: cv, ctx: ctx, fn: RENDERERS[name], visible: true, seed: screens.length * 1.7 });
  });

  if (!screens.length) return;

  // Only animate what is actually on screen.
  if (window.IntersectionObserver) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        for (var i = 0; i < screens.length; i++) {
          if (screens[i].cv === e.target) screens[i].visible = e.isIntersecting;
        }
      });
    }, { rootMargin: "120px" });
    screens.forEach(function (s) { io.observe(s.cv); });
  }

  if (reduced) {
    screens.forEach(function (s) { s.fn(s.ctx, 1.2 + s.seed); });
    return;
  }

  var start = performance.now();
  function frame(now) {
    var t = (now - start) / 1000;
    for (var i = 0; i < screens.length; i++) {
      if (screens[i].visible) screens[i].fn(screens[i].ctx, t + screens[i].seed);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
