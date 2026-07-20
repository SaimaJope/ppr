// Hallintapaneelin käyttöliittymä yhtenä HTML-merkkijonona.
// HUOM: sisäinen JavaScript ei käytä takahipsuja eikä ${ -merkintää,
// jotta se voidaan upottaa tähän template-literaaliin turvallisesti.

export const ADMIN_HTML = `<!doctype html>
<html lang="fi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>PPR – Sisällönhallinta</title>
<style>
  :root {
    --navy: #0E1116;
    --blue: #015AFF;
    --blue-dark: #01266A;
    --steel: #56607A;
    --bg: #F0F2F6;
    --card: #ffffff;
    --line: rgba(14, 17, 22, .12);
    --ok: #0B7A3E;
    --err: #B00020;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    background: var(--bg);
    color: #14181F;
    font-size: 16px;
  }
  button { font: inherit; cursor: pointer; }
  input, textarea, select { font: inherit; }

  /* ---------- kirjautuminen ---------- */
  #login-view {
    min-height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: linear-gradient(160deg, #0E1116 0%, #1a2230 60%, #01266A 130%);
  }
  .login-card {
    background: var(--card);
    width: 100%;
    max-width: 420px;
    padding: 40px 36px;
    border-radius: 10px;
    box-shadow: 0 24px 60px -24px rgba(0, 0, 0, .55);
  }
  .login-card h1 { margin: 0 0 6px 0; font-size: 22px; letter-spacing: -.01em; }
  .login-card .sub { color: var(--steel); font-size: 14.5px; margin: 0 0 26px 0; }
  .login-card label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 8px; }
  .login-card input {
    width: 100%;
    padding: 13px 14px;
    border: 1px solid var(--line);
    border-radius: 8px;
    font-size: 16px;
  }
  .login-card input:focus { outline: 2px solid var(--blue); outline-offset: 1px; border-color: transparent; }
  .login-card button {
    width: 100%;
    margin-top: 18px;
    padding: 13px;
    background: var(--blue);
    color: #fff;
    border: 0;
    border-radius: 8px;
    font-weight: 600;
    font-size: 16px;
  }
  .login-card button:hover { background: #2b74ff; }
  .login-card button:disabled { opacity: .6; cursor: default; }
  #login-error { color: var(--err); font-size: 14.5px; margin-top: 14px; min-height: 20px; }

  /* ---------- sovellus ---------- */
  #app-view { display: none; min-height: 100%; }
  header.topbar {
    position: sticky;
    top: 0;
    z-index: 20;
    background: var(--navy);
    color: #F0F2F6;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 0 22px;
    height: 58px;
  }
  header.topbar .brand { font-weight: 700; font-size: 15.5px; letter-spacing: .01em; white-space: nowrap; }
  header.topbar .brand small { display: block; font-weight: 400; font-size: 11.5px; color: #9AA6BD; }
  header.topbar .spacer { flex: 1; }
  #dirty-pill {
    display: none;
    font-size: 12.5px;
    background: rgba(255, 176, 0, .15);
    color: #FFB000;
    border: 1px solid rgba(255, 176, 0, .4);
    padding: 4px 10px;
    border-radius: 99px;
    white-space: nowrap;
  }
  .btn {
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 9px 16px;
    font-weight: 600;
    font-size: 14.5px;
    white-space: nowrap;
  }
  .btn-primary { background: var(--blue); color: #fff; }
  .btn-primary:hover { background: #2b74ff; }
  .btn-primary:disabled { opacity: .55; cursor: default; }
  .btn-ghost { background: transparent; color: #C7D0E0; border-color: rgba(199, 208, 224, .35); }
  .btn-ghost:hover { color: #fff; border-color: #fff; }
  .btn-ghost:disabled { opacity: .5; cursor: default; }

  .layout { display: flex; min-height: calc(100vh - 58px); }
  nav.side {
    width: 232px;
    flex: none;
    background: #fff;
    border-right: 1px solid var(--line);
    padding: 18px 12px;
  }
  nav.side .nav-title { font-size: 11.5px; text-transform: uppercase; letter-spacing: .1em; color: var(--steel); padding: 4px 10px 10px 10px; }
  nav.side button {
    display: block;
    width: 100%;
    text-align: left;
    background: transparent;
    border: 0;
    border-radius: 8px;
    padding: 11px 12px;
    font-size: 15px;
    color: #28303C;
    margin-bottom: 2px;
  }
  nav.side button:hover { background: rgba(1, 90, 255, .06); }
  nav.side button.active { background: rgba(1, 90, 255, .1); color: var(--blue-dark); font-weight: 700; box-shadow: inset 3px 0 0 var(--blue); }

  main.content { flex: 1; padding: 28px 30px 90px 30px; max-width: 980px; }
  main.content h2.page-title { margin: 0 0 4px 0; font-size: 24px; letter-spacing: -.01em; }
  main.content .page-desc { color: var(--steel); font-size: 14.5px; margin: 0 0 24px 0; }

  .group {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 22px;
    margin-bottom: 20px;
  }
  .group > h3 { margin: 0 0 4px 0; font-size: 17px; }
  .group > .group-desc { color: var(--steel); font-size: 13.5px; margin: 0 0 16px 0; }

  .field { margin-bottom: 16px; }
  .field label { display: block; font-size: 13.5px; font-weight: 600; margin-bottom: 6px; color: #28303C; }
  .field .hint { font-weight: 400; color: var(--steel); }
  .field input[type=text], .field textarea, .field select {
    width: 100%;
    padding: 11px 12px;
    border: 1px solid var(--line);
    border-radius: 8px;
    font-size: 15.5px;
    background: #fff;
  }
  .field textarea { resize: vertical; min-height: 74px; line-height: 1.5; }
  .field input:focus, .field textarea:focus { outline: 2px solid var(--blue); outline-offset: 1px; border-color: transparent; }

  .item-card {
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
    background: #FAFBFD;
  }
  .item-head { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
  .item-head .item-title { font-weight: 700; font-size: 14px; color: var(--blue-dark); flex: 1; }
  .icon-btn {
    border: 1px solid var(--line);
    background: #fff;
    border-radius: 6px;
    width: 32px;
    height: 32px;
    font-size: 15px;
    line-height: 1;
    color: #28303C;
  }
  .icon-btn:hover { border-color: var(--blue); color: var(--blue); }
  .icon-btn:disabled { opacity: .35; cursor: default; }
  .icon-btn.danger:hover { border-color: var(--err); color: var(--err); }
  .add-btn {
    border: 1px dashed rgba(1, 90, 255, .5);
    color: var(--blue);
    background: rgba(1, 90, 255, .04);
    border-radius: 8px;
    padding: 10px 16px;
    font-weight: 600;
    font-size: 14.5px;
    width: 100%;
  }
  .add-btn:hover { background: rgba(1, 90, 255, .09); }

  .string-row { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; }
  .string-row input { flex: 1; padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px; font-size: 15px; }
  .string-row textarea { flex: 1; padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px; font-size: 15px; min-height: 66px; resize: vertical; line-height: 1.5; }

  .image-field { display: flex; gap: 14px; align-items: flex-start; }
  .image-thumb {
    width: 110px;
    height: 74px;
    flex: none;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: #EDF0F5 center/contain no-repeat;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--steel);
    font-size: 11px;
    overflow: hidden;
  }
  .image-thumb img { width: 100%; height: 100%; object-fit: contain; }
  .image-controls { flex: 1; }
  .image-controls .path { font-size: 12.5px; color: var(--steel); word-break: break-all; margin-top: 6px; }
  .mini-btn {
    border: 1px solid var(--line);
    background: #fff;
    border-radius: 6px;
    padding: 7px 12px;
    font-size: 13.5px;
    font-weight: 600;
    color: #28303C;
    margin-right: 8px;
  }
  .mini-btn:hover { border-color: var(--blue); color: var(--blue); }
  .mini-btn:disabled { opacity: .5; cursor: default; }

  footer.app-footer {
    border-top: 1px solid var(--line);
    background: #fff;
    padding: 16px 30px;
    font-size: 13px;
    color: var(--steel);
  }

  #toast {
    position: fixed;
    left: 50%;
    bottom: 26px;
    transform: translateX(-50%);
    z-index: 50;
    display: none;
    max-width: min(560px, calc(100vw - 40px));
    background: var(--navy);
    color: #fff;
    border-radius: 10px;
    padding: 14px 20px;
    font-size: 15px;
    box-shadow: 0 18px 44px -14px rgba(0, 0, 0, .5);
  }
  #toast.ok { border-left: 4px solid #27C46D; }
  #toast.err { border-left: 4px solid #FF5C5C; background: #2a1215; }
  #toast a { color: #7FB0FF; font-weight: 600; }

  @media (max-width: 860px) {
    .layout { flex-direction: column; }
    nav.side { width: 100%; display: flex; overflow-x: auto; padding: 8px; border-right: 0; border-bottom: 1px solid var(--line); }
    nav.side .nav-title { display: none; }
    nav.side button { width: auto; white-space: nowrap; }
    nav.side button.active { box-shadow: inset 0 -3px 0 var(--blue); }
    main.content { padding: 20px 16px 80px 16px; }
    header.topbar { flex-wrap: wrap; height: auto; padding: 10px 14px; row-gap: 8px; }
  }
</style>
</head>
<body>

<div id="login-view">
  <div class="login-card">
    <h1>Porvoon Paalurakenne Oy</h1>
    <p class="sub">Sivuston sisällönhallinta – kirjaudu sisään.</p>
    <form id="login-form">
      <label for="password">Salasana</label>
      <input type="password" id="password" name="password" autocomplete="current-password" required autofocus>
      <button type="submit" id="login-btn">Kirjaudu</button>
      <div id="login-error"></div>
    </form>
  </div>
</div>

<div id="app-view">
  <header class="topbar">
    <div class="brand">PPR – Sisällönhallinta<small>Porvoon Paalurakenne Oy</small></div>
    <div class="spacer"></div>
    <span id="dirty-pill">Tallentamattomia muutoksia</span>
    <button class="btn btn-ghost" id="discard-btn" style="display:none">Hylkää muutokset</button>
    <button class="btn btn-ghost" id="preview-btn">Esikatselu</button>
    <button class="btn btn-primary" id="save-btn" disabled>Tallenna muutokset</button>
    <button class="btn btn-ghost" id="logout-btn">Kirjaudu ulos</button>
  </header>
  <div class="layout">
    <nav class="side" id="side-nav">
      <div class="nav-title">Sivut</div>
    </nav>
    <main class="content" id="content-area"></main>
  </div>
  <footer class="app-footer">
    Palautushistoria: jokainen tallennus säilyy sivuston versionhistoriassa (Git), joten aiempi
    versio voidaan aina palauttaa. Palautukset hoitaa ylläpito – ota tarvittaessa yhteyttä.
  </footer>
</div>

<div id="toast"></div>

<form id="preview-form" method="POST" action="/preview" target="_blank" style="display:none">
  <input type="hidden" name="page" id="preview-page">
  <input type="hidden" name="content" id="preview-content">
</form>

<script>
'use strict';

/* ------------------------------ tila ------------------------------ */

var state = {
  data: null,
  sha: null,
  dirty: false,
  panel: 'etusivu',
  saving: false,
  localImages: {} // path -> dataURL (esikatselukuva ennen julkaisua)
};

var SITE_URL = 'https://saimajope.github.io/ppr/';

/* ------------------------------ skeema ------------------------------ */
/* Jokainen paneeli kuvaa joukon lomakeryhmiä; kentät osoittavat suoraan
   content/fi.json-polkuihin. Tyypit: text, textarea, strings (tekstilista),
   list (olioiden lista), image (kuvapolku + lataus). */

function heroGroup(prefix, extra) {
  var fields = [
    { path: prefix + '.hero.eyebrow', label: 'Pieni yläotsikko', type: 'text' },
    { path: prefix + '.hero.title', label: 'Pääotsikko', type: 'text' },
    { path: prefix + '.hero.lead', label: 'Esittelyteksti', type: 'textarea' }
  ].concat(extra || []);
  return { title: 'Sivun yläosa (hero)', fields: fields };
}

var SCHEMA = [
  {
    id: 'etusivu',
    title: 'Etusivu',
    desc: 'Etusivun sisältö: iso yläbanneri, yritysesittely, palvelulistaus, sertifikaatit ja yhteystieto-osio.',
    groups: [
      heroGroup('etusivu', [
        { path: 'etusivu.hero.ctaPrimary', label: 'Sininen painike', type: 'text' },
        { path: 'etusivu.hero.ctaSecondary', label: 'Toinen painike', type: 'text' }
      ]),
      {
        title: 'Yritysesittely',
        fields: [
          { path: 'etusivu.intro.eyebrow', label: 'Pieni yläotsikko', type: 'text' },
          { path: 'etusivu.intro.title', label: 'Otsikko', type: 'text' },
          { path: 'etusivu.intro.paragraphs', label: 'Kappaleet', type: 'strings', rows: true, itemLabel: 'kappale' },
          { path: 'etusivu.intro.linkLabel', label: 'Linkin teksti', type: 'text' }
        ]
      },
      {
        title: 'Palvelut-osio',
        desc: 'Etusivulla näkyvä palvelulistaus. Koko palvelusivun sisältö muokataan Palvelut-välilehdellä.',
        fields: [
          { path: 'etusivu.services.eyebrow', label: 'Pieni yläotsikko', type: 'text' },
          { path: 'etusivu.services.title', label: 'Otsikko', type: 'text' },
          { path: 'etusivu.services.linkLabel', label: 'Linkin teksti', type: 'text' },
          {
            path: 'etusivu.services.items', label: 'Palvelut', type: 'list', itemLabel: 'Palvelu',
            fields: [
              { key: 'title', label: 'Nimi', type: 'text' },
              { key: 'desc', label: 'Lyhyt kuvaus', type: 'textarea' }
            ],
            blank: { title: '', desc: '' }
          }
        ]
      },
      {
        title: 'Sertifikaatit ja pätevyydet',
        fields: [
          { path: 'etusivu.certs.eyebrow', label: 'Pieni yläotsikko', type: 'text' },
          { path: 'etusivu.certs.title', label: 'Otsikko', type: 'text' },
          {
            path: 'etusivu.certs.items', label: 'Sertifikaattilogot', type: 'list', itemLabel: 'Sertifikaatti',
            fields: [
              { key: 'img', label: 'Logo', type: 'image' },
              { key: 'alt', label: 'Nimi / kuvaus', type: 'text' },
              { key: 'url', label: 'Linkki (avautuu logoa klikkaamalla)', type: 'text' }
            ],
            blank: { img: '', alt: '', url: '' }
          }
        ]
      },
      {
        title: 'Yhteystieto-osion otsikot',
        desc: 'Varsinaiset osoitteet ja puhelinnumerot muokataan Yhteiset tiedot -välilehdellä.',
        fields: [
          { path: 'etusivu.contact.depotLabel', label: 'Varikko-palstan otsikko', type: 'text' },
          { path: 'etusivu.contact.billingLabel', label: 'Laskutus-palstan otsikko', type: 'text' },
          { path: 'etusivu.contact.phonePrefix', label: 'Puhelinnumeron etuliite', type: 'text', hint: 'esim. "Puh."' }
        ]
      }
    ]
  },
  {
    id: 'palvelut',
    title: 'Palvelut',
    desc: 'Palvelut-sivun sisältö.',
    groups: [
      heroGroup('palvelut'),
      {
        title: 'Palvelukuvaukset',
        fields: [
          {
            path: 'palvelut.details', label: 'Palvelut', type: 'list', itemLabel: 'Palvelu',
            fields: [
              { key: 'title', label: 'Otsikko', type: 'text' },
              { key: 'desc', label: 'Kuvaus', type: 'textarea' },
              { key: 'bullets', label: 'Luettelokohdat', type: 'strings', itemLabel: 'kohta' },
              { key: 'shot', label: 'Kuvapaikan teksti', type: 'text', hint: 'näkyy tummassa kuvapaikassa' }
            ],
            blank: { title: '', desc: '', shot: '', bullets: [] }
          }
        ]
      }
    ]
  },
  {
    id: 'yritys',
    title: 'Yritys',
    desc: 'Yritys-sivun sisältö.',
    groups: [
      heroGroup('yritys'),
      {
        title: 'Yritystarina',
        fields: [
          { path: 'yritys.story.title', label: 'Otsikko', type: 'text' },
          {
            path: 'yritys.story.stats', label: 'Avainluvut', type: 'list', itemLabel: 'Avainluku',
            fields: [
              { key: 'value', label: 'Arvo', type: 'text', hint: 'esim. "2006"' },
              { key: 'label', label: 'Selite', type: 'text', hint: 'esim. "Perustettu"' }
            ],
            blank: { value: '', label: '' }
          },
          { path: 'yritys.story.paragraphs', label: 'Kappaleet', type: 'strings', rows: true, itemLabel: 'kappale' }
        ]
      },
      {
        title: 'Laatu ja turvallisuus',
        fields: [
          { path: 'yritys.quality.eyebrow', label: 'Pieni yläotsikko', type: 'text' },
          { path: 'yritys.quality.title', label: 'Otsikko', type: 'text' },
          { path: 'yritys.quality.paragraphs', label: 'Kappaleet', type: 'strings', rows: true, itemLabel: 'kappale' },
          { path: 'yritys.quality.badges', label: 'Merkinnät (laatikot)', type: 'strings', itemLabel: 'merkintä' }
        ]
      },
      {
        title: 'Sertifikaatit ja pätevyydet',
        fields: [
          { path: 'yritys.creds.eyebrow', label: 'Pieni yläotsikko', type: 'text' },
          { path: 'yritys.creds.title', label: 'Otsikko', type: 'text' },
          {
            path: 'yritys.creds.items', label: 'Pätevyydet', type: 'list', itemLabel: 'Pätevyys',
            fields: [
              { key: 'name', label: 'Nimi', type: 'text' },
              { key: 'desc', label: 'Kuvaus', type: 'textarea' }
            ],
            blank: { name: '', desc: '' }
          }
        ]
      },
      {
        title: 'Erikoisosaaminen',
        fields: [
          { path: 'yritys.expertise.eyebrow', label: 'Pieni yläotsikko', type: 'text' },
          { path: 'yritys.expertise.title', label: 'Otsikko', type: 'text' },
          { path: 'yritys.expertise.paragraphs', label: 'Kappaleet', type: 'strings', rows: true, itemLabel: 'kappale' },
          { path: 'yritys.expertise.badges', label: 'Merkinnät (laatikot)', type: 'strings', itemLabel: 'merkintä' },
          { path: 'yritys.expertise.photoCaption', label: 'Kuvapaikan teksti', type: 'text' }
        ]
      },
      {
        title: 'Alihankintaverkosto',
        fields: [
          { path: 'yritys.network.title', label: 'Otsikko', type: 'text' },
          { path: 'yritys.network.text', label: 'Teksti', type: 'textarea' }
        ]
      },
      {
        title: 'Ura-nosto',
        fields: [
          { path: 'yritys.career.eyebrow', label: 'Pieni yläotsikko', type: 'text' },
          { path: 'yritys.career.title', label: 'Otsikko', type: 'text' },
          { path: 'yritys.career.text', label: 'Teksti', type: 'textarea' },
          { path: 'yritys.career.ctaLabel', label: 'Painikkeen teksti', type: 'text' },
          { path: 'yritys.career.photoCaption', label: 'Kuvapaikan teksti', type: 'text' }
        ]
      }
    ]
  },
  {
    id: 'referenssit',
    title: 'Referenssit',
    desc: 'Referenssit-sivun sisältö ja kohdeluettelo.',
    groups: [
      heroGroup('referenssit'),
      {
        title: 'Suodatinnapit',
        fields: [
          { path: 'referenssit.filters.allLabel', label: '"Kaikki"-napin teksti', type: 'text' },
          { path: 'referenssit.filters.categories', label: 'Kategoriat', type: 'strings', itemLabel: 'kategoria' },
          { path: 'referenssit.filters.countSuffix', label: 'Lukumäärän pääte', type: 'text', hint: 'esim. "kohdetta" → "9 kohdetta"' }
        ]
      },
      {
        title: 'Kohteet',
        fields: [
          {
            path: 'referenssit.projects', label: 'Referenssikohteet', type: 'list', itemLabel: 'Kohde',
            fields: [
              { key: 'sector', label: 'Kategoria', type: 'text' },
              { key: 'title', label: 'Otsikko', type: 'text' },
              { key: 'scope', label: 'Kuvaus', type: 'textarea' },
              { key: 'loc', label: 'Sijainti', type: 'text' },
              { key: 'year', label: 'Vuosi', type: 'text' },
              { key: 'img', label: 'Kuva (valinnainen)', type: 'image', optional: true },
              { key: 'shot', label: 'Kuvapaikan teksti (jos kuvaa ei ole)', type: 'text' }
            ],
            blank: { sector: '', title: '', scope: '', loc: '', year: '', shot: '', img: '' }
          }
        ]
      }
    ]
  },
  {
    id: 'ura',
    title: 'Ura',
    desc: 'Ura-sivun sisältö.',
    groups: [
      heroGroup('ura'),
      {
        title: 'Miksi PPR',
        fields: [
          { path: 'ura.why.eyebrow', label: 'Pieni yläotsikko', type: 'text' },
          { path: 'ura.why.title', label: 'Otsikko', type: 'text' },
          {
            path: 'ura.why.items', label: 'Perustelut', type: 'list', itemLabel: 'Perustelu',
            fields: [
              { key: 'title', label: 'Otsikko', type: 'text' },
              { key: 'desc', label: 'Kuvaus', type: 'textarea' }
            ],
            blank: { title: '', desc: '' }
          }
        ]
      },
      {
        title: 'Avoimet tehtävät',
        fields: [
          { path: 'ura.roles.title', label: 'Otsikko', type: 'text' },
          { path: 'ura.roles.note', label: 'Lisäteksti', type: 'textarea' },
          {
            path: 'ura.roles.items', label: 'Tehtävät', type: 'list', itemLabel: 'Tehtävä',
            fields: [
              { key: 'title', label: 'Tehtävänimike', type: 'text' },
              { key: 'note', label: 'Lisätieto', type: 'text' }
            ],
            blank: { title: '', note: '' }
          }
        ]
      },
      {
        title: 'Hakukehotus',
        fields: [
          { path: 'ura.apply.title', label: 'Otsikko', type: 'text' },
          { path: 'ura.apply.text', label: 'Teksti', type: 'textarea' }
        ]
      }
    ]
  },
  {
    id: 'yhteystiedot',
    title: 'Yhteystiedot',
    desc: 'Yhteystiedot-sivun sisältö. Osoitteet ja puhelinnumerot muokataan Yhteiset tiedot -välilehdellä.',
    groups: [
      heroGroup('yhteystiedot'),
      {
        title: 'Toimipistekortit',
        fields: [
          { path: 'yhteystiedot.locations.officeTitle', label: 'Toimiston kortin otsikko', type: 'text', hint: 'esim. "Askola"' },
          { path: 'yhteystiedot.locations.depotLabel', label: 'Varikon kortin yläotsikko', type: 'text' }
        ]
      },
      {
        title: 'Avainhenkilöt',
        fields: [
          { path: 'yhteystiedot.team.eyebrow', label: 'Pieni yläotsikko', type: 'text' },
          { path: 'yhteystiedot.team.title', label: 'Otsikko', type: 'text' },
          {
            path: 'yhteystiedot.team.members', label: 'Henkilöt', type: 'list', itemLabel: 'Henkilö',
            fields: [
              { key: 'name', label: 'Nimi', type: 'text' },
              { key: 'role', label: 'Tehtävänimike', type: 'text' },
              { key: 'phone', label: 'Puhelin', type: 'text', hint: 'esim. "0400 714 532" – linkki muodostuu automaattisesti' },
              { key: 'email', label: 'Sähköposti', type: 'text' }
            ],
            blank: { name: '', role: '', phone: '', email: '' }
          }
        ]
      },
      {
        title: 'Laskutus-osion otsikot',
        desc: 'Varsinaiset laskutustiedot muokataan Yhteiset tiedot -välilehdellä.',
        fields: [
          { path: 'yhteystiedot.invoicing.eyebrow', label: 'Pieni yläotsikko', type: 'text' },
          { path: 'yhteystiedot.invoicing.title', label: 'Otsikko', type: 'text' }
        ]
      }
    ]
  },
  {
    id: 'common',
    title: 'Yhteiset tiedot',
    desc: 'Nämä tiedot näkyvät kaikilla sivuilla: yläpalkissa, alatunnisteessa, yhteystiedoissa ja laskutusosioissa. Muutos päivittyy kerralla joka paikkaan.',
    groups: [
      {
        title: 'Yritys',
        fields: [
          { path: 'common.company.name', label: 'Yrityksen nimi', type: 'text' },
          { path: 'common.company.businessId', label: 'Y-tunnus', type: 'text' }
        ]
      },
      {
        title: 'Toimisto',
        fields: [
          { path: 'common.contact.office.label', label: 'Otsikko', type: 'text', hint: 'esim. "Toimisto"' },
          { path: 'common.contact.office.street', label: 'Katuosoite', type: 'text' },
          { path: 'common.contact.office.postalCity', label: 'Postinumero ja -toimipaikka', type: 'text' },
          { path: 'common.contact.office.phone', label: 'Puhelin', type: 'text', hint: 'soittolinkki muodostuu automaattisesti' },
          { path: 'common.contact.office.email', label: 'Sähköposti', type: 'text' }
        ]
      },
      {
        title: 'Varikko ja varasto',
        fields: [
          { path: 'common.contact.depot.name', label: 'Nimi', type: 'text', hint: 'esim. "Kulloo, Kilpilahti"' },
          { path: 'common.contact.depot.street', label: 'Katuosoite', type: 'text' },
          { path: 'common.contact.depot.postalCity', label: 'Postinumero ja -toimipaikka', type: 'text' },
          { path: 'common.contact.depot.phone', label: 'Päivystysnumero', type: 'text' },
          { path: 'common.contact.depot.emergencyLabel', label: 'Päivystyksen teksti', type: 'text', hint: 'esim. "24h päivystys"' }
        ]
      },
      {
        title: 'Laskutustiedot',
        desc: 'Näkyvät etusivulla ja Yhteystiedot-sivulla.',
        fields: [
          { path: 'common.billing.ovt', label: 'Verkkolaskuosoite / OVT', type: 'text' },
          { path: 'common.billing.operator', label: 'Operaattori / OVT', type: 'text' },
          { path: 'common.billing.emailInvoice', label: 'Sähköpostilaskuosoite', type: 'text' },
          { path: 'common.billing.paperLine1', label: 'Paperilasku, rivi 1', type: 'text', hint: 'esim. "PL 908"' },
          { path: 'common.billing.paperLine2', label: 'Paperilasku, rivi 2', type: 'text', hint: 'esim. "02066 DOCUSCAN"' }
        ]
      },
      {
        title: 'Laskutuskenttien otsikot',
        fields: [
          { path: 'common.billing.labels.businessId', label: 'Y-tunnus-kentän otsikko', type: 'text' },
          { path: 'common.billing.labels.ovt', label: 'Verkkolaskukentän otsikko', type: 'text' },
          { path: 'common.billing.labels.operator', label: 'Operaattorikentän otsikko', type: 'text' },
          { path: 'common.billing.labels.email', label: 'Sähköpostilaskukentän otsikko', type: 'text' },
          { path: 'common.billing.labels.paper', label: 'Paperilaskukentän otsikko', type: 'text' }
        ]
      },
      {
        title: 'Alatunniste (footer)',
        fields: [
          { path: 'common.footer.description', label: 'Yrityskuvaus', type: 'textarea' },
          { path: 'common.footer.pagesTitle', label: '"Sivut"-otsikko', type: 'text' },
          { path: 'common.footer.depotTitle', label: 'Varikko-palstan otsikko', type: 'text' },
          { path: 'common.footer.copyright', label: 'Copyright-rivi', type: 'text' },
          { path: 'common.footer.billingLinkLabel', label: 'Laskutus-linkin teksti', type: 'text' },
          { path: 'common.footer.whistleblowingLabel', label: 'Whistleblowing-linkin teksti', type: 'text' },
          { path: 'common.footer.whistleblowingUrl', label: 'Whistleblowing-linkin osoite (URL)', type: 'text' }
        ]
      },
      {
        title: 'Valikon tekstit',
        desc: 'Sivuston ylävalikon ja alatunnisteen linkkitekstit. Muuta vain jos olet varma – sivujen osoitteet eivät muutu.',
        fields: [
          { path: 'common.nav.etusivu', label: 'Etusivu', type: 'text' },
          { path: 'common.nav.koti', label: 'Etusivu mobiilivalikossa', type: 'text' },
          { path: 'common.nav.palvelut', label: 'Palvelut', type: 'text' },
          { path: 'common.nav.yhteystiedot', label: 'Yhteystiedot', type: 'text' },
          { path: 'common.nav.yritys', label: 'Yritys', type: 'text' },
          { path: 'common.nav.ura', label: 'Ura', type: 'text' },
          { path: 'common.nav.referenssit', label: 'Referenssit', type: 'text' }
        ]
      }
    ]
  }
];

var PREVIEW_PAGE_FOR_PANEL = {
  etusivu: 'Etusivu',
  palvelut: 'Palvelut',
  yritys: 'Yritys',
  referenssit: 'Referenssit',
  ura: 'Ura',
  yhteystiedot: 'Yhteystiedot',
  common: 'Etusivu'
};

/* --------------------------- apufunktiot --------------------------- */

function $(id) { return document.getElementById(id); }

function getPath(obj, path) {
  var parts = path.split('.');
  var cur = obj;
  for (var i = 0; i < parts.length; i++) {
    if (cur == null) return undefined;
    cur = cur[parts[i]];
  }
  return cur;
}

function setPath(obj, path, value) {
  var parts = path.split('.');
  var cur = obj;
  for (var i = 0; i < parts.length - 1; i++) {
    if (cur[parts[i]] == null || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

function markDirty() {
  if (!state.dirty) {
    state.dirty = true;
    $('dirty-pill').style.display = 'inline-block';
    $('discard-btn').style.display = 'inline-block';
  }
  $('save-btn').disabled = state.saving;
}

function clearDirty() {
  state.dirty = false;
  $('dirty-pill').style.display = 'none';
  $('discard-btn').style.display = 'none';
  $('save-btn').disabled = true;
}

var toastTimer = null;
function showToast(html, kind, sticky) {
  var el = $('toast');
  el.className = kind || '';
  el.innerHTML = html;
  el.style.display = 'block';
  clearTimeout(toastTimer);
  if (!sticky) toastTimer = setTimeout(function () { el.style.display = 'none'; }, 7000);
}

function apiError(res, fallback) {
  return res.json().then(function (data) {
    return (data && data.error) || fallback;
  }).catch(function () { return fallback; });
}

/* ----------------------------- renderöinti ----------------------------- */

function renderNav() {
  var nav = $('side-nav');
  SCHEMA.forEach(function (panel) {
    var btn = document.createElement('button');
    btn.textContent = panel.title;
    btn.dataset.panel = panel.id;
    if (panel.id === state.panel) btn.classList.add('active');
    btn.addEventListener('click', function () {
      state.panel = panel.id;
      var all = nav.querySelectorAll('button');
      for (var i = 0; i < all.length; i++) all[i].classList.remove('active');
      btn.classList.add('active');
      renderPanel();
      window.scrollTo(0, 0);
    });
    nav.appendChild(btn);
  });
}

function renderPanel() {
  var panel = SCHEMA.find(function (p) { return p.id === state.panel; });
  var area = $('content-area');
  area.innerHTML = '';

  var h2 = document.createElement('h2');
  h2.className = 'page-title';
  h2.textContent = panel.title;
  area.appendChild(h2);

  var desc = document.createElement('p');
  desc.className = 'page-desc';
  desc.textContent = panel.desc || '';
  area.appendChild(desc);

  panel.groups.forEach(function (group) {
    var card = document.createElement('section');
    card.className = 'group';
    var h3 = document.createElement('h3');
    h3.textContent = group.title;
    card.appendChild(h3);
    if (group.desc) {
      var gd = document.createElement('p');
      gd.className = 'group-desc';
      gd.textContent = group.desc;
      card.appendChild(gd);
    }
    group.fields.forEach(function (field) {
      card.appendChild(renderField(field));
    });
    area.appendChild(card);
  });
}

function fieldLabel(field) {
  var label = document.createElement('label');
  label.textContent = field.label;
  if (field.hint) {
    var hint = document.createElement('span');
    hint.className = 'hint';
    hint.textContent = ' – ' + field.hint;
    label.appendChild(hint);
  }
  return label;
}

function renderField(field) {
  var wrap = document.createElement('div');
  wrap.className = 'field';
  wrap.appendChild(fieldLabel(field));

  if (field.type === 'text' || field.type === 'textarea') {
    var input = document.createElement(field.type === 'text' ? 'input' : 'textarea');
    if (field.type === 'text') input.type = 'text';
    input.value = String(getPath(state.data, field.path) == null ? '' : getPath(state.data, field.path));
    input.addEventListener('input', function () {
      setPath(state.data, field.path, input.value);
      markDirty();
    });
    wrap.appendChild(input);
    return wrap;
  }

  if (field.type === 'strings') {
    wrap.appendChild(renderStringsInto(
      function () { return getPath(state.data, field.path) || []; },
      function (arr) { setPath(state.data, field.path, arr); },
      field
    ));
    return wrap;
  }

  if (field.type === 'list') {
    wrap.appendChild(renderList(field));
    return wrap;
  }

  return wrap;
}

/* Tekstilista (kappaleet, luettelokohdat, kategoriat, merkinnät). */
function renderStringsInto(getArr, setArr, field) {
  var container = document.createElement('div');

  function redraw() {
    container.innerHTML = '';
    var arr = getArr();
    arr.forEach(function (value, i) {
      var row = document.createElement('div');
      row.className = 'string-row';
      var input = document.createElement(field.rows ? 'textarea' : 'input');
      if (!field.rows) input.type = 'text';
      input.value = value;
      input.addEventListener('input', function () {
        var a = getArr();
        a[i] = input.value;
        setArr(a);
        markDirty();
      });
      row.appendChild(input);
      row.appendChild(moveBtn('↑', i === 0, function () { swap(i, i - 1); }));
      row.appendChild(moveBtn('↓', i === arr.length - 1, function () { swap(i, i + 1); }));
      row.appendChild(removeBtn(function () {
        if (!confirm('Poistetaanko tämä ' + (field.itemLabel || 'rivi') + '?')) return;
        var a = getArr();
        a.splice(i, 1);
        setArr(a);
        markDirty();
        redraw();
      }));
      container.appendChild(row);
    });
    var add = document.createElement('button');
    add.type = 'button';
    add.className = 'add-btn';
    add.textContent = '+ Lisää ' + (field.itemLabel || 'rivi');
    add.addEventListener('click', function () {
      var a = getArr();
      a.push('');
      setArr(a);
      markDirty();
      redraw();
    });
    container.appendChild(add);
  }

  function swap(i, j) {
    var a = getArr();
    var t = a[i]; a[i] = a[j]; a[j] = t;
    setArr(a);
    markDirty();
    redraw();
  }

  redraw();
  return container;
}

/* Olioiden lista (palvelut, kohteet, henkilöt...). */
function renderList(field) {
  var container = document.createElement('div');

  function redraw() {
    container.innerHTML = '';
    var arr = getPath(state.data, field.path) || [];
    arr.forEach(function (item, i) {
      var card = document.createElement('div');
      card.className = 'item-card';

      var head = document.createElement('div');
      head.className = 'item-head';
      var title = document.createElement('span');
      title.className = 'item-title';
      title.textContent = (field.itemLabel || 'Rivi') + ' ' + (i + 1) +
        (item.title || item.name ? ' – ' + (item.title || item.name) : '');
      head.appendChild(title);
      head.appendChild(moveBtn('↑', i === 0, function () { swap(i, i - 1); }));
      head.appendChild(moveBtn('↓', i === arr.length - 1, function () { swap(i, i + 1); }));
      head.appendChild(removeBtn(function () {
        if (!confirm('Poistetaanko ' + (field.itemLabel || 'rivi').toLowerCase() + ' "' + (item.title || item.name || (i + 1)) + '"?')) return;
        arr.splice(i, 1);
        markDirty();
        redraw();
      }));
      card.appendChild(head);

      field.fields.forEach(function (sub) {
        var f = document.createElement('div');
        f.className = 'field';
        f.appendChild(fieldLabel(sub));
        if (sub.type === 'image') {
          f.appendChild(renderImageControl(item, sub, redraw));
        } else if (sub.type === 'strings') {
          f.appendChild(renderStringsInto(
            function () { if (!Array.isArray(item[sub.key])) item[sub.key] = []; return item[sub.key]; },
            function (a) { item[sub.key] = a; },
            sub
          ));
        } else {
          var input = document.createElement(sub.type === 'textarea' ? 'textarea' : 'input');
          if (sub.type !== 'textarea') input.type = 'text';
          input.value = String(item[sub.key] == null ? '' : item[sub.key]);
          input.addEventListener('input', function () {
            item[sub.key] = input.value;
            markDirty();
            if (sub.key === 'title' || sub.key === 'name') {
              title.textContent = (field.itemLabel || 'Rivi') + ' ' + (i + 1) + (input.value ? ' – ' + input.value : '');
            }
          });
          f.appendChild(input);
        }
        card.appendChild(f);
      });

      container.appendChild(card);
    });

    var add = document.createElement('button');
    add.type = 'button';
    add.className = 'add-btn';
    add.textContent = '+ Lisää ' + (field.itemLabel || 'rivi').toLowerCase();
    add.addEventListener('click', function () {
      var arr2 = getPath(state.data, field.path);
      if (!Array.isArray(arr2)) { arr2 = []; setPath(state.data, field.path, arr2); }
      arr2.push(JSON.parse(JSON.stringify(field.blank || {})));
      markDirty();
      redraw();
    });
    container.appendChild(add);
  }

  function swap(i, j) {
    var arr = getPath(state.data, field.path);
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    markDirty();
    redraw();
  }

  redraw();
  return container;
}

function moveBtn(symbol, disabled, onClick) {
  var b = document.createElement('button');
  b.type = 'button';
  b.className = 'icon-btn';
  b.textContent = symbol;
  b.title = symbol === '↑' ? 'Siirrä ylös' : 'Siirrä alas';
  b.disabled = disabled;
  b.addEventListener('click', onClick);
  return b;
}

function removeBtn(onClick) {
  var b = document.createElement('button');
  b.type = 'button';
  b.className = 'icon-btn danger';
  b.textContent = '✕';
  b.title = 'Poista';
  b.addEventListener('click', onClick);
  return b;
}

/* Kuvakenttä: esikatselu + lataus + (valinnainen) poisto. */
function renderImageControl(item, sub, redraw) {
  var wrap = document.createElement('div');
  wrap.className = 'image-field';

  var thumb = document.createElement('div');
  thumb.className = 'image-thumb';
  var current = String(item[sub.key] || '');
  if (current) {
    var img = document.createElement('img');
    img.alt = '';
    img.src = state.localImages[current] || (SITE_URL + current);
    img.onerror = function () { thumb.textContent = 'Ei esikatselua'; };
    thumb.appendChild(img);
  } else {
    thumb.textContent = 'Ei kuvaa';
  }
  wrap.appendChild(thumb);

  var controls = document.createElement('div');
  controls.className = 'image-controls';

  var fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';
  fileInput.style.display = 'none';

  var uploadBtn = document.createElement('button');
  uploadBtn.type = 'button';
  uploadBtn.className = 'mini-btn';
  uploadBtn.textContent = current ? 'Vaihda kuva…' : 'Lataa kuva…';
  uploadBtn.addEventListener('click', function () { fileInput.click(); });
  controls.appendChild(uploadBtn);

  if (sub.optional && current) {
    var clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'mini-btn';
    clearBtn.textContent = 'Poista kuva';
    clearBtn.addEventListener('click', function () {
      item[sub.key] = '';
      markDirty();
      redraw();
    });
    controls.appendChild(clearBtn);
  }

  fileInput.addEventListener('change', function () {
    var file = fileInput.files && fileInput.files[0];
    if (!file) return;
    if (!/\.(jpe?g|png|webp)$/i.test(file.name)) {
      showToast('Sallitut tiedostomuodot ovat JPG, PNG ja WEBP.', 'err');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Kuva on liian suuri. Enimmäiskoko on 2 Mt.', 'err');
      return;
    }
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Ladataan…';
    var reader = new FileReader();
    reader.onload = function () {
      var dataUrl = String(reader.result);
      fetch('/api/upload', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ filename: file.name, dataBase64: dataUrl })
      }).then(function (res) {
        if (!res.ok) {
          return apiError(res, 'Kuvan lataus epäonnistui.').then(function (msg) { throw new Error(msg); });
        }
        return res.json();
      }).then(function (data) {
        item[sub.key] = data.path;
        state.localImages[data.path] = dataUrl;
        markDirty();
        redraw();
        showToast('Kuva ladattu. Muista tallentaa muutokset, jotta kuva otetaan käyttöön.', 'ok');
      }).catch(function (err) {
        uploadBtn.disabled = false;
        uploadBtn.textContent = current ? 'Vaihda kuva…' : 'Lataa kuva…';
        showToast(err.message || 'Kuvan lataus epäonnistui.', 'err');
      });
    };
    reader.readAsDataURL(file);
  });

  controls.appendChild(fileInput);

  var pathInfo = document.createElement('div');
  pathInfo.className = 'path';
  pathInfo.textContent = current ? current : '';
  controls.appendChild(pathInfo);

  wrap.appendChild(controls);
  return wrap;
}

/* ------------------------------ toiminnot ------------------------------ */

function loadContent() {
  return fetch('/api/content').then(function (res) {
    if (res.status === 401) {
      showLogin();
      return null;
    }
    if (!res.ok) {
      return apiError(res, 'Sisällön lataus epäonnistui.').then(function (msg) { throw new Error(msg); });
    }
    return res.json();
  }).then(function (data) {
    if (!data) return;
    state.data = data.content;
    state.sha = data.sha;
    state.localImages = {};
    clearDirty();
    showApp();
    renderPanel();
  }).catch(function (err) {
    showToast(err.message || 'Sisällön lataus epäonnistui.', 'err', true);
  });
}

function save() {
  if (state.saving || !state.dirty) return;
  state.saving = true;
  var btn = $('save-btn');
  btn.disabled = true;
  btn.textContent = 'Tallennetaan…';
  fetch('/api/content', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ content: state.data, sha: state.sha })
  }).then(function (res) {
    if (!res.ok) {
      return apiError(res, 'Tallennus epäonnistui.').then(function (msg) { throw new Error(msg); });
    }
    return res.json();
  }).then(function (data) {
    state.sha = data.sha;
    clearDirty();
    showToast(
      'Tallennettu! Muutokset näkyvät sivustolla noin minuutin kuluttua. ' +
      '<a href="' + SITE_URL + '" target="_blank" rel="noopener">Avaa sivusto ↗</a>',
      'ok'
    );
  }).catch(function (err) {
    showToast(err.message || 'Tallennus epäonnistui.', 'err', true);
    $('save-btn').disabled = false;
  }).finally(function () {
    state.saving = false;
    $('save-btn').textContent = 'Tallenna muutokset';
    if (!state.dirty) $('save-btn').disabled = true;
  });
}

function preview() {
  if (!state.data) return;
  $('preview-page').value = PREVIEW_PAGE_FOR_PANEL[state.panel] || 'Etusivu';
  $('preview-content').value = JSON.stringify(state.data);
  $('preview-form').submit();
}

function showLogin() {
  $('login-view').style.display = 'flex';
  $('app-view').style.display = 'none';
}

function showApp() {
  $('login-view').style.display = 'none';
  $('app-view').style.display = 'block';
}

/* ------------------------------ käynnistys ------------------------------ */

$('login-form').addEventListener('submit', function (e) {
  e.preventDefault();
  var btn = $('login-btn');
  btn.disabled = true;
  $('login-error').textContent = '';
  fetch('/api/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: $('password').value })
  }).then(function (res) {
    if (!res.ok) {
      return apiError(res, 'Kirjautuminen epäonnistui.').then(function (msg) { throw new Error(msg); });
    }
    $('password').value = '';
    return loadContent();
  }).catch(function (err) {
    $('login-error').textContent = err.message || 'Kirjautuminen epäonnistui.';
  }).finally(function () {
    btn.disabled = false;
  });
});

$('save-btn').addEventListener('click', save);
$('preview-btn').addEventListener('click', preview);
$('discard-btn').addEventListener('click', function () {
  if (!confirm('Hylätäänkö kaikki tallentamattomat muutokset?')) return;
  loadContent();
});
$('logout-btn').addEventListener('click', function () {
  fetch('/api/logout', { method: 'POST' }).then(function () {
    state.data = null;
    clearDirty();
    showLogin();
  });
});

window.addEventListener('beforeunload', function (e) {
  if (state.dirty) {
    e.preventDefault();
    e.returnValue = '';
  }
});

renderNav();
loadContent();
</script>
</body>
</html>`;
