(function () {
  "use strict";

  var STORAGE_KEY = "a11y-settings";
  var MAX_TEXT_STEP = 3;

  // ── Settings ────────────────────────────────────────
  var settings = { textStep: 0, contrast: false, noAnim: false, underline: false };

  function loadSettings() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved === "object") {
        settings.textStep = Math.min(Math.max(parseInt(saved.textStep, 10) || 0, 0), MAX_TEXT_STEP);
        settings.contrast = saved.contrast === true;
        settings.noAnim = saved.noAnim === true;
        settings.underline = saved.underline === true;
      }
    } catch (e) {
      /* no saved settings — use defaults */
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      /* storage unavailable — settings stay for this page only */
    }
  }

  function applySettings() {
    var root = document.documentElement;
    var body = document.body;

    root.classList.remove("a11y-text-1", "a11y-text-2", "a11y-text-3");
    if (settings.textStep > 0) {
      root.classList.add("a11y-text-" + settings.textStep);
    }

    body.classList.toggle("a11y-contrast", settings.contrast);
    body.classList.toggle("a11y-no-anim", settings.noAnim);
    body.classList.toggle("a11y-underline", settings.underline);
  }

  // ── Widget markup ───────────────────────────────────
  function buildWidget() {
    var toolbar = document.createElement("div");
    toolbar.className = "a11y-toolbar";
    toolbar.innerHTML =
      '<button type="button" class="a11y-toolbar__toggle" aria-expanded="false" aria-controls="a11yPanel">' +
      '<img src="assets/gear.svg" alt="" width="26" height="26">' +
      '<span class="a11y-sr-only">Εργαλεία προσβασιμότητας</span>' +
      "</button>";
    document.body.appendChild(toolbar);

    var backdrop = document.createElement("div");
    backdrop.className = "a11y-backdrop";
    document.body.appendChild(backdrop);

    var drawer = document.createElement("aside");
    drawer.id = "a11yPanel";
    drawer.className = "a11y-drawer";
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");
    drawer.setAttribute("aria-label", "Επιλογές προσβασιμότητας");
    drawer.innerHTML =
      '<div class="a11y-drawer__header">' +
      '<h2 class="a11y-drawer__title">Προσβασιμότητα</h2>' +
      '<button type="button" class="a11y-drawer__close" aria-label="Κλείσιμο">✕</button>' +
      "</div>" +
      '<button type="button" class="a11y-drawer__btn" data-action="text-up"><span class="a11y-drawer__icon" aria-hidden="true">A+</span>Αύξηση μεγέθους κειμένου</button>' +
      '<button type="button" class="a11y-drawer__btn" data-action="text-down"><span class="a11y-drawer__icon" aria-hidden="true">A−</span>Μείωση μεγέθους κειμένου</button>' +
      '<button type="button" class="a11y-drawer__btn" data-action="contrast" aria-pressed="false"><span class="a11y-drawer__icon" aria-hidden="true">◐</span>Υψηλή αντίθεση</button>' +
      '<button type="button" class="a11y-drawer__btn" data-action="no-anim" aria-pressed="false"><span class="a11y-drawer__icon" aria-hidden="true">✨</span>Απενεργοποίηση κινήσεων</button>' +
      '<button type="button" class="a11y-drawer__btn" data-action="underline" aria-pressed="false"><span class="a11y-drawer__icon" aria-hidden="true">🔗</span>Υπογράμμιση συνδέσμων</button>' +
      '<button type="button" class="a11y-drawer__btn" data-action="reset"><span class="a11y-drawer__icon" aria-hidden="true">↩</span>Επαναφορά</button>';
    document.body.appendChild(drawer);

    return { toolbar: toolbar, backdrop: backdrop, drawer: drawer };
  }

  // ── Widget behaviour ────────────────────────────────
  function init() {
    loadSettings();
    applySettings();

    var widget = buildWidget();
    var toolbar = widget.toolbar;
    var backdrop = widget.backdrop;
    var drawer = widget.drawer;
    var toggle = toolbar.querySelector(".a11y-toolbar__toggle");
    var buttons = {
      "text-up": drawer.querySelector('[data-action="text-up"]'),
      "text-down": drawer.querySelector('[data-action="text-down"]'),
      contrast: drawer.querySelector('[data-action="contrast"]'),
      "no-anim": drawer.querySelector('[data-action="no-anim"]'),
      underline: drawer.querySelector('[data-action="underline"]')
    };

    function syncButtons() {
      buttons["text-up"].disabled = settings.textStep >= MAX_TEXT_STEP;
      buttons["text-down"].disabled = settings.textStep <= 0;
      buttons.contrast.setAttribute("aria-pressed", String(settings.contrast));
      buttons["no-anim"].setAttribute("aria-pressed", String(settings.noAnim));
      buttons.underline.setAttribute("aria-pressed", String(settings.underline));
    }

    function openPanel() {
      drawer.classList.add("open");
      backdrop.classList.add("open");
      toggle.setAttribute("aria-expanded", "true");
      drawer.querySelector(".a11y-drawer__close").focus();
    }

    function closePanel(refocus) {
      drawer.classList.remove("open");
      backdrop.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      if (refocus) {
        toggle.focus();
      }
    }

    function isOpen() {
      return drawer.classList.contains("open");
    }

    toggle.addEventListener("click", function () {
      if (isOpen()) {
        closePanel(false);
      } else {
        openPanel();
      }
    });

    drawer.querySelector(".a11y-drawer__close").addEventListener("click", function () {
      closePanel(true);
    });

    drawer.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-action]");
      if (!btn) {
        return;
      }

      switch (btn.getAttribute("data-action")) {
        case "text-up":
          settings.textStep = Math.min(settings.textStep + 1, MAX_TEXT_STEP);
          break;
        case "text-down":
          settings.textStep = Math.max(settings.textStep - 1, 0);
          break;
        case "contrast":
          settings.contrast = !settings.contrast;
          break;
        case "no-anim":
          settings.noAnim = !settings.noAnim;
          break;
        case "underline":
          settings.underline = !settings.underline;
          break;
        case "reset":
          settings = { textStep: 0, contrast: false, noAnim: false, underline: false };
          break;
      }

      applySettings();
      saveSettings();
      syncButtons();
    });

    // Keyboard: Escape closes the drawer
    drawer.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closePanel(true);
      }
    });

    // Click outside (backdrop or page) closes the drawer
    document.addEventListener("click", function (event) {
      if (isOpen() && !toolbar.contains(event.target) && !drawer.contains(event.target)) {
        closePanel(false);
      }
    });

    syncButtons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
