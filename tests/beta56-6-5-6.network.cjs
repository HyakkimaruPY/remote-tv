'use strict';
const fs=require('fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom'),read=p=>fs.readFileSync(p,'utf8');
const CORE=process.env.RTV_NETWORK_CORE||'system/readable/xtream-lazy-core.beta56-6-5-6.js';
let passes=0;function pass(s){passes++;console.log('PASS',s)}
function fixture(options={}){const dom=new JSDOM('<body>'+read('apps/player1/shell.beta56-6-5-5.html')+'</body>',{url:'http://tv.test',runScripts:'outside-only'}),w=dom.window,req=[];let clock=10000,id=0,jobs=[];
w.Date=class extends Date{constructor(...x){super(...(x.length?x:[clock]))}getTime(){return clock}static now(){return clock}};w.setTimeout=(fn,ms)=>{jobs.push({id:++id,at:clock+(ms||0),fn});return id};w.clearTimeout=n=>{jobs=jobs.filter(x=>x.id!==n)};
function tick(ms=1){const end=clock+ms;for(let i=0;i<1000;i++){jobs.sort((a,b)=>a.at-b.at);if(!jobs.length||jobs[0].at>end)break;const j=jobs.shift();clock=j.at;j.fn()}clock=end}
w.RemoteTV={};w.XMLHttpRequest=class{open(m,u){this.method=m;this.url=u}send(){req.push(this)}abort(){this.aborted=true}reply(status,text){this.status=status;this.responseText=text;this.readyState=4;if(this.onreadystatechange)this.onreadystatechange()}};
w.eval(read(CORE));w.eval(read('system/readable/xtream-auth-guard.beta56-6-5-6.js'));
const config='M3U="http://fixture.invalid/get.php?username=fixture-user&password=fixture-pass&type=m3u_plus"';
const ok=JSON.stringify({user_info:{auth:1,status:'Active',exp_date:0},server_info:{timestamp_now:10000}});
function reply(body,status=200){const r=req[req.length-1];r.reply(status,body);tick();return r}
if(options.ui){w.YTCore={};w.RawPlayer={close(){},exit(){},play(){}};w.XTVod29={active:()=>false,progress:()=>null};w.eval(read('system/readable/xtream-ui.beta56-6-5-5.js'));}
return{w,req,tick,reply,config,ok,close:()=>w.close()};}
{
 const e=fixture();let result;e.w.XT10.ensureAuth(x=>result=x,'open');assert.equal(e.req.length,1);assert.match(decodeURIComponent(e.req[0].url),/credenciais\.temp\?_rtv_config=/);e.reply(e.config);assert.equal(e.req.length,2);assert.match(decodeURIComponent(e.req[1].url),/player_api\.php/);e.reply(e.ok);assert.equal(result,null);assert.equal(e.w.XT10.state.authed,true);assert.equal(e.req.length,2);e.w.XT10.cats('c',()=>{});e.reply('[{"category_id":"1","category_name":"Live"}]');e.w.XT10.items('c',{id:'1',n:'Live'},()=>{});assert.match(decodeURIComponent(e.req.at(-1).url),/category_id=1/);assert.ok(e.req.every(x=>!decodeURIComponent(x.url).includes('/get.php?')));e.close();pass('one config + one account request; category required; never downloads get.php');
}
for(const diagnostic of ['remote trace file failed','<!doctype html><html>Remote trace file failed</html>',JSON.stringify({error:'Remote trace file failed'})]) {
 const e=fixture();let result;e.w.XT10.ensureAuth(x=>result=x,'open');e.reply(e.config);e.reply(diagnostic);assert.equal(e.req.length,3);assert.match(e.req.at(-1).url,/^http:\/\/fixture\.invalid\/player_api\.php/);e.reply(e.ok);assert.equal(result,null);assert.equal(e.w.XT10.state.authed,true);e.close();pass('HTTP 200 transport diagnostic is not an API response; same endpoint direct fallback');
}
{
 const e=fixture();let result;e.w.XT10.ensureAuth(x=>result=x,'open');e.reply('\uFEFF'+e.config);e.reply('\uFEFF'+e.ok);assert.equal(result,null);assert.equal(e.req.length,2);e.close();pass('UTF-8 BOM in config and account JSON does not trigger false retries');
}
{
 const e=fixture();let result;e.w.XT10.ensureAuth(x=>result=x,'open');e.reply(e.config);e.reply('Denied',403);assert.equal(e.req.length,2);assert.equal(result,'HTTP 403');assert.equal(e.w.XT10.state.authed,false);e.close();pass('explicit HTTP 403 is terminal, never retried directly');
}
{
 const e=fixture();let result;e.w.XT10.ensureAuth(x=>result=x,'open');e.reply(e.config);e.reply(JSON.stringify({user_info:{auth:1,status:'Expired',exp_date:1},server_info:{timestamp_now:10000}}));assert.match(result,/inativa|expirada/);assert.equal(e.req.length,2);assert.equal(e.w.XT10.state.authed,false);e.close();pass('inactive or expired account remains blocked without alternate-route auth bypass');
}
{
 const e=fixture();let result;e.w.XT10.ensureAuth(x=>result=x,'open');e.reply(e.config);e.reply('remote trace file failed');const pending=e.req.at(-1);e.w.XT10.cancel();assert.equal(pending.aborted,true);pending.reply(200,e.ok);e.tick();assert.equal(result,undefined);e.close();pass('exit cancels direct fallback; late account reply cannot reopen player');
}
{
 const e=fixture(),x=e.w.XT10;const c=x.cred('https://fixture.invalid:8443/sub/get.php?username=u%2B1&password=p%26%3D','');assert.equal(c.d,'https://fixture.invalid:8443/sub');assert.equal(c.u,'u+1');assert.equal(c.p,'p&=');e.close();pass('credential parser preserves HTTPS, port, subdirectory and encoded values');
}
{
 const e=fixture(),x=e.w.XT10;let result;x.ensureAuth(z=>result=z,'open');e.reply(e.config);e.reply(e.ok);x.state.cats.c=[{id:'old'}];e.w.localStorage.setItem('xtream.favorites.v14','keep-favorites');e.w.localStorage.setItem('xtream.progress.v14','keep-progress');e.w.localStorage.setItem('xtream.continue.v14','keep-continue');x.ensureAuth(z=>result=z,'open');e.reply(e.config.replace('fixture.invalid','other.invalid'));e.reply(e.ok);assert.equal(result,null);assert.equal(x.state.cats.c,null);assert.equal(e.w.localStorage.getItem('xtream.favorites.v14'),'keep-favorites');assert.equal(e.w.localStorage.getItem('xtream.progress.v14'),'keep-progress');assert.equal(e.w.localStorage.getItem('xtream.continue.v14'),'keep-continue');e.close();pass('new remote account refreshes category cache while preserving favorites and progress');
}
{
 const e=fixture();let result;e.w.XT10.ensureAuth(z=>result=z,'open');e.reply(e.config);e.reply('remote trace file failed');e.reply('remote trace file failed');assert.match(result,/JSON inválido/);assert.equal(e.req.length,3);e.close();pass('invalid bridge and direct responses terminate after bounded same-endpoint attempts');
}
{
 const e=fixture({ui:true}),d=e.w.document;d.getElementById('rawLaunch').click();assert.match(d.getElementById('r14body').textContent,/Autenticando/);e.reply(e.config);e.reply('remote trace file failed');e.reply(e.ok);assert.match(decodeURIComponent(e.req.at(-1).url),/get_live_categories/);e.reply('[{"category_id":"1","category_name":"Fixture live"}]');assert.match(decodeURIComponent(e.req.at(-1).url),/category_id=1/);e.reply('[{"stream_id":11,"name":"Fixture channel"}]');assert.ok(d.querySelector('.ch14'));assert.equal(d.querySelector('.ch14').textContent,'Fixture channel');d.getElementById('r14back').click();e.close();pass('complete UI open survives a bridge trace response and loads the category/channel through real core + guard');
}
console.log('Network 6.5.6:',passes,'scenarios PASS (no external accounts)');
