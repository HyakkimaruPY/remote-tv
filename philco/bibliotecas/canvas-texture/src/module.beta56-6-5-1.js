/* Philco 6.5.1: small Canvas2D texture surfaces, generated only on demand. */
(function(w,d){'use strict';var R=w.RemoteTV||(w.RemoteTV={}),m=R.libraryManager;if(!m)return;
function probe(){var c=d.createElement('canvas'),x=null;try{x=c.getContext&&c.getContext('2d');}catch(e){}return {ok:!!x,reason:'Canvas 2D'};}
function start(){R.canvasTexture651={create:function(width,height,paint){var c=d.createElement('canvas'),x;c.width=Math.min(384,Math.max(1,width|0));c.height=Math.min(384,Math.max(1,height|0));x=c.getContext('2d');if(typeof paint==='function')paint(x,c.width,c.height);return c;}};}
function stop(){R.canvasTexture651=null;}
m.register({id:'canvas-texture',title:'Texturas Canvas2D · sob demanda',category:'render',enabled:false,restartRequired:false,visualBytes:1572864,probe:probe,start:start,stop:stop,
 test:function(scope,done){var c=R.canvasTexture651&&R.canvasTexture651.create(16,16,function(x){x.fillStyle='#111';x.fillRect(0,0,16,16);});done(!!(c&&c.width===16),'Canvas pequeno e descartável · máximo 384×384 · 1.5 MB reservados');}});
}(this,document));
