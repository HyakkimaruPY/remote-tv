/* Philco Beta 6.5 launcher surface. ES5 only; no decoder/native ABI changes. */
(function (w, d) {
'use strict';
var R = w.RemoteTV || (w.RemoteTV = {}), installed = false, lastSearchState = null, STYLE = 'rtvPlayerLauncher65';
function text(node, value) { if (node) node.textContent = value; }

function playerStyle() {
    var s;
    if (d.getElementById(STYLE)) return;
    s = d.createElement('style'); s.id = STYLE;
    s.textContent = '#r14h,#c14h{height:72px!important;box-sizing:border-box!important;padding:11px 18px!important;background:#050505!important;border-bottom:1px solid #2e2e2e!important}' +
        '#r14h b,#c14h b{font:normal 23px Arial!important;line-height:48px!important;margin-right:12px!important}' +
        '#r14h button,.gb14,#c14h button{height:44px!important;min-width:94px!important;margin:2px 3px!important;padding:0 11px!important;border:1px solid #3a3a3a!important;border-radius:6px!important;background:#111!important;color:#ddd!important;box-shadow:none!important}' +
        '#r14h button:focus,.gb14:focus,#c14h button:focus{border:2px solid #eee!important;background:#1c1c1c!important}' +
        '#r14body{top:72px!important;height:648px!important}.catcol14{width:248px!important;padding:14px 10px!important;border-right:1px solid #2d2d2d!important}' +
        '#r14 .catcol14 .cat14,#r14 .catcol14 .tab14{width:226px!important;height:50px!important;margin:0 0 5px!important;padding:0 12px!important;border:1px solid #2e2e2e!important;border-radius:5px!important;background:#080808!important}' +
        '#r14 .catcol14 .cat14:focus,#r14 .catcol14 .tab14:focus{border:2px solid #eee!important;background:#161616!important}' +
        '#r14 .content14{left:248px!important;padding:16px 22px!important}#r14 .title14{font-size:20px!important;color:#b8b8b8!important}' +
        '#c14body{top:72px!important}.c14panel{padding-top:14px!important}.c14cat,.c14ch{border-radius:5px!important}';
    d.head.appendChild(s);
}
function fixM3U() {
    var tags = ['button','h1','h2','strong','small'], i, j, a, n, s;
    for (i = 0; i < tags.length; i++) {
        a = d.getElementsByTagName(tags[i]);
        for (j = 0; j < a.length; j++) {
            n = a[j]; s = String(n.textContent || '');
            if (/\bMP3\b/i.test(s)) n.textContent = s.replace(/\bMP3\b/gi, 'M3U');
        }
    }
}
function searchReady() {
    var ui = w.PhilcoSearch642, ad = w.PhilcoSearchAdapter;
    return !!(ui && ui.enabled && ui.enabled() && ad && (!ad.active || ad.active()));
}
function refreshSearchCard() {
    var b = d.getElementById('rtvSearchHome'), ready = searchReady(), small;
    if (!b) return;
    if (lastSearchState === ready) return;
    lastSearchState = ready;
    b.className = ready ? 'rtv65tile' : 'rtv65tile rtv65disabled';
    small = b.getElementsByTagName('small')[0];
    text(small, ready ? 'Pesquisa contextual' : 'Ative a busca em Bibliotecas');
}
function openSearch() {
    var ui = w.PhilcoSearch642, manager = R.libraryManager, tries = 0;
    if (searchReady()) { ui.open('c'); return; }
    if (ui && ui.enabled && !ui.enabled()) {
        if (manager && manager.open) manager.open();
        return;
    }
    try { if (w.RawM3U && w.RawM3U.open) w.RawM3U.open(); } catch (e) {}
    function retry() {
        tries++;
        if (searchReady()) { w.PhilcoSearch642.open('c'); return; }
        if (tries < 6) w.setTimeout(retry, 220);
    }
    w.setTimeout(retry, 160);
}
function decorate() {
    playerStyle();
    var b = d.getElementById('rtvSearchHome'), status = d.getElementById('rtv65status');
    fixM3U();
    if (b) b.onclick = openSearch;
    if (status) text(status, 'M3U · Philco 6308 · modo leve');
    refreshSearchCard();
}
function schedule() {
    var q = R.renderScheduler65;
    if (q && q.enqueue) q.enqueue(decorate, 'launcher-decorate');
    else decorate();
}
function boot() {
    if (installed) return;
    installed = true;
    schedule();
    w.setTimeout(refreshSearchCard, 600);
    w.setTimeout(refreshSearchCard, 1800);
}
if (d.readyState === 'loading' && d.addEventListener) d.addEventListener('DOMContentLoaded', boot, false);
else boot();
R.launcher65 = {refresh:schedule, searchReady:searchReady};
}(this, document));
