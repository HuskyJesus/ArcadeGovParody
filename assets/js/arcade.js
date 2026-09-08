/* ============================================================
   The Free Arcade — tiny canvas engine shared by every cabinet.
   Fixed logical resolution, integer-scaled by CSS, pixelated.
   ============================================================ */
(function (global) {
  "use strict";

  var PALETTE = {
    ink: "#04060d",
    night: "#0a0f1e",
    slate: "#1c2748",
    parchment: "#f4ead8",
    dim: "#9aa6c4",
    gold: "#d9a441",
    goldLite: "#ffcb6b",
    crimson: "#b3313a",
    olive: "#4f7d5a",
    oliveLite: "#7cc194",
    sky: "#7fb2dd",
    brown: "#8a5a3b",
    white: "#ffffff"
  };

  var ARROWS = {
    ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    KeyW: "up", KeyS: "down", KeyA: "left", KeyD: "right",
    Space: "action", Enter: "start", KeyP: "pause", KeyR: "restart",
    KeyZ: "alt", KeyX: "action", Escape: "pause"
  };

  /* ---------- best-score storage (may throw in locked-down browsers) ---- */

  function loadBest(key) {
    try {
      var v = global.localStorage.getItem("freearcade:" + key);
      return v ? parseInt(v, 10) || 0 : 0;
    } catch (e) { return 0; }
  }

  function saveBest(key, value) {
    try { global.localStorage.setItem("freearcade:" + key, String(value)); }
    catch (e) { /* private mode — the score simply does not persist */ }
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

    this.state = "title";          // title | playing | paused | over
    this.score = 0;
    this.best = loadBest(this.id);
    this.time = 0;
    this.frame = 0;
    this.endLine = "";             // set by the game on game over

    this.down = Object.create(null);
    this.hit = Object.create(null);

    this._bindInput();

    // Initialise game state before the first frame: the attract screen draws
    // the real board behind its overlay, so nothing may be undefined yet.
    if (config.reset) config.reset(this);

    this._loop = this._loop.bind(this);
    this.last = 0;
    global.requestAnimationFrame(this._loop);
  }

  Arcade.prototype._bindInput = function () {
    var self = this;

    global.addEventListener("keydown", function (e) {
      var name = ARROWS[e.code];
      if (!name) return;
      if (e.repeat) { self.down[name] = true; return; }
      e.preventDefault();
      self.down[name] = true;
      self.hit[name] = true;
      self._meta(name);
    });

    global.addEventListener("keyup", function (e) {
      var name = ARROWS[e.code];
      if (name) { e.preventDefault(); self.down[name] = false; }
    });

    // On-screen buttons for touch devices: <button data-key="left">
    Array.prototype.forEach.call(document.querySelectorAll("[data-key]"), function (el) {
      var name = el.getAttribute("data-key");
      var press = function (e) {
        e.preventDefault();
        self.down[name] = true;
        self.hit[name] = true;
        self._meta(name);
      };
      var release = function (e) { e.preventDefault(); self.down[name] = false; };
      el.addEventListener("pointerdown", press);
      el.addEventListener("pointerup", release);
      el.addEventListener("pointercancel", release);
      el.addEventListener("pointerleave", release);
      el.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    });

    // Tapping the screen itself counts as the action button.
    this.canvas.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      self.down.action = true;
      self.hit.action = true;
      self._meta("action");
    });
    this.canvas.addEventListener("pointerup", function () { self.down.action = false; });
  };

  // Start / pause / restart are handled by the engine so no game repeats them.
  Arcade.prototype._meta = function (name) {
    if (this.state === "title" && (name === "start" || name === "action")) {
      this.begin();
    } else if (this.state === "over" && (name === "start" || name === "action" || name === "restart")) {
      this.begin();
    } else if (this.state === "playing" && name === "pause") {
      this.state = "paused";
    } else if (this.state === "paused" && (name === "pause" || name === "start" || name === "action")) {
      this.state = "playing";
    } else if (this.state === "playing" && name === "restart") {
      this.begin();
    }
  };

  Arcade.prototype.begin = function () {
    this.score = 0;
    this.time = 0;
    this.endLine = "";
    this.state = "playing";
    if (this.cfg.reset) this.cfg.reset(this);
  };

  Arcade.prototype.gameOver = function (line) {
    this.state = "over";
    this.endLine = line || "";
    if (this.score > this.best) {
      this.best = this.score;
      saveBest(this.id, this.best);
    }
  };

  Arcade.prototype.pressed = function (name) { return !!this.hit[name]; };
  Arcade.prototype.held = function (name) { return !!this.down[name]; };

  Arcade.prototype._loop = function (now) {
    global.requestAnimationFrame(this._loop);
    if (!this.last) this.last = now;
    var dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;

    if (this.state === "playing") {
      this.time += dt;
      this.frame++;
      this.cfg.update(this, dt);
    }

    this.cfg.draw(this, this.ctx);

    if (this.state === "title") this._titleCard();
    else if (this.state === "paused") this._banner("PAUSED", "P to resume");
    else if (this.state === "over") this._overCard();

    this.hit = Object.create(null);
  };

  /* ---------- drawing helpers ------------------------------------------ */

  Arcade.prototype.text = function (str, x, y, size, color, align) {
    var ctx = this.ctx;
    ctx.font = size + 'px "Press Start 2P", "Courier New", monospace';
    ctx.textAlign = align || "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = color || PALETTE.parchment;
    ctx.fillText(str, x, y);
  };

  // Word-wraps a plain string to `width` pixels, returns the y after the block.
  Arcade.prototype.textBlock = function (str, x, y, width, size, color, align) {
    var ctx = this.ctx;
    ctx.font = size + 'px "Press Start 2P", "Courier New", monospace';
    var words = str.split(" "), line = "", lines = [], i;
    for (i = 0; i < words.length; i++) {
      var probe = line ? line + " " + words[i] : words[i];
      if (ctx.measureText(probe).width > width && line) { lines.push(line); line = words[i]; }
      else { line = probe; }
    }
    if (line) lines.push(line);
    for (i = 0; i < lines.length; i++) {
      this.text(lines[i], x, y + i * (size + 6), size, color, align);
    }
    return y + lines.length * (size + 6);
  };

  Arcade.prototype.rect = function (x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };

  Arcade.prototype.frameRect = function (x, y, w, h, color, thickness) {
    var t = thickness || 1;
    this.rect(x, y, w, t, color);
    this.rect(x, y + h - t, w, t, color);
    this.rect(x, y, t, h, color);
    this.rect(x + w - t, y, t, h, color);
  };

  Arcade.prototype.clear = function (color) {
    this.rect(0, 0, this.W, this.H, color || PALETTE.ink);
  };

  Arcade.prototype.shade = function (alpha) {
    this.ctx.fillStyle = "rgba(4,6,13," + (alpha === undefined ? 0.78 : alpha) + ")";
    this.ctx.fillRect(0, 0, this.W, this.H);
  };

  Arcade.prototype._banner = function (line1, line2) {
    this.shade(0.72);
    this.text(line1, this.W / 2, this.H / 2 - 16, 14, PALETTE.goldLite, "center");
    this.text(line2, this.W / 2, this.H / 2 + 10, 7, PALETTE.dim, "center");
  };

  Arcade.prototype._titleCard = function () {
    var c = this.cfg;
    this.shade(0.86);
    var y = 26;
    y = this.textBlock(c.title, this.W / 2, y, this.W - 40, 14, PALETTE.goldLite, "center") + 12;
    y = this.textBlock(c.subtitle, this.W / 2, y, this.W - 50, 7, PALETTE.parchment, "center") + 16;
    y = this.textBlock(c.howto, this.W / 2, y, this.W - 46, 7, PALETTE.dim, "center") + 18;
    this.textBlock(c.verse, this.W / 2, y, this.W - 44, 7, PALETTE.gold, "center");
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      this.text("PRESS SPACE TO PLAY", this.W / 2, this.H - 26, 8, PALETTE.crimson, "center");
    }
  };

  Arcade.prototype._overCard = function () {
    this.shade(0.86);
    var y = 34;
    this.text("GAME OVER", this.W / 2, y, 14, PALETTE.crimson, "center"); y += 30;
    this.text(this.cfg.scoreLabel + " " + this.score, this.W / 2, y, 9, PALETTE.goldLite, "center"); y += 20;
    this.text("BEST " + this.best, this.W / 2, y, 7, PALETTE.dim, "center"); y += 24;
    if (this.endLine) y = this.textBlock(this.endLine, this.W / 2, y, this.W - 44, 7, PALETTE.parchment, "center") + 14;
    this.textBlock(this.cfg.moral, this.W / 2, y, this.W - 44, 7, PALETTE.gold, "center");
    var blink = Math.floor(Date.now() / 500) % 2 === 0;
    if (blink) this.text("PRESS SPACE", this.W / 2, this.H - 24, 8, PALETTE.crimson, "center");
  };

  /* ---------- exports --------------------------------------------------- */

  global.Arcade = {
    P: PALETTE,
    create: function (cfg) { return new Arcade(cfg); },
    // Deterministic-ish helpers used across cabinets
    rand: function (a, b) { return a + Math.random() * (b - a); },
    randInt: function (a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },
    pick: function (arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    clamp: function (v, a, b) { return v < a ? a : v > b ? b : v; }
  };
})(window);
