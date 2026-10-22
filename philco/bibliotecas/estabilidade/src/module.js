/* Philco Beta 6.4 passive watchdog; never stops, restarts or re-routes playback. */
(function(w){'use strict';var R=w.RemoteTV||(w.RemoteTV={}),timer=0,last=0,delays=0,largest=0;
function start(){if(timer)return;last=new Date().getTime();timer=w.setInterval(function(){var now=new Date().getTime(),late=Math.max(0,now-last-15000);last=now;if(late>2500){delays++;largest=Math.max(largest,late);} },15000);}
function stop(){if(timer)w.clearInterval(timer);timer=0;}
if(R.libraryManager)R.libraryManager.register({id:'estabilidade',title:'Watchdog de lentidão (passivo)',enabled:false,restartRequired:false,start:start,stop:stop,test:function(scope,done){var score=R.libraryManager.quality(delays,0,largest);done(true,'Atrasos '+delays+' · maior '+largest+' ms · qualidade '+score+' (sem reiniciar streams)');}});
})(this);
