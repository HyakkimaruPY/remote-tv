/* Philco Beta 6.4 separate diagnostics; HTTPS reachability is NOT certificate inspection. */
(function(w){'use strict';var R=w.RemoteTV||(w.RemoteTV={}),mgr=R.libraryManager,target='https://raw.githubusercontent.com/HyakkimaruPY/remote-tv/main/version';if(!mgr)return;
function text(e){return e?'falha de transporte ou timeout':'OK';}
mgr.register({id:'network',title:'Conectividade e bridge local',enabled:true,restartRequired:false,test:function(scope,done){var st=new Date().getTime();scope.local('/health',function(e){if(e){done(false,'Bridge '+text(e));return;}scope.fetch(target,function(err){var ms=new Date().getTime()-st;done(!err,err?'Internet indisponível':'Bridge + Internet '+ms+' ms');},6000);},2500);}});
mgr.register({id:'https',title:'HTTPS via bridge',enabled:true,restartRequired:false,test:function(scope,done){var st=new Date().getTime();scope.fetch(target,function(err){var ms=new Date().getTime()-st;done(!err,err?'Falha HTTPS':'HTTPS alcançável '+ms+' ms · certificado não inspecionado');},6500);}});
})(this);
