(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDesktopViewport = window.matchMedia('(min-width: 981px)').matches;
  const mobileRevealViewport = {
    viewFactor: 0,
    viewOffset: { top: 0, right: 0, bottom: -180, left: 0 }
  };
  const desktopRevealViewport = {
    viewFactor: 0,
    viewOffset: { top: 0, right: 0, bottom: -280, left: 0 }
  };

  const revealViewport = isDesktopViewport ? desktopRevealViewport : mobileRevealViewport;

  function markRevealTargets() {
    const root = document.getElementById('dc-root');
    if (!root) return;
    root.querySelectorAll('[data-sec] > div').forEach((el) => {
      el.classList.add('reveal-soft');
    });

    root.querySelectorAll('[data-split] > *, header h1, header p, header .lbl').forEach((el) => {
      el.classList.add('reveal-up');
    });

    root.querySelectorAll('[data-grid3]:not([data-cert-grid]) > *, [data-srow]').forEach((el) => {
      el.classList.add('reveal-stagger');
    });

    // Reveal the horizontal certificate strip together so offscreen logos
    // are already visible when visitors swipe them into view on mobile.
    root.querySelectorAll('[data-cert-grid]').forEach((el) => {
      el.classList.add('reveal-soft');
    });

    // Reveal each piece once; a hidden parent otherwise delays its children too.
    root.querySelectorAll('.reveal-soft').forEach((el) => {
      if (el.querySelector('.reveal-up, .reveal-stagger')) {
        el.classList.remove('reveal-soft');
      }
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
      duration: 360,
      delay: 0,
      opacity: 0,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      viewFactor: revealViewport.viewFactor,
      viewOffset: revealViewport.viewOffset
    });

    sr.reveal('.reveal-soft', {
      distance: '10px',
      duration: 360,
      origin: 'bottom'
    });

    sr.reveal('.reveal-up', {
      distance: '16px',
      duration: 360,
      origin: 'bottom',
      interval: 0
    });

    sr.reveal('.reveal-stagger', {
      distance: '14px',
      duration: 360,
      origin: 'bottom',
      interval: 0
    });
  }

  // The page is rendered by React (support.js) *after* it async-loads React
  // from a CDN, so the reveal targets don't exist at DOMContentLoaded.
  function contentReady() {
    return document.querySelector('#dc-root [data-sec], #dc-root [data-split], #dc-root [data-grid3], #dc-root [data-srow], #dc-root [data-cert-card]');
  }
  function libReady() {
    return reduceMotion || typeof window.ScrollReveal === 'function';
  }

  function start() {
    window.requestAnimationFrame(initScrollReveal);
  }

  if (window.__pprLoader) {
    // Set up while the loader is still opaque, before the first visible scroll.
    // If this script/CDN arrives after the curtain, keep already visible content
    // visible instead of hiding it again to start a late animation.
    let fired = false;
    const prepare = function () {
      if (fired) return;
      fired = true;
      initScrollReveal();
    };
    const fallback = function () {
      if (fired) return;
      fired = true;
      document.documentElement.classList.add('reveal-motion-off');
    };
    if (window.__pprLoaded) {
      fallback();
    } else {
      document.addEventListener('ppr:prepare', prepare, { once: true });
      document.addEventListener('ppr:loaded', fallback, { once: true });
      setTimeout(fallback, 12100);
    }
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
