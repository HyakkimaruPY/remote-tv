/* Philco 6.5.2 Portal: visible probes, native-object inventory and gated AppMgr registration. */
(function(w){'use strict';
var R=w.RemoteTV||(w.RemoteTV={}),m=R.libraryManager,p=w.PhilcoPortal651,registered=false,probeGeneration=0;
if(!m)return;
function track(scope,handle){if(!scope||!handle||!handle.cancel)return;var cancel=scope.cancel;scope.cancel=function(){handle.cancel();if(cancel)cancel.call(scope);};}
function notes(err,cap){var a=cap&&cap.bridges||[],out=[],i;
 for(i=0;i<a.length;i++)out.push(a[i].port+': '+a[i].state);
 if(!out.length)out.push(err||cap&&cap.reasons&&cap.reasons.join('; ')||'API Portal sem confirmação');
 return out.join(' · ');
}
function status(text){if(m.setTabStatus)m.setTabStatus('portal',text);}
function registerHello(cap,state){if(registered)return;registered=true;
 m.register({id:'native-app-hello',title:'Hello World · Apps nativos',category:'portal',enabled:false,actualOn:!!state.installed,
 probe:function(){return !!cap.helloWorld;},
 startAsync:function(done){mutate(true,done);},stopAsync:function(done){mutate(false,done);},
 test:function(scope,done){track(scope,p.status(function(e,s){done(!e&&!!s&&s.appmgr,'AppMgr '+(s&&s.appmgr?'ativo':'indisponível')+' · Hello World '+(s&&s.installed?'registrado':'ausente'));}));}});
}
function mutate(want,done){
 var fn=want?p.enableHello:p.disableHello;
 fn(function(err,data){
  if(!err&&data&&typeof data.installed==='boolean'){done(data.installed===want,data.installed?'registrado no AppMgr':'removido do AppMgr');return;}
  // An HTTP timeout does not prove the native transaction failed. Read state;
  // never replay the POST against a second bridge.
  p.status(function(e,s){done(!e&&s&&s.installed===want,!e&&s&&s.installed===want?'estado confirmado após resposta interrompida':err||'estado nativo não confirmado');});
 });
}
function refresh(scope,done){
 var generation=++probeGeneration;
 if(scope){var cancel=scope.cancel;scope.cancel=function(){if(generation===probeGeneration)probeGeneration++;if(cancel)cancel.call(scope);};}
 if(!p||!p.capabilities){status('API Portal não carregada. O diagnóstico do WebKit continua disponível.');done(false,'Cliente Portal ausente');return;}
 status('Verificando a ponte e o suporte de registro de apps…');
 track(scope,p.capabilities(function(err,cap){
  if(generation!==probeGeneration)return;
  var summary=notes(err,cap);
  if(err||!cap||!cap.ok||!cap.helloWorld){status(summary+' · Hello World requer uma ponte com suporte AppMgr. Use Verificar para tentar novamente.');done(false,summary);return;}
  track(scope,p.status(function(e,s){
   if(generation!==probeGeneration)return;
   if(e||!s){status(summary+' · Estado do AppMgr indisponível.');done(false,'Estado do AppMgr não confirmado');return;}
   registerHello(cap,s);status(summary+' · Hello World disponível; Ativar registra o app na lista nativa.');done(true,summary);
  }));
 }));
}
function nativeObjects(){var methods=['loadPage','unloadPage','launchApp','forceGC','whoami','Cmd','setGeometry'],names=['mstarExt','MStarExt','mstar','MStar','MstarLauncher','WebAppMgr'],out=[],i,j,o,found;
 for(i=0;i<names.length;i++){found=[];try{o=w[names[i]];if(!o)continue;for(j=0;j<methods.length;j++)if(typeof o[methods[j]]==='function')found.push(methods[j]);}catch(e){}
  if(found.length)out.push(names[i]+': '+found.join(', '));
 }
 if(R.vendorBridge651&&R.vendorBridge651.methods)out.push(R.vendorBridge651.name+': '+R.vendorBridge651.methods().join(', '));
 return out;
}
m.register({id:'portal-bridge',title:'Portal e Apps · verificar ponte',category:'portal',actionOnly:true,
 test:refresh});
m.register({id:'portal-native-api',title:'Ponte nativa WebKit · inspecionar',category:'portal',actionOnly:true,
 test:function(scope,done){var a=nativeObjects(),nativePlayer=!!(w.QjyMediaPlayer||w.MediaPlayer);var msg=a.length?a.join(' · '):'mstarExt não exposto neste documento';
  status(msg+' · Player nativo '+(nativePlayer?'exposto':'não exposto')+'. Inspeção somente; não executa comandos proprietários.');done(true,msg);}});
R.portal652={refresh:refresh,nativeObjects:nativeObjects};
refresh(null,function(){});
}(this));
