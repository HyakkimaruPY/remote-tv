/* Passive stream counters and a reversible, next-channel-only routing experiment. */
(function(w){'use strict';var R=w.RemoteTV||(w.RemoteTV={}),m=R.libraryManager;if(!m)return;
m.register({id:'live-health',title:'Live · buffer e relógio',category:'system',actionOnly:true,
 probe:function(){return !!(w.RawPlayer&&w.RawPlayer.diagnostics);},
 test:function(scope,done){var s=w.RawPlayer.diagnostics(),route=R.liveRoute652&&R.liveRoute652.isDirect()?'HLS direto primeiro':'AutoHLS primeiro';
  if(!s.active){done(true,'Sem sessão live ativa · '+route);return;}
  done(true,s.engine+' · esperas '+s.stalls+' · buffer '+Math.round(s.bufferMs/1000)+' s'+(s.buffering?' + espera atual':'')+' · relógio '+(s.clockAvailable?s.clock+' s':'não exposto')+' · '+route);
 }});
m.register({id:'live-direct',title:'Live · comparar HLS direto',category:'system',enabled:false,restartRequired:false,
 probe:function(){return !!R.liveRoute652;},
 start:function(){R.liveRoute652.setDirect(true);},stop:function(){R.liveRoute652.setDirect(false);},
 test:function(scope,done){done(true,(R.liveRoute652.isDirect()?'HLS direto':'AutoHLS')+' primeiro na próxima abertura de canal · não reinicia a reprodução atual');}});
}(this));
