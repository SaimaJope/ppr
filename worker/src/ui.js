// Hallintapaneelin käyttöliittymä yhtenä HTML-merkkijonona.
// Ulkoasu seuraa julkisen sivuston tyyliä: Archivo-fontit, terävät kulmat,
// tummansininen/teräksinen väripaletti.
// HUOM: sisäinen JavaScript ei käytä takahipsuja eikä ${ -merkintää,
// jotta se voidaan upottaa tähän template-literaaliin turvallisesti.

export const ADMIN_HTML = `<!doctype html>
<html lang="fi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>PPR | Sisällönhallinta</title>
<link rel="icon" type="image/png" href="https://saimajope.github.io/ppr/assets/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=Archivo+Narrow:wght@500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --navy: #0E1116;
    --navy-2: #171C24;
    --blue: #015AFF;
    --blue-hover: #2b74ff;
    --blue-dark: #01266A;
    --steel: #56607A;
    --steel-light: #8093B5;
    --bg: #F0F2F6;
    --card: #ffffff;
    --line: rgba(14, 17, 22, .12);
    --line-strong: rgba(14, 17, 22, .18);
    --err: #B00020;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; }
  body {
    font-family: 'Archivo', system-ui, sans-serif;
    background: var(--bg);
    color: #14181F;
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
  }
  button { font: inherit; cursor: pointer; }
  input, textarea, select { font: inherit; color: #14181F; }
  ::selection { background: var(--blue); color: #fff; }
  .lbl {
    font-family: 'Archivo Narrow', sans-serif;
    text-transform: uppercase;
    letter-spacing: .14em;
  }

  /* ---------- kirjautuminen ---------- */
  #login-view {
    min-height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: var(--navy);
    background-image:
      radial-gradient(circle at 74% 24%, rgba(92, 151, 255, .14), transparent 40%),
      linear-gradient(135deg, rgba(1, 90, 255, .10), transparent 52%),
      repeating-linear-gradient(135deg, rgba(240, 242, 246, .035) 0 1px, transparent 1px 18px);
  }
  .login-card {
    background: var(--card);
    width: 100%;
    max-width: 430px;
    padding: 44px 40px;
    border-top: 3px solid var(--blue);
    box-shadow: 0 30px 70px -30px rgba(0, 0, 0, .8);
  }
  .login-card img.logo { height: 30px; width: auto; display: block; margin-bottom: 26px; }
  .login-card .eyebrow { font-size: 12.5px; color: var(--blue); font-weight: 600; margin-bottom: 10px; }
  .login-card h1 { margin: 0 0 6px 0; font-size: 24px; font-weight: 700; letter-spacing: -.02em; }
  .login-card .sub { color: var(--steel); font-size: 15px; margin: 0 0 28px 0; line-height: 1.5; }
  .login-card label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px; }
  .login-card input {
    width: 100%;
    padding: 14px;
    border: 1px solid var(--line-strong);
    font-size: 16px;
    background: #fff;
  }
  .login-card input:focus { outline: 2px solid var(--blue); outline-offset: -1px; }
  .login-card button {
    width: 100%;
    margin-top: 20px;
    padding: 15px;
    background: var(--blue);
    color: #fff;
    border: 0;
    font-weight: 600;
    font-size: 16px;
  }
  .login-card button:hover { background: var(--blue-hover); }
  .login-card button:disabled { opacity: .6; cursor: default; }
  #login-error { color: var(--err); font-size: 14.5px; margin-top: 14px; min-height: 20px; }

  /* ---------- sovellus ---------- */
  #app-view { display: none; min-height: 100%; }
  header.topbar {
    position: sticky;
    top: 0;
    z-index: 20;
    background: var(--navy);
    background-image: repeating-linear-gradient(135deg, rgba(240, 242, 246, .03) 0 1px, transparent 1px 16px);
    color: #F0F2F6;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 0 24px;
    height: 62px;
    border-bottom: 2px solid var(--blue);
  }
  header.topbar .brand { display: flex; flex-direction: column; gap: 2px; white-space: nowrap; }
  header.topbar .brand .b1 { font-weight: 700; font-size: 15.5px; letter-spacing: -.01em; }
  header.topbar .brand .b2 { font-size: 11px; color: #9AA6BD; }
  header.topbar .spacer { flex: 1; }
  header.topbar img.logo { height: 26px; width: auto; display: block; margin-left: 6px; }
  #dirty-pill {
    display: none;
    font-size: 11.5px;
    color: #FFB000;
    border: 1px solid rgba(255, 176, 0, .45);
    padding: 5px 10px;
    white-space: nowrap;
    font-weight: 600;
  }
  .btn {
    border: 1px solid transparent;
    padding: 10px 18px;
    font-weight: 600;
    font-size: 14.5px;
    white-space: nowrap;
  }
  .btn-primary { background: var(--blue); color: #fff; }
  .btn-primary:hover { background: var(--blue-hover); }
  .btn-primary:disabled { opacity: .5; cursor: default; }
  .btn-ghost { background: transparent; color: #C7D0E0; border-color: rgba(199, 208, 224, .35); }
  .btn-ghost:hover { color: #fff; border-color: #fff; }
  .btn-ghost:disabled { opacity: .5; cursor: default; }

  .layout { display: flex; min-height: calc(100vh - 62px); }
  nav.side {
    width: 236px;
    flex: none;
    background: #fff;
    border-right: 1px solid var(--line);
    padding: 22px 0;
  }
  nav.side .nav-title { font-size: 11px; color: var(--steel-light); font-weight: 600; padding: 0 24px 12px 24px; }
  nav.side button {
    display: block;
    width: 100%;
    text-align: left;
    background: transparent;
    border: 0;
    padding: 13px 24px;
    font-size: 15.5px;
    font-weight: 500;
    color: #28303C;
    border-left: 3px solid transparent;
  }
  nav.side button:hover { color: var(--blue); }
  nav.side button.active {
    color: var(--blue-dark);
    font-weight: 700;
    border-left-color: var(--blue);
    background: rgba(1, 90, 255, .06);
  }

  main.content { flex: 1; padding: 34px 36px 100px 36px; max-width: 1020px; }
  main.content .page-eyebrow { font-size: 12.5px; color: var(--blue); font-weight: 600; margin: 0 0 10px 0; }
  main.content h2.page-title { margin: 0 0 6px 0; font-size: 30px; font-weight: 700; letter-spacing: -.02em; }
  main.content .page-desc { color: var(--steel); font-size: 15px; margin: 0 0 28px 0; max-width: 640px; line-height: 1.55; }

  .group {
    background: var(--card);
    border: 1px solid var(--line);
    border-top: 2px solid var(--navy);
    padding: 26px 26px 20px 26px;
    margin-bottom: 22px;
  }
  .group > h3 { margin: 0 0 4px 0; font-size: 18px; font-weight: 700; letter-spacing: -.01em; }
  .group > .group-desc { color: var(--steel); font-size: 13.5px; margin: 0 0 18px 0; line-height: 1.5; }
  .group > h3 + .field, .group > h3 + div { margin-top: 18px; }

  .field { margin-bottom: 18px; }
  .field > label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 7px; color: #28303C; }
  .field .hint { font-weight: 400; color: var(--steel-light); }
  .field input[type=text], .field input[type=number], .field textarea {
    width: 100%;
    padding: 12px 13px;
    border: 1px solid var(--line-strong);
    font-size: 15.5px;
    background: #fff;
  }
  .field input[type=number] { max-width: 140px; }
  .field textarea { resize: vertical; min-height: 78px; line-height: 1.55; }
  .field input:focus, .field textarea:focus { outline: 2px solid var(--blue); outline-offset: -1px; }

  /* kytkin (checkbox) */
  .switch-row { display: flex; align-items: center; gap: 12px; cursor: pointer; user-select: none; }
  .switch-row input { position: absolute; opacity: 0; pointer-events: none; }
  .switch-track {
    width: 46px; height: 24px; flex: none;
    background: #C6CEDD;
    position: relative;
    transition: background .15s ease;
  }
  .switch-track::after {
    content: '';
    position: absolute;
    top: 3px; left: 3px;
    width: 18px; height: 18px;
    background: #fff;
    transition: left .15s ease;
  }
  .switch-row input:checked + .switch-track { background: var(--blue); }
  .switch-row input:checked + .switch-track::after { left: 25px; }
  .switch-row .switch-label { font-size: 15px; font-weight: 500; }

  .item-card {
    border: 1px solid var(--line);
    border-left: 3px solid var(--line-strong);
    padding: 18px;
    margin-bottom: 14px;
    background: #FAFBFD;
  }
  .item-card:hover { border-left-color: var(--blue); }
  .item-head { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
  .item-head .item-title { font-weight: 700; font-size: 13.5px; color: var(--blue-dark); flex: 1; }
  .icon-btn {
    border: 1px solid var(--line-strong);
    background: #fff;
    width: 32px;
    height: 32px;
    font-size: 15px;
    line-height: 1;
    color: #28303C;
    padding: 0;
  }
  .icon-btn:hover { border-color: var(--blue); color: var(--blue); }
  .icon-btn:disabled { opacity: .35; cursor: default; }
  .icon-btn.danger:hover { border-color: var(--err); color: var(--err); }
  .add-btn {
    border: 1px dashed rgba(1, 90, 255, .55);
    color: var(--blue);
    background: rgba(1, 90, 255, .04);
    padding: 12px 18px;
    font-weight: 600;
    font-size: 14.5px;
    width: 100%;
  }
  .add-btn:hover { background: rgba(1, 90, 255, .09); }

  .string-row { display: flex; gap: 8px; margin-bottom: 8px; align-items: flex-start; }
  .string-row input, .string-row textarea {
    flex: 1;
    padding: 11px 12px;
    border: 1px solid var(--line-strong);
    font-size: 15px;
    background: #fff;
  }
  .string-row textarea { min-height: 70px; resize: vertical; line-height: 1.55; }
  .string-row input:focus, .string-row textarea:focus { outline: 2px solid var(--blue); outline-offset: -1px; }

  /* kuvalista */
  .images-grid { display: flex; flex-wrap: wrap; gap: 12px; }
  .image-tile {
    width: 148px;
    border: 1px solid var(--line-strong);
    background: #fff;
  }
  .image-tile .thumb {
    height: 96px;
    background: var(--navy-2) center/cover no-repeat;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--steel-light);
    font-size: 11px;
    overflow: hidden;
  }
  .image-tile .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .image-tile .tile-actions { display: flex; border-top: 1px solid var(--line); }
  .image-tile .tile-actions button {
    flex: 1;
    border: 0;
    background: #fff;
    padding: 8px 0;
    font-size: 13px;
    color: #28303C;
  }
  .image-tile .tile-actions button + button { border-left: 1px solid var(--line); }
  .image-tile .tile-actions button:hover { color: var(--blue); background: rgba(1, 90, 255, .05); }
  .image-tile .tile-actions button.danger:hover { color: var(--err); background: rgba(176, 0, 32, .05); }
  .image-tile .tile-actions button:disabled { opacity: .35; cursor: default; }
  .upload-tile {
    width: 148px;
    height: 131px;
    border: 1px dashed rgba(1, 90, 255, .55);
    background: rgba(1, 90, 255, .04);
    color: var(--blue);
    font-weight: 600;
    font-size: 13.5px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .upload-tile:hover { background: rgba(1, 90, 255, .09); }
  .upload-tile:disabled { opacity: .6; cursor: default; }
  .upload-tile .plus { font-size: 24px; line-height: 1; font-weight: 400; }

  footer.app-footer {
    border-top: 1px solid var(--line);
    background: #fff;
    padding: 18px 36px;
    font-size: 13px;
    color: var(--steel);
    line-height: 1.55;
  }

  /* ---------- vahvistusikkuna ---------- */
  #modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 90;
    display: none;
    align-items: center;
    justify-content: center;
    background: rgba(14, 17, 22, .55);
    padding: 24px;
  }
  .modal {
    background: #fff;
    border-top: 3px solid var(--err);
    max-width: 460px;
    width: 100%;
    padding: 28px;
    box-shadow: 0 30px 70px -25px rgba(0, 0, 0, .6);
  }
  .modal h4 { margin: 0 0 8px 0; font-size: 18px; font-weight: 700; }
  .modal p { margin: 0 0 22px 0; color: var(--steel); font-size: 15px; line-height: 1.55; }
  .modal .modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
  .modal button { padding: 11px 20px; font-weight: 600; font-size: 14.5px; border: 1px solid var(--line-strong); background: #fff; }
  .modal button:hover { border-color: var(--navy); }
  .modal button.confirm { background: var(--err); border-color: var(--err); color: #fff; }
  .modal button.confirm:hover { background: #8f001a; }

  #toast {
    position: fixed;
    left: 50%;
    bottom: 28px;
    transform: translateX(-50%);
    z-index: 95;
    display: none;
    max-width: min(600px, calc(100vw - 40px));
    background: var(--navy);
    color: #fff;
    border-left: 3px solid var(--blue);
    padding: 15px 22px;
    font-size: 15px;
    box-shadow: 0 18px 44px -14px rgba(0, 0, 0, .5);
    line-height: 1.5;
  }
  #toast.ok { border-left-color: #27C46D; }
  #toast.err { border-left-color: #FF5C5C; }
  #toast a { color: #7FB0FF; font-weight: 600; }

  @media (max-width: 900px) {
    .layout { flex-direction: column; }
    nav.side { width: 100%; display: flex; overflow-x: auto; padding: 0; border-right: 0; border-bottom: 1px solid var(--line); }
    nav.side .nav-title { display: none; }
    nav.side button { width: auto; white-space: nowrap; border-left: 0; border-bottom: 3px solid transparent; padding: 13px 16px; }
    nav.side button.active { border-left: 0; border-bottom-color: var(--blue); background: transparent; }
    main.content { padding: 22px 16px 90px 16px; }
    header.topbar { flex-wrap: wrap; height: auto; padding: 10px 14px; row-gap: 8px; }
    header.topbar img.logo { display: none; }
  }
</style>
</head>
<body>

<div id="login-view">
  <div class="login-card">
    <img class="logo" src="https://saimajope.github.io/ppr/assets/ppr-mark.png" alt="PPR">
    <div class="lbl eyebrow">Sisällönhallinta</div>
    <h1>Kirjaudu sisään</h1>
    <p class="sub">Porvoon Paalurakenne Oy:n sivuston hallintapaneeli.</p>
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
    <div class="brand">
      <span class="b1">Sisällönhallinta</span>
      <span class="b2">Porvoon Paalurakenne Oy</span>
    </div>
    <div class="spacer"></div>
    <span id="dirty-pill" class="lbl">Tallentamattomia muutoksia</span>
    <button class="btn btn-ghost" id="discard-btn" style="display:none">Hylkää muutokset</button>
    <button class="btn btn-ghost" id="preview-btn">Esikatselu</button>
    <button class="btn btn-primary" id="save-btn" disabled>Tallenna muutokset</button>
    <button class="btn btn-ghost" id="logout-btn">Kirjaudu ulos</button>
    <img class="logo" src="https://saimajope.github.io/ppr/assets/ppr-mark-white.png" alt="PPR">
  </header>
  <div class="layout">
    <nav class="side" id="side-nav">
      <div class="nav-title lbl">Sivut</div>
    </nav>
    <main class="content" id="content-area"></main>
  </div>
  <footer class="app-footer">
    Palautushistoria: jokainen tallennus säilyy sivuston versionhistoriassa (Git), joten aiempi
    versio voidaan aina palauttaa. Palautukset hoitaa ylläpito.
  </footer>
</div>

<div id="modal-overlay">
  <div class="modal" role="dialog" aria-modal="true">
    <h4 id="modal-title">Vahvista</h4>
    <p id="modal-text"></p>
    <div class="modal-actions">
      <button type="button" id="modal-cancel">Peruuta</button>
      <button type="button" class="confirm" id="modal-confirm">Poista</button>
    </div>
  </div>
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

var IMAGES_HINT = 'Yksi kuva näkyy sellaisenaan. Kaksi tai useampi kuva vaihtuu automaattisesti kuvaesityksenä.';

/* ------------------------------ skeema ------------------------------ */

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
        { path: 'etusivu.hero.images', label: 'Yläbannerin kuvat', type: 'images', hint: IMAGES_HINT },
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
        desc: 'Varsinaiset osoitteet ja puhelinnumerot muokataan Yleiset-välilehdellä.',
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
              { key: 'images', label: 'Kuvat', type: 'images', hint: IMAGES_HINT },
              { key: 'shot', label: 'Kuvapaikan teksti', type: 'text', hint: 'näkyy vain jos kuvia ei ole' }
            ],
            blank: { title: '', desc: '', shot: '', bullets: [], images: [] }
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
          { path: 'yritys.expertise.images', label: 'Kuvat', type: 'images', hint: IMAGES_HINT },
          { path: 'yritys.expertise.photoCaption', label: 'Kuvapaikan teksti', type: 'text', hint: 'näkyy vain jos kuvia ei ole' }
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
          { path: 'yritys.career.images', label: 'Kuvat', type: 'images', hint: IMAGES_HINT },
          { path: 'yritys.career.photoCaption', label: 'Kuvapaikan teksti', type: 'text', hint: 'näkyy vain jos kuvia ei ole' }
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
          { path: 'referenssit.filters.countSuffix', label: 'Lukumäärän pääte', type: 'text', hint: 'esim. "kohdetta", jolloin sivulla lukee "9 kohdetta"' }
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
              { key: 'images', label: 'Kuvat', type: 'images', hint: IMAGES_HINT },
              { key: 'shot', label: 'Kuvapaikan teksti', type: 'text', hint: 'näkyy vain jos kuvia ei ole' }
            ],
            blank: { sector: '', title: '', scope: '', loc: '', year: '', shot: '', images: [] }
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
    desc: 'Yhteystiedot-sivun sisältö. Osoitteet ja puhelinnumerot muokataan Yleiset-välilehdellä.',
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
              { key: 'phone', label: 'Puhelin', type: 'text', hint: 'esim. "0400 714 532", soittolinkki muodostuu automaattisesti' },
              { key: 'email', label: 'Sähköposti', type: 'text' }
            ],
            blank: { name: '', role: '', phone: '', email: '' }
          }
        ]
      },
      {
        title: 'Laskutus-osion otsikot',
        desc: 'Varsinaiset laskutustiedot muokataan Yleiset-välilehdellä.',
        fields: [
          { path: 'yhteystiedot.invoicing.eyebrow', label: 'Pieni yläotsikko', type: 'text' },
          { path: 'yhteystiedot.invoicing.title', label: 'Otsikko', type: 'text' }
        ]
      }
    ]
  },
  {
    id: 'common',
    title: 'Yleiset',
    desc: 'Nämä tiedot näkyvät kaikilla sivuilla: yläpalkissa, alatunnisteessa, yhteystiedoissa ja laskutusosioissa. Muutos päivittyy kerralla joka paikkaan.',
    groups: [
      {
        title: 'Yläpalkki',
        desc: 'Sivun ylälaidan tumma palkki, jossa näkyvät yrityksen nimi, toimiston numero ja päivystysnumero. Tekstit tulevat alla olevista Toimisto- ja Varikko-kentistä.',
        fields: [
          { path: 'common.topbar.visible', label: 'Näytä yläpalkki sivustolla', type: 'checkbox' }
        ]
      },
      {
        title: 'Kuvaesitys',
        desc: 'Koskee kaikkia sivuston kuvaesityksiä (kohdat, joihin on lisätty vähintään kaksi kuvaa).',
        fields: [
          { path: 'common.slideshow.intervalSeconds', label: 'Kuvan vaihtumisväli sekunneissa', type: 'number', min: 2, max: 60, hint: 'esim. 5 tai 10' }
        ]
      },
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
        desc: 'Sivuston ylävalikon ja alatunnisteen linkkitekstit. Sivujen osoitteet eivät muutu.',
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

/* Oma vahvistusikkuna selaimen confirm()-ruudun tilalle. */
var modalResolve = null;
function confirmDialog(text, confirmLabel) {
  return new Promise(function (resolve) {
    modalResolve = resolve;
    $('modal-text').textContent = text;
    $('modal-confirm').textContent = confirmLabel || 'Poista';
    $('modal-overlay').style.display = 'flex';
    $('modal-cancel').focus();
  });
}
function closeModal(result) {
  $('modal-overlay').style.display = 'none';
  if (modalResolve) { modalResolve(result); modalResolve = null; }
}
$('modal-confirm').addEventListener('click', function () { closeModal(true); });
$('modal-cancel').addEventListener('click', function () { closeModal(false); });
$('modal-overlay').addEventListener('click', function (e) {
  if (e.target === $('modal-overlay')) closeModal(false);
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && $('modal-overlay').style.display === 'flex') closeModal(false);
});

function apiError(res, fallback) {
  return res.json().then(function (data) {
    return (data && data.error) || fallback;
  }).catch(function () { return fallback; });
}

/* Yhteinen kuvanlatain. Palauttaa polun assets-kansiossa. */
function uploadFile(file) {
  return new Promise(function (resolve, reject) {
    if (!/\.(jpe?g|png|webp)$/i.test(file.name)) {
      return reject(new Error('Sallitut tiedostomuodot ovat JPG, PNG ja WEBP.'));
    }
    if (file.size > 2 * 1024 * 1024) {
      return reject(new Error('Kuva on liian suuri. Enimmäiskoko on 2 Mt.'));
    }
    var reader = new FileReader();
    reader.onerror = function () { reject(new Error('Kuvatiedostoa ei voitu lukea.')); };
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
        state.localImages[data.path] = dataUrl;
        resolve(data.path);
      }).catch(reject);
    };
    reader.readAsDataURL(file);
  });
}

function thumbSrc(path) {
  return state.localImages[path] || (SITE_URL + path);
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

  var eyebrow = document.createElement('div');
  eyebrow.className = 'lbl page-eyebrow';
  eyebrow.textContent = panel.id === 'common' ? 'Kaikki sivut' : 'Sivu';
  area.appendChild(eyebrow);

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
    hint.textContent = ' (' + field.hint + ')';
    label.appendChild(hint);
  }
  return label;
}

function renderField(field) {
  var wrap = document.createElement('div');
  wrap.className = 'field';

  if (field.type === 'checkbox') {
    var row = document.createElement('label');
    row.className = 'switch-row';
    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = getPath(state.data, field.path) !== false;
    var track = document.createElement('span');
    track.className = 'switch-track';
    var text = document.createElement('span');
    text.className = 'switch-label';
    text.textContent = field.label;
    cb.addEventListener('change', function () {
      setPath(state.data, field.path, cb.checked);
      markDirty();
    });
    row.appendChild(cb);
    row.appendChild(track);
    row.appendChild(text);
    wrap.appendChild(row);
    return wrap;
  }

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

  if (field.type === 'number') {
    var num = document.createElement('input');
    num.type = 'number';
    if (field.min != null) num.min = field.min;
    if (field.max != null) num.max = field.max;
    var val = Number(getPath(state.data, field.path));
    num.value = isFinite(val) && val > 0 ? val : '';
    num.addEventListener('input', function () {
      var n = Number(num.value);
      if (isFinite(n) && n > 0) {
        if (field.min != null) n = Math.max(field.min, n);
        if (field.max != null) n = Math.min(field.max, n);
        setPath(state.data, field.path, n);
        markDirty();
      }
    });
    wrap.appendChild(num);
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

  if (field.type === 'images') {
    wrap.appendChild(renderImagesInto(
      function () {
        var a = getPath(state.data, field.path);
        if (!Array.isArray(a)) { a = []; setPath(state.data, field.path, a); }
        return a;
      },
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
        confirmDialog('Poistetaanko tämä ' + (field.itemLabel || 'rivi') + '?').then(function (ok) {
          if (!ok) return;
          var a = getArr();
          a.splice(i, 1);
          setArr(a);
          markDirty();
          redraw();
        });
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

/* Kuvalista: pikkukuvat + järjestys + poisto + lataus. */
function renderImagesInto(getArr, field) {
  var container = document.createElement('div');

  function redraw() {
    container.innerHTML = '';
    var grid = document.createElement('div');
    grid.className = 'images-grid';
    var arr = getArr();

    arr.forEach(function (path, i) {
      var tile = document.createElement('div');
      tile.className = 'image-tile';

      var thumb = document.createElement('div');
      thumb.className = 'thumb';
      var img = document.createElement('img');
      img.alt = '';
      img.src = thumbSrc(path);
      img.onerror = function () { thumb.textContent = 'Ei esikatselua'; };
      thumb.appendChild(img);
      tile.appendChild(thumb);

      var actions = document.createElement('div');
      actions.className = 'tile-actions';
      var left = document.createElement('button');
      left.type = 'button';
      left.textContent = '←';
      left.title = 'Siirrä aiemmaksi';
      left.disabled = i === 0;
      left.addEventListener('click', function () { swap(i, i - 1); });
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'danger';
      del.textContent = '✕';
      del.title = 'Poista kuva';
      del.addEventListener('click', function () {
        confirmDialog('Poistetaanko tämä kuva?').then(function (ok) {
          if (!ok) return;
          getArr().splice(i, 1);
          markDirty();
          redraw();
        });
      });
      var right = document.createElement('button');
      right.type = 'button';
      right.textContent = '→';
      right.title = 'Siirrä myöhemmäksi';
      right.disabled = i === arr.length - 1;
      right.addEventListener('click', function () { swap(i, i + 1); });
      actions.appendChild(left);
      actions.appendChild(del);
      actions.appendChild(right);
      tile.appendChild(actions);

      grid.appendChild(tile);
    });

    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';
    fileInput.multiple = true;
    fileInput.style.display = 'none';

    var addTile = document.createElement('button');
    addTile.type = 'button';
    addTile.className = 'upload-tile';
    addTile.innerHTML = '<span class="plus">+</span><span>Lisää kuva</span>';
    addTile.addEventListener('click', function () { fileInput.click(); });

    fileInput.addEventListener('change', function () {
      var files = Array.prototype.slice.call(fileInput.files || []);
      if (!files.length) return;
      addTile.disabled = true;
      addTile.innerHTML = '<span>Ladataan…</span>';
      var chain = Promise.resolve();
      files.forEach(function (file) {
        chain = chain.then(function () {
          return uploadFile(file).then(function (path) {
            getArr().push(path);
            markDirty();
          });
        });
      });
      chain.then(function () {
        redraw();
        showToast('Kuvat ladattu. Muista tallentaa muutokset, jotta ne tulevat näkyviin.', 'ok');
      }).catch(function (err) {
        redraw();
        showToast(err.message || 'Kuvan lataus epäonnistui.', 'err');
      });
    });

    grid.appendChild(addTile);
    grid.appendChild(fileInput);
    container.appendChild(grid);
  }

  function swap(i, j) {
    var arr = getArr();
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
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
      title.className = 'item-title lbl';
      title.textContent = (field.itemLabel || 'Rivi') + ' ' + (i + 1) +
        (item.title || item.name ? ': ' + (item.title || item.name) : '');
      head.appendChild(title);
      head.appendChild(moveBtn('↑', i === 0, function () { swap(i, i - 1); }));
      head.appendChild(moveBtn('↓', i === arr.length - 1, function () { swap(i, i + 1); }));
      head.appendChild(removeBtn(function () {
        var name = item.title || item.name || ((field.itemLabel || 'rivi') + ' ' + (i + 1));
        confirmDialog('Poistetaanko "' + name + '"? Poisto tulee voimaan kun tallennat muutokset.').then(function (ok) {
          if (!ok) return;
          arr.splice(i, 1);
          markDirty();
          redraw();
        });
      }));
      card.appendChild(head);

      field.fields.forEach(function (sub) {
        var f = document.createElement('div');
        f.className = 'field';
        if (sub.type === 'image') {
          f.appendChild(fieldLabel(sub));
          f.appendChild(renderImageControl(item, sub, redraw));
        } else if (sub.type === 'images') {
          f.appendChild(fieldLabel(sub));
          f.appendChild(renderImagesInto(
            function () {
              if (!Array.isArray(item[sub.key])) item[sub.key] = [];
              return item[sub.key];
            },
            sub
          ));
        } else if (sub.type === 'strings') {
          f.appendChild(fieldLabel(sub));
          f.appendChild(renderStringsInto(
            function () { if (!Array.isArray(item[sub.key])) item[sub.key] = []; return item[sub.key]; },
            function (a) { item[sub.key] = a; },
            sub
          ));
        } else {
          f.appendChild(fieldLabel(sub));
          var input = document.createElement(sub.type === 'textarea' ? 'textarea' : 'input');
          if (sub.type !== 'textarea') input.type = 'text';
          input.value = String(item[sub.key] == null ? '' : item[sub.key]);
          input.addEventListener('input', function () {
            item[sub.key] = input.value;
            markDirty();
            if (sub.key === 'title' || sub.key === 'name') {
              title.textContent = (field.itemLabel || 'Rivi') + ' ' + (i + 1) + (input.value ? ': ' + input.value : '');
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

/* Yksittäinen kuva (sertifikaattilogot). */
function renderImageControl(item, sub, redraw) {
  var wrap = document.createElement('div');
  wrap.className = 'images-grid';

  var current = String(item[sub.key] || '');

  if (current) {
    var tile = document.createElement('div');
    tile.className = 'image-tile';
    var thumb = document.createElement('div');
    thumb.className = 'thumb';
    thumb.style.background = '#fff';
    var img = document.createElement('img');
    img.alt = '';
    img.style.objectFit = 'contain';
    img.src = thumbSrc(current);
    img.onerror = function () { thumb.textContent = 'Ei esikatselua'; };
    thumb.appendChild(img);
    tile.appendChild(thumb);
    wrap.appendChild(tile);
  }

  var fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';
  fileInput.style.display = 'none';

  var addTile = document.createElement('button');
  addTile.type = 'button';
  addTile.className = 'upload-tile';
  addTile.innerHTML = '<span class="plus">+</span><span>' + (current ? 'Vaihda kuva' : 'Lisää kuva') + '</span>';
  addTile.addEventListener('click', function () { fileInput.click(); });

  fileInput.addEventListener('change', function () {
    var file = fileInput.files && fileInput.files[0];
    if (!file) return;
    addTile.disabled = true;
    addTile.innerHTML = '<span>Ladataan…</span>';
    uploadFile(file).then(function (path) {
      item[sub.key] = path;
      markDirty();
      redraw();
      showToast('Kuva ladattu. Muista tallentaa muutokset, jotta se tulee näkyviin.', 'ok');
    }).catch(function (err) {
      redraw();
      showToast(err.message || 'Kuvan lataus epäonnistui.', 'err');
    });
  });

  wrap.appendChild(addTile);
  wrap.appendChild(fileInput);
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
  confirmDialog('Hylätäänkö kaikki tallentamattomat muutokset?', 'Hylkää muutokset').then(function (ok) {
    if (ok) loadContent();
  });
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
