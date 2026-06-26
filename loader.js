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

  function lift() {
    el.classList.add('ppr-hide');
    // Signal scroll-reveal to start so the hero animates as the curtain fades.
    document.dispatchEvent(new Event('ppr:loaded'));
    setTimeout(function () { el.remove(); }, FADE_MS + 60);
  }

  (function check() {
    var waited = Date.now() - start;
    if (contentReady() && waited >= MIN_MS) return lift();
    if (waited > CAP_MS) return lift();
    setTimeout(check, 50);
  })();
})();
