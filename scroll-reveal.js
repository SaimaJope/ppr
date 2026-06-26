(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function markRevealTargets() {
    document.querySelectorAll('[data-sec] > div').forEach((el) => {
      el.classList.add('reveal-soft');
    });

    document.querySelectorAll('[data-split] > *, header h1, header p, header .lbl').forEach((el) => {
      el.classList.add('reveal-up');
    });

    document.querySelectorAll('[data-grid3] > *, [data-srow], [data-cert-card]').forEach((el) => {
      el.classList.add('reveal-stagger');
    });
  }

  function initScrollReveal() {
    markRevealTargets();

    if (reduceMotion || typeof window.ScrollReveal !== 'function') {
      document.documentElement.classList.add('reveal-motion-off');
      return;
    }

    const sr = window.ScrollReveal({
      reset: false,
      cleanup: true,
      mobile: true,
      distance: '14px',
      duration: 620,
      delay: 0,
      opacity: 0,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      viewFactor: 0.12,
      viewOffset: { top: 0, right: 0, bottom: 40, left: 0 }
    });

    sr.reveal('.reveal-soft', {
      distance: '10px',
      duration: 600,
      origin: 'bottom'
    });

    sr.reveal('.reveal-up', {
      distance: '16px',
      duration: 620,
      origin: 'bottom',
      interval: 60
    });

    sr.reveal('.reveal-stagger', {
      distance: '14px',
      duration: 600,
      origin: 'bottom',
      interval: 80
    });
  }

  // The page is rendered by React (support.js) *after* it async-loads React
  // from a CDN, so the reveal targets don't exist at DOMContentLoaded. Wait
  // until the rendered content (and the ScrollReveal lib) is actually present
  // before binding — otherwise on a cold load we bind to nothing.
  function contentReady() {
    return document.querySelector('[data-sec], [data-split], [data-grid3], [data-srow], [data-cert-card]');
  }
  function libReady() {
    return reduceMotion || typeof window.ScrollReveal === 'function';
  }

  const startedAt = Date.now();
  (function whenReady() {
    if (contentReady() && libReady()) {
      window.requestAnimationFrame(initScrollReveal);
    } else if (Date.now() - startedAt > 8000) {
      // Give up waiting and reveal statically rather than hide content forever.
      window.requestAnimationFrame(initScrollReveal);
    } else {
      setTimeout(whenReady, 50);
    }
  })();
})();
