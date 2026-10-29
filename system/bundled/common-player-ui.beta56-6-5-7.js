/* 6.5.7 standalone module; skip only after complete bundled startup. */
(function(w){
if(w.RemoteTV&&w.RemoteTV.activeCoreBundle==='0.56-beta.6.5.7')return;
/* RemoteTV beta 3. ES5 source; compatibility aliases are intentional. */
(function (windowRef, documentRef) {
    'use strict';
    var localBridgeScope = new window.RemoteTV.RequestScope();
    var mediaCore = windowRef.YTCore, remoteTV = windowRef.RemoteTV || (windowRef.RemoteTV = {}), __oc = documentRef.getElementById('c14'), __os = documentRef.getElementById('c14css');
    if (__oc && __oc.parentNode)
        __oc.parentNode.removeChild(__oc);
    if (__os && __os.parentNode)
        __os.parentNode.removeChild(__os);
    var viewState = {
        on: 0,
        H: [],
        cats: [],
        cat: 0,
        items: [],
        ci: 0,
        mode: 'cats',
        preview: null,
        playing: 0,
        full: 0,
        cp: 0,
        page: 0,
        log: 0,
        lt: 0,
        oldKey: null,
        session35: 0,
        logToken35: 0,
        catTimer35: 0,
        groups35: {},
        itemsCat35: -1,
        catPage35: -1,
        chPage35: -1,
        refresh35: null,
        imgTimer35: 0,
        imgWait35: 0,
        imgActive35: null,
        imgQueue35: []
    };
    if (!mediaCore)
        return;
    function element(i) {
        return documentRef.getElementById(i);
    }
    function escapeHtml(x) {
        return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                '\'': '&#39;'
            }[c];
        });
    }
    function keyCode(e) {
        return e && (e.which || e.keyCode) || windowRef.event && (windowRef.event.which || windowRef.event.keyCode) || 0;
    }
    function preventDefault(e) {
        if (e && e.preventDefault)
            e.preventDefault();
        else if (e)
            e.returnValue = false;
    }
    function fetchLocalBridge(path, callback) {
        return localBridgeScope.local(path, callback, 3500);
    }
    function log(s) {
        try {
            fetchLocalBridge('/debug/mark?m=' + encodeURIComponent('C35 ' + s), function () {
            });
        } catch (e) {
        }
        try {
            if (windowRef.XT10 && windowRef.XT10.log)
                windowRef.XT10.log('COMMON35', s);
        } catch (e) {
        }
    }
    function css() {
        if (element('c14css'))
            return;
        var s = documentRef.createElement('style');
        s.id = 'c14css';
        s.textContent = '#c14{position:fixed;z-index:245;left:0;top:0;width:1280px;height:720px;color:#eef2f4;font:20px Arial;background:transparent;overflow:hidden}' + '#c14.h{display:none}' + '#c14h{height:82px;padding:15px 24px;box-sizing:border-box;background:-webkit-linear-gradient(top,#151a1e,#0b0f12);border-bottom:1px solid #687078;box-shadow:inset 0 1px 0 rgba(255,255,255,.10)}' + '#c14h b{font-size:29px;line-height:50px}' + '#c14body{position:absolute;left:0;top:82px;width:1280px;height:638px;overflow:hidden;background:transparent}' + '.g14{background:-webkit-linear-gradient(top,rgba(36,42,47,.88),rgba(12,16,19,.94));border:1px solid #899198;box-shadow:inset 0 1px 0 rgba(255,255,255,.13),inset 0 -14px 28px rgba(0,0,0,.22),0 9px 24px rgba(0,0,0,.32);border-radius:13px}' + '.c14panel{position:absolute;top:0;height:638px;box-sizing:border-box;padding:14px 10px;background:rgba(8,11,13,.96)}' + '#c14cats{left:0;width:250px;border-right:1px solid #41484e}' + '#c14chs{left:250px;width:326px;border-right:1px solid #41484e}' + '#c14.collapsed #c14cats{display:none}' + '#c14.collapsed #c14chs{left:0}' + '.c14title{height:34px;padding:4px 8px;font-size:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' + '.c14list{height:530px;overflow:hidden}' + '.c14cat,.c14ch{display:block;width:100%;height:58px;margin:0 0 6px;padding:0 12px;text-align:left;color:#eef2f4;font:17px Arial;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' + '.c14cat.sel,.c14ch.sel{background:-webkit-linear-gradient(top,#303840,#1a2025)}' + '.c14cat:focus,.c14ch:focus,.c14btn:focus,#c14logb:focus{outline:0;border:2px solid #fff;box-shadow:0 0 0 2px rgba(255,255,255,.18),inset 0 1px 0 rgba(255,255,255,.16)}' + '.c14ch img{width:40px;height:40px;object-fit:contain;vertical-align:middle;margin-right:9px;border-radius:8px;background:#060809}' + '.c14ch span{display:inline-block;vertical-align:middle;max-width:235px;overflow:hidden;text-overflow:ellipsis}' + '.c14foot{font-size:13px;color:#aab2b7;padding:5px 7px}' + '.c14preview{position:absolute;left:576px;right:0;top:0;height:492px;background:transparent}' + '.collapsed .c14preview{left:326px}' + '.c14poster{position:absolute;left:50%;top:46%;width:220px;height:140px;margin-left:-110px;margin-top:-70px;text-align:center;color:#dce2e5;opacity:.92}' + '.c14poster img{max-width:180px;max-height:105px;object-fit:contain}' + '.c14mono{width:96px;height:96px;margin:0 auto 10px;border-radius:48px;border:1px solid #aeb5ba;line-height:96px;font-size:35px;background:-webkit-linear-gradient(top,#293138,#11161a);box-shadow:inset 0 1px 0 rgba(255,255,255,.2)}' + '.c14pvtitle{position:absolute;left:22px;right:22px;top:17px;padding:8px 12px;background:rgba(6,8,10,.70);border:1px solid rgba(180,186,190,.45);border-radius:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' + '.c14ctrl{position:absolute;left:576px;right:0;top:492px;height:146px;padding:27px 25px;box-sizing:border-box;background:-webkit-linear-gradient(top,rgba(17,22,26,.97),rgba(8,11,13,.98));border-top:1px solid #6c747a}' + '.collapsed .c14ctrl{left:326px}' + '.c14btn{display:inline-block;min-width:168px;padding:11px 15px;margin-right:10px;color:#eef2f4;font:17px Arial;text-align:center}' + '.c14hint{display:block;margin-top:14px;font-size:13px;color:#aab2b7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' + '#c14log{position:absolute;z-index:20;left:24px;top:18px;right:24px;bottom:18px;padding:18px;background:rgba(5,7,9,.98)}' + '#c14log.h{display:none}' + '#c14logb{height:500px;overflow:hidden;white-space:pre-wrap;background:#040607;border:1px solid #697177;border-radius:10px;padding:12px;font:14px monospace;color:#d7dde1}' + '.c14logbtn{margin-top:10px}';
        documentRef.head.appendChild(s);
    }
    function root() {
        var r = element('c14');
        if (r)
            return r;
        r = documentRef.createElement('section');
        r.id = 'c14';
        r.className = 'h';
        r.innerHTML = '<div id="c14h"><b>M3U Player <span style="font-size:15px;color:#9fa8ae">Graphene</span></b></div><div id="c14body"></div><div id="c14log" class="h"><h2>Log do player</h2><pre id="c14logb" tabindex="0"></pre><button id="c14logx" class="c14btn g14 c14logbtn">Fechar log</button></div>';
        documentRef.body.appendChild(r);
        css();
        element('c14logx').onclick = hideLog;
        return r;
    }
    function hideBase() {
        var a = [
                'menu',
                'new',
                'tvlist'
            ], i, z;
        for (i = 0; i < a.length; i++) {
            z = element(a[i]);
            if (z)
                z.className = 'h';
        }
    }
    function showMenu() {
        var p = element('player');
        if (p)
            p.className = 'h';
        var m = element('menu');
        if (m)
            m.className = '';
        var tv = element('tv');
        if (tv)
            tv.focus();
    }
    function uniqueCats() {
        var o = {}, a = [], i, g, key;
        for (i = 0; i < viewState.H.length; i++) {
            g = String(viewState.H[i][1] || 'Sem categoria');
            key = '$' + g;
            if (!o[key]) {
                o[key] = [];
                a.push(g);
            }
            o[key].push(viewState.H[i]);
        }
        viewState.cats = a;
        viewState.groups35 = o;
    }
    function chLogo(ch) {
        return ch && ch[3] ? String(ch[3]) : '';
    }
    function asset(u) {
        u = String(u || '');
        return /^https?:\/\//i.test(u) ? 'http://127.0.0.1:8765/fetch?u=' + encodeURIComponent(u) : u;
    }
    function mono(n) {
        n = String(n || '?').replace(/^\s+|\s+$/g, '');
        return escapeHtml((n.charAt(0) || '?').toUpperCase());
    }
    function clearImageQueue() {
        clearTimeout(viewState.imgTimer35);
        clearTimeout(viewState.imgWait35);
        if (viewState.imgActive35) {
            viewState.imgActive35.onload = viewState.imgActive35.onerror = null;
            viewState.imgActive35.removeAttribute('src');
        }
        viewState.imgActive35 = null;
        viewState.imgQueue35 = [];
    }
    function loadNextImage() {
        var im;
        viewState.imgTimer35 = 0;
        if (!viewState.on || viewState.full || viewState.imgActive35)
            return;
        while (viewState.imgQueue35.length) {
            im = viewState.imgQueue35.shift();
            if (documentRef.documentElement.contains(im) && im.getAttribute('data-src'))
                break;
            im = null;
        }
        if (!im)
            return;
        viewState.imgActive35 = im;
        function done(ok) {
            if (viewState.imgActive35 !== im)
                return;
            clearTimeout(viewState.imgWait35);
            viewState.imgActive35 = null;
            im.onload = im.onerror = null;
            im.removeAttribute('data-src');
            if (!ok) {
                im.removeAttribute('src');
                im.style.visibility = 'hidden';
            }
            viewState.imgTimer35 = setTimeout(loadNextImage, 60);
        }
        im.onload = function () {
            done(1);
        };
        im.onerror = function () {
            done(0);
        };
        viewState.imgWait35 = setTimeout(function () {
            done(0);
        }, 4500);
        im.src = im.getAttribute('data-src');
    }
    function enqueueImages(box) {
        var l = box.querySelectorAll('img[data-src]'), i;
        for (i = 0; i < l.length; i++)
            viewState.imgQueue35.push(l[i]);
        clearTimeout(viewState.imgTimer35);
        viewState.imgTimer35 = setTimeout(loadNextImage, 180);
    }
    function handleImageNavigation() {
        if (!viewState.imgActive35 && !viewState.imgTimer35)
            viewState.imgTimer35 = setTimeout(loadNextImage, 60);
    }
    function discardContainerImages(box) {
        var im = viewState.imgActive35, l = box.querySelectorAll('img'), i, q = [];
        if (im && box.contains(im)) {
            clearTimeout(viewState.imgWait35);
            im.onload = im.onerror = null;
            viewState.imgActive35 = null;
        }
        for (i = 0; i < l.length; i++)
            l[i].removeAttribute('src');
        for (i = 0; i < viewState.imgQueue35.length; i++)
            if (!box.contains(viewState.imgQueue35[i]))
                q.push(viewState.imgQueue35[i]);
        viewState.imgQueue35 = q;
    }
    function findButtonIndex(e, box, attr) {
        var z = e.target || e.srcElement;
        while (z && z != box) {
            if (z.getAttribute && z.getAttribute(attr) != null)
                return +z.getAttribute(attr);
            z = z.parentNode;
        }
        return -1;
    }
    function markSelectedButton(box, attr, value) {
        var l = box.querySelectorAll('button'), i;
        for (i = 0; i < l.length; i++)
            l[i].className = (attr == 'data-ci' ? 'c14cat' : 'c14ch') + ' g14' + (+l[i].getAttribute(attr) == value ? ' sel' : '');
    }
    function commitCategory() {
        clearTimeout(viewState.catTimer35);
        if (viewState.itemsCat35 == viewState.cat)
            return;
        viewState.itemsCat35 = viewState.cat;
        viewState.items = viewState.groups35['$' + viewState.cats[viewState.cat]] || [];
        viewState.ci = 0;
        viewState.page = 0;
        viewState.chPage35 = -1;
        stopPreview();
        renderChannels();
        renderPreview();
    }
    function renderCategories() {
        var box = element('c14catlist'), st = Math.floor(viewState.cat / 8) * 8, h = '', i;
        if (!box)
            return;
        if (viewState.catPage35 != st) {
            viewState.catPage35 = st;
            for (i = st; i < viewState.cats.length && i < st + 8; i++)
                h += '<button class="c14cat g14" data-ci="' + i + '">' + escapeHtml(viewState.cats[i]) + '</button>';
            box.innerHTML = h;
            box.onclick = function (e) {
                var ix = findButtonIndex(e, box, 'data-ci');
                if (ix >= 0)
                    setCategory(ix);
            };
            bindCategoryFocus();
            element('c14catfoot35').textContent = (viewState.cats.length ? st + 1 : 0) + '\u2013' + Math.min(st + 8, viewState.cats.length) + ' / ' + viewState.cats.length;
        }
        markSelectedButton(box, 'data-ci', viewState.cat);
    }
    function renderChannels() {
        var box = element('c14chlist'), st = viewState.page * 8, h = '', i, ch;
        if (!box)
            return;
        if (viewState.chPage35 != st) {
            discardContainerImages(box);
            viewState.chPage35 = st;
            for (i = st; i < viewState.items.length && i < st + 8; i++) {
                ch = viewState.items[i];
                h += '<button class="c14ch g14" data-ii="' + i + '">' + (chLogo(ch) ? '<img data-src="' + escapeHtml(asset(chLogo(ch))) + '">' : '') + '<span>' + escapeHtml(ch[0]) + '</span></button>';
            }
            box.innerHTML = h;
            box.onclick = function (e) {
                var ix = findButtonIndex(e, box, 'data-ii');
                if (ix >= 0)
                    selectChannel(ix);
            };
            enqueueImages(box);
        }
        markSelectedButton(box, 'data-ii', viewState.ci);
        element('c14chtitle35').textContent = viewState.cats[viewState.itemsCat35] || 'Canais';
        element('c14chfoot35').textContent = (viewState.items.length ? st + 1 : 0) + '\u2013' + Math.min(st + 8, viewState.items.length) + ' / ' + viewState.items.length;
    }
    function renderPreview() {
        var box = element('c14preview35');
        if (!box)
            return;
        discardContainerImages(box);
        box.innerHTML = '<div class="c14pvtitle">' + escapeHtml(viewState.preview ? viewState.preview[0] : viewState.items[0] ? viewState.items[0][0] : 'Sem canais') + '</div>' + (viewState.playing ? '' : poster(viewState.preview || viewState.items[0]));
        enqueueImages(box);
    }
    function renderViewMode() {
        root().className = viewState.mode == 'channels' ? 'collapsed' : '';
        element('c14hint35').textContent = viewState.mode == 'cats' ? '\u2192 entra nos canais \xB7 categoria selecionada atualiza a lista' : '\u2190 volta às categorias \xB7 OK = preview; OK novamente = tela cheia';
    }
    function navigateBack() {
        if (!viewState.on)
            return false;
        if (viewState.log)
            hideLog();
        else if (viewState.full)
            leaveFullscreen();
        else if (viewState.mode == 'channels')
            showCategories();
        else
            close();
        return true;
    }
    function setCategory(ix) {
        if (!viewState.cats.length)
            return;
        viewState.cat = Math.max(0, Math.min(ix, viewState.cats.length - 1));
        renderCategories();
        commitCategory();
        focusCategory();
    }
    function stopPreview() {
        var was = viewState.playing;
        viewState.playing = 0;
        viewState.preview = null;
        if (was)
            try {
                if (windowRef.RawPlayer)
                    windowRef.RawPlayer.close();
            } catch (e) {
            }
    }
    function poster(ch) {
        var lg = chLogo(ch), n = ch ? ch[0] : '', h = '<div class="c14poster">';
        if (lg)
            h += '<img data-src="' + escapeHtml(asset(lg)) + '">';
        else
            h += '<div class="c14mono">' + mono(n) + '</div>';
        h += '<div>' + escapeHtml(n || 'Selecione um canal') + '</div></div>';
        return h;
    }
    function render() {
        var b = element('c14body');
        if (!element('c14catlist')) {
            b.innerHTML = '<div id="c14cats" class="c14panel"><div class="c14title">Categorias</div><div id="c14catlist" class="c14list"></div><div id="c14catfoot35" class="c14foot"></div></div><div id="c14chs" class="c14panel"><div id="c14chtitle35" class="c14title"></div><div id="c14chlist" class="c14list"></div><div id="c14chfoot35" class="c14foot"></div></div><div id="c14preview35" class="c14preview"></div><div class="c14ctrl"><button id="c14back" class="c14btn g14">Voltar</button><button id="c14full" class="c14btn g14">Tela cheia</button><button id="c14logs" class="c14btn g14">Log</button><span id="c14hint35" class="c14hint" role="status" aria-live="polite"></span></div>';
            viewState.catPage35 = viewState.chPage35 = -1;
            element('c14back').onclick = navigateBack;
            element('c14full').onclick = enterFullscreen;
            element('c14logs').onclick = showLog;
        }
        renderCategories();
        renderChannels();
        renderPreview();
        renderViewMode();
    }
    function bindCategoryFocus() {
        var l = element('c14catlist').querySelectorAll('.c14cat'), i;
        for (i = 0; i < l.length; i++)
            l[i].onfocus = function () {
                var x = +this.getAttribute('data-ci');
                if (x != viewState.cat) {
                    viewState.cat = x;
                    markSelectedButton(element('c14catlist'), 'data-ci', x);
                    clearTimeout(viewState.catTimer35);
                    viewState.catTimer35 = setTimeout(function () {
                        if (viewState.on)
                            commitCategory();
                    }, 160);
                }
            };
    }
    function focusCategory() {
        var z = element('c14catlist') && element('c14catlist').querySelector('[data-ci="' + viewState.cat + '"]');
        if (z)
            z.focus();
        else if (element('c14back'))
            element('c14back').focus();
    }
    function focusChannel() {
        var z = element('c14chlist') && element('c14chlist').querySelector('[data-ii="' + viewState.ci + '"]');
        if (z)
            z.focus();
        else if (element('c14back'))
            element('c14back').focus();
    }
    function selectChannel(i) {
        var ch = viewState.items[i];
        if (!ch)
            return;
        if (viewState.preview === ch && viewState.playing) {
            enterFullscreen();
            return;
        }
        viewState.ci = i;
        viewState.preview = ch;
        viewState.playing = 1;
        log('preview ' + ch[0]);
        if (windowRef.RawPlayer)
            windowRef.RawPlayer.play(ch[0], ch[2], false, false, null, true);
        renderChannels();
        renderPreview();
        focusChannel();
    }
    function enterFullscreen() {
        var ok = 0;
        if (!viewState.preview || !viewState.playing) {
            if (viewState.items[viewState.ci])
                selectChannel(viewState.ci);
            return;
        }
        if (windowRef.RawPlayer && windowRef.RawPlayer.fullscreen)
            try {
                ok = windowRef.RawPlayer.fullscreen(1) ? 1 : 0;
            } catch (e) {
                ok = 0;
            }
        if (ok) {
            viewState.full = 1;
            handleImageNavigation();
            root().className = 'h';
            log('fullscreen headless ' + viewState.preview[0]);
        }
    }
    function leaveFullscreen() {
        var z;
        if (windowRef.RawPlayer && windowRef.RawPlayer.fullscreen)
            try {
                windowRef.RawPlayer.fullscreen(0);
            } catch (e) {
            }
        viewState.full = 0;
        renderViewMode();
        if (viewState.refresh35) {
            z = viewState.refresh35;
            viewState.refresh35 = null;
            applyRefresh(z);
        }
        if (viewState.mode == 'cats')
            focusCategory();
        else
            focusChannel();
        loadNextImage();
    }
    function showChannels() {
        commitCategory();
        viewState.mode = 'channels';
        renderViewMode();
        focusChannel();
    }
    function showCategories() {
        viewState.mode = 'cats';
        renderViewMode();
        focusCategory();
    }
    function showLog() {
        viewState.logToken35++;
        clearTimeout(viewState.lt);
        viewState.log = 1;
        element('c14log').className = 'g14';
        readLog();
        element('c14logx').focus();
    }
    function hideLog() {
        viewState.logToken35++;
        viewState.log = 0;
        clearTimeout(viewState.lt);
        element('c14log').className = 'h';
        if (viewState.mode == 'cats')
            focusCategory();
        else
            focusChannel();
    }
    function readLog() {
        var token = viewState.session35, logToken = viewState.logToken35;
        if (!viewState.on || !viewState.log)
            return;
        fetchLocalBridge('/debug/logs', function (e, v) {
            if (!viewState.on || !viewState.log || token != viewState.session35 || logToken != viewState.logToken35)
                return;
            var b = element('c14logb');
            if (!e && b && b.textContent != v) {
                var bottom = b.scrollTop + b.clientHeight >= b.scrollHeight - 20;
                b.textContent = v;
                if (bottom)
                    b.scrollTop = b.scrollHeight;
            }
            viewState.lt = setTimeout(readLog, 1200);
        });
    }
    function applyRefresh(z) {
        if (!viewState.on)
            return;
        if (viewState.full) {
            viewState.refresh35 = z;
            return;
        }
        var oldCat = viewState.cats[viewState.cat], selected = viewState.items[viewState.ci], oldPreview = viewState.preview, oldPlaying = viewState.playing, focus = documentRef.activeElement, focusId = focus && focus.id, wasCat = focus && focus.getAttribute('data-ci') != null, wasCh = focus && focus.getAttribute('data-ii') != null, i;
        viewState.H = z || [];
        uniqueCats();
        viewState.cat = 0;
        for (i = 0; i < viewState.cats.length; i++)
            if (viewState.cats[i] == oldCat) {
                viewState.cat = i;
                break;
            }
        viewState.itemsCat35 = viewState.cat;
        viewState.items = viewState.groups35['$' + viewState.cats[viewState.cat]] || [];
        viewState.ci = 0;
        viewState.preview = null;
        viewState.playing = 0;
        for (i = 0; i < viewState.items.length; i++) {
            if (selected && viewState.items[i][2] == selected[2])
                viewState.ci = i;
            if (oldPreview && viewState.items[i][2] == oldPreview[2]) {
                viewState.preview = viewState.items[i];
                viewState.playing = oldPlaying;
            }
        }
        if (oldPlaying && !viewState.playing)
            try {
                if (windowRef.RawPlayer)
                    windowRef.RawPlayer.close();
            } catch (e) {
            }
        viewState.page = Math.floor(viewState.ci / 8);
        viewState.catPage35 = viewState.chPage35 = -1;
        render();
        if (focusId && element(focusId))
            element(focusId).focus();
        else if (wasCat)
            focusCategory();
        else if (wasCh)
            focusChannel();
        log('fonte atualizada \xB7 ' + viewState.H.length + ' canais');
    }
    function load(cb) {
        var token = viewState.session35, h = mediaCore.channels || [], cached = h.length > 0;
        if (cached) {
            viewState.H = h;
            uniqueCats();
            cb();
        }
        setTimeout(function () {
            if (!viewState.on || token != viewState.session35)
                return;
            fetchLocalBridge('/c', function (e, v) {
                if (!viewState.on || token != viewState.session35)
                    return;
                var z = [];
                if (!e)
                    try {
                        z = JSON.parse(v);
                    } catch (y) {
                        log('/c inválido');
                    }
                if (!z || Object.prototype.toString.call(z) != '[object Array]')
                    z = [];
                if (cached) {
                    if (z.length) {
                        mediaCore.channels = z;
                        applyRefresh(z);
                    }
                    return;
                }
                if (!z.length)
                    z = mediaCore.channels || [];
                mediaCore.channels = z;
                viewState.H = z;
                uniqueCats();
                cb();
            });
        }, cached ? 30 : 0);
    }
    function open() {
        if (viewState.on)
            return;
        if (windowRef.RawM3U && windowRef.RawM3U.back)
            try {
                windowRef.RawM3U.back();
            } catch (e) {
            }
        try {
            if (windowRef.RawPlayer)
                windowRef.RawPlayer.close();
        } catch (e) {
        }
        hideBase();
        root().className = '';
        viewState.session35++;
        viewState.on = 1;
        viewState.mode = 'cats';
        viewState.full = 0;
        viewState.preview = null;
        viewState.playing = 0;
        viewState.log = 0;
        viewState.refresh35 = null;
        viewState.items = [];
        viewState.itemsCat35 = -1;
        element('c14log').className = 'h';
        element('c14body').innerHTML = '<div style="padding:70px 35px">Carregando canais\u2026</div>';
        load(function () {
            if (!viewState.on)
                return;
            viewState.cat = 0;
            viewState.ci = 0;
            viewState.cp = 0;
            viewState.page = 0;
            viewState.itemsCat35 = 0;
            viewState.items = viewState.groups35['$' + viewState.cats[0]] || [];
            render();
            focusCategory();
            log('open v35');
        });
    }
    function close() {
        viewState.session35++;
        clearTimeout(viewState.lt);
        clearTimeout(viewState.catTimer35);
        clearImageQueue();
        viewState.log = 0;
        viewState.on = 0;
        viewState.full = 0;
        viewState.refresh35 = null;
        viewState.preview = null;
        viewState.playing = 0;
        try {
            if (windowRef.RawPlayer)
                windowRef.RawPlayer.close();
        } catch (e) {
        }
        root().className = 'h';
        element('c14log').className = 'h';
        discardContainerImages(element('c14body'));
        element('c14body').innerHTML = '';
        viewState.items = [];
        viewState.groups35 = {};
        showMenu();
        log('close');
    }
    function moveCategory(k) {
        var n = viewState.cat + (k == 38 ? -1 : 1);
        if (n < 0 || n >= viewState.cats.length)
            return true;
        viewState.cat = n;
        renderCategories();
        focusCategory();
        clearTimeout(viewState.catTimer35);
        viewState.catTimer35 = setTimeout(function () {
            if (viewState.on)
                commitCategory();
        }, 160);
        return true;
    }
    function moveChannel(k) {
        var n = viewState.ci + (k == 38 ? -1 : 1);
        if (n < 0 || n >= viewState.items.length)
            return true;
        viewState.ci = n;
        viewState.page = Math.floor(n / 8);
        renderChannels();
        focusChannel();
        return true;
    }
    function handleKey(e) {
        if (!viewState.on)
            return false;
        var k = keyCode(e), o = documentRef.activeElement, l, i, bk = ',4,8,27,158,166,461,462,464,528,1061,10009,'.indexOf(',' + k + ',') >= 0;
        if (viewState.full) {
            if (bk || (k == 13 || k == 41) && o && (o.id == 'pb' || o.id == 'pf') && element('ctrl').className != 'hide') {
                preventDefault(e);
                leaveFullscreen();
                return true;
            }
            return false;
        }
        if (viewState.log) {
            if (bk || k == 37 || k == 39) {
                preventDefault(e);
                hideLog();
                return true;
            }
            if (k == 38 || k == 40) {
                preventDefault(e);
                element('c14logb').scrollTop += k == 38 ? -110 : 110;
                return true;
            }
            if (k == 13 || k == 41) {
                preventDefault(e);
                hideLog();
                return true;
            }
            return false;
        }
        if (bk) {
            preventDefault(e);
            navigateBack();
            return true;
        }
        if (viewState.mode == 'cats' && o && /c14cat/.test(o.className || '')) {
            if (k == 38 || k == 40) {
                preventDefault(e);
                moveCategory(k);
                return true;
            }
            if (k == 39 || k == 13 || k == 41) {
                preventDefault(e);
                showChannels();
                return true;
            }
        }
        if (viewState.mode == 'channels' && o && /c14ch/.test(o.className || '')) {
            if (k == 38 || k == 40) {
                preventDefault(e);
                moveChannel(k);
                return true;
            }
            if (k == 37) {
                preventDefault(e);
                showCategories();
                return true;
            }
            if (k == 39) {
                preventDefault(e);
                element('c14full').focus();
                return true;
            }
            if (k == 13 || k == 41) {
                preventDefault(e);
                selectChannel(+o.getAttribute('data-ii'));
                return true;
            }
        }
        if (o && (o.id == 'c14back' || o.id == 'c14full' || o.id == 'c14logs')) {
            l = [
                element('c14back'),
                element('c14full'),
                element('c14logs')
            ];
            for (i = 0; i < l.length; i++)
                if (l[i] == o)
                    break;
            if (k == 37) {
                preventDefault(e);
                if (i > 0)
                    l[i - 1].focus();
                else if (viewState.mode == 'cats')
                    focusCategory();
                else
                    focusChannel();
                return true;
            }
            if (k == 39) {
                preventDefault(e);
                if (i < 2)
                    l[i + 1].focus();
                return true;
            }
            if (k == 38) {
                preventDefault(e);
                if (viewState.mode == 'cats')
                    focusCategory();
                else
                    focusChannel();
                return true;
            }
            if (k == 13 || k == 41) {
                preventDefault(e);
                o.click();
                return true;
            }
        }
        if (k >= 37 && k <= 40) {
            preventDefault(e);
            if (!o || !root().contains(o))
                focusCategory();
            return true;
        }
        return false;
    }
    viewState.oldKey = documentRef.onkeydown;
    documentRef.onkeydown = function (e) {
        if (handleKey(e))
            return false;
        return viewState.oldKey ? viewState.oldKey(e) : true;
    };
    var tv = element('tv');
    if (tv)
        tv.onclick = open;
    windowRef.CommonPlayer14 = {
        open: open,
        close: close,
        key: handleKey,
        back: navigateBack,
        input: handleImageNavigation,
        state: viewState
    };
    remoteTV.commonPlayerUI = '0.56-beta.1';
}(this, document));

}.call(window,window));
