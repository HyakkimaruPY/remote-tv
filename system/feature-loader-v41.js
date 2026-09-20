(function(w,d){'use strict';
var R=w.RemoteTV,BASE='https://raw.githubusercontent.com/HyakkimaruPY/remote-tv/main/',busy={},wait={};
var SPECS={yt3:{id:'youtube3',path:'apps/youtube3/probe-v40.js',sha:'a56715ec90d7f5d09946c31e8c3a785044451e962183d571d73b104420b1158e',key:'remote-tv.feature.youtube3.v40'}};
function get(k){try{return localStorage.getItem(k)||''}catch(e){return''}}
function set(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function del(k){try{localStorage.removeItem(k)}catch(e){}}
function valid(s,code){return!!(code&&R&&R.sha256&&R.sha256(code)===s.sha)}
function inject(s,code){var n=d.createElement('script');n.type='text/javascript';n.setAttribute('data-remote-feature',s.id);try{n.text=code}catch(e){n.appendChild(d.createTextNode(code))}(d.head||d.documentElement).appendChild(n)}
function flush(id,e){var a=wait[id]||[],i;busy[id]=0;wait[id]=[];for(i=0;i<a.length;i++)try{a[i](e)}catch(x){}}
function load(s,cb){var code;if(wait[s.id])wait[s.id].push(cb);else wait[s.id]=[cb];if(busy[s.id])return;busy[s.id]=1;code=get(s.key);if(valid(s,code)){try{inject(s,code);flush(s.id,null);return}catch(e){del(s.key)}}if(!R||!R.fetch){flush(s.id,'loader indisponível');return}R.fetch(BASE+s.path+'?feature='+encodeURIComponent(s.sha),function(e,v){if(e){flush(s.id,e);return}if(!valid(s,v)){flush(s.id,'integridade');return}try{set(s.key,v);inject(s,v);flush(s.id,null)}catch(x){flush(s.id,'execução')}} ,9000)}
var facade={open:function(){},back:function(){return false},key:function(){return false}};
w.RawM3U=facade;
function openYT3(){var b=d.getElementById('yt3');if(b)b.textContent='Abrindo YouTube 3…';load(SPECS.yt3,function(e){if(b)b.textContent=e?'YouTube 3 · tentar novamente':'YouTube 3 teste';if(!e&&w.YouTube3Probe)w.YouTube3Probe.open()})}
var y=d.getElementById('yt3');if(y)y.onclick=openYT3;
w.RemoteTVFeatures41={loadYouTube3:openYT3,state:function(){return{youtube3:!!w.YouTube3Probe}}};
}(this,document));
