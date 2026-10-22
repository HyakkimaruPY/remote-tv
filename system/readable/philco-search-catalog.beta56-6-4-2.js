/* Philco 6.4.2 - API-first tab-wide search with time-sliced JSON object scanning. ES5. */
(function(w){'use strict';
var current=null,serial=0;
function fold(x){return String(x||'').toLowerCase().replace(/[áàâãä]/g,'a').replace(/[éêèë]/g,'e').replace(/[íìîï]/g,'i').replace(/[óòôõö]/g,'o').replace(/[úùûü]/g,'u').replace(/ç/g,'c');}
function action(t){return t==='c'?'get_live_streams':t==='m'?'get_vod_streams':'get_series';}
function normal(t,o,cat){
 var id=t==='s'?o.series_id:o.stream_id;
 if(id===undefined||id===null)return null;
 return {t:t,id:id,n:o.name||'',p:o.stream_icon||o.cover||'',ext:o.container_extension||'',
  y:o.year||o.releaseDate||'',r:o.rating||'',ds:o.plot||'',_catId64:String(cat.id),_catName64:cat.n||''};
}
function cancel(){serial++;if(current){current.dead=true;if(current.timer)clearTimeout(current.timer);if(current.scope)current.scope.cancel();current.body=null;}current=null;}
function search(t,q,cb){
 cancel();
 var id=serial,needle=fold(q).replace(/^\s+|\s+$/g,''),core=w.XT10,st=core&&core.state,cats=st&&st.cats&&st.cats[t],
     cred=st&&st.c,found=[],seen={},index=0,start=new Date().getTime(),errors=0;
 if(needle.length<3){cb([],true,'Digite no mínimo 3 letras');return {cancel:cancel};}
 if(!cats||!cats.length||!cred||!w.RemoteTV||!w.RemoteTV.RequestScope){cb([],true,'Catálogo indisponível');return {cancel:cancel};}
 // Browsing an entire tab is required: category_id remains mandatory on every Xtream request.
 var task={dead:false,scope:new w.RemoteTV.RequestScope(),timer:0,body:null};current=task;
 var list=cats.slice(0),lastEmit=0,maxResults=84,maxTime=60000;
 function valid(){return !task.dead&&current===task&&serial===id;}
 function emit(done,msg){if(!valid())return;cb(found.slice(0),!!done,msg||'');lastEmit=new Date().getTime();}
 function finish(note){if(!valid())return;emit(true,note||'');task.body=null;current=null;}
 function next(){
  if(!valid())return;
  if(index>=list.length||found.length>=maxResults||new Date().getTime()-start>maxTime) {
   finish(index<list.length?'Busca parcial · refine o título':'Busca concluída'+(errors?' · '+errors+' categorias indisponíveis':''));return;
  }
  var cat=list[index++];if(!cat||cat.id===undefined){task.timer=setTimeout(next,0);return;}
  var url=cred.d+'/player_api.php?username='+encodeURIComponent(cred.u)+'&password='+encodeURIComponent(cred.p)+
    '&action='+action(t)+'&category_id='+encodeURIComponent(cat.id);
  task.scope.fetch(url,function(err,body){
   if(!valid())return;
   if(err||!body||body.length>10000000){errors++;task.timer=setTimeout(next,50);return;}
   task.body=body;
   var pos=0,depth=0,objStart=-1,inStr=false,escaped=false,matched=0;
   function scan(){
    if(!valid())return;
    var payload=task.body,stop=Math.min(payload.length,pos+14000),ch,o,k;
    for(;pos<stop;pos++){
     ch=payload.charAt(pos);
     if(inStr){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch==='"')inStr=false;continue;}
     if(ch==='"'){inStr=true;continue;}
     if(ch==='{'){if(depth===0)objStart=pos;depth++;continue;}
     if(ch==='}'&&depth>0){
      depth--;
      if(depth===0&&objStart>=0){
       try{o=JSON.parse(payload.slice(objStart,pos+1));}catch(e){o=null;}
       objStart=-1;
       if(o&&o.name&&fold(o.name).indexOf(needle)>=0){
        k=normal(t,o,cat);if(k&&!seen[String(k.id)]){seen[String(k.id)]=1;found.push(k);matched++;}
       }
       if(found.length>=maxResults)break;
      }
     }
    }
    if(pos>=payload.length||found.length>=maxResults) {
     task.body=null;
     if(matched||new Date().getTime()-lastEmit>1800)emit(false,'Categorias '+index+'/'+list.length);
     task.timer=setTimeout(next,20);
    }else task.timer=setTimeout(scan,0);
   }
   scan();
  },10000);
 }
 emit(false,'Pesquisando '+list.length+' categorias');
 next();
 return {cancel:function(){if(current===task)cancel();}};
}
w.PhilcoSearchCatalog642={search:search,cancel:cancel};
})(this);
