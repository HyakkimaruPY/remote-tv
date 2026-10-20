'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),acorn=require('acorn');
const source=fs.readFileSync('system/readable/force-update.beta56-6-1.js','utf8');
const shell=fs.readFileSync('apps/player1/shell.beta56-6-1.html','utf8');
acorn.parse(source,{ecmaVersion:5});
assert.match(shell,/id="rtvVersionTitle"/);
assert.doesNotMatch(shell,/Smart · Beta 0\.56\.5/);
let passed=0;function pass(x){passed++;console.log('PASS '+x)}
function harness(opts={}){
  let stamp=0,seq=0,reloads=0,deleted=0,syncCalls=0;
  const tasks=new Map(),nodes={rtvVersionTitle:{textContent:''},forceUpdate:{}};
  const body={appendChild(el){nodes[el.id]=el;el.parentNode={removeChild(){delete nodes[el.id]}}}};
  const doc={body,getElementById(id){return nodes[id]||null},createElement(tag){return {tag,style:{},textContent:'',id:''}}};
  const storage={map:new Map([['remote-tv.active.v2',JSON.stringify({manifest:{release:opts.oldRelease||'2026.10.19-beta.56.5'}})]]),
    getItem(k){return this.map.get(k)||null},setItem(k,v){this.map.set(k,v)},
    removeItem(k){deleted++;this.map.delete(k)}};
  const R={release:opts.release||'2026.10.20-beta.56.6.1',mode:'remote-cache-ready',lastError:'',
    sync:opts.noSync?undefined:function(first){syncCalls++;assert.equal(first,false); if(opts.error)R.lastError='modules:xtream-ui:HTTP 502';}};
  const windowRef={RemoteTV:R,localStorage:storage,location:{reload(){reloads++}}};
  const ctx={windowRef,documentRef:doc,document:doc,setTimeout(fn,ms){let id=++seq;tasks.set(id,{fn,at:stamp+ms});return id},clearTimeout(id){tasks.delete(id)}};
  vm.createContext(ctx);vm.runInContext(source,ctx);
  function tick(ms){let end=stamp+ms;for(let i=0;i<1000;i++){let next=[...tasks].filter(x=>x[1].at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;tasks.delete(next[0]);stamp=next[1].at;next[1].fn();if(i===999)throw Error('unbounded timer')}stamp=end}
  return {R,nodes,storage,tick,get deleted(){return deleted},get syncCalls(){return syncCalls},get reloads(){return reloads},tasks};
}
{
 const e=harness();assert.equal(e.nodes.rtvVersionTitle.textContent,'Smart · Beta 0.56.6.1');
 assert.equal(e.R.forceUpdate,'0.56-beta.6.1');pass('title reads actually applied runtime release; never retains Beta5 hardcode');
}
{
 const e=harness();e.nodes.forceUpdate.onclick();assert.equal(e.syncCalls,1);assert.equal(e.deleted,0);
 assert.ok(e.storage.getItem('remote-tv.active.v2'),'verified cache remains intact');
 e.storage.setItem('remote-tv.active.v2',JSON.stringify({manifest:{release:'2026.10.21-beta.56.6.2'}}));
 e.tick(1000);assert.equal(e.reloads,0);e.tick(220);assert.equal(e.reloads,1);
 assert.equal(e.deleted,0);pass('force checks remote, reloads only after updated verified cache is saved');
}
{
 const e=harness({error:true});e.nodes.forceUpdate.onclick();e.tick(1000);
 assert.match(e.nodes.rtvForce53.textContent,/Falha: modules/);assert.equal(e.deleted,0);
 assert.equal(e.reloads,0);pass('network/module failure preserves previous version and explains error');
}
{
 const e=harness({noSync:true});e.nodes.forceUpdate.onclick();
 assert.match(e.nodes.rtvForce53.textContent,/Atualizador indisponível/);
 assert.equal(e.deleted,0);assert.equal(e.reloads,0);pass('missing native bootstrap synchronization does not erase current release');
}
{
 const e=harness({release:'2026.10.19-beta.56.5'});assert.equal(e.nodes.rtvVersionTitle.textContent,'Smart · Beta 0.56.5');
 pass('runtime title accurately distinguishes installed Beta5 from Beta6.1');
}
console.log('Philco Beta6 update contract:',passed,'PASS');
