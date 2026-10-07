/* ======================================================
   ALKMINI — Interactive widgets
   Every block is guarded by the presence of its markup,
   so this one file serves all pages.
   ====================================================== */
(function () {
  "use strict";

  var FX = window.AlkFX || {
    motionOK: function () {
      return true;
    },
    onMotionChange: function () {},
  };

  var ICONS = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16v16H4z"/><path d="m22 6-10 7L2 6"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
    swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
  };

  function onVisible(el, cb, opts) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        cb(e.isIntersecting);
      });
    }, opts || { threshold: 0.2 });
    obs.observe(el);
    return obs;
  }

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function fmtTime(h) {
    var hh = Math.floor(h);
    var mm = Math.round((h - hh) * 60);
    if (mm === 60) {
      hh += 1;
      mm = 0;
    }
    return pad(hh) + ":" + pad(mm);
  }

  function fmtNum(n) {
    return Math.round(n).toLocaleString("el-GR");
  }

  function setRangeFill(input) {
    var min = parseFloat(input.min) || 0;
    var max = parseFloat(input.max) || 100;
    var pct = ((parseFloat(input.value) - min) / (max - min)) * 100;
    input.style.setProperty("--pct", pct + "%");
  }

  // ══════════════════════════════════════════════════════
  // HERO LIVE FEED
  // ══════════════════════════════════════════════════════
  var feed = document.getElementById("liveFeed");
  if (feed) {
    var feedItems = [
      { i: "phone", t: "Κλήση απαντήθηκε", s: "Νέος ασθενής · ζήτησε ραντεβού" },
      { i: "cal", t: "Ραντεβού καταχωρήθηκε", s: "Τρίτη 17:30 · επιβεβαίωση SMS", g: true },
      { i: "bell", t: "Υπενθυμίσεις στάλθηκαν", s: "12 ραντεβού αύριο" },
      { i: "mail", t: "Inbox ταξινομήθηκε", s: "3 επείγοντα προς εσάς", g: true },
      { i: "doc", t: "Γνωμάτευση λήγει σε 10 ημ.", s: "Ειδοποιήθηκε ο γονέας" },
      { i: "swap", t: "Ακύρωση → αναπλήρωση", s: "Το κενό καλύφθηκε από λίστα αναμονής", g: true },
      { i: "doc", t: "Αποδείξεις μήνα έτοιμες", s: "για τελικό έλεγχο" },
      { i: "phone", t: "Επανάκληση ολοκληρώθηκε", s: "Πληροφορίες για πρώτη επίσκεψη" },
    ];
    var feedIdx = 0;
    var clockEl = document.querySelector("[data-clock]");
    var feedMinutes = 9 * 60 + 2;

    var pushFeed = function () {
      var it = feedItems[feedIdx % feedItems.length];
      feedIdx++;
      feedMinutes += 7 + Math.round(Math.random() * 18);
      if (feedMinutes > 21 * 60 + 50) feedMinutes = 9 * 60 + 2;
      var li = document.createElement("li");
      li.className = "live-feed__item";
      li.innerHTML =
        '<span class="live-feed__badge' + (it.g ? " live-feed__badge--gold" : "") + '">' + ICONS[it.i] + "</span>" +
        "<span>" + it.t + "<small>" + it.s + "</small></span>";
      feed.insertBefore(li, feed.firstChild);
      while (feed.children.length > 5) feed.removeChild(feed.lastChild);
      if (clockEl) clockEl.textContent = pad(Math.floor(feedMinutes / 60)) + ":" + pad(feedMinutes % 60);
    };
    for (var f = 0; f < 3; f++) pushFeed();

    var feedTimer = null;
    var feedVisible = true;
    var feedControl = function () {
      var shouldRun = feedVisible && FX.motionOK();
      if (shouldRun && !feedTimer) feedTimer = setInterval(pushFeed, 2600);
      if (!shouldRun && feedTimer) {
        clearInterval(feedTimer);
        feedTimer = null;
      }
    };
    onVisible(feed, function (v) {
      feedVisible = v;
      feedControl();
    });
    FX.onMotionChange(feedControl);
  }

  // ══════════════════════════════════════════════════════
  // MINI CALENDAR (services feature card)
  // ══════════════════════════════════════════════════════
  var minical = document.querySelector("[data-minical]");
  if (minical) {
    var slots = [];
    for (var s = 0; s < 25; s++) {
      var el = document.createElement("span");
      el.className = "mini-cal__slot";
      if (Math.random() < 0.35) el.classList.add("is-booked");
      minical.appendChild(el);
      slots.push(el);
    }
    var calTimer = null;
    var calTick = function () {
      var free = slots.filter(function (x) {
        return !x.classList.contains("is-booked");
      });
      if (free.length < 4) {
        slots.forEach(function (x) {
          if (Math.random() < 0.6) x.classList.remove("is-booked");
        });
        return;
      }
      var pick = free[(Math.random() * free.length) | 0];
      pick.classList.add("is-booked", "is-new");
      setTimeout(function () {
        pick.classList.remove("is-new");
      }, 900);
    };
    onVisible(minical, function (v) {
      if (v && FX.motionOK() && !calTimer) calTimer = setInterval(calTick, 1100);
      if ((!v || !FX.motionOK()) && calTimer) {
        clearInterval(calTimer);
        calTimer = null;
      }
    });
  }

  // ══════════════════════════════════════════════════════
  // MISSED-CALL CALCULATOR + CANVAS CHART
  // ══════════════════════════════════════════════════════
  var calc = document.querySelector("[data-calc]");
  if (calc) {
    var inputs = calc.querySelectorAll("input[type=range]");
    var outs = {};
    calc.querySelectorAll("[data-out]").forEach(function (o) {
      outs[o.getAttribute("data-out")] = o;
    });
    var res = {};
    calc.querySelectorAll("[data-res]").forEach(function (r) {
      res[r.getAttribute("data-res")] = r;
    });
    var chart = document.getElementById("calcChart");
    var cctx = chart.getContext("2d");
    var shown = { lost: 0, revenue: 0, hours: 0 };
    var target = { lost: 0, revenue: 0, hours: 0 };
    var series = [];
    var chartProgress = 0;
    var animId = null;
    var DAYS = 25;

    var compute = function () {
      var v = {};
      inputs.forEach(function (i) {
        v[i.name] = parseFloat(i.value);
        setRangeFill(i);
      });
      outs.calls.textContent = v.calls;
      outs.missed.textContent = v.missed + "%";
      outs.value.textContent = v.value + " €";
      outs.minutes.textContent = v.minutes + "′";

      var missedMonth = v.calls * (v.missed / 100) * DAYS;
      target.lost = missedMonth * 0.5;
      target.revenue = target.lost * v.value;
      target.hours = (v.calls * v.minutes * DAYS) / 60;

      series = [];
      for (var m = 1; m <= 12; m++) series.push(target.revenue * m);
      chartProgress = 0;
      run();
    };

    var drawChart = function (p) {
      var r = chart.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (chart.width !== Math.round(r.width * dpr) || chart.height !== Math.round(r.height * dpr)) {
        chart.width = Math.round(r.width * dpr);
        chart.height = Math.round(r.height * dpr);
      }
      var w = r.width,
        h = r.height;
      cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cctx.clearRect(0, 0, w, h);
      var padL = 8,
        padB = 24,
        padT = 26;
      var max = Math.max(series[11] || 1, 1);
      var cw = w - padL * 2;
      var ch = h - padB - padT;

      // grid
      cctx.strokeStyle = "rgba(255,255,255,0.07)";
      cctx.lineWidth = 1;
      for (var g = 0; g <= 3; g++) {
        var gy = padT + (ch / 3) * g;
        cctx.beginPath();
        cctx.moveTo(padL, gy);
        cctx.lineTo(w - padL, gy);
        cctx.stroke();
      }

      // bars per month
      var months = ["Ι", "Φ", "Μ", "Α", "Μ", "Ι", "Ι", "Α", "Σ", "Ο", "Ν", "Δ"];
      var bw = (cw / 12) * 0.56;
      for (var i = 0; i < 12; i++) {
        var local = Math.max(0, Math.min(1, p * 12 - i * 0.6));
        var eased = 1 - Math.pow(1 - local, 3);
        var val = series[i] * eased;
        var bh = (val / max) * ch;
        var x = padL + (cw / 12) * i + (cw / 12 - bw) / 2;
        var y = padT + ch - bh;
        var grad = cctx.createLinearGradient(0, y, 0, padT + ch);
        grad.addColorStop(0, "rgba(200,169,106,1)");
        grad.addColorStop(1, "rgba(200,169,106,0.35)");
        cctx.fillStyle = grad;
        var rr = Math.min(6, bw / 2, bh);
        cctx.beginPath();
        cctx.moveTo(x, padT + ch);
        cctx.lineTo(x, y + rr);
        cctx.quadraticCurveTo(x, y, x + rr, y);
        cctx.lineTo(x + bw - rr, y);
        cctx.quadraticCurveTo(x + bw, y, x + bw, y + rr);
        cctx.lineTo(x + bw, padT + ch);
        cctx.closePath();
        cctx.fill();

        cctx.fillStyle = "rgba(159,176,201,0.8)";
        cctx.font = "11px Inter, sans-serif";
        cctx.textAlign = "center";
        cctx.fillText(months[i], x + bw / 2, h - 6);
      }

      // cumulative line (teal)
      cctx.beginPath();
      for (var j = 0; j < 12; j++) {
        var lp = Math.max(0, Math.min(1, p * 12 - j * 0.6));
        var lv = series[j] * (1 - Math.pow(1 - lp, 3));
        var lx = padL + (cw / 12) * j + cw / 24;
        var ly = padT + ch - (lv / max) * ch;
        if (j === 0) cctx.moveTo(lx, ly);
        else cctx.lineTo(lx, ly);
      }
      cctx.strokeStyle = "rgba(196,213,234,0.9)";
      cctx.lineWidth = 2;
      cctx.stroke();

      cctx.fillStyle = "rgba(233,238,246,0.9)";
      cctx.font = "600 12px Inter, sans-serif";
      cctx.textAlign = "left";
      cctx.fillText("Σωρευτικά σε 12 μήνες: " + fmtNum(series[11] * Math.min(p * 1.2, 1)) + " €", padL, 14);
    };

    var run = function () {
      if (animId) cancelAnimationFrame(animId);
      if (!FX.motionOK()) {
        shown.lost = target.lost;
        shown.revenue = target.revenue;
        shown.hours = target.hours;
        paintStats();
        drawChart(1);
        return;
      }
      (function loop() {
        var done = true;
        ["lost", "revenue", "hours"].forEach(function (k) {
          var diff = target[k] - shown[k];
          if (Math.abs(diff) > 0.5) {
            shown[k] += diff * 0.14;
            done = false;
          } else {
            shown[k] = target[k];
          }
        });
        chartProgress = Math.min(1, chartProgress + 0.03);
        if (chartProgress < 1) done = false;
        paintStats();
        drawChart(chartProgress);
        animId = done ? null : requestAnimationFrame(loop);
      })();
    };

    var paintStats = function () {
      res.lost.textContent = fmtNum(shown.lost);
      res.revenue.textContent = fmtNum(shown.revenue) + " €";
      res.hours.textContent = fmtNum(shown.hours);
    };

    inputs.forEach(function (i) {
      i.addEventListener("input", compute);
    });
    window.addEventListener("resize", function () {
      drawChart(chartProgress);
    });
    var calcStarted = false;
    onVisible(calc, function (v) {
      if (v && !calcStarted) {
        calcStarted = true;
        compute();
      }
    });
    inputs.forEach(setRangeFill);
  }

  // ══════════════════════════════════════════════════════
  // STEPS — path draws as you scroll
  // ══════════════════════════════════════════════════════
  var stepsWrap = document.querySelector("[data-steps]");
  if (stepsWrap) {
    var drawPath = stepsWrap.querySelector(".steps-path__draw");
    var steps = stepsWrap.querySelectorAll(".step");
    var len = drawPath ? drawPath.getTotalLength() : 0;
    if (drawPath) {
      drawPath.style.strokeDasharray = len;
      drawPath.style.strokeDashoffset = len;
    }
    var stepsTick = false;
    var updateSteps = function () {
      stepsTick = false;
      var r = stepsWrap.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * 0.85 - r.top) / (vh * 0.6);
      p = Math.max(0, Math.min(1, p));
      if (drawPath) drawPath.style.strokeDashoffset = len * (1 - p);
      steps.forEach(function (st, idx) {
        st.classList.toggle("is-active", p >= idx / (steps.length - 1) - 0.02);
      });
    };
    window.addEventListener(
      "scroll",
      function () {
        if (!stepsTick) {
          stepsTick = true;
          requestAnimationFrame(updateSteps);
        }
      },
      { passive: true },
    );
    updateSteps();
  }

  // ══════════════════════════════════════════════════════
  // DAY TIMELINE + CLOCK
  // ══════════════════════════════════════════════════════
  var day = document.querySelector("[data-dayline]");
  if (day) {
    var dayEvents = [
      { t: 9, title: "Πρωινή προετοιμασία", text: "Έλεγχος ημερολογίου, μηνυμάτων και φωνητικών της νύχτας. Σας στέλνω σύντομη ενημέρωση για το πρόγραμμα της ημέρας." },
      { t: 9.5, title: "Επιβεβαιώσεις ραντεβού", text: "Επιβεβαιώνω τα σημερινά ραντεβού και συμπληρώνω τυχόν κενά από τη λίστα αναμονής." },
      { t: 10, title: "Ροή κλήσεων & νέα ραντεβού", text: "Απαντώ με το όνομα του χώρου σας, κλείνω ραντεβού, δίνω πρακτικές πληροφορίες και κρατάω σημειώσεις για εσάς." },
      { t: 13, title: "Email & μηνύματα", text: "Ταξινόμηση εισερχομένων, απαντήσεις σε τυποποιημένα αιτήματα, προώθηση μόνο όσων χρειάζονται τη δική σας ματιά." },
      { t: 14.5, title: "Γνωματεύσεις & αποδείξεις", text: "Έλεγχος γνωματεύσεων, παρακολούθηση λήξεων και έκδοση αποδείξεων μέσα από το πρόγραμμα που ήδη χρησιμοποιείτε." },
      { t: 16, title: "Απογευματινή αιχμή", text: "Οι περισσότερες κλήσεις γονέων και ασθενών. Αλλαγές προγράμματος, ακυρώσεις και αναπληρώσεις — χωρίς να σας διακόψω." },
      { t: 18, title: "Υπενθυμίσεις για αύριο", text: "Αποστολή υπενθυμίσεων για τα αυριανά ραντεβού και επανακλήσεις όσων άφησαν μήνυμα." },
      { t: 20, title: "Εκκρεμότητες & επανακλήσεις", text: "Ολοκληρώνω ό,τι έμεινε ανοιχτό. Τα επείγοντα έχουν ήδη φτάσει σε εσάς σύμφωνα με το πρωτόκολλο που ορίσαμε." },
      { t: 21.5, title: "Βραδινή σύνοψη", text: "Σας στέλνω σύνοψη της ημέρας: κλήσεις, νέα ραντεβού, ακυρώσεις και ό,τι χρειάζεται απόφασή σας." },
      { t: 22, title: "Κλείσιμο ημέρας", text: "Ενεργοποίηση μηνύματος εκτός ωραρίου. Ό,τι έρθει, το βρίσκω πρώτο πράγμα το πρωί." },
    ];
    var range = document.getElementById("dayRange");
    var arc = day.querySelector("[data-clock-arc]");
    var handH = day.querySelector("[data-hand-h]");
    var handM = day.querySelector("[data-hand-m]");
    var clockText = day.querySelector("[data-clock-text]");
    var tag = day.querySelector("[data-day-tag]");
    var titleEl = day.querySelector("[data-day-title]");
    var textEl = day.querySelector("[data-day-text]");
    var evBox = day.querySelector("[data-day-event]");
    var playBtn = day.querySelector("[data-day-play]");
    var ticks = day.querySelector("[data-clock-ticks]");
    var circ = 2 * Math.PI * 140;
    if (arc) arc.style.strokeDasharray = circ;

    var tickHtml = "";
    for (var k = 0; k < 12; k++) {
      var ang = (k / 12) * Math.PI * 2;
      var x1 = 150 + Math.sin(ang) * 112,
        y1 = 150 - Math.cos(ang) * 112;
      var x2 = 150 + Math.sin(ang) * (k % 3 === 0 ? 98 : 104),
        y2 = 150 - Math.cos(ang) * (k % 3 === 0 ? 98 : 104);
      tickHtml += '<line class="clock__tick" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/>';
    }
    if (ticks) ticks.innerHTML = tickHtml;

    var currentIdx = -1;
    var updateDay = function () {
      var v = parseFloat(range.value);
      setRangeFill(range);
      var p = (v - 9) / 13;
      if (arc) arc.style.strokeDashoffset = circ * (1 - p);
      if (handH) handH.style.transform = "rotate(" + (v % 12) * 30 + "deg)";
      if (handM) handM.style.transform = "rotate(" + ((v % 1) * 60) * 6 + "deg)";
      if (clockText) clockText.textContent = fmtTime(v);

      var idx = 0;
      for (var i = 0; i < dayEvents.length; i++) if (v >= dayEvents[i].t) idx = i;
      if (idx !== currentIdx) {
        currentIdx = idx;
        var ev = dayEvents[idx];
        var next = dayEvents[idx + 1];
        tag.textContent = fmtTime(ev.t) + (next ? " – " + fmtTime(next.t) : "");
        titleEl.textContent = ev.title;
        textEl.textContent = ev.text;
        evBox.classList.remove("swap");
        void evBox.offsetWidth;
        evBox.classList.add("swap");
      }
      range.setAttribute("aria-valuetext", fmtTime(v) + " — " + dayEvents[idx].title);
    };
    range.addEventListener("input", function () {
      stopPlay();
      updateDay();
    });

    var playTimer = null;
    var playIcon = playBtn.querySelector("[data-play-icon]");
    var playLabel = playBtn.querySelector("span");
    var stopPlay = function () {
      if (!playTimer) return;
      clearInterval(playTimer);
      playTimer = null;
      playBtn.setAttribute("aria-pressed", "false");
      playLabel.textContent = "Αναπαραγωγή";
      playIcon.innerHTML = '<path d="M7 4v16l13-8z"/>';
    };
    playBtn.addEventListener("click", function () {
      if (playTimer) {
        stopPlay();
        return;
      }
      if (parseFloat(range.value) >= 22) range.value = 9;
      playBtn.setAttribute("aria-pressed", "true");
      playLabel.textContent = "Παύση";
      playIcon.innerHTML = '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>';
      playTimer = setInterval(function () {
        var nv = parseFloat(range.value) + 0.25;
        if (nv > 22) {
          stopPlay();
          return;
        }
        range.value = nv;
        updateDay();
      }, 260);
    });
    updateDay();

    // Auto-play once when first seen
    var autoplayed = false;
    onVisible(
      day,
      function (v) {
        if (v && !autoplayed && FX.motionOK()) {
          autoplayed = true;
          setTimeout(function () {
            if (!playTimer && parseFloat(range.value) === 9) playBtn.click();
          }, 700);
        }
        if (!v) stopPlay();
      },
      { threshold: 0.45 },
    );
  }

  // ══════════════════════════════════════════════════════
  // ROLES TOGGLE (who does what)
  // ══════════════════════════════════════════════════════
  document.querySelectorAll("[data-roles-toggle]").forEach(function (group) {
    var target = document.querySelector(group.getAttribute("data-roles-toggle"));
    var pill = group.querySelector(".roles-toggle__pill");
    var buttons = group.querySelectorAll("button");
    var movePill = function (btn) {
      if (!pill) return;
      pill.style.width = btn.offsetWidth + "px";
      pill.style.transform = "translateX(" + btn.offsetLeft + "px)";
    };
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) {
          b.setAttribute("aria-pressed", String(b === btn));
        });
        target.setAttribute("data-focus", btn.getAttribute("data-role"));
        movePill(btn);
      });
    });
    var initial = group.querySelector('[aria-pressed="true"]') || buttons[0];
    requestAnimationFrame(function () {
      movePill(initial);
    });
    window.addEventListener("resize", function () {
      movePill(group.querySelector('[aria-pressed="true"]') || buttons[0]);
    });
  });

  // ══════════════════════════════════════════════════════
  // CALL FLOW DIAGRAM (doctors)
  // ══════════════════════════════════════════════════════
  var flow = document.querySelector("[data-flow]");
  if (flow) {
    var branches = flow.querySelectorAll(".flow-branch");
    var panels = flow.querySelectorAll("[data-flow-panel]");
    var packet = flow.querySelector(".flow-packet");
    var detail = flow.querySelector(".flow-detail");
    var active = null;
    var packetAnim = null;
    var userTouched = false;

    var animatePacket = function (key) {
      if (packetAnim) cancelAnimationFrame(packetAnim);
      var paths = [
        flow.querySelector('[data-link="in"]'),
        flow.querySelector('[data-link="' + key + '"]'),
        flow.querySelector('[data-link="' + key + '-out"]'),
      ].filter(Boolean);
      var lens = paths.map(function (p) {
        return p.getTotalLength();
      });
      var total = lens.reduce(function (a, b) {
        return a + b;
      }, 0);
      if (!FX.motionOK()) {
        packet.style.opacity = 0;
        return;
      }
      packet.style.opacity = 1;
      var start = performance.now();
      var dur = 2400;
      (function loop(now) {
        var t = ((now - start) % (dur + 500)) / dur;
        if (t > 1) {
          packet.style.opacity = 0;
        } else {
          packet.style.opacity = 1;
          var d = t * total;
          var seg = 0;
          while (seg < lens.length - 1 && d > lens[seg]) {
            d -= lens[seg];
            seg++;
          }
          var pt = paths[seg].getPointAtLength(Math.min(d, lens[seg]));
          packet.setAttribute("cx", pt.x);
          packet.setAttribute("cy", pt.y);
        }
        packetAnim = requestAnimationFrame(loop);
      })(start);
    };

    var select = function (key) {
      if (key === active) return;
      active = key;
      branches.forEach(function (b) {
        var on = b.getAttribute("data-branch") === key;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      flow.querySelectorAll(".flow-link").forEach(function (l) {
        var lk = l.getAttribute("data-link");
        l.classList.toggle("is-active", lk === "in" || lk === key || lk === key + "-out");
      });
      panels.forEach(function (p) {
        p.hidden = p.getAttribute("data-flow-panel") !== key;
      });
      detail.classList.remove("swap");
      void detail.offsetWidth;
      detail.classList.add("swap");
      animatePacket(key);
    };

    branches.forEach(function (b) {
      var key = b.getAttribute("data-branch");
      b.addEventListener("click", function () {
        userTouched = true;
        select(key);
      });
      b.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          userTouched = true;
          select(key);
        }
      });
    });
    select(branches[0].getAttribute("data-branch"));

    // Gentle auto-tour until the visitor clicks
    var keys = Array.prototype.map.call(branches, function (b) {
      return b.getAttribute("data-branch");
    });
    var tour = null;
    onVisible(flow, function (v) {
      if (v && !userTouched && !tour && FX.motionOK()) {
        tour = setInterval(function () {
          if (userTouched) {
            clearInterval(tour);
            return;
          }
          select(keys[(keys.indexOf(active) + 1) % keys.length]);
        }, 5200);
      }
      if (!v && tour) {
        clearInterval(tour);
        tour = null;
      }
    });
  }

  // ══════════════════════════════════════════════════════
  // CHAT MOCKUP (phone)
  // ══════════════════════════════════════════════════════
  document.querySelectorAll("[data-chat]").forEach(function (chat) {
    var script;
    try {
      script = JSON.parse(chat.getAttribute("data-chat"));
    } catch (e) {
      return;
    }
    var idx = 0;
    var timer = null;
    var running = false;

    var addBubble = function (msg) {
      var b = document.createElement("div");
      b.className = "bubble bubble--" + msg.who;
      b.textContent = msg.text;
      if (msg.time) {
        var t = document.createElement("time");
        t.textContent = msg.time;
        b.appendChild(t);
      }
      chat.appendChild(b);
      while (chat.children.length > 7) chat.removeChild(chat.firstChild);
    };

    var next = function () {
      if (!running) return;
      if (idx >= script.length) {
        timer = setTimeout(function () {
          chat.innerHTML = "";
          idx = 0;
          next();
        }, 3500);
        return;
      }
      var msg = script[idx++];
      if (msg.who === "out" || msg.who === "in") {
        var typing = document.createElement("div");
        typing.className = "bubble bubble--" + msg.who + " bubble--typing";
        typing.innerHTML = "<i></i><i></i><i></i>";
        chat.appendChild(typing);
        timer = setTimeout(function () {
          typing.remove();
          addBubble(msg);
          timer = setTimeout(next, 1100);
        }, 900);
      } else {
        addBubble(msg);
        timer = setTimeout(next, 1300);
      }
    };

    if (!FX.motionOK()) {
      script.forEach(addBubble);
      return;
    }
    // Seed the opening of the conversation so the phone never looks empty
    for (; idx < Math.min(3, script.length); idx++) addBubble(script[idx]);
    onVisible(chat, function (v) {
      if (v && !running) {
        running = true;
        next();
      } else if (!v && running) {
        running = false;
        clearTimeout(timer);
        chat.querySelectorAll(".bubble--typing").forEach(function (t) {
          t.remove();
        });
      }
    });
  });

  // ══════════════════════════════════════════════════════
  // PLAN BUILDER (configurator)
  // ══════════════════════════════════════════════════════
  document.querySelectorAll("[data-config]").forEach(function (form) {
    var wrap = form.closest(".config");
    var titleEl = wrap.querySelector("[data-config-title]");
    var list = wrap.querySelector("[data-config-list]");
    var hoursEl = wrap.querySelector("[data-config-hours]");
    var bar = wrap.querySelector("[data-config-bar]");
    var pkgEl = wrap.querySelector("[data-config-pkg]");
    var send = wrap.querySelector("[data-config-send]");
    var volume = form.querySelector('input[type="range"]');
    var volOut = form.querySelector("[data-config-volume]");
    var placeType = form.getAttribute("data-type") || "";

    var labelOf = function (input) {
      var l = input.closest("label");
      return l ? l.textContent.trim() : input.value;
    };

    var update = function () {
      var specialtySel = form.querySelector("select");
      var specialty = specialtySel ? specialtySel.options[specialtySel.selectedIndex].text : "";
      var coverage = form.querySelector('input[name="coverage"]:checked');
      var channels = Array.prototype.map.call(form.querySelectorAll('input[name="channels"]:checked'), labelOf);
      var tasks = Array.prototype.map.call(form.querySelectorAll('input[name="tasks"]:checked'), labelOf);
      var vol = volume ? parseFloat(volume.value) : 20;
      if (volume) setRangeFill(volume);
      if (volOut) volOut.textContent = vol;

      var covFactor = coverage ? parseFloat(coverage.getAttribute("data-factor")) || 1 : 1;
      var est = Math.round(((vol * 3 * 25) / 60) * covFactor + tasks.length * 3);
      est = Math.max(10, est);
      var pkg = est <= 20 ? "Basic · 20 ώρες" : est <= 40 ? "Standard · 40 ώρες" : est <= 60 ? "Premium · 60 ώρες" : "Εξατομικευμένο πακέτο";

      titleEl.textContent = specialty ? "Πλάνο για: " + specialty : "Το πλάνο συνεργασίας σας";
      var items = [];
      if (coverage) items.push("Κάλυψη: " + labelOf(coverage));
      if (channels.length) items.push("Κανάλια: " + channels.join(", "));
      tasks.forEach(function (t) {
        items.push(t);
      });
      list.innerHTML = "";
      if (!items.length) {
        var empty = document.createElement("li");
        empty.textContent = "Επιλέξτε αριστερά τι θέλετε να αναλάβω.";
        list.appendChild(empty);
      }
      items.forEach(function (txt) {
        var li = document.createElement("li");
        li.innerHTML = ICONS.check;
        li.appendChild(document.createTextNode(txt));
        list.appendChild(li);
      });
      hoursEl.textContent = "≈ " + est + " ώρες / μήνα";
      bar.style.width = Math.min(100, (est / 70) * 100) + "%";
      pkgEl.textContent = pkg;

      var plan =
        "Γεια σας! Ενδιαφέρομαι για συνεργασία.\n" +
        (specialty ? "Χώρος: " + specialty + "\n" : "") +
        "Περίπου " + vol + " κλήσεις/ημέρα\n" +
        items.map(function (x) {
          return "• " + x;
        }).join("\n") +
        "\nΕκτίμηση: ≈ " + est + " ώρες/μήνα (" + pkg + ")";
      send.href = "index.html?type=" + encodeURIComponent(placeType) + "&plan=" + encodeURIComponent(plan) + "#contact";
    };

    form.addEventListener("input", update);
    form.addEventListener("change", update);
    update();
  });

  // ══════════════════════════════════════════════════════
  // ONBOARDING TIMELINE (scroll-linked line)
  // ══════════════════════════════════════════════════════
  document.querySelectorAll("[data-timeline]").forEach(function (tl) {
    var fill = tl.querySelector(".timeline__line span");
    var items = tl.querySelectorAll(".timeline__item");
    var ticking = false;
    var update = function () {
      ticking = false;
      var r = tl.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * 0.6 - r.top) / r.height;
      p = Math.max(0, Math.min(1, p));
      fill.style.transform = "scaleY(" + p + ")";
      items.forEach(function (it) {
        var ir = it.getBoundingClientRect();
        it.classList.toggle("is-active", ir.top < vh * 0.6);
      });
    };
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true },
    );
    update();
  });

  // ══════════════════════════════════════════════════════
  // EOPYY MONTHLY CYCLE (therapy centres)
  // ══════════════════════════════════════════════════════
  var cycle = document.querySelector("[data-cycle]");
  if (cycle) {
    var svg = cycle.querySelector(".cycle__svg");
    var segGroup = svg.querySelector("[data-cycle-segs]");
    var cPanels = cycle.querySelectorAll("[data-cycle-panel]");
    var numEl = svg.querySelector("[data-cycle-num]");
    var prog = svg.querySelector("[data-cycle-progress]");
    var n = cPanels.length;
    var CX = 250,
      CY = 250,
      RO = 215,
      RI = 132,
      GAP = 2.2;
    var NS = "http://www.w3.org/2000/svg";
    var progLen = 2 * Math.PI * 238;
    prog.style.strokeDasharray = progLen;
    prog.style.strokeDashoffset = progLen;

    var polar = function (r, deg) {
      var a = ((deg - 90) * Math.PI) / 180;
      return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
    };

    var segs = [];
    cPanels.forEach(function (panel, i) {
      var a0 = (360 / n) * i + GAP;
      var a1 = (360 / n) * (i + 1) - GAP;
      var p1 = polar(RO, a0),
        p2 = polar(RO, a1),
        p3 = polar(RI, a1),
        p4 = polar(RI, a0);
      var large = a1 - a0 > 180 ? 1 : 0;
      var d =
        "M" + p1[0] + " " + p1[1] +
        " A" + RO + " " + RO + " 0 " + large + " 1 " + p2[0] + " " + p2[1] +
        " L" + p3[0] + " " + p3[1] +
        " A" + RI + " " + RI + " 0 " + large + " 0 " + p4[0] + " " + p4[1] + " Z";
      var g = document.createElementNS(NS, "g");
      g.setAttribute("class", "cycle-seg");
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "button");
      g.setAttribute("aria-label", "Φάση " + (i + 1) + ": " + panel.getAttribute("data-short"));
      var path = document.createElementNS(NS, "path");
      path.setAttribute("d", d);
      g.appendChild(path);
      var mid = polar((RO + RI) / 2, (a0 + a1) / 2);
      var t1 = document.createElementNS(NS, "text");
      t1.setAttribute("x", mid[0]);
      t1.setAttribute("y", mid[1] - 4);
      t1.textContent = pad(i + 1);
      g.appendChild(t1);
      var t2 = document.createElementNS(NS, "text");
      t2.setAttribute("x", mid[0]);
      t2.setAttribute("y", mid[1] + 14);
      t2.setAttribute("style", "font-size:11px;font-weight:500");
      t2.textContent = panel.getAttribute("data-short");
      g.appendChild(t2);
      segGroup.appendChild(g);
      segs.push(g);
    });

    var cur = -1;
    var cycleUser = false;
    var choose = function (i) {
      cur = i;
      segs.forEach(function (s, k) {
        s.classList.toggle("is-active", k === i);
        s.setAttribute("aria-pressed", String(k === i));
      });
      cPanels.forEach(function (p, k) {
        p.hidden = k !== i;
        if (k === i) {
          p.classList.remove("swap");
          void p.offsetWidth;
          p.classList.add("swap");
        }
      });
      numEl.textContent = pad(i + 1);
      prog.style.transition = "stroke-dashoffset 800ms cubic-bezier(.22,1,.36,1)";
      prog.style.strokeDashoffset = progLen * (1 - (i + 1) / n);
    };
    segs.forEach(function (s, i) {
      s.addEventListener("click", function () {
        cycleUser = true;
        choose(i);
      });
      s.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          cycleUser = true;
          choose(i);
        } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          segs[(i + 1) % n].focus();
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          segs[(i - 1 + n) % n].focus();
        }
      });
    });
    choose(0);

    var cycleTimer = null;
    onVisible(cycle, function (v) {
      if (v && !cycleUser && !cycleTimer && FX.motionOK()) {
        cycleTimer = setInterval(function () {
          if (cycleUser) {
            clearInterval(cycleTimer);
            return;
          }
          choose((cur + 1) % n);
        }, 4800);
      }
      if (!v && cycleTimer) {
        clearInterval(cycleTimer);
        cycleTimer = null;
      }
    });
  }

  // ══════════════════════════════════════════════════════
  // SCHEDULE BOARD (cancellation → make-up demo)
  // ══════════════════════════════════════════════════════
  var board = document.querySelector("[data-board]");
  if (board) {
    var grid = board.querySelector(".board__grid");
    var log = board.querySelector(".board__log");
    var DAYS_L = ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή"];
    var DAYS_S = ["Δευ", "Τρι", "Τετ", "Πεμ", "Παρ"];
    var TIMES = [14, 15, 16, 17, 18, 19];
    var TYPES = {
      logo: "Λογοθεραπεία",
      ergo: "Εργοθεραπεία",
      psy: "Ψυχοθεραπεία",
      eid: "Ειδ. Διαπαιδαγώγηση",
    };
    var initial = [
      [0, 14, "logo", "Γ.Π."], [0, 15, "ergo", "Μ.Κ."], [0, 16, "psy", "Α.Λ."], [0, 18, "eid", "Ν.Σ."],
      [1, 14, "ergo", "Δ.Τ."], [1, 15, "logo", "Ε.Β."], [1, 17, "logo", "Κ.Ζ."], [1, 18, "psy", "Ι.Ρ."], [1, 19, "eid", "Φ.Α."],
      [2, 15, "eid", "Χ.Μ."], [2, 16, "logo", "Γ.Π."], [2, 17, "ergo", "Λ.Ο."], [2, 19, "psy", "Σ.Δ."],
      [3, 14, "psy", "Α.Λ."], [3, 16, "ergo", "Μ.Κ."], [3, 17, "eid", "Ν.Σ."],
      [4, 14, "logo", "Ε.Β."], [4, 15, "psy", "Ι.Ρ."], [4, 16, "eid", "Χ.Μ."], [4, 18, "ergo", "Δ.Τ."],
    ];
    var waitlist = ["Ο.Π.", "Ρ.Θ.", "Τ.Κ.", "Β.Ν.", "Ζ.Η."];
    var cells = {};

    var key = function (d, t) {
      return d + "-" + t;
    };

    var build = function () {
      grid.innerHTML = "";
      cells = {};
      var corner = document.createElement("div");
      grid.appendChild(corner);
      DAYS_S.forEach(function (d, i) {
        var h = document.createElement("div");
        h.className = "board__head";
        h.innerHTML = '<span aria-hidden="true">' + d + '</span><span class="sr-only">' + DAYS_L[i] + "</span>";
        grid.appendChild(h);
      });
      TIMES.forEach(function (t) {
        var tm = document.createElement("div");
        tm.className = "board__time";
        tm.textContent = pad(t) + ":00";
        grid.appendChild(tm);
        for (var d = 0; d < 5; d++) {
          var c = document.createElement("div");
          c.className = "board__cell";
          grid.appendChild(c);
          cells[key(d, t)] = c;
        }
      });
      initial.forEach(function (s) {
        placeSession(s[0], s[1], s[2], s[3], false);
      });
      log.innerHTML = "";
      waitIdx = 0;
    };

    var placeSession = function (d, t, type, child, isNew) {
      var cell = cells[key(d, t)];
      if (!cell || cell.firstChild) return null;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "session session--" + type + (isNew ? " is-new" : "");
      btn.setAttribute("data-type", type);
      btn.setAttribute("data-child", child);
      btn.setAttribute("aria-label", TYPES[type] + ", " + child + ", " + DAYS_L[d] + " " + pad(t) + ":00. Πατήστε για προσομοίωση ακύρωσης.");
      btn.innerHTML = "<strong>" + child + "</strong><small>" + TYPES[type] + "</small>";
      btn.addEventListener("click", function () {
        cancel(btn, d, t);
      });
      cell.appendChild(btn);
      if (isNew) {
        setTimeout(function () {
          btn.classList.remove("is-new");
        }, 2600);
      }
      return btn;
    };

    var addLog = function (html, gold) {
      var it = document.createElement("div");
      it.className = "board__log-item" + (gold ? " board__log-item--gold" : "");
      it.innerHTML = html;
      log.insertBefore(it, log.firstChild);
      while (log.children.length > 3) log.removeChild(log.lastChild);
    };

    var waitIdx = 0;
    var busy = false;
    var cancel = function (btn, d, t) {
      if (busy) return;
      busy = true;
      var type = btn.getAttribute("data-type");
      var child = btn.getAttribute("data-child");
      btn.classList.add("is-cancelled");
      addLog(ICONS.bell + "<span>Ο γονέας του/της <strong>" + child + "</strong> ακύρωσε τη " + TYPES[type].toLowerCase() + " της " + DAYS_S[d] + " " + pad(t) + ":00.</span>", true);

      setTimeout(function () {
        btn.remove();
        // Find the next free slot later in the week for the make-up session
        var found = null;
        for (var dd = d; dd < 5 && !found; dd++) {
          for (var ti = 0; ti < TIMES.length; ti++) {
            var tt = TIMES[ti];
            if (dd === d && tt <= t) continue;
            if (!cells[key(dd, tt)].firstChild) {
              found = [dd, tt];
              break;
            }
          }
        }
        if (found) {
          placeSession(found[0], found[1], type, child, true);
          addLog(ICONS.swap + "<span>Αναπλήρωση για <strong>" + child + "</strong>: " + DAYS_S[found[0]] + " " + pad(found[1]) + ":00 — ο γονέας επιβεβαίωσε.</span>");
        } else {
          addLog(ICONS.cal + "<span>Δεν υπάρχει κενό αυτή την εβδομάδα — η αναπλήρωση προγραμματίζεται για την επόμενη.</span>");
        }
      }, 900);

      setTimeout(function () {
        var w = waitlist[waitIdx % waitlist.length];
        waitIdx++;
        placeSession(d, t, type, w, true);
        addLog(ICONS.check + "<span>Από λίστα αναμονής: <strong>" + w + "</strong> καλύπτει το κενό της " + DAYS_S[d] + " " + pad(t) + ":00.</span>");
        busy = false;
      }, 2100);
    };

    build();

    var demoBtn = board.querySelector("[data-board-demo]");
    var resetBtn = board.querySelector("[data-board-reset]");
    if (demoBtn) {
      demoBtn.addEventListener("click", function () {
        var all = grid.querySelectorAll(".session:not(.is-cancelled)");
        if (all.length) all[(Math.random() * all.length) | 0].click();
      });
    }
    if (resetBtn) resetBtn.addEventListener("click", build);
  }

  // ══════════════════════════════════════════════════════
  // PROGRESS RINGS (referral tracker)
  // ══════════════════════════════════════════════════════
  var rings = document.querySelectorAll(".ring__fg[data-value]");
  if (rings.length) {
    var C = 2 * Math.PI * 40;
    rings.forEach(function (r) {
      r.style.strokeDasharray = C;
      r.style.strokeDashoffset = C;
    });
    var ringObs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var r = e.target;
          ringObs.unobserve(r);
          var v = parseFloat(r.getAttribute("data-value"));
          r.style.strokeDashoffset = C * (1 - v);
          var label = r.closest(".ring-wrap").querySelector("span");
          if (label && label.hasAttribute("data-ring-count")) {
            var end = parseInt(label.getAttribute("data-ring-count"), 10);
            var of = label.getAttribute("data-ring-of");
            if (!FX.motionOK()) {
              label.textContent = end + "/" + of;
              return;
            }
            var st = performance.now();
            (function step(now) {
              var t = Math.min((now - st) / 1600, 1);
              label.textContent = Math.round(end * (1 - Math.pow(1 - t, 3))) + "/" + of;
              if (t < 1) requestAnimationFrame(step);
            })(st);
          }
        });
      },
      { threshold: 0.4 },
    );
    rings.forEach(function (r) {
      ringObs.observe(r);
    });
  }

  // ══════════════════════════════════════════════════════
  // TEAM HUB DIAGRAM
  // ══════════════════════════════════════════════════════
  var hub = document.querySelector("[data-hub]");
  if (hub) {
    var nodes = hub.querySelectorAll(".hub-node");
    var lines = hub.querySelectorAll(".hub-line");
    var hPanels = hub.querySelectorAll("[data-hub-panel]");
    var info = hub.querySelector(".hub__info");
    var hubActive = null;
    var pickNode = function (k) {
      if (k === hubActive) return;
      hubActive = k;
      nodes.forEach(function (nd) {
        var on = nd.getAttribute("data-node") === k;
        nd.classList.toggle("is-active", on);
        nd.setAttribute("aria-pressed", String(on));
      });
      lines.forEach(function (l) {
        l.classList.toggle("is-active", l.getAttribute("data-line") === k);
      });
      hPanels.forEach(function (p) {
        p.hidden = p.getAttribute("data-hub-panel") !== k;
      });
      info.classList.remove("swap");
      void info.offsetWidth;
      info.classList.add("swap");
    };
    nodes.forEach(function (nd) {
      var k = nd.getAttribute("data-node");
      nd.addEventListener("click", function () {
        pickNode(k);
      });
      nd.addEventListener("mouseenter", function () {
        pickNode(k);
      });
      nd.addEventListener("focus", function () {
        pickNode(k);
      });
      nd.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          pickNode(k);
        }
      });
    });
    pickNode(nodes[0].getAttribute("data-node"));
  }
})();
