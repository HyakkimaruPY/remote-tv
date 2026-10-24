/* Philco 6.5.1: small ES5 bridge for modern UI patterns without replacing QtWebKit. */
(function(w,d){'use strict';var R=w.RemoteTV||(w.RemoteTV={}),m=R.libraryManager;if(!m)return;
function prop(list){var s=d.createElement('div').style,i;for(i=0;i<list.length;i++)if(list[i] in s)return list[i];return '';}
function probe(){return {ok:!!(d.querySelector&&d.addEventListener&&prop(['webkitTransform','transform'])),reason:'DOM events + transform'};}
function start(){var transform=prop(['webkitTransform','transform']);
 R.uiCompat651={raf:function(fn){return w.requestAnimationFrame?w.requestAnimationFrame(fn):w.setTimeout(fn,16);},
 className:function(n,name,on){var c=' '+String(n.className||'')+' ',t=' '+name+' ';if(on&&c.indexOf(t)<0)c+=name+' ';if(!on)while(c.indexOf(t)>=0)c=c.replace(t,' ');n.className=c.replace(/^\s+|\s+$/g,'');},
 transform:function(n,value){if(n&&transform)n.style[transform]=value;},transformProperty:transform};
}
function stop(){R.uiCompat651=null;}
m.register({id:'modern-ui',title:'Compatibilidade UI moderna · ES5',category:'injection',enabled:true,restartRequired:false,visualBytes:262144,probe:probe,start:start,stop:stop,
 test:function(scope,done){done(!!R.uiCompat651,'DOM em lotes, classes e transforms com fallback para o QtWebKit antigo');}});
}(this,document));
