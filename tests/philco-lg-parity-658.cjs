'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto'),acorn=require('acorn'),{JSDOM}=require('jsdom');
const root=require('node:path').resolve(__dirname,'..');
function read(p){return fs.readFileSync(root+'/'+p,'utf8');}
const m=JSON.parse(read('manifest.json'));
assert.equal(m.version,'0.56-beta.6.5.8');
assert.equal(m.modules.length,48);
assert.deepEqual(m,JSON.parse(read('manifest.beta56-6-5-8.json')));
for(const x of m.modules){
 const b=fs.readFileSync(root+'/'+x.path);
 assert.equal(b.length,x.bytes,x.path);
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),x.sha256,x.path);
 if(x.type==='js')acorn.parse(b.toString(),{ecmaVersion:5});
}
const shell=read(m.modules.find(x=>x.id==='shell').path);
assert.match(shell,/#rawLaunch\{left:70px;top:170px\}/);
assert.match(shell,/#rtvSearchHome\{left:465px;top:170px\}/);
assert.match(shell,/#rtvLibs\{left:860px;top:170px\}/);
assert.match(shell,/#tv\{left:70px;top:360px\}/);
assert.match(shell,/#forceUpdate\{left:465px;top:360px\}/);
assert.match(shell,/#yt3\{left:860px;top:360px\}/);
const dom=new JSDOM('<body>'+shell+'</body>',{url:'http://tv.test',runScripts:'outside-only'});
const w=dom.window;
w.RemoteTV={};
w.eval(read(m.modules.find(x=>x.id==='xtream-lazy-core').path));
const cred=w.XT10.cred;
assert.deepEqual(JSON.parse(JSON.stringify(cred('https://fixture.invalid:8443/sub/get.php?username=u%2B1&password=p%26%3D',''))),{d:'https://fixture.invalid:8443/sub',u:'u+1',p:'p&='});
assert.equal(cred('https://user:p%40ss@fixture.invalid/live/user/p%40ss/12.m3u8','').d,'https://fixture.invalid');
assert.equal(cred('https://fixture.invalid/prefix/live/u/p/12.m3u8','').d,'https://fixture.invalid/prefix');
assert.equal(cred('', 'DNS=https://fixture.invalid:8443/iptv\nUSERNAME=u\nPASSWORD=p').d,'https://fixture.invalid:8443/iptv');
assert.equal(cred('', 'DNS=fixture.invalid:8080/iptv\nUSERNAME=u\nPASSWORD=p').d,'http://fixture.invalid:8080/iptv');
assert.equal(cred('http://fixture.invalid/get.php?username=u&password=p','').d,'http://fixture.invalid');
for(const k of ['xtream.favorites.v14','xtream.progress.v14','xtream.continue.v14']) w.localStorage.setItem(k,'preserve');
cred('https://fixture.invalid/get.php?username=u&password=p','');
for(const k of ['xtream.favorites.v14','xtream.progress.v14','xtream.continue.v14'])assert.equal(w.localStorage.getItem(k),'preserve');
assert.equal(read('version').trim(),'0.56-beta.6.5.5','Candidate stage must not activate users without CI');
w.close();
console.log('PASS Philco 6.5.8: 48 hashes, ES5, classic 3 columns, Xtream HTTP/HTTPS/subpaths, storage preserved, marker gated');