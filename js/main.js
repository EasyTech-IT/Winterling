/**
 * SECTION-MARKIERUNG:
 * BEGIN = Beginn des markierten Code-Abschnitts; END = Ende des Abschnitts.
 * Seitenzuordnung anhand der vorhandenen JavaScript-Selektoren abgeleitet.
 * Die Markierungen sind Kommentare und verändern die Ausführung nicht.
 */

/* JS-SECTION 01 BEGIN | Seite: Alle Seiten / global | Section: Grundinitialisierung und App-Wrapper */
/**
 * Winterling Baudekoration – UX
 */

document.documentElement.style.colorScheme = "light";
document.documentElement.style.backgroundColor = "#f7f6f4";

(() => {
  /**
   * Google Analytics 4 Measurement-ID (Format G-XXXXXXXXXX).
   * Leer lassen, bis die Property angelegt ist – dann wird kein gtag geladen.
   */
  const GA_MEASUREMENT_ID = "";

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const partialBase = (() => {
    const script = document.querySelector('script[src*="main.js"]');
    if (!script) return "partials/";
    const src = script.getAttribute("src") || "js/main.js";
    return src.replace(/js\/main\.js.*$/, "partials/");
  })();

  /* JS-SECTION 01 END | Seite: Alle Seiten / global | Section: Grundinitialisierung und App-Wrapper */

  /* JS-SECTION 02 BEGIN | Seite: Alle Seiten mit data-include | Section: HTML-Partials laden */
  const loadPartials = async () => {
    const nodes = [...document.querySelectorAll("[data-include]")];
    await Promise.all(
      nodes.map(async (el) => {
        const name = el.getAttribute("data-include");
        if (!name) return;
        const res = await fetch(`${partialBase}${name}.html`, {
          cache: "no-cache",
        });
        if (!res.ok)
          throw new Error(
            `Partial nicht geladen: ${name} (HTTP ${res.status})`,
          );
        const html = await res.text();
        el.outerHTML = html;
      }),
    );
  };

  /* JS-SECTION 02 END | Seite: Alle Seiten mit data-include | Section: HTML-Partials laden */

  /* JS-SECTION 03 BEGIN | Seite: Alle Seiten / global | Section: Seitennavigation und CTA an aktuelle Seite anpassen */
  const applyPageChrome = () => {
    const page =
      document.body.getAttribute("data-page") ||
      (
        location.pathname.replace(/\/+$/, "").split("/").pop() || "index"
      ).replace(/\.html$/i, "") ||
      "index";

    document.querySelectorAll("[data-nav]").forEach((link) => {
      const isActive = link.getAttribute("data-nav") === page;
      if (isActive) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    const cta = document.body.getAttribute("data-cta") || "/Winterling/kontakt#angebot";
    document.querySelectorAll("[data-nav-cta]").forEach((link) => {
      link.setAttribute("href", cta);
    });
  };

  /* JS-SECTION 03 END | Seite: Alle Seiten / global | Section: Seitennavigation und CTA an aktuelle Seite anpassen */

  /* JS-SECTION 04 BEGIN | Seite: Alle Seiten mit data-page-intro | Section: Intro-/Ladeanimation */
  const runPageIntro = () => {
    const el = document.querySelector("[data-page-intro]");
    const reveal = () => {
      document.documentElement.classList.remove("is-intro");
      if (el) el.remove();
    };

    if (!el) {
      reveal();
      return;
    }

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.classList.add("is-play");
    if (reduce) el.classList.add("is-static");

    const holdMs = reduce ? 150 : 350;
    const fadeMs = reduce ? 100 : 180;
    let finished = false;

    const close = () => {
      if (finished) return;
      finished = true;
      el.classList.add("is-out");
      el.setAttribute("aria-hidden", "true");
      window.setTimeout(() => {
        document.documentElement.classList.remove("is-intro");
        el.remove();
      }, fadeMs);
    };

    window.setTimeout(close, holdMs);
  };

  /* JS-SECTION 04 END | Seite: Alle Seiten mit data-page-intro | Section: Intro-/Ladeanimation */

  /* =========================================================
   SECTION 06 BEGIN | JavaScript
   Scroll-Reveal für die Vorteile-Section
   ========================================================= */

  (() => {
    const section = document.querySelector(".wb-benefits");

    if (!section) return;

    const elements = section.querySelectorAll(".wb-reveal");

    // Bei deaktivierten Animationen Inhalte sofort anzeigen.
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => {
        element.classList.add("is-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -35px 0px",
      },
    );

    elements.forEach((element) => {
      observer.observe(element);
    });
  })();

  /* =========================================================
   SECTION 06 END | JavaScript
   ========================================================= */

  /* =========================================================
   SECTION 08 BEGIN | Google Review Slider
   Automatischer Wechsel, Pfeile und Positionsanzeigen
   ========================================================= */

  (() => {
    const sliders = document.querySelectorAll("[data-review-slider]");

    sliders.forEach((slider) => {
      if (slider.dataset.reviewInitialized === "true") return;
      slider.dataset.reviewInitialized = "true";

      const cards = Array.from(slider.querySelectorAll("[data-review]"));
      const dotsContainer = slider.querySelector("[data-review-dots]");
      const prevButton = slider.querySelector("[data-review-prev]");
      const nextButton = slider.querySelector("[data-review-next]");

      if (!cards.length || !dotsContainer || !prevButton || !nextButton) {
        return;
      }

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      );

      let activeIndex = 0;
      let intervalId = null;
      let isPaused = false;

      /* START: Positionsanzeigen erzeugen */

      const dots = cards.map((card, index) => {
        const dot = document.createElement("button");

        dot.type = "button";
        dot.setAttribute("aria-label", `Bewertung ${index + 1} anzeigen`);
        dot.setAttribute("aria-current", index === 0 ? "true" : "false");

        dot.addEventListener("click", () => {
          showReview(index);
          restartAutoplay();
        });

        dotsContainer.appendChild(dot);
        return dot;
      });

      /* ENDE: Positionsanzeigen erzeugen */

      /* START: Kartenpositionen aktualisieren */

      function showReview(index) {
        activeIndex = (index + cards.length) % cards.length;

        const previousIndex = (activeIndex - 1 + cards.length) % cards.length;

        const nextIndex = (activeIndex + 1) % cards.length;

        cards.forEach((card, cardIndex) => {
          card.classList.remove("is-prev", "is-active", "is-next");

          card.removeAttribute("aria-current");
          card.setAttribute("aria-hidden", "true");
          card.setAttribute("inert", "");

          if (cardIndex === activeIndex) {
            card.classList.add("is-active");
            card.setAttribute("aria-current", "true");
            card.setAttribute("aria-hidden", "false");
            card.removeAttribute("inert");
          } else if (cardIndex === previousIndex) {
            card.classList.add("is-prev");
          } else if (cardIndex === nextIndex) {
            card.classList.add("is-next");
          }
        });

        dots.forEach((dot, dotIndex) => {
          dot.setAttribute(
            "aria-current",
            dotIndex === activeIndex ? "true" : "false",
          );
        });
      }

      /* ENDE: Kartenpositionen aktualisieren */

      /* START: Automatische Wiedergabe */

      function stopAutoplay() {
        if (intervalId !== null) {
          window.clearInterval(intervalId);
          intervalId = null;
        }
      }

      function startAutoplay() {
        stopAutoplay();

        if (isPaused || reducedMotion.matches || cards.length < 2) {
          return;
        }

        intervalId = window.setInterval(() => {
          showReview(activeIndex + 1);
        }, 3000);
      }

      function restartAutoplay() {
        startAutoplay();
      }

      /* ENDE: Automatische Wiedergabe */

      /* START: Pfeilsteuerung */

      prevButton.addEventListener("click", () => {
        showReview(activeIndex - 1);
        restartAutoplay();
      });

      nextButton.addEventListener("click", () => {
        showReview(activeIndex + 1);
        restartAutoplay();
      });

      /* ENDE: Pfeilsteuerung */

      /* START: Pausieren bei Interaktion */

      slider.addEventListener("mouseenter", () => {
        isPaused = true;
        stopAutoplay();
      });

      slider.addEventListener("mouseleave", () => {
        isPaused = false;
        startAutoplay();
      });

      slider.addEventListener("focusin", () => {
        isPaused = true;
        stopAutoplay();
      });

      slider.addEventListener("focusout", (event) => {
        if (!slider.contains(event.relatedTarget)) {
          isPaused = false;
          startAutoplay();
        }
      });

      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          stopAutoplay();
        } else {
          startAutoplay();
        }
      });

      /* ENDE: Pausieren bei Interaktion */

      /* START: Initialisierung */

      showReview(0);
      startAutoplay();

      /* ENDE: Initialisierung */
    });
  })();

  /* =========================================================
   SECTION 08 END | Google Review Slider
   ========================================================= */

  /* JS-SECTION 05 BEGIN | Seite: Alle Seiten / global | Section: App-Initialisierung und Google-Bewertungsdaten */
  const initApp = () => {
    runPageIntro();
    document.querySelectorAll("[data-year]").forEach((el) => {
      el.textContent = String(new Date().getFullYear());
    });

    const applyGoogleRating = (data) => {
      if (!data || typeof data !== "object") return;
      const rating =
        data.rating_label ||
        (typeof data.rating === "number"
          ? data.rating.toFixed(1).replace(".", ",")
          : "");
      const count = data.count != null ? String(data.count) : "";
      if (rating) {
        document.querySelectorAll("[data-google-rating]").forEach((el) => {
          el.textContent = rating;
        });
      }
      if (count) {
        document.querySelectorAll("[data-google-count]").forEach((el) => {
          el.textContent = count;
        });
      }
      if (data.url) {
        document
          .querySelectorAll("a.hero__rating, a.google-score")
          .forEach((a) => {
            a.setAttribute("href", data.url);
          });
      }

      const numericRating =
        typeof data.rating === "number"
          ? data.rating
          : parseFloat(String(data.rating ?? "").replace(",", "."));
      const numericCount = data.count != null ? Number(data.count) : NaN;
      if (
        !Number.isFinite(numericRating) ||
        !Number.isFinite(numericCount) ||
        numericCount < 1
      ) {
        return;
      }
      document
        .querySelectorAll('script[type="application/ld+json"]')
        .forEach((script) => {
          try {
            const json = JSON.parse(script.textContent || "");
            const nodes = Array.isArray(json["@graph"])
              ? json["@graph"]
              : [json];
            let changed = false;
            nodes.forEach((node) => {
              if (!node || typeof node !== "object" || !node.aggregateRating)
                return;
              node.aggregateRating.ratingValue = numericRating.toFixed(1);
              node.aggregateRating.reviewCount = String(numericCount);
              node.aggregateRating.ratingCount = String(numericCount);
              changed = true;
            });
            if (changed) script.textContent = JSON.stringify(json);
          } catch {
            /* ungültiges JSON-LD ignorieren */
          }
        });
    };

    fetch("google-reviews.php", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then(applyGoogleRating)
      .catch(() => {});

    /* JS-SECTION 05 END | Seite: Alle Seiten / global | Section: App-Initialisierung und Google-Bewertungsdaten */

    /* JS-SECTION 06 BEGIN | Seite: Alle Seiten / global | Section: Sticky Header beim Scrollen */
    /* Sticky header shrink */
    const header = document.querySelector("[data-header]");
    const onScroll = () => {
      if (!header) return;
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    /* JS-SECTION 06 END | Seite: Alle Seiten / global | Section: Sticky Header beim Scrollen */

    /* JS-SECTION 07 BEGIN | Seite: Alle Seiten / global | Section: Mobile Navigation und Dropdown-Menüs */
    /* Mobile nav */
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("nav");
    const resetDrops = () => {
      document.querySelectorAll(".nav-drop").forEach((drop) => {
        drop.classList.remove("is-open");
        const btn = drop.querySelector(".nav-drop__toggle");
        if (!btn) return;
        btn.setAttribute("aria-expanded", "false");
        const hidden = btn.querySelector(".visually-hidden");
        if (hidden) hidden.textContent = "Leistungen öffnen";
      });
    };

    const closeNav = () => {
      if (!toggle || !nav) return;
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Menü öffnen");
      nav.classList.remove("is-open");
      resetDrops();
    };

    if (toggle && nav) {
      toggle.addEventListener("click", () => {
        const open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!open));
        toggle.setAttribute(
          "aria-label",
          open ? "Menü öffnen" : "Menü schließen",
        );
        nav.classList.toggle("is-open", !open);
        if (!open) resetDrops();
      });
      nav.querySelectorAll("a").forEach((a) => {
        if (a.parentElement?.classList.contains("nav-drop")) return;
        a.addEventListener("click", closeNav);
      });
    }

    document.querySelectorAll(".nav-drop").forEach((drop) => {
      const btn = drop.querySelector(".nav-drop__toggle");
      if (!btn) return;
      const setOpen = (open) => {
        drop.classList.toggle("is-open", open);
        btn.setAttribute("aria-expanded", String(open));
        btn.querySelector(".visually-hidden").textContent = open
          ? "Leistungen schließen"
          : "Leistungen öffnen";
      };
      btn.addEventListener("click", (event) => {
        event.stopPropagation();
        setOpen(!drop.classList.contains("is-open"));
      });
      const parentLink = drop.querySelector(":scope > a");
      parentLink?.addEventListener("click", (event) => {
        if (!window.matchMedia("(max-width: 780px)").matches) return;
        event.preventDefault();
        setOpen(!drop.classList.contains("is-open"));
      });
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        let closeTimer = 0;
        drop.addEventListener("mouseenter", () => {
          window.clearTimeout(closeTimer);
          setOpen(true);
        });
        drop.addEventListener("mouseleave", () => {
          window.clearTimeout(closeTimer);
          closeTimer = window.setTimeout(() => setOpen(false), 280);
        });
      }
      document.addEventListener("click", (event) => {
        if (!drop.contains(event.target)) setOpen(false);
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setOpen(false);
      });
    });

    /* JS-SECTION 07 END | Seite: Alle Seiten / global | Section: Mobile Navigation und Dropdown-Menüs */

    /* JS-SECTION 08 BEGIN | Seite: Alle Seiten mit .reveal | Section: Reveal-Animationen */
    /* Reveal */
    if (!reduceMotion && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
      );
      document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
      // Immediately reveal elements already in viewport
      requestAnimationFrame(() => {
        document.querySelectorAll(".reveal:not(.is-visible)").forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            el.classList.add("is-visible");
            io.unobserve(el);
          }
        });
      });
    } else {
      document
        .querySelectorAll(".reveal")
        .forEach((el) => el.classList.add("is-visible"));
    }

    /* JS-SECTION 08 END | Seite: Alle Seiten mit .reveal | Section: Reveal-Animationen */

    /* JS-SECTION 09 BEGIN | Seite: Seiten mit Vorher-Nachher-Slider | Section: Before/After-Slider */
    /* Before / After slider */
    document.querySelectorAll("[data-ba-slider]").forEach((slider) => {
      const after = slider.querySelector("[data-ba-after]");
      const handle = slider.querySelector("[data-ba-handle]");
      if (!after || !handle) return;

      const setPos = (percent) => {
        const p = Math.max(0, Math.min(100, percent));
        after.style.clipPath = `inset(0 0 0 ${p}%)`;
        handle.style.left = `${p}%`;
        handle.value = String(Math.round(p));
      };

      handle.addEventListener("input", () => setPos(Number(handle.value)));
      setPos(Number(handle.value));
    });

    /* JS-SECTION 09 END | Seite: Seiten mit Vorher-Nachher-Slider | Section: Before/After-Slider */

    /* JS-SECTION 10 BEGIN | Seite: Seiten mit FAQ | Section: FAQ-Akkordeon */
    /* FAQ accordion */
    const setFaqHeight = (panel, value) => {
      panel.style.height = value;
    };

    const foldPanel = (details) =>
      details.querySelector(":scope > .fold__body, :scope > .faq__answer");

    const openFaqItem = (details, animate) => {
      const panel = foldPanel(details);
      if (!panel) {
        details.open = true;
        return;
      }
      if (details.open) return;
      details.open = true;
      if (!animate || reduceMotion) {
        setFaqHeight(panel, "auto");
        return;
      }
      setFaqHeight(panel, "auto");
      const target = panel.scrollHeight;
      setFaqHeight(panel, "0px");
      panel.getBoundingClientRect();
      requestAnimationFrame(() => {
        setFaqHeight(panel, `${target}px`);
      });
      const done = (event) => {
        if (event.propertyName !== "height") return;
        setFaqHeight(panel, "auto");
        panel.removeEventListener("transitionend", done);
      };
      panel.addEventListener("transitionend", done);
    };

    const closeFaqItem = (details, animate) => {
      const panel = foldPanel(details);
      if (!panel) {
        details.open = false;
        return;
      }
      if (!details.open) return;
      if (!animate || reduceMotion) {
        details.open = false;
        setFaqHeight(panel, "0px");
        return;
      }
      setFaqHeight(panel, `${panel.scrollHeight}px`);
      panel.getBoundingClientRect();
      setFaqHeight(panel, "0px");
      const done = (event) => {
        if (event.propertyName !== "height") return;
        details.open = false;
        panel.removeEventListener("transitionend", done);
      };
      panel.addEventListener("transitionend", done);
    };

    document.querySelectorAll(".faq details").forEach((details) => {
      const summary = details.querySelector(":scope > summary");
      const panel = foldPanel(details);
      if (!summary || !panel) return;

      setFaqHeight(panel, details.open ? "auto" : "0px");

      summary.addEventListener("click", (event) => {
        event.preventDefault();
        if (details.open) {
          closeFaqItem(details, true);
          return;
        }
        if (details.closest(".faq")) {
          details
            .closest(".faq")
            .querySelectorAll("details[open]")
            .forEach((other) => {
              if (other !== details) closeFaqItem(other, true);
            });
        }
        openFaqItem(details, true);
      });
    });

    document.querySelectorAll("[data-faq-more]").forEach((btn) => {
      const targetId = btn.getAttribute("aria-controls");
      const extra = targetId
        ? document.getElementById(targetId)
        : btn.closest("section")?.querySelector(".faq__extra");
      if (!extra) return;
      extra.setAttribute("inert", "");
      btn.addEventListener("click", () => {
        const open = extra.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", String(open));
        btn.textContent = open ? "Weniger anzeigen" : "Weitere Fragen anzeigen";
        extra.toggleAttribute("inert", !open);
      });
    });

    /* JS-SECTION 10 END | Seite: Seiten mit FAQ | Section: FAQ-Akkordeon */

    /* JS-SECTION 11 BEGIN | Seite: Leistungs-/FAQ-Seiten | Section: Anker öffnen und Service-Kacheln markieren */
    /* Open accordion from hash */
    const openHash = () => {
      const id = location.hash.slice(1);
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      const fold = el.closest(".service-fold");
      const currentId = fold ? fold.id : id;
      document.querySelectorAll(".service-tile").forEach((link) => {
        const on = (link.getAttribute("href") || "").endsWith(`#${currentId}`);
        if (on) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
      const details = el.closest(".faq details");
      if (details && !details.open) openFaqItem(details, false);
      const target = details || el;
      if (!reduceMotion)
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      else target.scrollIntoView();
    };
    openHash();
    window.addEventListener("hashchange", openHash);
    document.querySelectorAll(".service-tile").forEach((link) => {
      link.addEventListener("click", () => {
        const href = link.getAttribute("href") || "";
        const hash = href.includes("#") ? href.slice(href.indexOf("#")) : "";
        if (hash && hash === location.hash) openHash();
      });
    });

    /* JS-SECTION 11 END | Seite: Leistungs-/FAQ-Seiten | Section: Anker öffnen und Service-Kacheln markieren */

    /* JS-SECTION 12 BEGIN | Seite: Seiten mit Bewertungs-Marquee | Section: Bewertungen-Marquee */
    /* Review marquee */
    const marquee = document.querySelector("[data-review-marquee]");
    if (marquee) {
      const track = marquee.querySelector("[data-review-track]");
      if (track && !reduceMotion) {
        [...track.children].forEach((card) => {
          const clone = card.cloneNode(true);
          clone.setAttribute("aria-hidden", "true");
          track.appendChild(clone);
        });
      }
    }

    /* JS-SECTION 12 END | Seite: Seiten mit Bewertungs-Marquee | Section: Bewertungen-Marquee */

    /* JS-SECTION 13 BEGIN | Seite: Galerie-/Referenzseiten | Section: Lightbox für Bilder */
    /* Lightbox */
    const lightboxItems = [...document.querySelectorAll("[data-lightbox]")];
    if (lightboxItems.length) {
      const lb = document.createElement("div");
      lb.className = "lightbox";
      lb.id = "lightbox";
      lb.setAttribute("role", "dialog");
      lb.setAttribute("aria-modal", "true");
      lb.setAttribute("aria-hidden", "true");
      lb.setAttribute("aria-label", "Bildansicht");
      lb.innerHTML = `
        <button type="button" class="lightbox__close" data-lightbox-close aria-label="Schließen">&times;</button>
        <button type="button" class="lightbox__nav lightbox__nav--prev" data-lightbox-prev aria-label="Vorheriges Bild">‹</button>
        <figure class="lightbox__figure">
          <img class="lightbox__img" alt="" />
          <figcaption class="lightbox__caption"></figcaption>
        </figure>
        <button type="button" class="lightbox__nav lightbox__nav--next" data-lightbox-next aria-label="Nächstes Bild">›</button>
      `;
      document.body.appendChild(lb);

      const imgEl = lb.querySelector(".lightbox__img");
      const captionEl = lb.querySelector(".lightbox__caption");
      let activeIndex = 0;
      let lastFocus = null;

      const getMeta = (item) => {
        const image = item.querySelector("img");
        const title =
          item.querySelector(".masonry__overlay strong")?.textContent?.trim() ||
          "";
        const sub =
          item.querySelector(".masonry__overlay span")?.textContent?.trim() ||
          "";
        return {
          src: image?.currentSrc || image?.src || "",
          alt: image?.alt || title,
          caption: [title, sub].filter(Boolean).join(" – "),
        };
      };

      const show = (index) => {
        if (!lightboxItems.length) return;
        activeIndex = (index + lightboxItems.length) % lightboxItems.length;
        const meta = getMeta(lightboxItems[activeIndex]);
        imgEl.src = meta.src;
        imgEl.alt = meta.alt;
        captionEl.textContent = meta.caption;
      };

      const open = (index) => {
        lastFocus = document.activeElement;
        show(index);
        lb.classList.add("is-open");
        lb.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        lb.querySelector("[data-lightbox-close]")?.focus();
      };

      const close = () => {
        lb.classList.remove("is-open");
        lb.setAttribute("aria-hidden", "true");
        imgEl.removeAttribute("src");
        document.body.style.overflow = "";
        if (lastFocus && typeof lastFocus.focus === "function")
          lastFocus.focus();
      };

      lightboxItems.forEach((item, index) => {
        item.addEventListener("click", () => open(index));
      });

      lb.querySelector("[data-lightbox-close]")?.addEventListener(
        "click",
        close,
      );
      lb.querySelector("[data-lightbox-prev]")?.addEventListener("click", () =>
        show(activeIndex - 1),
      );
      lb.querySelector("[data-lightbox-next]")?.addEventListener("click", () =>
        show(activeIndex + 1),
      );
      lb.addEventListener("click", (e) => {
        if (e.target === lb) close();
      });

      window.addEventListener("keydown", (e) => {
        if (!lb.classList.contains("is-open")) return;
        if (e.key === "Escape") close();
        if (e.key === "ArrowLeft") show(activeIndex - 1);
        if (e.key === "ArrowRight") show(activeIndex + 1);
      });
    }

    /* JS-SECTION 13 END | Seite: Galerie-/Referenzseiten | Section: Lightbox für Bilder */

    /* JS-SECTION 14 BEGIN | Seite: Kontaktseite / Seiten mit kontakt-form | Section: Kontaktformular: Validierung und Versand */
    /* Form – PHP-Versand, Mailto-Fallback wenn Server nicht erreichbar */
    const form = document.getElementById("kontakt-form");
    const errorEl = document.getElementById("form-error");
    const successEl = document.getElementById("form-success");
    const tsInput = document.getElementById("c-form-ts");
    const tokenInput = document.getElementById("c-form-token");
    const honeyInput = document.getElementById("c-honey");
    const faxInput = document.getElementById("c-fax");
    const submitBtn = document.getElementById("form-submit");
    const submitText = document.getElementById("form-submit-text");

    const PROTECTED_MAIL =
      '<span class="protected-email" data-user="info" data-domain="winterling-baudeko.de" role="link" tabindex="0" aria-label="E-Mail an Winterling schreiben">info(at)winterling-baudeko.de</span>';
    const MSG_VALIDATION = `Bitte Pflichtfelder ausfüllen und Einwilligung bestätigen. Bei Problemen: ${PROTECTED_MAIL} oder <a href="tel:+4960476940">06047/6940</a>.`;
    const MSG_SEND_FAIL = `Senden ist gerade nicht möglich. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt: ${PROTECTED_MAIL} oder <a href="tel:+4960476940">06047/6940</a>.`;
    const FORM_ENDPOINT = "/Winterling/send-mail.php";

    const buildFormToken = (ts) => {
      const raw = `${ts}|werk-contact-v1`;
      let out = "";
      for (let i = 0; i < raw.length; i++) {
        out += ((raw.charCodeAt(i) * (i + 3)) % 36).toString(36);
      }
      return out.slice(0, 20);
    };

    const armForm = () => {
      const ts = Math.floor(Date.now() / 1000);
      if (tsInput) tsInput.value = String(ts);
      if (tokenInput) tokenInput.value = buildFormToken(ts);
    };

    const setFormAlert = (el, visible, html) => {
      if (!el) return;
      if (typeof html === "string") el.innerHTML = html;
      el.hidden = !visible;
    };

    if (form) {
      armForm();

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        setFormAlert(errorEl, false);
        setFormAlert(successEl, false);

        if (
          (honeyInput?.value || "").trim() !== "" ||
          (faxInput?.value || "").trim() !== ""
        ) {
          setFormAlert(successEl, true);
          form.reset();
          armForm();
          return;
        }

        if (!form.checkValidity()) {
          setFormAlert(errorEl, true, MSG_VALIDATION);
          form.reportValidity();
          return;
        }

        if (tsInput && !tsInput.value) {
          armForm();
          await new Promise((r) => setTimeout(r, 2100));
        } else if (tsInput) {
          const ageMs = Date.now() - Number(tsInput.value) * 1000;
          if (ageMs < 2000) {
            await new Promise((r) => setTimeout(r, 2000 - ageMs + 50));
          }
        }

        const defaultLabel =
          submitText?.textContent || "Kostenloses Angebot anfragen";
        if (submitBtn) submitBtn.disabled = true;
        if (submitText) submitText.textContent = "Wird gesendet …";

        const formData = new FormData(form);
        formData.set("website", "");
        formData.set("fax_number", "");

        let sent = false;
        let failMessage = MSG_SEND_FAIL;
        try {
          const res = await fetch(FORM_ENDPOINT, {
            method: "POST",
            body: formData,
            signal: AbortSignal.timeout(12000),
          });
          const rawText = await res.text();
          let data = null;
          try {
            data = JSON.parse(rawText);
          } catch (_) {
            data = null;
          }
          if (data?.error && typeof data.error === "string") {
            failMessage = `${data.error} Alternativ: ${PROTECTED_MAIL} oder <a href="tel:+4960476940">06047/6940</a>.`;
          }
          sent = Boolean(res.ok && data && data.ok === true);
        } catch (_) {
          sent = false;
        }

        if (submitBtn) submitBtn.disabled = false;
        if (submitText) submitText.textContent = defaultLabel;

        if (sent) {
          form.reset();
          armForm();
          setFormAlert(successEl, true);
          successEl?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        } else {
          setFormAlert(errorEl, true, failMessage);
        }
      });
    }

    /* JS-SECTION 14 END | Seite: Kontaktseite / Seiten mit kontakt-form | Section: Kontaktformular: Validierung und Versand */

    /* JS-SECTION 15 BEGIN | Seite: Alle Seiten / global | Section: Cookie-Einwilligung und Google Analytics */
    /* Cookie consent + Google Analytics (nur nach Opt-in) */
    const CONSENT_KEY = "werk-cookie-consent-v2";
    const GA_ID_OK = /^G-[A-Z0-9]+$/i.test(GA_MEASUREMENT_ID);
    let gaScriptInjected = false;

    const readConsent = () => {
      try {
        const raw = localStorage.getItem(CONSENT_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!data || typeof data !== "object") return null;
        return {
          necessary: true,
          analytics: Boolean(data.analytics),
          external: Boolean(data.external),
          ts: data.ts || null,
        };
      } catch (_) {
        return null;
      }
    };

    const writeConsent = (consent) => {
      try {
        localStorage.setItem(
          CONSENT_KEY,
          JSON.stringify({
            necessary: true,
            analytics: Boolean(consent.analytics),
            external: Boolean(consent.external),
            ts: new Date().toISOString(),
          }),
        );
      } catch (_) {
        /* ignore */
      }
    };

    const clearLegacyMapsFlag = () => {
      try {
        localStorage.removeItem("werk-maps-consent");
        localStorage.removeItem("werk-cookie-consent");
      } catch (_) {
        /* ignore */
      }
    };

    const loadGoogleAnalytics = () => {
      if (!GA_ID_OK) return;
      window["ga-disable-" + GA_MEASUREMENT_ID] = false;
      window.dataLayer = window.dataLayer || [];
      window.gtag =
        window.gtag ||
        function gtag() {
          window.dataLayer.push(arguments);
        };
      if (!gaScriptInjected) {
        gaScriptInjected = true;
        window.gtag("consent", "default", {
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
          analytics_storage: "denied",
          wait_for_update: 500,
        });
        const script = document.createElement("script");
        script.async = true;
        script.src =
          "https://www.googletagmanager.com/gtag/js?id=" +
          encodeURIComponent(GA_MEASUREMENT_ID);
        document.head.appendChild(script);
        window.gtag("js", new Date());
        window.gtag("config", GA_MEASUREMENT_ID, {
          anonymize_ip: true,
          allow_google_signals: false,
          allow_ad_personalization_signals: false,
        });
      }
      window.gtag("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    };

    const disableGoogleAnalytics = () => {
      if (!GA_ID_OK) return;
      window["ga-disable-" + GA_MEASUREMENT_ID] = true;
      if (typeof window.gtag === "function") {
        window.gtag("consent", "update", {
          analytics_storage: "denied",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
        });
      }
    };

    let loadMapsIfAllowed = () => {};

    const applyConsent = (consent) => {
      if (consent?.analytics) loadGoogleAnalytics();
      else disableGoogleAnalytics();

      if (consent?.external) {
        loadMapsIfAllowed();
      } else {
        document
          .querySelectorAll("[data-map-consent].is-loaded")
          .forEach((box) => {
            box.querySelector("iframe")?.remove();
            box.classList.remove("is-loaded");
          });
      }
    };

    const bannerHtml = `
      <div class="cookie-banner" id="cookie-banner" role="dialog" aria-modal="true" aria-labelledby="cookie-title" aria-hidden="true">
        <div class="cookie-banner__panel">
          <p class="cookie-banner__title" id="cookie-title">Cookie-Einstellungen</p>
          <p class="cookie-banner__text">
            Wir verwenden technisch notwendige Cookies und – nur mit Ihrer Einwilligung –
            Statistik (Google Analytics) sowie externe Inhalte (Google Maps). Details finden Sie in unserer
            <a href="/Winterling/datenschutz">Datenschutzerklärung</a>.
          </p>
          <div class="cookie-banner__actions">
            <button type="button" class="btn btn--primary" data-cookie-accept-all>Alle akzeptieren</button>
            <button type="button" class="btn btn--dark" data-cookie-necessary>Nur notwendige</button>
            <button type="button" class="btn btn--ghost" data-cookie-toggle-settings aria-expanded="true">Einstellungen</button>
          </div>
          <div class="cookie-banner__settings is-open" data-cookie-settings>
            <div class="cookie-option">
              <span class="cookie-option__label">Notwendig</span>
              <input type="checkbox" checked disabled aria-label="Notwendige Cookies (immer aktiv)" />
              <p class="cookie-option__desc">Erforderlich für grundlegende Funktionen und Ihre Einwilligungsauswahl.</p>
            </div>
            <div class="cookie-option">
              <span class="cookie-option__label">Statistik</span>
              <input type="checkbox" id="cookie-analytics" data-cookie-analytics aria-label="Google Analytics erlauben" />
              <p class="cookie-option__desc">Hilft uns zu verstehen, welche Seiten genutzt werden. Es werden Daten an Google übermittelt.</p>
            </div>
            <div class="cookie-option">
              <span class="cookie-option__label">Externe Inhalte</span>
              <input type="checkbox" id="cookie-external" data-cookie-external aria-label="Externe Inhalte erlauben" />
              <p class="cookie-option__desc">Ermöglicht eingebettete Karten von Google Maps. Dabei können Daten an Google übermittelt werden.</p>
            </div>
            <div class="cookie-banner__actions">
              <button type="button" class="btn btn--primary" data-cookie-save>Auswahl speichern</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const floatHtml = `
      <div class="float-dock" aria-label="Schnellkontakt">
        <a
          class="float-btn float-btn--whatsapp"
          href="tel:+4960476940"
          aria-label="Anrufen: 06047/6940"
          title="Anrufen"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/>
          </svg>
        </a>
        <button type="button" class="float-btn float-btn--cookie" data-cookie-open aria-label="Cookie-Einstellungen öffnen" title="Cookie-Einstellungen">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M12 2a9.96 9.96 0 0 0-7.07 2.93A10 10 0 1 0 12 2zm-2.2 5.3a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zm5.1 1.1a1.05 1.05 0 1 1 0 2.1 1.05 1.05 0 0 1 0-2.1zM8.4 12.2a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zm4.3.6a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8zm3.5 2.7a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2z"/>
          </svg>
          <span class="float-btn__label">Cookies</span>
        </button>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", bannerHtml);
    document.body.insertAdjacentHTML("beforeend", floatHtml);

    const banner = document.getElementById("cookie-banner");
    const settings = banner?.querySelector("[data-cookie-settings]");
    const analyticsToggle = banner?.querySelector("[data-cookie-analytics]");
    const externalToggle = banner?.querySelector("[data-cookie-external]");
    const toggleSettingsBtn = banner?.querySelector(
      "[data-cookie-toggle-settings]",
    );

    const unlockScroll = () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };

    const bannerIsVisible = () => {
      if (!banner || !banner.isConnected) return false;
      const box = banner.querySelector(".cookie-banner__panel") || banner;
      const cs = window.getComputedStyle(banner);
      if (cs.display === "none" || cs.visibility === "hidden") return false;
      if (Number(cs.opacity) === 0) return false;
      const r = box.getBoundingClientRect();
      return r.width > 40 && r.height > 40;
    };

    const showBlockedHint = () => {
      unlockScroll();
      if (document.getElementById("site-hint-blocked")) return;
      document.body.insertAdjacentHTML(
        "beforeend",
        `<div class="site-hint" id="site-hint-blocked" role="alert">
          <div class="site-hint__box">
            <p class="site-hint__title">Hinweis zur Darstellung</p>
            <p class="site-hint__text">
              Unsere Einwilligungsabfrage wird bei Ihnen vermutlich von einem
              Werbe- oder Tracking-Blocker, den Brave-Shields oder einem VPN-Filter
              unterdrückt. Falls Sie Probleme beim Scrollen oder Bedienen der Seite
              haben, schalten Sie bitte für diese Seite den Blocker bzw. das VPN
              vorübergehend aus und laden Sie die Seite neu.
            </p>
            <button type="button" class="btn btn--primary" data-site-hint-close>Verstanden</button>
          </div>
        </div>`,
      );
      document
        .querySelector("[data-site-hint-close]")
        ?.addEventListener("click", () => {
          document.getElementById("site-hint-blocked")?.remove();
        });
    };

    /* Filterlisten blenden den Banner teils verzögert aus: mehrfach prüfen */
    const watchBannerVisibility = () => {
      [350, 1200, 2500].forEach((ms) => {
        window.setTimeout(() => {
          if (!banner?.classList.contains("is-open")) return;
          if (!bannerIsVisible()) showBlockedHint();
        }, ms);
      });
    };

    const openBanner = (prefs) => {
      if (!banner) return;
      if (analyticsToggle) analyticsToggle.checked = Boolean(prefs?.analytics);
      if (externalToggle) externalToggle.checked = Boolean(prefs?.external);
      settings?.classList.add("is-open");
      if (toggleSettingsBtn)
        toggleSettingsBtn.setAttribute("aria-expanded", "true");
      banner.classList.add("is-open");
      banner.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      watchBannerVisibility();
    };

    const closeBanner = () => {
      if (!banner) return;
      banner.classList.remove("is-open");
      banner.setAttribute("aria-hidden", "true");
      unlockScroll();
      document.getElementById("site-hint-blocked")?.remove();
    };

    const saveAndClose = (consent) => {
      writeConsent(consent);
      clearLegacyMapsFlag();
      applyConsent(consent);
      closeBanner();
    };

    banner
      ?.querySelector("[data-cookie-accept-all]")
      ?.addEventListener("click", () => {
        saveAndClose({ analytics: true, external: true });
      });

    banner
      ?.querySelector("[data-cookie-necessary]")
      ?.addEventListener("click", () => {
        saveAndClose({ analytics: false, external: false });
      });

    banner
      ?.querySelector("[data-cookie-save]")
      ?.addEventListener("click", () => {
        saveAndClose({
          analytics: Boolean(analyticsToggle?.checked),
          external: Boolean(externalToggle?.checked),
        });
      });

    toggleSettingsBtn?.addEventListener("click", () => {
      const open = !settings?.classList.contains("is-open");
      settings?.classList.toggle("is-open", open);
      toggleSettingsBtn.setAttribute("aria-expanded", String(open));
    });

    document.querySelectorAll("[data-cookie-open]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        openBanner(readConsent() || { analytics: false, external: false });
      });
    });

    const mapBoxes = document.querySelectorAll("[data-map-consent]");

    loadMapsIfAllowed = () => {
      mapBoxes.forEach((box) => {
        const src = box.getAttribute("data-map-src");
        if (!src || box.classList.contains("is-loaded")) return;
        const iframe = document.createElement("iframe");
        iframe.src = src;
        iframe.title = "Standort Winterling Baudekoration auf Google Maps";
        iframe.loading = "lazy";
        iframe.referrerPolicy = "no-referrer-when-downgrade";
        iframe.allowFullscreen = true;
        box.appendChild(iframe);
        box.classList.add("is-loaded");
      });
    };

    mapBoxes.forEach((box) => {
      const accept = box.querySelector("[data-map-accept]");
      if (!accept) return;
      accept.addEventListener("click", () => {
        const current = readConsent() || { analytics: false, external: false };
        writeConsent({ analytics: current.analytics, external: true });
        clearLegacyMapsFlag();
        closeBanner();
        loadMapsIfAllowed();
      });
    });

    const existing = readConsent();
    if (!existing) openBanner({ analytics: false, external: false });
    else applyConsent(existing);
  };

  const boot = async () => {
    try {
      await loadPartials();
      applyPageChrome();
    } catch (err) {
      console.error(err);
      document.body.insertAdjacentHTML(
        "afterbegin",
        '<p style="margin:1rem;padding:1rem;background:#fff3cd;border:1px solid #f0d48a;border-radius:8px">Header/Footer konnten nicht geladen werden. Bitte prüfen, ob der Ordner <code>partials/</code> auf dem Server erreichbar ist (nicht in der .htaccess blockiert).</p>',
      );
    }
    initApp();
  };

  boot();
})();

/* JS-SECTION 15 END | Seite: Alle Seiten / global | Section: Cookie-Einwilligung und Google Analytics */

/* =========================================================
   START: GLASS ISLAND SCROLL-LOGIK
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-chrome");

  if (!header) return;

  const updateHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 20);
  };

  updateHeader();

  window.addEventListener("scroll", updateHeader, {
    passive: true,
  });
});

/* =========================================================
   ENDE: GLASS ISLAND SCROLL-LOGIK
   ========================================================= */

/* =========================================================
   START: GLASS NAVIGATION – WINTERLING BAUDEKORATION
   Funktionen:
   - Mobile Navigation öffnen und schließen
   - Dropdown-Menüs bedienen
   - Navigation beim Scrollen anpassen
   - Menüs bei Klick außerhalb schließen
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("[data-header]");
  const nav = document.querySelector(".nav");
  const navToggle = document.querySelector(".nav-toggle");

  if (!header || !nav || !navToggle) {
    console.warn("Navigation: Benötigte HTML-Elemente wurden nicht gefunden.");
    return;
  }

  /* START: Scroll-Effekt */
  const updateHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 20);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
  /* ENDE: Scroll-Effekt */

  /* START: Mobiles Menü */
  const closeMobileMenu = () => {
    nav.classList.remove("is-open");
    navToggle.classList.remove("is-active");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");

    nav.querySelectorAll(".nav-drop.is-open").forEach((dropdown) => {
      dropdown.classList.remove("is-open");
    });
  };

  navToggle.addEventListener("click", (event) => {
    event.stopPropagation();

    const isOpen = nav.classList.toggle("is-open");

    navToggle.classList.toggle("is-active", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("menu-open", isOpen);
  });
  /* ENDE: Mobiles Menü */

  /* START: Dropdown-Menüs */
  const dropdowns = nav.querySelectorAll(".nav-drop");

  dropdowns.forEach((dropdown) => {
    const trigger = dropdown.querySelector("button, [aria-haspopup='true']");

    if (!trigger) return;

    trigger.addEventListener("click", (event) => {
      event.stopPropagation();

      const willOpen = !dropdown.classList.contains("is-open");

      dropdowns.forEach((item) => {
        item.classList.remove("is-open");

        const itemTrigger = item.querySelector(
          "button, [aria-haspopup='true']",
        );

        if (itemTrigger) {
          itemTrigger.setAttribute("aria-expanded", "false");
        }
      });

      if (willOpen) {
        dropdown.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });
  /* ENDE: Dropdown-Menüs */

  /* START: Klick außerhalb schließt Navigation */
  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) {
      closeMobileMenu();

      dropdowns.forEach((dropdown) => {
        dropdown.classList.remove("is-open");

        const trigger = dropdown.querySelector(
          "button, [aria-haspopup='true']",
        );

        if (trigger) {
          trigger.setAttribute("aria-expanded", "false");
        }
      });
    }
  });
  /* ENDE: Klick außerhalb schließt Navigation */

  /* START: Navigation nach Link-Klick schließen */
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeMobileMenu();
    });
  });
  /* ENDE: Navigation nach Link-Klick schließen */

  /* START: Escape-Taste */
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileMenu();

      dropdowns.forEach((dropdown) => {
        dropdown.classList.remove("is-open");
      });

      navToggle.focus();
    }
  });
  /* ENDE: Escape-Taste */
});

/* =========================================================
   ENDE: GLASS NAVIGATION – WINTERLING BAUDEKORATION
   ========================================================= */

/* =========================================================
   SECTION 09 BEGIN | Prozess-Scrollanimation
   ========================================================= */

(() => {
  const section = document.querySelector(".wb-process");
  if (!section) return;

  const grid = section.querySelector(".wb-process__grid");
  const steps = section.querySelectorAll(".wb-process-reveal");

  if (!grid || !steps.length) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  /* Ohne Animation bleiben alle Inhalte sichtbar. */

  if (reduceMotion || !("IntersectionObserver" in window)) {
    grid.classList.add("is-visible");
    steps.forEach((step) => step.classList.add("is-visible"));
    return;
  }

  section.classList.add("wb-motion-ready");

  const stepObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -35px 0px",
    },
  );

  steps.forEach((step) => stepObserver.observe(step));

  const lineObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        grid.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.1 },
  );

  lineObserver.observe(grid);
})();

/* =========================================================
   SECTION 09 END | Prozess-Scrollanimation
   ========================================================= */

/* =========================================================
   SECTION 10 BEGIN | Einsatzgebiet-Animation
   ========================================================= */

(() => {
  const section = document.querySelector(".wb-area");
  if (!section) return;

  const items = section.querySelectorAll(".wb-area-reveal");
  if (!items.length) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  section.classList.add("wb-motion-ready");

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -30px 0px",
    },
  );

  items.forEach((item) => observer.observe(item));
})();

/* =========================================================
   SECTION 10 END | Einsatzgebiet-Animation
   ========================================================= */

/* =========================================================
   START: SECTION 24C – LEISTUNGSKARTEN ANIMATION
   ========================================================= */

(() => {
  const initServiceTileAnimations = () => {
    const grids = document.querySelectorAll(".service-tiles--animated");

    if (!grids.length) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      grids.forEach((grid) => {
        grid.classList.remove("is-motion-ready");

        grid.querySelectorAll(".service-tile--animated").forEach((tile) => {
          tile.classList.add("is-visible");
        });
      });

      return;
    }

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -35px 0px",
      },
    );

    grids.forEach((grid) => {
      const tiles = grid.querySelectorAll(".service-tile--animated");

      if (!tiles.length) return;

      grid.classList.add("is-motion-ready");

      tiles.forEach((tile) => {
        observer.observe(tile);
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initServiceTileAnimations, {
      once: true,
    });
  } else {
    initServiceTileAnimations();
  }
})();

/* =========================================================
   ENDE: SECTION 24C – LEISTUNGSKARTEN ANIMATION
   ========================================================= */

/* =========================================================
   START: Verschlüsselte Team-E-Mail-Adressen
   Datei: js/main.js
   Funktion: E-Mail-Adressen aus HTML-Zeichenreferenzen
            zusammensetzen und als mailto-Link anzeigen
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  const emailElements = document.querySelectorAll(".wb-person-email");

  emailElements.forEach(function (element) {
    const user = element.dataset.emailUser;
    const domain = element.dataset.emailDomain;
    const tld = element.dataset.emailTld;

    const link = element.querySelector(".wb-person-email-link");
    const fallback = element.querySelector(".wb-person-email-fallback");

    if (!user || !domain || !tld || !link) {
      return;
    }

    const email = user + "@" + domain + "." + tld;

    link.href = "mailto:" + email;
    link.hidden = false;

    if (fallback) {
      fallback.hidden = true;
    }

    link.setAttribute("aria-label", "E-Mail an " + email + " schreiben");
  });
});

/* =========================================================
   ENDE: Verschlüsselte Team-E-Mail-Adressen
   ========================================================= */

/* =========================================================
   START: Verschleierte Team-E-Mail-Adressen
   Datei: js/main.js
   ========================================================= */

(() => {
  "use strict";

  // Zeichencodes der E-Mail-Adressen
  // Die vollständigen Adressen stehen nicht als Klartext hier.
  const contacts = {
    1: [
      100, 46, 119, 105, 110, 116, 101, 114, 108, 105, 110, 103, 64, 119, 105,
      110, 116, 101, 114, 108, 105, 110, 103, 45, 98, 97, 117, 100, 101, 107,
      111, 46, 100, 101,
    ],
    2: [
      97, 46, 119, 105, 110, 116, 101, 114, 108, 105, 110, 103, 64, 119, 105,
      110, 116, 101, 114, 108, 105, 110, 103, 45, 98, 97, 117, 100, 101, 107,
      111, 46, 100, 101,
    ],
    3: [
      106, 46, 98, 114, 117, 110, 115, 64, 119, 105, 110, 116, 101, 114, 108,
      105, 110, 103, 45, 98, 97, 117, 100, 101, 107, 111, 46, 100, 101,
    ],
    4: [
      106, 46, 107, 97, 98, 108, 97, 110, 111, 119, 64, 119, 105, 110, 116, 101,
      114, 108, 105, 110, 103, 45, 98, 97, 117, 100, 101, 107, 111, 46, 100,
      101,
    ],
    5: [
      112, 46, 100, 111, 115, 115, 97, 110, 116, 111, 115, 64, 119, 105, 110,
      116, 101, 114, 108, 105, 110, 103, 45, 98, 97, 117, 100, 101, 107, 111,
      46, 100, 101,
    ],
  };

  function decodeEmail(codes) {
    return String.fromCharCode(...codes);
  }

  function openEmail(contactId) {
    const codes = contacts[contactId];

    if (!codes) {
      return;
    }

    const email = decodeEmail(codes);

    // Adresse nicht als Text auf der Webseite anzeigen.
    // Der Klick öffnet den lokal eingerichteten E-Mail-Client.
    window.location.href = "mailto:" + email;
  }

  document.querySelectorAll(".wb-person-email").forEach((element) => {
    const button = element.querySelector(".wb-email-button");
    const contactId = Number(element.dataset.contact);

    if (!button || !contacts[contactId]) {
      return;
    }

    button.addEventListener("click", () => {
      openEmail(contactId);
    });
  });
})();

/* =========================================================
   ENDE: Verschleierte Team-E-Mail-Adressen
   ========================================================= */

/* =====================================================
   START: E-MAIL-VERSCHLEIERUNG WINTERLING
   Keine mailto-URL in der Statusleiste anzeigen
   ===================================================== */

const initProtectedEmails = (root = document) => {
  root.querySelectorAll(".protected-email").forEach((element) => {
    if (element.dataset.protectedReady) return;

    const user = element.dataset.user;
    const domain = element.dataset.domain;

    if (!user || !domain) return;
    element.dataset.protectedReady = "true";

    // Sichtbare Schreibweise beibehalten
    element.textContent = `${user}(at)${domain}`;
    element.style.cursor = "pointer";

    // Im Footer bestimmt das Footer-Design die Farbe; eigene Inline-Farben bleiben erhalten
    if (!element.closest(".site-footer") && !element.style.color) {
      element.style.color = "var(--orange, #d97200)";
      element.style.fontWeight = "600";
      element.style.textDecoration = "none";
    }

    // E-Mail-Programm erst beim Klick öffnen
    const openEmail = () => {
      const address = `${user}@${domain}`;
      window.location.href = `mailto:${address}`;
    };

    element.addEventListener("click", openEmail);

    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openEmail();
      }
    });
  });
};

initProtectedEmails();

// Nachgeladene Bereiche (Header/Footer-Partials, Formularmeldungen) ebenfalls schützen
new MutationObserver(() => initProtectedEmails()).observe(document.body, {
  childList: true,
  subtree: true,
});

/* =====================================================
   ENDE: E-MAIL-VERSCHLEIERUNG WINTERLING
   ===================================================== */
