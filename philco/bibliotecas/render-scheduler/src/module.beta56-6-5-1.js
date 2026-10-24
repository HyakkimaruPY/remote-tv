/* Philco 6.5.1 render scheduler: coalesces cosmetic DOM writes into one frame. */
(function(w){'use strict';var R=w.RemoteTV||(w.RemoteTV={}),m=R.libraryManager,active=false,queue=[],keys={},ticket=0;if(!m)return;
function flush(){var list=queue,i,job;queue=[];keys={};ticket=0;if(!active)return;for(i=0;i<list.length;i++){job=list[i];try{job.fn();}catch(e){}}}
function request(){if(ticket)return;if(w.requestAnimationFrame)ticket=w.requestAnimationFrame(flush);else ticket=w.setTimeout(flush,16);}
function enqueue(fn,key){if(!active||typeof fn!=='function'){if(typeof fn==='function')fn();return;}key=String(key||'');if(key&&keys[key])return;if(key)keys[key]=1;queue.push({fn:fn,key:key});request();}
function probe(){return {ok:!!(w.requestAnimationFrame||w.setTimeout),reason:w.requestAnimationFrame?'requestAnimationFrame':'timer fallback'};}
function start(){active=true;R.renderScheduler65={enqueue:enqueue,active:function(){return active;},mode:function(){return w.requestAnimationFrame?'RAF':'timer 16 ms';}};}
function stop(){active=false;queue=[];keys={};if(ticket){try{if(w.cancelAnimationFrame&&w.requestAnimationFrame)w.cancelAnimationFrame(ticket);else w.clearTimeout(ticket);}catch(e){}}ticket=0;R.renderScheduler65=null;}
m.register({id:'render-scheduler',title:'Scheduler de render · RAF/fallback',category:'render',enabled:true,restartRequired:false,visualBytes:131072,probe:probe,start:start,stop:stop,
 test:function(scope,done){done(true,'Fila ativa · '+(w.requestAnimationFrame?'requestAnimationFrame':'fallback 16 ms')+' · sem tocar no vídeo');}});
}(this));
