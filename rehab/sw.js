/* Rehab Draw offline cache. Network first (the newest version wins), cached copy when offline or slow. */
const CACHE="rehab-draw-v2";
const CORE=["./","./index.html","./manifest.webmanifest","./icon-180.png","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
function timeout(ms){return new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),ms))}
self.addEventListener("fetch",e=>{
  const req=e.request; if(req.method!=="GET")return;
  const isPage=req.mode==="navigate";
  e.respondWith((async()=>{
    try{
      const res=await Promise.race([fetch(req),timeout(isPage?5000:8000)]);
      if(res&&(res.ok||res.type==="opaque")){const copy=res.clone();caches.open(CACHE).then(c=>c.put(isPage?"./index.html":req,copy)).catch(()=>{})}
      return res;
    }catch(err){
      const hit=await caches.match(isPage?"./index.html":req,{ignoreSearch:true});
      if(hit)return hit;
      if(isPage){const idx=await caches.match("./index.html");if(idx)return idx}
      throw err;
    }
  })());
});
