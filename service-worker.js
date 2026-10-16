const APP_VERSION='3.36.13';
importScripts('./build-assets.js','./sw-integrity.js');
const CACHE_PREFIX='ae-campaign1-';
const CACHE='ae-campaign1-'+self.AdrianRelease.build;
const ASSETS=["/adrian-core/components/adrian-learning-json.js?v=1.1.0-20261013","/adrian-core/components/github-garden.js?v=6","./app.js","./arcade-stability.js","./campaign-01.js","./error-coach.js","./grammar-focus.css","./grammar-focus.js","./grammar-refinement-v42.css","./grammar-time-display-v42.js","./grammar-visual-pilot.css","./grammar-font-control.js","./grammar-font-control.css","./grammar-font-control.js?v=3.36.13","./grammar-font-control.css?v=3.36.13","./icon.svg","./keys.js","./language-points.js","./learning-feedback.js","./lessons.js","./manifest.webmanifest","./nucleo-game-theme.css","./nucleo-global-v45.css","./nucleo-oled-shell.css","./nucleo-quiz-refinement.css","./performance-adapter.js","./pixel-quiz-layout.css","./progress-indexeddb.js","./progress-storage.js","./quiz-polish.css","/adrian-core/components/adrian-achievements.js?v=stars4","/adrian-core/components/adrian-performance.js?v=1.1.0","/adrian-core/components/adrian-sync.js?v=1.0.8-0d4fa97","/adrian-core/components/hub-charts.js?v=1.1.0","/adrian-core/components/hub-nav.js?v=13-arcade-20261011","/adrian-core/components/hub-quiz-ux.js?v=20261011-2","/adrian-core/design/adrian-visual-system.js?v=core-20261004b","/adrian-core/design/integrated-v11/integrated-theme.css","/adrian-core/design/integrated-v11/integrated-view.js","/adrian-core/design/integrated-v11/roboto-1.woff2","/adrian-core/design/integrated-v11/roboto-2.woff2","/adrian-core/design/integrated-v11/roboto.css","/adrian-core/design/integrated-v11/roboto-source.css","/adrian-core/design/integrated-v11/integrated-theme.css","/adrian-core/design/integrated-v11/roboto-3.woff2","/adrian-core/design/integrated-v11/integrated-view.js","/adrian-core/design/integrated-v11/integrated-hub-theme.css","/adrian-core/design/integrated-v11/roboto-0.woff2","./index.html",'./grammar-visual-pilot.css?v=3.36.12','./nucleo-global-v45.css?v=4.5.3','./grammar-refinement-v42.css?v=4.2.0','./grammar-time-display-v42.js?v=4.2.0','./nucleo-quiz-refinement.css?v=4.1.0','./nucleo-oled-shell.css?v=1.0.0','./grammar-focus.css?v=3.36.12','./grammar-focus.js?v=3.36.12','./pixel-quiz-layout.css','./nucleo-game-theme.css','./learning-feedback.js','./quiz-polish.css','./progress-storage.js','./progress-indexeddb.js','./','./index.html','/adrian-core/design/adrian-visual-system.js','/adrian-core/components/adrian-achievements.js','/adrian-core/components/adrian-performance.js?v=1.0.1-20261006','./lessons.js','./keys.js','./error-coach.js','./language-points.js','./app.js','./performance-adapter.js?v=1.0.0-20261006','./campaign-01.json','./campaign-01.js','./manifest.webmanifest','./icon.svg'];
const CORE_RE=/\.(?:html|js|css|json|webmanifest)$/i;
function withTimeout(req,ms,init={}){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);return releaseFetch(req,{...init,signal:c.signal}).finally(()=>clearTimeout(t));}
async function installCore(list){
  const c=await caches.open(CACHE);
  try{await releaseAll(list.map(async url=>{const req=new Request(new URL(url,self.registration.scope),{cache:'reload'}),r=await withTimeout(req,8000,{cache:'reload'});if(!r||!r.ok)throw new Error(`Core asset failed: ${url}`);await c.put(req,r.clone());}));}
  catch(e){await caches.delete(CACHE);throw e;}
}
self.addEventListener('install',e=>e.waitUntil(installCore(ASSETS).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const key of await caches.keys()){if(key.startsWith(CACHE_PREFIX)&&key!==CACHE)await caches.delete(key);}await self.clients.claim();})()));
async function network(req,ms=3500){try{return await withTimeout(req,ms,{cache:'no-cache'});}catch(_){return null;}}
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin!==self.location.origin)return;
  e.respondWith((async()=>{
    const c=await caches.open(CACHE),core=e.request.mode==='navigate'||CORE_RE.test(u.pathname);
    if(core){if(e.request.mode!=='navigate'){const ready=await releaseMatch(c,e.request);if(ready)return ready;}const r=await network(e.request,6000);if(r&&r.ok){await c.put(e.request,r.clone());return r;}const hit=await releaseMatch(c,e.request);if(hit)return hit;if(e.request.mode==='navigate')return (await c.match('./index.html'))||(await c.match('./'))||Response.error();return Response.error();}
    const hit=await releaseMatch(c,e.request);if(hit)return hit;
    const r=await network(e.request,5000);if(r&&r.ok){await c.put(e.request,r.clone());return r;}return Response.error();
  })());
});
