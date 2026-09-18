(function(w){'use strict';
var X=w.XT10,R=w.RemoteTV||(w.RemoteTV={}),AH='http://127.0.0.1:8765/hls?u=';if(!X)return;
function ext(x){return String(x||'').replace(/^\./,'').toLowerCase()}
function base(o){var c=X.state&&X.state.c,k=o.t=='c'?'live':o.t=='m'?'movie':'series';if(!c)return'';return c.d+'/'+k+'/'+encodeURIComponent(c.u)+'/'+encodeURIComponent(c.p)+'/'+o.id+'.'}
function auto(u){return AH+encodeURIComponent(u)}
function routes(o){var b=base(o),a=[],e=ext(o.ext)||(o.t=='c'?'ts':'');if(!b)return a;if(o.t=='c'){var h=b+'m3u8';a.push(auto(h));a.push(h);if(e&&e!='m3u8')a.push(b+e)}else{if(e)a.push(b+e);a.push(auto(b+'m3u8'));a.push(b+'m3u8')}return a}
X.routes=routes;X.stream=function(o){var a=routes(o),u=a[0]||'';try{X.log('STREAM19',(o.t=='c'?'live':o.t=='m'?'movie':'series')+' id='+String(o.id)+' · AutoHLS-first · '+X.mask(u))}catch(e){}return u};
R.streamPolicy='autohls-bridge-first';R.streamRouter='0.19';try{X.log('BOOT','Stream router v0.19 · AutoHLS bridge-first para live; container preservado em VOD')}catch(e){}
}(this));
