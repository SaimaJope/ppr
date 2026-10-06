(function () {
  const ACTIVE_CLASS = 'ppr-nav-active';
  const DESKTOP_CLASS = 'ppr-nav-active-desktop';
  const MENU_CLASS = 'ppr-nav-active-menu';
  const PAGE_FILES = new Set([
    'etusivu',
    'palvelut',
    'yhteystiedot',
    'yritys',
    'referenssit'
  ]);

  function ensureStyles() {
    if (document.getElementById('ppr-active-nav-style')) return;

    const style = document.createElement('style');
    style.id = 'ppr-active-nav-style';
    style.textContent = [
      'nav [data-navlinks] a{transition:color .16s ease}',
      'nav [data-navlinks] a:hover{color:#015AFF!important}',
      '.ppr-nav-active{color:#015AFF!important;font-weight:700!important}',
      '.ppr-nav-active-desktop{position:relative}',
      '.ppr-nav-active-desktop::after{content:"";position:absolute;left:0;right:0;bottom:-9px;height:2px;background:#015AFF;border-radius:999px;opacity:.95}',
      '.ppr-nav-active-desktop[data-home-link]::after{left:50%;right:auto;width:20px;transform:translateX(-50%)}',
      '.ppr-nav-active-menu{background:rgba(1,90,255,.06);box-shadow:inset 3px 0 0 #015AFF}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function fileNameFromPath(pathname) {
    return window.pprPageFromPath(pathname || '');
  }

  function pageFileFromHref(href) {
    try {
      const url = new URL(href, document.baseURI);
      if (url.origin !== new URL(document.baseURI).origin) return '';
      return fileNameFromPath(url.pathname);
    } catch {
      return '';
    }
  }

  function currentPageFile() {
    return window.pprPage || fileNameFromPath(window.location.pathname);
  }

  function renderedNav() {
    return Array.from(document.querySelectorAll('nav'))
      .find((nav) => !nav.closest('x-dc')) || null;
  }

  function setClass(link, className, active) {
    if (link.classList.contains(className) !== active) {
      link.classList.toggle(className, active);
    }
  }

  function syncActiveNav(nav = renderedNav()) {
    if (!nav) return false;

    const current = currentPageFile();
    nav.querySelectorAll('a[href]').forEach((link) => {
      const isDesktopLink = Boolean(link.closest('[data-navlinks]'));
      const isMenuLink = !isDesktopLink && !link.closest('[data-nav-inner]');
      const target = pageFileFromHref(link.getAttribute('href'));
      const active = (isDesktopLink || isMenuLink) &&
        PAGE_FILES.has(target) && target === current;

      setClass(link, ACTIVE_CLASS, active);
      setClass(link, DESKTOP_CLASS, active && isDesktopLink);
      setClass(link, MENU_CLASS, active && isMenuLink);
      if (active && link.getAttribute('aria-current') !== 'page') {
        link.setAttribute('aria-current', 'page');
      } else if (!active && link.getAttribute('aria-current') === 'page') {
        link.removeAttribute('aria-current');
      }
    });

    return true;
  }

  function start() {
    ensureStyles();

    let watchedNav = null;
    const observer = new MutationObserver((mutations) => {
      const nav = renderedNav();
      if (nav !== watchedNav) {
        watchNav(nav);
        syncActiveNav(nav);
      } else if (nav && mutations.some((mutation) => nav.contains(mutation.target))) {
        syncActiveNav(nav);
      }
    });

    function watchNav(nav) {
      observer.disconnect();
      watchedNav = nav;
      if (!nav) {
        // React replaces the hidden source template before mounting the nav.
        observer.observe(document.body, { childList: true, subtree: true });
        return;
      }
      observer.observe(nav, { childList: true, subtree: true });
      // Direct child lists catch nav/root replacement without observing photo
      // captions, slideshow controls or other unrelated section descendants.
      for (let parent = nav.parentElement; parent; parent = parent.parentElement) {
        observer.observe(parent, { childList: true });
      }
    }

    function syncAndWatchNav() {
      const nav = renderedNav();
      if (nav !== watchedNav) watchNav(nav);
      return syncActiveNav(nav);
    }

    watchNav(renderedNav());
    const startedAt = Date.now();
    (function whenNavReady() {
      if (syncAndWatchNav()) return;
      if (Date.now() - startedAt < 8000) setTimeout(whenNavReady, 50);
    })();

    document.addEventListener('ppr:loaded', syncAndWatchNav);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
