const fs=require('fs'),crypto=require('crypto'),assert=require('node:assert/strict');
function meta(p){const b=fs.readFileSync(p);return{bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')}}
const m=JSON.parse(fs.readFileSync('manifest.remote53.json','utf8')),by=Object.fromEntries(m.modules.map(x=>[x.id,x]));
assert.equal(m.version,'0.53');assert.equal(m.release,'2026.09.21-remote.53');
assert.equal(by.app.path,'apps/player1/app.remote49.js');
assert.equal(by['xtream-stream-router'].path,'system/injections/xtream-stream-router-v22.js');
assert.equal(by['xtream-ui'].path,'system/injections/xtream-ui-v49.js');
for(const x of m.modules){const z=meta(x.path);assert.equal(z.bytes,x.bytes,x.path+' bytes');assert.equal(z.sha256,x.sha256,x.path+' sha256')}
const shell=fs.readFileSync('apps/player1/shell.remote53.html','utf8');
const force=fs.readFileSync('system/injections/force-update-v53.js','utf8');
const vod=fs.readFileSync('system/injections/xtream-vod-player-v53.js','utf8');
assert.match(shell,/YouTube 3 teste<\/button><button id=forceUpdate>Atualizar<\/button><\/section>/);
assert.match(force,/removeItem\('remote-tv\.active\.v2'\)/);assert.match(force,/removeItem\('remote-tv\.staging\.v2'\)/);assert.doesNotMatch(force,/localStorage\.clear|remote-tv\.previous\.v2/);
assert.match(vod,/remain<=120/);assert.match(vod,/P\.nextShown\?''\:'h'/);assert.match(vod,/finishEpisode53\('html5-ended'\)/);assert.match(vod,/finishEpisode53\('hls-ended'\)/);assert.match(vod,/remain<=1\.5/);assert.match(vod,/tm\(\)-st>22000/);assert.match(vod,/lastAdvanceAt>18000/);assert.match(vod,/R\.vodPlayer='0\.53'/);
new Function(force);new Function(vod);console.log('remote53 regressions PASS');
