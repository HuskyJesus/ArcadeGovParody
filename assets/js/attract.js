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

  /* ---- Build the Bridge: girders close the gap, somebody walks across ---- */
  function buildTheBridge(ctx, t) {
    px(ctx, 0, 0, CW, CH, C.night);
    stars(ctx, t, 12, 30);
    var loop = t % 4.6;
    var settled = loop > 1.7;
    var deckY = 50;

    // the river, drifting
    px(ctx, 0, 60, CW, 18, "#0b1830");
    for (var w = 0; w < 5; w++) {
      var d = Math.sin(t * 1.3 + w) * 4;
      px(ctx, 10 + w * 22 + d, 64 + (w % 3) * 4, 10, 1, "rgba(127,178,221,.3)");
    }
    // the banks
    px(ctx, 0, 46, 18, 32, "#3a4664");
    px(ctx, 102, 46, 18, 32, "#3a4664");
    px(ctx, 0, 46, 18, 1, "#59689e");
    px(ctx, 102, 46, 18, 1, "#59689e");

    // the deck: every girder but the last is already in
    for (var c = 0; c < 8; c++) {
      if (c >= 6 && !settled) continue;
      stone(ctx, 20 + c * 10, deckY, settled ? C.goldLite : (c % 2 ? C.brown : "#a0522d"));
    }
    if (!settled) {
      var drop = Math.min(36, loop * 22);
      stone(ctx, 80, 14 + drop, "#4f7d5a");
      stone(ctx, 90, 14 + drop, "#4f7d5a");
    } else {
      // and somebody walks across it
      var wx = 6 + (loop - 1.7) * 38;
      var step = Math.floor(t * 8) % 2;
      px(ctx, wx + 1, deckY - 9, 3, 3, "#e0b088");
      px(ctx, wx, deckY - 6, 5, 4, C.sky);
      px(ctx, wx + step, deckY - 2, 1, 2, "#3a4358");
      px(ctx, wx + 3 - step, deckY - 2, 1, 2, "#3a4358");
    }

    px(ctx, 0, 80, CW, 10, "#0a1120");
    txt(ctx, "CROSSED", 4, 82, C.dim);
    txt(ctx, settled ? "1" : "0", 50, 82, settled ? C.oliveLite : C.dim);
    txt(ctx, "SPANS", 116, 82, C.gold, "right");
  }
  function stone(ctx, x, y, col) {
    px(ctx, x, y, 9, 9, col);
    px(ctx, x, y, 9, 1, "rgba(255,255,255,.28)");
    px(ctx, x, y + 8, 9, 1, "rgba(0,0,0,.35)");
    px(ctx, x + 1, y + 4, 7, 1, "rgba(0,0,0,.22)");
  }

  /* ---- Welcome Wagon: a van, its passengers, a lit door ---- */
  function welcomeWagon(ctx, t) {
    px(ctx, 0, 0, CW, CH, C.deep);
    for (var h = 0; h < CW; h += 2) {
      var hh = 6 + Math.sin(h * 0.06) * 4 + Math.sin(h * 0.02) * 3;
      px(ctx, h, 24 - hh, 2, hh + 2, "#152241");
    }
    px(ctx, 0, 60, CW, 1, "rgba(139,151,184,.18)");            // the road edge
    var loop = (t * 15) % 150;
    var vx = -18 + loop;
    var lineY = 50;

    // the welcome centre
    px(ctx, 96, lineY - 12, 20, 20, "#2b3a63");
    px(ctx, 95, lineY - 15, 22, 4, C.olive);
    px(ctx, 95, lineY - 15, 22, 1, C.oliveLite);
    var lit = Math.sin(t * 3) > -0.4;
    px(ctx, 102, lineY - 4, 8, 12, lit ? C.goldLite : "#3a4358");

    // passengers riding along behind
    for (var i = 0; i < 4; i++) {
      var sx = vx - 9 - i * 8;
      if (sx < -8) continue;
      var bob = (Math.floor(t * 6) + i) % 2;
      person(ctx, sx, lineY + 1 - bob, i % 2 ? C.oliveLite : C.sky);
    }
    // somebody up ahead, waving for a lift
    if (loop < 100) {
      var wb = Math.sin(t * 7) > 0 ? 0 : 1;
      person(ctx, 58, 30 - wb, C.sky);
      px(ctx, 62, 27 - wb, 1, 3, C.goldLite);
    }
    // the wagon
    px(ctx, vx, lineY, 12, 6, C.gold);
    px(ctx, vx + 2, lineY - 2, 8, 2, "#9fd0f0");
    px(ctx, vx + 1, lineY + 6, 2, 2, "#2a2320");
    px(ctx, vx + 9, lineY + 6, 2, 2, "#2a2320");
    px(ctx, vx + 12, lineY + 2, 1, 2, "#fff2cf");

    px(ctx, 0, 80, CW, 10, "#0a1120");
    txt(ctx, "ABOARD", 4, 82, C.dim);
    txt(ctx, "4", 44, 82, C.parchment);
    txt(ctx, "DROPPED 12", 116, 82, C.oliveLite, "right");
  }
  function person(ctx, x, y, shirt) {
    px(ctx, x + 1, y, 3, 3, "#e0b088");
    px(ctx, x, y + 3, 5, 4, shirt);
    px(ctx, x + 1, y + 7, 1, 2, "#3a4358");
    px(ctx, x + 3, y + 7, 1, 2, "#3a4358");
  }

  /* ---- Lunch Lady: a clipboard, a tray, a lid, a verdict ---- */
  function lunchLady(ctx, t) {
    px(ctx, 0, 0, CW, CH, "#0b1220");
    for (var i = 0; i < CW; i += 12) {
      px(ctx, i, 0, 6, 5, "rgba(179,49,58,.55)");
      px(ctx, i + 6, 0, 6, 5, "rgba(230,216,189,.16)");
    }
    px(ctx, 0, 5, CW, 1, "rgba(217,164,65,.45)");

    var loop = t % 3.6;
    var fine = Math.floor(t / 3.6) % 2 === 0;

    // the inspector's clipboard, hung on a chain
    var bx = 60;
    for (var ch = 8; ch < 18; ch += 4) px(ctx, bx, ch, 1, 2, "#6f7b99");
    px(ctx, bx - 9, 18, 19, 14, "#d8cdb4");
    px(ctx, bx - 9, 18, 19, 2, "#8b97b8");
    px(ctx, bx - 7, 23, 15, 1, "rgba(90,80,60,.5)");
    px(ctx, bx - 7, 26, 10, 1, "rgba(90,80,60,.35)");

    // the line
    px(ctx, 0, 62, CW, 12, "#1a2340");
    px(ctx, 0, 62, CW, 1, "rgba(217,164,65,.5)");
    px(ctx, 0, 73, CW, 1, "rgba(217,164,65,.5)");
    var off = Math.floor((t * 24) % 10);
    for (i = -10; i < CW + 10; i += 10) px(ctx, i - off, 70, 5, 2, "rgba(139,151,184,.28)");

    // a tray, lid coming up as it passes under the clipboard
    var cx = 106 - (loop / 3.6) * 112;
    px(ctx, cx, 50, 24, 12, "#9aa6c4");
    px(ctx, cx + 2, 52, 9, 8, "#6f7b99");
    px(ctx, cx + 13, 52, 9, 8, "#6f7b99");
    var open = loop > 1.5;
    if (open) {
      px(ctx, cx + 3, 53, 7, 6, "#d97b41");
      px(ctx, cx + 14, 53, 7, 6, "#c8a24a");
      if (!fine) { px(ctx, cx + 5, 55, 2, 2, "#7cc194"); px(ctx, cx + 16, 54, 2, 2, "#7cc194"); }
      px(ctx, cx - 2, 44, 28, 2, "#cfd6e6");                    // lid, up
    } else {
      px(ctx, cx - 1, 46, 26, 5, "#cfd6e6");                    // lid, down
      px(ctx, cx + 10, 43, 4, 3, "#8b97b8");
    }
    // the stamp on the side
    px(ctx, cx - 1, 34, 26, 7, "#e6d8bd");
    if (loop > 1.9) {
      var col = fine ? C.oliveLite : C.crimsonLite;
      txt(ctx, fine ? "SERVE" : "BIN", cx + 12, 35, col, "center");
    }

    px(ctx, 4, 78, 34, 8, "rgba(179,49,58,.25)");
    txt(ctx, "BIN IT", 21, 79, C.crimsonLite, "center");
    px(ctx, 82, 78, 34, 8, "rgba(79,125,90,.25)");
    txt(ctx, "SERVE", 99, 79, C.oliveLite, "center");
  }

  /* ---- How a Bill Becomes Law: the eagle threads a stage, bill trailing ---- */
  function billBecomesLaw(ctx, t) {
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
    if (gx > 4 && gx < CW - 18) txt(ctx, "CLOTURE", gx + 7, top - 7, C.gold, "center");

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

    px(ctx, 0, 0, CW, 9, "#070c18");
    txt(ctx, "PAGES 6", 3, 1, C.oliveLite);
    txt(ctx, "STAGE 4", 117, 1, C.goldLite, "right");
  }
  function column(ctx, x, y, h) {
    if (h <= 0) return;
    px(ctx, x, y, 14, h, "#2a3560");
    for (var f = 3; f < 12; f += 4) px(ctx, x + f, y + 1, 1, h - 2, "rgba(255,255,255,.09)");
    px(ctx, x - 1, y + (h > 20 ? 0 : h - 4), 16, 4, "#3a4878");
    px(ctx, x, y, 14, 1, "rgba(217,164,65,.6)");
    px(ctx, x, y + h - 1, 14, 1, "rgba(217,164,65,.6)");
  }

  /* ---- No Strings Attached: coins fall; the free money trails strings ---- */
  function noStrings(ctx, t) {
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
    px(ctx, 0, 0, CW, 9, "#070c18");
    txt(ctx, "GIVE", 3, 1, C.oliveLite);
    px(ctx, 27, 2, 14, 4, "#141d33"); px(ctx, 27, 2, 4, 4, C.oliveLite);
    txt(ctx, "GROW", 45, 1, C.goldLite);
    px(ctx, 71, 2, 8, 4, "#141d33"); px(ctx, 71, 2, 4, 4, C.goldLite);
    txt(ctx, "KEEP", 83, 1, C.sky);
    px(ctx, 108, 2, 10, 4, "#141d33"); px(ctx, 108, 2, 4, 4, C.sky);
  }

  var RENDERERS = {
    "build-the-bridge": buildTheBridge,
    "welcome-wagon": welcomeWagon,
    "lunch-lady": lunchLady,
    "bill-becomes-law": billBecomesLaw,
    "no-strings": noStrings
  };

  /* ---- Clean Slate: the out-of-order cabinet, still keeping its own time ---- */
  function cleanSlate(ctx, t) {
    px(ctx, 0, 0, CW, CH, "#05070f");
    txt(ctx, "CLEAN SLATE", 60, 16, C.gold, "center");
    var lit = Math.floor(t) % 8;
    for (var i = 0; i < 7; i++) {
      var on = i < lit;
      px(ctx, 25 + i * 11, 34, 8, 8, on ? C.gold : "#141d33");
      if (on) px(ctx, 25 + i * 11, 34, 8, 1, C.goldLite);
    }
    px(ctx, 25, 47, 73, 1, "rgba(217,164,65,.3)");
    // the balance, struck through once the seventh year lands
    txt(ctx, "YOU OWE", 60, 55, lit >= 7 ? C.dim : C.parchment, "center");
    if (lit >= 7) px(ctx, 32, 58, 56, 1, C.crimson);
    txt(ctx, lit >= 7 ? "NOTHING" : "YEAR " + lit, 60, 70, lit >= 7 ? C.oliveLite : C.dim, "center");
  }

  RENDERERS["clean-slate"] = cleanSlate;

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
