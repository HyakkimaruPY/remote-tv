(function(w){'use strict';
var X=w.XT10,R=w.RemoteTV||(w.RemoteTV={});if(!X)return;
function ext(x){return String(x||'').replace(/^\./,'').toLowerCase()}
function base(o){var c=X.state&&X.state.c,k=o.t=='c'?'live':o.t=='m'?'movie':'series';if(!c)return'';return c.d+'/'+k+'/'+encodeURIComponent(c.u)+'/'+encodeURIComponent(c.p)+'/'+o.id+'.'}
function routes(o){var b=base(o),a=[],e=ext(o.ext)||(o.t=='c'?'ts':'mp4');if(!b)return a;if(o.t=='c'){a.push(b+'m3u8');if(e!='m3u8')a.push(b+e);if(e!='ts')a.push(b+'ts')}else{a.push(b+'m3u8');if(e!='m3u8')a.push(b+e)}return a}
var old=X.stream;X.routes=routes;X.stream=function(o){var a=routes(o),u=a[0]||(old?old(o):'');try{X.log('STREAM13',(o.t=='c'?'live':o.t=='m'?'movie':'series')+' id='+String(o.id)+' · HLS-first · '+X.mask(u))}catch(e){}return u};
R.streamPolicy='hls-first-fallback';R.streamRouter='0.13';try{X.log('BOOT','Stream router v0.13 · HLS-first; fallback preservado')}catch(e){}
}(this));
