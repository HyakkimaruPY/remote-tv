const fs=require('fs'),assert=require('node:assert/strict');
const app=fs.readFileSync('apps/player1/app.remote49.js','utf8');
const auto=fs.readFileSync('system/injections/autovod-v23.js','utf8');
const vod=fs.readFileSync('system/injections/xtream-vod-player-v49.js','utf8');
const ui=fs.readFileSync('system/injections/xtream-ui-v49.js','utf8');

assert.doesNotMatch(app,/setTimeout\(A,11000\)/,'live playback must not rotate routes on an eventless timer');
assert.match(app,/error-before-frame/,'live must fall back on a real pre-frame error');
assert.match(app,/media proof/,'live must preserve a route after media evidence');
assert.match(auto,/fast start/,'VOD resolver must expose the optimistic no-probe route');
assert.match(vod,/AutoVOD FAST · sem probe inicial/,'movies and episodes must use the fast route before probing');
assert.match(vod,/HTML5 legado sem eventos/,'VOD must preserve play accepted by legacy WebKit');
assert.match(vod,/HTML5 error antes de quadro/,'VOD must still reject a real pre-frame error');
assert.match(vod,/conexão preservada \+ play rearmado/,'long playback stalls with healthy buffer must re-arm play without replacing the source');
assert.match(ui,/r\.id='lfc49'/,'headless fullscreen must own a visible control overlay');
assert.match(ui,/if\(k==38\)showFullCtl49\('lfc49exit'\)/,'Up must reveal the fullscreen controls');
assert.match(ui,/Voltar<\/button><button id="lfc49exit">Sair da tela cheia<\/button><button id="lfc49log">Log/);
console.log('remote49 regressions PASS');
