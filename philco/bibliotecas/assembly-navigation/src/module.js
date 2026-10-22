/* Philco 6.4.1 opt-in low-level Assembly helper; ES5 fallback remains automatic. */
(function (w) {
'use strict';
var R = w.RemoteTV || (w.RemoteTV = {}), manager = R.libraryManager;
if (!manager) return;
manager.register({
    id:'assembly-navigation',
    title:'Assembly · foco e transição modular',
    enabled:true,
    restartRequired:false,
    start:function () { manager.setAssemblyActive(true); },
    stop:function () { manager.setAssemblyActive(false); },
    test:function (scope, done) {
        var next = manager._nav(0, -1, 5), ok = next === 4;
        done(ok, (ok ? 'Navegação circular OK · ' : 'Falha de navegação · ') + manager.engine());
    }
});
})(this);
