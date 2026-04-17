(function () {
  "use strict";

  // ── DOM References ──────────────────────────────────
  const header = document.getElementById("header");
  const menuToggle = document.getElementById("menuToggle");
  const nav = document.getElementById("navMenu");
  const navLinks = document.querySelectorAll(".nav__link");
  const faqItems = document.querySelectorAll(".faq-item");
  const contactForm = document.getElementById("contactForm");
  const sections = document.querySelectorAll("section[id]");
  const navOverlay = document.getElementById("navOverlay");

  // ══════════════════════════════════════════════════════
  // MOBILE MENU
  // ══════════════════════════════════════════════════════
  function openMenu() {
    menuToggle.classList.add("active");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Κλείσιμο μενού");
    nav.classList.add("open");
    navOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    menuToggle.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Άνοιγμα μενού");
    nav.classList.remove("open");
    navOverlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  menuToggle.addEventListener("click", function () {
    const isOpen = nav.classList.contains("open");
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close menu on nav link click
  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      if (nav.classList.contains("open")) {
        closeMenu();
      }
    });
  });

  // Close menu on overlay click
  navOverlay.addEventListener("click", function () {
    closeMenu();
  });

  // Close menu on Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("open")) {
      closeMenu();
      menuToggle.focus();
    }
  });

  // ══════════════════════════════════════════════════════
  // HEADER SCROLL EFFECT
  // ══════════════════════════════════════════════════════
  var lastScrollY = 0;
  var ticking = false;

  function updateHeader() {
    if (window.scrollY > 50) {
      header.classList.add("header--scrolled");
    } else {
      header.classList.remove("header--scrolled");
    }
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      lastScrollY = window.scrollY;
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    },
    { passive: true },
  );

  // Run on load in case page is already scrolled
  updateHeader();

  // ══════════════════════════════════════════════════════
  // ACTIVE NAV LINK ON SCROLL
  // ══════════════════════════════════════════════════════
  var navObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.getAttribute("id");
          navLinks.forEach(function (link) {
            link.classList.remove("active");
            if (link.getAttribute("href") === "#" + id) {
              link.classList.add("active");
            }
          });
        }
      });
    },
    {
      rootMargin: "-20% 0px -75% 0px",
      threshold: 0,
    },
  );

  sections.forEach(function (section) {
    navObserver.observe(section);
  });

  // ══════════════════════════════════════════════════════
  // FAQ ACCORDION
  // ══════════════════════════════════════════════════════
  faqItems.forEach(function (item) {
    var button = item.querySelector(".faq-item__question");
    var answer = item.querySelector(".faq-item__answer");

    button.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");

      // Close all other items
      faqItems.forEach(function (otherItem) {
        if (otherItem !== item) {
          otherItem.classList.remove("open");
          otherItem
            .querySelector(".faq-item__question")
            .setAttribute("aria-expanded", "false");
        }
      });

      // Toggle current item
      if (isOpen) {
        item.classList.remove("open");
        button.setAttribute("aria-expanded", "false");
      } else {
        item.classList.add("open");
        button.setAttribute("aria-expanded", "true");
      }
    });
  });

  // ══════════════════════════════════════════════════════
  // SCROLL REVEAL ANIMATIONS
  // ══════════════════════════════════════════════════════
  var revealElements = [];

  // Add reveal class to animatable elements
  var animatableSelectors = [
    ".service-card",
    ".step",
    ".pricing-card",
    ".faq-item",
    ".about__content",
    ".about__image",
    ".contact-form",
    ".contact-info",
    ".section__header",
  ];

  animatableSelectors.forEach(function (selector) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.classList.add("reveal");
      revealElements.push(el);
    });
  });

  // Check for reduced motion preference
  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );

  function setupRevealObserver() {
    if (prefersReducedMotion.matches) {
      // If reduced motion, make everything visible immediately
      revealElements.forEach(function (el) {
        el.classList.add("visible");
      });
      return;
    }

    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -60px 0px",
      },
    );

    revealElements.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  setupRevealObserver();

  // Listen for changes in motion preference
  prefersReducedMotion.addEventListener("change", function () {
    if (prefersReducedMotion.matches) {
      revealElements.forEach(function (el) {
        el.classList.add("visible");
      });
    }
  });

  // ══════════════════════════════════════════════════════
  // CONTACT FORM VALIDATION
  // ══════════════════════════════════════════════════════
  var validators = {
    name: function (value) {
      if (!value.trim()) return "Παρακαλώ εισάγετε το ονοματεπώνυμό σας.";
      if (value.trim().length < 2)
        return "Το όνομα πρέπει να έχει τουλάχιστον 2 χαρακτήρες.";
      return "";
    },
    email: function (value) {
      if (!value.trim()) return "Παρακαλώ εισάγετε το email σας.";
      // Simple but effective email regex
      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value.trim()))
        return "Παρακαλώ εισάγετε ένα έγκυρο email.";
      return "";
    },
    phone: function (value) {
      // Phone is optional, but if filled, must be valid
      if (value.trim() && !/^[\d\s\-+().]{7,20}$/.test(value.trim())) {
        return "Παρακαλώ εισάγετε έναν έγκυρο αριθμό τηλεφώνου.";
      }
      return "";
    },
    message: function (value) {
      if (!value.trim()) return "Παρακαλώ γράψτε ένα μήνυμα.";
      if (value.trim().length < 10)
        return "Το μήνυμα πρέπει να έχει τουλάχιστον 10 χαρακτήρες.";
      return "";
    },
  };

  function validateField(input) {
    var name = input.getAttribute("name");
    var validator = validators[name];
    if (!validator) return true;

    var error = validator(input.value);
    var errorEl = input.closest(".form-group").querySelector(".form-error");

    if (error) {
      input.classList.add("error");
      if (errorEl) errorEl.textContent = error;
      return false;
    } else {
      input.classList.remove("error");
      if (errorEl) errorEl.textContent = "";
      return true;
    }
  }

  // Real-time validation on blur
  if (contactForm) {
    var inputs = contactForm.querySelectorAll(".form-input");

    inputs.forEach(function (input) {
      input.addEventListener("blur", function () {
        validateField(input);
      });

      // Clear error on input
      input.addEventListener("input", function () {
        if (input.classList.contains("error")) {
          validateField(input);
        }
      });
    });

    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      var isValid = true;
      inputs.forEach(function (input) {
        if (!validateField(input)) {
          isValid = false;
        }
      });

      if (isValid) {
        // Show success message (no backend, so simulate)
        showFormSuccess();
      }
    });
  }

  function showFormSuccess() {
    contactForm.innerHTML =
      '<div class="form-success show">' +
      '<svg class="form-success__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' +
      '<h3 class="form-success__title">Ευχαριστώ!</h3>' +
      '<p class="form-success__text">Το μήνυμά σας στάλθηκε επιτυχώς. Θα επικοινωνήσω μαζί σας σύντομα.</p>' +
      "</div>";
  }

  // ══════════════════════════════════════════════════════
  // STAGGER ANIMATION DELAYS
  // ══════════════════════════════════════════════════════
  function addStaggerDelays(parentSelector, childSelector) {
    var parents = document.querySelectorAll(parentSelector);
    parents.forEach(function (parent) {
      var children = parent.querySelectorAll(childSelector);
      children.forEach(function (child, index) {
        child.style.transitionDelay = index * 80 + "ms";
      });
    });
  }

  addStaggerDelays(".services__grid", ".service-card");
  addStaggerDelays(".pricing__grid", ".pricing-card");
  addStaggerDelays(".faq__list", ".faq-item");
  addStaggerDelays(".steps", ".step");

  // ══════════════════════════════════════════════════════
  // CURRENT YEAR IN FOOTER (future-proofing)
  // ══════════════════════════════════════════════════════
  // Already hardcoded in HTML, but could be dynamic if needed.
})();
