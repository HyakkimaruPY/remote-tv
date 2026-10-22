/* Philco 6.4.2 - TV-local companion client, ES5, no manual IP; requires optional native LAN service. */
(function(w){'use strict';
var R=w.RemoteTV||(w.RemoteTV={}),URL='http://127.0.0.1:8766',KEY='remote-tv.libs.beta6.v1';
function enabled(){try{var o=JSON.parse(w.localStorage.getItem(KEY)||'{}');return o.localhost!==false;}catch(e){return true;}}
function req(path,cb,timeout){var x=new XMLHttpRequest(),dead=false,t=0;function done(e,j){if(dead)return;dead=true;clearTimeout(t);x.onreadystatechange=x.onerror=null;cb(e,j);}
 try{x.open('GET',URL+path,true);x.onreadystatechange=function(){if(x.readyState!==4)return;if(x.status!==200){done('HTTP '+x.status);return;}
 var o;try{o=JSON.parse(x.responseText);}catch(e){done('JSON inválido');return;}done(null,o);};
 x.onerror=function(){done('Servidor ausente');};t=setTimeout(function(){try{x.abort();}catch(e){}done('Timeout');},timeout||2400);x.send(null);
 }catch(e){done('Transporte indisponível');}
 return {cancel:function(){if(dead)return;dead=true;clearTimeout(t);try{x.abort();}catch(e){}}};
}
function begin(cb){if(!enabled()){cb('Módulo localhost desativado');return;}req('/pair/new?ts='+new Date().getTime(),function(err,d){if(err||!d||!d.sid||!d.tvToken||!/^http:\/\/[^/]+\/pair\/open\?key=/.test(d.phoneUrl||'')){cb(err||'Serviço inválido');return;}
 var p={sid:d.sid,token:d.tvToken,phoneUrl:d.phoneUrl,active:true,last:0,timer:0,handle:null};cb(null,p);},3200);}
function stop(p){if(!p)return;p.active=false;clearTimeout(p.timer);if(p.handle&&p.handle.cancel)p.handle.cancel();
 req('/pair/close?sid='+encodeURIComponent(p.sid)+'&token='+encodeURIComponent(p.token),function(){},1500);}
function watch(p,onText,onClose){if(!p||!p.active)return;function tick(){if(!p.active)return;
 p.handle=req('/pair/poll?sid='+encodeURIComponent(p.sid)+'&token='+encodeURIComponent(p.token)+'&_='+new Date().getTime(),function(err,d){
  if(!p.active)return;
  if(err||!d||d.expiresIn<=0){p.active=false;clearTimeout(p.timer);if(onClose)onClose(err||'Expirado');return;}
  if(d.seq>p.last){p.last=d.seq;if(onText)onText(String(d.q||''));}
  p.timer=setTimeout(tick,1600);
 },4200);
 }tick();}
w.PhilcoLocalhost642={begin:begin,watch:watch,close:stop,enabled:enabled,health:function(cb){req('/health',cb,1800);}};
})(this);
