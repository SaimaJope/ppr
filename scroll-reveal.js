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

    document.querySelectorAll('[data-sec]:nth-of-type(even) > div').forEach((el) => {
      el.classList.add('reveal-invert');
    });
  }

  function initScrollReveal() {
    markRevealTargets();

    if (reduceMotion || typeof window.ScrollReveal !== 'function') {
      document.documentElement.classList.add('reveal-motion-off');
      return;
    }

    const sr = window.ScrollReveal({
      reset: true,
      cleanup: false,
      mobile: true,
      distance: '7px',
      duration: 560,
      delay: 0,
      opacity: 0.94,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      viewFactor: 0.16,
      viewOffset: { top: 72, right: 0, bottom: 42, left: 0 }
    });

    sr.reveal('.reveal-soft', {
      reset: true,
      distance: '6px',
      opacity: 0.95,
      duration: 540,
      origin: 'bottom'
    });

    sr.reveal('.reveal-up', {
      reset: true,
      distance: '8px',
      opacity: 0.94,
      duration: 600,
      origin: 'bottom',
      interval: 40
    });

    sr.reveal('.reveal-stagger', {
      reset: true,
      distance: '9px',
      opacity: 0.93,
      duration: 580,
      origin: 'bottom',
      interval: 45
    });

    sr.reveal('.reveal-invert', {
      reset: true,
      distance: '7px',
      opacity: 0.95,
      duration: 540,
      origin: 'top'
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.requestAnimationFrame(initScrollReveal));
  } else {
    window.requestAnimationFrame(initScrollReveal);
  }
})();
