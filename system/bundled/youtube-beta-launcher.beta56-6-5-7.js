/* 6.5.7 standalone module; skip only after complete bundled startup. */
(function(w){
if(w.RemoteTV&&w.RemoteTV.activeCoreBundle==='0.56-beta.6.5.7')return;
/* GPL-3.0-only. Remote TV Philco port of NicholasBly/youtube-webos 0.8.4.
   The upstream userscript runs only in an isolated frame, never in the player's origin. */
(function(w,d){'use strict';
var R=w.RemoteTV, source='', screen=d.getElementById('yt3probe'), launch=d.getElementById('yt3'), frame=null, scope=null, active=false, epoch=0, timer=0, token='', rows=[], prior=null, state='idle', lastCode=0,lastAt=0,closedAt=0;
var BUNDLE_URL='https://raw.githubusercontent.com/HyakkimaruPY/remote-tv/main/apps/youtube-beta/userscript-beta56-6-5-6.js', BUNDLE_SHA='0beb6122cf8a6a386c807777dd39753ab90240948816ff32317d628b0f6aaa52', BUNDLE_KEY='remote-tv.youtube-beta.bundle.656';
function loadFork(callback){
    var generation=epoch;
    function valid(s){return !!(s && R.sha256 && R.sha256(s)===BUNDLE_SHA);}
    if(valid(source)){callback(null);return;}
    try{source=w.localStorage.getItem(BUNDLE_KEY)||'';}catch(e){}
    if(valid(source)){mark('fork-cache-verified');callback(null);return;}
    source='';mark('fetching-fork');status('YouTube beta aberto · carregando os módulos do player…');
    scope.fetch(BUNDLE_URL,function(error,body){
        if(!active||generation!==epoch)return;
        if(error){callback('download');return;}
        if(!valid(body)){callback('integrity');return;}
        source=body;try{w.localStorage.setItem(BUNDLE_KEY,source);}catch(e){}
        mark('fork-verified');callback(null);
    },30000);
}
function el(id){return d.getElementById(id);}
function mark(stage){state=stage;rows.push(stage);if(rows.length>16)rows.shift();var out=el('ytBetaLog655');if(out)out.textContent=rows.join('\n');try{w.localStorage.setItem('remote-tv.youtube-beta.diagnostic.v1',JSON.stringify({version:'0.56-beta.6.5.6',upstream:'0.8.4',stages:rows}));}catch(e){} }
function status(s){var n=el('yt3status');if(n)n.textContent=s;}
function backCode(k){return ',4,8,27,158,166,461,462,464,528,1061,10009,'.indexOf(','+k+',')>=0;}
function close(){if(!active)return;active=false;closedAt=new Date().getTime();epoch++;clearTimeout(timer);if(scope)scope.cancel();scope=null;if(frame){frame.src='about:blank';if(frame.parentNode)frame.parentNode.removeChild(frame);frame=null;}screen.className='h';mark('closed');if(prior&&prior.parentNode)prior.focus();}
function controls(){var log=el('ytBetaLog655');if(log){log.style.display=log.style.display==='block'?'none':'block';if(log.style.display==='block')el('yt3back').focus();}}
function childRuntime655(session) {
    var uiSeen=false, rounds=0;
    function send(stage) { parent.postMessage({remoteTVYouTubeBeta:session,stage:stage},'*'); }
    window.__rtvYTStage=send;
    function storage() { var values={};return {getItem:function(k){return Object.prototype.hasOwnProperty.call(values,k)?values[k]:null;},setItem:function(k,v){values[k]=String(v);},removeItem:function(k){delete values[k];},clear:function(){values={};}}; }
    try { window.localStorage.getItem('__probe'); } catch(e) { Object.defineProperty(window,'localStorage',{value:storage(),configurable:true});Object.defineProperty(window,'sessionStorage',{value:storage(),configurable:true}); }
    window.addEventListener('error',function(){send('script-error');},false);
    function back(e) { if(',4,8,27,158,166,461,462,464,528,1061,10009,'.indexOf(','+(e.keyCode||e.which)+',')>=0){e.preventDefault();if(e.stopImmediatePropagation)e.stopImmediatePropagation();else e.stopPropagation();send('back');} }
    document.addEventListener('keydown',back,true);document.addEventListener('irkeypress',back,true);
    document.addEventListener('loadedmetadata',function(e){if(e.target&&e.target.tagName==='VIDEO')send('media-ready');},true);
    document.addEventListener('timeupdate',function(e){var v=e.target;if(!v||v.tagName!=='VIDEO')return;var previous=v.__rtvPreviousTime||0;if(!v.paused&&!v.seeking&&previous>0&&v.currentTime>previous&&!v.__rtvConfirmed){v.__rtvConfirmed=true;send('playing');}v.__rtvPreviousTime=v.currentTime;},true);
    document.addEventListener('error',function(e){if(e.target&&e.target.tagName==='VIDEO')send('media-error');},true);
    var poll=setInterval(function(){rounds++;if(!uiSeen&&document.querySelector('ytlr-app,.ytlr-app,.ytlr-home,.ytlr-guide,#guide,#app')){uiSeen=true;send('ui-ready');}if(uiSeen||rounds>60)clearInterval(poll);},500);
    send('frame-started');
}
function childBootstrap(session) { return '('+childRuntime655.toString()+')('+JSON.stringify(session)+');'; }
function page(html,session){
// Do not provide allow-same-origin: YouTube must never see the IPTV storage or bridge origin.
var boot='<base href="https://www.youtube.com/"><script>'+childBootstrap(session)+'<\/script><script>'+source.replace(/<\/script/gi,'<\\/script')+';if(window.__rtvYTStage)window.__rtvYTStage("fork-loaded");<\/script>';
html=html.replace(/<base\b[^>]*>/gi,'').replace(/<meta\b[^>]*http-equiv\s*=\s*["']?Content-Security-Policy["']?[^>]*>/gi,'');
if(/<head\b[^>]*>/i.test(html))return html.replace(/<head\b[^>]*>/i,function(s){return s+boot;});
return '<!doctype html><html><head>'+boot+'</head><body>'+html+'</body></html>';
}
function open(){
if(active){if(frame)frame.focus();return;}
prior=d.activeElement;active=true;lastCode=13;lastAt=new Date().getTime();var generation=++epoch;token=String(new Date().getTime())+'-'+String(Math.random()).slice(2);rows=[];
screen.className='';screen.innerHTML='<div id="ytBetaHead655"><h1>YouTube beta</h1><button id="yt3back">Voltar</button><button id="ytBetaLogButton655">Diagnóstico</button></div><p id="yt3status"></p><pre id="ytBetaLog655" style="display:none"></pre>';
el('yt3back').onclick=close;el('ytBetaLogButton655').onclick=controls;el('yt3back').focus();
mark('opening');status('Carregando o fork youtube-webos · teste no WebKit atual…');
frame=d.createElement('iframe');frame.id='ytBetaFrame655';
if(!('sandbox' in frame)){mark('sandbox-unavailable');status('Este WebKit não oferece isolamento de página. O fork não pode iniciar nesta versão do navegador.');return;}
frame.setAttribute('sandbox','allow-scripts allow-forms allow-presentation');frame.setAttribute('allow','autoplay; encrypted-media; fullscreen');frame.setAttribute('frameborder','0');frame.setAttribute('allowfullscreen','allowfullscreen');screen.appendChild(frame);
scope=new R.RequestScope();
loadFork(function(forkError){
if(!active||generation!==epoch)return;
if(forkError){mark('fork-'+forkError+'-failed');status('Não foi possível carregar o módulo do YouTube ('+forkError+'). Volte e tente novamente.');return;}
scope.fetch('https://www.youtube.com/tv?env_forceFullAnimation=0&hl=pt&gl=BR',function(error,html){
 if(!active||generation!==epoch)return;
 if(error){mark('page-fetch-failed');status('Falha ao buscar YouTube pelo bridge/TLS atual. Abra Diagnóstico.');return;}
 if(!html||html.length>1500000||!/<(?:html|script|body)\b/i.test(html)){mark('invalid-page');status('Resposta do YouTube incompatível com o carregador beta.');return;}
 mark('page-fetched');frame.src='data:text/html;charset=utf-8,'+encodeURIComponent(page(html,token));frame.focus();
 timer=w.setTimeout(function(){if(!active||generation!==epoch||state==='ui-ready'||state==='playing'||state==='media-ready')return;mark('startup-timeout');status('A interface não confirmou inicialização. Possíveis limites do WebKit, TLS dos recursos ou origem da página; veja Diagnóstico.');el('yt3back').focus();},30000);
},12000);
});
}
function message(e){if(!active||!frame||e.source!==frame.contentWindow||!e.data||e.data.remoteTVYouTubeBeta!==token)return;var stage=e.data.stage;
if(stage==='back'){close();return;}
if(',frame-started,fork-loaded,ui-ready,media-ready,playing,script-error,media-error,'.indexOf(','+stage+',')<0)return;
if(state!==stage)mark(stage);
if(stage==='ui-ready'){clearTimeout(timer);status('Interface YouTube carregada · escolha um vídeo para testar reprodução.');}
else if(stage==='playing'){clearTimeout(timer);status('Reprodução confirmada pelo avanço do relógio do vídeo.');}
else if(stage==='script-error')status('O JavaScript do YouTube encontrou uma incompatibilidade. Abra Diagnóstico.');
else if(stage==='media-error')status('O navegador informou erro de mídia/codec. Abra Diagnóstico.');
}
function key(e){if(!active)return false;var k=e.keyCode||e.which||0,at=new Date().getTime();if(e.preventDefault)e.preventDefault();if(e.stopImmediatePropagation)e.stopImmediatePropagation();else if(e.stopPropagation)e.stopPropagation();
if(k===41)k=13;if(k===lastCode&&at-lastAt<(k===13?400:140))return true;lastCode=k;lastAt=at;
if(backCode(k)){close();return true;}
var a=[el('yt3back'),el('ytBetaLogButton655')],ix=d.activeElement===a[1]?1:0;
if(k===37||k===39)a[k===37?0:1].focus();else if(k===40&&frame)frame.focus();else if(k===38)a[0].focus();else if(k===13||k===41)a[ix].click();return true;}
var css=d.createElement('style');css.textContent='#yt3probe{position:fixed!important;left:0!important;top:0!important;width:1280px!important;height:720px!important;background:#000!important;color:#eee;z-index:900!important;padding:0!important;margin:0!important}#ytBetaHead655{position:absolute;left:16px;top:10px;z-index:3}#ytBetaHead655 h1{display:inline-block;font:22px Arial;margin:0 14px 0 0}#ytBetaHead655 button{height:42px;margin:0 6px;padding:0 18px;background:#111;color:#eee;border:2px solid #555;border-radius:10px;font:18px Arial}#ytBetaHead655 button:focus{border-color:#fff;outline:none}#yt3status{position:absolute;left:16px;top:54px;right:16px;z-index:3;background:rgba(0,0,0,.85);padding:8px;font:15px Arial;margin:0}#ytBetaFrame655{position:absolute;left:0;top:0;width:1280px;height:720px;border:0;background:#000;z-index:1}#ytBetaLog655{position:absolute;z-index:4;right:16px;top:100px;width:450px;max-height:560px;overflow:auto;box-sizing:border-box;padding:20px;border:1px solid #555;border-radius:12px;background:#080808;color:#ddd;font:17px/1.6 monospace}';d.head.appendChild(css);
if(d.addEventListener){d.addEventListener('keydown',function(e){if(active)key(e);else if(new Date().getTime()-closedAt<400&&backCode(e.keyCode||e.which||0)){if(e.preventDefault)e.preventDefault();if(e.stopImmediatePropagation)e.stopImmediatePropagation();}},true);d.addEventListener('irkeypress',function(e){if(active)key(e);else if(new Date().getTime()-closedAt<400&&backCode(e.keyCode||e.which||0)){if(e.preventDefault)e.preventDefault();if(e.stopImmediatePropagation)e.stopImmediatePropagation();}},true);}w.addEventListener('message',message,false);
w.YouTube3Probe={version:'0.56-beta.6.5.6',quietUntil:function(){return closedAt?closedAt+400:0;},open:open,close:close,back:close,key:key,state:function(){return{active:active,stage:state,stages:rows.slice(0)};}};
}(this,document));

}.call(this,this));
