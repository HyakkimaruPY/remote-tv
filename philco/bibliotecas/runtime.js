/* Philco modular runtime - ES5 host, independent of WASM availability. */
(function(root){
'use strict';
var key='philco.modules.v1', modules={}, states={}, logs=[], pending=false;
function record(id,msg){logs.push({at:(new Date()).toISOString(),id:id,message:String(msg)});if(logs.length>100)logs.shift();}
function saved(){try{return JSON.parse(root.localStorage.getItem(key)||'{}');}catch(e){return {};}}
function persist(s){try{root.localStorage.setItem(key,JSON.stringify(s));}catch(e){record('host','storage unavailable');}}
function supported(){return typeof root.WebAssembly==='object'&&typeof root.WebAssembly.instantiate==='function';}
function register(m){if(!m||!m.id||typeof m.start!=='function'||typeof m.stop!=='function')throw Error('Invalid module');if(modules[m.id])throw Error('Duplicate module');modules[m.id]=m;states[m.id]='disabled';}
function enable(id){var m=modules[id];if(!m)throw Error('Unknown module');if(m.runtime==='wasm'&&!supported()){record(id,'WASM unavailable');return {ok:false,reason:'WebAssembly unavailable on this TV'};}var s=saved();s[id]=true;persist(s);if(m.restartRequired){pending=true;return {ok:true,restart:true};}try{m.start(api);states[id]='enabled';return {ok:true};}catch(e){states[id]='failed';record(id,e.message||e);return {ok:false,reason:String(e)};}}
function disable(id){var m=modules[id];if(!m)throw Error('Unknown module');var s=saved();s[id]=false;persist(s);try{m.stop();states[id]='disabled';}catch(e){record(id,e.message||e);states[id]='failed';}if(m.restartRequired)pending=true;return {ok:true,restart:!!m.restartRequired};}
function boot(){var s=saved();Object.keys(modules).forEach(function(id){if(s[id]){try{modules[id].start(api);states[id]='enabled';}catch(e){states[id]='failed';record(id,e.message||e);}}});pending=false;}
function snapshot(){return Object.keys(modules).map(function(id){var m=modules[id];return {id:id,name:m.name||id,category:m.category||'feature',runtime:m.runtime||'js',restartRequired:!!m.restartRequired,state:states[id],configured:!!saved()[id]};});}
function restart(){if(typeof root.location.reload==='function')root.location.reload();}
function instantiate(url,imports,done){if(!supported())return done(Error('WebAssembly unavailable'));var x=new XMLHttpRequest();x.open('GET',url,true);x.responseType='arraybuffer';x.onload=function(){if(x.status<200||x.status>=300)return done(Error('HTTP '+x.status));root.WebAssembly.instantiate(x.response,imports||{}).then(function(v){done(null,v.instance||v);},done);};x.onerror=function(){done(Error('Network failure'));};x.send();}
var api={record:record,now:function(){return Date.now();},wasmSupported:supported};
root.PhilcoModules={register:register,enable:enable,disable:disable,boot:boot,snapshot:snapshot,restart:restart,logs:function(){return logs.slice();},needsRestart:function(){return pending;},wasmSupported:supported,instantiate:instantiate};
})(window);
