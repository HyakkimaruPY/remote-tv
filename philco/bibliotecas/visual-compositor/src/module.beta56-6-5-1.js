/* Philco 6.5.1: compositor tuned to QtWebKit accelerated transform/opacity paths. */
(function(w,d){'use strict';var R=w.RemoteTV||(w.RemoteTV={}),m=R.libraryManager,STYLE='rtvVisualCompositor651';if(!m)return;
function prop(list){var s=d.createElement('div').style,i;for(i=0;i<list.length;i++)if(list[i] in s)return true;return false;}
function probe(){return {ok:prop(['webkitTransform','transform'])&&prop(['webkitTransition','transition']),reason:'transform + transition'};}
function start(){var s;if(d.getElementById(STYLE))return;s=d.createElement('style');s.id=STYLE;
 s.textContent='.rtv651-motion #rtv651info{-webkit-transition:opacity 90ms linear,-webkit-transform 90ms ease-out;transition:opacity 90ms linear,transform 90ms ease-out;-webkit-transform:translate3d(10px,0,0);transform:translate3d(10px,0,0)}' +
 '.rtv651-motion #rtv651info.rtv651show{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}' +
 '.rtv651-motion #menu.rtv-launcher651 .rtv651tile{-webkit-transition:opacity 70ms linear,-webkit-transform 70ms ease-out;transition:opacity 70ms linear,transform 70ms ease-out}' +
 '.rtv651-motion #menu.rtv-launcher651 .rtv651tile:focus{-webkit-transform:translate3d(3px,0,0);transform:translate3d(3px,0,0)}';
 d.head.appendChild(s);if((' '+d.documentElement.className+' ').indexOf(' rtv651-motion ')<0)d.documentElement.className+=' rtv651-motion';}
function stop(){var s=d.getElementById(STYLE);if(s&&s.parentNode)s.parentNode.removeChild(s);d.documentElement.className=d.documentElement.className.replace(/(?:^|\s)rtv651-motion(?=\s|$)/g,'').replace(/^\s+|\s+$/g,'');}
m.register({id:'visual-compositor',title:'Compositor · transform e opacity',category:'render',enabled:true,restartRequired:false,visualBytes:786432,probe:probe,start:start,stop:stop,
 test:function(scope,done){done(!!d.getElementById(STYLE),'Somente transform/opacity animados; evita relayout por frame');}});
}(this,document));
