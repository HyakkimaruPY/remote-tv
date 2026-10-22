/* Philco 6.4.2 - focusable low-memory search; smart typing pause, 12-card viewport and auto one-use QR. */
(function(w,d){'use strict';
var R=w.RemoteTV||(w.RemoteTV={}),KEY='remote-tv.libs.beta6.v1',box=null,adapter=null,kind='c',query='',results=[],
 searchJob=null,searchTimer=0,paintTimer=0,nonce=0,origin=null,keys=[],keyIndex=0,zone='input',resultIndex=0,page=-1,
 input=null,grid=null,status=null,qrBox=null,focusText=null,lastType=0,meanInterval=650,lastCode=0,lastAt=0,pair=null;
function make(tag,txt,css){var n=d.createElement(tag);if(txt!==null&&txt!==undefined)n.appendChild(d.createTextNode(txt));if(css)n.style.cssText=css;return n;}
function enabled(){try{return JSON.parse(w.localStorage.getItem(KEY)||'{}').search===true;}catch(e){return false;}}
var atBoot=enabled();
function isOpen(){return !!box;}
function stop(e){if(e.preventDefault)e.preventDefault();if(e.stopImmediatePropagation)e.stopImmediatePropagation();else if(e.stopPropagation)e.stopPropagation();e.cancelBubble=true;e.returnValue=false;}
function clear(){nonce++;clearTimeout(searchTimer);clearTimeout(paintTimer);searchTimer=paintTimer=0;if(searchJob&&searchJob.cancel)searchJob.cancel();searchJob=null;
 if(pair&&w.PhilcoLocalhost642&&w.PhilcoLocalhost642.close)w.PhilcoLocalhost642.close(pair);
 pair=null;results=[];page=-1;
}
function close(){clear();if(box&&box.parentNode)box.parentNode.removeChild(box);box=null;keys=[];input=grid=status=qrBox=focusText=null;if(origin&&origin.focus)origin.focus();}
function focus(n){if(!box||!n)return;var old=box.querySelector('.ph642focus');if(old&&old!==n){old.className=old.className.replace(/\s*ph642focus/g,'');old.style.borderColor='#555';old.style.background='#1b1b1b';old.style.color='#eee';}
 if(n.className.indexOf('ph642focus')<0)n.className+=' ph642focus';
 n.style.borderColor='#fff';n.style.background='#e5e5e5';n.style.color='#050505';n.style.outline='3px solid white';
 try{n.focus();}catch(e){}
 if(focusText)focusText.textContent='Selecionado: '+(n.getAttribute('data-name')||n.textContent||'Busca');
}
function keyfocus(i){if(!keys.length)return;zone='key';keyIndex=Math.min(keys.length-1,Math.max(0,i));focus(keys[keyIndex]);}
function resultFocus(i){if(!results.length)return;zone='result';resultIndex=Math.max(0,Math.min(results.length-1,i));render();focus(d.getElementById('ph642result'+resultIndex));}
function render(){if(!grid||!box)return;var p=Math.floor(resultIndex/12),start=p*12,stopAt=Math.min(results.length,start+12),i,o,button,img,cover,label,foundNode=null;
 if(page===p&&grid.getAttribute('data-count')===(stopAt-start)+'/'+results.length)return;
 grid.innerHTML='';page=p;grid.setAttribute('data-count',(stopAt-start)+'/'+results.length);
 for(i=start;i<stopAt;i++){
  o=results[i];button=make('button',null,'display:inline-block;position:relative;box-sizing:border-box;vertical-align:top;width:47%;margin:2px 1%;height:99px;text-align:left;border:2px solid #555;border-radius:6px;background:#1b1b1b;color:#eee;padding:7px;font:16px Arial;overflow:hidden;');
  button.id='ph642result'+i;button.setAttribute('data-name',o.n||'Sem título');button.setAttribute('data-index',i);
  cover=make('div',null,'display:inline-block;position:relative;vertical-align:middle;float:left;width:'+(kind==='c'?'76':'66')+'px;height:'+(kind==='c'?'76':'83')+'px;background:#343434;margin-right:8px;overflow:hidden;');
  if(o.p&&/^https?:\/\//i.test(o.p)){img=make('img');img.src=o.p;img.alt='';img.style.cssText='display:block;width:100%;height:100%;object-fit:cover;';img.onerror=function(){this.style.display='none';};cover.appendChild(img);}
  else{cover.appendChild(make('div',(o.n||'?').charAt(0).toUpperCase(),'font-size:30px;color:#aaa;text-align:center;padding-top:19px'));}
  label=make('div',null,'display:block;margin-top:5px;overflow:hidden;height:72px;');
  label.appendChild(make('div',o.n||'Sem título','font:16px Arial;color:inherit;max-height:53px;overflow:hidden;'));
  label.appendChild(make('div',o._catName64||'','font:12px Arial;color:#aaa;margin-top:3px;white-space:nowrap;overflow:hidden;'));
  button.appendChild(cover);button.appendChild(label);
  (function(item,idx,b){b.onclick=function(){var h=adapter,t=kind;close();if(h&&h.open)h.open(t,item);};b.onfocus=function(){if(box){zone='result';resultIndex=idx;}};})(o,i,button);
  grid.appendChild(button);if(i===resultIndex)foundNode=button;
 }
 if(zone==='result'&&foundNode)focus(foundNode);
}
function accepted(arr,done,msg,n){if(!box||n!==nonce)return;results=arr||[];
 if(status)status.textContent=(results.length?results.length+' encontrados · ':'')+(msg||'')+(done?'':' · verificando categorias');
 clearTimeout(paintTimer);
 // Rendering at most 12 items, and not repainting on every completed category.
 if(zone==='result'&&resultIndex>=results.length){zone='key';}
 paintTimer=setTimeout(function(){if(box&&n===nonce)render();},180);
}
function submit(){if(!box||!adapter||!adapter.search)return;if(searchJob&&searchJob.cancel)searchJob.cancel();searchJob=null;
 var n=++nonce;if(query.length<3){results=[];resultIndex=0;page=-1;render();if(status)status.textContent='Digite pelo menos 3 letras';return;}
 results=[];resultIndex=0;page=-1;render();
 if(status)status.textContent='Consultando as categorias por API…';
 searchJob=adapter.search(kind,query,function(a,done,msg){accepted(a,done,msg,n);});
}
function changed(s,fromPhone){var now=new Date().getTime(),gap=lastType?now-lastType:0;
 if(!fromPhone&&gap>=100&&gap<5500)meanInterval=Math.round(meanInterval*.65+gap*.35);
 if(!fromPhone)lastType=now;
 query=String(s||'').slice(0,120);if(input&&input.value!==query)input.value=query;
 clearTimeout(searchTimer);
 if(searchJob&&searchJob.cancel){searchJob.cancel();searchJob=null;}
 nonce++;
 if(query.length<3){results=[];resultIndex=0;page=-1;render();if(status)status.textContent='Digite pelo menos 3 letras';return;}
 var wait=fromPhone?950:Math.min(3000,Math.max(850,Math.round(meanInterval*1.9+480)));
 if(status)status.textContent='Aguardando pausa na digitação ('+wait+' ms)…';
 searchTimer=setTimeout(submit,wait);
}
function append(c){changed(query+c,false);}
function pairStart(){if(!box||!qrBox)return;
 qrBox.textContent='Preparando QR Code de uso único…';
 if(!w.PhilcoLocalhost642||!w.PhilcoLocalhost642.begin){qrBox.textContent='Módulo LAN não carregado nesta TV.';return;}
 w.PhilcoLocalhost642.begin(function(err,p){
  if(!box){if(p)w.PhilcoLocalhost642.close(p);return;}
  if(err||!p){qrBox.textContent='Servidor local indisponível. Busca pelo controle continua disponível.';return;}
  pair=p;
  if(typeof w.qrcode!=='function'){qrBox.textContent='Gerador de QR indisponível.';return;}
  try{var qr=w.qrcode(0,'M');qr.addData(p.phoneUrl);qr.make();qrBox.innerHTML='';
   var pic=make('img');pic.src=qr.createDataURL(4,2);pic.style.cssText='display:block;width:150px;height:150px;background:#fff;margin:1px auto;';
   qrBox.appendChild(pic);qrBox.appendChild(make('div','Chave de uso único · nova a cada abertura','font:13px Arial;color:#aaa;text-align:center'));
   w.PhilcoLocalhost642.watch(p,function(value){if(box&&pair===p)changed(value,true);},function(){if(box&&pair===p)qrBox.textContent='QR consumido ou expirado. Saia e abra a busca novamente.';});
  }catch(e){qrBox.textContent='Erro ao gerar QR; use o teclado da TV.';}
 });
}
function open(type){if(box||!atBoot)return false;
 adapter=w.PhilcoSearchAdapter;if(!adapter||!adapter.search||!adapter.open||(adapter.active&&!adapter.active()))return false;
 kind=type==='m'||type==='s'?type:'c';query='';results=[];origin=d.activeElement;meanInterval=650;lastType=0;zone='input';keyIndex=0;resultIndex=0;page=-1;
 box=make('section',null,'position:fixed;left:0;top:0;z-index:9100;width:1280px;height:720px;box-sizing:border-box;background:#080808;color:#eee;font:18px Arial;');
 box.id='ph642overlay';
 var left=make('div',null,'position:absolute;left:0;top:0;width:44%;height:100%;box-sizing:border-box;border-right:1px solid #444;padding:14px 18px;');
 left.appendChild(make('h2','Busca · '+(kind==='c'?'TV ao vivo':kind==='m'?'Filmes':'Séries'),'font:25px Arial;margin:0 0 8px;'));
 input=make('input');input.id='ph642input';input.maxLength=120;input.style.cssText='width:98%;height:41px;box-sizing:border-box;background:#181818;color:#fff;border:2px solid #777;padding:6px;font:23px Arial;';
 input.setAttribute('data-name','Barra de busca');input.oninput=function(){changed(input.value,false);};left.appendChild(input);
 focusText=make('div','Selecionado: Barra de busca','height:22px;font:15px Arial;color:#ccc;margin:5px 0 3px');left.appendChild(focusText);
 var keyboard=make('div',null,'height:274px;overflow:hidden;white-space:normal;');keyboard.id='ph642keyboard';
 var chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 '.split('');chars.push('⌫');chars.push('Voltar');
 var i;
 for(i=0;i<chars.length;i++){(function(ch,idx){var b=make('button',ch===' '?'_':ch,'display:inline-block;vertical-align:top;width:13.5%;height:42px;margin:2px .35%;background:#1b1b1b;border:2px solid #555;border-radius:4px;color:#eee;font:17px Arial;padding:2px;');
  b.setAttribute('data-name',ch===' '?'Espaço':ch);b.onclick=function(){if(ch==='⌫')changed(query.slice(0,-1),false);else if(ch==='Voltar')close();else append(ch);};
  b.onfocus=function(){if(box){zone='key';keyIndex=idx;}};keys.push(b);keyboard.appendChild(b);
 })(chars[i],i);}
 left.appendChild(keyboard);
 left.appendChild(make('div','Teclado do celular (QR automático)','font:16px Arial;margin-top:4px;'));
 qrBox=make('div','Verificando servidor LAN…','height:184px;border:1px solid #333;padding:5px;margin-top:5px;box-sizing:border-box;font:15px Arial;color:#aaa;text-align:center;');
 left.appendChild(qrBox);box.appendChild(left);
 var right=make('div',null,'position:absolute;left:44%;top:0;width:56%;height:100%;padding:16px;box-sizing:border-box;');
 status=make('div','Digite pelo menos 3 letras','font:16px Arial;height:36px;color:#aaa');
 right.appendChild(status);
 grid=make('div',null,'height:650px;overflow:hidden;');
 grid.id='ph642results';right.appendChild(grid);box.appendChild(right);d.body.appendChild(box);
 focus(input);pairStart();return true;
}
function key(e){var k=e.keyCode||e.which||0;if(!box){
 if(k===403&&atBoot&&w.PhilcoSearchAdapter&&(!R.libraryManager||!R.libraryManager.isOpen||!R.libraryManager.isOpen())){
  if(open(w.PhilcoSearchAdapter.currentCategory?w.PhilcoSearchAdapter.currentCategory():'c'))stop(e);
 }return;}
 if(e.type==='keyup'||e.type==='keypress')return;
 var now=new Date().getTime();if(k===lastCode&&now-lastAt<115){stop(e);return;}lastCode=k;lastAt=now;
 var isNav=k===37||k===38||k===39||k===40,ok=k===13||k===41,back=k===8||k===27||k===461||k===462||k===528||k===10009;
 if(!isNav&&!ok&&!back&&k!==403)return;
 stop(e);
 if(back){close();return;}if(k===403)return;
 if(zone==='input'){
  if(k===40||ok){keyfocus(0);return;}if(k===39&&results.length){resultFocus(0);return;}return;
 }
 if(zone==='key'){
  if(ok){if(keys[keyIndex]&&keys[keyIndex].click)keys[keyIndex].click();return;}
  if(k===37){keyfocus(keyIndex>0?keyIndex-1:keyIndex);return;}
  if(k===39){if((keyIndex%7===6||keyIndex===keys.length-1)&&results.length){resultFocus(resultIndex);return;}keyfocus(Math.min(keys.length-1,keyIndex+1));return;}
  if(k===38){if(keyIndex<7){zone='input';focus(input);}else keyfocus(keyIndex-7);return;}
  if(k===40){keyfocus(Math.min(keys.length-1,keyIndex+7));return;}
 }
 if(zone==='result'){
  if(ok){var b=d.getElementById('ph642result'+resultIndex);if(b)b.click();return;}
  if(k===37){if(resultIndex%2===0)keyfocus(keyIndex);else resultFocus(resultIndex-1);return;}
  if(k===39){if(resultIndex%2===0&&resultIndex+1<results.length)resultFocus(resultIndex+1);return;}
  if(k===38){if(resultIndex>=2)resultFocus(resultIndex-2);else{zone='input';focus(input);}return;}
  if(k===40){if(resultIndex+2<results.length)resultFocus(resultIndex+2);return;}
 }
}
if(d.addEventListener){d.addEventListener('keydown',key,true);d.addEventListener('irkeypress',key,true);}
w.PhilcoSearch642={open:open,close:close,isOpen:isOpen,enabled:function(){return atBoot;},_typingDelay:function(){return Math.min(3000,Math.max(850,Math.round(meanInterval*1.9+480)));}};
if(w.PhilcoSearchDock64)w.PhilcoSearchDock64();
})(this,document);
