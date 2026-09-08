/* ============================================================
   The Free Arcade — engine shared by every cabinet.

   Fixed logical resolution, integer-scaled by CSS, pixelated.
   Text is drawn from our own bitmap font (see pixelfont.js) so it
   is exact at every size on every machine. Sprites are authored as
   little ASCII grids with a colour key, which keeps the art legible
   in the source and trivially editable.
   ============================================================ */
(function (global) {
  "use strict";

  var PF = global.PixelFont;

  var PALETTE = {
    ink: "#04060d",
    night: "#0a0f1e",
    deep: "#0d1424",
    slate: "#1c2748",
    steel: "#2a3560",
    parchment: "#f4ead8",
    cream: "#e6d8bd",
    dim: "#8b97b8",
    dimmer: "#5a6489",
    gold: "#d9a441",
    goldLite: "#ffcb6b",
    goldDeep: "#a8761f",
    crimson: "#b3313a",
    crimsonLite: "#e8646d",
    olive: "#4f7d5a",
    oliveLite: "#7cc194",
    sky: "#7fb2dd",
    skyDeep: "#3f6d9e",
    brown: "#8a5a3b",
    brownDeep: "#4a2f1c",
    white: "#ffffff",
    black: "#000000"
  };

  var KEYMAP = {
    ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    KeyW: "up", KeyS: "down", KeyA: "left", KeyD: "right",
    Space: "action", Enter: "start", KeyP: "pause", KeyR: "restart",
    KeyX: "action", Escape: "pause"
  };

  /* ---------- persistence (throws in some locked-down browsers) --------- */

  function loadBest(key) {
    try {
      var v = global.localStorage.getItem("freearcade:" + key);
      return v ? parseInt(v, 10) || 0 : 0;
    } catch (e) { return 0; }
  }
  function saveBest(key, value) {
    try { global.localStorage.setItem("freearcade:" + key, String(value)); }
    catch (e) { /* private mode: the score simply does not persist */ }
  }

  /* ---------- engine ---------------------------------------------------- */

  function Arcade(config) {
    this.cfg = config;
    this.W = config.width;
    this.H = config.height;
    this.id = config.id;

    this.canvas = document.querySelector(config.canvas || "#screen");
    this.canvas.width = this.W;
    this.canvas.height = this.H;
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;

    this.state = "title";
    this.score = 0;
    this.best = loadBest(this.id);
    this.time = 0;
    this.wall = 0;               // runs in every state, for attract animation
    this.frame = 0;
    this.endLine = "";
    this.shake = 0;
    this.flashes = [];
    this.bits = [];              // particles

    this.down = Object.create(null);
    this.hit = Object.create(null);

    this._bindInput();

    // Initialise before the first frame: the attract screen draws the real
    // board behind its overlay, so nothing may be undefined yet.
    if (config.reset) config.reset(this);

    this._loop = this._loop.bind(this);
    this.last = 0;
    global.requestAnimationFrame(this._loop);
  }

  Arcade.prototype._bindInput = function () {
    var self = this;

    global.addEventListener("keydown", function (e) {
      var name = KEYMAP[e.code];
      if (!name) return;
      if (e.repeat) { self.down[name] = true; return; }
      e.preventDefault();
      self.down[name] = true;
      self.hit[name] = true;
      self._meta(name);
    });

    global.addEventListener("keyup", function (e) {
      var name = KEYMAP[e.code];
      if (name) { e.preventDefault(); self.down[name] = false; }
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-key]"), function (el) {
      var name = el.getAttribute("data-key");
      var press = function (e) {
        e.preventDefault();
        el.classList.add("lit");
        self.down[name] = true;
        self.hit[name] = true;
        self._meta(name);
      };
      var release = function (e) { e.preventDefault(); el.classList.remove("lit"); self.down[name] = false; };
      el.addEventListener("pointerdown", press);
      el.addEventListener("pointerup", release);
      el.addEventListener("pointercancel", release);
      el.addEventListener("pointerleave", release);
      el.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    });

    this.canvas.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      self.down.action = true;
      self.hit.action = true;
      self._meta("action");
    });
    this.canvas.addEventListener("pointerup", function () { self.down.action = false; });
  };

  Arcade.prototype._meta = function (name) {
    if (this.state === "title" && (name === "start" || name === "action")) this.begin();
    else if (this.state === "over" && (name === "start" || name === "action" || name === "restart")) this.begin();
    else if (this.state === "playing" && name === "pause") this.state = "paused";
    else if (this.state === "paused" && (name === "pause" || name === "start" || name === "action")) this.state = "playing";
    else if (this.state === "playing" && name === "restart") this.begin();
  };

  Arcade.prototype.begin = function () {
    this.score = 0;
    this.time = 0;
    this.endLine = "";
    this.bits.length = 0;
    this.flashes.length = 0;
    this.shake = 0;
    this.state = "playing";
    if (this.cfg.reset) this.cfg.reset(this);
  };

  Arcade.prototype.gameOver = function (line) {
    this.state = "over";
    this.endLine = line || "";
    this.kick(4);
    if (this.score > this.best) {
      this.best = this.score;
      saveBest(this.id, this.best);
      this.newBest = true;
    } else {
      this.newBest = false;
    }
  };

  Arcade.prototype.pressed = function (n) { return !!this.hit[n]; };
  Arcade.prototype.held = function (n) { return !!this.down[n]; };

  /* ---------- feedback -------------------------------------------------- */

  Arcade.prototype.kick = function (amount) { this.shake = Math.max(this.shake, amount || 3); };

  Arcade.prototype.flash = function (color, life) {
    this.flashes.push({ color: color, t: life || 0.25, life: life || 0.25 });
  };

  // A little shower of pixels. Cheap, and it makes every event feel landed.
  Arcade.prototype.burst = function (x, y, color, count, opts) {
    opts = opts || {};
    for (var i = 0; i < (count || 8); i++) {
      var a = opts.angle === undefined ? Math.random() * Math.PI * 2
            : opts.angle + (Math.random() - 0.5) * (opts.spread || 1.2);
      var sp = (opts.speed || 46) * (0.45 + Math.random() * 0.9);
      this.bits.push({
        x: x, y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - (opts.lift || 0),
        g: opts.gravity === undefined ? 130 : opts.gravity,
        t: (opts.life || 0.7) * (0.6 + Math.random() * 0.7),
        life: opts.life || 0.7,
        size: opts.size || 1,
        color: color
      });
    }
  };

  Arcade.prototype._stepEffects = function (dt) {
    var i;
    for (i = this.bits.length - 1; i >= 0; i--) {
      var b = this.bits[i];
      b.t -= dt;
      if (b.t <= 0) { this.bits.splice(i, 1); continue; }
      b.vy += b.g * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }
    for (i = this.flashes.length - 1; i >= 0; i--) {
      this.flashes[i].t -= dt;
      if (this.flashes[i].t <= 0) this.flashes.splice(i, 1);
    }
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 26);
  };

  Arcade.prototype.drawBits = function () {
    for (var i = 0; i < this.bits.length; i++) {
      var b = this.bits[i];
      this.ctx.globalAlpha = Math.min(1, b.t / b.life * 1.6);
      this.rect(b.x, b.y, b.size, b.size, b.color);
    }
    this.ctx.globalAlpha = 1;
  };

  /* ---------- loop ------------------------------------------------------ */

  Arcade.prototype._loop = function (now) {
    global.requestAnimationFrame(this._loop);
    if (!this.last) this.last = now;
    var dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    this.wall += dt;

    if (this.state === "playing") {
      this.time += dt;
      this.frame++;
      this.cfg.update(this, dt);
      this._stepEffects(dt);
    } else if (this.state === "over") {
      this._stepEffects(dt);
    }

    var ctx = this.ctx;
    ctx.save();
    if (this.shake > 0.2) {
      ctx.translate(Math.round((Math.random() - 0.5) * this.shake),
                    Math.round((Math.random() - 0.5) * this.shake));
    }
    this.cfg.draw(this, ctx);
    this.drawBits();
    ctx.restore();

    for (var i = 0; i < this.flashes.length; i++) {
      var f = this.flashes[i];
      ctx.globalAlpha = (f.t / f.life) * 0.5;
      this.rect(0, 0, this.W, this.H, f.color);
      ctx.globalAlpha = 1;
    }

    if (this.state === "title") this._titleCard();
    else if (this.state === "paused") this._pauseCard();
    else if (this.state === "over") this._overCard();

    this.hit = Object.create(null);
  };

  /* ---------- primitives ------------------------------------------------ */

  Arcade.prototype.rect = function (x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };

  Arcade.prototype.frameRect = function (x, y, w, h, color, t) {
    t = t || 1;
    this.rect(x, y, w, t, color);
    this.rect(x, y + h - t, w, t, color);
    this.rect(x, y, t, h, color);
    this.rect(x + w - t, y, t, h, color);
  };

  // A recessed panel with a lit top edge and a shadowed bottom: reads as
  // moulded plastic rather than a flat box.
  Arcade.prototype.panel = function (x, y, w, h, fill, edge) {
    this.rect(x, y, w, h, fill);
    this.rect(x, y, w, 1, "rgba(255,255,255,.10)");
    this.rect(x, y + h - 1, w, 1, "rgba(0,0,0,.45)");
    if (edge) this.frameRect(x, y, w, h, edge, 1);
  };

  Arcade.prototype.clear = function (color) { this.rect(0, 0, this.W, this.H, color || PALETTE.ink); };

  Arcade.prototype.shade = function (alpha, color) {
    this.ctx.fillStyle = color || "rgba(4,6,13,1)";
    this.ctx.globalAlpha = alpha === undefined ? 0.78 : alpha;
    this.ctx.fillRect(0, 0, this.W, this.H);
    this.ctx.globalAlpha = 1;
  };

  // Vertical gradient without leaving the pixel grid: banded fills.
  Arcade.prototype.gradient = function (x, y, w, h, from, to, bands) {
    bands = bands || 8;
    var f = hex(from), t = hex(to);
    for (var i = 0; i < bands; i++) {
      var k = i / (bands - 1 || 1);
      var c = "rgb(" + Math.round(f[0] + (t[0] - f[0]) * k) + "," +
                       Math.round(f[1] + (t[1] - f[1]) * k) + "," +
                       Math.round(f[2] + (t[2] - f[2]) * k) + ")";
      this.rect(x, y + Math.floor(h * i / bands), w, Math.ceil(h / bands) + 1, c);
    }
  };

  function hex(h) {
    h = h.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  /* ---------- sprites ---------------------------------------------------- */

  // art: array of equal-length strings. key: { char: colour }. "." is clear.
  Arcade.prototype.sprite = function (art, x, y, scale, key, flip) {
    scale = scale || 1;
    var ctx = this.ctx, ox = Math.round(x), oy = Math.round(y);
    for (var r = 0; r < art.length; r++) {
      var row = art[r];
      var c = 0;
      while (c < row.length) {
        var ch = row.charAt(c);
        if (ch === "." || !key[ch]) { c++; continue; }
        var run = 1;
        while (c + run < row.length && row.charAt(c + run) === ch) run++;
        var dx = flip ? (row.length - c - run) : c;
        ctx.fillStyle = key[ch];
        ctx.fillRect(ox + dx * scale, oy + r * scale, run * scale, scale);
        c += run;
      }
    }
  };

  Arcade.prototype.spriteW = function (art, scale) { return art[0].length * (scale || 1); };
  Arcade.prototype.spriteH = function (art, scale) { return art.length * (scale || 1); };

  /* ---------- text ------------------------------------------------------- */

  // `scale` is an integer multiplier of the 5x7 cell, not a pixel size.
  Arcade.prototype.text = function (str, x, y, scale, color, align) {
    str = String(str);
    scale = Math.max(1, Math.round(scale || 1));
    var w = PF.measure(str, scale);
    var px = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
    PF.draw(this.ctx, str, px, y, scale, color || PALETTE.parchment);
    return w;
  };

  // Same, with a hard 1px drop shadow — legible over any background.
  Arcade.prototype.textShadow = function (str, x, y, scale, color, align, shadow) {
    scale = Math.max(1, Math.round(scale || 1));
    this.text(str, x + scale, y + scale, scale, shadow || "rgba(0,0,0,.75)", align);
    return this.text(str, x, y, scale, color, align);
  };

  Arcade.prototype.textWidth = function (str, scale) { return PF.measure(String(str), Math.max(1, Math.round(scale || 1))); };

  Arcade.prototype.wrap = function (str, width, scale) {
    scale = Math.max(1, Math.round(scale || 1));
    var words = String(str).split(" "), line = "", lines = [], i;
    for (i = 0; i < words.length; i++) {
      var probe = line ? line + " " + words[i] : words[i];
      if (PF.measure(probe, scale) > width && line) { lines.push(line); line = words[i]; }
      else line = probe;
    }
    if (line) lines.push(line);
    return lines;
  };

  Arcade.prototype.textBlock = function (str, x, y, width, scale, color, align) {
    scale = Math.max(1, Math.round(scale || 1));
    var lines = this.wrap(str, width, scale);
    var lh = PF.lineHeight(scale);
    for (var i = 0; i < lines.length; i++) this.text(lines[i], x, y + i * lh, scale, color, align);
    return y + lines.length * lh;
  };

  /* ---------- overlay cards ---------------------------------------------- */

  // A framed plate with a double border and corner studs — the look of a
  // real attract screen rather than translucent black.
  Arcade.prototype.plate = function (x, y, w, h) {
    this.rect(x, y, w, h, "rgba(6,9,20,.94)");
    this.frameRect(x, y, w, h, PALETTE.gold, 1);
    this.frameRect(x + 2, y + 2, w - 4, h - 4, "rgba(217,164,65,.30)", 1);
    var s = PALETTE.goldLite;
    this.rect(x + 1, y + 1, 2, 2, s);
    this.rect(x + w - 3, y + 1, 2, 2, s);
    this.rect(x + 1, y + h - 3, 2, 2, s);
    this.rect(x + w - 3, y + h - 3, 2, 2, s);
  };

  Arcade.prototype._blink = function (period) {
    return Math.floor(this.wall / (period || 0.45)) % 2 === 0;
  };

  // Both overlay cards lay out in two passes: measure the stack of lines,
  // then draw a plate that hugs it and centre the whole thing. Otherwise a
  // short message leaves a tall empty box under it.
  Arcade.prototype._card = function (items, footer) {
    var W = this.W, H = this.H, i, it;
    var inner = W - 44;

    var total = 0;
    for (i = 0; i < items.length; i++) {
      it = items[i];
      if (it.rule) { it.h = 1; }
      else {
        it.lines = this.wrap(it.text, inner, it.scale);
        it.h = it.lines.length * PF.lineHeight(it.scale);
      }
      total += it.h + (it.gap || 0);
    }

    var padY = 14, footerH = footer ? 16 : 0;
    var plateH = Math.min(H - 12, total + padY * 2 + footerH);
    var plateY = Math.max(6, Math.round((H - plateH) / 2));
    var plateX = 8, plateW = W - 16;

    this.shade(0.84);
    this.plate(plateX, plateY, plateW, plateH);

    var y = plateY + padY;
    var cx = W / 2;
    for (i = 0; i < items.length; i++) {
      it = items[i];
      if (it.rule) {
        this.rect(plateX + 14, y, plateW - 28, 1, "rgba(217,164,65,.35)");
      } else {
        for (var l = 0; l < it.lines.length; l++) {
          var ly = y + l * PF.lineHeight(it.scale);
          if (it.shadow) this.text(it.lines[l], cx + it.scale, ly + it.scale, it.scale, it.shadow, "center");
          this.text(it.lines[l], cx, ly, it.scale, it.color, "center");
        }
      }
      y += it.h + (it.gap || 0);
    }

    if (footer && this._blink()) {
      this.text(footer, cx, plateY + plateH - 13, 1, PALETTE.crimsonLite, "center");
    }
    return { x: plateX, y: plateY, w: plateW, h: plateH };
  };

  Arcade.prototype._titleCard = function () {
    var c = this.cfg;
    var tScale = PF.measure(c.title, 2) <= this.W - 44 ? 2 : 1;
    var items = [
      { text: c.title, scale: tScale, color: PALETTE.goldLite, shadow: "rgba(74,12,18,.95)", gap: 8 },
      { rule: true, gap: 8 },
      { text: c.subtitle, scale: 1, color: PALETTE.parchment, gap: 9 },
      { text: c.howto, scale: 1, color: PALETTE.dim, gap: 11 },
      { text: c.verse, scale: 1, color: PALETTE.gold, gap: this.best ? 10 : 0 }
    ];
    if (this.best) items.push({ text: "BEST " + this.best, scale: 1, color: PALETTE.dimmer, gap: 0 });
    this._card(items, "PRESS SPACE TO PLAY");
  };

  Arcade.prototype._pauseCard = function () {
    var W = this.W, H = this.H;
    this.shade(0.68);
    this.plate(W / 2 - 62, H / 2 - 24, 124, 48);
    this.text("PAUSED", W / 2, H / 2 - 12, 2, PALETTE.goldLite, "center");
    this.text("P TO RESUME", W / 2, H / 2 + 8, 1, PALETTE.dim, "center");
  };

  Arcade.prototype._overCard = function () {
    var c = this.cfg;
    var items = [
      { text: "GAME OVER", scale: 2, color: PALETTE.crimsonLite, shadow: "rgba(0,0,0,.8)", gap: 10 },
      { text: c.scoreLabel, scale: 1, color: PALETTE.dim, gap: 3 },
      { text: String(this.score), scale: 2, color: PALETTE.goldLite, gap: 5 }
    ];
    if (this.newBest && this._blink(0.3)) {
      items.push({ text: "NEW BEST!", scale: 1, color: PALETTE.oliveLite, gap: 10 });
    } else {
      items.push({ text: "BEST " + this.best, scale: 1, color: PALETTE.dimmer, gap: 10 });
    }
    if (this.endLine) items.push({ text: this.endLine, scale: 1, color: PALETTE.parchment, gap: 9 });
    items.push({ rule: true, gap: 8 });
    items.push({ text: c.moral, scale: 1, color: PALETTE.gold, gap: 0 });
    this._card(items, "PRESS SPACE");
  };

  /* ---------- exports ---------------------------------------------------- */

  global.Arcade = {
    P: PALETTE,
    create: function (cfg) { return new Arcade(cfg); },
    rand: function (a, b) { return a + Math.random() * (b - a); },
    randInt: function (a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },
    pick: function (arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    clamp: function (v, a, b) { return v < a ? a : v > b ? b : v; },
    lerp: function (a, b, t) { return a + (b - a) * t; }
  };
})(window);
