/* Philco Beta6 recovery: ES5 diagnostics; on-demand only. */
(function(w,d){
'use strict';
var R=w.RemoteTV||(w.RemoteTV={}),entry=d.getElementById('rtvLibs');
if(!entry)return;
var KEY='remote-tv.libs.beta6.v1',WASM='AGFzbQEAAAABBwFgAn9/AX8DAgEABAUBcAEBAQUDAQACBggBfwFBgIgECwcVAgZtZW1vcnkCAAhjbGFzc2lmeQAACiQBIgBBAEEAQQJBASABQbkXSRsgAUEASBsgAEHwfGpBuH5JGws=';
var flags={},libs=[],panel=null,rows=null,mode=null,active=false,prior=null,wasm=null,wasmStarted=false;
try{flags=JSON.parse(w.localStorage.getItem(KEY)||'{}')||{};}catch(e){}
function el(tag,txt,css){var x=d.createElement(tag);if(txt!=null)x.textContent=txt;if(css)x.style.cssText=css;return x;}
var btnCSS='display:inline-block!important;min-width:145px;height:43px;margin:5px 10px 5px 0;padding:8px 13px;background:#181818!important;color:#eee!important;border:1px solid #666!important;border-radius:4px!important;font:17px Arial;';
function save(){var x={},i;for(i=0;i<libs.length;i++)x[libs[i].id]=libs[i].on;try{w.localStorage.setItem(KEY,JSON.stringify(x));}catch(e){}}
function classify(code,ms){try{if(wasm)return wasm(code|0,ms|0);}catch(e){wasm=null;}return code>=200&&code<400?(ms<=3000?2:1):0;}
function wasmMode(){return wasm?'WebAssembly ativo':'ES5 compatível';}
function setMode(){if(mode)mode.textContent=wasmMode();}
function activateWasm(){
if(wasmStarted)return;wasmStarted=true;
if(!w.WebAssembly||typeof w.WebAssembly.instantiate!='function'||!w.Uint8Array||!w.atob)return;
try{var str=w.atob(WASM),bytes=new w.Uint8Array(str.length),i;for(i=0;i<str.length;i++)bytes[i]=str.charCodeAt(i);
w.WebAssembly.instantiate(bytes,{}).then(function(x){var inst=x.instance||x;
if(inst&&inst.exports&&typeof inst.exports.classify=='function'&&inst.exports.classify(200,5)===2&&inst.exports.classify(500,5)===0)wasm=inst.exports.classify;
setMode();},function(){setMode();});}catch(e){setMode();}
}
function cancel(lib){lib.epoch++;lib.running=false;if(lib.scope){try{lib.scope.cancel();}catch(e){}}lib.scope=null;}
function update(lib){if(!lib.switchBtn)return;lib.switchBtn.textContent=lib.on?'Desativar':'Ativar';lib.testBtn.disabled=!lib.on||lib.running;lib.testBtn.style.opacity=lib.on?'1':'.5';if(!lib.on)lib.result.textContent='Desativada';}
function toggle(lib){cancel(lib);lib.on=!lib.on;save();update(lib);}
function errorText(err){var x=String(err||''),m=/^HTTP (\d{3})/.exec(x);if(m)return 'HTTP '+m[1];return /timeout/i.test(x)?'Tempo esgotado':'Falha de transporte';}
function execute(lib){
if(!lib.on||lib.running)return;
if(!R.RequestScope){lib.result.textContent='Bridge indisponível';return;}
cancel(lib);lib.running=true;lib.scope=new R.RequestScope();var epoch=lib.epoch;lib.result.textContent='Testando…';update(lib);
function done(ok,msg){
if(lib.epoch!==epoch||!lib.on)return;
lib.running=false;lib.result.textContent=(ok?'OK · ':'Falha · ')+msg;
if(lib.scope){try{lib.scope.cancel();}catch(e){}}lib.scope=null;update(lib);
}
try{lib.test(lib.scope,done);}catch(e){done(false,'Falha ao iniciar diagnóstico');}
}
function row(lib){
var wrap=el('div',null,'border:1px solid #444;background:#000;padding:15px;margin:12px 0;border-radius:4px;');
wrap.appendChild(el('div',lib.title,'font-size:22px;color:#fff;margin-bottom:5px;'));
lib.switchBtn=el('button','',btnCSS);lib.testBtn=el('button','Testar',btnCSS);
lib.result=el('div',lib.on?'Pronta · teste manual':'Desativada','color:#aaa;font-size:16px;margin-top:6px;min-height:22px;');
lib.switchBtn.onclick=function(){toggle(lib);};lib.testBtn.onclick=function(){execute(lib);};
wrap.appendChild(lib.switchBtn);wrap.appendChild(lib.testBtn);wrap.appendChild(lib.result);rows.appendChild(wrap);update(lib);
}
function register(def){var i,id=def&&def.id;if(!/^[a-z][a-z0-9_-]{0,24}$/.test(String(id||''))||typeof def.test!='function'||!def.title)return false;
for(i=0;i<libs.length;i++)if(libs[i].id===id)return false;
var lib={id:id,title:String(def.title).slice(0,60),test:def.test,on:typeof flags[id]=='boolean'?flags[id]:!!def.enabled,epoch:0,running:false,scope:null};
libs.push(lib);if(rows)row(lib);return true;}
function close(){if(!active)return;active=false;for(var i=0;i<libs.length;i++)if(libs[i].running){cancel(libs[i]);libs[i].result.textContent='Cancelada';update(libs[i]);}
panel.style.display='none';if(prior&&prior.focus)prior.focus();}
function open(){
prior=d.activeElement||entry;
if(!panel){
panel=el('section',null,'position:fixed;z-index:9000;left:0;top:0;width:1280px;height:720px;box-sizing:border-box;padding:35px 105px;background:#000!important;color:#eee;font:19px Arial;overflow:hidden;');panel.id='rtvLibPanel';
panel.appendChild(el('h1','Bibliotecas · Beta 6','font-size:28px;color:#fff;margin-bottom:12px;'));
panel.appendChild(el('p','Ative, desative e teste bibliotecas sem modificar a playlist.','font-size:17px;color:#aaa;margin:8px 0 12px;'));
mode=el('div','ES5 compatível','font-size:17px;color:#bbb;');panel.appendChild(mode);
rows=el('div',null,'margin-top:12px;');panel.appendChild(rows);
for(var i=0;i<libs.length;i++)row(libs[i]);
panel.appendChild(el('div','HTTPS verifica acesso via bridge; não inspeciona certificados TLS.','font-size:16px;color:#aaa;margin:14px 0;'));
var reset=el('button','Reiniciar motores',btnCSS),back=el('button','Voltar',btnCSS);
reset.id='rtvLibReset';back.id='rtvLibBack';back.onclick=close;
reset.onclick=function(){close();try{if(w.RawPlayer&&w.RawPlayer.close)w.RawPlayer.close();}catch(e){}try{w.location.reload(true);}catch(e){}};
panel.appendChild(reset);panel.appendChild(back);d.body.appendChild(panel);
}
panel.style.display='block';active=true;activateWasm();if(libs.length)libs[0].switchBtn.focus();else d.getElementById('rtvLibBack').focus();
}
function prevent(e){if(e.preventDefault)e.preventDefault();if(e.stopPropagation)e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();e.returnValue=false;}
function onkey(e){
if(!active)return false;
var k=e.keyCode||e.which||0,list=[],i,p=-1;
if(k===8||k===27||k===461||k===10009||k===166){prevent(e);close();return true;}
if(k===38||k===40||k===37||k===39){
for(i=0;i<libs.length;i++){list.push(libs[i].switchBtn);if(libs[i].on)list.push(libs[i].testBtn);}
list.push(d.getElementById('rtvLibReset'));list.push(d.getElementById('rtvLibBack'));
for(i=0;i<list.length;i++)if(list[i]===d.activeElement){p=i;break;}
p+=(k===40||k===39?1:-1);if(p<0)p=list.length-1;if(p>=list.length)p=0;
prevent(e);if(list[p])list[p].focus();return true;}
if(k===13||k===41){var b=d.activeElement;prevent(e);if(b&&b.click)b.click();return true;}
prevent(e);return true;
}
if(d.addEventListener)d.addEventListener('keydown',onkey,true);
var ir=d.onirkeypress;d.onirkeypress=function(e){if(onkey(e||w.event))return false;return ir?ir.call(d,e):true;};
var target='https://raw.githubusercontent.com/HyakkimaruPY/remote-tv/main/version';
register({id:'network',title:'Rede e bridge local',enabled:true,test:function(scope,done){
var since=new Date().getTime();
scope.local('/health',function(err){
if(err){done(false,'Bridge local: '+errorText(err));return;}
if(classify(200,new Date().getTime()-since)<1){done(false,'Bridge local indisponível');return;}
var started=new Date().getTime();
scope.fetch(target,function(e){var ms=new Date().getTime()-started;done(!e&&classify(200,ms)>0,e?'Internet: '+errorText(e):'Bridge e Internet · '+ms+' ms');},6000);
},2500);
}});
register({id:'https',title:'HTTPS / TLS pelo bridge',enabled:true,test:function(scope,done){
var started=new Date().getTime();scope.fetch(target,function(e){var ms=new Date().getTime()-started,ok=!e&&classify(200,ms)>0;
done(ok,ok?'HTTPS acessível · '+ms+' ms (certificado não inspecionado)':errorText(e)+' · sem inspeção TLS');},6000);
}});
entry.onclick=open;
R.libraryManager={register:register,open:open,close:close,engine:wasmMode,enabled:function(id){for(var i=0;i<libs.length;i++)if(libs[i].id===id)return !!libs[i].on;return false;}};
}(this,document));
