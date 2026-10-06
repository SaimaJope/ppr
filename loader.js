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

  // ---- Site content ---------------------------------------------------------
  // Editable content lives in content/{fi,sv,en}.json; the page logic
  // classes (script[data-dc-script]) render from it and hold their template
  // behind `ready` until it has arrived, which keeps the curtain below covering
  // the load. The fetch starts here — this file is loaded synchronously in
  // <head> — so the JSON races the React CDN load instead of waiting for it.
  // Cache is busted both ways (query param + no-store): GitHub Pages caches
  // aggressively and an edit must be visible on the very next load.
  window.__pprContent = (function load(attempt) {
    if (window.__pprPreviewContent) return Promise.resolve(window.pprLocalizeContent(window.__pprPreviewContent)).then(function (content) { window.pprSetPageMetadata(content); return content; });
    return fetch('content/' + window.pprLanguage + '.json?v=' + Date.now(), { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (content) { window.pprSetPageMetadata(content); return window.pprLocalizeContent(content); })
      .catch(function (err) {
        if (attempt < 2) {
          return new Promise(function (resolve) {
            setTimeout(resolve, 400 * (attempt + 1));
          }).then(function () { return load(attempt + 1); });
        }
        console.error('[ppr] content load failed:', err);
        document.addEventListener('ppr:loaded', function () {
          var message = document.createElement('div');
          message.style.cssText = 'padding:48px;font:18px sans-serif';
          message.textContent = window.pprUi.error + ' ';
          var retry = document.createElement('a');
          retry.href = location.href;
          retry.textContent = window.pprUi.retry;
          message.appendChild(retry);
          document.body.appendChild(message);
        }, { once: true });
        return null;
      });
  })(0);

  // Helpers for the page logic classes.
  // Display number -> tel: href, e.g. "(019) 663 0666" -> "tel:+358196630666".
  window.pprTel = function (phone) {
    var digits = String(phone || '').replace(/\D/g, '');
    if (digits.indexOf('358') === 0) return 'tel:+' + digits;
    if (digits.charAt(0) === '0') return 'tel:+358' + digits.slice(1);
    return 'tel:' + digits;
  };
  // Paragraph stacks end with a different bottom margin than the paragraphs
  // above them, so map plain strings to {text, style} rows for sc-for.
  window.pprParas = function (texts, style, lastStyle) {
    var arr = Array.isArray(texts) ? texts : [];
    return arr.map(function (text, i) {
      return { text: text, style: i === arr.length - 1 ? lastStyle : style };
    });
  };
  // Photo lists -> stacked slide <img> descriptors for the slideshow engine
  // below. One image renders static; two or more crossfade.
  window.pprSlides = function (images, objectPosition, captions) {
    var arr = Array.isArray(images) ? images.filter(Boolean) : [];
    var base =
      'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;' +
      'object-position:' + (objectPosition || 'center') + ';' +
      'transition:opacity 1.2s ease;';
    return arr.map(function (src, i) {
      return { i: i, src: src, caption: (captions && captions[src]) || '', hidden: i === 0 ? 'false' : 'true', style: base + (i === 0 ? 'opacity:1' : 'opacity:0') };
    });
  };

  // The render values every page shares (header, footer, contact, billing).
  window.pprCommonVals = function (content) {
    var common = content.common || {};
    var contact = common.contact || {};
    var office = contact.office || {};
    var depot = contact.depot || {};
    var interval = common.slideshow && Number(common.slideshow.intervalSeconds);
    return {
      company: common.company,
      language: window.pprLanguage,
      languages: window.pprLanguageOptions,
      pageLinks: window.pprPageLinks,
      ui: window.pprUi,
      nav: common.nav,
      office: office,
      depot: depot,
      billing: common.billing,
      footer: common.footer,
      telOffice: window.pprTel(office.phone),
      telDepot: window.pprTel(depot.phone),
      mailtoOffice: 'mailto:' + (office.email || ''),
      topbarVisible: !(common.topbar && common.topbar.visible === false),
      slideshowInterval: Math.min(60, Math.max(2, interval || 7))
    };
  };

  // ---- Slideshow engine -----------------------------------------------------
  // Drives the stacked <img data-slide> children of every [data-slideshow]
  // container: automatic crossfade plus frosted-glass prev/next arrows for
  // manual browsing. Runs outside React on purpose: a re-render (e.g. the
  // mobile menu opening) resets inline opacities and can drop the arrows, and
  // the periodic reassert below simply puts them back. Containers appear only
  // after content renders, so keep scanning for a while and after the curtain
  // lifts. Reduced motion disables the auto-rotation but keeps the arrows.
  (function () {
    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var inited = new WeakSet();

    var CHEVRON_PREV =
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" ' +
      'stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M15 18l-6-6 6-6"></path></svg>';
    var CHEVRON_NEXT =
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" ' +
      'stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M9 18l6-6-6-6"></path></svg>';

    function ensureStyles() {
      if (document.getElementById('ppr-slide-style')) return;
      var s = document.createElement('style');
      s.id = 'ppr-slide-style';
      s.textContent =
        // Desktop arrows appear on hover; mobile controls stay visible.
        '.ppr-slide-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:6;' +
        'width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.4);' +
        'display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer;' +
        'color:#fff;background:rgba(255,255,255,.18);' +
        'backdrop-filter:blur(12px) saturate(160%);-webkit-backdrop-filter:blur(12px) saturate(160%);' +
        'box-shadow:0 6px 20px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.45);' +
        'opacity:0;pointer-events:none;' +
        'transition:opacity .25s ease,background .18s ease,transform .18s ease;' +
        '-webkit-tap-highlight-color:transparent}' +
        '@media (hover:hover){' +
        '.ppr-slide-host:hover>.ppr-slide-arrow,.ppr-slide-arrow:focus-visible{opacity:1;pointer-events:auto}' +
        '}' +
        '.ppr-slide-hint{display:none;position:absolute;top:12px;left:50%;transform:translateX(-50%);' +
        'z-index:6;align-items:center;gap:8px;padding:7px 12px;border-radius:20px;' +
        'color:#fff;background:rgba(14,17,22,.78);font-size:12px;line-height:1.4;' +
        'white-space:nowrap;pointer-events:none}' +
        '@media (hover:none),(pointer:coarse),(max-width:760px){' +
        '.ppr-slide-host>.ppr-slide-arrow{display:flex;opacity:1;pointer-events:auto;' +
        'width:44px;height:44px;background:rgba(14,17,22,.72)}' +
        '.ppr-slide-hint{display:flex}}' +
        '.ppr-slide-arrow:hover{background:rgba(255,255,255,.34)}' +
        '.ppr-slide-arrow:active{transform:translateY(-50%) scale(.94)}' +
        '.ppr-slide-arrow:focus{outline:none}' +
        '.ppr-slide-arrow:focus-visible{outline:2px solid #fff;outline-offset:2px}' +
        '.ppr-slide-arrow svg{display:block}' +
        '.ppr-photo-host{cursor:zoom-in}' +
        '.ppr-photo-host>.ppr-slide-hint{display:none}' +
        '.ppr-photo-open{position:absolute;top:12px;right:12px;z-index:7;display:inline-flex;align-items:center;gap:8px;' +
        'min-height:44px;padding:10px 15px;border:1px solid rgba(255,255,255,.5);border-radius:24px;' +
        'font:500 13px/1.3 Archivo,system-ui,sans-serif;color:#fff;background:rgba(14,17,22,.85);cursor:zoom-in;' +
        'opacity:0;pointer-events:none;transition:opacity .2s ease}' +
        '@media(hover:hover){.ppr-photo-host:hover>.ppr-photo-open{opacity:1;pointer-events:auto}}' +
        '.ppr-photo-open:focus-visible{opacity:1;pointer-events:auto}' +
        '.ppr-photo-open:hover{background:#015AFF}' +
        '.ppr-photo-open:focus-visible{outline:2px solid #fff;outline-offset:3px}' +
        '.ppr-photo-dialog{position:fixed;inset:0;width:100%;height:100%;max-width:none;max-height:none;' +
        'margin:0;border:0;padding:20px;box-sizing:border-box;color:#fff;background:#0E1116;font:16px/1.5 Archivo,system-ui,sans-serif}' +
        '.ppr-photo-dialog[open]{display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:12px}' +
        '.ppr-photo-dialog::backdrop{background:rgba(0,0,0,.9)}' +
        '.ppr-photo-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px}' +
        '.ppr-photo-dialog button{display:inline-flex;align-items:center;justify-content:center;gap:8px;flex-shrink:0;' +
        'min-width:44px;min-height:44px;padding:8px 12px;border:1px solid #65718A;border-radius:6px;' +
        'font:inherit;color:#fff;background:#202733;cursor:pointer}' +
        '.ppr-photo-dialog button:hover{background:#015AFF}' +
        '.ppr-photo-dialog button:focus-visible{outline:2px solid #8AB5FF;outline-offset:3px}' +
        '.ppr-photo-dialog button[hidden]{display:none}' +
        '.ppr-photo-dialog figure{min-width:0;min-height:0;margin:0;display:flex;align-items:center;justify-content:center;cursor:zoom-out}' +
        '.ppr-photo-dialog img{display:block;width:auto;height:auto;max-width:100%;max-height:100%;object-fit:contain;cursor:default}' +
        '.ppr-photo-footer{display:flex;align-items:center;justify-content:center;gap:16px}' +
        '.ppr-photo-caption{flex:1;min-width:0;max-width:900px;margin:0;text-align:center;font-size:14px;overflow-wrap:anywhere}' +
        '@media(max-width:600px){.ppr-photo-dialog{padding:12px;gap:8px}.ppr-photo-footer{gap:10px}}' +
        '.ppr-slide-prev{left:12px}.ppr-slide-next{right:12px}' +
        '[data-hero-scene]>.ppr-slide-prev{left:22px;width:48px;height:48px}' +
        '[data-hero-scene]>.ppr-slide-next{right:22px;width:48px;height:48px}';
      document.head.appendChild(s);
    }

    function slidesOf(el) {
      return el.querySelectorAll('[data-slide]');
    }

    function openPhoto(el, index, onClose) {
      var photos = Array.prototype.map.call(slidesOf(el), function (slide) {
        var img = slide.tagName === 'IMG' ? slide : slide.querySelector('img:not([aria-hidden="true"])');
        return { src: img.currentSrc || img.src, caption: img.alt || '' };
      });
      var dialog = document.createElement('dialog');
      dialog.className = 'ppr-photo-dialog';
      dialog.setAttribute('aria-label', window.pprUi.viewPhoto);
      dialog.innerHTML = '<div class="ppr-photo-toolbar"><span></span><button type="button" autofocus></button></div>' +
        '<figure><img decoding="async"></figure>' +
        '<div class="ppr-photo-footer"><button type="button"></button><p class="ppr-photo-caption" aria-live="polite"></p><button type="button"></button></div>';
      var count = dialog.querySelector('.ppr-photo-toolbar span');
      var close = dialog.querySelector('.ppr-photo-toolbar button');
      var photo = dialog.querySelector('img');
      var stage = dialog.querySelector('figure');
      var caption = dialog.querySelector('.ppr-photo-caption');
      var buttons = dialog.querySelectorAll('.ppr-photo-footer button');
      close.textContent = window.pprUi.closePhoto + ' ×';
      buttons[0].innerHTML = CHEVRON_PREV;
      buttons[1].innerHTML = CHEVRON_NEXT;
      buttons[0].setAttribute('aria-label', window.pprUi.prev);
      buttons[1].setAttribute('aria-label', window.pprUi.next);
      buttons[0].hidden = buttons[1].hidden = photos.length < 2;
      function show(delta) {
        index = (index + delta + photos.length) % photos.length;
        photo.src = photos[index].src;
        photo.alt = photos[index].caption;
        caption.textContent = photos[index].caption;
        count.textContent = (index + 1) + ' / ' + photos.length;
      }
      close.addEventListener('click', function () { dialog.close(); });
      dialog.addEventListener('click', function (e) {
        if (e.target === dialog || e.target === stage ||
            e.target.matches('.ppr-photo-toolbar,.ppr-photo-footer')) dialog.close();
      });
      buttons[0].addEventListener('click', function () { show(-1); });
      buttons[1].addEventListener('click', function () { show(1); });
      dialog.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          show(e.key === 'ArrowLeft' ? -1 : 1);
        }
      });
      var previousOverflow = document.documentElement.style.overflow;
      dialog.addEventListener('close', function () {
        document.documentElement.style.overflow = previousOverflow;
        dialog.remove();
        onClose(index);
        var opener = el.querySelector('.ppr-photo-open');
        if (opener) opener.focus({ preventScroll: true });
      }, { once: true });
      document.body.appendChild(dialog);
      show(0);
      dialog.showModal();
      document.documentElement.style.overflow = 'hidden';
    }

    function initContainer(el) {
      if (inited.has(el)) return;
      var imgs = slidesOf(el);
      if (!imgs.length) return;
      inited.add(el);
      ensureStyles();

      var seconds = Math.min(60, Math.max(2, Number(el.getAttribute('data-slideshow-interval')) || 7));
      var state = { idx: 0, timer: null, viewerOpen: false, inView: !window.IntersectionObserver };

      // The hero's decorative gradient overlays sit above the slideshow, so
      // its arrows live on the scene element (last children paint on top).
      var host = el.closest('[data-hero-scene]') || el;
      var canEnlarge = host === el;

      function apply() {
        var list = slidesOf(el);
        for (var i = 0; i < list.length; i++) {
          var opacity = i === state.idx ? '1' : '0';
          var hidden = i === state.idx ? 'false' : 'true';
          var pointer = i === state.idx ? 'auto' : 'none';
          if (list[i].style.opacity !== opacity) list[i].style.opacity = opacity;
          if (list[i].getAttribute('aria-hidden') !== hidden) list[i].setAttribute('aria-hidden', hidden);
          if (list[i].style.pointerEvents !== pointer) list[i].style.pointerEvents = pointer;
        }
        var hint = host.querySelector('.ppr-slide-hint');
        var label = '↔ ' + window.pprUi.swipe + ' · ' + (state.idx + 1) + ' / ' + list.length;
        if (hint && hint.textContent !== label) hint.textContent = label;
      }
      function step(delta) {
        var n = slidesOf(el).length;
        if (!n) return;
        state.idx = (state.idx + delta + n) % n;
        apply();
      }
      function restartAuto() {
        if (state.timer) clearInterval(state.timer);
        state.timer = null;
        if (reduceMotion || document.hidden || !state.inView || state.viewerOpen || !el.isConnected || slidesOf(el).length < 2) return;
        state.timer = setInterval(function () {
          if (el.isConnected && !state.viewerOpen) step(1);
        }, seconds * 1000);
      }
      function makeArrow(delta) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'ppr-slide-arrow ' + (delta < 0 ? 'ppr-slide-prev' : 'ppr-slide-next');
        b.setAttribute('aria-label', delta < 0 ? window.pprUi.prev : window.pprUi.next);
        b.innerHTML = delta < 0 ? CHEVRON_PREV : CHEVRON_NEXT;
        b.addEventListener('click', function (e) {
          // Reference cards are links; the arrow must not navigate.
          e.preventDefault();
          e.stopPropagation();
          step(delta);
          restartAuto();
        });
        return b;
      }
      function ensureArrows() {
        if (!host.classList.contains('ppr-slide-host')) host.classList.add('ppr-slide-host');
        if (canEnlarge && !host.querySelector('.ppr-photo-open')) {
          host.classList.add('ppr-photo-host');
          var open = document.createElement('button');
          open.type = 'button';
          open.className = 'ppr-photo-open';
          open.setAttribute('aria-haspopup', 'dialog');
          open.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5M3 3l6 6m12-6-6 6M3 21l6-6m12 6-6-6"/></svg>';
          open.appendChild(document.createTextNode(window.pprUi.viewPhoto));
          open.addEventListener('click', enlarge);
          host.appendChild(open);
        }
        if (slidesOf(el).length < 2) return;
        if (!host.querySelector('.ppr-slide-prev')) {
          host.appendChild(makeArrow(-1));
          host.appendChild(makeArrow(1));
        }
        if (!host.querySelector('.ppr-slide-hint')) {
          var hint = document.createElement('div');
          hint.className = 'ppr-slide-hint';
          host.appendChild(hint);
        }
      }

      function enlarge(e) {
        e.preventDefault();
        e.stopPropagation();
        if (state.viewerOpen) return;
        state.viewerOpen = true;
        restartAuto();
        openPhoto(el, state.idx, function (index) {
          state.idx = index;
          state.viewerOpen = false;
          apply();
          restartAuto();
        });
      }
      if (canEnlarge) host.addEventListener('click', function (e) {
        if (e.target.closest('img')) enlarge(e);
      });

      // Touch devices browse by swiping the photo area. Passive listeners:
      // vertical page scrolling is untouched, and a real swipe suppresses the
      // click so reference-card links do not navigate.
      var touchX = 0, touchY = 0, touching = false, suppressClickUntil = 0;
      host.addEventListener('touchstart', function (e) {
        touching = e.touches.length === 1 && !e.target.closest('button');
        var t = e.touches[0];
        if (t) { touchX = t.clientX; touchY = t.clientY; }
      }, { passive: true });
      host.addEventListener('touchcancel', function () { touching = false; }, { passive: true });
      host.addEventListener('touchend', function (e) {
        if (!touching) return;
        touching = false;
        var t = e.changedTouches[0];
        if (!t) return;
        var dx = t.clientX - touchX;
        var dy = t.clientY - touchY;
        if (Math.abs(dx) > 45 && Math.abs(dx) > 1.6 * Math.abs(dy)) {
          suppressClickUntil = Date.now() + 500;
          step(dx < 0 ? 1 : -1);
          restartAuto();
        }
      }, { passive: true });
      host.addEventListener('click', function (e) {
        if (Date.now() < suppressClickUntil) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);

      ensureArrows();
      apply();
      // Offscreen photos need no compositing work. Resume with a full interval
      // when the photo becomes visible, without changing manual navigation.
      var visibilityObserver = window.IntersectionObserver && new IntersectionObserver(function (entries) {
        state.inView = entries[0].isIntersecting;
        restartAuto();
      });
      if (visibilityObserver) visibilityObserver.observe(el);
      document.addEventListener('visibilitychange', restartAuto);
      restartAuto();
      // Repair React re-renders (they reset opacities / drop arrows), but leave
      // unchanged DOM alone so idle slideshows do not trigger style work.
      var repairTimer = setInterval(function () {
        if (!el.isConnected) {
          clearInterval(repairTimer);
          clearInterval(state.timer);
          if (visibilityObserver) visibilityObserver.disconnect();
          document.removeEventListener('visibilitychange', restartAuto);
          return;
        }
        if (document.hidden) return;
        ensureArrows();
        apply();
      }, 1000);
    }

    function scan() {
      var els = document.querySelectorAll('#dc-root [data-slideshow]');
      for (var i = 0; i < els.length; i++) initContainer(els[i]);
    }
    var started = Date.now();
    (function poll() {
      scan();
      if (Date.now() - started < 30000) setTimeout(poll, 1000);
    })();
    document.addEventListener('ppr:prepare', scan);
    document.addEventListener('ppr:loaded', scan);
  })();

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
    // The raw x-dc template contains the same selectors before React mounts.
    return document.querySelector('#dc-root [data-sec], #dc-root [data-split], #dc-root [data-grid3], #dc-root [data-srow], #dc-root [data-cert-card]');
  }

  // If the hero renders a content-driven slideshow, hold the curtain until its
  // first photo has finished loading (it is the LCP; without this a changed
  // hero image would pop in after the curtain lifts).
  function heroImageReady() {
    var img = document.querySelector('#dc-root [data-hero-scene] [data-slideshow] img[data-slide="0"]');
    if (!img) return true;
    return img.complete;
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
    // Prepare controls and reveal styles while the curtain still covers layout.
    document.dispatchEvent(new Event('ppr:prepare'));
    var lifted = false;
    function reveal() {
      if (lifted) return;
      lifted = true;
      window.__pprLoaded = true;
      el.classList.add('ppr-hide');
      document.dispatchEvent(new Event('ppr:loaded'));
      setTimeout(function () { el.remove(); }, FADE_MS + 60);
    }
    requestAnimationFrame(function () { requestAnimationFrame(reveal); });
    setTimeout(reveal, 100); // Also release in background tabs with paused frames.
  }

  (function check() {
    var waited = Date.now() - start;
    if (contentReady() && heroImageReady() && fontsDone && imagesDone && waited >= MIN_MS) return lift();
    if (waited > CAP_MS) return lift(); // hard cap wins even if something stalls
    setTimeout(check, 50);
  })();
})();
