'use strict';
const fs=require('fs'),assert=require('node:assert/strict'),vm=require('vm'),crypto=require('crypto'),{JSDOM}=require('jsdom'),acorn=require('acorn');
const read=p=>fs.readFileSync(p,'utf8'),m=JSON.parse(read('manifest.beta56-6-5-2.json'));
const file=id=>m.modules.find(x=>x.id===id).path,code=id=>read(file(id));
let passes=0;function pass(s){console.log('PASS',s);passes++;}
for(const x of m.modules){const b=fs.readFileSync(x.path);assert.equal(b.length,x.bytes,x.id);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),x.sha256,x.id);if(x.type==='js')acorn.parse(b.toString(),{ecmaVersion:5});}
pass('48 module bytes/hashes and ES5');
function dom(){const d=new JSDOM('<html><head></head><body>'+code('shell')+'</body></html>',{url:'http://127.0.0.1/player',runScripts:'outside-only'});d.window.RemoteTV={RequestScope:function(){this.cancel=function(){};}};return d;}
function client(){const d=dom(),w=d.window,requests=[];class X{open(method,url){this.method=method;this.url=url;}setRequestHeader(){}send(){requests.push(this);}abort(){this.aborted=true;}reply(status,obj){this.status=status;this.responseText=JSON.stringify(obj);this.readyState=4;if(this.onreadystatechange)this.onreadystatechange();}}
w.XMLHttpRequest=X;w.eval(code('philco-localhost-client'));return {d,w,requests,p:w.PhilcoPortal651};}
{
 const x=client();let result;x.p.capabilities((e,d)=>result={e,d});assert.match(x.requests[0].url,/:8765/);x.requests[0].reply(404,{});assert.match(x.requests[1].url,/:8766/);x.requests[1].reply(200,{ok:false,helloWorld:false,reasons:['appmgr ausente']});assert.equal(result.d.helloWorld,false);assert.equal(result.d.bridges.length,2);assert.match(result.d.bridges[1].state,/appmgr ausente/);x.d.window.close();pass('missing Portal retains both bridge failures and native reasons');
}
{
 const x=client();let cap;x.p.capabilities((e,d)=>cap=d);x.requests[0].reply(200,{ok:false,helloWorld:false,reasons:['no AppMgr']});x.requests[1].reply(200,{ok:true,helloWorld:true});assert.match(cap.bridge,/:8766/);let err;x.p.enableHello(e=>err=e);assert.equal(x.requests[2].method,'POST');x.requests[2].reply(500,{});assert.match(err,/500/);assert.equal(x.requests.length,3,'mutation must never fail over');x.d.window.close();pass('unsupported primary falls back at discovery; failed POST is never replayed');
}
{
 const x=client();let calls=0;const h=x.p.capabilities(()=>calls++);h.cancel();x.requests[0].reply(404,{});assert.equal(calls,0);assert.equal(x.requests.length,1);assert.equal(x.requests[0].aborted,true);x.d.window.close();pass('cancel suppresses callbacks and fallback discovery');
}
{
 const d=dom(),w=d.window,doc=w.document;w.localStorage.setItem('remote-tv.libs.beta6.v1',JSON.stringify({'vendor-bridge':false,https:false}));w.eval(code('philco-library-manager'));const mgr=w.RemoteTV.libraryManager;
 let capOK=false,enableDone,posts=0;
 w.PhilcoPortal651={capabilities(cb){cb(capOK?null:'absent',capOK?{ok:true,helloWorld:true,bridge:'fixture'}:{ok:false,helloWorld:false,bridges:[{port:8765,state:'HTTP 404'},{port:8766,state:'Servidor ausente'}]});},status(cb){cb(null,{ok:true,installed:false,appmgr:true});},enableHello(cb){posts++;enableDone=cb;},disableHello(cb){cb(null,{ok:true,installed:false});}};
 w.eval(code('philco-module-portal-hello'));mgr.open();doc.getElementById('rtvLibTab-portal').click();assert.equal(mgr._inspect().rows,2);assert.match(doc.getElementById('rtvLibTabInfo').textContent,/8765.*404.*8766/);assert.equal(doc.getElementById('rtvLibToggle-portal-bridge').textContent,'Verificar');assert.equal(doc.getElementById('rtvLibToggle-native-app-hello'),null);
 capOK=true;doc.getElementById('rtvLibToggle-portal-bridge').click();assert.ok(doc.getElementById('rtvLibToggle-native-app-hello'));assert.equal(mgr._focused(),'rtvLibTab-portal','async registration does not steal focus');
 const toggle=doc.getElementById('rtvLibToggle-native-app-hello');toggle.click();toggle.click();assert.equal(posts,1);assert.equal(mgr.enabled('native-app-hello'),false,'do not persist speculative state');mgr.close();enableDone(null,{ok:true,installed:true});assert.equal(mgr.isOpen(),false);assert.equal(mgr.enabled('native-app-hello'),true);assert.notEqual(doc.activeElement.id,'rtvLibToggle-native-app-hello');
 const stored=JSON.parse(w.localStorage.getItem('remote-tv.libs.beta6.v1'));assert.equal(stored['vendor-bridge'],false);assert.equal(stored.https,false);
 mgr.open();doc.getElementById('rtvLibTab-portal').click();assert.equal(doc.getElementById('rtvLibToggle-native-app-hello').textContent,'Desativar');doc.getElementById('rtvLibToggle-native-app-hello').click();assert.equal(mgr.enabled('native-app-hello'),false);
 d.window.close();pass('Portal always has diagnostics, discovers Hello later and reconciles closed async mutation without focus theft');
}
{
 const d=dom(),w=d.window,doc=w.document;w.eval(code('philco-library-manager'));const mgr=w.RemoteTV.libraryManager;let finish;
 mgr.register({id:'async-fixture',title:'Async',category:'portal',actualOn:false,startAsync(cb){finish=cb;},test(s,done){done(true,'ok');}});mgr.open();doc.getElementById('rtvLibTab-portal').click();doc.getElementById('rtvLibToggle-async-fixture').click();doc.getElementById('rtvLibTab-system').click();finish(false,'native failure');assert.equal(mgr.enabled('async-fixture'),false);assert.equal(mgr._focused(),'rtvLibTab-system');doc.getElementById('rtvLibTab-portal').click();assert.match(doc.getElementById('rtvLibRows').textContent,/Falha.*native failure/);d.window.close();pass('async failure survives tab removal and preserves other-tab focus');
}
{
 const d=dom(),w=d.window;w.eval(code('philco-library-manager'));const mgr=w.RemoteTV.libraryManager;let callback;w.PhilcoPortal651={capabilities(cb){callback=cb;return{cancel(){}};},status(cb){cb(null,{ok:true,appmgr:true,installed:false});}};w.eval(code('philco-module-portal-hello'));mgr.open();w.document.getElementById('rtvLibTab-portal').click();w.document.getElementById('rtvLibToggle-portal-bridge').click();mgr.close();callback(null,{ok:true,helloWorld:true});assert.equal(mgr._inspect().total,2,'late cancelled probe must not register a module');d.window.close();pass('cancelled probe cannot register late native modules');
}
{
 const d=new JSDOM('<body><div id="r14h"><button id="hc14">Live</button><button id="hf14">Favoritos</button></div><div id="r14body"><button id="category" class="cat14">Categoria</button></div></body>'),doc=d.window.document;
 const c={element:id=>doc.getElementById(id),documentRef:doc,viewState:{view:'live',t:'c',on:1,fcat:27},vodPlayer:null,keyCode:e=>e.keyCode,Date,preventDefault(){},handleImageNavigation(){},focusLiveCat(){doc.getElementById('category').focus();},focusChannel(){},focusLibCat(){},focusSpecialTab(){return false;}};vm.createContext(c);const src=code('xtream-ui');vm.runInContext(src.slice(src.indexOf('    var headerReturn652'),src.indexOf('    function moveSpecialCard(')),c);vm.runInContext(src.slice(src.indexOf('    function focusHeader()'),src.indexOf('    function handleKey(')),c);
 vm.runInContext(src.slice(src.indexOf('    function handleKey('),src.indexOf('    var lastKey31 =')),c);doc.getElementById('category').focus();c.handleKey({keyCode:37});assert.equal(doc.activeElement.id,'hc14','left from any category reaches header');c.headMove(doc.activeElement,39);assert.equal(doc.activeElement.id,'hf14');c.headMove(doc.activeElement,40);assert.equal(doc.activeElement.id,'category');assert.equal(c.headMove(doc.getElementById('hc14'),37),true);assert.equal(c.headMove(doc.getElementById('hf14'),39),true);
 doc.getElementById('category').focus();c.focusCurrentHeader();doc.getElementById('category').remove();let fallback=0;c.focusLiveCat=()=>fallback++;c.focusContentFromHeader();assert.equal(fallback,1);d.window.close();pass('category to Favorites header and back restores source; boundaries and detached focus are safe');
}
{
 const c={XT10:{state:{c:{d:'http://provider',u:'user',p:'pass'}},log(){},mask(){return'';}},RemoteTV:{}};vm.createContext(c);vm.runInContext(code('xtream-stream-router'),c);const first=c.XT10.liveRoutes({t:'c',id:42});assert.match(first[0],/maxh=720/);c.RemoteTV.liveRoute652.setDirect(true);const direct=c.XT10.liveRoutes({t:'c',id:42});assert.equal(direct[0],first[2]);assert.equal(direct[1],first[0]);assert.equal(direct[2],first[1]);c.RemoteTV.liveRoute652.setDirect(false);assert.equal(c.XT10.liveRoutes({t:'c',id:42})[0],first[0]);pass('direct route experiment reorders only next open and preserves all fallbacks');
}
{
 const calls=[],c={fullscreen:0,nativeReady:0,resizeVideoMasks(){},markDiagnostic(){},isFinite};vm.createContext(c);const src=code('app');vm.runInContext(src.slice(src.indexOf('    var layoutPlayer652'),src.indexOf('    function refreshVideoLayout(')),c);
 const player={setVideoAlpha:n=>calls.push(['alpha',n]),setVideoDisplayMode:n=>calls.push(['mode',n]),setVideoDisplayArea:()=>calls.push(['area']),refreshVideoDisplay:()=>calls.push(['refresh'])};
 c.layoutNativeVideo(player,0);c.nativeReady=1;c.layoutNativeVideo(player,1);c.layoutNativeVideo(player,1);assert.equal(calls.filter(x=>x[0]==='area').length,1);assert.equal(calls.filter(x=>x[0]==='refresh').length,1);assert.equal(calls.at(-1)[1],0);
 c.fullscreen=1;c.layoutNativeVideo(player,1);assert.equal(calls.filter(x=>x[0]==='refresh').length,2);c.fullscreen=0;c.layoutNativeVideo(player,1);assert.equal(calls.filter(x=>x[0]==='area').length,2);pass('startup ready reveals alpha without repeating native display transaction; explicit mode changes still work');
}
{
 let time=10000,id=0;const jobs=new Map(),z={mode:0,pos:0,getPlaybackMode(){return this.mode;},getCurrentPlayTime(){return this.pos;}};
 let ready=0,next=0;const c={window:{RemoteTV:{}},nativeGeneration:1,nativePlayer:z,ex:0,mediaCore:{normal:m=>m===2},isFinite,now:()=>time,markDiagnostic(){},setStatusText(){},releaseNativePlayback(){},setTimeout(fn,ms){jobs.set(++id,{fn,at:time+ms});return id;},clearTimeout(i){jobs.delete(i);},playbackMonitorTimer:0};vm.createContext(c);const src=code('app');vm.runInContext(src.slice(src.indexOf('    function monitorNativePlayback('),src.indexOf('    function startNativeRoute(')),c);
 function tick(ms){const end=time+ms;for(let n=0;n<500;n++){const job=[...jobs].filter(x=>x[1].at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!job)break;jobs.delete(job[0]);time=job[1].at;job[1].fn();}time=end;}
 c.monitorNativePlayback(z,1,()=>ready++,()=>next++);tick(2500);z.mode=2;z.pos=1;tick(1000);const health=c.window.RemoteTV.liveHealth652;assert.equal(health.bufferMs,3000);assert.equal(health.stalls,1);z.mode=0;tick(3000);z.mode=2;z.pos=2;tick(1000);assert.equal(health.bufferMs,6000);assert.equal(health.stalls,2);assert.equal(ready,1);assert.equal(next,0);c.nativeGeneration++;tick(60000);assert.equal(next,0);pass('native buffer telemetry sums separate waits without reopening or stale watchdog callbacks');
}
console.log('Philco 6.5.2 refinement:',passes,'PASS');
