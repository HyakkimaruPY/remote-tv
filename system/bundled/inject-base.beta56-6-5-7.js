/* 6.5.7 standalone module; skip only after complete bundled startup. */
(function(w){
if(w.RemoteTV&&w.RemoteTV.activeCoreBundle==='0.56-beta.6.5.7')return;
/* RemoteTV beta 3. ES5 source; compatibility aliases are intentional. */
(function (windowRef) {
    'use strict';
    if (windowRef.RemoteTV)
        windowRef.RemoteTV.injectionBase = '2026.09.17';
}(this));

}.call(this,this));
