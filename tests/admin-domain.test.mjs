import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createHmac } from 'node:crypto';
import worker from '../worker/src/index.js';
import { escapeHtmlAttribute, normalizeSiteUrl, renderAdminHtml } from '../worker/src/ui.js';

const siteRoots = [
  ['https://saimajope.github.io/ppr', 'https://saimajope.github.io/ppr/'],
  ['https://ppr.fi', 'https://ppr.fi/'],
  ['https://www.ppr.fi/', 'https://www.ppr.fi/']
];
const adminRoot = 'https://ppr-admin.example.workers.dev/';
const baseEnv = { SESSION_SECRET: 'local-test-only' };

function authenticatedPreview(page, language, content = {}) {
  const expires = Date.now() + 60000;
  const token = expires + '.' + createHmac('sha256', baseEnv.SESSION_SECRET)
    .update('ppr-session.' + expires).digest('hex');
  const form = new FormData();
  form.set('page', page);
  form.set('language', language);
  form.set('content', JSON.stringify({ ...content, locale: language }));
  return new Request(new URL('./preview', adminRoot), {
    method: 'POST', headers: { cookie: 'ppr_session=' + token }, body: form
  });
}

test('admin uses the configured public host for every site asset and site link', async () => {
  for (const [configured, normalized] of siteRoots) {
    const response = await worker.fetch(new Request(adminRoot), { ...baseEnv, SITE_URL: configured });
    assert.equal(response.status, 200);
    const html = await response.text();
    const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
    new vm.Script(script);
    const assignment = script.match(/var SITE_URL = [^\n]+;/)[0];
    assert.equal(vm.runInNewContext(assignment + 'SITE_URL;'), normalized);
    const siteAssets = [...html.matchAll(/(?:src|href)="([^"]*assets\/[^\"]+)"/g)].map(match => match[1]);
    assert.equal(siteAssets.length, 4);
    for (const asset of siteAssets) assert.ok(asset.startsWith(normalized + 'assets/'), asset);
    for (const path of ['api/content', 'api/login', 'api/logout', 'api/upload']) {
      assert.ok(script.includes("fetch('./" + path));
      assert.equal(new URL('./' + path, adminRoot).origin, new URL(adminRoot).origin);
    }
    assert.ok(html.includes('action="./preview"'));
    assert.ok(script.includes('SITE_URL + \'?lang=\''));
    assert.ok(script.includes('SITE_URL + path'));
  }
});

test('public URL normalization and context escaping preserve safe configuration', () => {
  assert.equal(normalizeSiteUrl(), 'https://ppr.fi/');
  assert.equal(normalizeSiteUrl('http://localhost:8765/ppr?lang=en#photos'), 'http://localhost:8765/ppr/');
  assert.throws(() => normalizeSiteUrl('javascript:alert(1)'));
  assert.equal(escapeHtmlAttribute('"<&>'), '&quot;&lt;&amp;&gt;');
  const html = renderAdminHtml('https://example.test/a&b/');
  assert.ok(html.includes('href="https://example.test/a&amp;b/assets/favicon.png"'));
  const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
  new vm.Script(script);
  const assignment = script.match(/var SITE_URL = [^\n]+;/)[0];
  assert.equal(vm.runInNewContext(assignment + 'SITE_URL;'), 'https://example.test/a&b/');
});

test('preview keeps both public base paths, every page, and each selected language', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(url);
    const page = new URL(url).pathname.split('/').pop();
    return new Response(fs.readFileSync(new URL('../' + page, import.meta.url), 'utf8'));
  };
  try {
    for (const [configured, normalized] of siteRoots) {
      for (const page of ['Etusivu', 'Palvelut', 'Yritys', 'Referenssit', 'Yhteystiedot']) {
        for (const language of ['fi', 'en', 'sv']) {
          const response = await worker.fetch(authenticatedPreview(page, language), { ...baseEnv, SITE_URL: configured });
          assert.equal(response.status, 200);
          assert.equal(calls.at(-1), normalized + page + '.dc.html?lang=' + language);
          const html = await response.text();
          assert.ok(html.includes('<base href="' + normalized + '">'));
          assert.ok(html.includes('window.__pprPreviewLanguage="' + language + '"'));
          assert.ok(html.indexOf('window.__pprPreviewContent=') < html.indexOf('./language.js'));
          assert.equal(new URL('./assets/favicon.png', normalized).href, normalized + 'assets/favicon.png');
          assert.equal(response.headers.get('x-robots-tag'), 'noindex');
          const previewScript=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(match=>match[1]).find(script=>script.includes('window.__pprPreviewLanguage='));
          assert.ok(previewScript,'preview flags must exist before shared routing runs');
          const location=new URL('./preview',adminRoot);
          location.replace=()=>assert.fail('admin preview must not redirect to the public clean route');
          const key=page.toLowerCase();
          const context={URL,URLSearchParams,location,document:{baseURI:normalized,documentElement:{dataset:{pprPage:key},getAttribute(name){return name==='data-ppr-page'?key:null}},head:{appendChild(){}},createElement(){return {}},querySelector(){return null}},localStorage:{getItem(){return 'en'},setItem(){assert.fail('preview must not change remembered public locale');}}};
          context.window=context;
          vm.runInNewContext(previewScript,context);
          vm.runInNewContext(fs.readFileSync(new URL('../language.js',import.meta.url),'utf8'),context);
          assert.equal(context.pprLanguage,language);assert.equal(context.pprPage,key);
          assert.equal(context.pprLocalizeContent('#billing'),new URL('#billing',location).href);
          for(const href of Object.values(context.pprPageLinks)) {
            const target=new URL(href,normalized);
            assert.equal(target.origin,new URL(normalized).origin);
            assert.ok(target.pathname.startsWith(new URL(normalized).pathname));
            assert.equal(target.searchParams.get('lang'),language==='fi'?null:language);
            assert.ok(!target.pathname.endsWith('.html'));
          }
        }
      }
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('admin routes remain on the Worker and previews require its session', async () => {
  assert.equal((await worker.fetch(new Request(new URL('./preview', adminRoot), { method: 'POST' }), baseEnv)).status, 401);
  assert.equal((await worker.fetch(new Request(new URL('./ppr/', adminRoot)), baseEnv)).status, 401);
});
