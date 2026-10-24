/* Philco 6.5.1 - QR companion plus Portal on the firmware-native 8765 bridge, with 8766 fallback. */
(function(w){'use strict';
var R=w.RemoteTV||(w.RemoteTV={}),QR_URL='http://127.0.0.1:8766',PORTAL_URLS=['http://127.0.0.1:8765','http://127.0.0.1:8766'],KEY='remote-tv.libs.beta6.v1';
function enabled(){try{var o=JSON.parse(w.localStorage.getItem(KEY)||'{}');return o.localhost!==false;}catch(e){return true;}}
function reqBase(base,method,path,cb,timeout,portal){var x=new XMLHttpRequest(),dead=false,t=0;function done(e,j){if(dead)return;dead=true;clearTimeout(t);x.onreadystatechange=x.onerror=null;cb(e,j);}
 try{x.open(method,base+path,true);if(portal)x.setRequestHeader('X-Remote-TV-Portal','651');
 x.onreadystatechange=function(){if(x.readyState!==4)return;if(x.status!==200){done('HTTP '+x.status);return;}var o;try{o=JSON.parse(x.responseText);}catch(e){done('JSON inválido');return;}done(null,o);};
 x.onerror=function(){done('Servidor ausente');};t=setTimeout(function(){done('Timeout');try{x.abort();}catch(e){}},timeout||2400);x.send(method==='POST'?'{}':null);
 }catch(e){done('Transporte indisponível');}
 return {cancel:function(){if(dead)return;dead=true;clearTimeout(t);x.onreadystatechange=x.onerror=null;try{x.abort();}catch(e){}}};
}
function get(path,cb,timeout){return reqBase(QR_URL,'GET',path,cb,timeout,false);}
var selectedPortal='', lastProbe=[];
function portalOperation(run,cb){var stopped=false,handles=[];
 function track(h){if(h)handles.push(h);return h;}
 function finish(err,data){if(!stopped){stopped=true;cb(err,data);}}
 run(track,finish,function(){return stopped;});
 return {cancel:function(){if(stopped)return;stopped=true;for(var i=0;i<handles.length;i++)if(handles[i]&&handles[i].cancel)handles[i].cancel();}};
}
function discoverPortal(track,done,stopped){var index=0,notes=[],best=null;selectedPortal='';
 function next(){if(stopped())return;if(index>=PORTAL_URLS.length){lastProbe=notes;done(best?null:'Ponte Portal ausente em 8765 e 8766',best||{ok:false,helloWorld:false,bridges:notes});return;}
  var base=PORTAL_URLS[index++];
  track(reqBase(base,'GET','/portal/capabilities',function(err,data){if(stopped())return;
   var valid=!err&&data&&typeof data.helloWorld==='boolean';
   notes.push({port:base===PORTAL_URLS[0]?8765:8766,state:err||(!valid?'Resposta sem API Portal':data.helloWorld&&data.ok?'disponível':(data.reasons||['capacidade nativa ausente']).join('; '))});
   if(valid){data.bridge=base;data.bridges=notes;best=data;if(data.ok&&data.helloWorld){selectedPortal=base;lastProbe=notes;done(null,data);return;}}
   next();
  },2800,true));
 }next();
}
function capabilities(cb){return portalOperation(discoverPortal,cb);}
function portalReq(method,path,cb,timeout){return portalOperation(function(track,done,stopped){
 function send(){if(stopped())return;track(reqBase(selectedPortal,method,path,function(err,data){if(data)data.bridge=selectedPortal;done(err,data);},timeout,true));}
 if(selectedPortal){send();return;}
 discoverPortal(track,function(err,cap){if(err||!cap||!cap.helloWorld||!selectedPortal){done(err||'AppMgr indisponível',cap);return;}send();},stopped);
},cb);}
function begin(cb){if(!enabled()){cb('Módulo localhost desativado');return;}get('/pair/new?ts='+new Date().getTime(),function(err,d){if(err||!d||!d.sid||!d.tvToken||!/^http:\/\/[^/]+\/pair\/open\?key=/.test(d.phoneUrl||'')){cb(err||'Serviço inválido');return;}
 var p={sid:d.sid,token:d.tvToken,phoneUrl:d.phoneUrl,active:true,last:0,timer:0,handle:null};cb(null,p);},3200);}
function stop(p){if(!p)return;p.active=false;clearTimeout(p.timer);if(p.handle&&p.handle.cancel)p.handle.cancel();get('/pair/close?sid='+encodeURIComponent(p.sid)+'&token='+encodeURIComponent(p.token),function(){},1500);}
function watch(p,onText,onClose){if(!p||!p.active)return;function tick(){if(!p.active)return;
 p.handle=get('/pair/poll?sid='+encodeURIComponent(p.sid)+'&token='+encodeURIComponent(p.token)+'&_='+new Date().getTime(),function(err,d){
  if(!p.active)return;if(err||!d||d.expiresIn<=0){p.active=false;clearTimeout(p.timer);if(onClose)onClose(err||'Expirado');return;}
  if(d.seq>p.last){p.last=d.seq;if(onText)onText(String(d.q||''));}p.timer=setTimeout(tick,1600);
 },4200);}tick();}
var pairApi={begin:begin,watch:watch,close:stop,enabled:enabled,health:function(cb){get('/health',cb,1800);}};
w.PhilcoLocalhost642=pairApi;w.PhilcoLocalhost651=pairApi;
w.PhilcoPortal651={
 capabilities:capabilities,
 status:function(cb){return portalReq('GET','/portal/hello/status',cb,2800,0);},
 enableHello:function(cb){return portalReq('POST','/portal/hello/enable',cb,12000,0);},
 disableHello:function(cb){return portalReq('POST','/portal/hello/disable',cb,12000,0);}
,
 diagnostics:function(){return lastProbe.slice(0);}
};
})(this);
