// Shared locale routing. URLs without a language always use Finnish.
(function () {
  var supported = ['fi', 'sv', 'en'];
  var query = new URLSearchParams(location.search);
  var requested = window.__pprPreviewLanguage || query.get('lang');
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
  var photoLabels = {
    fi: { viewPhoto: 'Katso koko kuva', closePhoto: 'Sulje kuva' },
    sv: { viewPhoto: 'Visa hela bilden', closePhoto: 'Stäng bilden' },
    en: { viewPhoto: 'View full image', closePhoto: 'Close image' }
  };
  Object.assign(window.pprUi, photoLabels[language]);
  var routes = { etusivu: './', palvelut: 'palvelut/', yritys: 'yritys/', referenssit: 'referenssit/', yhteystiedot: 'yhteystiedot/' };
  var legacyPages = { 'index.html': 'etusivu', 'etusivu.dc.html': 'etusivu', 'palvelut.dc.html': 'palvelut', 'yritys.dc.html': 'yritys', 'referenssit.dc.html': 'referenssit', 'yhteystiedot.dc.html': 'yhteystiedot' };
  // Directory pages set a relative <base>; the same links also work under /ppr/.
  var siteBase = new URL('./', document.baseURI);
  window.pprPageFromPath = function (pathname) {
    var path = pathname;
    try { path = decodeURIComponent(path); } catch (_) {}
    if (path.indexOf(siteBase.pathname) !== 0) return '';
    var relative = path.slice(siteBase.pathname.length).toLowerCase();
    if (relative === '' || relative === 'index.html') return 'etusivu';
    if (legacyPages[relative]) return legacyPages[relative];
    var slug = relative.replace(/\/(?:index\.html)?$/, '');
    return Object.prototype.hasOwnProperty.call(routes, slug) ? slug : '';
  };
  var page = (window.__pprPreviewPage && legacyPages[window.__pprPreviewPage.toLowerCase()]) ||
    document.documentElement.getAttribute('data-ppr-page') || window.pprPageFromPath(location.pathname) || 'etusivu';
  window.pprPage = page;
  function pageHref(key, lang, search, hash) {
    var params = new URLSearchParams(search || '');
    if (lang === 'fi') params.delete('lang');
    else params.set('lang', lang);
    var suffix = params.toString();
    return routes[key] + (suffix ? '?' + suffix : '') + (hash || '');
  }
  window.pprPageLinks = {};
  Object.keys(routes).forEach(function (key) { window.pprPageLinks[key] = pageHref(key, language); });
  // Keep bookmarked file URLs working, with the clean address in the browser.
  // The editor fetches these full templates and must remain on its preview URL.
  if (!window.__pprPreviewLanguage) {
    var target = new URL(pageHref(page, language, location.search, location.hash), siteBase);
    if (target.href !== location.href) location.replace(target.href);
  }
  window.pprLanguageOptions = supported.map(function (lang) {
    return { code: lang.toUpperCase(), name: { fi: 'Suomi', sv: 'Svenska', en: 'English' }[lang], lang: lang, href: pageHref(page, lang, location.search, location.hash), current: lang === language ? 'true' : 'false' };
  });
  // Used on content links as well as fixed template links, before React renders.
  window.pprLocalizeContent = function localize(value) {
    if (Array.isArray(value)) return value.map(localize);
    if (value && typeof value === 'object') {
      var copy = {};
      Object.keys(value).forEach(function (key) { copy[key] = localize(value[key]); });
      return copy;
    }
    if (typeof value === 'string' && value.charAt(0) === '#') {
      return window.__pprPreviewLanguage ? new URL(value, location.href).href : pageHref(page, language, location.search, value);
    }
    if (typeof value === 'string' && /^(?:\.\/)?(?:index\.html|(?:Etusivu|Palvelut|Yritys|Referenssit|Yhteystiedot)\.dc\.html|(?:palvelut|yritys|referenssit|yhteystiedot)\/|\.\/)(?:[?#]|$)/i.test(value)) {
      var url = new URL(value, document.baseURI);
      var key = window.pprPageFromPath(url.pathname);
      if (key) return pageHref(key, language, url.search, url.hash);
    }
    return value;
  };
  // Navigation stays relative; search/social metadata uses the production domain.
  var canonicalPage = page === 'etusivu' ? '' : routes[page];
  var canonicalUrl = 'https://ppr.fi/' + canonicalPage + (language === 'fi' ? '' : '?lang=' + language);
  var canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = canonicalUrl;
  var ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.content = canonicalUrl;
  window.pprSetPageMetadata = function (content) {
    var key = page;
    document.title = content.common.nav[key] + ' | Porvoon Paalurakenne Oy';
    var description = document.querySelector('meta[name="description"]');
    if (!description) {
      description = document.createElement('meta');
      description.name = 'description';
      document.head.appendChild(description);
    }
    description.content = content[key].hero.lead;
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = document.title;
    var ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.content = description.content;
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
