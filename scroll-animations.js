/* ============================================
   SCOTTY AI — Scroll Animation Engine
   ============================================ */
(function () {
  'use strict';

  // Signal that JS is active — CSS uses this to safely hide elements for animation
  // Without this, pages that don't load this script stay fully visible (blog pages)
  document.body.classList.add('js-animations');
  const progressBar = document.createElement('div');
  progressBar.id = 'scroll-progress';
  document.body.prepend(progressBar);

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (scrolled / total * 100) + '%';
  }, { passive: true });


  /* ─── 2. REGISTER REVEAL ELEMENTS ─── */
  // Returns true if motion is not restricted
  const motionOk = () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Items to observe and mark as .reveal
  const REVEAL_SELECTORS = [
    // Hero
    { sel: '.hero-text',    cls: 'from-left',  delay: 0 },
    { sel: '.hero-visual',  cls: 'from-right', delay: 0.1 },

    // Trust bar logos — staggered
    { sel: '.trust-logo-item', cls: '', stagger: true },

    // Feature cards — staggered
    { sel: '.feature-card', cls: 'from-scale', stagger: true },

    // Split hook sides
    { sel: '.blurred-side', cls: 'from-left',  delay: 0 },
    { sel: '.split-divider',cls: '',            delay: 0.15 },
    { sel: '.clear-side',   cls: 'from-right', delay: 0.3 },

    // Solutions z-sections
    { sel: '.z-section .z-image', cls: 'from-left',  delay: 0 },
    { sel: '.z-section .z-text',  cls: 'from-right', delay: 0.15 },
    { sel: '.z-section.reverse .z-image', cls: 'from-right', delay: 0 },
    { sel: '.z-section.reverse .z-text',  cls: 'from-left',  delay: 0.15 },

    // Security cards
    { sel: '.arch-card', cls: 'from-scale', stagger: true },
    { sel: '.endorsement', cls: '', delay: 0 },

    // Blog cards — staggered
    { sel: '.blog-card', cls: '', stagger: true },
    { sel: '.blog-featured', cls: 'from-left', delay: 0 },
    { sel: '.blog-sidebar',  cls: 'from-right', delay: 0.1 },

    // FAQ
    { sel: '.faq-category', cls: '', stagger: true },

    // Pricing
    { sel: '.pricing-card', cls: 'from-scale', stagger: true },

    // Section headlines
    { sel: '.section-headline', cls: '', delay: 0 },
    { sel: '.security-header',  cls: '', delay: 0 },
    { sel: '.split-intro',      cls: '', delay: 0 },
  ];

  if (!motionOk()) return; // Respect prefers-reduced-motion

  function prepareReveal() {
    REVEAL_SELECTORS.forEach(({ sel, cls, stagger, delay }) => {
      const els = document.querySelectorAll(sel);
      els.forEach((el, i) => {
        el.classList.add('reveal');
        if (cls) el.classList.add(cls);
        if (stagger) {
          const delayIdx = Math.min(i + 1, 6);
          el.classList.add('stagger-' + delayIdx);
        } else if (delay) {
          el.style.transitionDelay = delay + 's';
        }
      });
    });

    // Section headlines get special visible class tracking
    document.querySelectorAll('.section-headline').forEach(el => {
      el.classList.add('reveal');
    });
  }

  /* ─── 3. INTERSECTION OBSERVER ─── */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  function observeAll() {
    document.querySelectorAll('.reveal').forEach(el => {
      revealObserver.observe(el);
    });
  }


  /* ─── 4. ANIMATED COUNTERS ─── */
  function animateCounter(el) {
    const target   = parseFloat(el.dataset.count) || 0;
    const prefix   = el.dataset.prefix || '';
    const suffix   = el.dataset.suffix || '';
    const isFloat  = target % 1 !== 0;
    const duration = 1800; // ms
    const steps    = 60;
    const interval = duration / steps;
    let current    = 0;
    let step       = 0;

    const timer = setInterval(() => {
      step++;
      // Ease-out quadratic
      const progress = step / steps;
      const eased    = 1 - Math.pow(1 - progress, 3);
      current = target * eased;

      el.textContent = prefix + (isFloat ? current.toFixed(2) : Math.round(current)) + suffix;

      if (step >= steps) {
        clearInterval(timer);
        el.textContent = prefix + target + suffix;
      }
    }, interval);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  function initCounters() {
    document.querySelectorAll('[data-count]').forEach(el => {
      counterObserver.observe(el);
    });
  }


  /* ─── 5. SECTION ENTRY LINE (decorative) ─── */
  function injectEntryLines() {
    const sections = document.querySelectorAll(
      '.features, .solutions, .blog, .faq, .pricing, .hook-split'
    );
    sections.forEach(sec => {
      const line = document.createElement('span');
      line.className = 'section-entry-line reveal';
      // Insert before first child
      sec.querySelector('.container')?.prepend(line);
    });

    // Observe them
    const lineObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          lineObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.section-entry-line').forEach(l => lineObserver.observe(l));
  }


  /* ─── 6. HEADER PARALLAX TINT ON SCROLL ─── */
  const header = document.getElementById('site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
  }


  /* ─── 7. STAGGER BLOG CARDS ON GRID ─── */
  function staggerBlogGrid() {
    const grid = document.querySelector('.blog-grid');
    if (!grid) return;
    const cards = grid.querySelectorAll('.blog-card');
    cards.forEach((card, i) => {
      const delay = (i % 3) * 0.1;  // row-wise cascade
      card.style.transitionDelay = (card.style.transitionDelay ? parseFloat(card.style.transitionDelay) : 0) + delay + 's';
    });
  }


  /* ─── 8. INIT ─── */
  function init() {
    prepareReveal();
    observeAll();
    initCounters();
    injectEntryLines();
    staggerBlogGrid();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
