/* Philco 6.5.1: bounded storage adapter using Web Storage from QtWebKit 2.2. */
(function(w){'use strict';var R=w.RemoteTV||(w.RemoteTV={}),m=R.libraryManager,NS='rtv651:',MAX=524288;if(!m)return;
function probe(){var k=NS+'probe';try{if(!w.localStorage)return {ok:false,reason:'localStorage ausente'};w.localStorage.setItem(k,'1');w.localStorage.removeItem(k);return {ok:true,reason:'Web Storage'};}catch(e){return {ok:false,reason:'storage bloqueado'};}}
function size(){var i,k,n=0;try{for(i=0;i<w.localStorage.length;i++){k=w.localStorage.key(i);if(k&&k.indexOf(NS)===0)n+=k.length+String(w.localStorage.getItem(k)||'').length;}}catch(e){}return n*2;}
function set(k,v){var raw=JSON.stringify(v),before=size();if(before+raw.length*2>MAX)return false;try{w.localStorage.setItem(NS+k,raw);return true;}catch(e){return false;}}
function get(k,fallback){try{var v=w.localStorage.getItem(NS+k);return v==null?fallback:JSON.parse(v);}catch(e){return fallback;}}
function remove(k){try{w.localStorage.removeItem(NS+k);}catch(e){}}
function start(){R.offlineStore651={set:set,get:get,remove:remove,size:size,limit:MAX,webSql:!!w.openDatabase,appCache:!!w.applicationCache};}
function stop(){R.offlineStore651=null;}
m.register({id:'offline-store',title:'Storage WebKit · cache limitado',category:'injection',enabled:true,restartRequired:false,probe:probe,start:start,stop:stop,
 test:function(scope,done){var ok=set('selftest',{ok:1});var v=get('selftest',null);remove('selftest');done(!!(ok&&v&&v.ok===1),'Web Storage · teto próprio 512 KB · WebSQL '+(w.openDatabase?'presente':'ausente')+' · AppCache '+(w.applicationCache?'presente':'ausente'));}});
}(this));
