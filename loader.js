// Branded loading curtain.
//
// The page is client-rendered by React (support.js), which async-loads React
// from a CDN before any content exists — so on a cold load the page is blank
// for a beat and then content pops in. This overlay covers that gap and the
// initial scroll-reveal so the page appears as one elegant fade instead.
//
// Loaded synchronously in <head> so the curtain paints during HTML parse,
// before the blank flash. scroll-reveal.js waits for the `ppr:loaded` event
// (see window.__pprLoader) so the hero animates in as the curtain lifts.
(function () {
  window.__pprLoader = true;

  // Self-heal transient image load failures (flaky network / host): when an
  // <img> errors, retry a couple of times with a cache-buster so it recovers
  // itself instead of leaving a blank. Capture phase — image errors don't
  // bubble — and registered now so it's listening before any image loads.
  document.addEventListener('error', function (e) {
    var img = e.target;
    if (!img || img.tagName !== 'IMG' || !img.src) return;
    var tries = +(img.getAttribute('data-retry') || 0);
    if (tries >= 2) return;
    img.setAttribute('data-retry', tries + 1);
    var base = img.src.split('#')[0].split('?')[0];
    setTimeout(function () {
      img.src = base + '?r=' + (tries + 1);
    }, 500 * (tries + 1));
  }, true);

  var MIN_MS = 400;   // keep the curtain up at least this long (no flicker)
  var FADE_MS = 550;  // fade-out duration
  var CAP_MS = 12000; // hard cap so we never trap the page behind the curtain
  var start = Date.now();

  var style = document.createElement('style');
  style.textContent =
    '#ppr-loader{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;' +
    'align-items:center;justify-content:center;gap:22px;background:#F0F2F6;' +
    'opacity:1;transition:opacity ' + FADE_MS + 'ms cubic-bezier(.22,1,.36,1)}' +
    '#ppr-loader.ppr-hide{opacity:0;pointer-events:none}' +
    '#ppr-loader img{height:34px;width:auto;animation:ppr-pulse 1.6s ease-in-out infinite}' +
    '#ppr-loader .ppr-bar{width:140px;height:2px;background:rgba(14,17,22,.12);' +
    'border-radius:2px;overflow:hidden}' +
    '#ppr-loader .ppr-bar span{display:block;height:100%;width:40%;background:#015AFF;' +
    'border-radius:2px;animation:ppr-slide 1.15s cubic-bezier(.4,0,.2,1) infinite}' +
    '@keyframes ppr-pulse{0%,100%{opacity:.5}50%{opacity:1}}' +
    '@keyframes ppr-slide{0%{transform:translateX(-130%)}100%{transform:translateX(370%)}}' +
    '@media (prefers-reduced-motion:reduce){' +
    '#ppr-loader{transition:none}#ppr-loader img,#ppr-loader .ppr-bar span{animation:none}}';
  document.head.appendChild(style);

  var el = document.createElement('div');
  el.id = 'ppr-loader';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML =
    '<img src="assets/ppr-mark.png" alt="">' +
    '<div class="ppr-bar"><span></span></div>';
  // <body> may not exist yet (we run during head parse); fall back to <html>.
  (document.body || document.documentElement).appendChild(el);

  function contentReady() {
    return document.querySelector('[data-sec], [data-split], [data-grid3], [data-srow], [data-cert-card]');
  }

  // Hold the curtain until the real fonts are loaded, so the text behind it is
  // already Archivo when it lifts — no fallback-to-webfont swap on screen.
  var fontsDone = false;
  function kickFonts() {
    if (!document.fonts || !document.fonts.load) { fontsDone = true; return; }
    Promise.all([
      document.fonts.load('400 1em Archivo'),
      document.fonts.load('700 1em Archivo'),
      document.fonts.load('600 1em "Archivo Narrow"')
    ]).then(function () { fontsDone = true; }, function () { fontsDone = true; });
  }
  var fontCss = document.querySelector('link[rel="stylesheet"][href*="fonts.googleapis.com"]');
  if (fontCss && !fontCss.sheet) {
    // Wait for the Google stylesheet so the @font-face rules exist before we
    // ask for the files (otherwise load() resolves against nothing too early).
    fontCss.addEventListener('load', kickFonts);
    fontCss.addEventListener('error', function () { fontsDone = true; });
    setTimeout(kickFonts, 1500); // safety: in case the load event already fired
  } else {
    kickFonts();
  }

  // Hold the curtain until critical images (declared as <link rel="preload"
  // as="image">, e.g. the hero) have finished downloading, so they don't pop
  // in after the curtain lifts on a slow connection.
  var imagesDone = false;
  (function awaitImages() {
    var links = document.querySelectorAll('link[rel="preload"][as="image"]');
    if (!links.length) { imagesDone = true; return; }
    var pending = links.length;
    var one = function () { if (--pending <= 0) imagesDone = true; };
    Array.prototype.forEach.call(links, function (l) {
      var img = new Image();
      img.onload = one;
      img.onerror = one;
      img.src = l.href;
      if (img.complete) one(); // already cached
    });
  })();

  function lift() {
    el.classList.add('ppr-hide');
    // Signal scroll-reveal to start so the hero animates as the curtain fades.
    document.dispatchEvent(new Event('ppr:loaded'));
    setTimeout(function () { el.remove(); }, FADE_MS + 60);
  }

  (function check() {
    var waited = Date.now() - start;
    if (contentReady() && fontsDone && imagesDone && waited >= MIN_MS) return lift();
    if (waited > CAP_MS) return lift(); // hard cap wins even if something stalls
    setTimeout(check, 50);
  })();
})();
