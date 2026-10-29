'use strict';
const fs=require('fs'),crypto=require('crypto'),{minify}=require('../apps/youtube-beta/node_modules/terser');
(async()=>{const read=p=>fs.readFileSync(p,'utf8'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const base=JSON.parse(read('manifest.beta56-6-5-6.json')),byId=Object.fromEntries(base.modules.map(x=>[x.id,x]));
const ids=['runtime','feature-loader','app','force-update','inject-base','xtream-api-first','xtream-lazy-core','xtream-auth-guard','xtream-stream-router','autovod','hlsjs-loader','xtream-vod-player','common-player-ui','tmdb-metadata','xtream-ui','live-log-overlay','graphos-skin','hooks','launcher-surface','youtube-beta-launcher'];
let out='/* Remote TV Philco 6.5.7: verified core in one app execution; native bootstrap compatibility. */\n(function(w,d){\n\'use strict\';\nvar R=w.RemoteTV;if(!R)throw Error("RemoteTV bootstrap absent");\n';
fs.mkdirSync('system/bundled',{recursive:true});
for(const id of ids){let code=read(byId[id].path);
 if(id==='app'){
  const start=code.indexOf('    if (!window.RawM3U)');const end=code.indexOf("    element('y2').onclick",start);
  if(start<0||end<0)throw Error('legacy block missing');
  code=code.slice(0,start)+"    if (!window.RawM3U) throw Error('RemoteTV startup entry missing');\n"+code.slice(end);
  const ready=code.indexOf('\ntry {\n    if (window.RemoteTV)');if(ready<0)throw Error('ready block missing');code=code.slice(0,ready)+'\n';
 }
 let begin='',end='';
 if(id==='runtime'){begin='if(!R.__runtime657){\n';end='R.__runtime657=true;\n}\n';}
 if(id==='feature-loader'){begin='if(!R.__features657){\n';end='R.__features657=true;\n}\n';}
 out+='\n/* module '+id+' */\n'+begin+code+'\n'+end;
 if(id!=='app'){
  const marker=id==='runtime'?'__runtime657':id==='feature-loader'?'__features657':null;
  const guarded='/* 6.5.7 standalone module; skip only after complete bundled startup. */\n(function(w){\nif(w.RemoteTV&&w.RemoteTV.activeCoreBundle===\'0.56-beta.6.5.7\')return;\n'+code+'\n'+(marker?'if(w.RemoteTV)w.RemoteTV.'+marker+'=true;\n':'')+'}.call(window,window));\n';
  fs.writeFileSync('system/bundled/'+id+'.beta56-6-5-7.js',guarded);
 }
}
out+=read('system/startup-entry657.js')+'\nR.activeCoreBundle="0.56-beta.6.5.7";\nR.ready("player1");\n}.call(window,window,document));\n';
const packed=await minify(out,{ecma:5,compress:{passes:1},mangle:{safari10:true},format:{ascii_only:true,comments:false}});out=packed.code+'\n';
if(Buffer.byteLength(out)>500000)throw Error('core bundle exceeds conservative 500000 byte budget');
fs.writeFileSync('apps/player1/app.beta56-6-5-7.js',out);
const m=structuredClone(base);m.version='0.56-beta.6.5.7';m.release='2026.10.29-beta.56.6.5.7';
for(const x of m.modules){if(x.id==='app')x.path='apps/player1/app.beta56-6-5-7.js';else if(ids.includes(x.id))x.path='system/bundled/'+x.id+'.beta56-6-5-7.js';const b=fs.readFileSync(x.path);x.bytes=b.length;x.sha256=hash(b);}
fs.writeFileSync('manifest.beta56-6-5-7.json',JSON.stringify(m,null,2)+'\n');fs.writeFileSync('manifest.json',JSON.stringify(m,null,2)+'\n');
console.log('Prepared',m.version,m.modules.length,'modules; app',Buffer.byteLength(out),'bytes; marker unchanged');

})().catch(e=>{console.error(e);process.exit(1)});
