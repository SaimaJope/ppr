import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHmac} from 'node:crypto';
import worker from '../worker/src/index.js';
import {ADMIN_HTML} from '../worker/src/ui.js';
const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const locales=Object.fromEntries(['fi','sv','en'].map(l=>[l,JSON.parse(read('content/'+l+'.json'))]));
function leaves(v,path='',out={}) {
  if(v&&typeof v==='object') for(const [k,x] of Object.entries(v)) leaves(x,path+'/'+k,out);
  else out[path]=v;
  return out;
}
test('translations preserve schema, numbers, contact details and assets',()=>{
  const fi=leaves(locales.fi);
  for(const lang of ['sv','en']) {
    const other=leaves(locales[lang]);
    assert.deepEqual(Object.keys(other),Object.keys(fi));
    assert.equal(locales[lang].referenssit.projects.length,37);
    for(const [key,value] of Object.entries(fi)) {
      assert.equal(typeof other[key],typeof value,key);
      if(typeof value!=='string') continue;
      assert.deepEqual(value.match(/\d+/g),other[key].match(/\d+/g),lang+key+' numeric facts');
      if(!key.includes('/labels/') && /\/(?:phone|email|street|postalCity|businessId|ovt|operator|emailInvoice|paperLine1|paperLine2|img|url|whistleblowingUrl|ctaPrimaryHref|ctaSecondaryHref)$/.test(key)||value.startsWith('assets/')) assert.equal(other[key],value,key);
      if(value) assert.ok(other[key].trim(),key);
    }
    for(const person of locales.fi.yhteystiedot.team.members) assert.ok(locales[lang].yhteystiedot.team.members.some(p=>p.name===person.name&&p.email===person.email&&p.phone===person.phone));
  }
});
function languageContext(search='',saved=null,blocked=false,preview=null) {
  const attrs={};
  const context={URL,URLSearchParams,location:{href:'https://admin.test/preview',search,pathname:'/ppr/Palvelut.dc.html',hash:'#photos'},localStorage:{getItem(){if(blocked)throw Error();return saved},setItem(k,v){attrs.saved=v}},document:{baseURI:'https://example.test/ppr/Palvelut.dc.html',documentElement:{},head:{appendChild(){}},createElement(){return {}},querySelector(){return null}},__pprPreviewLanguage:preview};
  context.window=context;
  vm.runInNewContext(read('language.js'),context);
  return {context,attrs};
}
test('URL selection, remembered choice, defaults and blocked storage',()=>{
  for(const [search,saved,expected] of [['',null,'fi'],['','sv','sv'],['?lang=en','sv','en'],['?lang=fi','en','fi'],['?lang=xx','sv','fi'],['?lang=','en','fi']]) {
    const {context}=languageContext(search,saved);
    assert.equal(context.pprLanguage,expected);
    assert.equal(context.document.documentElement.lang,expected);
    for(const option of context.pprLanguageOptions) {
      const url=new URL(option.href);assert.equal(url.pathname,'/ppr/Palvelut.dc.html');assert.equal(url.hash,'#photos');assert.equal(url.searchParams.get('lang'),option.lang);
    }
  }
  assert.equal(languageContext('?lang=en',null,true).context.pprLanguage,'en');
  const {context,attrs}=languageContext('?lang=en','fi',false,'sv');
  assert.equal(context.pprLanguage,'sv');assert.equal(attrs.saved,undefined);
});
test('internal content links retain locale; external links and assets stay unchanged',()=>{
  const {context}=languageContext('?lang=sv');
  const result=context.pprLocalizeContent({a:'Palvelut.dc.html#photos',b:'https://external.test/',c:'assets/photo.jpg',d:'#billing'});
  assert.equal(result.a,'https://example.test/ppr/Palvelut.dc.html?lang=sv#photos');
  assert.equal(result.b,'https://external.test/');assert.equal(result.c,'assets/photo.jpg');assert.equal(result.d,'#billing');
  assert.equal(languageContext('',null,false,'sv').context.pprLocalizeContent('#billing'),'https://admin.test/preview#billing');
});
test('all templates use shared routing, translated controls and valid scripts',()=>{
  for(const page of ['Etusivu','Palvelut','Yritys','Referenssit','Yhteystiedot']) {
    const html=read(page+'.dc.html');
    assert.ok(html.indexOf('./language.js')<html.indexOf('./loader.js'));
    assert.ok(html.includes('data-language-switch'));
    assert.ok(html.includes('aria-label="{{ ui.menu }}"'));
    assert.ok(!/href="(?:Etusivu|Palvelut|Yritys|Referenssit|Yhteystiedot)\.dc\.html"/.test(html));
    for(const [,script] of html.matchAll(/<script[^>]*data-dc-script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(script);
  }
  new vm.Script(read('loader.js'));new vm.Script(read('language.js'));
  new vm.Script(ADMIN_HTML.match(/<script>([\s\S]*)<\/script>/)[1]);
  assert.ok(read('index.html').includes('target.search = location.search'));
});
const env={SESSION_SECRET:'test-only',CONTENT_PATH:'content/fi.json',GITHUB_OWNER:'example',GITHUB_REPO:'site',GITHUB_BRANCH:'main',SITE_URL:'https://example.test/ppr/'};
const expiry=Date.now()+600000;
const cookie='ppr_session='+expiry+'.'+createHmac('sha256',env.SESSION_SECRET).update('ppr-session.'+expiry).digest('hex');
function request(path,body,method='GET') {return new Request('https://admin.test'+path,{method,headers:{cookie,...(body&&!(body instanceof FormData)?{'content-type':'application/json'}:{})},...(body?{body:body instanceof FormData?body:JSON.stringify(body)}:{})});}
test('Worker reads and saves each language independently and rejects invalid locales',async()=>{
  const realFetch=globalThis.fetch;const calls=[];
  globalThis.fetch=async(url,init)=>{
    calls.push({url,init});
    if(init.method==='PUT')return Response.json({content:{sha:'updated'}});
    const lang=url.match(/content\/(fi|sv|en)\.json/)[1];
    return Response.json({sha:'sha-'+lang,content:Buffer.from(JSON.stringify(locales[lang])).toString('base64')});
  };
  try {
    for(const lang of ['fi','sv','en']) {
      const get=await worker.fetch(request('/api/content'+(lang==='fi'?'':'?lang='+lang)),env);
      const loaded=await get.json();assert.equal(get.status,200);assert.equal(loaded.language,lang);assert.equal(loaded.content.locale,lang);
      const body={content:structuredClone(locales[lang]),sha:loaded.sha,...(lang==='fi'?{}:{language:lang})};
      const put=await worker.fetch(request('/api/content',body,'PUT'),env);assert.equal(put.status,200);
      const last=calls.at(-1);assert.ok(last.url.endsWith('/content/'+lang+'.json'));
      assert.equal(JSON.parse(last.init.body).sha,'sha-'+lang);
      const saved=JSON.parse(Buffer.from(JSON.parse(last.init.body).content,'base64').toString());assert.equal(saved.locale,lang);assert.equal(saved.ura,undefined);
    }
    const count=calls.length;
    for(const bad of ['de','../fi','',null]) {
      assert.equal((await worker.fetch(request('/api/content?lang='+encodeURIComponent(bad)),env)).status,400);
      assert.equal((await worker.fetch(request('/api/content',{content:locales.fi,sha:'x',language:bad},'PUT'),env)).status,400);
    }
    assert.equal((await worker.fetch(request('/api/content',{content:locales.fi,sha:'x',language:'sv'},'PUT'),env)).status,400);
    assert.equal(calls.length,count);
    assert.equal((await worker.fetch(new Request('https://admin.test/api/content?lang=sv'),env)).status,401);
  }finally{globalThis.fetch=realFetch;}
});
test('preview injects selected pending content before versioned scripts and escapes HTML',async()=>{
  const realFetch=globalThis.fetch;
  globalThis.fetch=async url=>{assert.ok(url.endsWith('Palvelut.dc.html?lang=sv'));return new Response(read('Palvelut.dc.html'));};
  try {
    const form=new FormData();form.set('page','Palvelut');form.set('language','sv');
    const content=structuredClone(locales.sv);content.palvelut.hero.title='Pending </script><script>unsafe</script>';form.set('content',JSON.stringify(content));
    const response=await worker.fetch(request('/preview',form,'POST'),env);assert.equal(response.status,200);
    const html=await response.text();assert.ok(html.includes('window.__pprPreviewLanguage="sv"'));
    assert.ok(html.indexOf('window.__pprPreviewContent=')<html.indexOf('./language.js?'));
    assert.ok(html.includes('Pending \\u003c/script>'));assert.ok(!html.includes('Pending </script>'));
    form.set('language','de');assert.equal((await worker.fetch(request('/preview',form,'POST'),env)).status,400);
  }finally{globalThis.fetch=realFetch;}
});
