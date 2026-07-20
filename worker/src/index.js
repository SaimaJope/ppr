// PPR sisällönhallinta — yksi Cloudflare Worker, ei riippuvuuksia.
//
// Reitit:
//   GET  /             hallintapaneelin käyttöliittymä (kirjautuminen hoidetaan selaimessa)
//   POST /api/login    { password } -> asettaa allekirjoitetun istuntoevästeen (24 h)
//   POST /api/logout   poistaa evästeen
//   GET  /api/content  hakee content/fi.json:n GitHubista -> { content, sha }
//   PUT  /api/content  { content, sha } -> committaa fi.json:n main-haaraan
//   POST /api/upload   { filename, dataBase64 } -> committaa kuvan assets/-kansioon
//   POST /preview      lomake-POST { page, content } -> live-sivu esikatseluna
//                      pending-sisällöllä (uusi välilehti)
//
// GITHUB_TOKEN ei koskaan päädy selaimeen: kaikki GitHub-kutsut tehdään täällä.

import { ADMIN_HTML } from './ui.js';

const SESSION_COOKIE = 'ppr_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 h
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 min
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 Mt
const PREVIEW_PAGES = ['Etusivu', 'Palvelut', 'Yritys', 'Referenssit', 'Ura', 'Yhteystiedot'];
const CONTENT_TOP_KEYS = ['common', 'etusivu', 'palvelut', 'yritys', 'referenssit', 'ura', 'yhteystiedot'];

// Parhaan yrityksen kirjautumisrajoitin. Tila on isolate-kohtainen (nollautuu
// kun Worker kierrätetään), mikä riittää hidastamaan arvailun; varsinainen
// suoja on vahva salasana + epäonnistumisviive alla.
const loginAttempts = new Map(); // ip -> { count, resetAt }

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/' && request.method === 'GET') {
        return htmlResponse(ADMIN_HTML);
      }
      if (url.pathname === '/api/login' && request.method === 'POST') {
        return handleLogin(request, env);
      }
      if (url.pathname === '/api/logout' && request.method === 'POST') {
        return jsonResponse({ ok: true }, 200, {
          'set-cookie': SESSION_COOKIE + '=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
        });
      }

      // Kaikki loput vaativat voimassa olevan istunnon.
      if (!(await hasValidSession(request, env))) {
        return jsonResponse({ error: 'Kirjautuminen vaaditaan.' }, 401);
      }
      if (url.pathname === '/api/content' && request.method === 'GET') {
        return handleGetContent(env);
      }
      if (url.pathname === '/api/content' && request.method === 'PUT') {
        return handlePutContent(request, env);
      }
      if (url.pathname === '/api/upload' && request.method === 'POST') {
        return handleUpload(request, env);
      }
      if (url.pathname === '/preview' && request.method === 'POST') {
        return handlePreview(request, env);
      }
      return new Response('Not found', { status: 404 });
    } catch (err) {
      console.error(err);
      return jsonResponse({ error: 'Palvelinvirhe. Yritä hetken kuluttua uudelleen.' }, 500);
    }
  }
};

/* ---------------------------------- auth ---------------------------------- */

async function handleLogin(request, env) {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const now = Date.now();

  let entry = loginAttempts.get(ip);
  if (entry && now > entry.resetAt) entry = undefined;
  if (entry && entry.count >= MAX_LOGIN_ATTEMPTS) {
    const minutes = Math.max(1, Math.ceil((entry.resetAt - now) / 60000));
    return jsonResponse(
      { error: 'Liian monta kirjautumisyritystä. Yritä uudelleen ' + minutes + ' minuutin kuluttua.' },
      429
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Virheellinen pyyntö.' }, 400);
  }

  const ok = env.ADMIN_PASSWORD && (await timingSafeEqualStrings(String(body.password || ''), env.ADMIN_PASSWORD));
  if (!ok) {
    entry = entry || { count: 0, resetAt: now + LOGIN_WINDOW_MS };
    entry.count += 1;
    loginAttempts.set(ip, entry);
    await sleep(400); // hidastaa arvailua
    return jsonResponse({ error: 'Väärä salasana.' }, 401);
  }

  loginAttempts.delete(ip);
  const token = await makeSessionToken(env);
  return jsonResponse({ ok: true }, 200, {
    'set-cookie':
      SESSION_COOKIE + '=' + token +
      '; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=' + Math.floor(SESSION_TTL_MS / 1000)
  });
}

async function makeSessionToken(env) {
  const expires = Date.now() + SESSION_TTL_MS;
  return expires + '.' + (await hmacHex(env.SESSION_SECRET, 'ppr-session.' + expires));
}

async function hasValidSession(request, env) {
  if (!env.SESSION_SECRET) return false;
  const cookies = request.headers.get('cookie') || '';
  const match = cookies.match(new RegExp('(?:^|;\\s*)' + SESSION_COOKIE + '=([^;]+)'));
  if (!match) return false;
  const [expiresStr, signature] = match[1].split('.');
  const expires = Number(expiresStr);
  if (!expires || Date.now() > expires) return false;
  const expected = await hmacHex(env.SESSION_SECRET, 'ppr-session.' + expires);
  return timingSafeEqualHex(signature || '', expected);
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return toHex(new Uint8Array(sig));
}

async function timingSafeEqualStrings(a, b) {
  // Hashataan molemmat samaan pituuteen, jotta vertailu on vakioaikainen
  // myös eri pituisilla syötteillä.
  const ha = await sha256Bytes(a);
  const hb = await sha256Bytes(b);
  return constantTimeEqual(ha, hb);
}

function timingSafeEqualHex(a, b) {
  return constantTimeEqual(new TextEncoder().encode(a), new TextEncoder().encode(b));
}

function constantTimeEqual(a, b) {
  if (a.byteLength !== b.byteLength) return false;
  if (crypto.subtle.timingSafeEqual) return crypto.subtle.timingSafeEqual(a, b);
  let diff = 0;
  for (let i = 0; i < a.byteLength; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function sha256Bytes(text) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
}

/* --------------------------------- content -------------------------------- */

async function handleGetContent(env) {
  const file = await githubGetFile(env, env.CONTENT_PATH);
  if (file.error) return jsonResponse({ error: file.error }, file.status || 502);
  let parsed;
  try {
    parsed = JSON.parse(file.text);
  } catch {
    return jsonResponse({ error: 'Sivuston sisältötiedosto on viallinen (ei kelvollista JSONia).' }, 500);
  }
  return jsonResponse({ content: parsed, sha: file.sha });
}

async function handlePutContent(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Virheellinen pyyntö.' }, 400);
  }
  const content = body.content;
  const sha = String(body.sha || '');
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return jsonResponse({ error: 'Virheellinen sisältö.' }, 400);
  }
  for (const key of CONTENT_TOP_KEYS) {
    if (!content[key] || typeof content[key] !== 'object') {
      return jsonResponse({ error: 'Sisällöstä puuttuu osio "' + key + '" – tallennus estetty varmuuden vuoksi.' }, 400);
    }
  }
  if (!sha) {
    return jsonResponse({ error: 'Tallennuksesta puuttuu versiotieto. Lataa sivu uudelleen.' }, 400);
  }

  const serialized = JSON.stringify(content, null, 2) + '\n';
  if (serialized.length > 900 * 1024) {
    return jsonResponse({ error: 'Sisältö on liian suuri tallennettavaksi.' }, 400);
  }

  const result = await githubPutFile(env, env.CONTENT_PATH, base64EncodeUtf8(serialized), 'Sisältöpäivitys hallintapaneelista', sha);
  if (result.error) return jsonResponse({ error: result.error }, result.status || 502);
  return jsonResponse({ ok: true, sha: result.sha });
}

/* --------------------------------- upload --------------------------------- */

const IMAGE_TYPES = {
  jpg: { magic: [[0xff, 0xd8, 0xff]] },
  jpeg: { magic: [[0xff, 0xd8, 0xff]] },
  png: { magic: [[0x89, 0x50, 0x4e, 0x47]] },
  webp: { magic: [[0x52, 0x49, 0x46, 0x46]] } // RIFF....WEBP
};

async function handleUpload(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Virheellinen pyyntö.' }, 400);
  }
  const filename = String(body.filename || 'kuva');
  const dataBase64 = String(body.dataBase64 || '').replace(/^data:[^;]+;base64,/, '');
  if (!dataBase64) return jsonResponse({ error: 'Kuvatiedosto puuttuu.' }, 400);

  const ext = (filename.toLowerCase().match(/\.([a-z0-9]+)$/) || [])[1] || '';
  if (!IMAGE_TYPES[ext]) {
    return jsonResponse({ error: 'Sallitut tiedostomuodot ovat JPG, PNG ja WEBP.' }, 400);
  }

  const approxBytes = Math.floor(dataBase64.length * 3 / 4);
  if (approxBytes > MAX_IMAGE_BYTES) {
    return jsonResponse({ error: 'Kuva on liian suuri. Enimmäiskoko on 2 Mt.' }, 400);
  }

  // Tarkistetaan tiedoston alku (magic bytes), jotta assets-kansioon ei voi
  // committata mielivaltaisia tiedostoja kuvina.
  let head;
  try {
    head = Uint8Array.from(atob(dataBase64.slice(0, 24)), (c) => c.charCodeAt(0));
  } catch {
    return jsonResponse({ error: 'Kuvatiedostoa ei voitu lukea.' }, 400);
  }
  const magicOk = IMAGE_TYPES[ext].magic.some((sig) => sig.every((b, i) => head[i] === b));
  const webpOk = ext !== 'webp' || (head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50);
  if (!magicOk || !webpOk) {
    return jsonResponse({ error: 'Tiedosto ei ole kelvollinen ' + ext.toUpperCase() + '-kuva.' }, 400);
  }

  const base = filename.replace(/\.[a-z0-9]+$/i, '');
  const slug = slugify(base) || 'kuva';
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
  const path = env.ASSETS_DIR + '/' + slug + '-' + stamp + '.' + (ext === 'jpeg' ? 'jpg' : ext);

  const result = await githubPutFile(env, path, dataBase64, 'Uusi kuva hallintapaneelista: ' + slug, null);
  if (result.error) return jsonResponse({ error: result.error }, result.status || 502);
  return jsonResponse({ ok: true, path });
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/* -------------------------------- esikatselu ------------------------------- */

async function handlePreview(request, env) {
  const form = await request.formData();
  const page = String(form.get('page') || 'Etusivu');
  if (!PREVIEW_PAGES.includes(page)) {
    return new Response('Tuntematon sivu', { status: 400 });
  }
  let content;
  try {
    content = JSON.parse(String(form.get('content') || ''));
  } catch {
    return new Response('Virheellinen sisältö', { status: 400 });
  }

  const liveUrl = env.SITE_URL + page + '.dc.html';
  const upstream = await fetch(liveUrl, { headers: { 'user-agent': 'ppr-admin-worker' } });
  if (!upstream.ok) {
    return new Response('Esikatselua ei voitu ladata (sivusto vastasi ' + upstream.status + ').', { status: 502 });
  }
  let html = await upstream.text();

  // <base> ohjaa sivun suhteelliset polut (support.js, kuvat, fontit)
  // takaisin julkiseen sivustoon.
  html = html.replace(/<head>/i, '<head><base href="' + env.SITE_URL + '">');

  // loader.js asettaa window.__pprContent -promisen; korvataan se heti perään
  // muokkaamattomalla pending-sisällöllä, jolloin sivu renderöityy siitä.
  const injected = JSON.stringify(content).replace(/</g, '\\u003c');
  html = html.replace(
    /<script src="\.\/loader\.js"><\/script>/i,
    '<script src="./loader.js"></script><script>window.__pprContent = Promise.resolve(' + injected + ');</script>'
  );

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'x-robots-tag': 'noindex',
      'cache-control': 'no-store'
    }
  });
}

/* ------------------------------- GitHub API -------------------------------- */

function githubHeaders(env) {
  const headers = {
    accept: 'application/vnd.github+json',
    'user-agent': 'ppr-admin-worker',
    'x-github-api-version': '2022-11-28'
  };
  // Ilman tokenia julkisen repon luku onnistuu silti (hyödyllinen wrangler dev
  // -testauksessa); tallennus vaatii aina GITHUB_TOKEN-salaisuuden.
  if (env.GITHUB_TOKEN) headers.authorization = 'Bearer ' + env.GITHUB_TOKEN;
  return headers;
}

function githubContentsUrl(env, path) {
  const base = env.GITHUB_API_BASE || 'https://api.github.com';
  return base + '/repos/' + env.GITHUB_OWNER + '/' + env.GITHUB_REPO + '/contents/' + path;
}

async function githubGetFile(env, path) {
  const res = await fetch(githubContentsUrl(env, path) + '?ref=' + env.GITHUB_BRANCH, {
    headers: githubHeaders(env)
  });
  if (!res.ok) return { error: githubErrorMessage(res.status, 'haku'), status: 502 };
  const data = await res.json();
  const bytes = Uint8Array.from(atob(String(data.content || '').replace(/\n/g, '')), (c) => c.charCodeAt(0));
  return { text: new TextDecoder().decode(bytes), sha: data.sha };
}

async function githubPutFile(env, path, contentBase64, message, sha) {
  const payload = {
    message: message,
    content: contentBase64,
    branch: env.GITHUB_BRANCH
  };
  if (sha) payload.sha = sha;
  const res = await fetch(githubContentsUrl(env, path), {
    method: 'PUT',
    headers: { ...githubHeaders(env), 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) return { error: githubErrorMessage(res.status, 'tallennus'), status: 502 };
  const data = await res.json();
  return { sha: data.content && data.content.sha };
}

function githubErrorMessage(status, operation) {
  if (status === 401 || status === 403) {
    return 'GitHub-yhteys epäonnistui: käyttöoikeus puuttuu tai token on vanhentunut. Ota yhteyttä ylläpitoon (GITHUB_TOKEN).';
  }
  if (status === 404) {
    return 'GitHub-yhteys epäonnistui: tiedostoa tai repositoriota ei löytynyt. Ota yhteyttä ylläpitoon.';
  }
  if (status === 409 || status === 422) {
    return 'Tallennus epäonnistui: sisältöä on muutettu toisaalla tällä välin. Lataa sivu uudelleen ja tee muutokset uudestaan.';
  }
  return 'GitHub-yhteys epäonnistui (' + operation + ', virhekoodi ' + status + '). Yritä hetken kuluttua uudelleen.';
}

/* --------------------------------- helpers --------------------------------- */

function base64EncodeUtf8(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

function toHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jsonResponse(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extraHeaders }
  });
}

function htmlResponse(html) {
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-frame-options': 'DENY',
      'referrer-policy': 'no-referrer',
      'x-content-type-options': 'nosniff'
    }
  });
}
