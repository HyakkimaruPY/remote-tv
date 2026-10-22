/* Philco Beta 6.4 search opt-in registry; activation requires a player reload. */
(function(w){'use strict';var R=w.RemoteTV||(w.RemoteTV={});if(!R.libraryManager)return;
R.libraryManager.register({id:'search',title:'Busca contextual · vermelho e QR',enabled:false,restartRequired:true,test:function(scope,done){var api=w.PhilcoSearchAdapter,ui=w.PhilcoSearch642;done(!!(api&&ui),api&&ui?'Busca integrada ao Xtream. QR requer servidor pareado.':'Integração indisponível');}});
})(this);
