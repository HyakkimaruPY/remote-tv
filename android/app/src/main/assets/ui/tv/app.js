(()=>{'use strict';
const $=id=>document.getElementById(id),native=window.Native;
const state={selected:0,profiles:[],kind:'xtream',type:'live',category:'',epoch:0,returnFocus:null};
const pending=new Map();let sequence=0,toastTimer=0;
function notice(text){const el=$('toast');el.textContent=String(text||'');el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),4700);}
function safeResult(result){try{return JSON.parse(result)}catch{return {ok:false,error:'Resposta interna inválida'}}}
function invoke(operation,payload){return new Promise((resolve,reject)=>{
  const id='t'+(++sequence),timer=setTimeout(()=>{pending.delete(id);reject(new Error('Tempo excedido'))},40000);
  pending.set(id,result=>{clearTimeout(timer);resolve(result)});
  try{native.request(id,operation,JSON.stringify(payload||{}))}catch(e){clearTimeout(timer);pending.delete(id);reject(e)}
})}
const Aura=window.Aura={
  onResult(id,data){const fn=pending.get(id);if(fn){pending.delete(id);fn(data)}},
  back(){if(!$('detail').hidden){$('detail').hidden=true;return}if(!$('panel').hidden){closePanel();return}if(!$('login').hidden){refresh();return}$('profileBtn').focus()},
};
function requireOk(result){if(!result||result.ok===false)throw new Error(result?.error||'Falha ao carregar dados');return result}
function dateStamp(ts){if(!ts)return 'Sem expiração informada';return 'Expira em '+new Date(Number(ts)*1000).toLocaleDateString('pt-BR')}
function presentLogin(){state.epoch++;$('login').hidden=false;$('main').hidden=true;$('panel').hidden=true;$('detail').hidden=true;setTimeout(()=>$('profileName').focus(),50)}
function presentMain(){ $('login').hidden=true;$('main').hidden=false;$('panel').hidden=true;$('detail').hidden=true;}
function refresh(){const result=safeResult(native.profiles());if(!result.ok){notice(result.error);return}
  state.profiles=result.list||[];state.selected=result.selected||0;
  const active=state.profiles.find(p=>p.id===state.selected);state.kind=active?.kind||'xtream';
  if(result.expiredName)notice('Sua lista "'+result.expiredName+'" expirou. Remova ou atualize as informações.');
  if(!active){presentLogin();return}
  presentMain();$('listLabel').textContent=active.name;
  $('subtitle').textContent=active.name;$('greeting').textContent='O que vamos assistir?';
  $('tabs').querySelectorAll('[data-type]').forEach(b=>b.hidden=state.kind==='m3u'&&b.dataset.type!=='live');
  if(state.kind==='m3u')state.type='live';
  showRecents(result.recent||[]);switchType(state.type);
}
function showRecents(items){$('recentSection').hidden=!items.length;const root=$('recent');root.replaceChildren();
  for(const item of items){const b=document.createElement('button');b.textContent='▶ '+item.title;
    b.addEventListener('click',()=>{const ix=item.key.indexOf(':'),type=item.key.slice(0,ix),id=item.key.slice(ix+1);if(ix<0)return;
      startVideo({id,type,ext:type==='live'?'m3u8':'mp4',title:item.title});});root.append(b)}
}
async function switchType(type){state.type=type;const epoch=++state.epoch;$('tabs').querySelectorAll('[data-type]').forEach(b=>b.classList.toggle('active',b.dataset.type===type));
 $('categories').replaceChildren();$('grid').replaceChildren();$('categoryTitle').textContent='Carregando categorias…';$('contentTitle').textContent='Conteúdos';$('count').textContent='';
 try{const res=requireOk(await invoke('catalog',{profile:state.selected,op:'categories',type}));if(epoch!==state.epoch)return;
   const cats=res.items||[];$('categoryTitle').textContent='Categorias';
   for(const c of cats){const id=String(c.category_id??''),label=String(c.category_name||'Outros');const b=document.createElement('button');b.className='chip';b.textContent=label;
     b.addEventListener('click',()=>openCategory(id,label));$('categories').append(b)}
   if(cats.length)openCategory(String(cats[0].category_id),cats[0].category_name||'Outros');else $('status').textContent='Nenhuma categoria disponível';
 }catch(e){if(epoch===state.epoch){$('categoryTitle').textContent='Sem categorias';notice(e.message)}}
}
async function openCategory(category,title){const epoch=++state.epoch;state.category=category;
 $('categories').querySelectorAll('button').forEach(b=>b.classList.toggle('selected',b.textContent===title));
 $('contentTitle').textContent=title;$('grid').replaceChildren();$('count').textContent='Carregando…';
 try{const res=requireOk(await invoke('catalog',{profile:state.selected,op:'content',type:state.type,category}));if(epoch!==state.epoch)return;
   const data=res.items||[];$('count').textContent=data.length+(res.truncated?'+':'')+' itens';
   for(const item of data){const tile=renderTile(item);$('grid').append(tile)}
 }catch(e){if(epoch===state.epoch){$('count').textContent='Falha de conexão';notice(e.message)}}
}
function validImage(url){try{const u=new URL(url);return u.protocol==='http:'||u.protocol==='https:'?u.href:null}catch{return null}}
function renderTile(item){const type=state.type;
  const id=String(item.stream_id??item.vod_id??item.series_id??item.id??'');const name=String(item.name||item.title||'Sem título');
  const image=validImage(item.stream_icon||item.cover||item.logo||'');
  const b=document.createElement('button');b.className='tile '+(type==='live'?'live':'');b.setAttribute('aria-label',name);
  const art=document.createElement('span');art.className='poster';if(image){const im=document.createElement('img');im.loading='lazy';im.alt='';im.src=image;im.onerror=()=>{im.remove();art.textContent='✦'};art.append(im)}else{const mark=document.createElement('b');mark.textContent='✦';art.append(mark)}
  const title=document.createElement('span');title.className='tile-name';title.textContent=name;b.append(art,title);
  if(type==='vod'&&item.releaseDate){const m=document.createElement('small');m.className='tile-meta';m.textContent=item.releaseDate;b.append(m)}
  b.addEventListener('click',()=>{
    if(type==='series'){openSeries(id,name);return}
    startVideo({id,type,ext:item.container_extension||(type==='vod'?'mp4':'m3u8'),title:name});
  });return b;
}
async function openSeries(id,title){$('detailTitle').textContent=title;$('episodes').replaceChildren();$('detail').hidden=false;
 const msg=document.createElement('p');msg.textContent='Buscando episódios…';$('episodes').append(msg);
 try{const res=requireOk(await invoke('catalog',{profile:state.selected,op:'series',type:'series',item:Number(id)}));
   if($('detail').hidden)return;const seasons=res.detail?.episodes||{};$('episodes').replaceChildren();
   for(const [season,eps] of Object.entries(seasons)){if(!Array.isArray(eps))continue;
     for(const item of eps){const b=document.createElement('button');b.textContent='T'+season+' · '+(item.title||'Episódio '+item.episode_num);
       b.addEventListener('click',()=>{startVideo({id:String(item.id),type:'series',ext:item.container_extension||'mp4',title:title+' · '+b.textContent});$('detail').hidden=true});$('episodes').append(b)}}
   if(!$('episodes').children.length)$('episodes').textContent='Nenhum episódio informado';
   focusFirst($('detail'));
 }catch(e){$('episodes').textContent=e.message}
}
async function startVideo(data){try{requireOk(await invoke('play',{profile:state.selected,...data}))}catch(e){notice(e.message)}}
function profilePanel(){state.returnFocus=document.activeElement;renderProfiles();$('panel').hidden=false;focusFirst($('panel'))}
function closePanel(){$('panel').hidden=true;(state.returnFocus||$('profileBtn')).focus()}
function focusFirst(container){const el=container.querySelector('button:not([hidden]),input:not([hidden])');el?.focus()}
function renderProfiles(){const r=$('profileList');r.replaceChildren();
  for(const p of state.profiles){const row=document.createElement('div');row.className='profile-row';
    const left=document.createElement('div'),name=document.createElement('strong'),info=document.createElement('small');name.textContent=(p.id===state.selected?'● ':'')+p.name;info.textContent=dateStamp(p.expires);
    left.append(name,info);const actions=document.createElement('div');actions.className='actions';
    const pick=document.createElement('button');pick.textContent='Usar';pick.onclick=()=>{const res=safeResult(native.select(p.id));if(!res.ok){notice(res.error);return}closePanel();refresh()};
    const del=document.createElement('button');del.textContent='Remover';del.className='danger';del.onclick=()=>{if(!confirm('Remover a lista "'+p.name+'" e seu histórico?'))return;
      const res=safeResult(native.delete(p.id));if(!res.ok){notice(res.error);return}closePanel();refresh()};
    actions.append(pick,del);row.append(left,actions);r.append(row)}
  const ver=safeResult(native.updateState());$('revision').textContent='Canal '+(ver.channel||'?')+' • versão '+(ver.active||1)+' • anterior '+(ver.previous||1);
}
$('profileForm').addEventListener('submit',e=>{e.preventDefault();const data={name:$('profileName').value,url:$('profileUrl').value,username:$('profileUser').value,password:$('profilePass').value};
 const res=safeResult(native.addProfile(JSON.stringify(data)));if(!res.ok){notice(res.error);return}
 $('profilePass').value='';refresh();invoke('auth',{profile:res.id}).then(r=>{if(!r.ok||!r.valid){notice(r.error||'Lista não autorizada ou expirada');refresh()}else{notice('Lista conectada');refresh()}}).catch(e=>notice(e.message));
});
$('profileBtn').addEventListener('click',profilePanel);$('closePanel').onclick=closePanel;
$('addAnother').onclick=()=>{closePanel();$('profileForm').reset();presentLogin()};$('closeDetail').onclick=()=>{$('detail').hidden=true};
$('tabs').querySelectorAll('[data-type]').forEach(b=>b.addEventListener('click',()=>switchType(b.dataset.type)));
$('checkUpdate').onclick=async()=>{notice('Verificando atualização…');try{const r=requireOk(await invoke('check',{}));if(r.updated){notice('Atualização '+r.revision+' instalada');native.reload()}else notice('Você já está na versão disponível')}catch(e){notice(e.message)}};
$('rollback').onclick=async()=>{if(!confirm('Voltar para a versão anterior da interface?'))return;
 try{const r=requireOk(await invoke('rollback',{}));if(r.updated)native.reload();else notice('Não existe uma versão anterior disponível')}catch(e){notice(e.message)}};
$('panel').addEventListener('click',e=>{if(e.target===$('panel'))closePanel()});
$('detail').addEventListener('click',e=>{if(e.target===$('detail'))$('detail').hidden=true});
const dev=safeResult(native.device());document.documentElement.dataset.device=dev.channel||'phone';
if(dev.tv){document.addEventListener('keydown',e=>{
  if(e.key==='Escape'||e.key==='Backspace'){e.preventDefault();Aura.back();return}
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
  if(e.target.matches('input,textarea'))return;
  const scope=!$('detail').hidden?$('detail'):!$('panel').hidden?$('panel'):!$('login').hidden?$('login'):$('shell');
  const candidates=[...scope.querySelectorAll('button:not([hidden]),input:not([hidden])')].filter(el=>el.getBoundingClientRect().width&&el.getBoundingClientRect().height);
  const from=e.target.getBoundingClientRect(),cx=from.left+from.width/2,cy=from.top+from.height/2;
  const dx=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0,dy=e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0;
  let best=null,score=Infinity;
  for(const el of candidates){if(el===e.target)continue;const r=el.getBoundingClientRect(),x=r.left+r.width/2-cx,y=r.top+r.height/2-cy;
    const forward=x*dx+y*dy,side=Math.abs(x*dy-y*dx);if(forward<=5)continue;
    const s=forward+side*2.8;if(s<score){score=s;best=el}}
  if(best){e.preventDefault();best.focus({preventScroll:false})}
})}
refresh();
})();
