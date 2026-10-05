import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const pages=['index.html','Etusivu.dc.html','Palvelut.dc.html','Yritys.dc.html','Referenssit.dc.html','Yhteystiedot.dc.html'];
const languages=['fi','en','sv'];
const read=name=>fs.readFile(path.join(root,name),'utf8');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};

// A strict mount catches paths that accidentally escape /ppr/. It also serves
// real files over HTTP, including JSON-only image references from the admin.
async function serve(mount,run) {
  const server=http.createServer(async(req,res)=>{
    try {
      const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      if(!pathname.startsWith(mount)){res.writeHead(404).end();return;}
      let relative=pathname.slice(mount.length);
      if(relative.endsWith('/')||!relative)relative+='index.html';
      const filename=path.resolve(root,relative);
      if(!filename.startsWith(root+path.sep)){res.writeHead(404).end();return;}
      const data=await fs.readFile(filename);
      res.writeHead(200,{'content-type':types[path.extname(filename)]||'application/octet-stream','content-length':data.length}).end(data);
    }catch{res.writeHead(404).end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  try{return await run(new URL(mount,origin));}
  finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
}

function localReferences(source) {
  const refs=[];
  for(const [,value] of source.matchAll(/\b(?:href|src|poster)\s*=\s*["']([^"']+)["']/gi))refs.push(value);
  for(const [,value] of source.matchAll(/\burl\(\s*["']?([^\s"')]+)["']?\s*\)/gi))refs.push(value);
  // Static resource names inside script strings (e.g. the loading curtain).
  for(const [,value] of source.matchAll(/["']((?:\.\/)?(?:assets\/[^"'\s<>]+|[^"'\s<>]+\.(?:js|css|woff2?|ttf|otf)))(?:["'])/gi))refs.push(value);
  return refs.filter(value=>!value.includes('{{')&&!value.startsWith('#')&&!/^[a-z][a-z\d+.-]*:/i.test(value)&&!value.startsWith('//'));
}

function contentReferences(value,out=[]) {
  if(typeof value==='string'&&/^(?:\.\/)?(?:assets\/|(?:index|\w+\.dc)\.html(?:[?#]|$))/.test(value))out.push(value);
  else if(value&&typeof value==='object')for(const entry of Object.values(value))contentReferences(entry,out);
  return out;
}

test('every public page, script and content asset is reachable at root and /ppr/',async(t)=>{
  const publicSources=(await fs.readdir(root)).filter(name=>/\.(?:html|css|js)$/.test(name));
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
      for(const reference of localReferences(source))await check(reference,new URL(name,base));
    }
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

test('language routes stay inside each mount and Finnish is default after an earlier choice',async()=>{
  const source=await read('language.js');
  for(const mount of ['/','/ppr/'])await serve(mount,async(base)=>{
    for(const name of pages)for(const selection of [null,...languages]) {
      const location=new URL(name,base);
      location.search='?ref=route-test'+(selection?'&lang='+selection:'');
      location.hash='#photos';
      const context={URL,URLSearchParams,location,localStorage:{getItem(){return 'en'},setItem(){}},document:{baseURI:location.href,documentElement:{},head:{appendChild(){}},createElement(){return {}},querySelector(){return null}}};
      context.window=context;
      vm.runInNewContext(source,context);
      assert.equal(context.pprLanguage,selection||'fi');
      assert.equal(context.document.documentElement.lang,selection||'fi');
      assert.equal(context.pprLanguageOptions.length,3);
      for(const option of context.pprLanguageOptions) {
        assert.ok(!option.href.startsWith('/')&&!/^https?:/.test(option.href),option.href);
        const destination=new URL(option.href,location);
        assert.equal(destination.pathname,location.pathname);
        assert.equal(destination.hash,'#photos');
        assert.equal(destination.searchParams.get('ref'),'route-test');
        assert.equal(destination.searchParams.get('lang'),option.lang);
        assert.equal((await fetch(destination)).status,200);
      }
      const links=context.pprLocalizeContent({home:'index.html',service:'Palvelut.dc.html#photos',asset:'assets/ppr-logo.png',external:'https://external.example/'});
      for(const key of ['home','service']) {
        const destination=new URL(links[key],location);
        assert.equal(destination.searchParams.get('lang'),selection||'fi');
        assert.ok(destination.pathname.startsWith(base.pathname));
        assert.equal((await fetch(destination)).status,200);
      }
      assert.equal(links.asset,'assets/ppr-logo.png');
      assert.equal(links.external,'https://external.example/');
    }
  });
});

test('canonical metadata and crawler files identify the custom domain',async()=>{
  for(const page of pages) {
    const html=await read(page);
    assert.match(Buffer.from(html,'utf8').subarray(0,1024).toString('utf8'),/<meta\s+charset=["']utf-8["']/i,page+' must declare UTF-8 within the first 1024 bytes');
    const head=html.match(/<head>([\s\S]*?)<\/head>/i)?.[1]||'';
    assert.match(head,/<link\b[^>]*rel=["']icon["'][^>]*href=["']assets\/favicon\.png["']/i,page+' must declare the existing relative favicon before rendering');
    const expected='https://ppr.fi/'+(['index.html','Etusivu.dc.html'].includes(page)?'':page);
    assert.ok(html.includes('<x-dc>'),page+' should serve content');
    const canonical=html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1];
    const openGraph=html.match(/<meta\b[^>]*property=["']og:url["'][^>]*content=["']([^"']+)/i)?.[1];
    assert.equal(canonical,expected,page);
    assert.equal(openGraph,expected,page);
  }
  const sitemap=await read('sitemap.xml');
  const locations=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>new URL(match[1].replaceAll('&amp;','&')));
  assert.ok(locations.length>=5);
  for(const location of locations)assert.equal(location.origin,'https://ppr.fi');
  const robots=await read('robots.txt');
  assert.match(robots,/^Sitemap: https:\/\/ppr\.fi\/sitemap\.xml\s*$/m);
});
