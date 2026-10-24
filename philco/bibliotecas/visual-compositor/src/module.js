/* Philco Beta 6.5 lightweight visual compositor. Reversible CSS only. */
(function (w, d) {
'use strict';
var R = w.RemoteTV || (w.RemoteTV = {}), m = R.libraryManager, STYLE = 'rtvVisualCompositor65';
if (!m) return;
function start() {
    var s;
    if (d.getElementById(STYLE)) return;
    s = d.createElement('style'); s.id = STYLE;
    s.textContent = '.rtv65-motion #menu.rtv-launcher65 .rtv65tile,.rtv65-motion #rtvLibPanel .rtvLib65Btn{-webkit-transition:background-color 80ms linear,border-color 80ms linear,opacity 80ms linear;transition:background-color 80ms linear,border-color 80ms linear,opacity 80ms linear}' +
        '.rtv65-motion #rtvLibPanel,.rtv65-motion #ph642overlay{-webkit-transform:translateZ(0)}';
    d.head.appendChild(s);
    if (d.documentElement.className.indexOf('rtv65-motion') < 0) d.documentElement.className += ' rtv65-motion';
}
function stop() {
    var s = d.getElementById(STYLE);
    if (s && s.parentNode) s.parentNode.removeChild(s);
    d.documentElement.className = d.documentElement.className.replace(/(?:^|\s)rtv65-motion(?=\s|$)/g,'').replace(/^\s+|\s+$/g,'');
}
m.register({id:'visual-compositor',title:'Compositor visual · transições curtas',enabled:true,category:'render',restartRequired:false,start:start,stop:stop,
 test:function(scope,done){done(!!d.getElementById(STYLE),'CSS reversível · somente opacity/border/background · layer promotion em overlays');}});
}(this, document));
