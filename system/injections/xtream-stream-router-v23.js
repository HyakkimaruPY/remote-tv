(function(w){'use strict';
var X=w.XT10,R=w.RemoteTV||(w.RemoteTV={}),AH='http://127.0.0.1:8765/hls?u=';if(!X)return;
function ext(x){return String(x||'').replace(/^\./,'').toLowerCase()}
function base(o){var c=X.state&&X.state.c,k=o.t=='c'?'live':o.t=='m'?'movie':'series';if(!c)return'';return c.d+'/'+k+'/'+encodeURIComponent(c.u)+'/'+encodeURIComponent(c.p)+'/'+o.id+'.'}
function auto(u,maxh){return AH+encodeURIComponent(u)+(maxh?'&maxh='+maxh:'')}
function liveRoutes(o){var b=base(o),h;if(!b)return[];h=b+'m3u8';return[auto(h,480),auto(h,720),h]}
function routes(o){var b=base(o),a=[],e=ext(o.ext)||(o.t=='c'?'ts':'');if(!b)return a;if(o.t=='c')return liveRoutes(o);if(e)a.push(b+e);return a}
X.liveRoutes=liveRoutes;X.routes=routes;X.stream=function(o){var a=o&&o.t=='c'?liveRoutes(o):routes(o),u=a[0]||'';try{X.log('STREAM23',(o.t=='c'?'live':'vod')+' id='+String(o.id)+' · '+(o.t=='c'?'AutoHLS 480p decoder-safe':'container')+' · '+X.mask(u))}catch(e){}return u};
R.streamPolicy='autohls-480-decoder-safe';R.streamRouter='0.23';try{X.log('BOOT','Stream router v0.23 · live AutoHLS 480p, 720p e direto como fallbacks')}catch(e){}
}(this));
