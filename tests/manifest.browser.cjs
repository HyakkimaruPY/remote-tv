// NODE_PATH=/tmp/remote-tv-browser/node_modules RTV_CHROMIUM=/path/to/chromium node tests/manifest.browser.cjs
const {chromium}=require('playwright'),fs=require('fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const manifest=JSON.parse(fs.readFileSync('manifest.json','utf8'));
function body(path){return fs.readFileSync(path,'utf8')}
function verify(m){const data=body(m.path);assert.equal(Buffer.byteLength(data),m.bytes,m.id+' bytes');assert.equal(crypto.createHash('sha256').update(data).digest('hex'),m.sha256,m.id+' sha256');return data}
(async()=>{
 const executablePath=process.env.RTV_CHROMIUM||chromium.executablePath();
 if(!fs.existsSync(executablePath))throw Error('Chromium ausente; defina RTV_CHROMIUM para executar a validação visual dirigida pelo manifesto.');
 const browser=await chromium.launch({executablePath,args:['--no-sandbox','--disable-gpu'],headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<!doctype html><html><head></head><body></body></html>');
 const ytSpec={code:body('apps/youtube3/probe-v40.js'),sha:'a56715ec90d7f5d09946c31e8c3a785044451e962183d571d73b104420b1158e'};
 await page.evaluate(x=>{
   window.__featureFetches=0;window.__ready='';window.__ytCode=x.code;window.__ytSha=x.sha;
   window.RemoteTV={data:{},release:'visual-manifest',sha256:s=>s===window.__ytCode?window.__ytSha:'invalid',fetch:(u,cb)=>{window.__featureFetches++;cb(null,window.__ytCode)},ready:id=>window.__ready=id,bridgeURL:u=>u};
   window.YTCore={channels:[],videoId:()=>null,videos:()=>[],compat:u=>[u],normal:v=>String(v)==='1',media:u=>u};
   window.QjyScript=function(){this.exec=function(){}};
   window.HTMLMediaElement.prototype.load=function(){};window.HTMLMediaElement.prototype.play=function(){return Promise.resolve()};window.HTMLMediaElement.prototype.pause=function(){};
   window.XMLHttpRequest=function(){this.status=0;this.readyState=1;this.open=function(m,u){this.url=u};this.send=function(){};this.abort=function(){this.aborted=true}};
 },ytSpec);
 for(const mod of manifest.modules){
   const data=verify(mod);
   if(mod.type==='html')await page.evaluate(html=>document.body.innerHTML=html,data);
   else if(mod.type==='css')await page.addStyleTag({content:data});
   else if(mod.type==='json')await page.evaluate(x=>RemoteTV.data[x.id]=JSON.parse(x.data),{id:mod.id,data});
   else if(mod.type==='js')await page.addScriptTag({content:data});
 }
 const boot=await page.evaluate(()=>({ready:window.__ready,focus:document.activeElement&&document.activeElement.id,fetches:window.__featureFetches,buttons:[...document.querySelectorAll('#menu button')].map(b=>{const r=b.getBoundingClientRect();return{id:b.id,x:r.x,y:r.y,w:r.width,h:r.height}}),rawLegacy:!!document.querySelector('script[data-remote-feature="rawm3u"]'),ytLoaded:!!window.YouTube3Probe}));
 assert.equal(boot.ready,'player1');assert.equal(boot.focus,'tv');assert.equal(boot.fetches,0);assert.equal(boot.rawLegacy,false);assert.equal(boot.ytLoaded,false);assert.ok(boot.buttons.length>=4);assert.ok(boot.buttons.every(r=>r.x>=0&&r.y>=0&&r.x+r.w<=1280&&r.y+r.h<=720));
 await page.screenshot({path:'/tmp/remote41-manifest-start.png'});
 await page.locator('#yt3').click();await page.waitForSelector('#yt3probe:not(.h)');assert.equal(await page.evaluate(()=>window.__featureFetches),1);assert.ok(await page.locator('#yt3frame').isVisible());await page.locator('#yt3back').click();
 await page.locator('#rawLaunch').click();await page.waitForSelector('#r14:not(.h)');const raw=await page.locator('#r14').evaluate(el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,text:el.textContent}});assert.deepEqual({x:raw.x,y:raw.y,w:raw.w,h:raw.h},{x:0,y:0,w:1280,h:720});assert.match(raw.text,/Autenticando Xtream Codes/);assert.equal(await page.evaluate(()=>window.__featureFetches),1,'M3U ativo não depende do carregador do YouTube');
 await page.screenshot({path:'/tmp/remote41-manifest-raw.png'});assert.deepEqual(errors,[]);
 console.log(JSON.stringify({result:'PASS',release:manifest.release,checks:['integridade de todos os módulos do manifesto','app pronto e foco liberado sem feature fetch','YouTube 3 carregado somente no clique','M3U ativo em 1280x720 sem carregar rawm3u legado','nenhum erro de página'],screenshots:['/tmp/remote41-manifest-start.png','/tmp/remote41-manifest-raw.png']},null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
