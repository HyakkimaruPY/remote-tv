'use strict';
(async function(){
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto'),acorn=require('acorn');
const {JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(p,'utf8');
const manifest=JSON.parse(read('manifest.beta56-6-4-2.json'));
const prev=JSON.parse(read('manifest.beta56-6-4-1.json'));
const entry=(id,m=manifest)=>m.modules.find(x=>x.id===id);
assert.equal(manifest.version,'0.56-beta.6.4.2');
assert.equal(manifest.modules.length,35);
for(const x of manifest.modules){const b=fs.readFileSync(x.path);assert.equal(b.length,x.bytes,x.path);
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),x.sha256,x.id);
 if(x.type==='js')acorn.parse(b.toString('utf8'),{ecmaVersion:5});}
for(const id of ['app','xtream-lazy-core','xtream-vod-player','common-player-ui','graphos-skin','style','hlsjs-loader','autovod'])assert.equal(entry(id).sha256,entry(id,prev).sha256,'player core unchanged: '+id);

// Xtream search: exactly 3 characters, all tab categories, zero all-catalog requests, only matches retained.
const seen=[],catalog=read(entry('philco-search-catalog').path),scope={
 XT10:{state:{c:{d:'https://iptv.invalid',u:'u',p:'p'},cats:{c:[{id:'1',n:'Notícias'},{id:'2',n:'Esporte'},{id:'3',n:'Diversos'}]},cat:{id:'2'}}},
 RemoteTV:{RequestScope:function(){this.cancel=function(){};this.fetch=function(url,callback){seen.push(url);
 const id=/category_id=([^&]+)/.exec(url)[1];
 const raw=JSON.stringify(id==='1'?[{stream_id:11,name:'Canal Alpha',stream_icon:'https://img.invalid/a.png'},{stream_id:12,name:'Outro'}]:
 id==='2'?[{stream_id:20,name:'Canal Bola',stream_icon:'https://img.invalid/b.png'}]:[{stream_id:30,name:'Ação'}]);
 setTimeout(()=>callback(null,raw),5);};}},
 setTimeout,clearTimeout,Date,JSON,encodeURIComponent};
scope.window=scope;vm.createContext(scope);vm.runInContext(catalog,scope);
let results=null;
scope.PhilcoSearchCatalog642.search('c','ca',()=>{throw Error('unexpected search')});
assert.equal(seen.length,0,'no request before three letters');
await new Promise((resolve,reject)=>{
 const guard=setTimeout(()=>reject(Error('API walk timeout')),1800);
 scope.PhilcoSearchCatalog642.search('c','can',(arr,done)=>{if(done){clearTimeout(guard);results=arr;resolve();}});
});
assert.equal(results.length,2);assert.equal(seen.length,3);
assert.ok(seen.every(u=>u.includes('&category_id=')));assert.deepEqual([...new Set(seen.map(u=>u.match(/category_id=([^&]+)/)[1]))],['1','2','3']);

// Search overlay, directional keyboard and virtualized results.
const dom=new JSDOM('<!doctype html><body></body>',{url:'http://philco.test',runScripts:'outside-only'});
const w=dom.window,d=w.document,called=[],opened=[];
w.localStorage.setItem('remote-tv.libs.beta6.v1',JSON.stringify({search:true}));
w.PhilcoSearchAdapter={active:()=>true,currentCategory:()=> 'c',search:(type,q,cb)=>{called.push({type,q});const list=[];
 for(let i=0;i<17;i++)list.push({id:i+1,n:'Canal '+i,p:'https://img.invalid/'+i+'.png',_catName64:'Teste'});
 cb(list,true,'Pronto');return {cancel(){}};},open:(t,o)=>opened.push([t,o.id])};
w.PhilcoLocalhost642={begin:cb=>cb('Serviço nativo não instalado')};
w.eval(read(entry('philco-search-ui').path));assert.equal(w.PhilcoSearch642.open('c'),true);
assert.equal(d.activeElement.id,'ph642input');
function key(k){const ev=new w.Event('keydown',{bubbles:true,cancelable:true});Object.defineProperty(ev,'keyCode',{value:k});Object.defineProperty(ev,'which',{value:k});d.activeElement.dispatchEvent(ev);}
key(40);assert.equal(d.activeElement.getAttribute('data-name'),'A');
await new Promise(r=>setTimeout(r,160));key(39);assert.equal(d.activeElement.getAttribute('data-name'),'B');
await new Promise(r=>setTimeout(r,160));key(40);assert.equal(d.activeElement.getAttribute('data-name'),'I');
key(38);key(38);assert.equal(d.activeElement.id,'ph642input');
const input=d.getElementById('ph642input');
input.value='ca';input.dispatchEvent(new w.Event('input',{bubbles:true}));
await new Promise(r=>setTimeout(r,80));assert.equal(called.length,0,'two chars do not search');
input.value='canal';input.dispatchEvent(new w.Event('input',{bubbles:true}));
await new Promise(r=>setTimeout(r,200));assert.equal(called.length,0,'must wait for pause');
await new Promise(r=>setTimeout(r,1900));
assert.equal(called.length,1);assert.equal(called[0].q,'canal');
await new Promise(r=>setTimeout(r,230));assert.equal(d.querySelectorAll('#ph642results button').length,12);
const cover=d.querySelector('#ph642results button div');assert.equal(cover.style.width,'76px');assert.equal(cover.style.height,'76px');
key(39);assert.equal(d.activeElement.id,'ph642result0');key(40);assert.equal(d.activeElement.id,'ph642result2');
key(13);assert.deepEqual(opened,[['c',3]]);assert.equal(w.PhilcoSearch642.isOpen(),false);
w.close();

// Manager two-axis navigation: Down goes to next module, Right switches within module.
const d2=new JSDOM('<!doctype html><body><button id="rtvLibs">Bibliotecas</button></body>',{url:'http://philco.test',runScripts:'outside-only'});
const x=d2.window;let now=10000;
const BaseDate=x.Date;x.Date=function(){return new BaseDate(now)};x.Date.now=()=>now;
x.RemoteTV={RequestScope:function(){this.cancel=function(){};this.local=function(u,cb){cb(null,'ok')};this.fetch=function(u,cb){cb(null,'ok')};}};
x.eval(read(entry('philco-library-manager').path));
for(const id of ['philco-module-diagnostic','philco-module-watchdog','philco-module-network','philco-module-search','philco-module-assembly','philco-module-localhost','philco-module-performance','philco-module-ir'])
 x.eval(read(entry(id).path));
x.RemoteTV.libraryManager.open();
function down(k){now+=180;const evt=new x.Event('keydown',{bubbles:true,cancelable:true});Object.defineProperty(evt,'keyCode',{value:k});Object.defineProperty(evt,'which',{value:k});x.document.activeElement.dispatchEvent(evt);}
assert.equal(x.RemoteTV.libraryManager._focused(),'rtvLibToggle-diagnostico');
down(40);assert.equal(x.RemoteTV.libraryManager._focused(),'rtvLibToggle-estabilidade','one press down to next module');
down(39);assert.equal(x.RemoteTV.libraryManager._focused(),'rtvLibToggle-estabilidade','test disabled cannot steal right');
down(13);down(39);assert.equal(x.RemoteTV.libraryManager._focused(),'rtvLibTest-estabilidade','right selects Testar');
down(40);assert.equal(x.RemoteTV.libraryManager._focused(),'rtvLibTest-network','down keeps same column on next module');
down(37);assert.equal(x.RemoteTV.libraryManager._focused(),'rtvLibToggle-network','left returns within same module');
x.close();
console.log('PASS Philco 6.4.2: hashes, ES5, 3-char debounce, API tab sweep, 12 thumbnails, TV arrows, 2D library controls');
})().catch(e=>{console.error(e);process.exitCode=1;});
