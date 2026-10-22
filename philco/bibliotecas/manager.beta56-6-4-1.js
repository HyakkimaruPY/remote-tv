/* Philco Beta 6.4.1 — focus-safe library manager + Assembly WASM helper, ES5. */
(function (w, d) {
'use strict';
var R = w.RemoteTV || (w.RemoteTV = {}), entry = d.getElementById('rtvLibs');
if (!entry) return;
var KEY = 'remote-tv.libs.beta6.v1';
var DIAG_WASM = 'AGFzbQEAAAABDgJgAn9/AX9gA39/fwF/AwMCAAEEBQFwAQEBBQMBAAIGCAF/AUGAiAQLBx8DBm1lbW9yeQIACGNsYXNzaWZ5AAAHcXVhbGl0eQABClQCGgBBAEEBQQIgAUG4F0sbIABB8HxqQbh+SRsLNwEBf0EAIQMCQCABIAJyIAJyQQBIDQBBAUEBQQFBAiACQcA+ShsgAUEAShsgAEEEShshAwsgAws=';
var NAV_ASM = 'AGFzbQEAAAABCAFgA39/fwF/AwQDAAAABysDCm5leHRfZm9jdXMAAAphY2NlcHRfa2V5AAENbmVlZHNfcmVzdGFydAACCjMDGAAgAkEATAR/QX8FIAAgAWogAmogAm8LCwoAIAAgAWsgAk8LDQAgACABRyACQQBHcQs=';
var flags = {}, libs = [], panel = null, rows = null, mode = null, focusLabel = null, active = false, prior = null;
var diag = null, navAsm = null, wasmStarted = false, pendingRestart = false, selected = null, lastCode = -1, lastKeyAt = 0;
try { flags = JSON.parse(w.localStorage.getItem(KEY) || '{}') || {}; } catch (e) {}
function el(tag, text, style) {
    var n = d.createElement(tag);
    if (text != null) n.textContent = String(text);
    if (style) n.style.cssText = style;
    return n;
}
var buttonCSS = 'display:inline-block!important;min-width:152px;height:43px;margin:4px 9px 4px 0;padding:8px 13px;background:#191919!important;color:#eee!important;border:2px solid #666!important;border-radius:4px!important;font:18px Arial!important;outline:0!important;';
var focusCSS = 'background:#efefef!important;color:#050505!important;border:3px solid #fff!important;box-shadow:0 0 0 3px #929292!important;outline:3px solid #fff!important;outline-offset:1px!important;font-weight:bold!important;';
function save() {
    var data = {}, i;
    for (i = 0; i < libs.length; i++) data[libs[i].id] = !!libs[i].on;
    try { w.localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
}
function from64(s) {
    var raw = w.atob(s), bytes = new w.Uint8Array(raw.length), i;
    for (i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes;
}
function wasmState() { return (diag ? 'Diagnóstico WASM' : 'Diagnóstico ES5') + ' · ' + (navAsm ? 'Navegação Assembly WASM' : 'Navegação ES5'); }
function updateMode() { if (mode) mode.textContent = wasmState(); }
function loadWasm() {
    if (wasmStarted) return;
    wasmStarted = true;
    if (!w.WebAssembly || typeof w.WebAssembly.instantiate !== 'function' || !w.Uint8Array || !w.atob) { updateMode(); return; }
    function start(code, cb) {
        try {
            w.WebAssembly.instantiate(from64(code), {}).then(function (x) {
                var inst = x && (x.instance || x);
                if (inst && inst.exports) cb(inst.exports);
            }, function () { updateMode(); });
        } catch (e) { updateMode(); }
    }
    start(DIAG_WASM, function (e) {
        if (typeof e.classify === 'function' && e.classify(200, 5) === 2 && e.classify(500, 5) === 0) diag = e;
        updateMode();
    });
    start(NAV_ASM, function (e) {
        if (typeof e.next_focus === 'function' && e.next_focus(0, -1, 5) === 4 &&
            typeof e.accept_key === 'function' && typeof e.needs_restart === 'function') navAsm = e;
        updateMode();
    });
}
function circular(index, step, length) {
    if (!length) return -1;
    if (navAsm) {
        try { return navAsm.next_focus(index | 0, step | 0, length | 0); }
        catch (e) { navAsm = null; updateMode(); }
    }
    return ((index + step) % length + length) % length;
}
function needsReload(requested, old, requires) {
    if (navAsm) {
        try { return !!navAsm.needs_restart(requested ? 1 : 0, old ? 1 : 0, requires ? 1 : 0); }
        catch (e) { navAsm = null; updateMode(); }
    }
    return !!requires && !!requested !== !!old;
}
function cancel(lib) {
    lib.epoch++; lib.running = false;
    if (lib.scope) { try { lib.scope.cancel(); } catch (e) {} }
    lib.scope = null;
}
function update(lib) {
    if (!lib.switchBtn) return;
    lib.switchBtn.textContent = lib.on ? 'Desativar' : 'Ativar';
    lib.testBtn.disabled = !lib.on || lib.running;
    lib.testBtn.style.opacity = lib.on ? '1' : '.48';
    if (!lib.on && !lib.restartRequired) lib.result.textContent = 'Desativada';
}
function listControls() {
    var list = [], i, lib;
    for (i = 0; i < libs.length; i++) {
        lib = libs[i];
        if (!lib.switchBtn) continue;
        list.push({el: lib.switchBtn, wrap: lib.wrap, text: lib.title + ' · ' + (lib.on ? 'Desativar' : 'Ativar')});
        if (lib.on && !lib.running) list.push({el: lib.testBtn, wrap: lib.wrap, text: lib.title + ' · Testar'});
    }
    var restart = d.getElementById('rtvLibReset'), back = d.getElementById('rtvLibBack');
    if (restart) list.push({el: restart, wrap: null, text: 'Reiniciar motores'});
    if (back) list.push({el: back, wrap: null, text: 'Voltar'});
    return list;
}
function highlight(target) {
    var list = listControls(), i, item, selectedInfo = null, row;
    if (!list.length) return;
    if (!target) target = list[0].el;
    for (i = 0; i < list.length; i++) if (list[i].el === target) selectedInfo = list[i];
    if (!selectedInfo) { target = list[0].el; selectedInfo = list[0]; }
    selected = target;
    for (i = 0; i < libs.length; i++) {
        row = libs[i].wrap;
        if (row) {
            row.style.borderColor = selectedInfo.wrap === row ? '#f4f4f4' : '#454545';
            row.style.background = selectedInfo.wrap === row ? '#1b1b1b' : '#080808';
        }
    }
    for (i = 0; i < list.length; i++) {
        item = list[i];
        item.el.style.cssText = buttonCSS + (item.el === target ? focusCSS : '');
        item.el.tabIndex = item.el === target ? 0 : -1;
        item.el.setAttribute('aria-selected', item.el === target ? 'true' : 'false');
    }
    if (focusLabel) focusLabel.textContent = 'Selecionado: ' + selectedInfo.text;
    if (selectedInfo.wrap && rows) {
        var y = selectedInfo.wrap.offsetTop, top = rows.scrollTop || 0, h = selectedInfo.wrap.offsetHeight || 103;
        if (y < top) rows.scrollTop = y;
        else if (y + h > top + rows.clientHeight) rows.scrollTop = y + h - rows.clientHeight;
    }
    try { target.focus(); } catch (e) {}
}
function move(step) {
    var list = listControls(), i, at = -1;
    for (i = 0; i < list.length; i++) if (list[i].el === selected || list[i].el === d.activeElement) { at = i; break; }
    if (at < 0) at = step > 0 ? -1 : 0;
    var next = circular(at, step, list.length);
    if (next >= 0) highlight(list[next].el);
}
function toggle(lib) {
    var original = lib.on;
    cancel(lib);
    lib.on = !lib.on;
    save();
    if (needsReload(lib.on, original, lib.restartRequired)) {
        pendingRestart = true;
        lib.result.textContent = 'Alteração salva · reinicie para aplicar';
    } else {
        try {
            if (lib.on && lib.start) lib.start();
            if (!lib.on && lib.stop) lib.stop();
            lib.result.textContent = lib.on ? 'Ativada · pronta para teste' : 'Desativada';
        } catch (e) { lib.result.textContent = 'Falha isolada ao iniciar módulo'; }
    }
    update(lib);
    highlight(lib.switchBtn);
}
function errorText(err) {
    var s = String(err || ''), m = /^HTTP (\d{3})/.exec(s);
    return m ? 'HTTP ' + m[1] : /timeout/i.test(s) ? 'Tempo esgotado' : 'Falha de transporte';
}
function execute(lib) {
    if (!lib.on || lib.running) return;
    cancel(lib);
    lib.running = true;
    lib.scope = R.RequestScope ? new R.RequestScope() : {cancel: function () {}};
    var epoch = lib.epoch;
    lib.result.textContent = 'Testando…';
    update(lib);
    function done(ok, msg) {
        if (lib.epoch !== epoch || !lib.on) return;
        lib.running = false;
        lib.result.textContent = (ok ? 'OK · ' : 'Falha · ') + String(msg || '');
        if (lib.scope) { try { lib.scope.cancel(); } catch (e) {} }
        lib.scope = null;
        update(lib);
        highlight(lib.testBtn);
    }
    try { lib.test(lib.scope, done); } catch (e) { done(false, errorText(e)); }
}
function createRow(lib) {
    if (!rows) return;
    var wrap = el('div', null, 'position:relative;border:2px solid #454545;background:#080808;padding:10px 14px;margin:7px 2px;border-radius:5px;min-height:92px;box-sizing:border-box;');
    lib.wrap = wrap;
    wrap.appendChild(el('div', lib.title + (lib.restartRequired ? ' · requer reinício' : ''), 'font:20px Arial;color:#fff;margin-bottom:3px;'));
    lib.switchBtn = el('button', '', buttonCSS);
    lib.testBtn = el('button', 'Testar', buttonCSS);
    lib.result = el('div', lib.on ? 'Pronta · teste manual' : 'Desativada', 'color:#aaa;font:15px Arial;margin-top:2px;min-height:18px;');
    lib.switchBtn.onclick = function () { toggle(lib); };
    lib.testBtn.onclick = function () { execute(lib); };
    wrap.appendChild(lib.switchBtn);
    wrap.appendChild(lib.testBtn);
    wrap.appendChild(lib.result);
    rows.appendChild(wrap);
    update(lib);
}
function register(def) {
    var i, id = def && def.id;
    if (!/^[a-z][a-z0-9_-]{0,24}$/.test(String(id || '')) || !def.title || typeof def.test !== 'function') return false;
    for (i = 0; i < libs.length; i++) if (libs[i].id === id) return false;
    var lib = {id:id,title:String(def.title).slice(0,60),test:def.test,start:def.start||null,stop:def.stop||null,
               restartRequired:!!def.restartRequired,on:typeof flags[id]==='boolean'?flags[id]:!!def.enabled,
               epoch:0,running:false,scope:null,switchBtn:null,testBtn:null,wrap:null,result:null};
    if (lib.on && !lib.restartRequired && lib.start) {try { lib.start(); } catch (e) { lib.on=false; }}
    libs.push(lib);
    if (rows) { createRow(lib); if (active) highlight(selected); }
    return true;
}
function close() {
    if (!active) return;
    active = false;
    for (var i = 0; i < libs.length; i++) if (libs[i].running) {
        cancel(libs[i]); libs[i].result.textContent = 'Cancelada'; update(libs[i]);
    }
    panel.style.display = 'none';
    if (prior && prior.focus) { try { prior.focus(); } catch(e) {} }
}
function open() {
    prior = d.activeElement || entry;
    if (!panel) {
        panel = el('section', null, 'position:fixed;z-index:9000;left:0;top:0;width:1280px;height:720px;background:#000!important;color:#eee;font:19px Arial;overflow:hidden;box-sizing:border-box;padding:25px 64px;');
        panel.id = 'rtvLibPanel';
        panel.appendChild(el('h1', 'Bibliotecas · Beta 6.4.1', 'font:28px Arial;color:#fff;margin:0 0 6px;'));
        panel.appendChild(el('p', 'Use ↑ ↓ ← → para selecionar. OK ativa, testa ou reinicia.', 'font:17px Arial;color:#bbb;margin:0 0 8px;'));
        mode = el('div', 'Verificando compatibilidade…', 'font:15px Arial;color:#aaa;margin:0 0 4px;');
        panel.appendChild(mode);
        focusLabel = el('div', 'Selecionado:', 'font:18px Arial;color:#fff;background:#252525;border:1px solid #888;padding:9px 12px;margin:4px 0;');
        focusLabel.id = 'rtvLibFocusLabel';
        panel.appendChild(focusLabel);
        rows = el('div', null, 'position:relative;height:433px;overflow-y:auto;overflow-x:hidden;background:#030303;border:1px solid #333;margin-top:4px;');
        rows.id = 'rtvLibRows';
        panel.appendChild(rows);
        for (var i=0; i<libs.length; i++) createRow(libs[i]);
        var foot = el('div', null, 'position:absolute;bottom:18px;left:64px;right:64px;height:62px;background:#000;border-top:1px solid #555;padding:9px 0;box-sizing:border-box;');
        foot.id = 'rtvLibFooter';
        var reset = el('button', 'Reiniciar motores', buttonCSS), back = el('button', 'Voltar', buttonCSS);
        reset.id = 'rtvLibReset';
        back.id = 'rtvLibBack';
        back.onclick = close;
        reset.onclick = function () {
            close();
            try { if (w.RawPlayer && w.RawPlayer.close) w.RawPlayer.close(); } catch(e){}
            try { w.location.reload(true); } catch(e){}
        };
        foot.appendChild(reset); foot.appendChild(back); panel.appendChild(foot);
        d.body.appendChild(panel);
    }
    panel.style.display = 'block';
    active = true;
    loadWasm();
    highlight(selected && selected.parentNode ? selected : (libs.length ? libs[0].switchBtn : d.getElementById('rtvLibBack')));
}
function prevent(e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    else if (e.stopPropagation) e.stopPropagation();
    e.returnValue = false;
    e.cancelBubble = true;
}
function onkey(e) {
    if (!active) return false;
    if (!e) return false;
    var k = e.keyCode || e.which || 0;
    prevent(e);
    if (k === 0) return true;
    var now = new Date().getTime();
    if (k === lastCode && now - lastKeyAt >= 0 && now - lastKeyAt < 135) return true;
    lastCode = k; lastKeyAt = now;
    if (k === 8 || k === 27 || k === 461 || k === 462 || k === 528 || k === 10009 || k === 166) { close(); return true; }
    if (k === 38 || k === 37) { move(-1); return true; }
    if (k === 40 || k === 39) { move(1); return true; }
    if (k === 13 || k === 41) { var b = selected || d.activeElement; if (b && b.click) b.click(); return true; }
    return true;
}
if (d.addEventListener) {
    d.addEventListener('keydown', onkey, true);
    d.addEventListener('irkeypress', onkey, true);
}
var previousIR = d.onirkeypress;
d.onirkeypress = function(e) { if (onkey(e||w.event)) return false; return previousIR ? previousIR.call(d,e) : true; };
entry.onclick = open;
R.libraryManager = {
    register:register, open:open, close:close, isOpen:function(){return active;},
    engine:wasmState,
    quality:function(stalls,errors,delay){ if(diag&&diag.quality)return diag.quality(stalls|0,errors|0,delay|0);return errors>0||stalls>4||delay>8000?1:2; },
    needsRestart:function(){return pendingRestart;},
    enabled:function(id){for(var i=0;i<libs.length;i++)if(libs[i].id===id)return !!libs[i].on;return false;},
    _nav:function(index,step,count){return circular(index,step,count);},
    _focused:function(){return selected&&selected.id;},
    _inspect:function(){return {selected:selected&&selected.id,open:active,rows:libs.length,wasm:wasmState()};}
};
})(this, document);
