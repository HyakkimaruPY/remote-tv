'use strict';
const fs=require('fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const read=p=>fs.readFileSync(p,'utf8');
(async()=>{
const browser=await chromium.launch({executablePath:process.env.RTV_CHROMIUM||'/tmp/rtv-chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('http://tv.test/**',r=>r.fulfill({body:'<!doctype html><html><head></head><body>'+read('apps/player1/shell.beta56-6-5-5.html')+'</body></html>',contentType:'text/html'}));await page.goto('http://tv.test/');
await page.addStyleTag({content:read('apps/player1/style.beta56-6-2.css')});
await page.evaluate(()=>{
const svg=(width,height,color,label)=>'data:image/svg+xml;base64,'+btoa('<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'"><rect width="100%" height="100%" fill="'+color+'"/><text x="30" y="60" font-size="38" fill="white">'+label+'</text></svg>');
const poster=svg(200,280,'#254554','Poster'),bg=svg(1920,1080,'#31454e','Backdrop'),logo=svg(300,80,'#18272e','Fixture');
const item=t=>({t,id:11,n:'Fixture',p:poster,ext:'mp4',ds:'Fixture synopsis.',tmdbBg:bg,tmdbLogo:logo});
window.RemoteTV={};window.RawPlayer={close(){},exit(){}};window.YTCore={};window.XT10={log(){},ensureAuth:cb=>cb(null),cats:(t,cb)=>cb(null,[{id:1,n:'Categoria'}]),items:(t,c,cb)=>cb(null,Array.from({length:10},()=>item(t))),vod:(o,cb)=>cb(null,o),series:(o,cb)=>cb(null,Object.assign(o,{eps:Array.from({length:6},(_,i)=>({t:'s',id:i+50,n:'Episode',p:poster,sn:1,ep:i+1}))})),cancel(){},releaseItems(){},releaseEpisodes(){}};window.XTVod29={active:()=>false,progress:()=>null,continueList:t=>[item(t)],stop(){}};window.localStorage.setItem('remote-tv.render.v1',JSON.stringify({enabled:true,opacity:35}));
});
for(const f of ['system/readable/xtream-ui.beta56-6-5-5.js','system/injections/graphos-skin-beta56-6-5-5.js','system/readable/launcher-surface.beta56-6-5-1.js'])await page.addScriptTag({content:read(f)});
await page.evaluate(()=>window.RawM3U.open());await page.click('#hm14');await page.click('.cat14');await page.waitForSelector('.card14');await page.focus('.card14');await page.waitForSelector('.focusBackdrop655 img');
const bounds=await page.locator('#r14h button').evaluateAll(a=>a.filter(x=>!x.disabled&&getComputedStyle(x).display!=='none').map(x=>({id:x.id,right:x.getBoundingClientRect().right,bottom:x.getBoundingClientRect().bottom})));assert.ok(bounds.every(x=>x.right<=1280&&x.bottom<=72),JSON.stringify(bounds));
await page.screenshot({path:'/tmp/rtv655-grid.png'});await page.click('#hcfg655');await page.waitForSelector('#renderSettings655');await page.screenshot({path:'/tmp/rtv655-settings.png'});await page.click('#renderBack655');await page.click('.card14');await page.waitForSelector('#play14');
const bg=await page.locator('.detailBg29').boundingBox();assert.ok(bg.x<=0&&bg.y<=0&&bg.x+bg.width>=1280&&bg.y+bg.height>=720,JSON.stringify(bg));await page.screenshot({path:'/tmp/rtv655-movie.png'});
await page.click('#db14');await page.click('#hs14');await page.click('.cat14');await page.click('.card14');await page.waitForSelector('#eg14');assert.equal(await page.locator('.ep14').count(),6);const rects=await page.locator('.ep14').evaluateAll(a=>a.map(x=>{const b=x.getBoundingClientRect();return{right:b.right,bottom:b.bottom}}));assert.ok(rects.every(x=>x.right<=1280&&x.bottom<=720),JSON.stringify(rects));await page.screenshot({path:'/tmp/rtv655-series.png'});assert.deepEqual(errors,[]);console.log('PASS browser 1280x720: header, backdrop, settings, film and six episode cards');
// Run the actual compiled fork in an isolated frame against synthetic YouTube markup.
await page.evaluate(()=>{window.localStorage.setItem('xtream.favorites.v14','private-fixture');window.RemoteTV.RequestScope=function(){this.cancel=function(){this.cancelled=true};this.fetch=(url,cb)=>cb(null,'<!doctype html><html><head><title>Fixture YouTube</title></head><body><div id="app">Synthetic TV UI</div><video></video></body></html>');};});
await page.addScriptTag({content:read('apps/youtube-beta/player-beta56-6-5-5.js')});await page.evaluate(()=>window.YouTube3Probe.open());await page.waitForFunction(()=>window.YouTube3Probe.state().stages.includes('fork-loaded'),null,{timeout:15000});await page.waitForFunction(()=>window.YouTube3Probe.state().stages.includes('ui-ready'));
const child=page.frames().find(f=>f.url().startsWith('data:text/html'));assert.ok(child);assert.equal(await page.locator('#ytBetaFrame655').getAttribute('sandbox'),'allow-scripts allow-forms allow-presentation');
const privacy=await child.evaluate(()=>{let blocked=false;try{parent.localStorage.getItem('xtream.favorites.v14')}catch(e){blocked=true}return{blocked,own:localStorage.getItem('xtream.favorites.v14')}});assert.deepEqual(privacy,{blocked:true,own:null});
await child.evaluate(()=>{const v=document.querySelector('video');Object.defineProperty(v,'paused',{value:false,configurable:true});v.currentTime=1;v.dispatchEvent(new Event('timeupdate'));v.currentTime=2;v.dispatchEvent(new Event('timeupdate'));});await page.waitForFunction(()=>window.YouTube3Probe.state().stage==='playing');
await page.evaluate(()=>window.YouTube3Probe.close());assert.equal(await page.locator('#ytBetaFrame655').count(),0);console.log('PASS compiled YouTube fork boot, sandbox isolation, media clock diagnostic and cleanup (synthetic page)');
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
