/* Philco 6.5.1: no-image texture/flare layer, capability-gated and removable. */
(function(w,d){'use strict';var R=w.RemoteTV||(w.RemoteTV={}),m=R.libraryManager,STYLE='rtvTextureFx651';if(!m)return;
function gradient(){var s=d.createElement('div').style,v=['-webkit-gradient(linear,left top,right bottom,from(#151515),to(#080808))','-webkit-linear-gradient(135deg,#151515,#080808)','linear-gradient(135deg,#151515,#080808)'],i;for(i=0;i<v.length;i++){s.backgroundImage='';try{s.backgroundImage=v[i];}catch(e){}if(s.backgroundImage)return v[i];}return '';}
function probe(){return {ok:!!gradient(),reason:'gradient CSS suportado'};}
function start(){var s;if(d.getElementById(STYLE))return;s=d.createElement('style');s.id=STYLE;
 s.textContent='#menu.rtv-launcher651 .rtv651tile{background-image:-webkit-gradient(linear,left top,right bottom,from(rgba(255,255,255,.025)),to(rgba(255,255,255,0)))!important}' +
 '#rtv651info{background-image:-webkit-gradient(radial,82% 12%,0,82% 12%,330,from(rgba(255,255,255,.075)),color-stop(.34,rgba(255,255,255,.018)),to(rgba(255,255,255,0)))!important}' +
 '#rtv651info.rtv651show{box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 0 34px rgba(255,255,255,.025)}';
 d.head.appendChild(s);
}
function stop(){var s=d.getElementById(STYLE);if(s&&s.parentNode)s.parentNode.removeChild(s);}
m.register({id:'texture-fx',title:'Texturas e flare · CSS leve',category:'render',enabled:true,restartRequired:false,visualBytes:1572864,probe:probe,start:start,stop:stop,
 test:function(scope,done){done(!!d.getElementById(STYLE),'Gradientes e flare sem PNG extra; custo visual reservado em 1.5 MB');}});
}(this,document));
