const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('node:assert/strict');const read=p=>fs.readFileSync(p,'utf8');
function env(){const dom=new JSDOM('<!doctype html><html><head></head><body>'+read('apps/player1/shell.html')+'</body></html>',{url:'http://tv.test/',runScripts:'outside-only'});const w=dom.window;let clock=10000,id=0,jobs=new Map();w.Date=class extends Date{constructor(...a){super(...(a.length?a:[clock]))}static now(){return clock}};w.setTimeout=(fn,ms)=>{jobs.set(++id,{fn,at:clock+(ms||0)});return id};w.clearTimeout=i=>jobs.delete(i);function tick(ms){const end=clock+ms;for(let n=0;n<4000;n++){const a=[...jobs].filter(x=>x[1].at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!a)break;jobs.delete(a[0]);clock=a[1].at;a[1].fn()}clock=end}const req=[];w.XMLHttpRequest=class{constructor(){req.push(this);this.status=0}open(m,u,a){this.url=u;this.async=a}send(){}abort(){this.aborted=true}reply(s,t){this.status=s;this.responseText=t;this.readyState=4;if(this.onreadystatechange)this.onreadystatechange()}};w.RemoteTV={};const logs=[];w.XT10={log:(...x)=>logs.push(x.join(' ')),mask:x=>x};w.HTMLMediaElement.prototype.load=function(){};w.HTMLMediaElement.prototype.play=function(){this.plays=(this.plays||0)+1;return Promise.resolve()};w.HTMLMediaElement.prototype.pause=function(){};return{dom,w,req,tick,logs,run:f=>{if(!w.RemoteTV.RequestScope)w.eval(read('system/runtime-beta56-3.js'));w.eval(read(f))}}}
const uiSource=process.env.RTV_RESUME_UI||'system/readable/xtream-ui.beta56-6-5-4.js',vodSource=process.env.RTV_RESUME_VOD||'system/readable/xtream-vod-player.beta56-6-5-4.js';
function fixture(options={}){
 const e=env(),w=e.w,d=w.document;const film={t:'m',id:11,n:'Film',ext:'mp4'},series={t:'s',id:22,n:'Series'},eps=[{t:'s',id:50,n:'S1E1',sn:1,ep:1,ext:'mp4'},{t:'s',id:51,n:'S1E2',sn:1,ep:2,ext:'mp4'},{t:'s',id:60,n:'S2E1',sn:2,ep:1,ext:'mp4'}];
 let queued=[],metadata=0;
 w.YTCore={};w.RawPlayer={close(){},exit(){}};
 Object.assign(w.XT10,{ensureAuth:cb=>cb(null),cats:(t,cb)=>cb(null,[{id:1,n:'Category'}]),items:(t,c,cb)=>cb(null,t==='m'?[{...film}]:t==='s'?[{...series}]:[]),vod:(o,cb)=>{metadata++;o.ext='mp4';const done=()=>cb(null,o);if(options.slowMovie)queued.push(done);else done()},series:(o,cb)=>{const done=()=>cb(null,Object.assign(o,{eps:options.missing?[eps[0]]:eps}));if(options.slowSeries)queued.push(done);else done()},cancel(){},releaseItems(){},releaseEpisodes(){}});
 w.XTAutoVod22={resolve:(o,cb)=>cb(null,{local:'http://fixture/'+o.id+'.mp4',remote:'http://fixture/'+o.id+'.mp4',kind:'mp4',ext:'mp4'})};
 const cont=options.cont||{m:[{...film,pos:600,dur:3600,ts:1000}],s:[{...series,episode_id:'60',episode:{...eps[2]},pos:900,dur:3600,ts:2000}]};
 const progress=options.progress||{'m:11':{p:600,d:3600,ts:1000},'e:60':{p:900,d:3600,ts:2000}};
 w.localStorage.setItem('xtream.continue.v14',JSON.stringify(cont));w.localStorage.setItem('xtream.progress.v14',JSON.stringify(progress));e.run(vodSource);e.run(uiSource);w.RawM3U.open();
 const api=w.XTVod29;
 function category(t){d.getElementById(t==='m'?'hm14':'hs14').click();d.querySelector('.cat14').click();e.tick(140);d.querySelector('.card14').click()}
 function continuing(t,keyboard=false){d.getElementById('hct14').click();d.querySelector('.tab14[data-sp="'+t+'"]').click();const b=d.querySelector('#spg14 .card14');b.focus();if(keyboard)w.RawM3U.key({keyCode:13,preventDefault(){},stopPropagation(){}});else b.click()}
 function media({ignore=false,seeking=false,asyncReset=false}={}){const v=api.state.video;let ct=0;Object.defineProperties(v,{duration:{configurable:true,value:3600},readyState:{configurable:true,value:4},networkState:{configurable:true,value:2},paused:{configurable:true,value:false},buffered:{configurable:true,value:{length:1,start:()=>0,end:()=>3600}},seeking:{configurable:true,get:()=>seeking},currentTime:{configurable:true,get:()=>ct,set:x=>{if(!ignore){ct=x;if(asyncReset)w.setTimeout(()=>ct=0,50)}}}});v.onloadedmetadata();return{v,get time(){return ct},set time(x){ct=x},seekDone(){seeking=false}}}
 return{...e,d,api,category,continuing,media,film,series,eps,get metadata(){return metadata},reply(){const cb=queued.shift();if(cb)cb()},close(){if(api.active())api.stop();w.close()}};
}
function playingAt(e,id,pos){assert.equal(e.api.active(),true);assert.equal(String(e.api.state.item.id),String(id));assert.equal(e.api.state.resumeAt,pos);assert.equal(e.d.getElementById('resume34'),null);const m=e.media();assert.equal(e.api.state.resumeDone,0,'setter alone must not confirm');assert.equal(m.v.plays||0,0,'play blocked before observed seek');e.tick(500);assert.equal(e.api.state.resumeDone,1);assert.equal(m.time,pos);assert.equal(m.v.plays,1);return m;}
{
 const e=fixture();e.continuing('m',true);assert.equal(e.d.getElementById('play14'),null);const m=playingAt(e,11,600);assert.equal(e.metadata,0);m.time=620;e.tick(4000);e.api.stop();assert.equal(e.d.getElementById('r14').className,'');assert.ok(e.d.querySelector('#spg14'));e.d.querySelector('#spg14 .card14').click();assert.equal(e.api.state.resumeAt,620);e.close();console.log('PASS Continue film via remote OK bypasses information and resumes persisted position; exit/reopen uses newest progress');
}
{
 const e=fixture();e.continuing('s');assert.equal(e.d.getElementById('eg14'),null);playingAt(e,60,900);assert.equal(e.api.state.index,2);assert.equal(e.api.state.ctx.series.id,22);e.close();console.log('PASS Continue series resolves string episode_id across seasons and plays directly at saved time');
}
{
 const e=fixture();e.category('m');assert.match(e.d.getElementById('play14').textContent,/Continuar/);e.d.getElementById('play14').click();const m=playingAt(e,11,600);m.time=650;e.tick(4000);e.api.stop();assert.match(e.d.getElementById('play14').textContent,/10:50/);e.d.getElementById('play14').click();assert.equal(e.api.state.resumeAt,650);e.close();console.log('PASS category movie Continue starts directly without dialog and refreshes after playback exit');
}
{
 const e=fixture();e.category('s');const b=e.d.getElementById('splay654');assert.ok(b);assert.match(b.textContent,/Continuar/);assert.equal(e.d.querySelector('.season19.sel').getAttribute('data-sn'),'1');e.d.getElementById('eb14').focus();e.w.RawM3U.key({keyCode:39,preventDefault(){}});assert.equal(e.d.activeElement,b);b.click();playingAt(e,60,900);e.close();console.log('PASS category series Continue resumes saved S2 episode while browsing S1; remote arrow reaches action');
}
{
 const e=fixture({progress:{},cont:{m:[{t:'m',id:'11',n:'Film',ext:'mp4',pos:780}],s:[]}});e.category('m');assert.match(e.d.getElementById('play14').textContent,/Continuar/);e.d.getElementById('play14').click();playingAt(e,11,780);e.close();console.log('PASS existing Continue movie record alone supplies label and resume position');
}
{
 const e=fixture({progress:{'e:51':{p:400,ts:200},'e:60':{p:500,ts:300}},cont:{m:[],s:[]}});e.category('s');assert.match(e.d.getElementById('splay654').textContent,/Continuar/);e.d.getElementById('splay654').click();playingAt(e,60,500);e.close();console.log('PASS episode progress alone selects newest watched episode without migrating storage');
}
{
 const e=fixture({progress:{},cont:{m:[],s:[]}});e.category('m');assert.match(e.d.getElementById('play14').textContent,/Assistir/);e.d.getElementById('play14').click();assert.equal(e.api.state.resumeAt,0);e.api.stop();e.category('s');assert.match(e.d.getElementById('splay654').textContent,/Assistir/);e.d.getElementById('splay654').click();assert.equal(e.api.state.item.id,50);assert.equal(e.api.state.resumeAt,0);e.close();console.log('PASS unwatched films and series retain Assistir and start at beginning');
}
{
 const e=fixture({missing:true});const before=e.w.localStorage.getItem('xtream.continue.v14');e.continuing('s');assert.equal(e.api.active(),false);assert.match(e.d.getElementById('resumeHint654').textContent,/preservado/);assert.equal(e.w.localStorage.getItem('xtream.continue.v14'),before);e.close();console.log('PASS missing saved episode keeps screen and progress; never plays first episode instead');
}
{
 const e=fixture({slowSeries:true});e.continuing('s');e.w.RawM3U.back();e.reply();assert.equal(e.api.active(),false);e.close();console.log('PASS Back during direct Continue episode fetch prevents late playback');
}
{
 const e=fixture({slowMovie:true,cont:{m:[{t:'m',id:11,n:'Legacy film',pos:600}],s:[]}});e.continuing('m');assert.equal(e.api.active(),false);assert.equal(e.d.getElementById('play14'),null);e.reply();playingAt(e,11,600);e.close();console.log('PASS old movie record without extension resolves metadata without opening information');
}
{
 const e=fixture({slowMovie:true,cont:{m:[{t:'m',id:11,n:'Legacy film',pos:600}],s:[]}});e.continuing('m');e.w.RawM3U.back();e.reply();assert.equal(e.api.active(),false);e.close();console.log('PASS Back during direct Continue movie fetch invalidates late response');
}
{
 const e=fixture();e.continuing('m');const m=e.media({seeking:true});e.tick(3000);assert.equal(e.api.state.resumeDone,0);assert.equal(m.v.plays||0,0);m.seekDone();e.tick(500);assert.equal(e.api.state.resumeDone,1);assert.equal(m.v.plays,1);e.close();console.log('PASS delayed asynchronous seek must finish before first play');
}
{
 const e=fixture();e.continuing('m');const m=e.media({ignore:true});e.tick(26000);assert.equal(e.api.state.resumeDone,0);assert.equal(e.api.state.resumeFailed34,1);assert.equal(m.v.plays||0,0);assert.equal(e.api.progress({t:'m',id:11}).p,600);e.close();console.log('PASS refused resume never starts at zero or replaces saved progress');
}
{
 const e=fixture();e.continuing('m');const m=e.media({asyncReset:true});e.tick(26000);assert.equal(e.api.state.resumeDone,0);assert.equal(m.v.plays||0,0);assert.equal(e.api.progress({t:'m',id:11}).p,600);e.close();console.log('PASS setter reports target then resets on next turn: no false confirmation or start from zero');
}
console.log('Continue 6.5.4: 14 integration scenarios PASS (DOM/media/network/clock fixtures)');
