const fs=require('fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const router=fs.readFileSync('system/injections/xtream-stream-router-v24.js','utf8');
const ui=fs.readFileSync('system/injections/xtream-ui-v52.js','utf8');
const app=fs.readFileSync('apps/player1/app.remote51.js','utf8');

assert.doesNotMatch(router,/maxh=/,'live router must not impose a height limit');
assert.match(router,/return\[auto\(h\),h\]/,'adaptive bridge route must retain direct fallback');
assert.match(router,/streamRouter='0\.24'/);
assert.match(ui,/origem adaptável sem maxh/);
assert.match(ui,/R\.xtreamUI='0\.52'/);
assert.match(app,/tm-first>=4200/,'stable A/V window from 0.51 must remain active');
assert.match(app,/className=ff\?'hf50':'hp50'/,'preview fix must remain active');

const context={RemoteTV:{},XT10:{state:{c:{d:'http://provider',u:'u',p:'p'}},log:()=>{},mask:x=>x}};
context.window=context;
vm.runInNewContext(router,context);
const routes=context.XT10.liveRoutes({t:'c',id:77});
assert.equal(routes.length,2);
assert.equal(routes[0],'http://127.0.0.1:8765/hls?u='+encodeURIComponent('http://provider/live/u/p/77.m3u8'));
assert.equal(routes[1],'http://provider/live/u/p/77.m3u8');
assert.ok(!/[?&]maxh=/.test(routes[0]));
console.log('remote52 regressions PASS');
