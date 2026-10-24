/* Philco 6.5.1: optional WebGL surface; hidden when the stock GL path cannot create a context. */
(function(w,d){'use strict';var R=w.RemoteTV||(w.RemoteTV={}),m=R.libraryManager;if(!m)return;
function context(c){var gl=null;try{gl=c.getContext('webgl')||c.getContext('experimental-webgl');}catch(e){}return gl;}
function probe(){var c=d.createElement('canvas');c.width=8;c.height=8;return {ok:!!context(c),reason:'WebGL context'};}
function start(){R.webglSurface651={create:function(width,height){var c=d.createElement('canvas');c.width=Math.min(512,Math.max(1,width|0));c.height=Math.min(512,Math.max(1,height|0));var gl=context(c);return gl?{canvas:c,gl:gl}:null;}};}
function stop(){R.webglSurface651=null;}
m.register({id:'webgl-surface',title:'Superfície WebGL · experimental',category:'render',enabled:false,restartRequired:false,visualBytes:3145728,probe:probe,start:start,stop:stop,
 test:function(scope,done){var s=R.webglSurface651&&R.webglSurface651.create(16,16);done(!!s,'Contexto WebGL real · limite de superfície 512×512 · 3 MB reservados');}});
}(this,document));
