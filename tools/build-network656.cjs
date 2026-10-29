'use strict';
const fs=require('fs'),crypto=require('crypto'),read=p=>fs.readFileSync(p,'utf8'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
let loader=read('system/feature-loader-beta56-6-5-6.js');loader=loader.replace(/sha: '[a-f0-9]{64}'/,"sha: '"+hash(fs.readFileSync('apps/youtube-beta/player-beta56-6-5-6.js'))+"'");fs.writeFileSync('system/feature-loader-beta56-6-5-6.js',loader);
const m=JSON.parse(read('manifest.beta56-6-5-5.json'));m.version='0.56-beta.6.5.6';m.release='2026.10.29-beta.56.6.5.6';
const changes={'feature-loader':'system/feature-loader-beta56-6-5-6.js','xtream-lazy-core':'system/readable/xtream-lazy-core.beta56-6-5-6.js','xtream-auth-guard':'system/readable/xtream-auth-guard.beta56-6-5-6.js'};
for(const x of m.modules)x.path=changes[x.id]||x.path;
m.modules.push({id:'youtube-beta-launcher',path:'apps/youtube-beta/player-beta56-6-5-6.js',type:'js',phase:'post',required:true});
for(const x of m.modules){const b=fs.readFileSync(x.path);x.bytes=b.length;x.sha256=hash(b);}
const txt=JSON.stringify(m,null,2)+'\n';fs.writeFileSync('manifest.beta56-6-5-6.json',txt);fs.writeFileSync('manifest.json',txt);
console.log('Prepared',m.version,m.modules.length,'modules; marker left unchanged');
