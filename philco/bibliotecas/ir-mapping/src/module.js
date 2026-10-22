/* IR key learner for firmware variants where RED is not 403. No permanent global key suppression. */
(function(w,d){'use strict';var R=w.RemoteTV||(w.RemoteTV={}),m=R.libraryManager,KEY='philco.redmap.642';
var red=403,armed=false,last=0,waitTimer=0,cb=null,active=true;
try{var n=parseInt(w.localStorage.getItem(KEY)||'403',10);if(n>0&&n<65536)red=n;}catch(e){}
function blocked(code){return code===13||code===41||code===8||code===27||code===461||code===462||code===528||code===10009||code>=37&&code<=40;}
function route(e){if(!e||!active)return;var code=e.keyCode||e.which||0,now=new Date().getTime();
 if(armed){if(!code||blocked(code))return;armed=false;clearTimeout(waitTimer);red=code;
  try{w.localStorage.setItem(KEY,String(code));}catch(x){}
  if(cb)cb(true,'Botão identificado como código '+code+'; use o vermelho novamente para abrir busca');
  return;
 }
 if(code!==red||red===403||!code||blocked(code)||now-last<300)return;
 if(e._philcoRed642)return;
 if(R.libraryManager&&R.libraryManager.isOpen&&R.libraryManager.isOpen())return;
 last=now;
 if(e.preventDefault)e.preventDefault();if(e.stopImmediatePropagation)e.stopImmediatePropagation();
 try{var v=d.createEvent('Event');v.initEvent('keydown',true,true);v.keyCode=403;v.which=403;v._philcoRed642=1;
 (d.activeElement||d).dispatchEvent(v);}catch(ex){}
}
function test(scope,done){
 if(armed){done(false,'Já aguardando');return;}
 if(!d.addEventListener){done(false,'Eventos remotos indisponíveis');return;}
 cb=done;
 // Starts after activating Testar with OK, preventing the OK event from being learned.
 w.setTimeout(function(){armed=true;waitTimer=w.setTimeout(function(){armed=false;done(false,'Nenhum evento IR recebido. Talvez o firmware não entregue essa tecla ao navegador');},7000);},400);
}
if(d.addEventListener){d.addEventListener('irkeypress',route,true);d.addEventListener('keydown',route,true);}
if(m)m.register({id:'ir-mapping',title:'Mapeamento · botão vermelho',enabled:true,restartRequired:false,
 test:test,start:function(){active=true;},stop:function(){active=false;armed=false;clearTimeout(waitTimer);}});
w.PhilcoRedMap642={code:function(){return red;},cancel:function(){armed=false;clearTimeout(waitTimer);}};
})(this,document);
