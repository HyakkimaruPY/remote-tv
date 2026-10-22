'use strict';
const fs=require('fs'),crypto=require('crypto'),assert=require('node:assert/strict'),acorn=require('acorn'),vm=require('vm'),{JSDOM}=require('jsdom');
const m=JSON.parse(fs.readFileSync('manifest.json','utf8')),arch=JSON.parse(fs.readFileSync('manifest.beta56-6-3.json','utf8')),old=JSON.parse(fs.readFileSync('manifest.beta56-6.json','utf8'));
assert.deepEqual(m,arch);assert.equal(m.version,'0.56-beta.6.3');assert.equal(m.release,'2026.10.22-beta.56.6.3');
assert.equal(m.modules.length,23);
function mod(id,manifest){return manifest.modules.find(x=>x.id===id);}
for(const id of ['xtream-ui','xtream-api-first','xtream-lazy-core','xtream-stream-router','xtream-vod-player','common-player-ui']){assert.equal(mod(id,m).path,mod(id,old).path,id);assert.equal(mod(id,m).sha256,mod(id,old).sha256,id);}
for(const x of m.modules){const b=fs.readFileSync(x.path);assert.equal(b.length,x.bytes,x.id+' bytes');assert.equal(crypto.createHash('sha256').update(b).digest('hex'),x.sha256,x.id+' hash');}
assert.equal(mod('style',m).path,'apps/player1/style.beta56-6-2.css');
assert.equal(mod('graphos-skin',m).path,'system/injections/graphos-skin-beta56-6-2.js');
const src=fs.readFileSync(mod('diagnostic-libraries',m).path,'utf8'),html=fs.readFileSync(mod('shell',m).path,'utf8');
acorn.parse(src,{ecmaVersion:5});assert.match(html,/id=rtvLibs/);
const encoded=/var KEY='[^']+',WASM='([^']+)'/.exec(src);assert.ok(encoded);
const wasm=Buffer.from(encoded[1],'base64');assert.ok(WebAssembly.validate(wasm));
const inst=new WebAssembly.Instance(new WebAssembly.Module(wasm));assert.equal(inst.exports.classify(200,150),2);assert.equal(inst.exports.classify(200,3400),1);assert.equal(inst.exports.classify(503,100),0);
const dom=new JSDOM('<!doctype html><html><head></head><body>'+html+'</body></html>',{url:'http://test.local',runScripts:'outside-only'});const w=dom.window;let calls=[];
class Scope{cancel(){}local(url,cb){calls.push('local');cb(null,'ok')}fetch(url,cb){assert.match(url,/^https:\/\/raw\.githubusercontent\.com/);calls.push('https');cb(null,'ok')}}
w.atob=s=>Buffer.from(s,'base64').toString('binary');w.WebAssembly=WebAssembly;w.RemoteTV={RequestScope:Scope};
w.eval(src);assert.equal(calls.length,0);assert.equal(w.document.getElementById('rtvLibPanel'),null);
w.document.getElementById('rtvLibs').click();let rows=w.document.querySelectorAll('#rtvLibPanel>div:nth-of-type(2)>div');if(rows.length!==2)rows=w.document.querySelectorAll('#rtvLibPanel div[style*="padding: 15px"]');assert.equal(rows.length,2);
assert.equal(w.RemoteTV.libraryManager.enabled('network'),true);rows[0].querySelectorAll('button')[1].click();assert.deepEqual(calls,['local','https']);
rows[0].querySelector('button').click();assert.equal(w.RemoteTV.libraryManager.enabled('network'),false);assert.equal(rows[0].querySelectorAll('button')[1].disabled,true);
rows[1].querySelectorAll('button')[1].click();assert.equal(calls.length,3);
assert.match(rows[1].textContent,/certificado não inspecionado/);
w.RemoteTV.libraryManager.close();assert.equal(w.document.getElementById('rtvLibPanel').style.display,'none');assert.match(w.localStorage.getItem('remote-tv.libs.beta6.v1'),/"network":false/);
assert.equal(w.RemoteTV.libraryManager.register({id:'future',title:'Nova biblioteca',test:function(){}}),true);
assert.ok(['WebAssembly ativo','ES5 compatível'].includes(w.RemoteTV.libraryManager.engine()));
const v=fs.readFileSync('version','utf8').trim();assert.ok(v==='0.56-beta.6.2'||v==='0.56-beta.6.3');
console.log('PASS Philco Beta 6 original engines, theme, 23 hashes, real Wasm and isolated diagnostics');
