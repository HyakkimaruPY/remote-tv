/* Philco 6.5.1: blur is shown only when the firmware actually exposes a filter property. */
(function(w,d){'use strict';var R=w.RemoteTV||(w.RemoteTV={}),m=R.libraryManager,STYLE='rtvBlurFx651',LAYER='rtv651blurLayer';if(!m)return;
function filterProp(){var s=d.createElement('div').style;return 'webkitFilter' in s?'webkitFilter':('filter' in s?'filter':'');}
function probe(){return {ok:!!filterProp(),reason:'CSS filter/blur'};}
function start(){var menu=d.getElementById('menu'),layer,s,p=filterProp();if(!menu||!p)throw Error('blur unsupported');
 if(!d.getElementById(LAYER)){layer=d.createElement('div');layer.id=LAYER;menu.insertBefore(layer,d.getElementById('rtv651info')||null);}
 s=d.getElementById(STYLE);if(!s){s=d.createElement('style');s.id=STYLE;s.textContent='#rtv651blurLayer{position:absolute;left:842px;top:205px;width:310px;height:210px;border-radius:140px;background:rgba(255,255,255,.045);visibility:hidden;z-index:1;pointer-events:none}#menu.rtv-launcher651 #rtv651info{z-index:2}#menu.rtv-launcher651 #rtv651info.rtv651show~#never{display:none}';d.head.appendChild(s);}
 layer=d.getElementById(LAYER);layer.style[p]='blur(18px)';layer.style.visibility='visible';
}
function stop(){var s=d.getElementById(STYLE),layer=d.getElementById(LAYER);if(s&&s.parentNode)s.parentNode.removeChild(s);if(layer&&layer.parentNode)layer.parentNode.removeChild(layer);}
m.register({id:'blur-fx',title:'Blur de superfície · compatível',category:'render',enabled:true,restartRequired:false,visualBytes:1048576,probe:probe,start:start,stop:stop,
 test:function(scope,done){done(!!d.getElementById(LAYER),'Blur isolado em uma superfície pequena; custo visual reservado em 1.0 MB');}});
}(this,document));
