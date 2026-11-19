/* Aura Remote 1.2 — comportamento compartilhado (celular / TV).
   O núcleo nativo escolhe o layout: hardware de TV OU aparelho na horizontal => "tv"; vertical => "phone".
   Nenhum segredo fica no storage do navegador: só a posição de navegação (aba/categoria/página) em sessionStorage. */
(function(){'use strict';
var n=window.Native,calls=Object.create(null),serial=0,timer=0,session=Date.now().toString(36)+Math.random().toString(36).slice(2);
var NS='http://www.w3.org/2000/svg',XL='http://www.w3.org/1999/xlink',TABS=['live','vod','series','favorites','recent'];
if(!Element.prototype.replaceChildren)Element.prototype.replaceChildren=function(){while(this.firstChild)this.removeChild(this.firstChild);for(var i=0;i<arguments.length;i++)this.appendChild(arguments[i]);};
if(window.NodeList&&!NodeList.prototype.forEach)NodeList.prototype.forEach=Array.prototype.forEach;
var state={tv:false,hardwareTv:false,profiles:[],account:0,tab:'live',cat:'',cats:[],catFilter:'',items:[],page:0,pages:0,generation:0,detail:null,eps:[],season:'',
  focusBefore:null,favs:Object.create(null),mode:'link',lastBack:0,ready:false};
var $=function(id){return document.getElementById(id);};
function text(id,value){var e=$(id);if(e)e.textContent=value==null?'':String(value);}
function show(id,on){var e=$(id);if(e)e.hidden=!on;}
function node(tag,cls,content){var o=document.createElement(tag);if(cls)o.className=cls;if(content!=null)o.textContent=String(content);return o;}
function icon(name){var s=document.createElementNS(NS,'svg'),u=document.createElementNS(NS,'use');s.setAttribute('class','ic');s.setAttribute('aria-hidden','true');
  u.setAttribute('href','#i-'+name);u.setAttributeNS(XL,'xlink:href','#i-'+name);s.appendChild(u);return s;}
function button(title,cls,handler){var b=document.createElement('button');b.type='button';b.className=cls||'';if(title)b.textContent=title;if(handler)b.addEventListener('click',handler);return b;}
function toast(s,ms){var box=$('notice');box.textContent=s;box.classList.add('show');clearTimeout(timer);timer=setTimeout(function(){box.classList.remove('show');},ms||3400);}
function message(e){toast(errText(e));}
function errText(e){return e&&e.message?e.message:'Não foi possível completar a operação.';}
function busy(id,on,label){var b=$(id);if(!b)return;b.disabled=!!on;b.classList.toggle('loading',!!on);if(label!=null)b.textContent=label;}

/* ── ponte nativa ── */
function request(op,args,ms){return new Promise(function(resolve,reject){
  if(!n||!n.request){reject(new Error('Ponte nativa indisponível neste aparelho.'));return;}
  var token=session+'-'+(++serial),t=setTimeout(function(){if(calls[token]){delete calls[token];reject(new Error('O servidor demorou demais. Tente novamente.'));}},ms||75000);
  calls[token]={resolve:function(v){clearTimeout(t);resolve(v);},reject:function(e){clearTimeout(t);reject(e);}};
  try{n.request(token,op,JSON.stringify(args||{}));}catch(e){clearTimeout(t);delete calls[token];reject(e);}
});}
var App={
  onNative:function(token,result){var f=calls[token];if(!f)return;delete calls[token];if(result&&result.ok===false)f.reject(new Error(result.error||'Operação indisponível'));else f.resolve(result||{});},
  onUpdate:function(info){if(info&&info.state==='applying')showUpdating('Carregando a revisão '+(info.revision||'')+' da interface…');},
  back:back
};window.App=App;

/* Tela "Atualizando módulos": só aparece quando há atualização de fato; sai sozinha se a recarga não ocorrer. */
function showUpdating(msg){text('updatingText',msg);show('updating',true);clearTimeout(showUpdating.t);showUpdating.t=setTimeout(function(){show('updating',false);},9000);}

/* ── posição de navegação (sobrevive à troca phone↔TV e a atualizações) ── */
function saveNav(){try{sessionStorage.setItem('aura.nav',JSON.stringify({a:state.account,t:state.tab,c:state.cat,p:state.page}));}catch(e){}}
function loadNav(){try{return JSON.parse(sessionStorage.getItem('aura.nav')||'null');}catch(e){return null;}}

/* ── contas ── */
function activeProfile(){return state.profiles.find(function(p){return +p.id===state.account;})||null;}
async function refreshProfiles(){
  var r=await request('profiles',{});state.profiles=r.list||[];state.account=Number(r.selected||0);
  var p=activeProfile();text('profileTitle',p?p.label:'Sua biblioteca');
  if(!state.account){showLogin();return false;}
  show('login',false);show('library',true);return true;
}
function showLogin(){
  show('library',false);show('login',true);setStatus('');
  var has=state.profiles.length>0;show('cancelLogin',has);
  if(has&&!state.account)setStatus('Nenhuma das suas listas está ativa ou válida. Adicione uma nova ou revise as existentes.','error');
  setMode(state.mode);
}
async function loadFavorites(){
  state.favs=Object.create(null);
  try{var r=await request('favorites',{profile:state.account});(r.items||[]).forEach(function(o){state.favs[(o.type||'')+':'+o.id]=true;});}catch(e){}
}
async function start(){
  try{
    if(!await refreshProfiles())return;
    var nav=loadNav(),tab=state.tab,cat='',page=0;
    if(nav&&nav.a===state.account&&TABS.indexOf(nav.t)>=0){tab=nav.t;cat=nav.c||'';page=nav.p||0;}
    await loadFavorites();
    await openTab(tab,cat,page);
    verifyAccount();
  }catch(e){message(e);showLogin();}
}
/* Confirma em segundo plano que a lista ainda vale; falha de rede nunca bloqueia o uso. */
async function verifyAccount(){
  var id=state.account;if(!id)return;
  try{await request('auth',{profile:id},45000);}
  catch(e){
    var m=errText(e);
    if(/vencida|não está ativa/i.test(m)){toast(m+' Escolha outra lista.',5200);await refreshProfiles();if(state.account&&state.account!==id)await openTab('live');}
  }
}

/* ── login ── */
function setStatus(msg,kind){var s=$('loginStatus');if(!s)return;s.hidden=!msg;s.className='status'+(kind?' '+kind:'');s.textContent='';
  if(!msg)return;if(kind==='busy')s.appendChild(node('span','spinner small'));s.appendChild(node('span','',msg));}
function setMode(mode){
  state.mode=mode==='server'?'server':'link';
  $('modes').querySelectorAll('button').forEach(function(b){var on=b.dataset.mode===state.mode;b.classList.toggle('active',on);b.setAttribute('aria-selected',on?'true':'false');});
  show('credentials',state.mode==='server');
  text('hostLabel',state.mode==='server'?'Servidor (ex.: http://servidor:8080)':'Link Xtream ou M3U');
  $('host').placeholder=state.mode==='server'?'http://servidor:8080':'http://servidor:8080/get.php?username=…&password=…';
}
function val(id){return ($(id).value||'').trim();}
async function addProfile(e){
  e.preventDefault();
  var p={name:val('label'),url:val('host'),username:state.mode==='server'?val('username'):'',password:state.mode==='server'?$('password').value:''};
  try{
    if(!p.name)throw new Error('Dê um nome para a lista.');
    if(!p.url)throw new Error(state.mode==='server'?'Informe o endereço do servidor.':'Cole o link da lista.');
    if(state.mode==='server'&&(!p.username||!p.password))throw new Error('Informe usuário e senha.');
  }catch(err){setStatus(errText(err),'error');return;}
  busy('saveProfile',true,'Verificando…');setStatus('Verificando acesso ao servidor. Isso pode levar alguns segundos…','busy');
  try{
    await request('add',p,90000);
    ['label','host','username','password'].forEach(function(id){$(id).value='';});
    setStatus('');toast('Lista validada e salva.');state.tab='live';state.cat='';state.page=0;
    try{sessionStorage.removeItem('aura.nav');}catch(x){}
    await start();
  }catch(err){
    var m=errText(err);
    if(state.mode==='link'&&/M3U válido|user_info/i.test(m))m+=' Se a sua lista é Xtream, use a aba “Servidor + login”.';
    setStatus(m,'error');
  }finally{busy('saveProfile',false,'Conectar lista');}
}

/* ── abas e catálogo ── */
function labels(tab){return {live:'Ao vivo',vod:'Filmes',series:'Séries',favorites:'Favoritos',recent:'Continuar assistindo'}[tab]||'Biblioteca';}
function tabsUi(tab){$('tabs').querySelectorAll('[data-tab]').forEach(function(b){var on=b.dataset.tab===tab;b.classList.toggle('active',on);b.setAttribute('aria-current',on?'page':'false');});}
function clearCatalog(){state.generation++;state.cat='';state.cats=[];state.catFilter='';state.items=[];state.page=0;state.pages=0;
  $('grid').replaceChildren();$('categories').replaceChildren();$('catFilter').value='';show('catFilter',false);showState();text('categoryName','');text('total','');show('pager',false);}
function showState(kind,title,body,retry){
  var box=$('state');box.replaceChildren();if(!kind){box.hidden=true;return;}
  box.hidden=false;box.className='state '+kind;box.appendChild(icon(kind==='error'?'alert':'film'));box.appendChild(node('strong','',title));
  if(body)box.appendChild(node('p','',body));if(retry)box.appendChild(button('Tentar de novo','primary',retry));
}
async function openTab(tab,wantCat,wantPage){
  state.tab=tab;clearCatalog();tabsUi(tab);saveNav();
  text('heading',labels(tab));text('heroLabel',tab==='favorites'||tab==='recent'?'SUA ÁREA':'BIBLIOTECA');text('subheading','');
  var flat=tab==='favorites'||tab==='recent';show('featured',false);
  document.querySelector('.sidebar').hidden=flat;$('library').classList.toggle('flat',flat);
  var gen=state.generation;
  if(flat){
    text('categoryName','');skeleton(6);
    try{var r=await request(tab==='favorites'?'favorites':'recent',{profile:state.account});if(gen!==state.generation)return;
      state.items=(r.items||[]).map(function(o){if(tab==='recent'){var k=o.key||'',c=k.indexOf(':');o.type=c>0?k.slice(0,c):'vod';o.id=k.slice(c+1);o.ext=o.type==='live'?'m3u8':'mp4';}return o;});
      text('total',state.items.length?state.items.length+' itens':'');drawCards();
      if(!state.items.length)showState('empty',tab==='favorites'?'Nenhum favorito ainda':'Nada para continuar',tab==='favorites'?'Abra um título e toque na estrela. Nos canais, use a estrela ao lado do nome.':'O que você começar a assistir aparece aqui, no ponto onde parou.');
    }catch(e){if(gen===state.generation){$('grid').replaceChildren();showState('error','Não foi possível carregar',errText(e),function(){openTab(tab);});}}
    return;
  }
  text('categoryName','Categorias');skeleton(tab==='live'?8:6);
  try{var c=await request('catalog',{profile:state.account,op:'categories',type:tab});if(gen!==state.generation)return;
    state.cats=c.items||[];drawCategories();text('subheading',state.cats.length+(state.cats.length===1?' categoria':' categorias'));
    show('catFilter',state.cats.length>14);
    if(!state.cats.length){$('grid').replaceChildren();showState('empty','Sem categorias','Esta lista não tem conteúdo nesta seção.');return;}
    var found=wantCat&&state.cats.some(function(x){return String(x.id)===String(wantCat);});
    await loadCategory(found?String(wantCat):String(state.cats[0].id),found?(wantPage||0):0);
  }catch(e){if(gen===state.generation){$('grid').replaceChildren();text('categoryName','');showState('error','Não foi possível carregar as categorias',errText(e),function(){openTab(tab);});}}
}
function drawCategories(){
  var box=$('categories'),q=state.catFilter.toLowerCase();box.replaceChildren();
  state.cats.forEach(function(c){
    var name=c.name||'Sem categoria';if(q&&name.toLowerCase().indexOf(q)<0)return;
    var b=button(name,'chip'+(String(c.id)===state.cat?' selected':''),function(){loadCategory(String(c.id),0);});
    b.title=name;b.setAttribute('aria-pressed',String(c.id)===state.cat?'true':'false');box.appendChild(b);
  });
  var sel=box.querySelector('.selected');if(sel&&sel.scrollIntoView)try{sel.scrollIntoView({block:'nearest',inline:'center'});}catch(e){}
}
function skeleton(count){
  var g=$('grid');g.replaceChildren();g.className='grid skeleton '+(state.tab==='live'?'live-grid':state.tab==='recent'?'recent-grid':'poster-grid');
  for(var i=0;i<count;i++)g.appendChild(node('div','card ghost-card'));
}
async function loadCategory(cat,page){
  state.cat=cat;state.page=page;var gen=++state.generation;drawCategories();saveNav();showState();
  var found=state.cats.find(function(c){return String(c.id)===cat;});text('categoryName',found?found.name:'Conteúdos');
  text('total','Carregando…');skeleton(state.tab==='live'?8:6);show('pager',false);
  try{var r=await request('catalog',{profile:state.account,op:'content',type:state.tab,category:cat,page:page});
    if(gen!==state.generation)return;state.items=r.items||[];state.pages=r.pages||0;state.page=r.page||0;saveNav();drawCards();drawFeatured();
    text('total',String(r.count||0)+(r.count===1?' item':' itens'));show('pager',state.pages>1);text('pageLabel',(state.page+1)+' / '+Math.max(1,state.pages));
    busy('previous',state.page<=0);busy('next',state.page>=state.pages-1);
    if(!state.items.length)showState('empty','Categoria vazia','Não há conteúdos nesta categoria.');
    if(page>0||document.body.classList.contains('dpad'))scrollTopSoft();
    if(document.body.classList.contains('dpad')&&(!document.activeElement||document.activeElement===document.body))focusFirst();
  }catch(e){if(gen===state.generation){$('grid').replaceChildren();text('total','');showState('error','Falha ao carregar',errText(e),function(){loadCategory(cat,page);});}}
}
function scrollTopSoft(){try{var s=document.querySelector('.content-main');if(s&&s.scrollIntoView)s.scrollIntoView({block:'start'});}catch(e){}}
function focusFirst(){var b=$('grid').querySelector('button')||$('categories').querySelector('button');if(b)b.focus();}

/* ── cartões ── */
function safeImage(v){if(typeof v!=='string')return '';return (/^https?:\/\//i.test(v)&&v.length<2000)||/^data:image\/(png|jpe?g|webp|svg\+xml)[;,]/i.test(v)&&v.length<20000?v:'';}
function initial(t){var m=String(t||'').match(/[A-Za-zÀ-ÿ0-9]/);return m?m[0].toUpperCase():'•';}
function fmtTime(ms){ms=Math.max(0,Math.round((+ms||0)/1000));var h=Math.floor(ms/3600),m=Math.floor(ms%3600/60),s=ms%60;
  return (h?h+':'+(m<10?'0':''):'')+m+':'+(s<10?'0':'')+s;}
function poster(item,cls){
  var box=node('div',cls||'art'),link=safeImage(item.poster);
  var fb=node('div','fallback',initial(item.title));
  if(link){var img=document.createElement('img');img.loading='lazy';img.decoding='async';img.alt='';img.referrerPolicy='no-referrer';
    img.addEventListener('error',function(){img.remove();box.appendChild(fb);},{once:true});img.src=link;box.appendChild(img);}
  else box.appendChild(fb);
  return box;
}
function isFav(item){return !!state.favs[(item.type||state.tab)+':'+item.id];}
function armLongPress(b,item){
  var t=0;function clear(){clearTimeout(t);t=0;}
  b.addEventListener('touchstart',function(){clear();t=setTimeout(function(){b._skip=true;setTimeout(function(){b._skip=false;},900);toggleFavorite(item);},640);},{passive:true});
  ['touchend','touchmove','touchcancel'].forEach(function(ev){b.addEventListener(ev,clear,{passive:true});});
  b.addEventListener('contextmenu',function(e){e.preventDefault();toggleFavorite(item);});
}
function drawCards(){
  var grid=$('grid'),frag=document.createDocumentFragment(),tab=state.tab;grid.replaceChildren();
  grid.className='grid '+(tab==='live'?'live-grid':tab==='recent'?'recent-grid':'poster-grid');
  state.items.forEach(function(item){
    var title=item.title||'Sem título',fav=isFav(item),el;
    if(tab==='live'&&item.type==='live'){
      el=node('div','row-card live'+(fav?' fav':''));
      var main=button('','row-main',function(){openItem(item);});main.setAttribute('aria-label','Assistir '+title);main.title=title;
      main.appendChild(poster(item,'logo-box'));var info=node('span','row-info');info.appendChild(node('span','row-title',title));
      var live=node('span','row-sub');live.appendChild(node('i','dot'));live.appendChild(document.createTextNode('Ao vivo'));info.appendChild(live);main.appendChild(info);
      var star=button('','row-fav'+(fav?' active':''),function(){toggleFavorite(item);});star.setAttribute('aria-label','Favoritar '+title);star.appendChild(icon('star'));
      el.appendChild(main);el.appendChild(star);main._item=item;star._item=item;
    }else if(tab==='recent'){
      el=node('div','row-card recent');
      var rb=button('','row-main',function(){play(item);});rb.title=title;rb.setAttribute('aria-label','Continuar '+title);
      var tile=node('div','logo-box');tile.appendChild(icon(item.type==='series'?'series':item.type==='live'?'live':'film'));rb.appendChild(tile);
      var ri=node('span','row-info');ri.appendChild(node('span','row-title',title));
      var kind=item.type==='series'?'Série':item.type==='live'?'Canal':'Filme';
      var pos=+item.position||0,dur=+item.duration||0;
      ri.appendChild(node('span','row-sub',kind+(dur>0?' · '+fmtTime(pos)+' de '+fmtTime(dur):' · '+fmtTime(pos))));
      var bar=node('span','bar'),fill=node('i');fill.style.width=(dur>0?Math.min(100,Math.max(3,pos*100/dur)):6).toFixed(1)+'%';bar.appendChild(fill);ri.appendChild(bar);
      rb.appendChild(ri);rb.appendChild(icon('play'));el.appendChild(rb);rb._item=item;
    }else{
      el=button('','card'+(item.type==='live'?' logo':'')+(fav?' fav':''),function(){if(el._skip){el._skip=false;return;}openItem(item);});
      el.setAttribute('aria-label',title);el.title=title;
      el.appendChild(poster(item,'art'));var meta=node('span','meta');meta.appendChild(node('span','',title));el.appendChild(meta);
      var badge=node('span','fav-badge');badge.appendChild(icon('star'));el.appendChild(badge);
      el._item=item;armLongPress(el,item);
    }
    frag.appendChild(el);
  });
  grid.appendChild(frag);
}
function drawFeatured(){
  if(state.tab!=='vod'&&state.tab!=='series'){show('featured',false);return;}
  var item=state.items.find(function(x){return safeImage(x.poster);})||state.items[0];
  if(!item){show('featured',false);return;}
  var art=safeImage(item.backdrop)||safeImage(item.poster);
  $('featuredBackdrop').style.backgroundImage=art?'url('+JSON.stringify(art)+')':'';
  $('featuredPoster').replaceChildren(poster(item,'art'));
  text('featuredTitle',item.title||'Em destaque');
  text('featuredCaption',(state.tab==='series'?'Série':'Filme')+' · '+((state.cats.find(function(c){return String(c.id)===state.cat;})||{}).name||'Sua biblioteca'));
  $('featuredOpen').onclick=function(){openItem(item);};show('featured',true);
}
async function toggleFavorite(item){
  try{var r=await request('favorite',{profile:state.account,item:item});var key=(item.type||state.tab)+':'+item.id;
    if(r.active)state.favs[key]=true;else delete state.favs[key];
    toast(r.active?'Adicionado aos favoritos.':'Removido dos favoritos.');
    if(state.detail&&String(state.detail.id)===String(item.id)){setFavButton(!!r.active);}
    if(state.tab==='favorites'&&!r.active){state.items=state.items.filter(function(x){return !(String(x.id)===String(item.id)&&x.type===item.type);});drawCards();text('total',state.items.length?state.items.length+' itens':'');
      if(!state.items.length)showState('empty','Nenhum favorito ainda','Abra um título e toque na estrela.');}
    else refreshStars();
  }catch(e){message(e);}
}
function refreshStars(){
  $('grid').querySelectorAll('.card,.row-card').forEach(function(el){var it=(el.querySelector('.row-main')||el)._item||el._item;if(!it)return;var f=isFav(it);el.classList.toggle('fav',f);var s=el.querySelector('.row-fav');if(s)s.classList.toggle('active',f);});
}
function setFavButton(on){var b=$('favoriteButton');b.classList.toggle('active',on);b.setAttribute('aria-pressed',on?'true':'false');b.setAttribute('aria-label',on?'Remover dos favoritos':'Adicionar aos favoritos');}

/* ── reprodução e detalhes: página cinematográfica de smartphone ── */
async function play(item){
  try{await request('play',{profile:state.account,type:item.type||state.tab,id:String(item.id),title:item.title||'',ext:item.ext||((item.type||state.tab)==='live'?'m3u8':'mp4')});
    closeSheet('details');
  }catch(e){message(e);}
}
function openSheet(id){state.focusBefore=document.activeElement;show('shade',true);show(id,true);
  if(id==='details'){$('details').scrollTop=0;var sc=$('details').querySelector('.detail-scroll');if(sc)sc.scrollTop=0;}
  var b=$(id).querySelector('button');if(b)b.focus();}
function closeSheet(id){show(id,false);if($('accounts').hidden&&$('details').hidden)show('shade',false);
  var f=state.focusBefore;if(f&&document.contains(f)&&!f.disabled)try{f.focus();}catch(e){}}
function closeDetail(){state.detail=null;closeSheet('details');}
function metadata(item){
  var list=[],type=item.type||state.tab;
  list.push(type==='series'?'Série':type==='live'?'Ao vivo':'Filme');
  var year=String(item.year||item.releaseDate||'').match(/(?:19|20)\d{2}/);
  if(!year)year=String(item.title||'').match(/\((?:19|20)\d{2}\)/);
  if(year)list.push(year[0].replace(/[()]/g,''));
  if(item.genre)list.push(String(item.genre).split(',')[0].trim());
  var rating=parseFloat(item.rating);if(isFinite(rating)&&rating>0&&rating<=10)list.push('★ '+rating.toFixed(1).replace('.',','));
  var box=$('detailMetadata');box.replaceChildren();list.forEach(function(t){box.appendChild(node('span','',t));});
}
function setBackdrop(link){
  var b=$('detailBackdrop');link=safeImage(link);b.style.backgroundImage=link?'url('+JSON.stringify(link)+')':'';
  b.classList.toggle('empty',!link);
}
function setDetailView(name){
  var episodes=name==='episodes'&&state.detail&&state.detail.type==='series';
  $('episodesTab').classList.toggle('selected',!!episodes);$('recommendationsTab').classList.toggle('selected',!episodes);
  show('episodesPanel',!!episodes);show('recommendationsPanel',!episodes);
  if(episodes)show('seasons',false);
  $('seasonButton').setAttribute('aria-expanded','false');
}
function drawRecommendations(item){
  var list=state.items.filter(function(x){return x&&x.id!=null&&!(String(x.id)===String(item.id)&&x.type===item.type)&&x.type===item.type;}).slice(0,12);
  var box=$('recommendations');box.replaceChildren();
  if(!list.length){box.appendChild(node('p','recommendations-empty','Nenhuma recomendação disponível nesta categoria.'));return;}
  list.forEach(function(x){
    var b=button('','recommend-card',function(){openItem(x);});b.setAttribute('aria-label',x.title||'Abrir título');
    b.appendChild(poster(x,'art'));box.appendChild(b);
  });
}
async function openItem(item){
  if(item.type==='live'){play(item);return;}
  state.detail=item;state.eps=[];state.season='';
  openSheet('details');
  text('detailName',item.title||'Detalhes');text('detailKind',item.type==='series'?'SÉRIE':'FILME');
  metadata(item);setBackdrop(item.backdrop||item.poster);
  text('description','Carregando informações…');
  var art=$('detailPoster');art.replaceChildren();art.appendChild(poster(item,'art'));
  $('episodes').replaceChildren();show('episodesHeading',false);show('seasons',false);
  $('seasons').replaceChildren();show('seasonButton',false);
  show('episodesTab',item.type==='series');setDetailView(item.type==='series'?'episodes':'recommendations');
  drawRecommendations(item);
  $('watch').onclick=function(){play(item);};text('watchLabel','Reproduzir');
  $('favoriteButton').onclick=function(){toggleFavorite(item);};setFavButton(isFav(item));
  try{var d=await request('catalog',{profile:state.account,op:'detail',type:item.type||state.tab,item:String(item.id)});
    if(state.detail!==item||$('details').hidden)return;
    text('detailName',d.title||item.title||'Detalhes');
    text('description',d.description||'Sem sinopse disponível.');
    if(safeImage(d.poster)&&!safeImage(item.poster)){art.replaceChildren();art.appendChild(poster({poster:d.poster,title:item.title},'art'));}
    setBackdrop(d.backdrop||item.backdrop||d.poster||item.poster);
    metadata(Object.assign({},item,d));
    state.eps=d.episodes||[];if(item.type==='series')drawSeasons();
  }catch(e){if(state.detail===item)text('description','Não foi possível buscar a sinopse agora. A reprodução continua disponível.');}
}
function seasonsOf(){var seen=[];state.eps.forEach(function(e){var s=String(e.season||1);if(seen.indexOf(s)<0)seen.push(s);});
  return seen.sort(function(a,b){return (+a||0)-(+b||0);});}
function drawSeasons(){
  var list=seasonsOf();if(!state.season||list.indexOf(state.season)<0)state.season=list[0];
  var box=$('seasons');box.replaceChildren();
  list.forEach(function(s){box.appendChild(button('Temporada '+s,'season-option'+(s===state.season?' selected':''),function(){state.season=s;drawSeasons();show('seasons',false);$('seasonButton').setAttribute('aria-expanded','false');}));});
  show('seasonButton',list.length>0);text('seasonButton','Temporada '+(state.season||1)+'  ▾');
  var eps=state.eps.filter(function(e){return String(e.season||1)===state.season;}).sort(function(a,b){return (+a.episode||0)-(+b.episode||0);});
  show('episodesHeading',eps.length>0);text('episodesHeading',eps.length+' '+(eps.length===1?'episódio':'episódios'));
  var box2=$('episodes');box2.replaceChildren();
  if(!eps.length){box2.appendChild(node('p','recommendations-empty','Nenhum episódio encontrado para esta temporada.'));return;}
  eps.forEach(function(e){
    var b=button('','ep',function(){play({type:'series',id:e.id,title:(state.detail?state.detail.title+' · ':'')+'T'+(e.season||1)+'E'+(e.episode||1),ext:e.ext||'mp4'});});
    var thumb=node('div','ep-thumb'),image=safeImage(e.poster||e.image||(state.detail&&state.detail.poster));
    if(image){var im=document.createElement('img');im.src=image;im.alt='';im.loading='lazy';im.referrerPolicy='no-referrer';thumb.appendChild(im);}
    thumb.appendChild(icon('play'));b.appendChild(thumb);
    var info=node('div','ep-info');info.appendChild(node('strong','',String(e.episode||'')+'. '+(e.title||'Episódio')));
    if(e.description)info.appendChild(node('small','',e.description));else info.appendChild(node('small','','Temporada '+(e.season||state.season)));
    b.appendChild(info);box2.appendChild(b);
  });
  text('watchLabel','Assistir T'+(eps[0].season||1)+' · E'+(eps[0].episode||1));
  $('watch').onclick=function(){var e=eps[0];play({type:'series',id:e.id,title:(state.detail?state.detail.title+' · ':'')+'T'+(e.season||1)+'E'+(e.episode||1),ext:e.ext||'mp4'});};
}

/* ── listas e ajustes ── */
function date(exp){if(!exp)return 'Sem validade informada';return 'Vence em '+new Date(Number(exp)*1000).toLocaleDateString('pt-BR');}
function drawAccounts(){
  var list=$('profileList');list.replaceChildren();
  if(!state.profiles.length)list.appendChild(node('p','muted','Nenhuma lista salva.'));
  state.profiles.forEach(function(p){
    var active=+p.id===state.account,row=node('div','profile-row'+(active?' on':'')),left=node('div','profile-main');
    var head=node('strong','',p.label);if(active)head.appendChild(node('em','pill','Ativa'));if(p.status==='expired')head.appendChild(node('em','pill bad','Vencida'));left.appendChild(head);
    left.appendChild(node('small','',(p.kind==='xtream'?'Xtream':'M3U')+' · '+date(p.expires)));row.appendChild(left);
    var actions=node('div','actions');
    if(!active)actions.appendChild(button('Usar','',async function(){
      try{await request('select',{profile:p.id});closeSheet('accounts');state.tab='live';state.cat='';try{sessionStorage.removeItem('aura.nav');}catch(x){}await start();}catch(e){message(e);}}));
    var del=button('Excluir','danger',null),armed=0;
    del.addEventListener('click',async function(){
      if(!armed){armed=setTimeout(function(){armed=0;del.textContent='Excluir';del.classList.remove('armed');},3600);del.textContent='Confirmar?';del.classList.add('armed');return;}
      clearTimeout(armed);armed=0;
      try{await request('delete',{profile:p.id});closeSheet('accounts');clearCatalog();state.account=0;try{sessionStorage.removeItem('aura.nav');}catch(x){}await start();toast('Lista excluída.');}catch(e){message(e);}
    });
    actions.appendChild(del);row.appendChild(actions);list.appendChild(row);
  });
}
async function openAccounts(){
  try{
    var r=await request('profiles',{});state.profiles=r.list||[];drawAccounts();
    var v=await request('version',{});text('versionText','Interface '+(v.channel==='tv'?'TV':'celular')+' · revisão '+v.active+(v.pending?' (nova '+v.pending+' pronta)':''));
    var l=v.layout||{};text('layoutText',l.tv?(l.hardwareTv?'Layout de TV (aparelho detectado como Android TV)':'Layout de TV (aparelho na horizontal)'):'Layout de celular (aparelho na vertical)');
    openSheet('accounts');
  }catch(e){message(e);}
}
async function checkUpdate(){
  try{toast('Verificando atualização…');var r=await request('update',{},45000);
    if(r.staged){showUpdating('Carregando a revisão '+r.revision+' da interface…');setTimeout(function(){n.reload();},900);}
    else toast('A interface já está na versão mais recente.');
  }catch(e){message(e);}
}

/* ── voltar / teclado / D-pad ── */
function exitGuard(){var now=Date.now();if(now-state.lastBack<2500)return false;state.lastBack=now;toast('Pressione Voltar de novo para sair.',2300);return true;}
function back(){
  if(!$('updating').hidden)return true;
  if(!$('details').hidden){closeDetail();return true;}
  if(!$('accounts').hidden){closeSheet('accounts');return true;}
  if(!$('login').hidden){if(state.account&&state.profiles.length){leaveLogin();return true;}return exitGuard();}
  if(state.tab!=='live'){openTab('live');return true;}
  return exitGuard();
}
function leaveLogin(){show('login',false);show('library',true);}
function spatial(direction){
  var a=document.activeElement;if(a&&/^(INPUT|TEXTAREA)$/.test(a.tagName))return;
  var scope=!$('updating').hidden?null:!$('details').hidden?$('details'):!$('accounts').hidden?$('accounts'):!$('login').hidden?$('login'):document;if(!scope)return;
  var all=Array.prototype.filter.call(scope.querySelectorAll('button,input'),function(x){var r=x.getBoundingClientRect();return !x.disabled&&r.width>3&&r.height>3&&x.offsetParent!==null;});
  var from=document.activeElement,rect=from&&from.getBoundingClientRect();
  if(!rect||all.indexOf(from)<0){if(all.length)all[0].focus();return;}
  var fx=rect.left+rect.width/2,fy=rect.top+rect.height/2,best=null,rank=Infinity;
  all.forEach(function(x){if(x===from)return;var r=x.getBoundingClientRect(),dx=r.left+r.width/2-fx,dy=r.top+r.height/2-fy;
    var axial=direction==='left'?-dx:direction==='right'?dx:direction==='up'?-dy:dy;if(axial<4)return;
    var lateral=direction==='left'||direction==='right'?Math.abs(dy):Math.abs(dx),score=axial+2.3*lateral+(lateral>axial*1.5?500:0);
    if(score<rank){rank=score;best=x;}});
  if(!best&&direction==='left'&&from.closest&&from.closest('#grid'))best=$('categories').querySelector('.selected')||$('categories').querySelector('button');
  if(best){best.focus();try{best.scrollIntoView({block:'nearest',inline:'nearest'});}catch(e){}}
}
function bind(){
  $('loginForm').addEventListener('submit',addProfile);
  $('modes').querySelectorAll('button').forEach(function(b){b.addEventListener('click',function(){setMode(b.dataset.mode);setStatus('');});});
  $('togglePassword').addEventListener('click',function(){var p=$('password'),on=p.type==='password';p.type=on?'text':'password';$('togglePassword').setAttribute('aria-pressed',on?'true':'false');});
  $('cancelLogin').onclick=function(){setStatus('');leaveLogin();};
  $('tabs').querySelectorAll('button[data-tab]').forEach(function(b){b.addEventListener('click',function(){if(b.dataset.tab!==state.tab||!$('library').hidden)openTab(b.dataset.tab);});});
  $('catFilter').addEventListener('input',function(){state.catFilter=$('catFilter').value||'';drawCategories();});
  $('accountButton').onclick=openAccounts;$('closeAccounts').onclick=function(){closeSheet('accounts');};
  $('closeDetails').onclick=closeDetail;
  $('episodesTab').onclick=function(){setDetailView('episodes');};
  $('recommendationsTab').onclick=function(){setDetailView('recommendations');};
  $('seasonButton').onclick=function(){var on=$('seasons').hidden;show('seasons',on);$('seasonButton').setAttribute('aria-expanded',on?'true':'false');};$('shade').onclick=function(){back();};
  $('newProfile').onclick=function(){closeSheet('accounts');showLogin();setStatus('');$('label').focus();};
  $('previous').onclick=function(){if(state.page>0)loadCategory(state.cat,state.page-1);};
  $('next').onclick=function(){if(state.page+1<state.pages)loadCategory(state.cat,state.page+1);};
  $('updateButton').onclick=checkUpdate;$('checkUpdate').onclick=checkUpdate;
  $('rollback').onclick=async function(){try{var r=await request('rollback',{});if(r.updated){showUpdating('Voltando para a revisão '+r.revision+'…');setTimeout(function(){n.reload();},700);}else toast('Não há versão anterior verificada.');}catch(e){message(e);}};
  document.addEventListener('keydown',function(e){
    if(/^(Arrow(Left|Right|Up|Down)|Enter|Tab|ContextMenu)$/.test(e.key))document.body.classList.add('dpad');
    var a=document.activeElement;
    if((e.key==='ContextMenu'||e.key==='F10'||e.key==='f')&&a&&a._item&&a._item.type&&a.closest&&a.closest('#grid')){e.preventDefault();toggleFavorite(a._item);return;}
    if(e.key==='Escape'||(e.key==='Backspace'&&!/INPUT|TEXTAREA/.test(a?a.tagName:''))){e.preventDefault();if(!back()){try{n.exit();}catch(x){}}}
    else if((state.tv||document.body.classList.contains('dpad'))&&/^Arrow(Left|Right|Up|Down)$/.test(e.key)){e.preventDefault();spatial(e.key.slice(5).toLowerCase());}
  });
  var pointer=function(){if(!state.hardwareTv)document.body.classList.remove('dpad');};
  document.addEventListener('touchstart',pointer,{passive:true,capture:true});document.addEventListener('mousedown',pointer,true);
}
var dev={};try{dev=JSON.parse(n.device())||{};}catch(e){}
state.tv=!!dev.tv;state.hardwareTv=!!dev.hardwareTv;
document.body.classList.toggle('tv-layout',state.tv);document.body.classList.toggle('phone-layout',!state.tv);
if(state.hardwareTv)document.body.classList.add('dpad');
/* Escala para TVs grandes: o layout é pensado em ~1280px. Uma TV 4K/75" (viewport 1920–3840px) ganha zoom proporcional em vez de
   cartões gigantes ou textos minúsculos. --vw/--vh compensam o zoom nas unidades de viewport. Aparelho comum nunca recebe zoom. */
function fit(){var z=1,w=window.innerWidth,h=window.innerHeight;if(state.tv&&state.hardwareTv)z=Math.min(3,Math.max(1,w/1280));
  var de=document.documentElement;de.style.zoom=z>1.04?String(+z.toFixed(3)):'';
  de.style.setProperty('--vw',(w/z/100).toFixed(3)+'px');de.style.setProperty('--vh',(h/z/100).toFixed(3)+'px');}
fit();window.addEventListener('resize',fit);
bind();setMode('link');try{n.ready();}catch(e){}
if(dev.updated)setTimeout(function(){toast('Interface atualizada para a revisão '+dev.updated+'.',3800);},700);
start();
})();
