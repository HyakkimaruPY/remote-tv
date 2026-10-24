'use strict';
(async function(){
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto'),acorn=require('acorn');
const {JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(p,'utf8');
const manifest=JSON.parse(read('manifest.beta56-6-5.json'));
const entry=id=>manifest.modules.find(x=>x.id===id);
assert.equal(manifest.version,'0.56-beta.6.5');
assert.equal(manifest.modules.length,38);
for(const x of manifest.modules){
 const b=fs.readFileSync(x.path);assert.equal(b.length,x.bytes,x.path);
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),x.sha256,x.id);
 if(x.type==='js')acorn.parse(b.toString('utf8'),{ecmaVersion:5});
}
for(const id of ['app','xtream-lazy-core','xtream-vod-player','common-player-ui','graphos-skin','style','hlsjs-loader','autovod']){
 const old=JSON.parse(read('manifest.beta56-6-4-2.json')).modules.find(x=>x.id===id);
 assert.equal(entry(id).sha256,old.sha256,'player core unchanged: '+id);
}
const shell=read(entry('shell').path);
assert.match(shell,/id=rawLaunch[\s\S]*<strong>M3U<\/strong>/);
assert.match(shell,/id=rtvSearchHome/);
assert.match(shell,/id=rtvLibs/);
assert.doesNotMatch(shell,/\bMP3\b/i);

const dom=new JSDOM('<!doctype html><html><head></head><body>'+shell+'</body></html>',{url:'http://philco.test',runScripts:'outside-only'});
const w=dom.window,d=w.document;let now=10000;
const BaseDate=w.Date;w.Date=function(){return new BaseDate(now)};w.Date.now=()=>now;
w.RemoteTV={RequestScope:function(){this.cancel=function(){};this.local=function(u,cb){cb(null,'ok')};this.fetch=function(u,cb){cb(null,'ok')};}};
w.eval(read(entry('philco-library-manager').path));
for(const id of ['philco-module-diagnostic','philco-module-watchdog','philco-module-network','philco-module-search','philco-module-assembly','philco-module-localhost','philco-module-performance','philco-module-ir','philco-module-render-scheduler','philco-module-visual-compositor']){
 w.eval(read(entry(id).path));
}
w.PhilcoSearch642={enabled:()=>false};
w.PhilcoSearchAdapter={active:()=>false};
w.eval(read(entry('launcher-surface').path));
await new Promise(r=>setTimeout(r,40));
assert.ok(d.getElementById('rtvPlayerLauncher65'));
assert.ok(w.RemoteTV.renderScheduler65);
assert.ok(d.getElementById('rtvVisualCompositor65'));
assert.match(d.getElementById('rtvSearchHome').className,/rtv65disabled/);

d.getElementById('rtvLibs').click();
assert.equal(w.RemoteTV.libraryManager._inspect().rows,11);
assert.equal(w.RemoteTV.libraryManager._focused(),'rtvLibToggle-diagnostico');
function key(k){now+=180;const ev=new w.Event('keydown',{bubbles:true,cancelable:true});Object.defineProperty(ev,'keyCode',{value:k});Object.defineProperty(ev,'which',{value:k});d.activeElement.dispatchEvent(ev);}
key(40);assert.equal(w.RemoteTV.libraryManager._focused(),'rtvLibToggle-estabilidade');
key(13);key(39);assert.equal(w.RemoteTV.libraryManager._focused(),'rtvLibTest-estabilidade');
key(40);assert.equal(w.RemoteTV.libraryManager._focused(),'rtvLibTest-network');
key(37);assert.equal(w.RemoteTV.libraryManager._focused(),'rtvLibToggle-network');
w.RemoteTV.libraryManager.close();

d.getElementById('rtvSearchHome').click();
assert.equal(w.RemoteTV.libraryManager.isOpen(),true,'disabled search routes to library center');
w.RemoteTV.libraryManager.close();

assert.equal(w.RemoteTV.libraryManager.enabled('render-scheduler'),true);
assert.equal(w.RemoteTV.libraryManager.enabled('visual-compositor'),true);
dom.window.close();
console.log('PASS Philco 6.5 launcher: 38 hashes, ES5, launcher labels, library center, scheduler and reversible compositor');
})().catch(e=>{console.error(e);process.exitCode=1;});
