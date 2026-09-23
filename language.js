// Shared locale routing. Explicit URLs take priority over a remembered choice.
(function () {
  var supported = ['fi', 'sv', 'en'];
  var query = new URLSearchParams(location.search);
  var saved;
  try { saved = localStorage.getItem('ppr-language'); } catch (_) {}
  var requested = window.__pprPreviewLanguage || (query.has('lang') ? query.get('lang') : saved);
  var language = supported.indexOf(requested) >= 0 ? requested : 'fi';
  window.pprLanguage = language;
  document.documentElement.lang = language;
  if (!window.__pprPreviewLanguage) {
    try { localStorage.setItem('ppr-language', language); } catch (_) {}
  }
  var labels = {
    fi: { language: 'Valitse kieli', menu: 'Valikko', prev: 'Edellinen kuva', next: 'Seuraava kuva', swipe: 'Pyyhkäise', certs: 'Seuraavat sertifikaatit', error: 'Sisältöä ei voitu ladata. Lataa sivu uudelleen.', retry: 'Yritä uudelleen' },
    sv: { language: 'Välj språk', menu: 'Meny', prev: 'Föregående bild', next: 'Nästa bild', swipe: 'Svep', certs: 'Nästa certifikat', error: 'Innehållet kunde inte laddas. Ladda om sidan.', retry: 'Försök igen' },
    en: { language: 'Select language', menu: 'Menu', prev: 'Previous image', next: 'Next image', swipe: 'Swipe', certs: 'Next certificates', error: 'The content could not be loaded. Reload the page.', retry: 'Try again' }
  };
  window.pprUi = labels[language];
  var pageNames = { 'Etusivu.dc.html': 'etusivu', 'Palvelut.dc.html': 'palvelut', 'Yritys.dc.html': 'yritys', 'Referenssit.dc.html': 'referenssit', 'Yhteystiedot.dc.html': 'yhteystiedot' };
  var page = window.__pprPreviewPage || location.pathname.split('/').pop() || 'Etusivu.dc.html';
  if (page === 'index.html') page = 'Etusivu.dc.html';
  window.pprLanguageOptions = supported.map(function (lang) {
    var url = new URL(page, document.baseURI);
    url.search = location.search;
    url.searchParams.set('lang', lang);
    url.hash = location.hash;
    return { code: lang.toUpperCase(), name: { fi: 'Suomi', sv: 'Svenska', en: 'English' }[lang], lang: lang, href: url.href, current: lang === language ? 'true' : 'false' };
  });
  // Used on content links as well as fixed template links, before React renders.
  window.pprLocalizeContent = function localize(value) {
    if (Array.isArray(value)) return value.map(localize);
    if (value && typeof value === 'object') {
      var copy = {};
      Object.keys(value).forEach(function (key) { copy[key] = localize(value[key]); });
      return copy;
    }
    if (typeof value === 'string' && window.__pprPreviewLanguage && value.charAt(0) === '#') {
      return new URL(value, location.href).href;
    }
    if (typeof value === 'string' && /^(?:\.\/)?(?:Etusivu|Palvelut|Yritys|Referenssit|Yhteystiedot)\.dc\.html(?:[?#]|$)/.test(value)) {
      var url = new URL(value, document.baseURI);
      url.searchParams.set('lang', language);
      return url.href;
    }
    return value;
  };
  window.pprSetPageMetadata = function (content) {
    var key = pageNames[page] || 'etusivu';
    document.title = content.common.nav[key] + ' | Porvoon Paalurakenne Oy';
    var description = document.querySelector('meta[name="description"]');
    if (!description) {
      description = document.createElement('meta');
      description.name = 'description';
      document.head.appendChild(description);
    }
    description.content = content[key].hero.lead;
  };
  var style = document.createElement('style');
  style.textContent = '[data-split]>*,[data-grid3]>*{min-width:0}h1,h2,h3{overflow-wrap:anywhere;hyphens:auto}' +
    '[data-language-switch]{display:flex;gap:2px;align-items:center;flex-shrink:0}' +
    '[data-language-switch] a{display:inline-flex;align-items:center;justify-content:center;min-width:34px;min-height:44px;font-size:13px;color:#C7D0E0;border-bottom:2px solid transparent}' +
    '[data-language-switch] a[aria-current="true"]{color:#fff;border-bottom-color:#5C97FF;font-weight:700}' +
    '[data-language-switch] a:focus-visible{outline:2px solid #5C97FF;outline-offset:2px}' +
    '@media(min-width:861px){[data-nav-actions]{display:none!important}}' +
    '@media(max-width:400px){[data-nav-actions]{gap:4px!important}[data-language-switch] a{min-width:30px}}';
  document.head.appendChild(style);
})();
