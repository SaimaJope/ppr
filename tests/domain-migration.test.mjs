import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const cleanPages=[
  {file:'index.html',route:'',key:'etusivu'},
  {file:'palvelut/index.html',route:'palvelut/',key:'palvelut'},
  {file:'yritys/index.html',route:'yritys/',key:'yritys'},
  {file:'referenssit/index.html',route:'referenssit/',key:'referenssit'},
  {file:'yhteystiedot/index.html',route:'yhteystiedot/',key:'yhteystiedot'}
];
const legacyNames=['Etusivu','Palvelut','Yritys','Referenssit','Yhteystiedot'];
const phpPages=[
  {...cleanPages[0],file:'index.php/index.html',requestPath:'index.php',legacy:true},
  {...cleanPages[1],file:'palvelut.php/index.html',requestPath:'palvelut.php',legacy:true},
  {...cleanPages[4],file:'yhteys.php/index.html',requestPath:'yhteys.php',legacy:true}
];
const pages=[...cleanPages,...legacyNames.map((name,index)=>({...cleanPages[index],file:name+'.dc.html',legacy:true})),...phpPages];
const languages=['fi','en','sv'];
const read=name=>fs.readFile(path.join(root,name),'utf8');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};

// A strict mount catches paths that accidentally escape /ppr/. It also serves
// real files over HTTP, including JSON-only image references from the admin.
async function serve(mount,run) {
  const server=http.createServer(async(req,res)=>{
    try {
      const requestURL=new URL(req.url,'http://localhost');
      const pathname=decodeURIComponent(requestURL.pathname);
      if(!pathname.startsWith(mount)){res.writeHead(404).end();return;}
      let relative=pathname.slice(mount.length);
      let filename=path.resolve(root,relative);
      if(filename!==root&&!filename.startsWith(root+path.sep)){res.writeHead(404).end();return;}
      if((await fs.stat(filename)).isDirectory()) {
        if(!pathname.endsWith('/')){res.writeHead(301,{location:pathname+'/'+requestURL.search}).end();return;}
        filename=path.join(filename,'index.html');
      }
      const data=await fs.readFile(filename);
      res.writeHead(200,{'content-type':types[path.extname(filename)]||'application/octet-stream','content-length':data.length}).end(data);
    }catch{res.writeHead(404).end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  try{return await run(new URL(mount,origin));}
  finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
}

function documentBase(html,url) {
  const href=html.match(/<base\b[^>]*href=["']([^"']+)["']/i)?.[1];
  return href?new URL(href,url):url;
}
function localReferences(source) {
  const refs=[];
  source=source.replace(/<base\b[^>]*>/gi,'');
  for(const [,value] of source.matchAll(/\b(?:href|src|poster)\s*=\s*["']([^"']+)["']/gi))refs.push(value);
  for(const [,value] of source.matchAll(/\burl\(\s*["']?([^\s"')]+)["']?\s*\)/g))refs.push(value);
  // Static resource names inside script strings (e.g. the loading curtain).
  for(const [,value] of source.matchAll(/["']((?:\.\/)?(?:assets\/[^"'\s<>]+|[^"'\s<>]+\.(?:js|css|woff2?|ttf|otf)))(?:["'])/gi))refs.push(value);
  return refs.filter(value=>!value.includes('{{')&&!value.startsWith('#')&&!/^[a-z][a-z\d+.-]*:/i.test(value)&&!value.startsWith('//'));
}

function contentReferences(value,out=[]) {
  if(typeof value==='string'&&/^(?:\.\/)?(?:assets\/|(?:index|\w+\.dc)\.html(?:[?#]|$)|(?:palvelut|yritys|referenssit|yhteystiedot)\/)/.test(value))out.push(value);
  else if(value&&typeof value==='object')for(const entry of Object.values(value))contentReferences(entry,out);
  return out;
}

test('real clean directories, legacy pages, scripts and content assets work at root and /ppr/',async(t)=>{
  const publicSources=[...new Set([...(await fs.readdir(root)).filter(name=>/\.(?:html|css|js)$/.test(name)),...pages.map(page=>page.file)])];
  for(const mount of ['/','/ppr/'])await serve(mount,async(base)=>{
    const requested=new Set();
    async function check(reference,from=base) {
      assert.ok(!reference.startsWith('/'),'root-absolute local reference: '+reference);
      const url=new URL(reference,from);
      assert.equal(url.origin,base.origin);
      assert.ok(url.pathname.startsWith(base.pathname),'escaped mount: '+url.href);
      if(requested.has(url.href))return;
      requested.add(url.href);
      const response=await fetch(url);
      assert.equal(response.status,200,url.href);
      assert.ok(Number(response.headers.get('content-length'))!==0,url.href+' is empty');
      return response;
    }
    for(const name of publicSources) {
      await check(name);
      const source=await read(name);
      for(const reference of localReferences(source))await check(reference,documentBase(source,new URL(name,base)));
    }
    for(const page of cleanPages)await check(page.route||'./');
    for(const page of phpPages){await check(page.requestPath);await check(page.requestPath+'/');}
    for(const language of languages) {
      await check('content/'+language+'.json');
      const content=JSON.parse(await read('content/'+language+'.json'));
      assert.equal(content.locale,language);
      for(const reference of contentReferences(content))await check(reference);
    }
    assert.ok(requested.size>40,'crawl should cover site pages, scripts and all content assets');
    t.diagnostic(mount+': '+requested.size+' distinct public resource and page URLs returned HTTP 200');
  });
});

async function languageAt(source,initial) {
  let url=new URL(initial);
  const redirects=[];
  for(let attempt=0;attempt<4;attempt++) {
    const response=await fetch(url,{redirect:'manual'});
    if(response.status===301) {
      const destination=new URL(response.headers.get('location'),url);
      if(!destination.hash)destination.hash=url.hash;
      assert.equal(destination.pathname,url.pathname+'/','directory redirect should only append the missing slash');
      assert.equal(destination.search,url.search,'directory redirect must retain query');
      redirects.push(destination.href);url=destination;continue;
    }
    assert.equal(response.status,200,url.href);
    const html=await response.text();
    const pageKey=html.match(/data-ppr-page=["']([^"']+)["']/)?.[1];
    let redirect;
    url.replace=href=>{redirect=new URL(href,url);};
    const context={URL,URLSearchParams,location:url,localStorage:{getItem(){return 'en'},setItem(){}},document:{baseURI:documentBase(html,url).href,documentElement:{dataset:{pprPage:pageKey},getAttribute(name){return name==='data-ppr-page'?pageKey:null}},head:{appendChild(){}},createElement(){return {}},querySelector(){return null}}};
    context.window=context;
    vm.runInNewContext(source,context);
    if(!redirect)return {context,url,redirects};
    redirects.push(redirect.href);url=redirect;
  }
  assert.fail('redirect loop: '+redirects.join(' -> '));
}

test('clean URLs, legacy redirects, locale choices and anchors preserve the mounted site',async()=>{
  const source=await read('language.js');
  for(const mount of ['/','/ppr/'])await serve(mount,async(base)=>{
    for(const page of pages)for(const selection of [null,...languages]) {
      const initial=new URL(page.requestPath||page.file,base);
      initial.search='?ref=route-test'+(selection?'&lang='+selection:'');initial.hash='#photos';
      const {context,url,redirects}=await languageAt(source,initial);
      const language=selection||'fi';
      const expectedPath=base.pathname+page.route;
      assert.equal(url.pathname,expectedPath,initial.href+' should normalize to a clean URL');
      assert.equal(url.searchParams.get('ref'),'route-test');assert.equal(url.hash,'#photos');
      assert.equal(url.searchParams.get('lang'),language==='fi'?null:language);
      if(page.legacy||page.file==='index.html'||selection==='fi')assert.ok(redirects.length>0,initial.href+' should redirect');
      assert.equal(context.pprLanguage,language);assert.equal(context.document.documentElement.lang,language);
      assert.equal(context.pprPage,page.key);
      assert.equal(context.pprLanguageOptions.length,3);
      for(const option of context.pprLanguageOptions) {
        assert.ok(!option.href.startsWith('/')&&!/^https?:/.test(option.href),option.href);
        const destination=new URL(option.href,context.document.baseURI);
        assert.equal(destination.pathname,expectedPath);
        assert.equal(destination.hash,'#photos');
        assert.equal(destination.searchParams.get('ref'),'route-test');
        assert.equal(destination.searchParams.get('lang'),option.lang==='fi'?null:option.lang);
        assert.equal((await fetch(destination)).status,200);
      }
      for(const destination of Object.values(context.pprPageLinks)) {
        assert.ok(!destination.startsWith('/')&&!/^https?:/.test(destination));
        const target=new URL(destination,context.document.baseURI);
        assert.ok(target.pathname.startsWith(base.pathname));
        assert.equal(target.searchParams.get('lang'),language==='fi'?null:language);
        assert.equal((await fetch(target)).status,200);
      }
      const links=context.pprLocalizeContent({home:'index.html?ref=content&lang=en',service:'Palvelut.dc.html#photos',clean:'referenssit/',fragment:'#billing',asset:'assets/ppr-logo.png',external:'https://external.example/'});
      for(const [key,route] of [['home',''],['service','palvelut/'],['clean','referenssit/']]) {
        const destination=new URL(links[key],context.document.baseURI);
        assert.equal(destination.pathname,base.pathname+route);
        assert.equal(destination.searchParams.get('lang'),language==='fi'?null:language);
        assert.equal((await fetch(destination)).status,200);
      }
      assert.equal(new URL(links.home,context.document.baseURI).searchParams.get('ref'),'content');
      const fragment=new URL(links.fragment,context.document.baseURI);
      assert.equal(fragment.pathname,expectedPath);assert.equal(fragment.hash,'#billing');
      assert.equal(fragment.searchParams.get('ref'),'route-test');
      assert.equal(fragment.searchParams.get('lang'),language==='fi'?null:language);
      assert.equal(links.asset,'assets/ppr-logo.png');
      assert.equal(links.external,'https://external.example/');
    }
  });
});

test('metadata and crawler files use the clean custom-domain URLs',async()=>{
  for(const page of pages) {
    const html=await read(page.file);
    assert.match(Buffer.from(html,'utf8').subarray(0,1024).toString('utf8'),/<meta\s+charset=["']utf-8["']/i,page.file+' must declare UTF-8 within the first 1024 bytes');
    const head=html.match(/<head>([\s\S]*?)<\/head>/i)?.[1]||'';
    assert.match(head,/<link\b[^>]*rel=["']icon["'][^>]*href=["']assets\/favicon\.png["']/i,page.file+' must declare the existing relative favicon before rendering');
    if(page.file.includes('/'))assert.equal(documentBase(html,new URL(page.file,'https://example.test/ppr/')).href,'https://example.test/ppr/');
    const expected='https://ppr.fi/'+page.route;
    assert.ok(html.includes('<x-dc>'),page.file+' should serve content');
    const canonical=html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1];
    const openGraph=html.match(/<meta\b[^>]*property=["']og:url["'][^>]*content=["']([^"']+)/i)?.[1];
    assert.equal(canonical,expected,page.file);
    assert.equal(openGraph,expected,page.file);
  }
  const sitemap=await read('sitemap.xml');
  const locations=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>new URL(match[1].replaceAll('&amp;','&')));
  assert.equal(locations.length,15,'five pages in three languages');
  for(const location of locations) {
    assert.equal(location.origin,'https://ppr.fi');
    assert.ok(cleanPages.some(page=>location.pathname==='/'+page.route),location.href);
    assert.ok(!location.searchParams.has('lang')||['en','sv'].includes(location.searchParams.get('lang')),location.href);
  }
  for(const page of cleanPages)for(const language of languages)assert.ok(locations.some(location=>location.pathname==='/'+page.route&&location.searchParams.get('lang')===(language==='fi'?null:language)));
  const robots=await read('robots.txt');
  assert.match(robots,/^Sitemap: https:\/\/ppr\.fi\/sitemap\.xml\s*$/m);
});
