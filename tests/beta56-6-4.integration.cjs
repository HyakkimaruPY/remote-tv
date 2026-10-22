'use strict';
const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto'),vm=require('vm'),acorn=require('acorn'),{JSDOM}=require('jsdom');
const candidate=JSON.parse(fs.readFileSync('manifest.beta56-6-4.json','utf8'));
const previous=JSON.parse(fs.readFileSync('manifest.beta56-6-3.json','utf8'));
assert.equal(candidate.version,'0.56-beta.6.4');assert.equal(candidate.modules.length,30);
const entry=(id,m=candidate)=>m.modules.find(x=>x.id===id);
for(const m of candidate.modules){
 const b=fs.readFileSync(m.path);
 assert.equal(b.length,m.bytes,m.path+' bytes');
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),m.sha256,m.path+' sha');
 if(m.type==='js'){acorn.parse(b.toString('utf8'),{ecmaVersion:5,allowReturnOutsideFunction:false});}
}
for(const id of ['app','xtream-lazy-core','xtream-api-first','xtream-auth-guard','xtream-vod-player','common-player-ui','style','graphos-skin']){
 assert.equal(entry(id).sha256,entry(id,previous).sha256,'preserved '+id);
}
assert.notEqual(entry('xtream-ui').sha256,entry('xtream-ui',previous).sha256);
assert.equal(candidate.modules.some(x=>x.id==='diagnostic-libraries'),false);
const mgr=fs.readFileSync(entry('philco-library-manager').path,'utf8');
const wasmBase=/WASM='([^']+)'/.exec(mgr);assert.ok(wasmBase,'core base64 missing');
const binary=fs.readFileSync('philco/bibliotecas/nucleo-wasm/dist/core.wasm');
assert.deepEqual(Buffer.from(wasmBase[1],'base64'),binary,'WASM in manager equals compiled source artifact');
assert.ok(WebAssembly.validate(binary));const inst=new WebAssembly.Instance(new WebAssembly.Module(binary));
assert.equal(inst.exports.classify(200,20),2);assert.equal(inst.exports.classify(500,20),0);
assert.equal(inst.exports.quality(0,0,10),2);assert.equal(inst.exports.quality(5,0,10),1);
const shell=fs.readFileSync(entry('shell').path,'utf8');
const dom=new JSDOM('<!doctype html><html><head></head><body>'+shell+'</body></html>',{url:'http://localhost:8080',runScripts:'outside-only'});
const w=dom.window;let requests=[],opened=[];
class Scope {
 constructor(){this.stopped=false;}
 cancel(){this.stopped=true;}
 local(url,cb){requests.push('LOCAL '+url);cb(null,'ok');}
 fetch(url,cb){requests.push(url);if(/category_id=1/.test(url))setTimeout(()=>{if(!this.stopped)cb(null,JSON.stringify([{stream_id:51,name:'Canal Teste',stream_icon:'p'}]));},5);
 else if(/category_id=2/.test(url))setTimeout(()=>{if(!this.stopped)cb(null,JSON.stringify([{stream_id:52,name:'Outro Canal'}]));},5);
 else cb(null,'ok');}
}
w.RemoteTV={RequestScope:Scope};w.WebAssembly=WebAssembly;w.atob=s=>Buffer.from(s,'base64').toString('binary');
for(const id of ['philco-qrcode','philco-search-catalog','philco-search-ui','philco-library-manager','philco-module-diagnostic','philco-module-watchdog','philco-module-network','philco-module-search'])w.eval(fs.readFileSync(entry(id).path,'utf8'));
assert.equal(w.PhilcoSearch64.enabled(),false,'search opt-in');
assert.equal(w.RemoteTV.libraryManager.enabled('search'),false);
assert.equal(requests.length,0,'no probing on boot');
w.document.getElementById('rtvLibs').click();
let switches=[...w.document.querySelectorAll('#rtvLibPanel button')];
assert.ok(switches.some(b=>/Reiniciar motores/.test(b.textContent)));
assert.ok(w.document.getElementById('rtvLibPanel').textContent.includes('requer reinício'));
const panel=w.document.getElementById('rtvLibPanel');
let searchRow=[...panel.querySelectorAll('div')].find(d=>d.textContent.indexOf('Busca contextual · vermelho e QR')===0&&d.querySelector('button'));
assert.ok(searchRow,'search toggle row');
searchRow.querySelector('button').click();
assert.equal(w.RemoteTV.libraryManager.enabled('search'),true);
assert.equal(w.RemoteTV.libraryManager.needsRestart(),true);
assert.equal(w.PhilcoSearch64.enabled(),false,'activation waits for player restart');
w.RemoteTV.libraryManager.close();
w.XT10={state:{c:{d:'http://server.invalid',u:'u',p:'p'},cats:{c:[{id:'1',n:'Notícias'},{id:'2',n:'Outros'}]},cat:{id:'1',n:'Notícias'}}};
await new Promise((resolve,reject)=>{
 let finished=false;
 w.PhilcoSearchCatalog64.search('c','teste',(items,done)=>{
   if(done&&!finished){finished=true;try{assert.equal(items.length,1);assert.equal(items[0].n,'Canal Teste');assert.equal(items[0]._catId64,'1');resolve();}catch(e){reject(e);}}
 },[]);
 setTimeout(()=>{if(!finished)reject(Error('search timed out'));},500);
});
assert.equal(requests.filter(u=>u.includes('get_live_streams')).every(u=>/category_id=/.test(u)),true,'no global catalog requests');
w.close();
const http=require('http');process.env.PUBLIC_BASE_URL='http://127.0.0.1:8766';
const handler=require('../philco/bibliotecas/teclado-remoto/server.cjs').server;
const server=http.createServer(handler);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
function call(path,method='GET',body=''){return new Promise((resolve,reject)=>{const req=http.request({hostname:'127.0.0.1',port,path,method,headers:method==='POST'?{'Content-Type':'application/x-www-form-urlencoded'}:{}},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>resolve({status:res.statusCode,data:b}));});req.on('error',reject);req.end(body);});}
try{
 const created=await call('/session/create');assert.equal(created.status,200);const s=JSON.parse(created.data);assert.ok(s.phoneUrl.includes('/phone?'));
 const denied=await call('/session/poll?sid='+encodeURIComponent(s.sid)+'&token=wrong');assert.equal(denied.status,403);
 const phoneToken=new URL(s.phoneUrl).searchParams.get('token');
 const posted=await call('/session/send','POST','sid='+s.sid+'&token='+phoneToken+'&q=Teste%20pela%20TV');assert.equal(posted.status,200);
 const poll=await call('/session/poll?sid='+s.sid+'&token='+s.tvToken);assert.equal(JSON.parse(poll.data).q,'Teste pela TV');
}finally{await new Promise(resolve=>server.close(resolve));}
console.log('PASS Philco 6.4 candidate: 30 hashes, WASM binary, ES5, opt-in modules, Xtream scoped search, authenticated phone relay');
