'use strict';
const fs=require('fs'),crypto=require('crypto'),path=require('path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),write=(p,v)=>fs.writeFileSync(path.join(root,p),v),hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const bundle=read('apps/youtube-beta/dist/userscript.js');
const player=read('apps/youtube-beta/player.template.js').replace('__FORK_SOURCE__',JSON.stringify(bundle));
write('apps/youtube-beta/player-beta56-6-5-5.js',player);
const loader=read('system/feature-loader-beta56-6-5-5.js').replace(/sha: '[a-f0-9]{64}'/,"sha: '"+hash(player)+"'");write('system/feature-loader-beta56-6-5-5.js',loader);
const m=JSON.parse(read('manifest.beta56-6-5-4.json'));
m.version='0.56-beta.6.5.5';m.release='2026.10.29-beta.56.6.5.5';
const changes={'shell':'apps/player1/shell.beta56-6-5-5.html','feature-loader':'system/feature-loader-beta56-6-5-5.js','xtream-ui':'system/readable/xtream-ui.beta56-6-5-5.js','graphos-skin':'system/injections/graphos-skin-beta56-6-5-5.js','philco-library-manager':'philco/bibliotecas/manager.beta56-6-5-5.js'};
for(const x of m.modules){x.path=changes[x.id]||x.path;const b=fs.readFileSync(path.join(root,x.path));x.bytes=b.length;x.sha256=hash(b);}
const text=JSON.stringify(m,null,2)+'\n';write('manifest.beta56-6-5-5.json',text);write('manifest.json',text);
console.log('Prepared',m.version,m.modules.length,'modules; lazy YouTube bundle',Buffer.byteLength(player),'bytes, SHA-256',hash(player));
