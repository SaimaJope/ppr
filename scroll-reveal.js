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
  // from a CDN, so the reveal targets don't exist at DOMContentLoaded.
  function contentReady() {
    return document.querySelector('[data-sec], [data-split], [data-grid3], [data-srow], [data-cert-card]');
  }
  function libReady() {
    return reduceMotion || typeof window.ScrollReveal === 'function';
  }

  function start() {
    window.requestAnimationFrame(initScrollReveal);
  }

  if (window.__pprLoader) {
    // loader.js owns the cold-load curtain and detects when content is ready.
    // Bind the reveal as it lifts so the hero animates in with the fade,
    // instead of playing hidden behind the curtain or flashing then re-animating.
    let fired = false;
    const go = function () {
      if (fired) return;
      fired = true;
      start();
    };
    document.addEventListener('ppr:loaded', go, { once: true });
    setTimeout(go, 12000); // fallback if the curtain never lifts
  } else {
    // No loader present — wait for the rendered content (and the lib) ourselves.
    const startedAt = Date.now();
    (function whenReady() {
      if ((contentReady() && libReady()) || Date.now() - startedAt > 8000) {
        start();
      } else {
        setTimeout(whenReady, 50);
      }
    })();
  }
})();
