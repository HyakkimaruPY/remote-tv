'use strict';
(async function(){
const fs=require('fs'),assert=require('node:assert/strict'),acorn=require('acorn'),vm=require('vm');
const {JSDOM}=require('jsdom'),crypto=require('crypto');
const manifest=JSON.parse(fs.readFileSync('manifest.beta56-6-4-1.json','utf8'));
const previous=JSON.parse(fs.readFileSync('manifest.beta56-6-4.json','utf8'));
assert.equal(manifest.version,'0.56-beta.6.4.1');
assert.equal(manifest.modules.length,31);
function entry(id,m=manifest){return m.modules.find(x=>x.id===id);}
for(const x of manifest.modules){
 const b=fs.readFileSync(x.path);
 assert.equal(b.length,x.bytes,x.id+' byte count');
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),x.sha256,x.id+' sha256');
 if(x.type==='js')acorn.parse(b.toString('utf8'),{ecmaVersion:5});
}
for(const id of ['app','xtream-lazy-core','xtream-vod-player','common-player-ui','graphos-skin','style']){
 assert.equal(entry(id).sha256,entry(id,previous).sha256,'preserve '+id);
}
const manager=fs.readFileSync(entry('philco-library-manager').path,'utf8');
const search=fs.readFileSync(entry('philco-search-ui').path,'utf8');
const xtream=fs.readFileSync(entry('xtream-ui').path,'utf8');
const asmPayload=fs.readFileSync('philco/bibliotecas/assembly-navigation/dist/navigation.wasm.base64','utf8').trim();
const asmBinary=Buffer.from(asmPayload,'base64');
assert.ok(WebAssembly.validate(asmBinary),'compiled Assembly WASM is valid');
const asm=new WebAssembly.Instance(new WebAssembly.Module(asmBinary)).exports;
assert.equal(asm.next_focus(0,-1,5),4);
assert.equal(asm.next_focus(4,1,5),0);
assert.equal(asm.next_focus(0,1,0),-1);
assert.equal(asm.accept_key(1000,900,80),1);
assert.equal(asm.accept_key(1000,950,80),0);
assert.equal(asm.needs_restart(1,0,1),1);
assert.equal(asm.needs_restart(1,1,1),0);
assert.equal(asm.needs_restart(1,0,0),0);
const match=/var NAV_ASM = '([^']+)'/.exec(manager);assert.ok(match);
assert.equal(match[1],asmPayload,'exact Assembly binary is embedded in module loader');

const shell=fs.readFileSync(entry('shell').path,'utf8');
const dom=new JSDOM('<!doctype html><html><head></head><body>'+shell+'</body></html>',{url:'http://tv.test',runScripts:'outside-only'});
const w=dom.window,d=w.document;let fakeTime=10000,requests=0;
const BaseDate=w.Date;function DateMock(){return new BaseDate(fakeTime);}
DateMock.prototype=BaseDate.prototype;DateMock.now=function(){return fakeTime;};w.Date=DateMock;
w.RemoteTV={RequestScope:function(){this.cancel=function(){};this.local=function(u,cb){requests++;cb(null,'ok');};this.fetch=function(u,cb){requests++;cb(null,'ok');};}};
w.WebAssembly=WebAssembly;w.atob=x=>Buffer.from(x,'base64').toString('binary');
w.eval(manager);
for(const id of ['philco-module-diagnostic','philco-module-watchdog','philco-module-network','philco-module-search','philco-module-assembly']) w.eval(fs.readFileSync(entry(id).path,'utf8'));
assert.equal(requests,0,'no probing at boot');
assert.equal(w.RemoteTV.libraryManager.enabled('assembly-navigation'),true);
w.RemoteTV.libraryManager.open();
const panel=d.getElementById('rtvLibPanel'),rows=d.getElementById('rtvLibRows');
assert.ok(panel&&rows);
assert.ok(d.getElementById('rtvLibFooter'));
assert.equal(panel.style.display,'block');
assert.equal(w.RemoteTV.libraryManager._focused(),'rtvLibToggle-diagnostico');
function press(k,which='keydown'){fakeTime+=180;let e=new w.Event(which,{bubbles:true,cancelable:true});Object.defineProperty(e,'keyCode',{value:k});Object.defineProperty(e,'which',{value:k});d.activeElement.dispatchEvent(e);return e;}
function assertFocus(id){assert.equal(w.RemoteTV.libraryManager._focused(),id);const node=d.getElementById(id);assert.equal(node.getAttribute('aria-selected'),'true');assert.equal(node.style.getPropertyPriority('background'),'important');assert.ok(d.getElementById('rtvLibFocusLabel').textContent.includes('Selecionado:'));}
assertFocus('rtvLibToggle-diagnostico');
press(40);assertFocus('rtvLibToggle-estabilidade');
press(40);assertFocus('rtvLibToggle-network');
press(40);assertFocus('rtvLibTest-network');
press(40);assertFocus('rtvLibToggle-https');
press(40);assertFocus('rtvLibTest-https');
press(40);assertFocus('rtvLibToggle-search');
press(13);assert.equal(w.RemoteTV.libraryManager.enabled('search'),true);assert.equal(w.RemoteTV.libraryManager.needsRestart(),true);
assertFocus('rtvLibToggle-search');
press(40);assertFocus('rtvLibTest-search');
press(40);assertFocus('rtvLibToggle-assembly-navigation');
press(40);assertFocus('rtvLibTest-assembly-navigation');
press(40);assertFocus('rtvLibReset');
assert.equal(d.getElementById('rtvLibReset').parentNode.id,'rtvLibFooter','restart is in fixed footer');
press(40);assertFocus('rtvLibBack');
press(40);assertFocus('rtvLibToggle-diagnostico');
press(38);assertFocus('rtvLibBack');
press(13);assert.equal(panel.style.display,'none','back closes safely');
assert.equal(w.RemoteTV.libraryManager.isOpen(),false);
w.RemoteTV.libraryManager.open();assert.equal(panel.style.display,'block');
press(461,'irkeypress');assert.equal(w.RemoteTV.libraryManager.isOpen(),false,'IR back closes panel');
w.RemoteTV.libraryManager.open();d.getElementById('rtvLibToggle-assembly-navigation').click();
assert.equal(w.RemoteTV.libraryManager.assemblyActive(),false);
assert.equal(w.RemoteTV.libraryManager._nav(0,-1,5),4,'ES5 fallback still wraps');
d.getElementById('rtvLibToggle-assembly-navigation').click();assert.equal(w.RemoteTV.libraryManager.assemblyActive(),true);
w.RemoteTV.libraryManager.close();
await Promise.resolve();await Promise.resolve();
assert.match(w.RemoteTV.libraryManager.engine(),/Assembly WASM|Navegação ES5/);

// Isolated Xtream header creation; evaluate real root() and headMove() using original helper API stubs.
const headerDom=new JSDOM('<!doctype html><html><head></head><body></body></html>',{url:'http://tv.test',runScripts:'outside-only'});
const h=headerDom.window,hd=h.document;let dockEnabled=false,opened=[];
h.PhilcoSearch64={enabled:function(){return dockEnabled;},open:function(t){opened.push(t);},isOpen:function(){return false;}};
const ctx={windowRef:h,documentRef:hd,viewState:{t:'s'},element:function(id){return hd.getElementById(id);},
css:function(){},installCatalogStyles:function(){},installPreparationStyles:function(){},
installDetailStyles:function(){},installLayoutStyles:function(){},installResumeDialogStyles:function(){},
exitToMenu:function(){},logs:function(){},favorites:function(){},continueView:function(){},
type:function(){},focusContentFromHeader:function(){return true;},};
vm.createContext(ctx);
const from=xtream.indexOf('    function syncSearchDock64()'),to=xtream.indexOf('    function fullscreenControlsRoot()',from);
assert.ok(from>=0&&to>from);
vm.runInContext(xtream.slice(from,to),ctx);
const hm1=xtream.indexOf('    function headMove(o, k) {'),hm2=xtream.indexOf('    function handleKey(e) {',hm1);
assert.ok(hm1>=0&&hm2>hm1);
vm.runInContext(xtream.slice(hm1,hm2),ctx);
ctx.root();
const button=hd.getElementById('r14search64'),bar=hd.getElementById('r14h');
assert.ok(button,'search button exists in Xtream dock');
assert.equal(bar.lastElementChild.id,'r14search64','search appended at end of dock');
assert.equal(button.style.display,'none');
assert.equal(button.disabled,true);
const log=hd.getElementById('r14log');ctx.headMove(log,39);assert.notEqual(hd.activeElement,button,'hidden button skipped by arrow navigation');
dockEnabled=true;h.PhilcoSearchDock64();assert.equal(button.style.display,'inline-block');assert.equal(button.disabled,false);
log.focus();ctx.headMove(log,39);assert.equal(hd.activeElement,button);
button.click();assert.deepEqual(opened,['s']);
dockEnabled=false;h.PhilcoSearchDock64();assert.equal(button.style.display,'none');assert.equal(button.disabled,true);
assert.equal(button.tabIndex,-1);
headerDom.window.close();

// Hardware-facing red mapping: IR red(403) must forward a document keydown.
let forwarded=[],lastIR=0;const redCtx={windowRef:{},remoteTV:{libraryManager:{isOpen:function(){return false;}},},viewState:{on:1},
Date:Date,navAt31:0,guardUntil31:0,held31:0,lastAt31:0,firstAt31:0,lastKey31:0,lastSource35:'',keyCode:e=>e.keyCode,
documentRef:{activeElement:{dispatchEvent:e=>forwarded.push(e.keyCode)},createEvent:function(){return {initEvent:function(){},keyCode:0,which:0};}},
consumeInputEvent:function(){},handleImageNavigation:function(){},setTimeout:function(){},clearTimeout:function(){}};
vm.createContext(redCtx);
const rf=xtream.indexOf('    function filterPhysicalInput(e) {'),re=xtream.indexOf('    if (windowRef.addEventListener)',rf);
assert.ok(rf>=0&&re>rf);
vm.runInContext(xtream.slice(rf,re),redCtx);
redCtx.filterPhysicalInput({type:'irkeypress',keyCode:403,preventDefault:function(){},stopPropagation:function(){}});
assert.deepEqual(forwarded,[403],'red IR forwarded as keydown');
assert.equal(redCtx.remoteTV.lastIRKeyCode64,403);
redCtx.remoteTV.libraryManager.isOpen=function(){return true;};
redCtx.filterPhysicalInput({type:'irkeypress',keyCode:40});
assert.deepEqual(forwarded,[403],'overlay prevents background focus mutation');
w.close();
console.log('PASS Philco Beta 6.4.1: 31 hashes, ES5, Assembly WASM + fallback, visible focus, restart reachable, red IR, dock opt-in');
})().catch(e=>{console.error(e);process.exitCode=1;});
