/* Philco Beta 6.4 diagnostic module — passive until enabled. */
(function(w){'use strict';var R=w.RemoteTV||(w.RemoteTV={}),events=0,errors=0,startAt=0,active=false;
function err(){errors++;}function key(){events++;}
function start(){if(active)return;active=true;startAt=new Date().getTime();if(w.addEventListener){w.addEventListener('error',err,false);w.addEventListener('keydown',key,false);}}
function stop(){if(!active)return;active=false;if(w.removeEventListener){w.removeEventListener('error',err,false);w.removeEventListener('keydown',key,false);}}
if(R.libraryManager)R.libraryManager.register({id:'diagnostico',title:'Diagnóstico de interface',enabled:false,category:'diagnostic',restartRequired:false,start:start,stop:stop,test:function(scope,done){var seconds=active?Math.floor((new Date().getTime()-startAt)/1000):0;done(true,'Teclas '+events+' · erros '+errors+' · sessão '+seconds+' s');}});
})(this);
