/* Lite rendering is opt-in and never touches live decoder, stream buffer or native TLS. */
(function(w){'use strict';var R=w.RemoteTV||(w.RemoteTV={}),m=R.libraryManager;
if(!m)return;
m.register({id:'frame-budget',title:'Render leve · imagens em lotes',enabled:true,restartRequired:false,
 start:function(){if(w.PhilcoSearch642)w.PhilcoSearch642.setPerformanceMode(true);},
 stop:function(){if(w.PhilcoSearch642)w.PhilcoSearch642.setPerformanceMode(false);},
 test:function(scope,done){done(!!w.PhilcoSearch642,'Busca: lotes pequenos de imagens, até 12 resultados na tela; sem recodificar vídeo');}});
})(this);
