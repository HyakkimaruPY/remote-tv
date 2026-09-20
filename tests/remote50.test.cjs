const fs=require('fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const app=fs.readFileSync('apps/player1/app.remote50.js','utf8');
const css=fs.readFileSync('apps/player1/headless-preview-v50.css','utf8');
const router=fs.readFileSync('system/injections/xtream-stream-router-v23.js','utf8');
const ui=fs.readFileSync('system/injections/xtream-ui-v50.js','utf8');

assert.match(app,/prebuffer A\/V/,'native live must prebuffer before releasing audio/video');
assert.match(app,/mv>=1&&age>=900/,'native live must observe an advancing clock');
assert.match(app,/age>=3200/,'native preroll must remain bounded');
assert.match(app,/p\.className=hc\?'hf50':'fs'/,'headless fullscreen must keep the surface visible');
assert.match(app,/className=ff\?'hf50':'hp50'/,'headless preview must use a visible surface');
assert.match(app,/v\.muted=true/,'HTML live must hold audio until media proof');
assert.match(app,/v\.muted=false/,'HTML live must release audio after media proof');
assert.match(css,/#player\.hp50\{display:block!important/,'preview surface must override the generic hidden class');
assert.match(css,/left:326px;top:84px;width:954px;height:486px/,'preview surface must match the collapsed live viewport');
assert.match(css,/#player\.hf50/,'fullscreen headless surface must remain renderable');
assert.match(ui,/480p decoder-safe/,'live UI must identify the decoder-safe profile');
assert.match(ui,/720p fallback/,'720p must remain available as fallback');

const logs=[];
const context={RemoteTV:{},XT10:{state:{c:{d:'http://provider',u:'u',p:'p'}},log:(a,b)=>logs.push(a+' '+b),mask:x=>x}};
context.window=context;
vm.runInNewContext(router,context);
const routes=context.XT10.liveRoutes({t:'c',id:77});
assert.equal(routes.length,3);
assert.match(routes[0],/maxh=480$/,'480p must be the first compatibility route');
assert.match(routes[1],/maxh=720$/,'known working 720p route must remain second');
assert.equal(routes[2],'http://provider/live/u/p/77.m3u8','direct provider route must remain as final fallback');
assert.equal(context.RemoteTV.streamRouter,'0.23');

console.log('remote50 regressions PASS');
