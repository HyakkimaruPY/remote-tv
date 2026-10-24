/* Philco 6.5.1: detects the vendor QObject bridge without guessing or calling undocumented commands. */
(function(w){'use strict';var R=w.RemoteTV||(w.RemoteTV={}),m=R.libraryManager,candidate=null,name='',methods=['loadPage','unloadPage','forceGC','whoami','Cmd','setGeometry','launchApp','hide','show'];if(!m)return;
function scan(){var k,o,i,n,best=0,count;for(k in w){count=0;try{o=w[k];if(!o||(typeof o!=='object'&&typeof o!=='function'))continue;for(i=0;i<methods.length;i++)if(typeof o[methods[i]]==='function')count++;if(count>best){best=count;candidate=o;name=k;}}catch(e){}}return best;}
function probe(){var n=scan();return {ok:n>=3,reason:n>=3?'vendor QObject bridge':'mstarExt não exposto ao JS'};}
function available(){var a=[],i;if(!candidate)return a;for(i=0;i<methods.length;i++)try{if(typeof candidate[methods[i]]==='function')a.push(methods[i]);}catch(e){}return a;}
function start(){R.vendorBridge651={name:name,methods:available,object:function(){return candidate;}};}
function stop(){R.vendorBridge651=null;}
m.register({id:'vendor-bridge',title:'Ponte nativa MStar · detectada',category:'injection',enabled:false,restartRequired:false,probe:probe,start:start,stop:stop,
 test:function(scope,done){var a=available();done(a.length>=3,'Objeto '+name+' · '+a.join(', ')+' · nenhum comando nativo executado pelo teste');}});
}(this));
