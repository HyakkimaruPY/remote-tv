'use strict';
const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('node:assert/strict'),read=p=>fs.readFileSync(p,'utf8');
function env(){const dom=new JSDOM('<!doctype html><html><head></head><body>'+read('apps/player1/shell.html')+'</body></html>',{url:'http://tv.test/',runScripts:'outside-only'});const w=dom.window;let clock=10000,id=0,jobs=new Map();w.Date=class extends Date{constructor(...a){super(...(a.length?a:[clock]))}static now(){return clock}};w.setTimeout=(fn,ms)=>{jobs.set(++id,{fn,at:clock+(ms||0)});return id};w.clearTimeout=i=>jobs.delete(i);function tick(ms){const end=clock+ms;for(let n=0;n<4000;n++){const a=[...jobs].filter(x=>x[1].at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!a)break;jobs.delete(a[0]);clock=a[1].at;a[1].fn()}clock=end}const req=[];w.XMLHttpRequest=class{constructor(){req.push(this);this.status=0}open(m,u,a){this.url=u;this.async=a}send(){}abort(){this.aborted=true}reply(s,t){this.status=s;this.responseText=t;this.readyState=4;if(this.onreadystatechange)this.onreadystatechange()}};w.RemoteTV={};const logs=[];w.XT10={log:(...x)=>logs.push(x.join(' ')),mask:x=>x};w.HTMLMediaElement.prototype.load=function(){};w.HTMLMediaElement.prototype.play=function(){this.plays=(this.plays||0)+1;return Promise.resolve()};w.HTMLMediaElement.prototype.pause=function(){};return{dom,w,req,tick,logs,run:f=>{if(!w.RemoteTV.RequestScope)w.eval(read('system/runtime-beta56-3.js'));w.eval(read(f))}}}
const UI='system/readable/xtream-ui.beta56-6-5-5.js';
let passes=0;function pass(s){passes++;console.log('PASS',s);}
function fixture(options={}) {
 const e=env(),w=e.w,d=w.document,images=[],pending=[];let playing=false;
 const make=(t,id)=>({t,id,n:'Fixture '+id,ext:'mp4',p:'http://fixture/poster'+id+'.jpg',ds:'Synopsis',tmdbBg:options.art?'http://fixture/backdrop'+id+'.jpg':'',tmdbLogo:options.art?'http://fixture/logo'+id+'.png':''});
 w.localStorage.setItem('remote-tv.render.v1',JSON.stringify({enabled:!!options.enabled,opacity:35}));
 w.Image=function(){const i=d.createElement('img');Object.defineProperties(i,{naturalWidth:{value:1920},naturalHeight:{value:1080}});images.push(i);return i;};
 Object.assign(w.XT10,{ensureAuth:cb=>cb(null),cats:(t,cb)=>cb(null,[{id:1,n:'Category'}]),items:(t,c,cb)=>cb(null,[make(t,11),make(t,12)]),vod:(o,cb)=>cb(null,o),series:(o,cb)=>cb(null,Object.assign(o,{eps:Array.from({length:6},(_,i)=>({t:'s',id:50+i,n:'Episode '+i,sn:1,ep:i+1,p:'http://fixture/ep'+i+'.jpg'}))})),cancel(){},releaseItems(){},releaseEpisodes(){}});
 w.XTMeta24={enrich:(o,t,cb)=>pending.push(()=>{o.tmdbBg='http://fixture/new-bg'+o.id+'.jpg';o.tmdbLogo='http://fixture/new-logo.png';cb(null,o)}),cancel(){}};
 w.RawPlayer={close(){},exit(){}};w.YTCore={};w.XTVod29={active:()=>playing,progress:()=>null,continueList:t=>[make(t,11)],play(){playing=true},stop(){playing=false}};
 w.localStorage.setItem('xtream.favorites.v14',JSON.stringify({c:[make('c',1)],m:[make('m',11)],s:[make('s',11)]}));
 e.run(UI);w.RawM3U.open();
 function category(t='m'){d.getElementById(t==='m'?'hm14':t==='s'?'hs14':'hc14').click();d.querySelector('.cat14').click();e.tick(140);}
 function complete(){for(let n=0;n<15;n++){const image=images.find(x=>x.onload);if(!image)break;image.onload();}}
 return {...e,d,images,pending,category,complete,close(){w.close()}};
}
{
 const e=fixture(),d=e.d;d.getElementById('hcfg655').focus();d.getElementById('hcfg655').click();assert.equal(d.getElementById('renderOpacity655').style.display,'none');d.getElementById('renderToggle655').click();assert.equal(d.getElementById('renderOpacity655').style.display,'block');d.getElementById('renderValue655').focus();for(let i=0;i<30;i++)e.w.RawM3U.key({keyCode:39,preventDefault(){}});assert.equal(d.getElementById('renderValue655').textContent,'100%');for(let i=0;i<30;i++)e.w.RawM3U.key({keyCode:37,preventDefault(){}});assert.equal(d.getElementById('renderValue655').textContent,'0%');e.w.RawM3U.back();assert.equal(d.getElementById('renderSettings655'),null);assert.equal(d.activeElement.id,'hcfg655');assert.deepEqual(JSON.parse(e.w.localStorage.getItem('remote-tv.render.v1')),{enabled:true,opacity:0});e.close();pass('settings, conditional opacity, 0/100 bounds, persistence and focus return');
}
{
 const e=fixture({enabled:false}),d=e.d;e.category();d.querySelector('.card14').focus();e.tick(2000);assert.equal(e.pending.length,0);assert.equal(e.images.length,0);e.close();pass('disabled effect issues no backdrop or metadata requests');
}
for(const context of ['category-m','category-s','favorites-m','favorites-s','continue-m','continue-s']) {
 const e=fixture({enabled:true,art:true}),d=e.d,t=context.endsWith('s')?'s':'m';
 if(context.startsWith('category'))e.category(t);else{d.getElementById(context.startsWith('favorites')?'hf14':'hct14').click();d.querySelector('.tab14[data-sp="'+t+'"]').click();}
 d.querySelector('.card14').focus();e.tick(270);assert.equal(e.images.length,1);e.images[0].onload();const b=d.querySelector('.focusBackdrop655');assert.ok(b,context);assert.equal(b.style.opacity,'0.35');const image=b.querySelector('img');assert.ok(parseInt(image.style.width)>=1032);assert.ok(parseInt(image.style.height)>=648);assert.ok(parseInt(image.style.left)<=0);d.getElementById('r14back').click();assert.equal(d.querySelector('.focusBackdrop655'),null);e.close();pass('focused backdrop/crop and cleanup in '+context);
}
{
 const e=fixture({enabled:true}),d=e.d;e.category();const cards=d.querySelectorAll('.card14');cards[0].focus();e.tick(100);cards[1].focus();e.tick(270);assert.equal(e.pending.length,1);cards[0].focus();e.pending[0]();assert.equal(e.images.length,0);e.tick(270);assert.equal(e.pending.length,2);e.pending[1]();assert.equal(e.images.length,1);const late=e.images[0].onload;d.getElementById('r14back').click();late();assert.equal(d.querySelector('.focusBackdrop655'),null);e.close();pass('focus debounce, stale metadata and late image after exit cannot paint');
}
{
 const e=fixture(),d=e.d;e.category();d.querySelector('.card14').click();assert.ok(d.getElementById('prepareBack31'));assert.equal(d.getElementById('play14'),null);e.pending[0]();assert.equal(e.images.length,1);e.images[0].onload();assert.equal(d.getElementById('play14'),null,'logo is still pending');assert.equal(e.images.length,2);e.images[1].onload();assert.ok(d.getElementById('play14'));assert.equal(d.querySelectorAll('.detailBg29').length,1);assert.ok(d.querySelector('.movieLogo19'));assert.equal(d.querySelector('.detailBg29').style.top,'0px');e.close();pass('movie details appear together only after metadata, backdrop and logo are ready');
}
{
 const e=fixture({art:true}),d=e.d;e.category('s');d.querySelector('.card14').click();assert.equal(d.getElementById('eg14'),null);e.complete();assert.equal(e.images.length,8);assert.equal(d.querySelectorAll('#eg14 .ep14 img').length,6);assert.equal(d.querySelectorAll('#eg14 img[data-src]').length,0);assert.ok([...d.querySelectorAll('#eg14 img')].every(x=>x.getAttribute('src')));assert.equal(d.querySelectorAll('.detailBg29').length,1);e.close();pass('series detail prepares backdrop/logo and six covers; ready cover nodes reused');
}
{
 const e=fixture(),d=e.d;e.category();d.querySelector('.card14').click();e.tick(6600);assert.ok(d.getElementById('play14'));e.pending[0]();e.tick(100);assert.equal(d.querySelector('.detailBg29'),null);assert.equal(e.images.length,0);e.close();pass('metadata timeout opens usable fallback and forbids late reinjection');
}
{
 const e=fixture({art:true}),d=e.d;e.category();d.querySelector('.card14').click();const late=e.images[0].onload;e.w.RawM3U.back();late();assert.equal(d.getElementById('play14'),null);assert.ok(d.querySelector('.card14'));e.close();pass('Back while preparing art invalidates pending detail');
}
console.log('Render 6.5.5:',passes,'scenarios PASS');
