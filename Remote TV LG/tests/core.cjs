const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const {JSDOM}=require('jsdom'),acorn=require('acorn'),root=path.resolve(__dirname,'..');
for(const dir of ['src','app'])for(const file of fs.readdirSync(path.join(root,dir)))if(file.endsWith('.js'))acorn.parse(fs.readFileSync(path.join(root,dir,file),'utf8'),{ecmaVersion:5});
for(const m of JSON.parse(fs.readFileSync(root+'/UPSTREAM.json')).modules){const b=fs.readFileSync(root+'/src/upstream/'+path.basename(m.path));assert.equal(b.length,m.bytes);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),m.sha256);}
const html=fs.readFileSync(root+'/releases/1.0.0/player.html','utf8');acorn.parse(html.match(/<script>([\s\S]*)<\/script>/)[1],{ecmaVersion:5});
const hash={};vm.createContext(hash);vm.runInContext(fs.readFileSync(root+'/app/sha256.js','utf8'),hash);
for(const s of ['', 'abc','Aura · ação 中文 🎬','x'.repeat(300000)])assert.equal(hash.AuraSHA(s),crypto.createHash('sha256').update(s).digest('hex'));
const manifest=JSON.parse(fs.readFileSync(root+'/manifest.json'));assert.equal(manifest.bytes,Buffer.byteLength(html));assert.equal(manifest.sha256,hash.AuraSHA(html));
let dom=new JSDOM('<p id="notice"></p><main id="screen"></main>',{url:'https://aura.test/',runScripts:'outside-only'}),w=dom.window;w.eval(fs.readFileSync(root+'/src/core.js','utf8'));const A=w.Aura;
assert.equal(A.credentials('https://host.test/get.php?username=001&password=a%26b').user,'001');assert.equal(A.credentials('https://host.test/get.php?username=001&password=a%26b').pass,'a&b');
assert.equal(A.credentials('https://host.test/get.php?username=001&password=a%26b').host,'https://host.test');assert.throws(()=>A.url('javascript:alert(1)'));assert.equal(A.url('/video.mp4','https://host.test/dir/list.m3u'),'https://host.test/video.mp4');
(async()=>{
 const list='#EXTM3U\n#EXTINF:-1 tvg-logo="https://img.test/a.png" group-title="Filmes",Filme A\nhttps://host.test/movie/a/b/1.mp4\n#EXTINF:-1 group-title="Canais",Canal 1\nhttps://host.test/live/a/b/2.m3u8';
 const items=await new Promise((ok,fail)=>A.parse(list,'https://host.test/list.m3u',(e,a)=>e?fail(e):ok(a)));assert.equal(items.length,2);assert.equal(items[0].t,'vod');assert.equal(items[1].t,'live');
 let queried=[];A.json=(u,cb)=>{queried.push(u);cb(null,{user_info:{auth:1,status:'Active',exp_date:'0'}});};await new Promise((ok,fail)=>A.openSource('https://host.test/get.php?username=001&password=a%26b','',(e,s)=>{if(e)return fail(e);assert.equal(s.kind,'api');ok();}));assert.equal(queried.length,1);assert(queried[0].includes('/player_api.php'));assert(!queried[0].includes('/get.php'));
 A.json=(u,cb)=>cb(null,{user_info:{auth:0,status:'Disabled'}});assert(await new Promise(ok=>A.authenticate({host:'https://h.test',user:'u',pass:'p'},e=>ok(!!e))));
 console.log('PASS ES5, SHA UTF-8, manifest, M3U, credentials, API-first, auth rejection');w.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
