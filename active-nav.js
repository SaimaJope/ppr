(function () {
  const ACTIVE_CLASS = 'ppr-nav-active';
  const DESKTOP_CLASS = 'ppr-nav-active-desktop';
  const MENU_CLASS = 'ppr-nav-active-menu';
  const PAGE_FILES = new Set([
    'etusivu.dc.html',
    'palvelut.dc.html',
    'yhteystiedot.dc.html',
    'yritys.dc.html',
    'ura.dc.html',
    'referenssit.dc.html'
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
      '.ppr-nav-active-desktop[aria-label="Etusivu"]::after{left:50%;right:auto;width:20px;transform:translateX(-50%)}',
      '.ppr-nav-active-menu{background:rgba(1,90,255,.06);box-shadow:inset 3px 0 0 #015AFF}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function fileNameFromPath(pathname) {
    const file = decodeURIComponent((pathname || '').split('/').filter(Boolean).pop() || '');
    return (file || 'Etusivu.dc.html').toLowerCase();
  }

  function pageFileFromHref(href) {
    try {
      return fileNameFromPath(new URL(href, window.location.href).pathname);
    } catch {
      return '';
    }
  }

  function currentPageFile() {
    const file = fileNameFromPath(window.location.pathname);
    return file === 'index.html' ? 'etusivu.dc.html' : file;
  }

  function clearActive(link) {
    link.classList.remove(ACTIVE_CLASS, DESKTOP_CLASS, MENU_CLASS);
    if (link.getAttribute('aria-current') === 'page') {
      link.removeAttribute('aria-current');
    }
  }

  function syncActiveNav() {
    const nav = document.querySelector('nav');
    if (!nav) return false;

    const current = currentPageFile();
    nav.querySelectorAll('a[href]').forEach((link) => {
      clearActive(link);

      const isDesktopLink = Boolean(link.closest('[data-navlinks]'));
      const isMenuLink = !isDesktopLink && !link.closest('[data-nav-inner]');
      if (!isDesktopLink && !isMenuLink) return;

      const target = pageFileFromHref(link.getAttribute('href'));
      if (!PAGE_FILES.has(target) || target !== current) return;

      link.classList.add(ACTIVE_CLASS);
      link.classList.add(isDesktopLink ? DESKTOP_CLASS : MENU_CLASS);
      link.setAttribute('aria-current', 'page');
    });

    return true;
  }

  function start() {
    ensureStyles();

    const startedAt = Date.now();
    (function whenNavReady() {
      if (syncActiveNav()) return;
      if (Date.now() - startedAt < 8000) setTimeout(whenNavReady, 50);
    })();

    const observer = new MutationObserver(syncActiveNav);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('ppr:loaded', syncActiveNav);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
