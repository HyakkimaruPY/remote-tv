/* Philco 6.5.1: localhost library exists only after the native service answers /health. */
(function(w){'use strict';
var R=w.RemoteTV||(w.RemoteTV={}),m=R.libraryManager,api=w.PhilcoLocalhost651||w.PhilcoLocalhost642;
if(!m||!api||typeof api.health!=='function')return;
api.health(function(err,data){
 if(err||!data||!data.ok)return;
 m.register({
  id:'localhost',
  title:'Celular e QR · ponte local',
  category:'portal',
  enabled:true,
  restartRequired:false,
  probe:function(){return {ok:true,reason:'health confirmado'};},
  test:function(scope,done){
   api.health(function(e,d){done(!e&&d&&d.ok,e?'Serviço local indisponível':'Serviço local ativo'+(d&&d.portal?' · Portal disponível':''));});
  }
 });
});
}(this));
