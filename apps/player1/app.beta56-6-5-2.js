/* RemoteTV beta 3. ES5 source; compatibility aliases are intentional. */
(function () {
    'use strict';
    var localBridgeScope = new window.RemoteTV.RequestScope();
    var mediaCore = YTCore, documentRef = document;
    var nativeProfiles = [
        {
            m: 1,
            a: 4,
            s: 2,
            l: 'CH AAC TS'
        },
        {
            m: 2,
            a: 4,
            s: 2,
            l: 'VOD AAC TS'
        },
        {
            m: 1,
            a: 5,
            s: 2,
            l: 'CH HEAAC TS'
        },
        {
            m: 2,
            a: 4,
            s: 3,
            l: 'VOD AAC MP4'
        }
    ];
    var pendingRequest = null, requestEpoch = 0, requestTimer = 0, controlsTimer = 0, fullscreen = 0, moduleHeadless = 0, htmlGeneration = 0, routeUrls = [], routeIndex = 0, nativePlayer = null, nativePlayerId = -1, nativeGeneration = 0, profileIndex = 0, lastChannelButton = null, currentChannelIndex = -1, videoMasks = [], nativeReady = 0, controlGeneration = 0, bt = 0, playbackMonitorTimer = 0, playbackStatus = '', hg = 0, hr = 0, ex = 0, tr41 = 0, lastRecover41 = 0;
    var lg = 0, lf = 0, lt = 0, ls = 0, channels = mediaCore.channels, selectedGroup = '', channelGroups = {};
    function element(s) {
        return documentRef.getElementById(s);
    }
    function now() {
        return new Date().getTime();
    }
    function showVideoMasks(v) {
        var j;
        if (!videoMasks)
            return;
        for (j = 0; j < videoMasks.length; j++)
            videoMasks[j].style.display = v ? 'block' : 'none';
    }
    function showScreen(s) {
        var z = [
                'menu',
                'new',
                'tvlist',
                'player'
            ], j;
        for (j = 0; j < 4; j++)
            element(z[j]).className = z[j] == s ? '' : 'h';
        showVideoMasks(s == 'player' && !fullscreen);
    }
    function hideScreens() {
        var z = [
                'menu',
                'new',
                'tvlist',
                'player'
            ], j;
        for (j = 0; j < 4; j++)
            element(z[j]).className = 'h';
        showVideoMasks(0);
    }
    function setStatusText(s, v) {
        var hint;
        element(s).textContent = v;
        if (s == 'ps') {
            hint = element('c14hint35');
            if (hint)
                hint.textContent = v;
        }
    }
    function createVideoMasks() {
        var r = [
                [
                    0,
                    0,
                    1280,
                    72
                ],
                [
                    0,
                    72,
                    326,
                    500
                ],
                [
                    1252,
                    72,
                    28,
                    500
                ],
                [
                    0,
                    572,
                    1280,
                    148
                ]
            ], j, e;
        if (videoMasks.length)
            return;
        for (j = 0; j < 4; j++) {
            e = documentRef.createElement('i');
            e.style.cssText = 'display:none;position:absolute;left:' + r[j][0] + 'px;top:' + r[j][1] + 'px;width:' + r[j][2] + 'px;height:' + r[j][3] + 'px;background:#000;z-index:0';
            documentRef.body.insertBefore(e, documentRef.body.firstChild);
            videoMasks.push(e);
        }
        element('player').style.zIndex = 2;
        element('side').style.zIndex = 3;
        element('stage').style.zIndex = 3;
    }
    function cancelPageRequest() {
        requestEpoch++;
        if (pendingRequest)
            try {
                pendingRequest.abort();
            } catch (e) {
            }
        pendingRequest = null;
        clearTimeout(requestTimer);
    }
    function fetchPage(u, cb) {
        var r = new XMLHttpRequest(), k = requestEpoch, d = 0;
        pendingRequest = r;
        function A(e, v, b) {
            if (d)
                return;
            d = 1;
            clearTimeout(requestTimer);
            if (k == requestEpoch) {
                pendingRequest = null;
                cb(e, v, b);
            }
        }
        r.onreadystatechange = function () {
            if (r.readyState == 4)
                A(r.status == 200 || !r.status && r.responseText ? null : 'HTTP ' + r.status, r.responseText, r.responseURL || u);
        };
        try {
            r.open('GET', u, true);
            r.send(null);
        } catch (e) {
            A('Falha', '', '');
        }
        requestTimer = setTimeout(function () {
            try {
                r.abort();
            } catch (e) {
            }
            A('Timeout', '', '');
        }, 12000);
    }
    function fetchLocalBridge(path, callback) {
        return localBridgeScope.local(path, callback, 3000);
    }
    function markDiagnostic(s) {
        fetchLocalBridge('/debug/mark?m=' + encodeURIComponent(s), null, true);
    }
    var controlQueue35 = [], controlBusy35 = 0;
    function finishExit35() {
        ex = 2;
        try {
            new QjyScript().exec('qjy_exitBrowser', '0');
        } catch (e) {
            try {
                history.go(-2);
            } catch (y) {
            }
        }
    }
    function pumpControl35() {
        var job;
        if (controlBusy35)
            return;
        while (controlQueue35.length) {
            job = controlQueue35.shift();
            if (job.token == controlGeneration)
                break;
            job = null;
        }
        if (!job) {
            if (ex == 1)
                finishExit35();
            return;
        }
        controlBusy35 = 1;
        fetchLocalBridge(job.path, function (err, value) {
            var keep = [], j;
            controlBusy35 = 0;
            if (err) {
                for (j = 0; j < controlQueue35.length; j++)
                    if (controlQueue35[j].cancel && controlQueue35[j].token == controlGeneration)
                        keep.push(controlQueue35[j]);
                controlQueue35 = keep;
                setStatusText('ps', 'Falha no controle local \xB7 tente novamente');
                markDiagnostic('U control failed ' + err);
                pumpControl35();
                return;
            }
            if (job.token == controlGeneration && !ex && job.cb) {
                ls = parseInt(value, 10) || 0;
                job.cb();
            }
            pumpControl35();
        }, true);
    }
    function cancelControlSession(reason) {
        controlQueue35 = [{
                token: controlGeneration,
                path: '/control/cancel?reason=' + encodeURIComponent(reason || 'ui'),
                cancel: 1
            }];
        pumpControl35();
    }
    function startControlSession(ch, cb) {
        controlQueue35.push({
            token: controlGeneration,
            path: '/control/start?name=' + encodeURIComponent(ch[0]),
            cb: cb
        });
        pumpControl35();
    }
    function readDiagnostics() {
        if (!lg)
            return;
        fetchLocalBridge('/debug/logs', function (e, v) {
            var b = element('logb');
            if (!e) {
                b.textContent = v;
                if (!lf)
                    b.scrollTop = b.scrollHeight;
            }
            if (lg)
                lt = setTimeout(readDiagnostics, 1100);
        }, true);
    }
    function toggleDiagnostics(open) {
        if (open == undefined)
            open = !lg;
        lg = open ? 1 : 0;
        element('logp').className = lg ? '' : 'h';
        clearTimeout(lt);
        if (lg) {
            lf = 0;
            readDiagnostics();
            element('pl').textContent = 'Fechar log';
        } else
            element('pl').textContent = 'Log';
        element('pl').focus();
    }
    function releaseNativePlayback(r) {
        var m = nativePlayer, id = nativePlayerId, s, d;
        layoutPlayer652=null;layoutMode652=-1;
        if(window.RemoteTV&&window.RemoteTV.liveHealth652)window.RemoteTV.liveHealth652.active=false;
        nativeGeneration++;
        nativeReady = 0;
        clearTimeout(playbackMonitorTimer);
        playbackMonitorTimer = 0;
        playbackStatus = '';
        nativePlayer = null;
        nativePlayerId = -1;
        if (m) {
            setPlayerMuted(m, 0);
            s = now();
            try {
                m.stop();
            } catch (e) {
                markDiagnostic('P stop err ' + e);
            }
            d = now() - s;
            markDiagnostic('P stop ' + d + 'ms ' + (r || ''));
            s = now();
            try {
                if (id >= 0)
                    m.releaseMediaPlayer(id);
            } catch (e) {
                markDiagnostic('P rel err ' + e);
            }
            markDiagnostic('P release ' + (now() - s) + 'ms');
        }
    }
    function stopPlayback(r) {
        var v = element('v');
        controlGeneration++;
        cancelControlSession(r || 'stop');
        releaseNativePlayback(r);
        htmlGeneration++;
        clearTimeout(requestTimer);
        try {
            v.pause();
            v.removeAttribute('src');
            v.load();
        } catch (e) {
        }
        v.style.visibility = 'visible';
    }
    function exitApplication() {
        if (ex)
            return;
        if (lg)
            toggleDiagnostics(0);
        ex = 1;
        hg = 0;
        stopPlayback('exit');
        cancelPageRequest();
        if (!controlBusy35)
            pumpControl35();
    }
    function focusFirstButton(s) {
        var e = documentRef.querySelector(s + ' button,' + s + ' a');
        if (e)
            e.focus();
    }
    function resizeVideoMasks(x, w) {
        if (!videoMasks.length)
            return;
        videoMasks[1].style.width = x + 'px';
        videoMasks[2].style.left = x + w + 'px';
        videoMasks[2].style.width = 1280 - x - w + 'px';
    }
    function setPlayerMuted(z, v) {
        try {
            if (z && z.setMuteFlag)
                z.setMuteFlag(v ? 1 : 0);
        } catch (e) {
        }
    }
    var layoutPlayer652 = null, layoutMode652 = -1;
    function layoutNativeVideo(z, show) {
        if (!z)
            return;
        try {
            if (z.setVideoAlpha)
                z.setVideoAlpha(show && nativeReady ? 0 : 100);
            // Startup confirmation only reveals the existing surface. Repeating
            // mode/rectangle/refresh can cause another native display transaction.
            if (layoutPlayer652 === z && layoutMode652 === (fullscreen ? 1 : 0))
                return;
            if (fullscreen) {
                z.setVideoDisplayMode(1);
                z.refreshVideoDisplay();
                layoutPlayer652 = z; layoutMode652 = 1;
                return;
            }
            resizeVideoMasks(326, 926);
            z.setVideoDisplayMode(0);
            z.setVideoDisplayArea(326, 72, 926, 500);
            z.refreshVideoDisplay();
            layoutPlayer652 = z; layoutMode652 = 0;
            try {
                markDiagnostic('P area ' + z.getVideoDisplayLeft() + ',' + z.getVideoDisplayTop() + ' ' + z.getVideoDisplayWidth() + 'x' + z.getVideoDisplayHeight());
            } catch (y) {
            }
        } catch (e) {
            markDiagnostic('P area err ' + e);
        }
    }
    function refreshVideoLayout(z) {
        setStatusText('pf', fullscreen ? 'Sair da tela cheia' : 'Tela cheia');
        layoutNativeVideo(z || nativePlayer, 1);
    }
    function scrollButtonIntoView(e) {
        var p = e && e.parentNode, h;
        if (p == element('channels') || p == element('cats')) {
            h = p.clientHeight;
            if (e.offsetTop < p.scrollTop)
                p.scrollTop = e.offsetTop;
            else if (e.offsetTop + e.offsetHeight > p.scrollTop + h)
                p.scrollTop = e.offsetTop + e.offsetHeight - h;
        }
    }
    function moveDirectionalFocus(k, o) {
        var l = documentRef.querySelectorAll('a,button'), r = o.getBoundingClientRect(), x = r.left + r.right, y = r.top + r.bottom, b, s = 1000000000, h, z, d, v, w;
        for (h = 0; h < l.length; h++) {
            z = l[h];
            if (z == o || !z.offsetHeight)
                continue;
            r = z.getBoundingClientRect();
            d = r.left + r.right - x;
            v = r.top + r.bottom - y;
            if (k == 37 && d >= 0 || k == 39 && d <= 0 || k == 38 && v >= 0 || k == 40 && v <= 0)
                continue;
            w = k & 1 ? Math.abs(d) * 10 + Math.abs(v) : Math.abs(v) * 10 + Math.abs(d);
            if (w < s) {
                s = w;
                b = z;
            }
        }
        if (b) {
            b.focus();
            scrollButtonIntoView(b);
        }
    }
    function navigateBack() {
        if (window.CommonPlayer14 && CommonPlayer14.back && CommonPlayer14.back())
            return;
        if (RawM3U.back())
            return;
        if (lg) {
            toggleDiagnostics(0);
            return;
        }
        if (element('player').className != 'h') {
            if (fullscreen) {
                fullscreen = 0;
                element('player').className = '';
                showVideoMasks(1);
                refreshVideoLayout();
                showPlaybackControls(0);
                element('pb').focus();
                return;
            }
            stopPlayback('back');
            if (selectedGroup) {
                selectedGroup = '';
                showScreen('tvlist');
                renderChannelGroups();
                focusFirstButton('#cats');
            } else {
                showScreen('tvlist');
                focusFirstButton('#cats');
            }
        } else if (element('tvlist').className != 'h') {
            showScreen('menu');
            element('tv').focus();
        } else if (element('new').className != 'h') {
            cancelPageRequest();
            showScreen('menu');
            element('tv').focus();
        } else
            exitApplication();
    }
    var rawFail43 = null, rawFailOnce43 = 0;
    function signalFail43(reason) {
        var cb = rawFail43;
        if (rawFailOnce43 || !cb)
            return;
        rawFailOnce43 = 1;
        rawFail43 = null;
        markDiagnostic('P final ' + reason);
        try {
            cb(reason);
        } catch (e) {
            markDiagnostic('P final cb err ' + e);
        }
    }
    function monitorNativePlayback(z, k, ready, next) {
        var began = now(), last = -1, advance = began, bad = 0, confirmed = 0;
        var health={engine:'nativo',active:true,samples:0,stalls:0,bufferMs:0,buffering:false,clockAvailable:false,clock:0,clockIdleMs:0}, bufferAt652=0;
        if(window.RemoteTV)window.RemoteTV.liveHealth652=health;
        function valid() {
            return k == nativeGeneration && nativePlayer == z && !ex;
        }
        function fail(reason) {
            if (!valid())
                return;
            markDiagnostic('P recovery ' + reason);
            health.active=false;
            releaseNativePlayback(reason);
            next();
        }
        function check() {
            var mode = '', p = -1, normal = 0, moved = 0, ts = now();
            if (!valid())
                return;
            try {
                mode = z.getPlaybackMode();
                normal = mediaCore.normal(mode);
            } catch (e) {
            }
            try {
                p = +z.getCurrentPlayTime();
                if (!isFinite(p))
                    p = -1;
            } catch (e) {
            }
            moved = p >= 0 && last >= 0 && p > last + 0.05;
            health.samples++;health.clockAvailable=p>=0;health.clock=p>=0?p:0;health.clockIdleMs=ts-advance;
            if (moved) {
                advance = ts;
                bad = 0;
            }
            if (p >= 0)
                last = p;
            if (normal || moved) {
                if(health.buffering){health.bufferMs+=ts-bufferAt652;health.buffering=false;}
                if (bad && confirmed)
                    setStatusText('ps', 'AO VIVO');
                bad = 0;
                if (!confirmed) {
                    confirmed = 1;
                    ready(moved ? 'clock advance' : 'NormalPlay');
                }
            } else {
                if (!bad) {
                    bad = ts;
                    health.stalls++;health.buffering=true;bufferAt652=ts;
                }
                if (confirmed)
                    setStatusText('ps', 'Recuperando sinal\u2026');
                if (ts - bad >= 25000 && ts - advance >= 25000) {
                    fail(confirmed ? 'mode-and-clock-stalled' : 'startup-unconfirmed');
                    return;
                }
            }
            if (!confirmed && ts - began >= 15000)
                setStatusText('ps', 'Aguardando sinal do canal\u2026');
            playbackMonitorTimer = setTimeout(check, 1000);
        }
        clearTimeout(playbackMonitorTimer);
        playbackMonitorTimer = setTimeout(check, 500);
    }
    function startNativeRoute(u, pr, next) {
        var K = window.QjyMediaPlayer || window.MediaPlayer, z, id, r, k, beg = now();
        releaseNativePlayback('native-route');
        k = ++nativeGeneration;
        nativeReady = 0;
        if (!K) {
            next();
            return;
        }
        try {
            z = new K();
            id = z.getNativePlayerInstanceID();
            r = z.initMediaPlayer(id, 0, 0, 500, 926, 326, 72, 0, 0, 0, 100, 0, 0, 1);
            if (r == -1)
                throw 0;
            if (z.setNativeUIFlag)
                try {
                    z.setNativeUIFlag(0);
                } catch (e) {
                }
            setPlayerMuted(z, 1);
            layoutNativeVideo(z, 0);
            markDiagnostic('P launch ' + k + ' ' + pr.l);
            r = z.setSingleMedia(mediaCore.media(u, pr));
            if (r == -1)
                throw 0;
            r = z.playFromStart();
            if (r == -1)
                throw 0;
            nativePlayer = z;
            nativePlayerId = id;
            element('v').style.visibility = 'hidden';
            setStatusText('ps', 'Abrindo canal\u2026');
            monitorNativePlayback(z, k, function (why) {
                clearTimeout(requestTimer);
                nativeReady = 1;
                setPlayerMuted(z, 0);
                layoutNativeVideo(z, 1);
                setStatusText('ps', 'AO VIVO \xB7 ' + pr.l);
                markDiagnostic('P ready ' + why + ' ' + (now() - beg) + 'ms');
            }, next);
        } catch (e) {
            markDiagnostic('P fallback exception ' + k);
            setPlayerMuted(z, 0);
            try {
                if (z)
                    z.stop();
                if (z && id >= 0)
                    z.releaseMediaPlayer(id);
            } catch (y) {
            }
            next();
        }
    }
    function startHtmlRoute(u, next) {
        var v = element('v'), k = ++htmlGeneration, s = now(), r, proof = 0, failed = 0, errorAt = 0, errorClock = -1, lastClock = -1, slow = 0, lastAdvance = now();
        releaseNativePlayback('html-start');
        var health={engine:'HTML',active:true,samples:0,stalls:0,bufferMs:0,buffering:false,clockAvailable:false,clock:0,clockIdleMs:0}, bufferAt652=0;
        if(window.RemoteTV)window.RemoteTV.liveHealth652=health;
        v.style.visibility = 'visible';
        function valid() {
            return k == htmlGeneration && !failed;
        }
        function clock() {
            var p = -1;
            try {
                p = +v.currentTime;
                if (!isFinite(p))
                    p = -1;
            } catch (e) {
            }
            return p;
        }
        function clean() {
            clearTimeout(playbackMonitorTimer);
            playbackMonitorTimer = 0;
            v.onerror = v.onplaying = v.onloadeddata = v.oncanplay = v.ontimeupdate = v.onwaiting = v.onstalled = null;
        }
        function good(why) {
            if (!valid())
                return;
            lastAdvance = now();
            if(health.buffering){health.bufferMs+=now()-bufferAt652;health.buffering=false;}
            if (!proof) {
                proof = 1;
                markDiagnostic('H media proof ' + why + ' ' + (now() - s) + 'ms');
            }
            errorAt = 0;
            slow = 0;
            setStatusText('ps', 'AO VIVO \xB7 HTML');
        }
        function fail(why) {
            if (!valid())
                return;
            failed = 1;
            health.active=false;
            clean();
            htmlGeneration++;
            markDiagnostic('H route failure ' + why);
            try {
                v.pause();
                v.removeAttribute('src');
                v.load();
            } catch (e) {
            }
            next();
        }
        function check() {
            var p, err = 0;
            if (!valid())
                return;
            p = clock();
            health.samples++;health.clockAvailable=p>=0;health.clock=p>=0?p:0;health.clockIdleMs=now()-lastAdvance;
            try {
                err = !!v.error;
            } catch (e) {
            }
            if (p >= 0 && lastClock >= 0 && p != lastClock) {
                good('clock advance');
            }
            if (errorAt && now() - errorAt >= 2500) {
                if (!err && p >= 0 && p != errorClock)
                    good('error recovered');
                else {
                    fail(proof ? 'error-after-playback' : 'error-before-frame');
                    return;
                }
            }
            if (proof && v.paused)
                lastAdvance = now();
            if ((!proof || !v.paused) && now() - lastAdvance >= 30000) {
                fail(proof ? 'clock-stalled' : 'startup-timeout');
                return;
            }
            if (!proof && !slow && now() - s >= 20000) {
                slow = 1;
                setStatusText('ps', 'Canal sem confirmação \xB7 Voltar para cancelar');
                markDiagnostic('H startup unconfirmed \xB7 route preserved');
            }
            lastClock = p;
            playbackMonitorTimer = setTimeout(check, 500);
        }
        v.onerror = function () {
            if (!valid())
                return;
            if (!errorAt) {
                errorAt = now();
                errorClock = clock();
                markDiagnostic('H media error \xB7 awaiting recovery');
            }
            setStatusText('ps', 'Falha no canal \xB7 verificando recuperação\u2026');
        };
        v.onplaying = function () {
            if (!valid())
                return;
            var err = 0;
            try {
                err = !!v.error;
            } catch (e) {
            }
            if (!err)
                good('onplaying');
        };
        v.onloadeddata = v.oncanplay = function () {
            if (valid() && !proof && !errorAt)
                setStatusText('ps', 'Mídia carregada \xB7 aguardando reprodução\u2026');
        };
        v.ontimeupdate = function () {
            var p;
            if (!valid())
                return;
            p = clock();
            if (p >= 0 && lastClock >= 0 && p != lastClock)
                good('timeupdate');
            lastClock = p;
        };
        v.onwaiting = function () {
            if (valid()) {
                if(!health.buffering){health.stalls++;health.buffering=true;bufferAt652=now();}
                setStatusText('ps', 'Carregando buffer\u2026');
                markDiagnostic('H waiting \xB7 route preserved');
            }
        };
        v.onstalled = function () {
            if (valid())
                markDiagnostic('H stalled \xB7 route preserved');
        };
        try {
            v.src = u;
            r = v.play();
            setStatusText('ps', 'Abrindo canal\u2026');
            markDiagnostic('H play issued \xB7 recovery candidate');
        } catch (e) {
            fail('play exception');
            return;
        }
        if (r && typeof r.catch == 'function')
            try {
                r.catch(function (e) {
                    if (valid() && !proof)
                        fail('play promise rejected');
                });
            } catch (e) {
            }
        if (valid())
            playbackMonitorTimer = setTimeout(check, 500);
    }
    function tryNextPlaybackRoute() {
        var u, pr;
        if (routeIndex >= routeUrls.length) {
            setStatusText('ps', 'Falha. Abra Log.');
            markDiagnostic('P final rotas internas esgotadas');
            signalFail43('routes-exhausted');
            return;
        }
        u = routeUrls[routeIndex];
        if (profileIndex < nativeProfiles.length) {
            pr = nativeProfiles[profileIndex++];
            startNativeRoute(u, pr, tryNextPlaybackRoute);
            return;
        }
        profileIndex = 0;
        routeIndex++;
        if (/^http:/i.test(u)) {
            markDiagnostic('R H ' + routeIndex);
            startHtmlRoute(u, tryNextPlaybackRoute);
            return;
        }
        tryNextPlaybackRoute();
    }
    function startChannelPlayback(ch) {
        tr41 = 0;
        lastRecover41 = 0;
        startControlSession(ch, function () {
            routeUrls = mediaCore.compat(ch[2]);
            routeIndex = 0;
            profileIndex = 0;
            markDiagnostic('C rotas=' + routeUrls.length);
            tryNextPlaybackRoute();
        });
    }
    function selectChannel(j) {
        var ch = channels[j];
        if (currentChannelIndex == j) {
            if (!fullscreen)
                toggleFullscreen();
            return;
        }
        currentChannelIndex = j;
        stopPlayback('switch');
        cancelPageRequest();
        setStatusText('pt', ch[0]);
        startChannelPlayback(ch);
    }
    function renderChannelGroups() {
        var d, j, b, first = -1;
        fullscreen = 0;
        refreshVideoLayout();
        if (!selectedGroup) {
            currentChannelIndex = -1;
            showScreen('tvlist');
            d = element('cats');
            d.innerHTML = '';
            d.scrollTop = 0;
            channelGroups = {};
            for (j = 0; j < channels.length; j++)
                channelGroups[channels[j][1]] = 1;
            for (j in channelGroups) {
                b = documentRef.createElement('button');
                b.setAttribute('data-g', j);
                b.textContent = j;
                b.onclick = function () {
                    selectedGroup = this.getAttribute('data-g');
                    currentChannelIndex = -1;
                    renderChannelGroups();
                };
                d.appendChild(b);
            }
            focusFirstButton('#cats');
            return;
        }
        showScreen('player');
        setStatusText('gt', selectedGroup);
        d = element('channels');
        d.innerHTML = '';
        d.scrollTop = 0;
        for (j = 0; j < channels.length; j++)
            if (channels[j][1] == selectedGroup) {
                if (first < 0)
                    first = j;
                b = documentRef.createElement('button');
                b.setAttribute('data-i', j);
                b.textContent = channels[j][0];
                b.onfocus = function () {
                    lastChannelButton = this;
                    scrollButtonIntoView(this);
                };
                b.onclick = function () {
                    selectChannel(+this.getAttribute('data-i'));
                };
                d.appendChild(b);
            }
        focusFirstButton('#channels');
        if (first >= 0)
            selectChannel(first);
    }
    function loadChannels() {
        selectedGroup = '';
        fetchLocalBridge('/c', function (e, v) {
            if (!e)
                try {
                    var h = JSON.parse(v);
                    if (h.length)
                        channels = h;
                } catch (y) {
                }
            renderChannelGroups();
        }, 1);
    }
    function showPlaybackControls(s) {
        clearTimeout(controlsTimer);
        element('ctrl').className = fullscreen && !s ? 'hide' : '';
        if (fullscreen && s)
            controlsTimer = setTimeout(function () {
                element('ctrl').className = 'hide';
            }, 5000);
    }
    function toggleFullscreen() {
        if (nativePlayer && !nativeReady) {
            setStatusText('ps', 'Sincronizando \xB7 aguarde');
            return;
        }
        fullscreen = !fullscreen;
        element('player').className = fullscreen ? 'fs' : '';
        showVideoMasks(!fullscreen);
        refreshVideoLayout();
        showPlaybackControls(1);
        element('pb').focus();
    }
    function setHeadlessFullscreen(on) {
        var p = element('player');
        if (!p)
            return false;
        if (on) {
            if (nativePlayer && !nativeReady) {
                setStatusText('ps', 'Sincronizando \xB7 aguarde');
                return false;
            }
            fullscreen = 1;
            p.className = moduleHeadless ? 'h' : 'fs';
            showVideoMasks(0);
            refreshVideoLayout();
            if (moduleHeadless)
                showPlaybackControls(0);
            else {
                showPlaybackControls(1);
                element('pb').focus();
            }
            markDiagnostic('P fullscreen ' + (moduleHeadless ? 'headless' : 'shell'));
            return true;
        }
        fullscreen = 0;
        p.className = moduleHeadless ? 'h' : '';
        showVideoMasks(moduleHeadless ? 0 : 1);
        refreshVideoLayout();
        showPlaybackControls(0);
        markDiagnostic('P preview ' + (moduleHeadless ? 'headless' : 'shell'));
        return true;
    }
    function playLegacyYouTube(id, s) {
        var st = now();
        cancelPageRequest();
        selectedGroup = '';
        showScreen('player');
        setStatusText('gt', 'YouTube');
        setStatusText('pt', s || id);
        element('channels').innerHTML = '';
        element('pb').focus();
        fetchPage('https://www.youtube.com/watch?v=' + encodeURIComponent(id) + '&hl=pt&gl=BR', function (e, h) {
            var p, z, v;
            if (e)
                return;
            p = mediaCore.jsonAfter(h, 'ytInitialPlayerResponse =') || mediaCore.jsonAfter(h, 'ytInitialPlayerResponse=');
            z = mediaCore.playable(p);
            if (!z)
                return;
            v = element('v');
            try {
                v.src = z.url;
                v.play();
            } catch (y) {
            }
            v.onplaying = function () {
                setStatusText('ps', 'OK');
                markDiagnostic('YT ' + (now() - st) + 'ms');
            };
        });
    }
    function renderYouTubeSearch(l) {
        var d = element('results'), j, b;
        d.innerHTML = '';
        for (j = 0; j < l.length; j++) {
            b = documentRef.createElement('button');
            b.setAttribute('data-i', j);
            b.textContent = l[j].title;
            b.onclick = function () {
                var z = l[+this.getAttribute('data-i')];
                playLegacyYouTube(z.id, z.title);
            };
            d.appendChild(b);
        }
        if (l.length)
            focusFirstButton('#results');
    }
    if (!window.RawM3U)
        try {
            var r = new XMLHttpRequest();
            r.open('GET', 'legacy.html', false);
            r.send();
            eval(r.responseText);
        } catch (e) {
        }
    ;
    element('y2').onclick = function () {
        showScreen('new');
        element('q').focus();
    };
    element('tv').onclick = function () {
        showScreen('tvlist');
        loadChannels();
    };
    element('rawLaunch').onclick = RawM3U.open;
    element('rawIn').onclick = RawM3U.open;
    element('tvback').onclick = function () {
        showScreen('menu');
        element('tv').focus();
    };
    element('pb').onclick = navigateBack;
    element('pf').onclick = toggleFullscreen;
    element('pl').onclick = function () {
        toggleDiagnostics();
    };
    element('sf').onsubmit = function (e) {
        e.preventDefault();
        cancelPageRequest();
        var s = element('q').value.replace(/^\s+|\s+$/g, ''), id = mediaCore.videoId(s);
        element('results').innerHTML = '';
        if (!s)
            return;
        if (id) {
            playLegacyYouTube(id);
            return;
        }
        fetchPage('https://www.youtube.com/results?search_query=' + encodeURIComponent(s) + '&hl=pt&gl=BR', function (e, h) {
            var d, l;
            if (e)
                return;
            d = mediaCore.jsonAfter(h, 'ytInitialData =') || mediaCore.jsonAfter(h, 'ytInitialData=');
            l = mediaCore.videos(d);
            renderYouTubeSearch(l);
        });
    };
    function BK(k) {
        return ',4,8,27,158,166,461,462,464,528,1061,10009,'.indexOf(',' + k + ',') >= 0;
    }
    function EK(e) {
        return e && (e.which || e.keyCode) || window.event && (window.event.which || window.event.keyCode) || 0;
    }
    function PD(e) {
        if (e && e.preventDefault)
            e.preventDefault();
        else if (e)
            e.returnValue = false;
    }
    function BR(e) {
        var k = EK(e), z = now();
        if (!BK(k))
            return true;
        PD(e);
        if (z - bt > 180) {
            bt = z;
            navigateBack();
        }
        return false;
    }
    function pushNavigationState() {
        if (ex || !window.history || !history.pushState)
            return;
        try {
            history.pushState({ ui63: 1 }, '');
            hg = 1;
        } catch (e) {
            hg = 0;
        }
    }
    function restoreNavigationState() {
        if (!hg || hr || ex)
            return;
        hr = 1;
        navigateBack();
        setTimeout(function () {
            if (!ex)
                pushNavigationState();
            hr = 0;
        }, 0);
    }
    function CC(o, d) {
        var p = o && o.parentNode, l, j;
        if (p != element('channels'))
            return false;
        l = p.querySelectorAll('button');
        for (j = 0; j < l.length; j++)
            if (l[j] == o)
                break;
        j += d;
        if (j >= 0 && j < l.length) {
            l[j].focus();
            scrollButtonIntoView(l[j]);
        }
        return true;
    }
    function CUR() {
        var z = element('channels').querySelector('button[data-i="' + currentChannelIndex + '"]') || lastChannelButton || element('channels').querySelectorAll('button')[0];
        if (z) {
            lastChannelButton = z;
            z.focus();
            scrollButtonIntoView(z);
        }
    }
    documentRef.onkeydown = function (e) {
        if (RawM3U.key(e))
            return;
        var k = EK(e), o = documentRef.activeElement, z, l, j;
        if (BK(k)) {
            BR(e);
            return;
        }
        if (lg && (k == 38 || k == 40)) {
            PD(e);
            z = element('logb');
            if (k == 38) {
                lf = 1;
                z.scrollTop -= 110;
            } else {
                z.scrollTop += 110;
                if (z.scrollTop + z.clientHeight >= z.scrollHeight - 20)
                    lf = 0;
            }
            return;
        }
        if (k == 36 || k == 506) {
            stopPlayback('home');
            return;
        }
        if (o && /INPUT|TEXTAREA/.test(o.tagName))
            return;
        if (element('player').className == 'fs' && element('ctrl').className == 'hide' && (k == 13 || k == 41 || k >= 37 && k <= 40)) {
            PD(e);
            if (k != 40) {
                showPlaybackControls(1);
                element('pb').focus();
            }
            return;
        }
        if ((k == 13 || k == 41) && o && o.click) {
            PD(e);
            o.click();
            return;
        }
        if (k != 37 && k != 38 && k != 39 && k != 40)
            return;
        if (element('player').className == 'fs') {
            if (o && o.parentNode == element('ctrl')) {
                l = element('ctrl').querySelectorAll('button');
                for (j = 0; j < l.length; j++)
                    if (l[j] == o)
                        break;
                if (k == 37) {
                    PD(e);
                    showPlaybackControls(1);
                    if (j > 0)
                        l[j - 1].focus();
                    return;
                }
                if (k == 39) {
                    PD(e);
                    showPlaybackControls(1);
                    if (j < l.length - 1)
                        l[j + 1].focus();
                    return;
                }
                if (k == 38) {
                    PD(e);
                    showPlaybackControls(1);
                    return;
                }
                if (k == 40) {
                    PD(e);
                    showPlaybackControls(0);
                    return;
                }
            }
            if (k == 38) {
                PD(e);
                showPlaybackControls(1);
                element('pb').focus();
                return;
            }
            if (k == 37) {
                PD(e);
                showPlaybackControls(1);
                element('pb').focus();
                return;
            }
            if (k == 39) {
                PD(e);
                showPlaybackControls(1);
                element('pf').focus();
                return;
            }
            if (k == 40) {
                PD(e);
                showPlaybackControls(0);
                return;
            }
            return;
        }
        if (element('player').className != 'h' && !fullscreen) {
            if (o && o.parentNode == element('channels')) {
                if (k == 38) {
                    PD(e);
                    CC(o, -1);
                    return;
                }
                if (k == 40) {
                    PD(e);
                    CC(o, 1);
                    return;
                }
                if (k == 39) {
                    PD(e);
                    lastChannelButton = o;
                    element('pb').focus();
                    return;
                }
                if (k == 37) {
                    PD(e);
                    return;
                }
            }
            if (o && o.parentNode == element('ctrl')) {
                l = element('ctrl').querySelectorAll('button');
                for (j = 0; j < l.length; j++)
                    if (l[j] == o)
                        break;
                if (k == 37) {
                    PD(e);
                    if (j > 0)
                        l[j - 1].focus();
                    else
                        CUR();
                    return;
                }
                if (k == 39) {
                    PD(e);
                    if (j < l.length - 1)
                        l[j + 1].focus();
                    return;
                }
                if (k == 38) {
                    PD(e);
                    CUR();
                    return;
                }
                if (k == 40) {
                    PD(e);
                    return;
                }
            }
        }
        PD(e);
        moveDirectionalFocus(k, o);
        if (fullscreen)
            showPlaybackControls(1);
    };
    documentRef.onkeypress = function (e) {
        if (BK(EK(e)))
            return BR(e);
    };
    documentRef.onirkeypress = documentRef.onkeyup = documentRef.onkeypress;
    window.RawPlayer = {
        diagnostics:function(){var source=window.RemoteTV&&window.RemoteTV.liveHealth652,out={},key;if(!source)return {active:false,engine:'nenhum'};for(key in source)if(source.hasOwnProperty(key))out[key]=source[key];return out;},
        exit: exitApplication,
        rawExit: loadChannels,
        show: showScreen,
        fullscreen: setHeadlessFullscreen,
        play: function (s, u, v, ff, failCb, headless) {
            moduleHeadless = headless ? 1 : 0;
            if (moduleHeadless)
                hideScreens();
            else
                showScreen('player');
            if (ff) {
                fullscreen = 1;
                element('player').className = moduleHeadless ? 'h' : 'fs';
                showVideoMasks(0);
                refreshVideoLayout();
                if (moduleHeadless)
                    showPlaybackControls(0);
                else
                    showPlaybackControls(1);
            }
            stopPlayback('raw');
            cancelPageRequest();
            rawFail43 = typeof failCb == 'function' ? failCb : null;
            rawFailOnce43 = 0;
            tr41 = 0;
            lastRecover41 = 0;
            setStatusText('pt', s);
            markDiagnostic('P surface ' + (moduleHeadless ? 'headless' : 'shell'));
            startControlSession([
                s,
                '',
                u
            ], function () {
                routeUrls = v || !/\.m3u8/i.test(u) ? [u] : mediaCore.compat(u);
                routeIndex = 0;
                profileIndex = 0;
                tryNextPlaybackRoute();
            });
        },
        close: function () {
            rawFail43 = null;
            rawFailOnce43 = 1;
            stopPlayback('raw-back');
            fullscreen = 0;
            moduleHeadless = 0;
            element('player').className = 'h';
            showVideoMasks(0);
            var b = element('pq');
            if (b)
                b.style.display = 'none';
        }
    };
    window.onbeforeunload = function () {
        cancelControlSession('unload');
        releaseNativePlayback('unload');
    };
    window.onpopstate = restoreNavigationState;
    createVideoMasks();
    pushNavigationState();
    if (location.hash == '#tv') {
        showScreen('tvlist');
        loadChannels();
    } else
        element('tv').focus();
}());
try {
    if (window.RemoteTV) {
        RemoteTV.appNavigation = 'live-html-recovery-candidate';
        RemoteTV.ready('player1');
    }
} catch (e) {
}
