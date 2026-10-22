/* Philco Beta 6.4 - ES5 contextual search + authenticated optional phone pairing */
(function(w,d){'use strict';
var R=w.RemoteTV||(w.RemoteTV={}),KEY='remote-tv.libs.beta6.v1',RELAY='philco.beta64.relay';
var box=null,kind='c',query='',input=null,grid=null,info=null,qrBox=null,pair=null,scope=null,pollTimer=0,searchTimer=0,searchJob=null,requestSeq=0,adapter=null,origin=null,results=[],status=null,buttons=[];
function el(tag,txt,css){var x=d.createElement(tag);if(txt!==undefined&&txt!==null)x.appendChild(d.createTextNode(txt));if(css)x.style.cssText=css;return x;}
function savedEnabled(){try{var obj=JSON.parse(w.localStorage.getItem(KEY)||'{}');return obj.search===true;}catch(e){return false;}}
var bootEnabled=savedEnabled();
function enabled(){return bootEnabled;}
function stop(e){if(e.preventDefault)e.preventDefault();if(e.stopPropagation)e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();e.returnValue=false;}
function clear(){requestSeq++;clearTimeout(searchTimer);clearTimeout(pollTimer);searchTimer=pollTimer=0;if(searchJob&&searchJob.cancel)searchJob.cancel();searchJob=null;if(scope){scope.cancel();scope=null;}pair=null;results=[];}
function close(){clear();if(box&&box.parentNode)box.parentNode.removeChild(box);box=null;if(origin&&origin.focus)origin.focus();}
function focusResult(i){if(i<0)return;if(i>=results.length)return;var b=d.getElementById('ph64item'+i);if(b){b.focus();if(b.scrollIntoView)b.scrollIntoView(false);}}
function draw(){if(!grid)return;grid.innerHTML='';buttons=[];var i;for(i=0;i<results.length;i++){(function(o,idx){var b=el('button',(o.n||'Sem título')+' · '+(o._catName64||''),'display:inline-block;vertical-align:top;box-sizing:border-box;width:47%;height:90px;margin:1% 1%;padding:10px 12px;background:#191919;color:#eee;border:1px solid #555;border-radius:5px;font:17px Arial;text-align:left;overflow:hidden;');b.id='ph64item'+idx;b.className='ph64result';b.setAttribute('data-idx',idx);b.onclick=function(){var current=adapter,which=kind;close();if(current&&current.open)current.open(which,o);};grid.appendChild(b);buttons.push(b);})(results[i],i);}}
function perform(){if(!box||!adapter||!adapter.search)return;var seq=++requestSeq;if(searchJob&&searchJob.cancel)searchJob.cancel();searchJob=null;if(status)status.textContent='Buscando…';searchJob=adapter.search(kind,query,function(data,done,msg){if(!box||seq!==requestSeq)return;var focus=d.activeElement,selected=focus&&focus.getAttribute&&focus.getAttribute('data-idx');results=data||[];draw();if(selected!==null&&selected!==undefined)focusResult(+selected);if(status)status.textContent=results.length+' resultado(s)'+(msg?' · '+msg:'')+(done?'':' · buscando…');});}
function changed(x,source){query=String(x||'').slice(0,120);if(input&&input.value!==query)input.value=query;clearTimeout(searchTimer);searchTimer=setTimeout(perform,source==='phone'?120:320);}
function sendKey(c){var cfg=d.getElementById('ph64relay');if(cfg&&d.activeElement===cfg){cfg.value+=c;return;}changed(query+c,'tv');if(input)input.focus();}
function config(){try{return String(w.localStorage.getItem(RELAY)||'').replace(/\/$/,'');}catch(e){return '';}}
function syncPair(){if(!pair||!box||!scope)return;var my=pair,addr=my.addr;scope.fetch(addr+'/session/poll?sid='+encodeURIComponent(my.sid)+'&token='+encodeURIComponent(my.tvToken)+'&_='+new Date().getTime(),function(err,body){if(!box||pair!==my)return;if(!err){try{var v=JSON.parse(body);if(v.seq>my.seq){my.seq=v.seq;changed(v.q,'phone');}if(v.expiresIn<=0){qrBox.textContent='Sessão expirada. Gere outro QR.';pair=null;return;}}catch(e){}}pollTimer=setTimeout(syncPair,1600);},6500);}
function createPair(){var addr=config();if(!/^https?:\/\/[^/]+/i.test(addr)){qrBox.textContent='Configure um servidor de pareamento acessível na rede.';return;}if(!R.RequestScope){qrBox.textContent='Ponte de rede indisponível.';return;}
if(scope)scope.cancel();clearTimeout(pollTimer);pair=null;scope=new R.RequestScope();qrBox.textContent='Gerando sessão segura…';
scope.fetch(addr+'/session/create?_='+new Date().getTime(),function(err,body){if(!box)return;var data;if(err){qrBox.textContent='Servidor indisponível';return;}try{data=JSON.parse(body);}catch(e){qrBox.textContent='Resposta inválida';return;}
if(!data.sid||!data.tvToken||!data.phoneUrl){qrBox.textContent='Serviço não configurado';return;}
if(typeof w.qrcode!=='function'){qrBox.textContent='Gerador QR ausente';return;}
try{var qr=w.qrcode(0,'M');qr.addData(data.phoneUrl);qr.make();qrBox.innerHTML='';var im=el('img');im.src=qr.createDataURL(5,2);im.style.cssText='height:158px;width:158px;background:#fff';qrBox.appendChild(im);qrBox.appendChild(el('div','Escaneie para digitar pelo celular','font-size:14px'));pair={sid:data.sid,tvToken:data.tvToken,seq:0,addr:addr};syncPair();}catch(e){qrBox.textContent='Não foi possível gerar o QR';}
},8000);}
function open(t){if(box||!enabled())return false;adapter=w.PhilcoSearchAdapter;if(!adapter||!adapter.search||!adapter.open||(adapter.active&&!adapter.active()))return false;origin=d.activeElement;kind=t==='m'||t==='s'?t:'c';query='';results=[];box=el('section',null,'position:fixed;z-index:9100;left:0;top:0;width:1280px;height:720px;box-sizing:border-box;background:#060606;color:#eee;font:19px Arial;');
var left=el('div',null,'position:absolute;left:0;top:0;width:43%;height:100%;box-sizing:border-box;padding:14px 21px;border-right:1px solid #333;overflow:hidden;');
left.appendChild(el('h2','Busca · '+(kind==='c'?'Ao vivo':kind==='m'?'Filmes':'Séries'),'margin:2px 0 12px;font:27px Arial;'));
input=el('input');input.id='ph64query';input.maxLength=120;input.style.cssText='display:block;width:97%;height:39px;font:21px Arial;background:#161616;color:#fff;border:1px solid #777;padding:5px';input.oninput=function(){changed(input.value,'tv');};left.appendChild(input);
var kb=el('div',null,'margin-top:10px;height:222px;overflow:hidden;');var chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .:/_-';for(var i=0;i<chars.length;i++){(function(c){var b=el('button',c===' '?'_':c,'display:inline-block;width:8.1%;height:43px;margin:2px .3%;background:#242424;color:#eee;border:1px solid #666;border-radius:4px;font:17px Arial;');b.onclick=function(){sendKey(c);};kb.appendChild(b);})(chars.charAt(i));}
var del=el('button','⌫ Apagar','padding:8px;margin:4px;background:#222;color:#fff;border:1px solid #777');del.onclick=function(){var cfg=d.getElementById('ph64relay');if(cfg&&d.activeElement===cfg){cfg.value=cfg.value.slice(0,-1);return;}changed(query.slice(0,-1),'tv');input.focus();};kb.appendChild(del);
var back=el('button','Voltar','padding:8px;margin:4px;background:#222;color:#fff;border:1px solid #777');back.onclick=close;kb.appendChild(back);left.appendChild(kb);
left.appendChild(el('div','Teclado pelo celular · QR Code','font-size:17px;margin:6px 0'));
var cfg=el('input');cfg.value=config();cfg.placeholder='http://IP-DO-SERVIDOR:8766';cfg.id='ph64relay';cfg.style.cssText='background:#131313;color:#eee;border:1px solid #666;padding:7px;width:90%;font:15px Arial';cfg.onchange=function(){try{w.localStorage.setItem(RELAY,cfg.value.replace(/\/$/,''));}catch(e){}};left.appendChild(cfg);
var qrBtn=el('button','Gerar QR','margin:6px 0;background:#222;color:#fff;border:1px solid #777;padding:7px');qrBtn.onclick=function(){try{w.localStorage.setItem(RELAY,cfg.value.replace(/\/$/,''));}catch(e){}createPair();};left.appendChild(qrBtn);
qrBox=el('div','Configure o endereço do serviço para conectar o celular.','height:190px;margin:4px 0;font-size:14px;color:#bbb');left.appendChild(qrBox);box.appendChild(left);
var right=el('div',null,'position:absolute;left:43%;top:0;width:57%;height:100%;padding:18px;box-sizing:border-box');
status=el('div','Digite um título para pesquisar','height:26px;font-size:16px;color:#bbb');right.appendChild(status);
grid=el('div',null,'height:642px;overflow:auto;');right.appendChild(grid);box.appendChild(right);d.body.appendChild(box);input.focus();changed('','tv');return true;}
function key(e){var k=e.keyCode||e.which||0;if(!box){if(k===403&&enabled()&&w.PhilcoSearchAdapter){var a=w.PhilcoSearchAdapter;if(open(a.currentCategory?a.currentCategory():'c'))stop(e);}return;}
if(k===403){stop(e);return;}
if(k===27||k===8||k===461||k===10009){stop(e);close();return;}
var x=d.activeElement,ix=x&&x.getAttribute&&x.getAttribute('data-idx');
if(ix!==null&&ix!==undefined){ix=+ix;if(k===37||k===39||k===38||k===40){stop(e);focusResult(ix+(k===37?-1:k===39?1:k===38?-2:2));return;}if(k===13||k===41){stop(e);x.click();return;}}
if(x===input&&k===39&&results.length){stop(e);focusResult(0);}
}
if(d.addEventListener){d.addEventListener('keydown',key,true);d.addEventListener('irkeypress',key,true);}
w.PhilcoSearch64={open:open,close:close,enabled:enabled,isOpen:function(){return !!box;}};
if(w.PhilcoSearchDock64) w.PhilcoSearchDock64();
})(this,document);
