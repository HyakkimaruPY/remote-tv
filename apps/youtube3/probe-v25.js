(function(w,d){'use strict';
var open=0,hold=0,btn=d.getElementById('yt3'),box=d.getElementById('yt3probe'),frame=d.getElementById('yt3frame'),back=d.getElementById('yt3back'),status=d.getElementById('yt3status');
if(!btn||!box||!frame||!back||!status)return;
var URL='https://www.youtube.com/embed/M7lc1UVf-VE?autoplay=1&controls=1&rel=0&playsinline=1&hl=pt-BR';
function code(e){return(e&&(e.which||e.keyCode))||(w.event&&(w.event.which||w.event.keyCode))||0}
function isBack(k){return',4,8,27,158,166,461,462,464,528,1061,10009,'.indexOf(','+k+',')>=0}
function stop(e){if(e&&e.preventDefault)e.preventDefault();else if(e)e.returnValue=false;if(e&&e.stopPropagation)e.stopPropagation()}
function close(){open=0;frame.onload=null;try{frame.src='about:blank'}catch(x){}box.className='h';status.textContent='Embed oficial do YouTube.';try{btn.focus()}catch(x){}}
function launch(){open=1;box.className='';status.textContent='Carregando embed oficial do YouTube...';frame.onload=function(){if(open)status.textContent='Embed carregado. Verifique imagem, áudio e controles.'};try{frame.src=URL}catch(x){status.textContent='Falha ao abrir o iframe: '+x}try{back.focus()}catch(x){}}
btn.onclick=launch;back.onclick=close;
function wrap(name){var prev=d[name];d[name]=function(e){var k=code(e),t=(new Date()).getTime();if(isBack(k)&&(open||t<hold)){stop(e);if(open){hold=t+450;close()}return false}return prev?prev.call(d,e):true}}
wrap('onkeydown');wrap('onkeypress');wrap('onkeyup');wrap('onirkeypress');
w.YouTube3Probe={open:launch,close:close,videoId:'M7lc1UVf-VE'};
}(this,document));
