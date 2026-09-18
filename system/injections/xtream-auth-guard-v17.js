(function(w){'use strict';
var X=w.XT10,R=w.RemoteTV||(w.RemoteTV={});if(!X||X._authGuard17)return;X._authGuard17=1;
var oc=X.cats,oi=X.items,ov=X.vod,os=X.series,busy=0,q=[];
function flush(e){var a=q.slice(0),i;q=[];busy=0;for(i=0;i<a.length;i++)try{a[i](e)}catch(y){X.log('AUTH17','callback erro · '+y)}}
function ensure(cb,why){
  if(X.state&&X.state.c){X.log('AUTH17','credenciais presentes · '+(why||'op'));cb(null);return}
  q.push(cb);if(busy){X.log('AUTH17','aguardando autenticação em andamento · '+(why||'op'));return}
  busy=1;X.log('AUTH17','estado sem credenciais · iniciando autenticação · '+(why||'op'));
  X.auth(function(e,meta){
    if(e){X.log('AUTH17','falhou · '+e);flush(e);return}
    X.log('AUTH17','OK · credenciais restauradas');
    flush(null);
  });
}
X.ensureAuth=ensure;
X.cats=function(t,cb){ensure(function(e){if(e){cb(e);return}X.log('FLOW17','cats DISPATCH · '+t);oc(t,cb)},'cats '+t)};
X.items=function(t,c,cb){ensure(function(e){if(e){cb(e);return}X.log('FLOW17','items DISPATCH · '+t+' · category_id='+(c&&c.id));oi(t,c,cb)},'items '+t)};
X.vod=function(o,cb){ensure(function(e){if(e){cb(e);return}ov(o,cb)},'vod')};
X.series=function(o,cb){ensure(function(e){if(e){cb(e);return}os(o,cb)},'series')};
R.authGuard='0.17';X.log('BOOT','Auth guard v0.17 · auto-recupera credenciais antes de qualquer catálogo');
}(this));
