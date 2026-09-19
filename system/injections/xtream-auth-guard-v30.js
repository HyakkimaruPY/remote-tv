(function(w){'use strict';
var X=w.XT10,R=w.RemoteTV||(w.RemoteTV={});if(!X||X._authGuard30)return;X._authGuard30=1;
var oc=X.cats,oi=X.items,ov=X.vod,os=X.series,busy=0,q=[];
function flush(e){var a=q.slice(0),i;q=[];busy=0;for(i=0;i<a.length;i++)try{a[i](e)}catch(y){X.log('AUTH30','callback erro · '+y)}}
function ensure(cb,why){var prior=X.state&&X.state.c?{d:X.state.c.d,u:X.state.c.u,p:X.state.c.p}:null,transient;
  if(X.state&&X.state.c&&why!='open'){X.log('AUTH30','credenciais presentes · '+(why||'op'));cb(null);return}
  if(why=='open'&&prior)X.log('AUTH30','abertura do player · revalidando CONFIG/DNS');
  q.push(cb);if(busy){X.log('AUTH30','aguardando autenticação em andamento · '+(why||'op'));return}
  busy=1;X.log('AUTH30','iniciando autenticação · '+(why||'op'));
  X.auth(function(e,meta){
    if(e){transient=/HTTP 200 vazio|Timeout|HTTP 5\d\d|Falha|JSON inválido/i.test(String(e));if(prior&&why=='open'&&transient){X.state.c=prior;X.log('AUTH30','revalidação transitória falhou · mantendo sessão anterior · '+e);flush(null);return}X.log('AUTH30','falhou · '+e);flush(e);return}
    X.log('AUTH30','OK · credenciais restauradas/revalidadas');flush(null);
  });
}
X.ensureAuth=ensure;
X.cats=function(t,cb){ensure(function(e){if(e){cb(e);return}X.log('FLOW17','cats DISPATCH · '+t);oc(t,cb)},'cats '+t)};
X.items=function(t,c,cb){ensure(function(e){if(e){cb(e);return}X.log('FLOW17','items DISPATCH · '+t+' · category_id='+(c&&c.id));oi(t,c,cb)},'items '+t)};
X.vod=function(o,cb){ensure(function(e){if(e){cb(e);return}ov(o,cb)},'vod')};
X.series=function(o,cb){ensure(function(e){if(e){cb(e);return}os(o,cb)},'series')};
R.authGuard='0.30';X.log('BOOT','Auth guard v0.30 · revalida CONFIG/DNS · preserva sessão válida em falha transitória');
}(this));
