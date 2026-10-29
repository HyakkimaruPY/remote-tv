'use strict';
const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto'),{JSDOM,VirtualConsole}=require('jsdom');
const read=p=>fs.readFileSync(p,'utf8'),m=JSON.parse(read('manifest.beta56-6-5-7.json'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function run(mode,{stale=false,replay=false,cancel=false,expired=false}={}){
 const errors=[],requests=[],ready=[],dom=new JSDOM('<html><head></head><body></body></html>',{url:'http://tv.test/index.html',runScripts:'dangerously',virtualConsole:new VirtualConsole().on('jsdomError',e=>errors.push(e.message))}),w=dom.window,d=w.document;let legacy=0;
 w.HTMLCanvasElement.prototype.getContext=function(){return null};w.HTMLMediaElement.prototype.load=function(){};w.HTMLMediaElement.prototype.pause=function(){};w.HTMLMediaElement.prototype.play=function(){return Promise.resolve()};
 w.YTCore={channels:[],videoId(){return ''},log(){},normal:x=>x===2};w.RemoteTV={bootstrap:4,release:m.release,files:{},data:{},ready:name=>ready.push(name),sha256:s=>crypto.createHash('sha256').update(s).digest('hex'),bridgeURL:u=>'http://127.0.0.1:8765/fetch?u='+encodeURIComponent(u)};
 w.XMLHttpRequest=class{open(method,url,async=true){this.method=method;this.url=url;this.async=async;}send(){let u=this.url;if(u.includes('/fetch?u='))u=decodeURIComponent(u.split('/fetch?u=')[1]);requests.push(u);let status=200,body='',delay=3;
 if(u==='legacy.html'){legacy++;body='window.RawM3U={open:function(){},key:function(){return false},back:function(){return false}}';}
 else if(u.includes('credenciais.temp'))body='M3U="http://fixture.invalid/get.php?username=fixture&password=fixture&type=m3u_plus"';
 else if(u.includes('player_api.php')){const p=new URL(u);if(p.searchParams.get('action')==='get_live_categories')body='[{"category_id":"1","category_name":"Test"}]';else if(p.searchParams.get('action')==='get_live_streams')body='[{"stream_id":11,"name":"Channel"}]';else{body=JSON.stringify({user_info:{auth:expired?0:1,status:expired?'Expired':'Active'},server_info:{timestamp_now:10000}});if(cancel)delay=80;}}
 else if(u.endsWith('/c'))body='[]';else{status=404;body='missing';}
 const done=()=>{if(this.aborted)return;this.status=status;this.readyState=4;this.responseText=body;if(this.onreadystatechange)this.onreadystatechange()};if(this.async===false)done();else w.setTimeout(done,delay);
 }abort(){this.aborted=true;}setRequestHeader(){}};
 w.RemoteTV.fetch=(u,cb)=>{const x=new w.XMLHttpRequest();x.open('GET',w.RemoteTV.bridgeURL(u));x.onreadystatechange=()=>{if(x.readyState===4)cb(x.status===200?null:'HTTP '+x.status,x.responseText)};x.send()};
 function apply(x){const code=read(x.path);w.RemoteTV.files[x.id]=code;if(x.type==='html')d.body.innerHTML=code;else if(x.type==='json')w.RemoteTV.data[x.id]=JSON.parse(code);else if(x.type==='js'){const s=d.createElement('script');s.text=code;d.head.appendChild(s);}else if(x.type==='css'){const s=d.createElement('style');s.textContent=code;d.head.appendChild(s);}}
 for(const x of m.modules)if(mode==='all'||['policy','shell','style','app'].includes(x.id))apply(x);
 assert.equal(w.RemoteTV.activeCoreBundle,'0.56-beta.6.5.7');assert.equal(legacy,0);assert.deepEqual(ready,['player1'],'ready must be emitted once after the whole core');const ui=w.RawM3U,core=w.XT10;
 if(stale){w.RawM3U={open(){legacy++},back(){return false},key(){return false}};d.getElementById('rawLaunch').onclick=()=>legacy++;}
 d.getElementById('rawLaunch').click();
 if(replay)for(const x of m.modules)if(x.type==='js'&&x.id!=='app')apply(x);
 if(cancel){await sleep(15);w.RawM3U.back();}
 await sleep(150);
 assert.equal(legacy,0,'legacy handler/fetch must never run');assert.equal(w.XT10,core,'post replay must preserve the core transaction');assert.equal(w.RawM3U,ui,'entry must restore the current UI alias');assert.deepEqual(errors,[]);
 const config=requests.filter(u=>u.includes('credenciais.temp')),auth=requests.filter(u=>u.includes('player_api.php')&&!u.includes('action='));assert.equal(config.length,1);assert.equal(auth.length,1);
 if(cancel){assert.equal(d.querySelector('.ch14'),null);assert.equal(d.getElementById('r14').className,'h');}
 else if(expired){assert.match(d.getElementById('r14body').textContent,/inativa|expirada/);assert.equal(d.querySelector('.ch14'),null);}
 else{assert.equal(d.querySelector('.ch14').textContent,'Channel');assert.equal(requests.filter(u=>u.includes('action=get_live_categories')).length,1);assert.equal(requests.filter(u=>u.includes('action=get_live_streams')&&u.includes('category_id=1')).length,1);}
 w.close();console.log('PASS startup',mode,{stale,replay,cancel,expired},': no legacy, single authentication and correct final state');
}
(async()=>{await run('all');await run('minimum');await run('minimum',{stale:true});await run('minimum',{replay:true});await run('minimum',{cancel:true});await run('all',{expired:true});})().catch(e=>{console.error(e);process.exitCode=1});
