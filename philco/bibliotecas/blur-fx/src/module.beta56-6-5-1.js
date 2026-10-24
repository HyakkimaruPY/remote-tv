/* Philco 6.5.1: blur is shown only when the firmware actually exposes a filter property. */
(function(w,d){'use strict';var R=w.RemoteTV||(w.RemoteTV={}),m=R.libraryManager,STYLE='rtvBlurFx651',LAYER='rtv651blurLayer';if(!m)return;
function filterProp(){var s=d.createElement('div').style;return 'webkitFilter' in s?'webkitFilter':('filter' in s?'filter':'');}
function probe(){return {ok:!!filterProp(),reason:'CSS filter/blur'};}
function start(){var box=d.getElementById('rtv651info'),layer,s,p=filterProp();if(!box||!p)throw Error('blur unsupported');
 if(!d.getElementById(LAYER)){layer=d.createElement('div');layer.id=LAYER;box.insertBefore(layer,box.firstChild||null);}
 s=d.getElementById(STYLE);if(!s){s=d.createElement('style');s.id=STYLE;s.textContent='#rtv651blurLayer{position:absolute;left:62px;top:70px;width:280px;height:180px;border-radius:140px;background:rgba(255,255,255,.05);z-index:0;pointer-events:none}#rtv651info .rtv651infoKicker,#rtv651info h2,#rtv651info p,#rtv651info .rtv651hint{position:relative;z-index:2}';d.head.appendChild(s);}
 layer=d.getElementById(LAYER);layer.style[p]='blur(18px)';
}
function stop(){var s=d.getElementById(STYLE),layer=d.getElementById(LAYER);if(s&&s.parentNode)s.parentNode.removeChild(s);if(layer&&layer.parentNode)layer.parentNode.removeChild(layer);}
m.register({id:'blur-fx',title:'Blur de superfície · compatível',category:'render',enabled:true,restartRequired:false,visualBytes:1048576,probe:probe,start:start,stop:stop,
 test:function(scope,done){done(!!d.getElementById(LAYER),'Blur isolado em uma superfície pequena; custo visual reservado em 1.0 MB');}});
}(this,document));
