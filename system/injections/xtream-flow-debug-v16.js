(function(w){'use strict';
var X=w.XT10,R=w.RemoteTV||(w.RemoteTV={});if(!X||X._flow16)return;X._flow16=1;
var oi=X.items,oc=X.cats,ov=X.vod,os=X.series;
X.cats=function(t,cb){var st=(new Date()).getTime();X.log('FLOW16','cats ENTER · '+t);return oc(t,function(e,a){X.log('FLOW16','cats EXIT · '+t+' · '+(e?e:((a||[]).length+' categorias'))+' · '+((new Date()).getTime()-st)+' ms');cb(e,a)})};
X.items=function(t,c,cb){var st=(new Date()).getTime(),id=c&&c.id;X.log('FLOW16','items ENTER · '+t+' · category_id='+id);return oi(t,c,function(e,a){X.log('FLOW16','items EXIT · '+t+' · category_id='+id+' · '+(e?e:((a||[]).length+' itens'))+' · '+((new Date()).getTime()-st)+' ms');cb(e,a)})};
X.vod=function(o,cb){X.log('FLOW16','vod ENTER · id='+(o&&o.id));return ov(o,cb)};
X.series=function(o,cb){X.log('FLOW16','series ENTER · id='+(o&&o.id));return os(o,cb)};
R.flowDebug='0.16';X.log('BOOT','Flow debug v0.16 · wrapper passivo sobre core estável 0.10');
}(this));
