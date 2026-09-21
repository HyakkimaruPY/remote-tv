const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto');
const probe=fs.readFileSync('apps/youtube3/probe-v54.js','utf8');
const loader=fs.readFileSync('system/feature-loader-v54.js','utf8');
const m=JSON.parse(fs.readFileSync('manifest.remote54.json','utf8')),by=Object.fromEntries(m.modules.map(x=>[x.id,x]));
new Function(probe);new Function(loader);
assert.doesNotMatch(probe+loader,/\b(?:let|const)\b|=>/);
assert.match(loader,/apps\/youtube3\/probe-v54\.js/);assert.match(loader,/remote-tv\.feature\.youtube3\.v54/);
assert.match(probe,/QjyMediaPlayer\|\|w\.MediaPlayer/);assert.match(probe,/setVideoDisplayMode\(1\)/);assert.match(probe,/setVideoAlpha\(0\)/);
assert.match(probe,/setAttribute\('tabindex','-1'\)/);assert.match(probe,/showChrome\('yt3logbtn'\)/);assert.match(probe,/moveHead\(-1\)/);assert.match(probe,/moveHead\(1\)/);
assert.match(probe,/arm\(8000,'iframe preto\/sem estado'\)/);assert.match(probe,/kind:'remote'/);
assert.equal(by.app.path,'apps/player1/app.remote49.js');assert.equal(by['xtream-stream-router'].path,'system/injections/xtream-stream-router-v22.js');assert.equal(by['xtream-ui'].path,'system/injections/xtream-ui-v49.js');assert.equal(by['xtream-vod-player'].path,'system/injections/xtream-vod-player-v53.js');assert.equal(by['force-update'].path,'system/injections/force-update-v53.js');
for(const x of m.modules){const b=fs.readFileSync(x.path);assert.equal(b.length,x.bytes,x.path+' bytes');assert.equal(crypto.createHash('sha256').update(b).digest('hex'),x.sha256,x.path+' sha256')}
console.log('youtube3 v54 regressions PASS');
