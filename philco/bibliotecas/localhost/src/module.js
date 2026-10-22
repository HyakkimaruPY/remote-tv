/* Localhost companion, opt-in. No network activity on startup. */
(function(w){'use strict';var R=w.RemoteTV||(w.RemoteTV={}),m=R.libraryManager;
if(!m)return;
m.register({id:'localhost',title:'QR local automático · uso único',enabled:true,restartRequired:false,
 test:function(scope,done){if(!w.PhilcoLocalhost642){done(false,'Cliente local ausente');return;}
 w.PhilcoLocalhost642.health(function(err,data){done(!err&&data&&data.ok,err?'Serviço nativo não instalado; TV continua normal':'Serviço LAN ativo');});}});
})(this);
