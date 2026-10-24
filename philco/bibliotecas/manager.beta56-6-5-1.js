/* Philco Beta 6.5.1 — three task tabs, capability gating and a 10 MiB extra-visual budget. */
(function (w, d) {
'use strict';
var R = w.RemoteTV || (w.RemoteTV = {}), entry = d.getElementById('rtvLibs');
if (!entry) return;
var KEY = 'remote-tv.libs.beta6.v1', LIMIT = 10 * 1024 * 1024, TABS = ['system','injection','render','portal'];
var TAB_LABEL = {system:'Sistema',injection:'Injeção',render:'Renderização',portal:'Portal'};
var DIAG_WASM = 'AGFzbQEAAAABDgJgAn9/AX9gA39/fwF/AwMCAAEEBQFwAQEBBQMBAAIGCAF/AUGAiAQLBx8DBm1lbW9yeQIACGNsYXNzaWZ5AAAHcXVhbGl0eQABClQCGgBBAEEBQQIgAUG4F0sbIABB8HxqQbh+SRsLNwEBf0EAIQMCQCABIAJyIAJyQQBIDQBBAUEBQQFBAiACQcA+ShsgAUEAShsgAEEEShshAwsgAws=';
var NAV_ASM = 'AGFzbQEAAAABCAFgA39/fwF/AwQDAAAABysDCm5leHRfZm9jdXMAAAphY2NlcHRfa2V5AAENbmVlZHNfcmVzdGFydAACCjMDGAAgAkEATAR/QX8FIAAgAWogAmogAm8LCwoAIAAgAWsgAk8LDQAgACABRyACQQBHcQs=';
var flags = {}, libs = [], rejected = [], reservations = {}, budgetUsed = 0, panel = null, rows = null, mode = null, focusLabel = null, tabBar = null, tabButtons = {};
var active = false, prior = null, diag = null, navAsm = null, wasmStarted = false, pendingRestart = false, selected = null, asmRequested = false, lastCode = -1, lastKeyAt = 0, activeTab = 'system';
try { flags = JSON.parse(w.localStorage.getItem(KEY) || '{}') || {}; } catch (e) {}

function el(tag, text, cls) { var n=d.createElement(tag); if(text!=null)n.textContent=String(text); if(cls)n.className=cls; return n; }
function mb(n) { return (Math.round((n / 1048576) * 10) / 10).toFixed(1); }
function cssProp(list) { var s=d.createElement('div').style,i; for(i=0;i<list.length;i++)if(list[i] in s)return true; return false; }
function categoryFor(def) {
    var id=String(def.id||''), c=String(def.category||'');
    if(c==='system'||c==='injection'||c==='render'||c==='portal')return c;
    if(id==='frame-budget'||id==='render-scheduler'||id==='visual-compositor'||id==='texture-fx'||id==='blur-fx'||id==='webgl-surface'||id==='canvas-texture'||id==='vector-assets')return 'render';
    if(id==='modern-ui'||id==='webkit-injector'||id==='offline-store'||id==='vendor-bridge'||id==='user-style')return 'injection';
    if(id==='native-app-hello'||id==='portal-apps')return 'portal';
    return 'system';
}
function defaultProbe(id) {
    if (id === 'diagnostico') return !!(w.addEventListener && w.removeEventListener);
    if (id === 'estabilidade') return !!(w.setInterval && w.clearInterval && w.Date);
    if (id === 'network' || id === 'https') return !!R.RequestScope;
    if (id === 'search') return !!(w.PhilcoSearchAdapter && w.PhilcoSearch642);
    if (id === 'assembly-navigation') return !!(w.WebAssembly && w.Uint8Array && w.atob);
    if (id === 'localhost') return !!w.PhilcoLocalhost642;
    if (id === 'frame-budget') return !!w.PhilcoSearch642;
    if (id === 'ir-mapping') return !!(d.addEventListener && w.localStorage);
    if (id === 'render-scheduler') return !!(w.requestAnimationFrame || w.setTimeout);
    if (id === 'visual-compositor') return cssProp(['webkitTransform','transform']) && cssProp(['webkitTransition','transition']);
    return true;
}
function probe(def) {
    var r;
    try {
        if (typeof def.probe === 'function') {
            r = def.probe();
            if (r && typeof r === 'object') return {ok:!!r.ok,reason:String(r.reason||'probe')};
            return {ok:!!r,reason:r?'compatível':'probe recusou'};
        }
        return {ok:defaultProbe(def.id),reason:'capacidade do firmware'};
    } catch (e) { return {ok:false,reason:'probe lançou exceção'}; }
}
function defaultVisualBytes(id) {
    if (id === 'render-scheduler') return 131072;
    if (id === 'visual-compositor') return 786432;
    return 0;
}
function reserve(id, bytes) {
    bytes = Math.max(0, bytes|0);
    if (!bytes) return true;
    if (reservations[id]) return true;
    if (budgetUsed + bytes > LIMIT) return false;
    reservations[id] = bytes; budgetUsed += bytes; updateMode(); return true;
}
function release(id) { var n=reservations[id]||0; if(n){budgetUsed-=n;if(budgetUsed<0)budgetUsed=0;delete reservations[id];updateMode();} }
R.visualBudget651 = {limit:LIMIT,reserve:reserve,release:release,used:function(){return budgetUsed;},remaining:function(){return LIMIT-budgetUsed;},snapshot:function(){return {used:budgetUsed,limit:LIMIT,usedMiB:mb(budgetUsed),limitMiB:'10.0'};}};

function css() {
    var s;
    if (d.getElementById('rtvLib651css')) return;
    s=d.createElement('style');s.id='rtvLib651css';
    s.textContent='#rtvLibPanel{position:fixed;z-index:9000;left:0;top:0;width:1280px;height:720px;background:#000;color:#eee;font:18px Arial;overflow:hidden;box-sizing:border-box;padding:30px 54px}' +
    '#rtvLibPanel h1{font:normal 31px Arial;margin:0;color:#f2f2f2}#rtvLibPanel .rtvLib651Sub{color:#8c9499;font:15px Arial;margin:5px 0 9px}' +
    '#rtvLibMode{position:absolute;right:56px;top:37px;color:#777f84;font:14px Arial;text-align:right;max-width:570px}' +
    '#rtvLibTabs{height:48px;margin:0 0 8px;white-space:nowrap}#rtvLibTabs .rtvLib651Tab{display:inline-block!important;width:190px;height:43px;margin:0 8px 0 0!important;background:#0b0b0b!important;color:#9da3a7!important;border:1px solid #343434!important;border-radius:5px!important;font:17px Arial!important;outline:0!important}' +
    '#rtvLibTabs .rtvLib651Tab.isactive{color:#f4f4f4!important;background:#161616!important;border-color:#666!important}#rtvLibTabs .rtvLib651Tab.isfocus{background:#efefef!important;color:#080808!important;border:2px solid #fff!important;font-weight:bold!important}' +
    '#rtvLibFocusLabel{height:36px;line-height:36px;color:#d8d8d8;background:#0e0e0e;border:1px solid #303030;padding:0 13px;margin-bottom:8px;box-sizing:border-box}' +
    '#rtvLibRows{height:406px;overflow-y:auto;overflow-x:hidden;background:#050505;border:1px solid #242424;padding:7px;box-sizing:border-box}' +
    '.rtvLib651Empty{height:370px;line-height:370px;text-align:center;color:#666;font:17px Arial}' +
    '.rtvLib651Row{position:relative;height:88px;border:1px solid #292929;background:#0a0a0a;margin:0 0 7px;padding:12px 330px 10px 14px;box-sizing:border-box}' +
    '.rtvLib651Row.isrowfocus{border-color:#7d7d7d;background:#101010}.rtvLib651Title{font:20px Arial;color:#f0f0f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.rtvLib651Meta{font:13px Arial;color:#747c81;margin-top:5px}.rtvLib651Result{font:14px Arial;color:#a2a8ac;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.rtvLib651Actions{position:absolute;right:12px;top:17px;width:302px;height:52px;text-align:right}' +
    '.rtvLib651Btn{display:inline-block!important;width:138px;height:48px;margin:0 0 0 10px!important;padding:0 12px!important;background:#151515!important;color:#ddd!important;border:1px solid #454545!important;border-radius:5px!important;font:17px Arial!important;text-align:center!important;outline:0!important;box-shadow:none!important}' +
    '.rtvLib651Btn.isfocus{background:#efefef!important;color:#080808!important;border:2px solid #fff!important;font-weight:bold!important}.rtvLib651Btn[disabled]{opacity:.38}' +
    '#rtvLibFooter{height:54px;margin-top:8px;border-top:1px solid #2d2d2d;padding-top:7px;box-sizing:border-box;text-align:right}#rtvLibFooter .rtvLib651Btn{width:185px;height:40px}' +
    '.rtvLib651Tag{display:inline-block;padding:2px 6px;border:1px solid #343434;color:#858d92;font:11px Arial;text-transform:uppercase;margin-right:7px}';
    d.head.appendChild(s);
}
function save(){var data={},i;for(i=0;i<libs.length;i++)data[libs[i].id]=!!libs[i].on;try{w.localStorage.setItem(KEY,JSON.stringify(data));}catch(e){}}
function from64(s){var raw=w.atob(s),bytes=new w.Uint8Array(raw.length),i;for(i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return bytes;}
function wasmState(){return(diag?'Diagnóstico WASM':'Diagnóstico ES5')+' · '+(!asmRequested?'Assembly off':navAsm?'Assembly WASM':'Assembly ES5');}
function countCategory(cat){var i,n=0;for(i=0;i<libs.length;i++)if(libs[i].category===cat)n++;return n;}
function updateMode(){if(mode)mode.textContent='Probe automático · '+rejected.length+' ocultada(s) · '+countCategory(activeTab)+' nesta aba · visual '+mb(budgetUsed)+'/10.0 MB · '+wasmState();}
function loadWasm() {
    if(wasmStarted)return;wasmStarted=true;
    if(!w.WebAssembly||typeof w.WebAssembly.instantiate!=='function'||!w.Uint8Array||!w.atob){updateMode();return;}
    function start(code,cb){try{w.WebAssembly.instantiate(from64(code),{}).then(function(x){var inst=x&&(x.instance||x);if(inst&&inst.exports)cb(inst.exports);},function(){updateMode();});}catch(e){updateMode();}}
    start(DIAG_WASM,function(e){if(typeof e.classify==='function'&&e.classify(200,5)===2&&e.classify(500,5)===0)diag=e;updateMode();});
    start(NAV_ASM,function(e){if(typeof e.next_focus==='function'&&e.next_focus(0,-1,5)===4&&typeof e.accept_key==='function'&&typeof e.needs_restart==='function')navAsm=e;updateMode();});
}
function circular(index,step,length){if(!length)return-1;if(asmRequested&&navAsm){try{return navAsm.next_focus(index|0,step|0,length|0);}catch(e){navAsm=null;updateMode();}}return((index+step)%length+length)%length;}
function acceptKey(now,last,interval){if(asmRequested&&navAsm){try{return!!navAsm.accept_key(now|0,last|0,interval|0);}catch(e){navAsm=null;updateMode();}}return now-last>=interval;}
function needsReload(requested,old,requires){if(asmRequested&&navAsm){try{return!!navAsm.needs_restart(requested?1:0,old?1:0,requires?1:0);}catch(e){navAsm=null;updateMode();}}return!!requires&&!!requested!==!!old;}
function cancel(lib){lib.epoch++;lib.running=false;if(lib.scope){try{lib.scope.cancel();}catch(e){}}lib.scope=null;}
function startLib(lib){if(lib.started)return true;if(!reserve(lib.id,lib.visualBytes))return false;try{if(lib.start)lib.start();lib.started=true;return true;}catch(e){release(lib.id);lib.started=false;return false;}}
function stopLib(lib){try{if(lib.stop)lib.stop();}catch(e){}lib.started=false;release(lib.id);}
function visibleLibs(){var a=[],i;for(i=0;i<libs.length;i++)if(libs[i].category===activeTab)a.push(libs[i]);return a;}
function update(lib){if(!lib.switchBtn)return;lib.switchBtn.textContent=lib.on?'Desativar':'Ativar';lib.testBtn.disabled=!lib.on||lib.running;if(!lib.on&&!lib.restartRequired)lib.result.textContent='Desativada';}
function setClass(node,name,on){var c=' '+String(node.className||'')+' ',token=' '+name+' ';if(on&&c.indexOf(token)<0)c+=name+' ';if(!on)while(c.indexOf(token)>=0)c=c.replace(token,' ');node.className=c.replace(/^\s+|\s+$/g,'');}
function tabIndex(){var i;for(i=0;i<TABS.length;i++)if(TABS[i]===activeTab)return i;return 0;}
function tabSelected(){var i;for(i=0;i<TABS.length;i++)if(selected===tabButtons[TABS[i]])return i;return -1;}
function updateTabs(){var i,b;for(i=0;i<TABS.length;i++){b=tabButtons[TABS[i]];if(b)setClass(b,'isactive',TABS[i]===activeTab);}}
function controls(){var list=[],a=visibleLibs(),i,lib;for(i=0;i<a.length;i++){lib=a[i];if(!lib.switchBtn)continue;list.push({el:lib.switchBtn,wrap:lib.wrap,text:lib.title+' · '+(lib.on?'Desativar':'Ativar')});if(lib.on&&!lib.running)list.push({el:lib.testBtn,wrap:lib.wrap,text:lib.title+' · Testar'});}return list;}
function clearFocus(){
    var i,a=controls(),b;
    for(i=0;i<a.length;i++)setClass(a[i].el,'isfocus',false);
    for(i=0;i<TABS.length;i++){b=tabButtons[TABS[i]];if(b)setClass(b,'isfocus',false);}
    b=d.getElementById('rtvLibReset');if(b)setClass(b,'isfocus',false);
    b=d.getElementById('rtvLibBack');if(b)setClass(b,'isfocus',false);
}
function itemText(target){
    var a=controls(),i;
    for(i=0;i<a.length;i++)if(a[i].el===target)return a[i].text;
    for(i=0;i<TABS.length;i++)if(tabButtons[TABS[i]]===target)return 'Aba '+TAB_LABEL[TABS[i]];
    if(target===d.getElementById('rtvLibReset'))return 'Reiniciar motores';
    if(target===d.getElementById('rtvLibBack'))return 'Voltar';
    return 'Selecionado';
}
function highlight(target){
    var old=selected,newRow=null,oldRow;
    if(!target)return;
    if(old&&old!==target){setClass(old,'isfocus',false);old.tabIndex=-1;old.setAttribute('aria-selected','false');oldRow=old.parentNode&&old.parentNode.parentNode;if(oldRow&&oldRow.getAttribute&&oldRow.getAttribute('data-module-row')==='1')setClass(oldRow,'isrowfocus',false);}
    selected=target;clearFocus();setClass(target,'isfocus',true);target.tabIndex=0;target.setAttribute('aria-selected','true');
    newRow=target.parentNode&&target.parentNode.parentNode;if(newRow&&newRow.getAttribute&&newRow.getAttribute('data-module-row')==='1')setClass(newRow,'isrowfocus',true);
    if(focusLabel)focusLabel.textContent='Selecionado · '+itemText(target);
    if(newRow&&rows){var y=newRow.offsetTop,top=rows.scrollTop||0,h=newRow.offsetHeight||88,visible=rows.clientHeight||406;if(y<top)rows.scrollTop=y;else if(y+h>top+visible)rows.scrollTop=y+h-visible;}
    try{target.focus();}catch(e){}
}
function createRow(lib){
    if(!rows)return;
    var wrap=el('div',null,'rtvLib651Row'),title=el('div',lib.title,'rtvLib651Title'),meta=el('div',null,'rtvLib651Meta'),actions=el('div',null,'rtvLib651Actions'),cost='';
    lib.wrap=wrap;wrap.setAttribute('data-module-row','1');
    meta.appendChild(el('span',TAB_LABEL[lib.category]||lib.category,'rtvLib651Tag'));
    if(lib.visualBytes)cost=' · '+mb(lib.visualBytes)+' MB visual';
    meta.appendChild(d.createTextNode((lib.restartRequired?'requer reinício':'probe OK')+cost));
    lib.result=el('div',lib.on?'Pronta · compatibilidade validada':'Desativada','rtvLib651Result');
    lib.switchBtn=el('button','','rtvLib651Btn');lib.switchBtn.id='rtvLibToggle-'+lib.id;
    lib.testBtn=el('button','Testar','rtvLib651Btn');lib.testBtn.id='rtvLibTest-'+lib.id;
    lib.switchBtn.onclick=function(){toggle(lib);};lib.testBtn.onclick=function(){execute(lib);};
    actions.appendChild(lib.switchBtn);actions.appendChild(lib.testBtn);wrap.appendChild(title);wrap.appendChild(meta);wrap.appendChild(lib.result);wrap.appendChild(actions);rows.appendChild(wrap);update(lib);
}
function renderRows(){
    var a=visibleLibs(),i;
    if(!rows)return;
    rows.innerHTML='';rows.scrollTop=0;
    for(i=0;i<libs.length;i++){libs[i].wrap=null;libs[i].switchBtn=null;libs[i].testBtn=null;libs[i].result=null;}
    if(!a.length){rows.appendChild(el('div','Nenhuma biblioteca compatível nesta aba.','rtvLib651Empty'));updateMode();return;}
    for(i=0;i<a.length;i++)createRow(a[i]);
    updateMode();
}
function switchTab(cat,focusTab){
    if(TABS.join(',').indexOf(cat)<0)return;
    activeTab=cat;selected=null;renderRows();updateTabs();
    if(focusTab!==false)highlight(tabButtons[cat]);
}
function currentModulePosition(){
    var a=visibleLibs(),i;
    for(i=0;i<a.length;i++){if(selected===a[i].switchBtn)return{row:i,col:0};if(selected===a[i].testBtn)return{row:i,col:1};}
    return null;
}
function horizontal(step){
    var ti=tabSelected(),p,lib,a;
    if(ti>=0){ti=circular(ti,step,TABS.length);switchTab(TABS[ti],true);return;}
    if(selected===d.getElementById('rtvLibReset')||selected===d.getElementById('rtvLibBack')){highlight(d.getElementById(step>0?'rtvLibBack':'rtvLibReset'));return;}
    p=currentModulePosition();if(!p)return;a=visibleLibs();lib=a[p.row];if(step>0&&lib.on&&!lib.running)highlight(lib.testBtn);else if(step<0)highlight(lib.switchBtn);
}
function vertical(step){
    var ti=tabSelected(),p,a=visibleLibs(),target,lib;
    if(ti>=0){if(step>0&&a.length)highlight(a[0].switchBtn);else if(step<0)highlight(d.getElementById('rtvLibReset'));return;}
    if(selected===d.getElementById('rtvLibReset')||selected===d.getElementById('rtvLibBack')){
        if(step<0&&a.length){lib=a[a.length-1];highlight(selected===d.getElementById('rtvLibBack')&&lib.on&&!lib.running?lib.testBtn:lib.switchBtn);}
        else if(step>0)highlight(tabButtons[activeTab]);
        return;
    }
    p=currentModulePosition();if(!p){highlight(tabButtons[activeTab]);return;}
    if(step<0&&p.row===0){highlight(tabButtons[activeTab]);return;}
    if(step>0&&p.row===a.length-1){highlight(d.getElementById(p.col?'rtvLibBack':'rtvLibReset'));return;}
    lib=a[p.row+step];target=p.col&&lib.on&&!lib.running?lib.testBtn:lib.switchBtn;highlight(target);
}
function toggle(lib){
    var original=lib.on,want=!lib.on,epoch;
    cancel(lib);
    if(needsReload(want,original,lib.restartRequired)){
        lib.on=want;pendingRestart=true;lib.result.textContent='Alteração salva · reinicie para aplicar';save();update(lib);highlight(lib.switchBtn);updateMode();return;
    }
    if(want&&lib.startAsync){
        if(!reserve(lib.id,lib.visualBytes)){lib.result.textContent='Não ativada · limite visual';update(lib);return;}
        lib.on=true;lib.running=true;epoch=lib.epoch;lib.result.textContent='Ativando…';save();update(lib);highlight(lib.switchBtn);
        try{lib.startAsync(function(ok,msg){
            if(lib.epoch!==epoch)return;
            lib.running=false;
            if(ok){lib.started=true;lib.result.textContent='Ativada · '+String(msg||'OK');}
            else{lib.on=false;lib.started=false;release(lib.id);lib.result.textContent='Falha · '+String(msg||'ativação recusada');}
            save();update(lib);highlight(lib.switchBtn);updateMode();
        });}catch(e){lib.running=false;lib.on=false;release(lib.id);lib.result.textContent='Falha · '+String(e);save();update(lib);}
        return;
    }
    if(!want&&lib.stopAsync){
        lib.on=false;lib.running=true;epoch=lib.epoch;lib.result.textContent='Desativando…';save();update(lib);highlight(lib.switchBtn);
        try{lib.stopAsync(function(ok,msg){
            if(lib.epoch!==epoch)return;
            lib.running=false;
            if(ok){lib.started=false;release(lib.id);lib.result.textContent='Desativada · '+String(msg||'removida');}
            else{lib.on=true;lib.result.textContent='Falha ao remover · '+String(msg||'');}
            save();update(lib);highlight(lib.switchBtn);updateMode();
        });}catch(e){lib.running=false;lib.on=true;lib.result.textContent='Falha ao remover · '+String(e);save();update(lib);}
        return;
    }
    lib.on=want;
    if(lib.on){if(startLib(lib))lib.result.textContent='Ativada · probe OK';else{lib.on=false;lib.result.textContent='Não ativada · limite visual ou falha de início';}}
    else{stopLib(lib);lib.result.textContent='Desativada';}
    save();update(lib);highlight(lib.switchBtn);updateMode();
    if(R.launcher651&&R.launcher651.refresh)R.launcher651.refresh();
}
function errorText(err){var s=String(err||''),m=/^HTTP (\d{3})/.exec(s);return m?'HTTP '+m[1]:/timeout/i.test(s)?'Tempo esgotado':'Falha de transporte';}
function execute(lib){
    if(!lib.on||lib.running)return;cancel(lib);lib.running=true;lib.scope=R.RequestScope?new R.RequestScope():{cancel:function(){}};
    var epoch=lib.epoch;lib.result.textContent='Testando…';update(lib);
    function done(ok,msg){if(lib.epoch!==epoch||!lib.on)return;lib.running=false;lib.result.textContent=(ok?'OK · ':'Falha · ')+String(msg||'');if(lib.scope){try{lib.scope.cancel();}catch(e){}}lib.scope=null;update(lib);if(selected===lib.testBtn)highlight(lib.testBtn);}
    try{lib.test(lib.scope,done);}catch(e){done(false,errorText(e));}
}
function register(def){
    var i,id=def&&def.id,p,lib,cost;
    if(!/^[a-z][a-z0-9_-]{0,24}$/.test(String(id||''))||!def.title||typeof def.test!=='function')return false;
    for(i=0;i<libs.length;i++)if(libs[i].id===id)return false;
    p=probe(def);if(!p.ok){rejected.push({id:id,reason:p.reason});updateMode();return false;}
    cost=typeof def.visualBytes==='number'?def.visualBytes:defaultVisualBytes(id);
    lib={id:id,title:String(def.title).slice(0,64),category:categoryFor(def),test:def.test,start:def.start||null,stop:def.stop||null,startAsync:def.startAsync||null,stopAsync:def.stopAsync||null,restartRequired:!!def.restartRequired,on:typeof def.actualOn==='boolean'?def.actualOn:(typeof flags[id]==='boolean'?flags[id]:!!def.enabled),visualBytes:Math.max(0,cost|0),epoch:0,running:false,scope:null,switchBtn:null,testBtn:null,wrap:null,result:null,started:false};
    if(lib.on&&!lib.restartRequired&&!lib.startAsync&&!startLib(lib)){rejected.push({id:id,reason:'falha no autoteste de início ou orçamento'});lib.on=false;updateMode();return false;}
    libs.push(lib);if(rows&&lib.category===activeTab){renderRows();if(active)highlight(tabButtons[activeTab]);}updateMode();return true;
}
function close(){if(!active)return;active=false;for(var i=0;i<libs.length;i++)if(libs[i].running){cancel(libs[i]);if(libs[i].result){libs[i].result.textContent='Cancelada';update(libs[i]);}}panel.style.display='none';if(prior&&prior.focus){try{prior.focus();}catch(e){}}}
function open(){
    prior=d.activeElement||entry;css();
    if(!panel){
        panel=el('section');panel.id='rtvLibPanel';
        panel.appendChild(el('h1','Bibliotecas'));
        panel.appendChild(el('div','Sistema cuida do runtime; Injeção estende o WebKit; Renderização cuida das superfícies; Portal registra extensões fora do launcher.','rtvLib651Sub'));
        mode=el('div','Verificando compatibilidade…');mode.id='rtvLibMode';panel.appendChild(mode);
        tabBar=el('div');tabBar.id='rtvLibTabs';
        for(var t=0;t<TABS.length;t++){(function(cat){var b=el('button',TAB_LABEL[cat],'rtvLib651Tab');b.id='rtvLibTab-'+cat;b.onclick=function(){switchTab(cat,true);};tabButtons[cat]=b;tabBar.appendChild(b);}(TABS[t]));}
        panel.appendChild(tabBar);
        focusLabel=el('div','Selecionado');focusLabel.id='rtvLibFocusLabel';panel.appendChild(focusLabel);
        rows=el('div');rows.id='rtvLibRows';panel.appendChild(rows);
        var foot=el('div');foot.id='rtvLibFooter';var reset=el('button','Reiniciar motores','rtvLib651Btn'),back=el('button','Voltar','rtvLib651Btn');reset.id='rtvLibReset';back.id='rtvLibBack';back.onclick=close;reset.onclick=function(){close();try{if(w.RawPlayer&&w.RawPlayer.close)w.RawPlayer.close();}catch(e){}try{w.location.reload(true);}catch(e){}};foot.appendChild(reset);foot.appendChild(back);panel.appendChild(foot);d.body.appendChild(panel);
        renderRows();updateTabs();
    }
    panel.style.display='block';active=true;loadWasm();updateMode();highlight(tabButtons[activeTab]);
}
function prevent(e){if(e.preventDefault)e.preventDefault();if(e.stopImmediatePropagation)e.stopImmediatePropagation();else if(e.stopPropagation)e.stopPropagation();e.returnValue=false;e.cancelBubble=true;}
function onkey(e){if(!active||!e)return false;var k=e.keyCode||e.which||0;prevent(e);if(k===0)return true;var now=new Date().getTime();if(k===lastCode&&now-lastKeyAt>=0&&!acceptKey(now,lastKeyAt,135))return true;lastCode=k;lastKeyAt=now;if(k===8||k===27||k===461||k===462||k===528||k===10009||k===166){close();return true;}if(k===38){vertical(-1);return true;}if(k===40){vertical(1);return true;}if(k===37){horizontal(-1);return true;}if(k===39){horizontal(1);return true;}if(k===13||k===41){var b=selected||d.activeElement;if(b&&b.click)b.click();return true;}return true;}
if(d.addEventListener){d.addEventListener('keydown',onkey,true);d.addEventListener('irkeypress',onkey,true);}
var previousIR=d.onirkeypress;d.onirkeypress=function(e){if(onkey(e||w.event))return false;return previousIR?previousIR.call(d,e):true;};entry.onclick=open;
R.libraryManager={
    register:register,open:open,close:close,isOpen:function(){return active;},engine:wasmState,
    setAssemblyActive:function(v){asmRequested=!!v;updateMode();},assemblyActive:function(){return asmRequested;},
    quality:function(stalls,errors,delay){if(diag&&diag.quality)return diag.quality(stalls|0,errors|0,delay|0);return errors>0||stalls>4||delay>8000?1:2;},
    needsRestart:function(){return pendingRestart;},
    enabled:function(id){for(var i=0;i<libs.length;i++)if(libs[i].id===id)return!!libs[i].on;return false;},
    _nav:function(index,step,count){return circular(index,step,count);},
    _focused:function(){return selected&&selected.id;},
    _tab:function(){return activeTab;},
    _inspect:function(){return{selected:selected&&selected.id,open:active,tab:activeTab,rows:visibleLibs().length,total:libs.length,rejected:rejected.slice(0),wasm:wasmState(),visualUsed:budgetUsed,visualLimit:LIMIT};}
};
}(this, document));
