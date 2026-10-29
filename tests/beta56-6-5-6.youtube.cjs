'use strict';
const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto'),{JSDOM}=require('jsdom'),read=p=>fs.readFileSync(p,'utf8');
function fixture(){const dom=new JSDOM('<body>'+read('apps/player1/shell.beta56-6-5-5.html')+'</body>',{url:'http://tv.test',runScripts:'outside-only'}),w=dom.window,d=w.document,pending=[];let cancelled=0;
Object.defineProperty(w.HTMLIFrameElement.prototype,'sandbox',{get(){return ''},configurable:true});w.RemoteTV={sha256:s=>crypto.createHash('sha256').update(s).digest('hex'),RequestScope:function(){this.fetch=(url,cb)=>pending.push({url,cb});this.cancel=()=>cancelled++;}};
w.eval(read('system/feature-loader-beta56-6-5-6.js'));w.eval(read('apps/youtube-beta/player-beta56-6-5-6.js'));
return{w,d,pending,get cancelled(){return cancelled},close:()=>w.close()};}
{
const e=fixture();e.d.getElementById('yt3').focus();e.d.activeElement.dispatchEvent(new e.w.KeyboardEvent('irkeypress',{keyCode:13,which:13,bubbles:true,cancelable:true}));assert.equal(e.w.YouTube3Probe.state().active,true);assert.notEqual(e.d.getElementById('yt3probe').className,'h');assert.equal(e.pending.length,1);assert.match(e.pending[0].url,/userscript-beta56-6-5-6\.js/);e.d.activeElement.dispatchEvent(new e.w.KeyboardEvent('keydown',{keyCode:13,which:13,bubbles:true,cancelable:true}));assert.equal(e.w.YouTube3Probe.state().active,true);assert.equal(e.pending.length,1);e.w.YouTube3Probe.close();assert.equal(e.cancelled,1);e.pending[0].cb(null,read('apps/youtube-beta/userscript-beta56-6-5-6.js'));assert.equal(e.w.YouTube3Probe.state().stage,'closed');assert.equal(e.pending.length,1);e.close();console.log('PASS IR opens visible screen immediately; duplicate OK suppressed; exit cancels deferred fork');
}
{
const e=fixture();e.w.YouTube3Probe.open();e.pending[0].cb(null,'tampered source');assert.equal(e.w.YouTube3Probe.state().stage,'fork-integrity-failed');assert.match(e.d.getElementById('yt3status').textContent,/integrity/);assert.equal(e.pending.length,1);assert.equal(e.d.getElementById('ytBetaFrame655').getAttribute('src'),null);e.close();console.log('PASS tampered fork is rejected before any YouTube page is requested');
}
{
const e=fixture();e.w.YouTube3Probe.open();e.pending[0].cb('Timeout','');assert.equal(e.w.YouTube3Probe.state().stage,'fork-download-failed');assert.match(e.d.getElementById('yt3status').textContent,/Não foi possível/);assert.equal(e.w.YouTube3Probe.state().active,true);e.w.YouTube3Probe.back();assert.equal(e.w.YouTube3Probe.state().active,false);e.close();console.log('PASS download timeout stays visible with working Back; never silently ignores OK');
}
{
const e=fixture();e.w.localStorage.setItem('remote-tv.youtube-beta.bundle.656',read('apps/youtube-beta/userscript-beta56-6-5-6.js'));e.w.YouTube3Probe.open();assert.equal(e.pending.length,1);assert.match(e.pending[0].url,/youtube\.com\/tv/);assert.ok(e.w.YouTube3Probe.state().stages.includes('fork-cache-verified'));e.close();console.log('PASS verified standalone fork cache skips redundant 475 KB download');
}
