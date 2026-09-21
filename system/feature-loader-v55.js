(function(w,d){'use strict';
var R=w.RemoteTV,BASE='https://raw.githubusercontent.com/HyakkimaruPY/remote-tv/main/',busy={},wait={};
var SPECS={yt3:{id:'youtube3',path:'apps/youtube3/probe-v55.js',sha:'b3610b49346f2644ff747891a4033fb8676751176397d3cc2af5b5aa1373199d',key:'remote-tv.feature.youtube3.v55'}};
function get(k){try{return localStorage.getItem(k)||''}catch(e){return''}}
function set(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function del(k){try{localStorage.removeItem(k)}catch(e){}}
function valid(s,code){return!!(code&&R&&R.sha256&&R.sha256(code)===s.sha)}
function inject(s,code){var n=d.createElement('script');n.type='text/javascript';n.setAttribute('data-remote-feature',s.id);try{n.text=code}catch(e){n.appendChild(d.createTextNode(code))}(d.head||d.documentElement).appendChild(n)}
function flush(id,e){var a=wait[id]||[],i;busy[id]=0;wait[id]=[];for(i=0;i<a.length;i++)try{a[i](e)}catch(x){}}
function load(s,cb){var code;if(wait[s.id])wait[s.id].push(cb);else wait[s.id]=[cb];if(busy[s.id])return;busy[s.id]=1;code=get(s.key);if(valid(s,code)){try{inject(s,code);flush(s.id,null);return}catch(e){del(s.key)}}if(!R||!R.fetch){flush(s.id,'loader indisponível');return}R.fetch(BASE+s.path+'?feature='+encodeURIComponent(s.sha),function(e,v){if(e){flush(s.id,e);return}if(!valid(s,v)){flush(s.id,'integridade');return}try{set(s.key,v);inject(s,v);flush(s.id,null)}catch(x){flush(s.id,'execução')}} ,9000)}
var facade={open:function(){},back:function(){return false},key:function(){return false}};
w.RawM3U=facade;
function openYT3(){var b=d.getElementById('yt3');if(b)b.textContent='Abrindo YouTube…';load(SPECS.yt3,function(e){if(b)b.textContent=e?'YouTube · tentar novamente':'YouTube Bridge';if(!e&&w.YouTube3Probe)w.YouTube3Probe.open()})}
var y=d.getElementById('yt3');if(y){y.textContent='YouTube Bridge';y.onclick=openYT3}
var api={loadYouTube3:openYT3,state:function(){return{youtube3:!!w.YouTube3Probe}}};w.RemoteTVFeatures55=api;w.RemoteTVFeatures54=api;w.RemoteTVFeatures41=api;
}(this,document));
