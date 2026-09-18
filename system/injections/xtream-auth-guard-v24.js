(function(w){'use strict';
var X=w.XT10,R=w.RemoteTV||(w.RemoteTV={});if(!X||X._authGuard24)return;X._authGuard24=1;
var oc=X.cats,oi=X.items,ov=X.vod,os=X.series,busy=0,q=[];
function flush(e){var a=q.slice(0),i;q=[];busy=0;for(i=0;i<a.length;i++)try{a[i](e)}catch(y){X.log('AUTH24','callback erro · '+y)}}
function ensure(cb,why){
  if(X.state&&X.state.c&&why!='open'){X.log('AUTH24','credenciais presentes · '+(why||'op'));cb(null);return}if(why=='open'&&X.state&&X.state.c)X.log('AUTH24','abertura do player · revalidando CONFIG/DNS no GitHub')
  q.push(cb);if(busy){X.log('AUTH24','aguardando autenticação em andamento · '+(why||'op'));return}
  busy=1;X.log('AUTH24','estado sem credenciais · iniciando autenticação · '+(why||'op'));
  X.auth(function(e,meta){
    if(e){X.log('AUTH24','falhou · '+e);flush(e);return}
    X.log('AUTH24','OK · credenciais restauradas');
    flush(null);
  });
}
X.ensureAuth=ensure;
X.cats=function(t,cb){ensure(function(e){if(e){cb(e);return}X.log('FLOW17','cats DISPATCH · '+t);oc(t,cb)},'cats '+t)};
X.items=function(t,c,cb){ensure(function(e){if(e){cb(e);return}X.log('FLOW17','items DISPATCH · '+t+' · category_id='+(c&&c.id));oi(t,c,cb)},'items '+t)};
X.vod=function(o,cb){ensure(function(e){if(e){cb(e);return}ov(o,cb)},'vod')};
X.series=function(o,cb){ensure(function(e){if(e){cb(e);return}os(o,cb)},'series')};
R.authGuard='0.24';X.log('BOOT','Auth guard v0.24 · revalida CONFIG/DNS em toda abertura e auto-recupera estado');
}(this));
