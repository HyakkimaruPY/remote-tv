'use strict';
const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto'),read=p=>fs.readFileSync(p,'utf8');
{
 const dom=new JSDOM('<body>'+read('apps/player1/shell.beta56-6-5-5.html')+'</body>',{url:'http://tv.test',runScripts:'outside-only'}),w=dom.window,d=w.document;let clock=1000;w.Date=class extends Date{getTime(){return clock}};
 w.RemoteTV={RequestScope:function(){this.cancel=()=>{};this.local=()=>{};this.fetch=()=>{}}};w.eval(read('philco/bibliotecas/manager.beta56-6-5-5.js'));const m=w.RemoteTV.libraryManager;
 m.register({id:'fixture',title:'Fixture',enabled:true,probe:()=>({ok:true}),test:()=>{}});m.open();
 function key(k){clock+=500;d.dispatchEvent(new w.KeyboardEvent('keydown',{keyCode:k,which:k,bubbles:true,cancelable:true}));}
 const top=m._focused();key(38);assert.equal(m._focused(),top);key(40);assert.equal(m._focused(),'rtvLibToggle-fixture');key(40);assert.equal(m._focused(),'rtvLibReset');key(40);assert.equal(m._focused(),'rtvLibReset');key(38);assert.equal(m._focused(),'rtvLibToggle-fixture');m.close();assert.equal(d.activeElement.id,'rtvLibs');w.close();console.log('PASS Libraries clamps vertical edges and returns through module/footer to launcher');
}
{
 const dom=new JSDOM('<body>'+read('apps/player1/shell.beta56-6-5-5.html')+'</body>',{url:'http://tv.test',runScripts:'outside-only'}),w=dom.window,d=w.document,pending=[];let cancelled=0,opens=0;
 w.RemoteTV={sha256:s=>crypto.createHash('sha256').update(s).digest('hex'),RequestScope:function(){this.fetch=(u,cb)=>pending.push(cb);this.cancel=()=>cancelled++;}};
 w.eval(read('system/feature-loader-beta56-6-5-5.js'));w.RemoteTVFeatures55.loadYouTube3();assert.equal(pending.length,1);d.dispatchEvent(new w.KeyboardEvent('keydown',{keyCode:8,bubbles:true}));assert.equal(cancelled,1);assert.match(d.getElementById('yt3').textContent,/YouTube beta/);
 // RequestScope normally suppresses stale completion. Invoke it explicitly to test the second guard too.
 w.YouTube3Probe={open(){opens++}};pending[0](null,read('apps/youtube-beta/player-beta56-6-5-5.js'));assert.equal(opens,0);
 w.RemoteTVFeatures55.loadYouTube3();assert.equal(opens,1);w.close();console.log('PASS cancelling lazy YouTube aborts transport and invalidates stale open; next explicit open still works');
}
