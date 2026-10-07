/* ======================================================
   ALKMINI - Visual effects
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
    },
    draw: function (s, dt) {
      var ctx = s.ctx;
      var w = s.w,
        h = s.h;
      // Keep the trace in the band below the hero copy
      var base = h * (w < 700 ? 0.95 : 0.9);
      var amp = Math.min(h * 0.1, 70);
      var period = Math.max(w / 2.6, 260);
      s.offset = (s.offset + 2.4 * dt) % (w + 200);
      var head = s.offset;
      var trail = Math.min(w * 0.7, 800);

      ctx.beginPath();
      var started = false;
      for (var x = Math.max(0, head - trail); x <= Math.min(head, w); x += 3) {
        var y = base - ecgShape((((x % period) + period) % period) / period) * amp;
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      var grad = ctx.createLinearGradient(head - trail, 0, head, 0);
      grad.addColorStop(0, rgba(GOLD, 0));
      grad.addColorStop(1, rgba(GOLD, 0.55));
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
    },
  };

  var scenes = { ecg: ecgScene };
  document.querySelectorAll("canvas[data-fx]").forEach(function (canvas) {
    var impl = scenes[canvas.getAttribute("data-fx")];
    if (impl && canvas.getContext) new Scene(canvas, impl);
  });
})();
