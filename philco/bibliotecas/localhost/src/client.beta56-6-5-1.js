/* Philco 6.5.1 - TV-local companion client with QR pairing and guarded Portal calls. */
(function(w){'use strict';
var R=w.RemoteTV||(w.RemoteTV={}),URL='http://127.0.0.1:8766',KEY='remote-tv.libs.beta6.v1';
function enabled(){try{var o=JSON.parse(w.localStorage.getItem(KEY)||'{}');return o.localhost!==false;}catch(e){return true;}}
function req(method,path,cb,timeout,portal){var x=new XMLHttpRequest(),dead=false,t=0;function done(e,j){if(dead)return;dead=true;clearTimeout(t);x.onreadystatechange=x.onerror=null;cb(e,j);}
 try{x.open(method,URL+path,true);if(portal)x.setRequestHeader('X-Remote-TV-Portal','651');
 x.onreadystatechange=function(){if(x.readyState!==4)return;if(x.status!==200){done('HTTP '+x.status);return;}var o;try{o=JSON.parse(x.responseText);}catch(e){done('JSON inválido');return;}done(null,o);};
 x.onerror=function(){done('Servidor ausente');};t=setTimeout(function(){try{x.abort();}catch(e){}done('Timeout');},timeout||2400);x.send(method==='POST'?'{}':null);
 }catch(e){done('Transporte indisponível');}
 return {cancel:function(){if(dead)return;dead=true;clearTimeout(t);try{x.abort();}catch(e){}}};
}
function get(path,cb,timeout){return req('GET',path,cb,timeout,false);}
function begin(cb){if(!enabled()){cb('Módulo localhost desativado');return;}get('/pair/new?ts='+new Date().getTime(),function(err,d){if(err||!d||!d.sid||!d.tvToken||!/^http:\/\/[^/]+\/pair\/open\?key=/.test(d.phoneUrl||'')){cb(err||'Serviço inválido');return;}
 var p={sid:d.sid,token:d.tvToken,phoneUrl:d.phoneUrl,active:true,last:0,timer:0,handle:null};cb(null,p);},3200);}
function stop(p){if(!p)return;p.active=false;clearTimeout(p.timer);if(p.handle&&p.handle.cancel)p.handle.cancel();
 get('/pair/close?sid='+encodeURIComponent(p.sid)+'&token='+encodeURIComponent(p.token),function(){},1500);}
function watch(p,onText,onClose){if(!p||!p.active)return;function tick(){if(!p.active)return;
 p.handle=get('/pair/poll?sid='+encodeURIComponent(p.sid)+'&token='+encodeURIComponent(p.token)+'&_='+new Date().getTime(),function(err,d){
  if(!p.active)return;if(err||!d||d.expiresIn<=0){p.active=false;clearTimeout(p.timer);if(onClose)onClose(err||'Expirado');return;}
  if(d.seq>p.last){p.last=d.seq;if(onText)onText(String(d.q||''));}p.timer=setTimeout(tick,1600);
 },4200);}tick();}
var pairApi={begin:begin,watch:watch,close:stop,enabled:enabled,health:function(cb){get('/health',cb,1800);}};
w.PhilcoLocalhost642=pairApi;
w.PhilcoLocalhost651=pairApi;
w.PhilcoPortal651={
 capabilities:function(cb){req('GET','/portal/capabilities',cb,2600,true);},
 status:function(cb){req('GET','/portal/hello/status',cb,2600,true);},
 enableHello:function(cb){req('POST','/portal/hello/enable',cb,12000,true);},
 disableHello:function(cb){req('POST','/portal/hello/disable',cb,12000,true);}
};
})(this);
