const fs=require('fs'),assert=require('node:assert/strict');
const app=fs.readFileSync('apps/player1/app.remote51.js','utf8');
const ui=fs.readFileSync('system/injections/xtream-ui-v51.js','utf8');
const router=fs.readFileSync('system/injections/xtream-stream-router-v22.js','utf8');

assert.match(router,/auto\(h,720\),auto\(h,1080\),h/,'720p must remain the primary live profile');
assert.doesNotMatch(router,/maxh.*,480/,'live correction must not lower image quality to 480p');
assert.match(app,/tm-first>=4200/,'native live must recover the stable 0.31 A/V window');
assert.match(app,/mv>=2&&tm-lastMove<1800/,'release must require an advancing recent clock');
assert.match(app,/tm-first>=6800/,'stable-window fallback must remain bounded');
assert.match(app,/age>=12000.*accepted-eventless/,'accepted legacy playback must not be torn down only for missing telemetry');
assert.doesNotMatch(app,/O\('playFromStart'\)/,'playFromStart acceptance alone must not release audio early');
assert.match(app,/className=ff\?'hf50':'hp50'/,'preview visibility fix must remain active');
assert.match(ui,/720p estável/);
assert.match(ui,/R\.xtreamUI='0\.51'/);
console.log('remote51 regressions PASS');
