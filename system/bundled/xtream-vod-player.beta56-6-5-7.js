/* 6.5.7 standalone module; skip only after complete bundled startup. */
(function(w){
if(w.RemoteTV&&w.RemoteTV.activeCoreBundle==='0.56-beta.6.5.7')return;
/* RemoteTV beta 3. ES5 source; compatibility aliases are intentional. */
(function (windowRef, documentRef) {
    'use strict';
    var localBridgeScope = new window.RemoteTV.RequestScope();
    try {
        if (windowRef.XTVod19 && windowRef.XTVod19.active && windowRef.XTVod19.active())
            windowRef.XTVod19.stop();
    } catch (__e) {
    }
    var __old = documentRef.getElementById('xv14'), __c1 = documentRef.getElementById('xv14css'), __c2 = documentRef.getElementById('xv20css'), __c3 = documentRef.getElementById('xv25css');
    if (__old && __old.parentNode)
        __old.parentNode.removeChild(__old);
    if (__c1 && __c1.parentNode)
        __c1.parentNode.removeChild(__c1);
    if (__c2 && __c2.parentNode)
        __c2.parentNode.removeChild(__c2);
    if (__c3 && __c3.parentNode)
        __c3.parentNode.removeChild(__c3);
    var xtreamApi = windowRef.XT10, mediaCore = windowRef.YTCore, streamResolver = windowRef.XTAutoVod22, hlsLoader = windowRef.XTHls20, remoteTV = windowRef.RemoteTV || (windowRef.RemoteTV = {}), progressStorageKey = 'xtream.progress.v14', continueStorageKey = 'xtream.continue.v14', playbackState = {
            on: 0,
            engine: '',
            mp: null,
            id: -1,
            video: null,
            hls: null,
            item: null,
            list: null,
            index: -1,
            ctx: null,
            pos: 0,
            dur: 0,
            paused: 0,
            nextShown: 0,
            timer: 0,
            token: 0,
            resumeAt: 0,
            resumeDone: 0,
            lastSave: 0,
            hudTimer: 0,
            logTimer: 0,
            logOpen: 0,
            bufferTimer: 0,
            buffering: 0,
            stalls: 0,
            url: '',
            reconnects: 0,
            recovering: 0,
            lastClock: -1,
            lastAdvanceAt: 0,
            lastHeartbeat: 0,
            lowMark: 0,
            events: [],
            seekMode: 0,
            seekTarget: 0,
            seekOrigin: 0,
            seekWasPaused: 0,
            previewVideo: null,
            previewTimer: 0,
            previewFrameTimer: 0,
            previewToken: 0,
            previewReady: 0,
            hudVisible: 0,
            pcache: null,
            pcacheAt: 0,
            resumeIssuedAt34: 0,
            resumeAttempts34: 0,
            resumeStartedAt34: 0,
            resumeFailed34: 0,
            clockQuirkLogged45: 0,
            lastClockQuirkLog45: 0,
            lastHealthy45: 0
        };
    if (!xtreamApi || !mediaCore)
        return;
    var hlsProfile = {
            m: 2,
            a: 4,
            s: 2,
            l: 'AutoHLS VOD'
        }, mp4Profile = {
            m: 2,
            a: 4,
            s: 3,
            l: 'Container MP4'
        }, transportStreamProfile = {
            m: 1,
            a: 4,
            s: 2,
            l: 'Container TS/MKV'
        };
    function element(i) {
        return documentRef.getElementById(i);
    }
    function preventDefault(e) {
        if (e && e.preventDefault)
            e.preventDefault();
        else if (e)
            e.returnValue = false;
    }
    function keyCode(e) {
        return e && (e.which || e.keyCode) || windowRef.event && (windowRef.event.which || windowRef.event.keyCode) || 0;
    }
    function moduleNow() {
        return new Date().getTime();
    }
    function formatTime(n) {
        n = Math.max(0, parseInt(n, 10) || 0);
        var h = Math.floor(n / 3600), m = Math.floor(n % 3600 / 60), s = n % 60;
        return (h ? h + ':' : '') + (h && m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }
    function load(k, def) {
        try {
            var x = JSON.parse(localStorage.getItem(k) || '');
            return x || def;
        } catch (e) {
            return def;
        }
    }
    function save(k, v) {
        try {
            localStorage.setItem(k, JSON.stringify(v));
        } catch (e) {
        }
    }
    function lite(o) {
        if (!o)
            return null;
        return {
            t: o.t,
            id: o.id,
            n: o.n || '',
            p: o.p || '',
            ext: o.ext || '',
            y: o.y || '',
            r: o.r || '',
            ds: o.ds || '',
            sn: o.sn || 0,
            ep: o.ep || 0
        };
    }
    function pkey(o) {
        return (o && o.t == 'm' ? 'm:' : 'e:') + String(o && o.id != null ? o.id : '');
    }
    function progress(o) {
        var now = moduleNow(), p, k;
        if (!o)
            return null;
        if (!playbackState.pcache || now - playbackState.pcacheAt > 1200) {
            playbackState.pcache = load(progressStorageKey, {});
            playbackState.pcacheAt = now;
        }
        p = playbackState.pcache;
        k = pkey(o);
        return p[k] || p['e:' + String(o.id == null ? '' : o.id)] || null;
    }
    function cont() {
        var c = load(continueStorageKey, {
            m: [],
            s: []
        });
        if (!c.m)
            c.m = [];
        if (!c.s)
            c.s = [];
        return c;
    }
    function removeCont(t, id) {
        var c = cont(), a = c[t] || [], n = [], i;
        for (i = 0; i < a.length; i++)
            if (String(a[i].id) != String(id))
                n.push(a[i]);
        c[t] = n;
        save(continueStorageKey, c);
    }
    function upsertCont(t, r) {
        var c = cont(), a = c[t] || [], n = [r], i;
        for (i = 0; i < a.length; i++)
            if (String(a[i].id) != String(r.id))
                n.push(a[i]);
        if (n.length > 40)
            n = n.slice(0, 40);
        c[t] = n;
        save(continueStorageKey, c);
    }
    function continueList(t) {
        var a = cont()[t] || [];
        a.sort(function (x, y) {
            return (y.ts || 0) - (x.ts || 0);
        });
        return a;
    }
    function css() {
        if (element('xv25css'))
            return;
        var s = documentRef.createElement('style');
        s.id = 'xv25css';
        s.textContent = '#xv14{position:fixed;z-index:610;left:0;top:0;width:1280px;height:720px;color:#eef2f4;font:20px Arial;pointer-events:none;background:transparent;border:0!important;border-radius:0!important;outline:0!important;box-shadow:none!important;overflow:hidden}' + '#xv14.h{display:none}' + '#xv25video{position:absolute;z-index:0;left:0;top:0;width:1280px;height:720px;background:transparent;display:none;border:0!important;border-radius:0!important;outline:0!important;box-shadow:none!important;object-fit:contain}' + '#xv14top{position:absolute;z-index:2;left:28px;right:28px;top:22px;padding:10px 15px;background:rgba(10,14,17,.78);border:1px solid #717a81;border-radius:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' + '#xv14bar{position:absolute;z-index:3;left:34px;right:34px;bottom:25px;height:124px;background:rgba(11,15,18,.94);border:1px solid #747d84;border-radius:12px;padding:14px 18px;box-sizing:border-box;pointer-events:auto;white-space:nowrap;overflow:visible}' + '#xv14prog{position:relative;height:12px;background:#2a3035;border-radius:8px;margin:0 0 8px;overflow:visible}' + '#xv14fill{height:12px;width:0;background:#fff;border-radius:8px}' + '#xv14prog.seekon{box-shadow:0 0 0 2px #fff}' + '#xv32seek{display:none;position:absolute;z-index:2;top:-6px;left:0;width:8px;height:24px;margin-left:-4px;border-radius:5px;background:#fff;box-shadow:0 0 0 2px rgba(0,0,0,.45)}' + '#xv14prog.seekon #xv32seek{display:block}' + '#xv14time{font-size:13px;color:#bec6cb;margin-bottom:8px}' + '#xv14bar button,#xv14next{display:inline-block!important;width:auto!important;min-width:118px;height:39px;vertical-align:middle;background:#171c20;color:#fff;border:1px solid #8a9399;border-radius:8px;padding:7px 12px;margin:0 7px 0 0;font:15px Arial;box-sizing:border-box}' + '#xv14bar button:focus,#xv14next:focus{outline:0;border:2px solid #fff;box-shadow:0 0 0 2px rgba(255,255,255,.12)}' + '#xv14nextbox{position:absolute;z-index:4;right:34px;bottom:160px;width:330px;padding:13px;background:rgba(10,14,17,.96);border:1px solid #8a9399;border-radius:11px;pointer-events:auto}' + '#xv14nextbox.h{display:none}' + '#xv14nextbox b{display:block;margin-bottom:8px}' + '#xv14top.hudoff,#xv14bar.hudoff{display:none}' + '#xv32preview{position:absolute;z-index:5;right:34px;bottom:168px;width:320px;height:198px;padding:6px;background:rgba(4,7,9,.96);border:1px solid #aab2b8;border-radius:10px;box-sizing:border-box;pointer-events:none}' + '#xv32preview.h{display:none}' + '#xv32pv{display:block;width:306px;height:172px;background:#000;object-fit:contain}' + '#xv32ptime{display:block;height:18px;line-height:18px;text-align:center;font:13px Arial;color:#fff}' + '#xv24log{position:absolute;z-index:12;left:28px;right:28px;top:28px;bottom:28px;background:rgba(6,10,14,.94);border:1px solid rgba(162,208,236,.38);box-shadow:0 18px 48px rgba(0,0,0,.42);padding:16px;box-sizing:border-box;pointer-events:none}' + '#xv24log.h{display:none}' + '#xv24log h2{font-size:19px;font-weight:normal;margin:0 0 10px;color:#eaeff3}' + '#xv24logpre{height:570px;overflow:hidden;white-space:pre-wrap;margin:0;font:13px monospace;line-height:1.3;color:#d8e6ef;background:transparent}';
        documentRef.head.appendChild(s);
    }
    function fitVideo() {
        var v = playbackState.video, w = 1280, h = 720, vw, vh, vr, sr = 1280 / 720, nw, nh;
        if (!v)
            return;
        try {
            vw = +v.videoWidth || 0;
            vh = +v.videoHeight || 0;
        } catch (e) {
            vw = 0;
            vh = 0;
        }
        if (!vw || !vh) {
            v.style.left = '0px';
            v.style.top = '0px';
            v.style.width = '1280px';
            v.style.height = '720px';
            return;
        }
        vr = vw / vh;
        sr = 1280 / 720;
        if (vr > sr) {
            nw = w;
            nh = Math.round(w / vr);
            v.style.left = '0px';
            v.style.top = Math.round((h - nh) / 2) + 'px';
        } else {
            nh = h;
            nw = Math.round(h * vr);
            v.style.top = '0px';
            v.style.left = Math.round((w - nw) / 2) + 'px';
        }
        v.style.width = nw + 'px';
        v.style.height = nh + 'px';
        try {
            xtreamApi.log('VOD27', 'aspect ' + vw + 'x' + vh + ' -> ' + nw + 'x' + nh + ' @ ' + v.style.left + ',' + v.style.top);
        } catch (e) {
        }
    }
    function root() {
        var r = element('xv14');
        if (r)
            return r;
        r = documentRef.createElement('section');
        r.id = 'xv14';
        r.className = 'h';
        r.innerHTML = '<video id="xv25video" playsinline></video><div id="xv14top" class="hudoff"></div><div id="xv14nextbox" class="h"><b>Próximo episódio</b><button id="xv14next">Reproduzir agora</button></div><div id="xv32preview" class="h"><video id="xv32pv" muted playsinline></video><span id="xv32ptime"></span></div><div id="xv24log" class="h"><h2>Log do AutoVOD</h2><pre id="xv24logpre"></pre></div><div id="xv14bar" class="hudoff"><div id="xv14prog"><div id="xv14fill"></div><i id="xv32seek"></i></div><div id="xv14time">0:00 / 0:00</div><button id="xv14back">Voltar</button><button id="xv14rw">\u221230s</button><button id="xv14pause">Pausar</button><button id="xv14ff">+30s</button><button id="xv14log">Log</button></div>';
        documentRef.body.appendChild(r);
        css();
        playbackState.video = element('xv25video');
        playbackState.previewVideo = element('xv32pv');
        playbackState.video.onloadedmetadata = fitVideo;
        playbackState.video.onloadeddata = fitVideo;
        element('xv14back').onclick = exit;
        element('xv14rw').onclick = function () {
            seek(-30);
        };
        element('xv14ff').onclick = function () {
            seek(30);
        };
        element('xv14pause').onclick = togglePause;
        element('xv14next').onclick = next;
        element('xv14log').onclick = toggleLogOverlay;
        return r;
    }
    function fetchLocalBridge(path, callback) {
        return localBridgeScope.local(path, callback, 2500);
    }
    function formatClock() {
        var z = new Date(), h = z.getHours(), m = z.getMinutes(), s = z.getSeconds();
        return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }
    function formatPlaybackEvents() {
        return playbackState.events.slice(Math.max(0, playbackState.events.length - 95)).join('\n');
    }
    function mark(s) {
        var line = '[' + formatClock() + '] ' + String(s || '');
        playbackState.events.push(line);
        if (playbackState.events.length > 140)
            playbackState.events = playbackState.events.slice(-140);
        fetchLocalBridge('/debug/mark?m=' + encodeURIComponent('V29 ' + s), null);
        try {
            xtreamApi.log('VOD29', s);
        } catch (e) {
        }
    }
    function tailLines(s, n) {
        var a = String(s || '').split('\n');
        return a.slice(Math.max(0, a.length - (n || 70))).join('\n');
    }
    function refreshDiagnosticOverlay() {
        var pre = element('xv24logpre'), state = '', q;
        if (!playbackState.logOpen || !pre)
            return;
        state = 'engine=' + String(playbackState.engine || '\u2014') + ' \xB7 posição=' + formatTime(playbackState.pos || position()) + ' / ' + (playbackState.dur ? formatTime(playbackState.dur) : '--:--') + ' \xB7 buffer=' + bufferedAhead().toFixed(1) + 's \xB7 stalls=' + playbackState.stalls + ' \xB7 reconnects=' + playbackState.reconnects + ' \xB7 recovering=' + (playbackState.recovering ? 'sim' : 'não');
        try {
            q = new XMLHttpRequest();
            q.onreadystatechange = function () {
                if (q.readyState == 4 && playbackState.logOpen) {
                    pre.textContent = '[Player]\n' + state + '\n\n[Runtime VOD]\n' + formatPlaybackEvents() + '\n\n[Bridge]\n' + (q.status == 200 ? tailLines(q.responseText, 45) : 'debug/logs HTTP ' + q.status);
                    pre.scrollTop = pre.scrollHeight;
                    clearTimeout(playbackState.logTimer);
                    playbackState.logTimer = setTimeout(refreshDiagnosticOverlay, 1100);
                }
            };
            q.open('GET', 'http://127.0.0.1:8765/debug/logs', true);
            q.send(null);
        } catch (e) {
            pre.textContent = '[Player]\n' + state + '\n\n[Runtime VOD]\n' + formatPlaybackEvents();
            clearTimeout(playbackState.logTimer);
            playbackState.logTimer = setTimeout(refreshDiagnosticOverlay, 1200);
        }
    }
    function toggleLogOverlay() {
        var box = element('xv24log'), bt = element('xv14log');
        playbackState.logOpen = !playbackState.logOpen;
        clearTimeout(playbackState.logTimer);
        if (box)
            box.className = playbackState.logOpen ? '' : 'h';
        if (bt)
            bt.textContent = playbackState.logOpen ? 'Fechar log' : 'Log';
        xtreamApi.log('VOD27', playbackState.logOpen ? 'overlay log aberto' : 'overlay log fechado');
        if (playbackState.logOpen)
            refreshDiagnosticOverlay();
    }
    function hideHud() {
        clearTimeout(playbackState.hudTimer);
        if (playbackState.seekMode) {
            playbackState.hudTimer = setTimeout(hideHud, 4000);
            return;
        }
        var t = element('xv14top'), b = element('xv14bar'), n = element('xv14nextbox');
        playbackState.hudVisible = 0;
        if (t)
            t.className = 'hudoff';
        if (b)
            b.className = 'hudoff';
        if (n)
            n.className = playbackState.nextShown ? '' : 'h';
    }
    function showHud(focusId) {
        var t = element('xv14top'), b = element('xv14bar'), z;
        if (t)
            t.className = '';
        if (b)
            b.className = '';
        playbackState.hudVisible = 1;
        clearTimeout(playbackState.hudTimer);
        playbackState.hudTimer = setTimeout(hideHud, 4000);
        z = element(focusId || 'xv14pause');
        if (z)
            z.focus();
    }
    function bufferedAhead() {
        var v = playbackState.video, i, t, e;
        if (!v || !v.buffered)
            return 0;
        try {
            t = +v.currentTime || 0;
            for (i = 0; i < v.buffered.length; i++) {
                e = v.buffered.end(i);
                if (t >= v.buffered.start(i) - 0.2 && t <= e + 0.2)
                    return Math.max(0, e - t);
            }
        } catch (z) {
        }
        return 0;
    }
    function clearBufferGuard() {
        clearTimeout(playbackState.bufferTimer);
        playbackState.bufferTimer = 0;
        playbackState.buffering = 0;
    }
    function hasUsableHtmlBuffer() {
        var v = playbackState.video, a;
        if (!v || playbackState.engine != 'html5' || v.ended)
            return false;
        try {
            a = bufferedAhead();
            return !v.error && v.readyState >= 2 && a >= 1.25;
        } catch (e) {
            return false;
        }
    }
    function rearmLegacyPlayback(reason) {
        var now = moduleNow();
        if (!playbackState.clockQuirkLogged45 || now - playbackState.lastClockQuirkLog45 > 30000) {
            playbackState.clockQuirkLogged45 = 1;
            playbackState.lastClockQuirkLog45 = now;
            mark('CLOCK OBSERVE beta4 \xB7 sem reemitir play \xB7 ' + reason);
        }
    }
    function reconnectProgressiveStream(reason) {
        var v = playbackState.video, pos, tag, st = moduleNow(), done = 0, tk = playbackState.token, sought = 0, playIssued = 0, confirmedAt = 0;
        if (!playbackState.on || playbackState.engine != 'html5' || !v || playbackState.paused || playbackState.seekMode || playbackState.recovering || playbackState.retryTimer31 || !playbackState.url || v.ended || playbackState.recoveryFailed31)
            return;
        // Keep one target through reloads, errors and retry backoff. load() may reset currentTime.
        pos = playbackState.reconnectPending653 ? playbackState.reconnectTarget56 : Math.max(0, +v.currentTime || playbackState.pos || 0);
        playbackState.reconnectTarget56 = pos;
        playbackState.reconnectPending653 = 1;
        playbackState.recovering = 1;
        clearBufferGuard();
        tag = ++playbackState.reconnects;
        mark('RECONNECT ' + tag + ' · ' + reason + ' · posição=' + formatTime(pos));
        function valid() {
            return !done && playbackState.on && playbackState.token == tk && playbackState.video === v && playbackState.engine == 'html5';
        }
        function finish(ok, why) {
            if (!valid())
                return;
            done = 1;
            clearTimeout(playbackState.reconnectTimer31);
            playbackState.reconnectTimer31 = 0;
            playbackState.recovering = 0;
            v.oncanplay = v.onplaying = v.onseeked = null;
            v.onloadedmetadata = fitVideo;
            installBufferGuard();
            if (ok) {
                playbackState.reconnectPending653 = 0;
                playbackState.resumeDone = 1;
                playbackState.resumeFailed34 = 0;
                playbackState.recoveryFailures31 = 0;
                playbackState.lastClock = +v.currentTime || pos;
                playbackState.lastAdvanceAt = moduleNow();
                mark('RECONNECT ' + tag + ' OK · ' + (moduleNow() - st) + 'ms');
                return;
            }
            // Never persist the reset clock, including between attempts and after terminal failure.
            playbackState.resumeAt = pos;
            playbackState.resumeDone = 0;
            playbackState.resumeFailed34 = 0;
            playbackState.resumeIssuedAt34 = 0;
            playbackState.resumeAttempts34 = 0;
            playbackState.resumeStartedAt34 = moduleNow();
            if (why == 'interrompido')
                return;
            playbackState.recoveryFailures31 = (playbackState.recoveryFailures31 || 0) + 1;
            mark('RECONNECT ' + tag + ' FAIL · ' + why);
            if (playbackState.recoveryFailures31 >= 3) {
                playbackState.recoveryFailed31 = 1;
                element('xv14top').textContent = 'Conexão indisponível. Volte e tente novamente. Seu progresso foi preservado.';
                showHud('xv14back');
                return;
            }
            playbackState.retryTimer31 = setTimeout(function () {
                playbackState.retryTimer31 = 0;
                if (playbackState.on && playbackState.token == tk && !playbackState.paused && !playbackState.seekMode)
                    reconnectProgressiveStream('retry ' + tag);
            }, Math.min(9000, 2500 + playbackState.recoveryFailures31 * 1200));
        }
        function seekPlay() {
            var cp, pp;
            if (!valid() || playbackState.paused || playbackState.seekMode)
                return;
            if (playbackState.reconnectTarget56 != pos) {
                pos = playbackState.reconnectTarget56;
                sought = playIssued = confirmedAt = 0;
            }
            if (!(v.duration > 0) || v.readyState < 1)
                return;
            cp = +v.currentTime || 0;
            if (playIssued && cp < pos - 2)
                sought = playIssued = confirmedAt = 0;
            if (!sought || Math.abs(cp - pos) > 2 && !playIssued) {
                try {
                    if (pos > 0)
                        v.currentTime = pos;
                    sought = 1;
                } catch (e) {
                    return;
                }
                return; // A successful setter is not evidence that seeking completed.
            }
            if (v.seeking || Math.abs(cp - pos) > 2 && !playIssued)
                return;
            if (!playIssued) {
                confirmedAt = moduleNow();
                playIssued = 1;
                try {
                    pp = v.play();
                    if (pp && pp.catch)
                        pp.catch(function () { finish(false, 'play recusado'); });
                } catch (e) {
                    finish(false, 'play exception');
                }
            } else if (moduleNow() > confirmedAt && cp > pos + 0.25)
                finish(true, 'seek confirmado + avanço');
        }
        function poll() {
            if (!valid())
                return;
            if (playbackState.paused || playbackState.seekMode) {
                finish(false, 'interrompido');
                return;
            }
            seekPlay();
            if (!valid())
                return;
            if (moduleNow() - st >= 30000) {
                finish(false, 'timeout sem avanço em 30s');
                return;
            }
            playbackState.reconnectTimer31 = setTimeout(poll, 500);
        }
        try {
            v.onloadedmetadata = function () { if (valid()) { fitVideo(); seekPlay(); } };
            v.oncanplay = v.onplaying = v.onseeked = seekPlay;
            v.onerror = function () { finish(false, 'video error'); };
            v.pause();
            v.removeAttribute('src');
            v.load();
            v.src = playbackState.url;
            v.preload = 'auto';
            v.load();
            playbackState.reconnectTimer31 = setTimeout(poll, 500);
        } catch (e) {
            finish(false, 'exception');
        }
    }
    function recoverNativeVod() {
        var url = playbackState.url, profile = playbackState.nativeProfile653, target = playbackState.nativePending653 ? playbackState.nativeTarget653 : position();
        if (!url || !profile || playbackState.paused || playbackState.seekMode || playbackState.recoveryFailed31)
            return;
        playbackState.nativePending653 = 1;
        playbackState.nativeTarget653 = target;
        playbackState.reconnects++;
        playbackState.recoveryFailures31++;
        mark('NATIVE VOD RECONNECT ' + playbackState.reconnects + ' · alvo=' + formatTime(target));
        nativeStart(url, profile, function (ok) {
            playbackState.resumeAt = target;
            playbackState.resumeDone = target >= 5 ? 0 : 1;
            playbackState.resumeFailed34 = 0;
            playbackState.resumeAttempts34 = 0;
            playbackState.resumeIssuedAt34 = 0;
            playbackState.resumeStartedAt34 = moduleNow();
            playbackState.nativeRecoveryAt653 = moduleNow();
            playbackState.recovering = 1;
            if (!ok) {
                playbackState.recovering = 0;
                playbackState.recoveryFailed31 = 1;
                showHud('xv14back');
            }
            monitor();
        });
    }
    function watchNativeVod(now) {
        var p = playbackState.pos;
        if (playbackState.paused || playbackState.seekMode || playbackState.recoveryFailed31) {
            playbackState.lastAdvanceAt = now;
            return false;
        }
        if (playbackState.nativePending653) {
            if (playbackState.resumeDone && p > playbackState.nativeTarget653 + 0.25) {
                playbackState.nativePending653 = playbackState.recovering = 0;
                playbackState.recoveryFailures31 = 0;
                playbackState.lastAdvanceAt = now;
                playbackState.lastClock = p;
                mark('NATIVE VOD retomada confirmada por avanço');
            } else if (now - playbackState.nativeRecoveryAt653 >= 30000) {
                if (playbackState.recoveryFailures31 >= 3) {
                    playbackState.recovering = 0;
                    playbackState.recoveryFailed31 = 1;
                    element('xv14top').textContent = 'Não foi possível retomar. Seu progresso foi preservado.';
                    showHud('xv14back');
                } else {
                    recoverNativeVod();
                    return true;
                }
            }
        } else if (playbackState.lastClock < 0 || p > playbackState.lastClock + 0.12) {
            playbackState.lastClock = p;
            playbackState.lastAdvanceAt = now;
        } else if (playbackState.resumeDone && now - playbackState.lastAdvanceAt >= 30000) {
            recoverNativeVod();
            return true;
        }
        return false;
    }
    function bufferHold(why) {
        var v = playbackState.video, st = moduleNow(), startPos, a, tk = playbackState.token;
        if (!playbackState.on || playbackState.engine != 'html5' || !v || playbackState.paused || playbackState.seekMode || v.seeking || v.ended || playbackState.buffering || playbackState.recovering || playbackState.recoveryFailed31)
            return;
        playbackState.buffering = 1;
        playbackState.stalls++;
        startPos = +v.currentTime || 0;
        mark('BUFFER ' + why + ' \xB7 posição=' + formatTime(startPos) + ' \xB7 ahead=' + bufferedAhead().toFixed(1) + 's \xB7 ready=' + v.readyState + ' net=' + v.networkState);
        function chk() {
            var p, pp;
            if (tk != playbackState.token || playbackState.video !== v)
                return;
            if (!playbackState.on || playbackState.paused || playbackState.engine != 'html5' || playbackState.recovering) {
                playbackState.buffering = 0;
                return;
            }
            a = bufferedAhead();
            p = +v.currentTime || 0;
            if (p > startPos + 0.35) {
                playbackState.buffering = 0;
                playbackState.lastClock = p;
                playbackState.lastAdvanceAt = moduleNow();
                mark('BUFFER recuperado por avanço real \xB7 ahead=' + a.toFixed(1) + 's \xB7 pausa=' + (moduleNow() - st) + 'ms');
                return;
            }
            if (hasUsableHtmlBuffer() && moduleNow() - playbackState.lastAdvanceAt < 60000) {
                rearmLegacyPlayback(why + ' sem avanço do relógio');
                playbackState.bufferTimer = setTimeout(chk, 1000);
                return;
            }
            if (moduleNow() - st > 22000) {
                playbackState.buffering = 0;
                reconnectProgressiveStream(why + ' persistente sem buffer útil ' + (moduleNow() - st) + 'ms \xB7 ahead=' + a.toFixed(1) + 's');
                return;
            }
            playbackState.bufferTimer = setTimeout(chk, 500);
        }
        playbackState.bufferTimer = setTimeout(chk, 500);
    }
    function installBufferGuard() {
        var v = playbackState.video;
        if (!v || playbackState.engine != 'html5')
            return;
        v.preload = 'auto';
        v.onwaiting = function () {
            bufferHold('waiting');
        };
        v.onstalled = function () {
            bufferHold('stalled');
        };
        v.onsuspend = function () {
            var a = bufferedAhead();
            if (a < 1.2)
                mark('SUSPEND \xB7 ahead=' + a.toFixed(1) + 's \xB7 ready=' + v.readyState + ' net=' + v.networkState);
        };
        v.onprogress = function () {
            var a = bufferedAhead();
            if (a > 3)
                playbackState.lowMark = 0;
        };
        v.onseeking = function () {
            mark('SEEK begin \xB7 ' + formatTime(+v.currentTime || 0));
        };
        v.onseeked = function () {
            mark('SEEK end \xB7 ' + formatTime(+v.currentTime || 0) + ' \xB7 ahead=' + bufferedAhead().toFixed(1) + 's');
        };
        v.onerror = function () {
            var er = v.error && v.error.code;
            if (hasUsableHtmlBuffer()) {
                rearmLegacyPlayback('evento de erro ' + (er || '\u2014') + ' com buffer válido');
                return;
            }
            mark('VIDEO ERROR \xB7 code=' + (er || '\u2014') + ' \xB7 ready=' + v.readyState + ' net=' + v.networkState);
            bufferHold('video error ' + (er || ''));
        };
        mark('buffer guard beta5 \xB7 stream aceito é sticky; reconnect só após falha real persistente');
    }
    function writeState(force, complete) {
        var pg = load(progressStorageKey, {}), k, ser = playbackState.ctx && playbackState.ctx.series, rec, nextItem, now = moduleNow();
        if (!playbackState.item || playbackState.recovering || playbackState.reconnectPending653 || playbackState.nativePending653)
            return;
        if (playbackState.resumeAt >= 5 && !playbackState.resumeDone)
            return;
        if (!force && now - playbackState.lastSave < 3000)
            return;
        playbackState.lastSave = now;
        k = pkey(playbackState.item);
        if (complete)
            delete pg[k];
        else if (playbackState.pos >= 5)
            pg[k] = {
                p: Math.floor(playbackState.pos),
                d: Math.floor(playbackState.dur || 0),
                ts: now,
                n: playbackState.item.n || '',
                id: playbackState.item.id,
                t: ser ? 'e' : playbackState.item.t
            };
        save(progressStorageKey, pg);
        playbackState.pcache = pg;
        playbackState.pcacheAt = now;
        if (ser) {
            if (complete) {
                if (!playbackState.list || playbackState.index >= playbackState.list.length - 1) {
                    removeCont('s', ser.id);
                    return;
                }
                nextItem = playbackState.list[playbackState.index + 1];
                rec = {
                    t: 's',
                    id: ser.id,
                    n: ser.n || '',
                    p: ser.p || '',
                    y: ser.y || '',
                    r: ser.r || '',
                    ds: ser.ds || '',
                    episode: lite(nextItem),
                    episode_id: nextItem.id,
                    pos: 0,
                    dur: 0,
                    index: playbackState.index + 1,
                    ts: now
                };
                upsertCont('s', rec);
                return;
            }
            if (playbackState.pos < 5)
                return;
            rec = {
                t: 's',
                id: ser.id,
                n: ser.n || '',
                p: ser.p || '',
                y: ser.y || '',
                r: ser.r || '',
                ds: ser.ds || '',
                episode: lite(playbackState.item),
                episode_id: playbackState.item.id,
                pos: Math.floor(playbackState.pos),
                dur: Math.floor(playbackState.dur || 0),
                index: playbackState.index,
                ts: now
            };
            upsertCont('s', rec);
        } else if (playbackState.item.t == 'm') {
            if (complete) {
                removeCont('m', playbackState.item.id);
                return;
            }
            if (playbackState.pos >= 5)
                upsertCont('m', {
                    t: 'm',
                    id: playbackState.item.id,
                    n: playbackState.item.n || '',
                    p: playbackState.item.p || '',
                    ext: playbackState.item.ext || '',
                    y: playbackState.item.y || '',
                    r: playbackState.item.r || '',
                    ds: playbackState.item.ds || '',
                    pos: Math.floor(playbackState.pos),
                    dur: Math.floor(playbackState.dur || 0),
                    ts: now
                });
        }
    }
    function release() {
        clearTimeout(playbackState.reconnectTimer31);
        clearTimeout(playbackState.retryTimer31);
        playbackState.reconnectTimer31 = playbackState.retryTimer31 = 0;
        clearTimeout(playbackState.timer);
        clearTimeout(playbackState.hudTimer);
        clearTimeout(playbackState.logTimer);
        clearTimeout(playbackState.bufferTimer);
        clearTimeout(playbackState.previewTimer);
        playbackState.timer = 0;
        playbackState.logTimer = 0;
        playbackState.bufferTimer = 0;
        playbackState.previewTimer = 0;
        playbackState.logOpen = 0;
        playbackState.buffering = 0;
        playbackState.recovering = 0;
        playbackState.seekMode = 0;
        playbackState.hudVisible = 0;
        stopSeekPreview();
        playbackState.url = '';
        playbackState.lastClock = -1;
        playbackState.lastAdvanceAt = 0;
        playbackState.lowMark = 0;
        playbackState.token++;
        if (playbackState.hls) {
            try {
                playbackState.hls.destroy();
            } catch (e) {
            }
            playbackState.hls = null;
        }
        if (playbackState.video) {
            try {
                playbackState.video.onloadedmetadata = playbackState.video.onloadeddata = playbackState.video.oncanplay = playbackState.video.onseeked = playbackState.video.onseeking = playbackState.video.onprogress = playbackState.video.onwaiting = playbackState.video.onstalled = playbackState.video.onsuspend = playbackState.video.onplaying = playbackState.video.onended = playbackState.video.onerror = null;
                playbackState.video.pause();
                playbackState.video.removeAttribute('src');
                playbackState.video.load();
            } catch (e) {
            }
            playbackState.video.style.display = 'none';
        }
        if (playbackState.mp) {
            try {
                playbackState.mp.stop();
            } catch (e) {
            }
            try {
                if (playbackState.id >= 0)
                    playbackState.mp.releaseMediaPlayer(playbackState.id);
            } catch (e) {
            }
        }
        playbackState.mp = null;
        playbackState.id = -1;
        playbackState.engine = '';
    }
    function nativeStart(url, pr, done) {
        var K = windowRef.QjyMediaPlayer || windowRef.MediaPlayer, z, id, r, sm, tk, st = moduleNow(), last = -1, moved = 0, seen = 0, to = +(pr.to || 8500);
        release();
        tk = ++playbackState.token;
        mark('native init \xB7 ' + pr.l + ' \xB7 ' + xtreamApi.mask(url));
        try {
            if (!K) {
                mark('native FAIL \xB7 MediaPlayer ausente');
                done(false, 'MediaPlayer ausente');
                return;
            }
            z = new K();
            id = z.getNativePlayerInstanceID();
            r = z.initMediaPlayer(id, 0, 1, 720, 1280, 0, 0, 0, 0, 0, 100, 0, 0, 1);
            mark('native initMediaPlayer=' + r + ' \xB7 ' + pr.l);
            if (r == -1)
                throw 'initMediaPlayer';
            if (z.setNativeUIFlag)
                try {
                    z.setNativeUIFlag(0);
                } catch (e) {
                }
            if (z.setVideoDisplayMode)
                z.setVideoDisplayMode(1);
            if (z.refreshVideoDisplay)
                z.refreshVideoDisplay();
            sm = z.setSingleMedia(mediaCore.media(url, pr));
            mark('native setSingleMedia=' + String(sm) + ' \xB7 ' + pr.l);
            if (sm == -1)
                throw 'setSingleMedia';
            r = z.playFromStart();
            mark('native playFromStart=' + r + ' \xB7 ' + pr.l);
            if (r == -1)
                throw 'playFromStart';
            playbackState.mp = z;
            playbackState.id = id;
            playbackState.engine = 'native';
            playbackState.url = url;
            playbackState.nativeProfile653 = pr;
            playbackState.lastAdvanceAt = moduleNow();
            mark('native accepted sticky \xB7 ' + pr.l + ' \xB7 ' + (moduleNow() - st) + ' ms');
            done(true);
            return;
        } catch (e) {
            mark('native FAIL \xB7 ' + pr.l + ' \xB7 ' + String(e));
            try {
                if (z && id >= 0)
                    z.releaseMediaPlayer(id);
            } catch (y) {
            }
            done(false, String(e));
            return;
        }
    }
    function hlsJsStart(url, done) {
        var tk, v = root() && playbackState.video, handle, settled = 0, retries = 0;
        release();
        tk = ++playbackState.token;
        if (!hlsLoader || !hlsLoader.play || !v) {
            done(false, 'loader ausente');
            return;
        }
        playbackState.engine = 'hlsjs';
        playbackState.url = url;
        playbackState.video = v;
        v.style.display = 'block';
        function valid() {
            return tk == playbackState.token && playbackState.on && playbackState.engine == 'hlsjs';
        }
        handle = hlsLoader.play(v, url, playbackState.resumeAt, function (e, h) {
            settled = 1;
            if (!valid()) {
                if (h)
                    try {
                        h.destroy();
                    } catch (z) {
                    }
                return;
            }
            if (e) {
                mark('HLS.js fallback \xB7 ' + e);
                if (h)
                    try {
                        h.destroy();
                    } catch (z) {
                    }
                done(false, e);
                return;
            }
            v.onended = function () {
                finishEpisode('hls-ended');
            };
            mark('HLS.js playing');
            done(true);
        }, function (data, h) {
            var pos;
            if (!valid())
                return;
            if (playbackState.paused || playbackState.seekMode || v.seeking)
                return;
            retries++;
            mark('HLS recovery ' + retries + ' \xB7 ' + String(data.type || ''));
            if (retries <= 2) {
                try {
                    if (data.type == 'mediaError' && h.recoverMediaError)
                        h.recoverMediaError();
                    else
                        h.startLoad();
                    return;
                } catch (e) {
                }
            }
            pos = position();
            if (pos >= 5) {
                playbackState.resumeAt = pos;
                playbackState.resumeDone = 0;
                playbackState.resumeFailed34 = 0;
                playbackState.resumeIssuedAt34 = 0;
                playbackState.resumeAttempts34 = 0;
                playbackState.resumeStartedAt34 = moduleNow();
            }
            html5Start(url, function (ok) {
                if (!playbackState.on)
                    return;
                if (ok) {
                    installBufferGuard();
                    monitor();
                } else {
                    element('xv14top').textContent = 'Sinal indisponível. Volte e tente novamente.';
                    showHud('xv14back');
                }
            });
        });
        if (tk == playbackState.token && playbackState.on)
            playbackState.hls = handle;
        else if (handle)
            handle.destroy();
    }
    function html5Start(url, done) {
        var v = root() && playbackState.video, tk = ++playbackState.token, st = moduleNow(), last = -1, moved = 0, t, finished31 = 0, playIssued37 = 0, resumeGate37 = playbackState.resumeAt >= 5 ? 1 : 0;
        if (!v) {
            done(false, 'video ausente');
            return;
        }
        release();
        tk = ++playbackState.token;
        playbackState.engine = 'html5';
        playbackState.video = v;
        playbackState.url = url;
        playbackState.lastClock = -1;
        playbackState.lastAdvanceAt = moduleNow();
        v.preload = 'auto';
        v.style.display = 'block';
        v.style.visibility = resumeGate37 ? 'hidden' : 'visible';
        fitVideo();
        mark('HTML5 progressive \xB7 preload=auto \xB7 ' + xtreamApi.mask(url));
        function q(ok, why) {
            if (finished31 || !playbackState.on || tk != playbackState.token)
                return;
            finished31 = 1;
            clearTimeout(t);
            v.onplaying = null;
            v.onerror = null;
            if (!ok) {
                try {
                    v.pause();
                    v.removeAttribute('src');
                    v.load();
                } catch (e) {
                }
                v.style.display = 'none';
                playbackState.engine = '';
            }
            done(ok, why);
        }
        function playNow37() {
            var pp;
            if (playIssued37 || finished31 || !playbackState.on || tk != playbackState.token)
                return;
            if (resumeGate37 && !playbackState.resumeDone)
                return;
            playIssued37 = 1;
            v.style.visibility = 'visible';
            playbackState.lastClock = +v.currentTime || 0;
            playbackState.lastAdvanceAt = moduleNow();
            mark('HTML5 play liberado \xB7 posição=' + formatTime(+v.currentTime || 0));
            try {
                pp = v.play();
                if (pp && pp.catch)
                    pp.catch(function (e) {
                        if (!finished31)
                            q(false, 'play promise ' + e);
                    });
            } catch (e) {
                q(false, 'play exception');
            }
        }
        function resumeStep37(reason) {
            if (!resumeGate37)
                return;
            if (confirmResumePosition(reason)) {
                resumeGate37 = 0;
                mark('RETOMAR gate OK \xB7 reprodução liberada em ' + formatTime(+v.currentTime || playbackState.resumeAt));
                playNow37();
                return;
            }
            if (playbackState.resumeFailed34) {
                mark('RETOMAR gate bloqueou início em zero; progresso preservado');
                q(true, 'resume preservado');
            }
        }
        function chk() {
            var p = 0, limit = resumeGate37 ? 24000 : 7500;
            if (!playbackState.on || tk != playbackState.token)
                return;
            try {
                p = +v.currentTime || 0;
                if (playIssued37 && p != last) {
                    if (last >= 0)
                        moved++;
                    last = p;
                }
                if (resumeGate37)
                    resumeStep37('gate-preplay');
                if (finished31)
                    return;
                if (playIssued37 && (!v.paused && v.readyState >= 2 || moved >= 1)) {
                    mark('HTML5 aceito \xB7 ' + (moduleNow() - st) + ' ms \xB7 clock=' + p.toFixed(2));
                    q(true);
                    return;
                }
            } catch (e) {
            }
            if (moduleNow() - st > limit) {
                if (resumeGate37) {
                    playbackState.resumeFailed34 = 1;
                    mark('RETOMAR gate timeout; início em zero bloqueado \xB7 salvo=' + formatTime(playbackState.resumeAt));
                    showHud('xv14back');
                    element('xv14top').textContent = 'Não foi possível confirmar a retomada. O progresso salvo foi preservado.';
                    q(true, 'resume preservado');
                    return;
                }
                if (playIssued37) {
                    mark('HTML5 legado sem eventos \xB7 play aceito e preservado v49');
                    q(true, 'legacy play accepted');
                    return;
                }
                mark('HTML5 timeout antes de play');
                q(false, 'timeout');
                return;
            }
            t = setTimeout(chk, 350);
        }
        try {
            v.onloadedmetadata = function () {
                fitVideo();
                if (resumeGate37)
                    resumeStep37('metadata-preplay');
                else
                    playNow37();
            };
            v.onloadeddata = fitVideo;
            v.onseeked = function () {
                if (resumeGate37)
                    resumeStep37('seeked-preplay');
            };
            v.onplaying = function () {
                mark('HTML5 evento playing \xB7 ' + (moduleNow() - st) + ' ms \xB7 clock=' + (+v.currentTime || 0).toFixed(2));
                q(true);
            };
            v.onerror = function () {
                var rs = +v.readyState || 0, ct = +v.currentTime || 0;
                if (rs >= 2 || ct > 0) {
                    mark('HTML5 erro tardio ignorado \xB7 evidência de mídia');
                    q(true, 'error after media');
                    return;
                }
                mark('HTML5 error antes de quadro');
                q(false, 'error');
            };
            v.onended = function () {
                finishEpisode('html5-ended');
            };
            playbackState.startupAt56 = moduleNow();
            playbackState.startupClock56 = playbackState.resumeAt >= 5 ? playbackState.resumeAt : 0;
            playbackState.startupObserved56 = false;
            v.src = url;
            v.load();
            if (resumeGate37)
                mark('RETOMAR gate \xB7 aguardando seek antes do primeiro play \xB7 alvo=' + formatTime(playbackState.resumeAt));
            else
                playNow37();
            t = setTimeout(chk, 300);
        } catch (e) {
            q(false, 'exception');
        }
    }
    function directProfile(ext) {
        return /^(?:mp4|m4v|mov)$/.test(ext) ? mp4Profile : transportStreamProfile;
    }
    function tryNativeAuto(info, idx, done) {
        var ps = info.profiles || [], pr;
        if (idx >= ps.length) {
            done(false);
            return;
        }
        pr = ps[idx];
        pr.to = idx == 0 ? 9000 : idx == 1 ? 6000 : 4500;
        nativeStart(info.local, pr, function (ok, why) {
            if (ok) {
                done(true);
                return;
            }
            mark('perfil falhou \xB7 ' + pr.l + ' \xB7 ' + String(why || '\u2014'));
            tryNativeAuto(info, idx + 1, done);
        });
    }
    function failProbe(info) {
        if (streamResolver && streamResolver.probe)
            streamResolver.probe(playbackState.item, function (e, m) {
                if (e)
                    mark('AutoVOD probe falhou \xB7 ' + e);
                else
                    mark('AutoVOD bridge OK \xB7 HTTP ' + m.status + ' \xB7 ' + (m.type || 'tipo ?') + ' \xB7 ranges=' + (m.ranges || '\u2014') + ' \xB7 len=' + (m.len || '\u2014'));
            });
    }
    function startPlayback() {
        var session31 = playbackState.session31, fast;
        if (!streamResolver || !streamResolver.resolve) {
            mark('AutoVOD resolver ausente');
            return;
        }
        function valid() {
            return playbackState.on && session31 == playbackState.session31;
        }
        function nativeOrFail(info) {
            var K = windowRef.QjyMediaPlayer || windowRef.MediaPlayer;
            if (K) {
                tryNativeAuto(info, 0, function (ok) {
                    if (!valid())
                        return;
                    if (ok)
                        monitor();
                    else {
                        mark('AutoVOD native também falhou');
                        failProbe(info);
                    }
                });
            } else {
                mark('MediaPlayer global ausente \xB7 rota encerrada');
                failProbe(info);
            }
        }
        function verified(after, failedInfo) {
            mark('AutoVOD probe fallback BEGIN \xB7 id=' + playbackState.item.id);
            streamResolver.resolve(playbackState.item, function (e, info) {
                if (!valid())
                    return;
                if (e || !info) {
                    mark('AutoVOD resolver FAIL \xB7 ' + (e || 'sem info'));
                    failProbe(failedInfo || {});
                    return;
                }
                mark('AutoVOD resolver OK \xB7 ext=' + (info.ext || '\u2014') + ' \xB7 kind=' + info.kind + ' \xB7 ' + xtreamApi.mask(info.remote));
                if (after && failedInfo && info.remote == failedInfo.remote) {
                    nativeOrFail(info);
                    return;
                }
                launch(info, 1);
            });
        }
        function launch(info, isVerified) {
            if (!valid() || !info)
                return;
            playbackState.url = info.local || '';
            if (info.kind == 'hls') {
                hlsJsStart(info.local, function (ok) {
                    if (!valid())
                        return;
                    if (ok) {
                        monitor();
                        return;
                    }
                    html5Start(info.local, function (ok2) {
                        if (!valid())
                            return;
                        if (ok2) {
                            installBufferGuard();
                            monitor();
                        } else if (!isVerified)
                            verified(1, info);
                        else {
                            mark('AutoVOD HLS falhou');
                            failProbe(info);
                        }
                    });
                });
                return;
            }
            html5Start(info.local, function (ok, why) {
                if (!valid())
                    return;
                if (ok) {
                    installBufferGuard();
                    monitor();
                    return;
                }
                mark('HTML5 não iniciou \xB7 ' + String(why || '\u2014'));
                if (!isVerified) {
                    verified(1, info);
                    return;
                }
                nativeOrFail(info);
            });
        }
        fast = streamResolver.fast && streamResolver.fast(playbackState.item);
        if (fast) {
            mark('AutoVOD FAST \xB7 sem probe inicial \xB7 ext=' + (fast.ext || '\u2014'));
            launch(fast, 0);
            return;
        }
        mark('AutoVOD resolver BEGIN \xB7 id=' + playbackState.item.id + ' \xB7 declarado=' + (playbackState.item.ext || '\u2014'));
        verified(0, null);
    }
    function duration() {
        var n = 0;
        if ((playbackState.engine == 'hlsjs' || playbackState.engine == 'html5') && playbackState.video) {
            n = +playbackState.video.duration;
            return isNaN(n) || !isFinite(n) ? 0 : n;
        }
        if (playbackState.mp)
            try {
                n = playbackState.mp.getMediaDuration ? +playbackState.mp.getMediaDuration() : +playbackState.mp.mediaDuration;
            } catch (e) {
            }
        return isNaN(n) ? 0 : n;
    }
    function position() {
        var n = 0;
        if ((playbackState.engine == 'hlsjs' || playbackState.engine == 'html5') && playbackState.video) {
            n = +playbackState.video.currentTime;
            return isNaN(n) ? 0 : n;
        }
        if (playbackState.mp)
            try {
                n = playbackState.mp.getCurrentPlayTime ? +playbackState.mp.getCurrentPlayTime() : +playbackState.mp.currentPlayTime;
            } catch (e) {
            }
        return isNaN(n) ? 0 : n;
    }
    function stopSeekPreview() {
        clearTimeout(playbackState.previewTimer);
        clearTimeout(playbackState.previewFrameTimer);
        playbackState.previewTimer = 0;
        playbackState.previewFrameTimer = 0;
        playbackState.previewToken++;
        playbackState.previewReady = 0;
        var pv = playbackState.previewVideo || element('xv32pv'), box = element('xv32preview');
        if (box)
            box.className = 'h';
        if (pv) {
            try {
                pv.onloadedmetadata = pv.onloadeddata = pv.oncanplay = pv.onseeked = pv.ontimeupdate = pv.onerror = null;
                pv.pause();
                pv.removeAttribute('poster');
                pv.removeAttribute('src');
                pv.load();
            } catch (e) {
            }
        }
    }
    function renderSeekPosition() {
        var prog = element('xv14prog'), knob = element('xv32seek'), tx = element('xv14time'), pt = element('xv32ptime'), pc = playbackState.dur > 0 ? Math.max(0, Math.min(100, playbackState.seekTarget / playbackState.dur * 100)) : 0;
        if (prog)
            prog.className = 'seekon';
        if (knob)
            knob.style.left = pc + '%';
        if (tx)
            tx.textContent = 'Selecionar \xB7 ' + formatTime(playbackState.seekTarget) + ' / ' + (playbackState.dur ? formatTime(playbackState.dur) : '--:--') + ' \xB7 OK confirma \xB7 \u2191 cancela';
        if (pt)
            pt.textContent = formatTime(playbackState.seekTarget) + ' / ' + (playbackState.dur ? formatTime(playbackState.dur) : '--:--');
    }
    function previewSeekPosition(to) {
        var pv = playbackState.previewVideo || element('xv32pv'), box = element('xv32preview'), tk = ++playbackState.previewToken, target = Math.max(0, Math.min(playbackState.dur || to, to));
        if (!playbackState.seekMode || !pv || !playbackState.url)
            return;
        clearTimeout(playbackState.previewTimer);
        clearTimeout(playbackState.previewFrameTimer);
        if (box)
            box.className = 'h';
        renderSeekPosition();
        playbackState.previewTimer = setTimeout(function () {
            if (!playbackState.seekMode || tk != playbackState.previewToken)
                return;
            function valid() {
                return playbackState.seekMode && tk == playbackState.previewToken;
            }
            function show() {
                if (!valid())
                    return;
                clearTimeout(playbackState.previewFrameTimer);
                try {
                    pv.pause();
                } catch (e) {
                }
                playbackState.previewReady = 1;
                if (box)
                    box.className = '';
            }
            function prime() {
                var pp;
                if (!valid())
                    return;
                clearTimeout(playbackState.previewFrameTimer);
                try {
                    pp = pv.play();
                    if (pp && pp.catch)
                        pp.catch(function () {
                        });
                    playbackState.previewFrameTimer = setTimeout(show, 180);
                } catch (e) {
                    if (pv.readyState >= 2)
                        show();
                }
            }
            function go() {
                if (!valid())
                    return;
                try {
                    pv.currentTime = target;
                    if (pv.readyState >= 2 && Math.abs((+pv.currentTime || 0) - target) < 2)
                        prime();
                } catch (e) {
                }
            }
            try {
                pv.muted = true;
                pv.preload = 'auto';
                if (playbackState.item && playbackState.item.p)
                    pv.setAttribute('poster', playbackState.item.p);
                pv.onloadedmetadata = go;
                pv.onloadeddata = function () {
                    if (valid() && Math.abs((+pv.currentTime || 0) - target) < 2)
                        prime();
                };
                pv.oncanplay = function () {
                    if (valid() && Math.abs((+pv.currentTime || 0) - target) < 2)
                        prime();
                };
                pv.onseeked = prime;
                pv.ontimeupdate = function () {
                    if (valid() && Math.abs((+pv.currentTime || 0) - target) < 2)
                        show();
                };
                pv.onerror = function () {
                    if (valid() && box)
                        box.className = 'h';
                };
                if (!pv.getAttribute('src')) {
                    playbackState.previewReady = 0;
                    pv.src = playbackState.url;
                    pv.load();
                }
                if (pv.readyState >= 1)
                    go();
            } catch (e) {
                if (box)
                    box.className = 'h';
            }
        }, 90);
    }
    function pauseForSeek() {
        playbackState.seekWasPaused = playbackState.paused ? 1 : 0;
        try {
            if ((playbackState.engine == 'hlsjs' || playbackState.engine == 'html5') && playbackState.video && !playbackState.video.paused)
                playbackState.video.pause();
            else if (playbackState.mp && !playbackState.paused && playbackState.mp.pause)
                playbackState.mp.pause();
        } catch (e) {
        }
    }
    function restorePlaybackAfterSeek() {
        if (playbackState.seekWasPaused)
            return;
        if (playbackState.engine == 'html5' && playbackState.reconnectPending653) {
            if (!playbackState.recovering && !playbackState.retryTimer31)
                reconnectProgressiveStream('retorno do seek');
            return;
        }
        try {
            if ((playbackState.engine == 'hlsjs' || playbackState.engine == 'html5') && playbackState.video) {
                var pp = playbackState.video.play();
                if (pp && pp.catch)
                    pp.catch(function () {
                    });
            } else if (playbackState.mp && playbackState.mp.resume)
                playbackState.mp.resume();
        } catch (e) {
        }
    }
    function beginManualSeek() {
        if (playbackState.seekMode || !playbackState.on)
            return false;
        playbackState.dur = duration();
        if (!playbackState.dur || playbackState.dur <= 0)
            return false;
        playbackState.seekMode = 1;
        playbackState.seekOrigin = Math.floor(position());
        playbackState.seekTarget = playbackState.seekOrigin;
        pauseForSeek();
        showHud();
        previewSeekPosition(playbackState.seekTarget);
        mark('SEEK SELECT begin \xB7 ' + formatTime(playbackState.seekOrigin));
        return true;
    }
    function adjustManualSeek(delta) {
        if (!playbackState.seekMode)
            return false;
        playbackState.seekTarget = Math.max(0, Math.min(playbackState.dur || 999999, Math.floor(playbackState.seekTarget + delta)));
        showHud();
        previewSeekPosition(playbackState.seekTarget);
        return true;
    }
    function finishManualSeek(confirm) {
        var to = playbackState.seekTarget, origin = playbackState.seekOrigin, prog = element('xv14prog'), ok = 0;
        if (!playbackState.seekMode)
            return false;
        playbackState.seekMode = 0;
        clearTimeout(playbackState.previewTimer);
        if (prog)
            prog.className = '';
        stopSeekPreview();
        if (confirm) {
            ok = seekTo(to, 'seek fino');
            if (ok) {
                playbackState.resumeDone = 1;
                playbackState.resumeFailed34 = 0;
                playbackState.resumeIssuedAt34 = 0;
                playbackState.pos = to;
                if (playbackState.reconnectPending653)
                    playbackState.reconnectTarget56 = to;
                if (playbackState.nativePending653) {
                    playbackState.nativeTarget653 = to;
                    playbackState.nativeRecoveryAt653 = moduleNow();
                }
                playbackState.lastClock = to;
                playbackState.lastAdvanceAt = moduleNow();
                mark('SEEK SELECT confirm \xB7 ' + formatTime(to));
            } else
                mark('SEEK SELECT recusado \xB7 mantendo ' + formatTime(origin));
        } else
            mark('SEEK SELECT cancel \xB7 ' + formatTime(origin));
        restorePlaybackAfterSeek();
        showHud('xv14pause');
        return true;
    }
    function seekTo(to, label) {
        var r;
        to = Math.max(0, Math.min(playbackState.dur || 999999, Math.floor(to)));
        if (playbackState.reconnectPending653 && /^seek/.test(label || ''))
            playbackState.reconnectTarget56 = to;
        if ((playbackState.engine == 'hlsjs' || playbackState.engine == 'html5') && playbackState.video) {
            try {
                playbackState.video.currentTime = to;
                mark((label || 'seek') + ' -> ' + to);
                return true;
            } catch (e) {
                mark((label || 'seek') + ' falhou \xB7 ' + e);
                return false;
            }
        }
        if (playbackState.mp)
            try {
                if (playbackState.mp.playByTime) {
                    r = playbackState.mp.playByTime(1, String(to), 1);
                    if (r == -1) {
                        mark('playByTime recusado -> ' + to);
                        return false;
                    }
                    mark((label || 'seek') + ' -> ' + to);
                    return true;
                }
            } catch (e) {
                mark('playByTime erro ' + e);
            }
        return false;
    }
    function confirmResumePosition(reason) {
        var d0, p0, to, now = moduleNow();
        if (playbackState.resumeDone || playbackState.resumeFailed34 || playbackState.resumeAt < 5)
            return playbackState.resumeDone ? true : false;
        d0 = duration();
        p0 = position();
        if (!d0 || d0 <= 0)
            return false;
        to = Math.floor(playbackState.resumeAt);
        if (to > d0 - 2)
            to = Math.max(0, Math.floor(d0 - 2));
        if (playbackState.resumeIssuedAt34 && now > playbackState.resumeIssuedAt34 && (!(playbackState.engine == 'html5' || playbackState.engine == 'hlsjs') || !playbackState.video || !playbackState.video.seeking) && (Math.abs(p0 - to) <= 2 || p0 >= to && p0 <= to + 6)) {
            playbackState.resumeDone = 1;
            playbackState.resumeIssuedAt34 = 0;
            playbackState.pos = p0;
            mark('RETOMAR confirmado \xB7 ' + formatTime(p0) + ' \xB7 ' + String(reason || ''));
            return true;
        }
        if (playbackState.resumeIssuedAt34 && now - playbackState.resumeIssuedAt34 < 1200)
            return false;
        if (playbackState.resumeAttempts34 >= 10 || now - playbackState.resumeStartedAt34 > 22000) {
            playbackState.resumeFailed34 = 1;
            mark('RETOMAR não confirmado após ' + playbackState.resumeAttempts34 + ' tentativas \xB7 salvo=' + formatTime(to) + ' atual=' + formatTime(p0));
            showHud('xv14back');
            element('xv14top').textContent = 'Não foi possível retomar automaticamente. O progresso salvo foi preservado.';
            return false;
        }
        playbackState.resumeAttempts34++;
        seekTo(to, 'retomar ' + playbackState.resumeAttempts34);
        playbackState.resumeIssuedAt34 = now;
        return false;
    }
    function update() {
        var f = element('xv14fill'), tx = element('xv14time'), nb = element('xv14nextbox'), pc, remain, now = moduleNow(), a, adv;
        if (!playbackState.on)
            return;
        playbackState.pos = position();
        playbackState.dur = duration();
        if (playbackState.engine === 'html5' && playbackState.video && playbackState.startupAt56 && !playbackState.startupObserved56 && !playbackState.paused && !playbackState.seekMode && !playbackState.video.seeking && playbackState.resumeDone && playbackState.pos > playbackState.startupClock56 + 0.05) {
            playbackState.startupObserved56 = true;
            mark('STARTUP beta5 \xB7 avanço de relógio observado em ' + (now - playbackState.startupAt56) + ' ms \xB7 pos=' + playbackState.pos.toFixed(2));
        }
        if (playbackState.engine == 'html5' && playbackState.video && !playbackState.paused && !playbackState.seekMode && !playbackState.recovering && !playbackState.video.ended && !playbackState.recoveryFailed31 && playbackState.resumeDone && !playbackState.resumeFailed34) {
            a = bufferedAhead();
            adv = playbackState.lastClock < 0 || playbackState.pos > playbackState.lastClock + 0.12;
            if (adv) {
                playbackState.lastClock = playbackState.pos;
                playbackState.lastAdvanceAt = now;
            } else if (!playbackState.buffering && now - playbackState.lastAdvanceAt > 18000 && (!playbackState.video.seeking || now - playbackState.lastAdvanceAt > 24000)) {
                if (hasUsableHtmlBuffer() && now - playbackState.lastAdvanceAt < 60000)
                    rearmLegacyPlayback('currentTime congelado ' + (now - playbackState.lastAdvanceAt) + 'ms');
                else
                    reconnectProgressiveStream('watchdog falha real ' + (now - playbackState.lastAdvanceAt) + 'ms \xB7 ahead=' + a.toFixed(1) + 's \xB7 ready=' + playbackState.video.readyState + ' net=' + playbackState.video.networkState + ' \xB7 seeking=' + (playbackState.video.seeking ? '1' : '0'));
            }
            if (a < 2 && !playbackState.lowMark) {
                playbackState.lowMark = 1;
                mark('LOW BUFFER \xB7 ' + a.toFixed(1) + 's \xB7 posição=' + formatTime(playbackState.pos) + ' \xB7 ready=' + playbackState.video.readyState + ' net=' + playbackState.video.networkState);
            } else if (a > 4)
                playbackState.lowMark = 0;
            if (now - playbackState.lastHeartbeat > 15000) {
                var previousHeartbeat = playbackState.lastHeartbeat, previousPosition = playbackState.heartbeatPosition56;
                playbackState.lastHeartbeat = now;
                playbackState.heartbeatPosition56 = playbackState.pos;
                var clockRate = previousHeartbeat && previousPosition != null ? ((playbackState.pos - previousPosition) / ((now - previousHeartbeat) / 1000)).toFixed(2) : '--';
                mark('MEDIA beta5 \xB7 clockRate=' + clockRate + ' \xB7 paused=' + (playbackState.video.paused ? 1 : 0) + ' \xB7 muted=' + (playbackState.video.muted ? 1 : 0) + ' \xB7 audioBytes=' + (typeof playbackState.video.webkitAudioDecodedByteCount === 'number' ? playbackState.video.webkitAudioDecodedByteCount : 'n/a') + ' \xB7 videoBytes=' + (typeof playbackState.video.webkitVideoDecodedByteCount === 'number' ? playbackState.video.webkitVideoDecodedByteCount : 'n/a'));
                mark('HEARTBEAT \xB7 pos=' + formatTime(playbackState.pos) + ' \xB7 ahead=' + a.toFixed(1) + 's \xB7 ready=' + playbackState.video.readyState + ' net=' + playbackState.video.networkState + ' \xB7 stalls=' + playbackState.stalls + ' \xB7 reconnects=' + playbackState.reconnects);
            }
        }
        if (!playbackState.resumeDone && playbackState.resumeAt >= 5 && !playbackState.seekMode && !playbackState.reconnectPending653)
            confirmResumePosition('monitor');
        playbackState.pos = position();
        playbackState.dur = duration();
        if (playbackState.engine == 'native' && watchNativeVod(now))
            return;
        pc = playbackState.dur > 0 ? Math.max(0, Math.min(100, playbackState.pos / playbackState.dur * 100)) : 0;
        if (f)
            f.style.width = pc + '%';
        if (playbackState.seekMode)
            renderSeekPosition();
        else if (tx)
            tx.textContent = formatTime(playbackState.pos) + ' / ' + (playbackState.dur ? formatTime(playbackState.dur) : '--:--');
        writeState(false, false);
        remain = playbackState.dur - playbackState.pos;
        if (playbackState.list && playbackState.index >= 0 && playbackState.index < playbackState.list.length - 1 && playbackState.dur > 0 && remain <= 120) {
            if (!playbackState.nextShown) {
                playbackState.nextShown = 1;
                mark('próximo episódio disponível \xB7 janela persistente 120s');
                if (!playbackState.hudVisible && element('xv14next'))
                    element('xv14next').focus();
            }
            if (nb)
                nb.className = '';
        } else if (nb)
            nb.className = 'h';
        if (playbackState.dur > 0 && remain <= 1.5 && playbackState.resumeDone && !playbackState.seekMode && !playbackState.recovering && !playbackState.reconnectPending653 && !playbackState.nativePending653) {
            if (finishEpisode('clock-end'))
                return;
            writeState(true, true);
        }
        playbackState.timer = setTimeout(update, 1000);
    }
    function monitor() {
        clearTimeout(playbackState.timer);
        playbackState.timer = setTimeout(update, 350);
    }
    function seek(delta) {
        var to = Math.max(0, Math.min(playbackState.dur || 999999, (playbackState.pos || position()) + delta));
        playbackState.resumeDone = 1;
        playbackState.resumeFailed34 = 0;
        playbackState.resumeIssuedAt34 = 0;
        if (seekTo(to, 'seek ' + (delta > 0 ? '+' : '') + delta + 's'))
            playbackState.pos = to;
    }
    function togglePause() {
        clearBufferGuard();
        playbackState.lastAdvanceAt = moduleNow();
        try {
            if ((playbackState.engine == 'hlsjs' || playbackState.engine == 'html5') && playbackState.video) {
                if (playbackState.video.paused) {
                    playbackState.paused = 0;
                    if (playbackState.reconnectPending653 && !playbackState.recovering)
                        reconnectProgressiveStream('continuar recuperação');
                    else
                        playbackState.video.play();
                    element('xv14pause').textContent = 'Pausar';
                } else {
                    playbackState.video.pause();
                    playbackState.paused = 1;
                    element('xv14pause').textContent = 'Continuar';
                }
                return;
            }
            if (playbackState.mp) {
                if (!playbackState.paused) {
                    playbackState.mp.pause();
                    playbackState.paused = 1;
                    element('xv14pause').textContent = 'Continuar';
                } else {
                    playbackState.mp.resume();
                    playbackState.paused = 0;
                    element('xv14pause').textContent = 'Pausar';
                }
            }
        } catch (e) {
            mark('pause erro ' + e);
        }
    }
    function begin(item, ctx) {
        playbackState.session31 = (playbackState.session31 || 0) + 1;
        release();
        playbackState.recoveryFailed31 = 0;
        playbackState.reconnectPending653 = 0;
        playbackState.nativePending653 = 0;
        playbackState.recoveryFailures31 = 0;
        playbackState.on = 1;
        playbackState.item = item;
        playbackState.ctx = ctx || {};
        playbackState.list = playbackState.ctx.list || null;
        playbackState.index = playbackState.ctx.index == null ? -1 : +playbackState.ctx.index;
        playbackState.pos = 0;
        playbackState.dur = 0;
        playbackState.paused = 0;
        playbackState.nextShown = 0;
        playbackState.ending53 = 0;
        playbackState.resumeAt = +(playbackState.ctx.resumeAt || 0);
        playbackState.resumeDone = playbackState.resumeAt >= 5 ? 0 : 1;
        playbackState.resumeIssuedAt34 = 0;
        playbackState.resumeAttempts34 = 0;
        playbackState.resumeStartedAt34 = moduleNow();
        playbackState.resumeFailed34 = 0;
        playbackState.lastSave = 0;
        playbackState.stalls = 0;
        playbackState.reconnects = 0;
        playbackState.recovering = 0;
        playbackState.lastClock = -1;
        playbackState.lastAdvanceAt = moduleNow();
        playbackState.lastHeartbeat = 0;
        playbackState.lowMark = 0;
        playbackState.clockQuirkLogged45 = 0;
        playbackState.lastClockQuirkLog45 = 0;
        playbackState.lastHealthy45 = 0;
        playbackState.events = [];
        playbackState.logOpen = 0;
        playbackState.buffering = 0;
        playbackState.seekMode = 0;
        playbackState.seekTarget = 0;
        playbackState.seekOrigin = 0;
        playbackState.previewToken = 0;
        playbackState.hudVisible = 0;
        root().className = '';
        element('xv14top').textContent = item.n || 'Vídeo';
        element('xv14nextbox').className = 'h';
        element('xv14pause').textContent = 'Pausar';
        element('xv14log').textContent = 'Log';
        element('xv24log').className = 'h';
        hideHud();
        mark('abrindo ' + (playbackState.ctx.series ? 'episódio' : 'filme') + ' id=' + String(item.id) + ' \xB7 container=' + (item.ext || '\u2014') + ' \xB7 resume=' + String(playbackState.resumeAt || 0));
        startPlayback();
    }
    function finishEpisode(reason) {
        if (playbackState.recovering || playbackState.reconnectPending653 || playbackState.nativePending653 || playbackState.ending53 || !playbackState.on || !playbackState.list || playbackState.index < 0 || playbackState.index >= playbackState.list.length - 1)
            return false;
        playbackState.ending53 = 1;
        mark('fim episódio v53 \xB7 ' + String(reason || 'evento') + ' \xB7 próximo automático');
        writeState(true, true);
        next();
        return true;
    }
    function next() {
        var n, ctx;
        if (!playbackState.list || playbackState.index < 0 || playbackState.index >= playbackState.list.length - 1)
            return;
        writeState(true, true);
        n = playbackState.index + 1;
        ctx = playbackState.ctx || {};
        begin(playbackState.list[n], {
            list: playbackState.list,
            index: n,
            series: ctx.series,
            onExit: ctx.onExit,
            onLog: ctx.onLog,
            resumeAt: 0
        });
    }
    function exit() {
        playbackState.session31 = (playbackState.session31 || 0) + 1;
        var cb = playbackState.ctx && playbackState.ctx.onExit;
        if (playbackState.on) {
            playbackState.pos = position();
            playbackState.dur = duration();
            writeState(true, false);
        }
        mark('sair player');
        release();
        playbackState.on = 0;
        root().className = 'h';
        playbackState.item = null;
        playbackState.list = null;
        playbackState.ctx = null;
        if (cb)
            cb();
    }
    function handleKey(e) {
        if (!playbackState.on)
            return false;
        var k = keyCode(e), o = documentRef.activeElement, l, i, bar = element('xv14bar'), lp = element('xv24logpre'), rw = k == 412 || k == 227 || k == 177, ff = k == 417 || k == 228 || k == 176, play = k == 415, pause = k == 19, stop = k == 413 || k == 169;
        if (playbackState.seekMode) {
            if (k == 37 || rw) {
                preventDefault(e);
                adjustManualSeek(rw ? -30 : -1);
                return true;
            }
            if (k == 39 || ff) {
                preventDefault(e);
                adjustManualSeek(ff ? 30 : 1);
                return true;
            }
            if (k == 13 || k == 41) {
                preventDefault(e);
                finishManualSeek(true);
                return true;
            }
            if (k == 38 || k == 8 || k == 27 || k == 461 || k == 462 || k == 528) {
                preventDefault(e);
                finishManualSeek(false);
                return true;
            }
            if (k == 40) {
                preventDefault(e);
                return true;
            }
        }
        if (playbackState.logOpen && (k == 38 || k == 40)) {
            preventDefault(e);
            if (lp)
                lp.scrollTop += k == 38 ? -120 : 120;
            showHud(o && o.id);
            return true;
        }
        if (stop) {
            preventDefault(e);
            exit();
            return true;
        }
        if (rw || ff) {
            preventDefault(e);
            if (beginManualSeek())
                adjustManualSeek(rw ? -30 : 30);
            return true;
        }
        if (play || pause) {
            preventDefault(e);
            if (play && playbackState.paused || pause && !playbackState.paused)
                togglePause();
            showHud('xv14pause');
            return true;
        }
        if (k == 8 || k == 27 || k == 461 || k == 462 || k == 528) {
            preventDefault(e);
            exit();
            return true;
        }
        if (o && o.id == 'xv14next') {
            if (k == 37) {
                preventDefault(e);
                showHud('xv14log');
                return true;
            }
            if (k == 40 || k == 38) {
                preventDefault(e);
                showHud('xv14pause');
                return true;
            }
            if (k == 13 || k == 41) {
                preventDefault(e);
                o.click();
                return true;
            }
        }
        if (k == 38) {
            preventDefault(e);
            if (bar && bar.className != 'hudoff' && o && o.parentNode == bar) {
                beginManualSeek();
                return true;
            }
            showHud('xv14pause');
            return true;
        }
        if (k == 40) {
            preventDefault(e);
            hideHud();
            return true;
        }
        if ((k == 13 || k == 41) && o && o.click) {
            preventDefault(e);
            o.click();
            showHud(o.id);
            return true;
        }
        if (k == 37 || k == 39) {
            preventDefault(e);
            if (!bar || bar.className == 'hudoff') {
                showHud('xv14pause');
                return true;
            }
            l = bar.querySelectorAll('button');
            for (i = 0; i < l.length; i++)
                if (l[i] == o)
                    break;
            if (i >= l.length) {
                element('xv14pause').focus();
                return true;
            }
            if (k == 37 && i > 0)
                l[i - 1].focus();
            if (k == 39 && i < l.length - 1)
                l[i + 1].focus();
            else if (k == 39 && i == l.length - 1 && playbackState.nextShown && element('xv14nextbox').className != 'h')
                element('xv14next').focus();
            showHud(documentRef.activeElement && documentRef.activeElement.id);
            return true;
        }
        return false;
    }
    windowRef.XTVod29 = {
        play: begin,
        stop: exit,
        key: handleKey,
        active: function () {
            return !!playbackState.on;
        },
        state: playbackState,
        progress: progress,
        continueList: continueList,
        removeContinue: removeCont
    };
    windowRef.XTVod27 = windowRef.XTVod29;
    windowRef.XTVod25 = windowRef.XTVod29;
    windowRef.XTVod24 = windowRef.XTVod29;
    windowRef.XTVod23 = windowRef.XTVod29;
    windowRef.XTVod22 = windowRef.XTVod29;
    windowRef.XTVod21 = windowRef.XTVod29;
    windowRef.XTVod20 = windowRef.XTVod29;
    windowRef.XTVod19 = windowRef.XTVod29;
    windowRef.XTVod18 = windowRef.XTVod29;
    windowRef.XTVod14 = windowRef.XTVod29;
    remoteTV.vodPlayer = '0.56-beta.6.5.4';
    xtreamApi.log('BOOT', 'VOD player beta4 \xB7 próximo episódio persistente + término automático + reconexão conservadora');
}(this, document));

}.call(this,this));
