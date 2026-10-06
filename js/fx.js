/* ======================================================
   ALKMINI — Visual effects
   Canvas scenes, pointer effects, rotator, counters
   ====================================================== */
(function () {
  "use strict";

  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  function motionOK() {
    return !reduceQuery.matches && !document.body.classList.contains("a11y-no-anim");
  }

  // Let other scripts react when the a11y "no animations" toggle flips
  var motionListeners = [];
  function onMotionChange(fn) {
    motionListeners.push(fn);
  }
  new MutationObserver(function () {
    motionListeners.forEach(function (fn) {
      fn(motionOK());
    });
  }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  reduceQuery.addEventListener("change", function () {
    motionListeners.forEach(function (fn) {
      fn(motionOK());
    });
  });

  window.AlkFX = { motionOK: motionOK, onMotionChange: onMotionChange };

  // ══════════════════════════════════════════════════════
  // SCROLL PROGRESS BAR
  // ══════════════════════════════════════════════════════
  var progress = document.querySelector(".scroll-progress");
  if (progress) {
    var progTick = false;
    var updateProgress = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
      progTick = false;
    };
    window.addEventListener(
      "scroll",
      function () {
        if (!progTick) {
          progTick = true;
          requestAnimationFrame(updateProgress);
        }
      },
      { passive: true },
    );
    updateProgress();
  }

  // ══════════════════════════════════════════════════════
  // CURSOR GLOW (desktop)
  // ══════════════════════════════════════════════════════
  if (finePointer.matches) {
    var glow = document.createElement("div");
    glow.className = "cursor-glow";
    glow.setAttribute("aria-hidden", "true");
    document.body.appendChild(glow);
    var gx = 0,
      gy = 0,
      tx = 0,
      ty = 0,
      glowRunning = false;
    var glowLoop = function () {
      gx += (tx - gx) * 0.15;
      gy += (ty - gy) * 0.15;
      glow.style.transform = "translate3d(" + gx + "px," + gy + "px,0)";
      if (Math.abs(tx - gx) > 0.5 || Math.abs(ty - gy) > 0.5) {
        requestAnimationFrame(glowLoop);
      } else {
        glowRunning = false;
      }
    };
    window.addEventListener(
      "pointermove",
      function (e) {
        tx = e.clientX;
        ty = e.clientY;
        if (!motionOK()) {
          glow.classList.remove("active");
          return;
        }
        glow.classList.add("active");
        if (!glowRunning) {
          glowRunning = true;
          requestAnimationFrame(glowLoop);
        }
      },
      { passive: true },
    );
    document.addEventListener("pointerleave", function () {
      glow.classList.remove("active");
    });
  }

  // ══════════════════════════════════════════════════════
  // SPOTLIGHT + TILT CARDS
  // ══════════════════════════════════════════════════════
  document.querySelectorAll(".spot-card, [data-spot], [data-tilt]").forEach(function (card) {
    var tilt = card.hasAttribute("data-tilt") && finePointer.matches;
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      var x = e.clientX - r.left;
      var y = e.clientY - r.top;
      card.style.setProperty("--mx", x + "px");
      card.style.setProperty("--my", y + "px");
      if (tilt && motionOK()) {
        var rx = (y / r.height - 0.5) * -5;
        var ry = (x / r.width - 0.5) * 5;
        card.style.transform = "perspective(900px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateY(-4px)";
      }
    });
    card.addEventListener("pointerleave", function () {
      if (tilt) card.style.transform = "";
    });
  });

  // ══════════════════════════════════════════════════════
  // MAGNETIC BUTTONS
  // ══════════════════════════════════════════════════════
  if (finePointer.matches) {
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        if (!motionOK()) return;
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        el.style.transform = "translate(" + x * 0.18 + "px," + y * 0.3 + "px)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transform = "";
      });
    });
  }

  // ══════════════════════════════════════════════════════
  // HERO PARALLAX (pointer depth)
  // ══════════════════════════════════════════════════════
  var stage = document.querySelector("[data-parallax-stage]");
  if (stage && finePointer.matches) {
    var layers = stage.querySelectorAll("[data-depth]");
    var heroEl = stage.closest(".hero") || document.body;
    heroEl.addEventListener("pointermove", function (e) {
      if (!motionOK()) return;
      var cx = window.innerWidth / 2;
      var cy = window.innerHeight / 2;
      var dx = e.clientX - cx;
      var dy = e.clientY - cy;
      layers.forEach(function (layer) {
        var d = parseFloat(layer.getAttribute("data-depth")) || 0;
        // `translate` composes with the CSS transform/animations already on the layer
        layer.style.translate = -dx * d + "px " + -dy * d + "px";
      });
    });
  }

  // ══════════════════════════════════════════════════════
  // WORD ROTATOR (hero headline)
  // ══════════════════════════════════════════════════════
  document.querySelectorAll("[data-rotator]").forEach(function (el) {
    var words;
    try {
      words = JSON.parse(el.getAttribute("data-rotator"));
    } catch (e) {
      return;
    }
    if (!words || words.length < 2) return;

    // Keep the accessible text stable; animate a visual copy
    var sr = document.createElement("span");
    sr.className = "sr-only";
    sr.textContent = words.join(", ");
    var vis = document.createElement("span");
    vis.className = "rotator__word";
    vis.setAttribute("aria-hidden", "true");
    var caret = document.createElement("span");
    caret.className = "rotator__caret";
    caret.setAttribute("aria-hidden", "true");
    el.textContent = "";
    el.appendChild(sr);
    el.appendChild(vis);
    el.appendChild(caret);

    var i = 0;
    function render(word) {
      vis.innerHTML = "";
      Array.from(word).forEach(function (ch, idx) {
        var s = document.createElement("span");
        s.className = "rotator__char";
        s.textContent = ch === " " ? " " : ch;
        s.style.animationDelay = idx * 28 + "ms";
        vis.appendChild(s);
      });
    }
    render(words[0]);

    setInterval(function () {
      if (!motionOK() || document.hidden) return;
      var chars = vis.querySelectorAll(".rotator__char");
      chars.forEach(function (c, idx) {
        c.style.animationDelay = idx * 15 + "ms";
        c.classList.add("rotator__char--out");
      });
      setTimeout(function () {
        i = (i + 1) % words.length;
        render(words[i]);
      }, 380 + chars.length * 15);
    }, 2800);
  });

  // ══════════════════════════════════════════════════════
  // COUNTERS
  // ══════════════════════════════════════════════════════
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    var countObs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          countObs.unobserve(el);
          var target = parseFloat(el.getAttribute("data-count"));
          if (!motionOK()) {
            el.textContent = target;
            return;
          }
          var start = performance.now();
          var dur = 1600;
          (function step(now) {
            var t = Math.min((now - start) / dur, 1);
            var eased = 1 - Math.pow(1 - t, 4);
            el.textContent = Math.round(target * eased);
            if (t < 1) requestAnimationFrame(step);
          })(start);
        });
      },
      { threshold: 0.5 },
    );
    counters.forEach(function (c) {
      countObs.observe(c);
    });
  }

  // ══════════════════════════════════════════════════════
  // CANVAS SCENES
  // ══════════════════════════════════════════════════════
  var GOLD = [200, 169, 106];
  var GOLD_L = [231, 207, 151];
  var TEAL = [79, 195, 184];
  var WHITE = [233, 238, 246];

  function rgba(c, a) {
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  }

  function Scene(canvas, impl) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.impl = impl;
    this.w = 0;
    this.h = 0;
    this.dpr = 1;
    this.visible = true;
    this.running = false;
    this.mouse = { x: -9999, y: -9999, active: false };
    this.t = 0;
    var self = this;

    this.resize = function () {
      var r = canvas.getBoundingClientRect();
      self.dpr = Math.min(window.devicePixelRatio || 1, 2);
      self.w = r.width;
      self.h = r.height;
      canvas.width = Math.round(r.width * self.dpr);
      canvas.height = Math.round(r.height * self.dpr);
      self.ctx.setTransform(self.dpr, 0, 0, self.dpr, 0, 0);
      if (impl.init) impl.init(self);
      if (!self.running) self.frame(0);
    };

    var host = canvas.parentElement;
    host.addEventListener(
      "pointermove",
      function (e) {
        var r = canvas.getBoundingClientRect();
        self.mouse.x = e.clientX - r.left;
        self.mouse.y = e.clientY - r.top;
        self.mouse.active = true;
      },
      { passive: true },
    );
    host.addEventListener("pointerleave", function () {
      self.mouse.active = false;
      self.mouse.x = self.mouse.y = -9999;
    });

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(self.resize, 150);
    });

    new IntersectionObserver(function (entries) {
      self.visible = entries[0].isIntersecting;
      self.start();
    }).observe(canvas);

    document.addEventListener("visibilitychange", function () {
      self.start();
    });
    onMotionChange(function () {
      self.start();
    });

    this.resize();
    this.start();
  }

  Scene.prototype.frame = function (dt) {
    this.ctx.clearRect(0, 0, this.w, this.h);
    this.impl.draw(this, dt);
  };

  Scene.prototype.start = function () {
    var self = this;
    if (self.running || !self.visible || document.hidden || !motionOK()) {
      if (!motionOK()) self.frame(0);
      return;
    }
    self.running = true;
    var last = performance.now();
    (function loop(now) {
      if (!self.visible || document.hidden || !motionOK()) {
        self.running = false;
        return;
      }
      var dt = Math.min((now - last) / 16.67, 3);
      last = now;
      self.t += dt;
      self.frame(dt);
      requestAnimationFrame(loop);
    })(last);
  };

  // ── Scene 1: connection network (home hero) ─────────
  var networkScene = {
    init: function (s) {
      var count = Math.min(Math.round((s.w * s.h) / 13000), 95);
      s.nodes = [];
      for (var i = 0; i < count; i++) {
        var roll = Math.random();
        s.nodes.push({
          x: Math.random() * s.w,
          y: Math.random() * s.h,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.6 + 0.8,
          c: roll < 0.18 ? GOLD_L : roll < 0.32 ? TEAL : WHITE,
          pulse: Math.random() * Math.PI * 2,
        });
      }
      s.packets = [];
      s.linkDist = Math.min(150, Math.max(100, s.w / 10));
    },
    draw: function (s, dt) {
      var ctx = s.ctx;
      var nodes = s.nodes;
      var L = s.linkDist;
      var m = s.mouse;

      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        if (n.x < -20) n.x = s.w + 20;
        if (n.x > s.w + 20) n.x = -20;
        if (n.y < -20) n.y = s.h + 20;
        if (n.y > s.h + 20) n.y = -20;

        if (m.active) {
          var mdx = n.x - m.x;
          var mdy = n.y - m.y;
          var md = Math.sqrt(mdx * mdx + mdy * mdy);
          if (md < 160 && md > 0.1) {
            var f = (1 - md / 160) * 0.9;
            n.x += (mdx / md) * f * dt;
            n.y += (mdy / md) * f * dt;
          }
        }
        n.pulse += 0.03 * dt;
      }

      // Links
      ctx.lineWidth = 1;
      for (var a = 0; a < nodes.length; a++) {
        for (var b = a + 1; b < nodes.length; b++) {
          var dx = nodes[a].x - nodes[b].x;
          var dy = nodes[a].y - nodes[b].y;
          var d2 = dx * dx + dy * dy;
          if (d2 < L * L) {
            var alpha = (1 - Math.sqrt(d2) / L) * 0.22;
            ctx.strokeStyle = rgba(WHITE, alpha);
            ctx.beginPath();
            ctx.moveTo(nodes[a].x, nodes[a].y);
            ctx.lineTo(nodes[b].x, nodes[b].y);
            ctx.stroke();
          }
        }
      }

      // Mouse links (the "cursor" becomes a hub)
      if (m.active) {
        for (var k = 0; k < nodes.length; k++) {
          var ddx = nodes[k].x - m.x;
          var ddy = nodes[k].y - m.y;
          var dd = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dd < 220) {
            ctx.strokeStyle = rgba(GOLD, (1 - dd / 220) * 0.55);
            ctx.beginPath();
            ctx.moveTo(m.x, m.y);
            ctx.lineTo(nodes[k].x, nodes[k].y);
            ctx.stroke();
          }
        }
        var mg = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 26);
        mg.addColorStop(0, rgba(GOLD_L, 0.9));
        mg.addColorStop(1, rgba(GOLD_L, 0));
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 26, 0, Math.PI * 2);
        ctx.fill();
      }

      // Spawn packets that travel along links (calls being routed)
      if (Math.random() < 0.06 * dt && s.packets.length < 14) {
        var from = nodes[(Math.random() * nodes.length) | 0];
        var best = null,
          bestD = Infinity;
        for (var q = 0; q < nodes.length; q++) {
          var cand = nodes[q];
          if (cand === from) continue;
          var cdx = cand.x - from.x,
            cdy = cand.y - from.y;
          var cd = cdx * cdx + cdy * cdy;
          if (cd < L * L && cd < bestD && Math.random() > 0.3) {
            best = cand;
            bestD = cd;
          }
        }
        if (best) s.packets.push({ a: from, b: best, t: 0, c: Math.random() < 0.6 ? GOLD_L : TEAL });
      }
      for (var p = s.packets.length - 1; p >= 0; p--) {
        var pk = s.packets[p];
        pk.t += 0.018 * dt;
        if (pk.t >= 1) {
          s.packets.splice(p, 1);
          continue;
        }
        var px = pk.a.x + (pk.b.x - pk.a.x) * pk.t;
        var py = pk.a.y + (pk.b.y - pk.a.y) * pk.t;
        var g = ctx.createRadialGradient(px, py, 0, px, py, 9);
        g.addColorStop(0, rgba(pk.c, 1));
        g.addColorStop(1, rgba(pk.c, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.fill();
      }

      // Nodes
      for (var j = 0; j < nodes.length; j++) {
        var nd = nodes[j];
        var glowA = 0.55 + Math.sin(nd.pulse) * 0.35;
        ctx.fillStyle = rgba(nd.c, glowA);
        ctx.beginPath();
        ctx.arc(nd.x, nd.y, nd.r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  };

  // ── Scene 2: ECG pulse (doctors hero) ──────────────
  function ecgShape(p) {
    // p in [0,1) → normalized heartbeat amplitude
    if (p < 0.1) return Math.sin((p / 0.1) * Math.PI) * 0.12; // P wave
    if (p < 0.16) return 0;
    if (p < 0.19) return -((p - 0.16) / 0.03) * 0.18; // Q
    if (p < 0.22) return -0.18 + ((p - 0.19) / 0.03) * 1.18; // R up
    if (p < 0.25) return 1 - ((p - 0.22) / 0.03) * 1.35; // R down
    if (p < 0.28) return -0.35 + ((p - 0.25) / 0.03) * 0.35; // S
    if (p < 0.38) return 0;
    if (p < 0.52) return Math.sin(((p - 0.38) / 0.14) * Math.PI) * 0.22; // T wave
    return 0;
  }

  var ecgScene = {
    init: function (s) {
      s.offset = 0;
      s.dots = [];
      var count = Math.min(Math.round((s.w * s.h) / 22000), 60);
      for (var i = 0; i < count; i++) {
        s.dots.push({ x: Math.random() * s.w, y: Math.random() * s.h, r: Math.random() * 1.4 + 0.4, v: Math.random() * 0.25 + 0.05 });
      }
    },
    draw: function (s, dt) {
      var ctx = s.ctx;
      var w = s.w,
        h = s.h;

      // Monitor grid
      ctx.strokeStyle = "rgba(255,255,255,0.035)";
      ctx.lineWidth = 1;
      var gridSize = 32;
      var gOff = (s.t * 0.6) % gridSize;
      for (var gx = -gOff; gx < w; gx += gridSize) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (var gy = 0; gy < h; gy += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      // Floating particles
      for (var i = 0; i < s.dots.length; i++) {
        var d = s.dots[i];
        d.y -= d.v * dt;
        if (d.y < -5) {
          d.y = h + 5;
          d.x = Math.random() * w;
        }
        ctx.fillStyle = "rgba(233,238,246,0.35)";
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Heartbeat line: a sweeping "head" that draws across the screen
      // Keep the trace in the band below the hero copy
      var base = h * (w < 700 ? 0.95 : 0.9);
      var amp = Math.min(h * 0.12, 90);
      var period = Math.max(w / 2.6, 260);
      var speed = 3.2;
      s.offset = (s.offset + speed * dt) % (w + 200);
      var head = s.offset;

      // mouse makes the heart "race" (larger amplitude near the pointer)
      var m = s.mouse;

      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      var trail = Math.min(w * 0.75, 900);
      var step = 3;
      ctx.beginPath();
      var started = false;
      for (var x = Math.max(0, head - trail); x <= Math.min(head, w); x += step) {
        var boost = 1;
        if (m.active) {
          var md = Math.abs(x - m.x);
          if (md < 200) boost = 1 + (1 - md / 200) * 0.6;
        }
        var y = base - ecgShape(((x % period) + period) % period / period) * amp * boost;
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      var grad = ctx.createLinearGradient(head - trail, 0, head, 0);
      grad.addColorStop(0, rgba(TEAL, 0));
      grad.addColorStop(0.6, rgba(TEAL, 0.55));
      grad.addColorStop(1, rgba(GOLD_L, 1));
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.4;
      ctx.shadowColor = rgba(TEAL, 0.8);
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (head <= w) {
        var hb = 1;
        if (m.active && Math.abs(head - m.x) < 200) hb = 1 + (1 - Math.abs(head - m.x) / 200) * 0.6;
        var hy = base - ecgShape((head % period) / period) * amp * hb;
        var hg = ctx.createRadialGradient(head, hy, 0, head, hy, 18);
        hg.addColorStop(0, rgba(GOLD_L, 1));
        hg.addColorStop(1, rgba(GOLD_L, 0));
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(head, hy, 18, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  };

  // ── Scene 3: floating soft shapes (therapy centres hero) ──
  var BLOB_COLORS = [TEAL, GOLD_L, [232, 165, 152], [156, 195, 240], [190, 170, 230]];

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function puzzlePath(ctx, s) {
    // A simple jigsaw piece centred on 0,0 with size s
    var h = s / 2;
    var k = s * 0.18;
    ctx.beginPath();
    ctx.moveTo(-h, -h);
    ctx.lineTo(-k, -h);
    ctx.arc(0, -h, k, Math.PI, 0, false);
    ctx.lineTo(h, -h);
    ctx.lineTo(h, -k);
    ctx.arc(h, 0, k, -Math.PI / 2, Math.PI / 2, false);
    ctx.lineTo(h, h);
    ctx.lineTo(-h, h);
    ctx.lineTo(-h, k);
    ctx.arc(-h, 0, k, Math.PI / 2, -Math.PI / 2, true);
    ctx.closePath();
  }

  var blobScene = {
    init: function (s) {
      var count = s.w < 700 ? 10 : 18;
      s.shapes = [];
      for (var i = 0; i < count; i++) {
        var size = Math.random() * 46 + 22;
        s.shapes.push({
          x: Math.random() * s.w,
          y: Math.random() * s.h,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          size: size,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.008,
          kind: i % 3,
          c: BLOB_COLORS[i % BLOB_COLORS.length],
          a: Math.random() * 0.25 + 0.15,
        });
      }
      s.orbs = [
        { x: s.w * 0.8, y: s.h * 0.3, r: Math.max(s.w, s.h) * 0.28, c: TEAL, ph: 0 },
        { x: s.w * 0.15, y: s.h * 0.85, r: Math.max(s.w, s.h) * 0.22, c: GOLD, ph: 2 },
      ];
    },
    draw: function (s, dt) {
      var ctx = s.ctx;
      var m = s.mouse;

      // Big breathing orbs
      s.orbs.forEach(function (o) {
        o.ph += 0.008 * dt;
        var ox = o.x + Math.cos(o.ph) * 30;
        var oy = o.y + Math.sin(o.ph * 1.3) * 24;
        var g = ctx.createRadialGradient(ox, oy, 0, ox, oy, o.r);
        g.addColorStop(0, rgba(o.c, 0.22));
        g.addColorStop(1, rgba(o.c, 0));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, s.w, s.h);
      });

      for (var i = 0; i < s.shapes.length; i++) {
        var p = s.shapes[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        if (p.x < -60) p.x = s.w + 60;
        if (p.x > s.w + 60) p.x = -60;
        if (p.y < -60) p.y = s.h + 60;
        if (p.y > s.h + 60) p.y = -60;

        if (m.active) {
          var dx = p.x - m.x,
            dy = p.y - m.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < 180 && d > 0.1) {
            var f = (1 - d / 180) * 2.2;
            p.x += (dx / d) * f * dt;
            p.y += (dy / d) * f * dt;
            p.rot += 0.02 * dt;
          }
        }

        // Fade shapes that drift over the text column (left half on desktop)
        var fade = 1;
        if (s.w > 1080) {
          fade = Math.max(0.12, Math.min(1, (p.x - s.w * 0.12) / (s.w * 0.42)));
        } else {
          fade = 0.45;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = rgba(p.c, p.a * fade);
        ctx.strokeStyle = rgba(p.c, (p.a + 0.25) * fade);
        ctx.lineWidth = 1.2;
        if (p.kind === 0) {
          puzzlePath(ctx, p.size);
        } else if (p.kind === 1) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        } else {
          roundRect(ctx, -p.size / 2, -p.size / 2, p.size, p.size, p.size * 0.28);
        }
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Soft links between nearby shapes = "team" connections
      ctx.lineWidth = 1;
      for (var a = 0; a < s.shapes.length; a++) {
        for (var b = a + 1; b < s.shapes.length; b++) {
          var sx = s.shapes[a].x - s.shapes[b].x;
          var sy = s.shapes[a].y - s.shapes[b].y;
          var sd = Math.sqrt(sx * sx + sy * sy);
          if (sd < 190) {
            ctx.strokeStyle = "rgba(233,238,246," + (1 - sd / 190) * 0.14 + ")";
            ctx.beginPath();
            ctx.moveTo(s.shapes[a].x, s.shapes[a].y);
            ctx.lineTo(s.shapes[b].x, s.shapes[b].y);
            ctx.stroke();
          }
        }
      }
    },
  };

  var scenes = { network: networkScene, ecg: ecgScene, blobs: blobScene };
  document.querySelectorAll("canvas[data-fx]").forEach(function (canvas) {
    var impl = scenes[canvas.getAttribute("data-fx")];
    if (impl && canvas.getContext) new Scene(canvas, impl);
  });
})();
