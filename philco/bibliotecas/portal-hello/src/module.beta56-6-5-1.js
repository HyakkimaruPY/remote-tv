/* Philco 6.5.1 Portal: reversible Hello World entry in the native CommUI app list. */
(function(w){'use strict';
var R=w.RemoteTV||(w.RemoteTV={}),m=R.libraryManager,p=w.PhilcoPortal651;
if(!m||!p||typeof p.capabilities!=='function')return;
function register(cap,status){
 m.register({
  id:'native-app-hello',
  title:'Hello World · Apps nativos',
  category:'portal',
  enabled:false,
  actualOn:!!(status&&status.installed),
  restartRequired:false,
  probe:function(){return {ok:!!(cap&&cap.helloWorld),reason:'AppMgr + Customer + bigbang'};},
  startAsync:function(done){
   p.enableHello(function(err,data){
    done(!err&&data&&data.installed,err||(!data||!data.installed?'registro não confirmado':'registrado no AppMgr'));
   });
  },
  stopAsync:function(done){
   p.disableHello(function(err,data){
    done(!err&&data&&!data.installed,err||(!data||data.installed?'remoção não confirmada':'removido do AppMgr'));
   });
  },
  test:function(scope,done){
   p.status(function(err,data){
    done(!err&&data&&data.appmgr,'AppMgr '+(data&&data.appmgr?'ativo':'indisponível')+' · Hello World '+(data&&data.installed?'registrado':'não registrado'));
   });
  }
 });
}
p.capabilities(function(err,cap){
 if(err||!cap||!cap.ok||!cap.helloWorld)return;
 p.status(function(statusErr,status){
  if(statusErr||!status)return;
  register(cap,status);
 });
});
}(this));
