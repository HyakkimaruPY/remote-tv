(function(w){'use strict';
var X=w.XT10,R=w.RemoteTV||(w.RemoteTV={}),BR='http://127.0.0.1:8765/fetch?u=',KEYURL='https://raw.githubusercontent.com/HyakkimaruPY/fei-config/main/.bin',CK='tmdb.meta.v19',key='',busy=0,wait=[],mem={};
if(!X)return;
function trim(s){return String(s||'').replace(/^\s+|\s+$/g,'')}
function load(){try{return JSON.parse(localStorage.getItem(CK)||'{}')||{}}catch(e){return{}}}
function save(o){try{var ks=[],k,n={},i;for(k in o)if(o.hasOwnProperty(k))ks.push(k);ks.sort(function(a,b){return(o[b].ts||0)-(o[a].ts||0)});for(i=0;i<ks.length&&i<40;i++)n[ks[i]]=o[ks[i]];localStorage.setItem(CK,JSON.stringify(n))}catch(e){}}
function get(u,cb,to){var x=new XMLHttpRequest(),d=0,t;function q(e,v){if(d)return;d=1;clearTimeout(t);cb(e,v||'')}try{x.onreadystatechange=function(){if(x.readyState==4)q(x.status==200?null:'HTTP '+x.status,x.responseText)};x.open('GET',BR+encodeURIComponent(u),true);x.send(null);t=setTimeout(function(){try{x.abort()}catch(e){}q('Timeout','')},to||6500)}catch(e){q('Falha','')}}
function jget(u,cb){get(u,function(e,t){var j;if(e){cb(e);return}try{j=JSON.parse(t)}catch(z){cb('JSON inválido');return}cb(null,j)},7500)}
function getKey(cb){var i,m;if(key){cb(null,key);return}wait.push(cb);if(busy)return;busy=1;get(KEYURL,function(e,t){if(!e){m=/key\s*=\s*([^\r\n]+)/i.exec(t);if(m)key=trim(m[1])}busy=0;for(i=0;i<wait.length;i++)try{wait[i](key?null:(e||'chave ausente'),key)}catch(z){}wait=[]},4500)}
function clean(n){return trim(String(n||'').replace(/\[[^\]]+\]/g,' ').replace(/\b(?:4K|FHD|FULL\s*HD|HD|SD|LEG|DUB)\b/ig,' ').replace(/\s+/g,' '))}
function img(p,size){return p?'https://image.tmdb.org/t/p/'+(size||'w500')+p:''}
function ck(o,t){return t+':'+String(o.tmdb||'')+':'+clean(o.n).toLowerCase()+':'+String(o.y||'')}
function pickLogo(a){var i;if(!a||!a.length)return'';for(i=0;i<a.length;i++)if(a[i]&&(a[i].iso_639_1=='pt'||a[i].iso_639_1=='en'))return a[i].file_path||'';return a[0].file_path||''}
function apply(o,m){if(!m)return o;o.tmdb=o.tmdb||m.id||'';o.bg=o.bg||m.bg||'';o.p=o.p||m.p||'';o.ds=o.ds||m.ds||'';o.logo=o.logo||m.logo||'';o.tmdbUsed=!!(m.bg||m.p||m.ds||m.logo);return o}
function detailById(o,t,id,k,cb,api){var ep=t=='m'?'movie':'tv',u='https://api.themoviedb.org/3/'+ep+'/'+encodeURIComponent(id)+'?api_key='+encodeURIComponent(api)+'&language=pt-BR&append_to_response=images&include_image_language=pt,en,null';jget(u,function(e,j){var im,rec;if(e){cb(null,o);return}im=j&&j.images||{};rec={id:j.id||id,bg:img(j.backdrop_path,'w1280'),p:img(j.poster_path,'w500'),ds:j.overview||'',logo:img(pickLogo(im.logos),'w500'),ts:(new Date()).getTime()};mem[k]=rec;var all=load();all[k]=rec;save(all);X.log('TMDB19','detalhe '+ep+' · id='+String(rec.id)+' · backdrop='+(rec.bg?'sim':'não')+' · logo='+(rec.logo?'sim':'não'));cb(null,apply(o,rec))})}
function enrich(o,t,cb){var k=ck(o,t),all=load(),hit=mem[k]||all[k],id=String(o.tmdb||'').replace(/\D/g,'');if(hit){apply(o,hit);cb(null,o);return}getKey(function(e,api){var q,u,ep;if(e||!api){cb(null,o);return}if(id){detailById(o,t,id,k,cb,api);return}q=clean(o.n);if(!q){cb(null,o);return}ep=t=='m'?'movie':'tv';u='https://api.themoviedb.org/3/search/'+ep+'?api_key='+encodeURIComponent(api)+'&language=pt-BR&query='+encodeURIComponent(q)+(o.y?(t=='m'?'&year=':'&first_air_date_year=')+encodeURIComponent(String(o.y).slice(0,4)):'');jget(u,function(er,j){var a=j&&j.results||[],r=a[0];if(er||!r){cb(null,o);return}detailById(o,t,r.id,k,cb,api)})})}
w.XTMeta19={enrich:enrich,image:img};
R.tmdbMetadata='0.19';
try{X.log('BOOT','TMDB metadata v0.19 · provider-first · fallback sob demanda · chave externa preservada')}catch(e){}
}(this));
