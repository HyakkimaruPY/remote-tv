'use strict';
(async function(){
const fs=require('fs'),assert=require('node:assert/strict'),acorn=require('acorn'),{JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(p,'utf8');
const files=[
 'system/readable/launcher-surface.beta56-6-5-1.js',
 'philco/bibliotecas/manager.beta56-6-5-1.js',
 'philco/bibliotecas/render-scheduler/src/module.beta56-6-5-1.js',
 'philco/bibliotecas/visual-compositor/src/module.beta56-6-5-1.js',
 'philco/bibliotecas/modern-ui/src/module.beta56-6-5-1.js',
 'philco/bibliotecas/texture-fx/src/module.beta56-6-5-1.js',
 'philco/bibliotecas/blur-fx/src/module.beta56-6-5-1.js',
 'philco/bibliotecas/webkit-injector/src/module.beta56-6-5-1.js',
 'philco/bibliotecas/offline-store/src/module.beta56-6-5-1.js',
 'philco/bibliotecas/vendor-bridge/src/module.beta56-6-5-1.js',
 'philco/bibliotecas/webgl-surface/src/module.beta56-6-5-1.js',
 'philco/bibliotecas/canvas-texture/src/module.beta56-6-5-1.js',
 'philco/bibliotecas/portal-hello/src/module.beta56-6-5-1.js',
 'philco/bibliotecas/localhost/src/client.beta56-6-5-1.js'
];
for(const p of files)acorn.parse(read(p),{ecmaVersion:5});

const shell=read('apps/player1/shell.beta56-6-5-1.html');
assert.doesNotMatch(shell,/\bMP3\b/i);
assert.doesNotMatch(shell,/<small/i);
assert.match(shell,/id=rtv651info/);

const dom=new JSDOM('<!doctype html><html><head></head><body>'+shell+'</body></html>',{url:'file:///applications/RemoteTV/index.html',runScripts:'outside-only'});
const w=dom.window,d=w.document;
assert.equal(d.querySelectorAll('#menu .rtv651tile').length,6);
w.requestAnimationFrame=fn=>w.setTimeout(fn,0);w.cancelAnimationFrame=id=>w.clearTimeout(id);
w.RemoteTV={RequestScope:function(){this.cancel=function(){};this.local=function(u,cb){cb(null,'ok')};this.fetch=function(u,cb){cb(null,'ok')}}};
w.PhilcoSearch642={enabled:()=>false,setPerformanceMode:()=>{}};w.PhilcoSearchAdapter={active:()=>true};
w.eval(read('philco/bibliotecas/manager.beta56-6-5-1.js'));
assert.equal(w.RemoteTV.libraryManager.register({id:'broken-test',title:'Broken',category:'system',enabled:false,probe:function(){return false;},test:function(s,dn){dn(false,'x');}}),false);
w.eval(read('philco/bibliotecas/render-scheduler/src/module.beta56-6-5-1.js'));
w.eval(read('philco/bibliotecas/visual-compositor/src/module.beta56-6-5-1.js'));
w.eval(read('philco/bibliotecas/modern-ui/src/module.beta56-6-5-1.js'));
w.eval(read('philco/bibliotecas/texture-fx/src/module.beta56-6-5-1.js'));
w.eval(read('philco/bibliotecas/blur-fx/src/module.beta56-6-5-1.js'));
w.eval(read('philco/bibliotecas/webkit-injector/src/module.beta56-6-5-1.js'));
w.eval(read('philco/bibliotecas/offline-store/src/module.beta56-6-5-1.js'));
let enableCalls=0,disableCalls=0;
w.PhilcoPortal651={
 capabilities:cb=>cb(null,{ok:true,helloWorld:true}),
 status:cb=>cb(null,{ok:true,installed:false,appmgr:true}),
 enableHello:cb=>{enableCalls++;cb(null,{ok:true,installed:true,appmgr:true});},
 disableHello:cb=>{disableCalls++;cb(null,{ok:true,installed:false,appmgr:true});}
};
w.eval(read('philco/bibliotecas/portal-hello/src/module.beta56-6-5-1.js'));
w.eval(read('system/readable/launcher-surface.beta56-6-5-1.js'));
await new Promise(r=>setTimeout(r,35));

const raw=d.getElementById('rawLaunch');
raw.focus();await new Promise(r=>setTimeout(r,5));
assert.match(d.getElementById('rtv651info').className,/rtv651show/);
assert.equal(d.getElementById('rtv651infoTitle').textContent,'M3U');
assert.match(d.getElementById('rtv651infoText').textContent,/biblioteca M3U principal/);
assert.doesNotMatch(raw.textContent,/biblioteca M3U principal/);

d.getElementById('rtvLibs').click();
for(const id of ['system','injection','render','portal'])assert.ok(d.getElementById('rtvLibTab-'+id),'missing tab '+id);
assert.equal(w.RemoteTV.libraryManager._inspect().rejected.length>=1,true);
d.getElementById('rtvLibTab-portal').click();
assert.equal(w.RemoteTV.libraryManager._tab(),'portal');
assert.equal(w.RemoteTV.libraryManager._inspect().rows,1);
let toggle=d.getElementById('rtvLibToggle-native-app-hello');
assert.ok(toggle);
assert.equal(toggle.textContent,'Ativar');
toggle.click();
await new Promise(r=>setTimeout(r,5));
assert.equal(enableCalls,1);
toggle=d.getElementById('rtvLibToggle-native-app-hello');
assert.equal(toggle.textContent,'Desativar');
toggle.click();
await new Promise(r=>setTimeout(r,5));
assert.equal(disableCalls,1);
assert.equal(d.getElementById('rtvLibToggle-native-app-hello').textContent,'Ativar');

const budget=w.RemoteTV.visualBudget651.snapshot();
assert.ok(budget.used<=budget.limit,'visual budget exceeded');
assert.equal(budget.limit,10*1024*1024);
assert.equal(w.RemoteTV.libraryManager._inspect().total>=6,true);
w.RemoteTV.libraryManager.close();
dom.window.close();
console.log('PASS Philco 6.5.1: focus-only help, four tabs, capability hiding, async Portal rollback and 10 MiB visual budget');
})().catch(e=>{console.error(e);process.exitCode=1;});
