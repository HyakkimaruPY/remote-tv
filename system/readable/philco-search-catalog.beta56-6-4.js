/* Philco Beta 6.4: bounded category-scoped Xtream search, never issues global get_*_streams. ES5. */
(function(w){'use strict';
var current=null,seq=0;
function fold(x){x=String(x||'').toLowerCase();return x.replace(/[áàâãä]/g,'a').replace(/[éêèë]/g,'e').replace(/[íìîï]/g,'i').replace(/[óòôõö]/g,'o').replace(/[úùûü]/g,'u').replace(/[ç]/g,'c');}
function action(t){return t==='c'?'get_live_streams':t==='m'?'get_vod_streams':'get_series';}
function normalize(t,o,cat){
 var id=t==='s'?o.series_id:o.stream_id;
 if(id===undefined||id===null)return null;
 return {t:t,id:id,n:o.name||'',p:o.stream_icon||o.cover||'',ext:o.container_extension||'',
  y:o.year||o.releaseDate||'',r:o.rating||'',ds:o.plot||'',_catId64:String(cat.id),_catName64:cat.n||''};
}
function stop(){if(current){current.stopped=true;clearTimeout(current.timer);try{current.scope.cancel();}catch(e){}}current=null;seq++;}
function search(t,q,cb,visible){
 stop();var my=seq,key=fold(q).replace(/^\s+|\s+$/g,''),core=w.XT10,state=core&&core.state,cred=state&&state.c;
 var results=[],seen={},cats=state&&state.cats&&state.cats[t]||[],i,j,s,c,idx=0,started=new Date().getTime();
 function emit(done,message){if(my!==seq)return;cb(results.slice(0),!!done,message||'');}
 if(key.length<2){
  visible=visible||[];for(i=0;i<visible.length&&results.length<18;i++){if(visible[i]&&visible[i].n)results.push(visible[i]);}
  emit(true,key?'Digite pelo menos duas letras':'Digite o título para buscar nas categorias');return {cancel:stop};
 }
 if(!cred||!cats.length||!w.RemoteTV||!w.RemoteTV.RequestScope){emit(true,'Catálogo ainda não autenticado');return {cancel:stop};}
 var task={scope:new w.RemoteTV.RequestScope(),stopped:false,timer:0};current=task;
 var catList=cats.slice(0);
 // Start with the category that is already in memory when possible, followed by the remaining categories.
 if(state.cat){for(i=0;i<catList.length;i++)if(String(catList[i].id)===String(state.cat.id)){c=catList.splice(i,1)[0];catList.unshift(c);break;}}
 function walk(){
  if(task.stopped||my!==seq)return;
  if(results.length>=60||idx>=catList.length||new Date().getTime()-started>60000){
   emit(true,idx<catList.length?'Busca parcial; refinando o nome é mais rápido':'');current=null;return;
  }
  var cat=catList[idx++];if(!cat||!cat.id){task.timer=setTimeout(walk,0);return;}
  var u=cred.d+'/player_api.php?username='+encodeURIComponent(cred.u)+'&password='+encodeURIComponent(cred.p)+'&action='+action(t)+'&category_id='+encodeURIComponent(cat.id);
  task.scope.fetch(u,function(err,body){
   if(task.stopped||my!==seq)return;
   if(!err){var raw;try{raw=JSON.parse(body);}catch(e){raw=null;}
    if(Object.prototype.toString.call(raw)==='[object Array]'){
     for(j=0;j<raw.length;j++){s=raw[j];if(!s||!s.name||fold(s.name).indexOf(key)<0)continue;
      var o=normalize(t,s,cat);if(o&&!seen[String(o.id)]){seen[String(o.id)]=true;results.push(o);if(results.length>=60)break;}
     }
    }
   }
   if(results.length)emit(false,idx+'/'+catList.length+' categorias');
   task.timer=setTimeout(walk,30);
  },9000);
 }
 walk();return {cancel:function(){if(current===task)stop();}};
}
w.PhilcoSearchCatalog64={search:search,cancel:stop};
})(this);
