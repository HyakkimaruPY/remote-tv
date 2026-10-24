/* One network diagnostic: local bridge then HTTPS; no duplicate reachability request. */
(function(w){'use strict';var R=w.RemoteTV||(w.RemoteTV={}),m=R.libraryManager,target='https://raw.githubusercontent.com/HyakkimaruPY/remote-tv/main/version';if(!m)return;
m.register({id:'network',title:'Rede e HTTPS · diagnóstico unificado',category:'system',enabled:true,restartRequired:false,
 test:function(scope,done){var start=new Date().getTime();scope.local('/health',function(e){if(e){done(false,'Bridge 8765 indisponível; etapa HTTPS não executada');return;}
  scope.fetch(target,function(err){done(!err,err?'Bridge OK · transporte HTTPS falhou':'Bridge + HTTPS OK · '+(new Date().getTime()-start)+' ms · certificado não inspecionado');},6500);
 },2500);}});
}(this));
