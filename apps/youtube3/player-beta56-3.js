/* RemoteTV beta 3. ES5 source; compatibility aliases are intentional. */
(function (windowRef, documentRef) {
    'use strict';
    var launchButton = documentRef.getElementById('yt3'), screen = documentRef.getElementById('yt3probe'), unusedLegacyFrame = documentRef.getElementById('yt3frame'), backButton = documentRef.getElementById('yt3back'), statusLabel = documentRef.getElementById('yt3status'), remoteTV = windowRef.RemoteTV, mediaCore = windowRef.YTCore;
    if (!launchButton || !screen || !unusedLegacyFrame || !backButton || !statusLabel)
        return;
    var requestScope = new remoteTV.RequestScope(), playbackSession = null;
    var TEST_ID = 'M7lc1UVf-VE', INSTANCES_API = 'https://api.invidious.io/instances.json?sort_by=health';
    var FALLBACK_INSTANCES = [];
    var isOpen = 0, sessionGeneration = 0, viewMode = 'browse', logOpen = 0, controlsTimer = 0, routeTimeout = 0, isPlaying = 0, playPosition = 0, mediaDuration = 0, lastKey = 0, lastAt = 0, nativePlayer = null, htmlVideo = null, hidden = [], lines = [], lastResults = [], currentId = '', currentTitle = '', lastResolver = '';
    function $(i) {
        return documentRef.getElementById(i);
    }
    function now() {
        return new Date().getTime();
    }
    function padNumber(n) {
        return n < 10 ? '0' + n : '' + n;
    }
    function formatLogTimestamp() {
        var x = new Date();
        return padNumber(x.getHours()) + ':' + padNumber(x.getMinutes()) + ':' + padNumber(x.getSeconds()) + '.' + ('00' + x.getMilliseconds()).slice(-3);
    }
    function keyCode(e) {
        return e && (e.which || e.keyCode) || windowRef.event && (windowRef.event.which || windowRef.event.keyCode) || 0;
    }
    function isBack(k) {
        return ',4,8,27,158,166,461,462,464,528,1061,10009,'.indexOf(',' + k + ',') >= 0;
    }
    function consumeInputEvent(e) {
        if (e && e.preventDefault)
            e.preventDefault();
        else if (e)
            e.returnValue = false;
        if (e && e.stopPropagation)
            e.stopPropagation();
        if (e)
            e.cancelBubble = true;
    }
    function mark(message) {
        requestScope.local('/debug/mark?m=' + encodeURIComponent('YT56.3 ' + message), null, 2500);
    }
    function log(s, key) {
        var line = '[' + formatLogTimestamp() + '] ' + s, e;
        lines.push(line);
        if (lines.length > 260)
            lines.shift();
        e = $('yt3logbody');
        if (e) {
            e.textContent = lines.join('\n');
            e.scrollTop = e.scrollHeight;
        }
        if (key)
            mark(s);
    }
    function readStorage(k) {
        try {
            return localStorage.getItem(k) || '';
        } catch (e) {
            return '';
        }
    }
    function writeStorage(k, v) {
        try {
            localStorage.setItem(k, v);
        } catch (e) {
        }
    }
    function installStyles() {
        var s = $('yt3v55css');
        if (s)
            return;
        s = documentRef.createElement('style');
        s.id = 'yt3v55css';
        s.type = 'text/css';
        s.innerHTML = '' + '#yt3probe{position:fixed!important;left:0!important;top:0!important;width:1280px!important;height:720px!important;margin:0!important;padding:0!important;background:#000000!important;overflow:hidden!important;z-index:300!important}' + '#yt3probe.ytplay{background:transparent!important}' + '#yt3frame,#yt3video{position:absolute!important;left:0!important;top:0!important;width:1280px!important;height:720px!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;z-index:1!important;object-fit:contain!important}' + '#yt3head{white-space:nowrap!important;position:absolute!important;left:14px!important;top:12px!important;width:1252px!important;height:46px!important;z-index:10!important;background:transparent!important}' + '#yt3head h1{width:auto!important;display:inline-block!important;margin:0 10px 0 0!important;padding:8px 10px!important;font-size:20px!important;background:rgba(3,5,6,.90)!important;border-radius:4px!important;vertical-align:top!important}' + '#yt3back,#yt3test,#yt3logbtn{display:inline-block!important;width:128px!important;height:42px!important;margin:0 6px 0 0!important;padding:7px!important;text-align:center!important;background:rgba(3,5,6,.94)!important;vertical-align:top!important}' + '#yt3back:focus,#yt3test:focus,#yt3logbtn:focus,#yt3searchbtn:focus,#yt3query:focus,#yt3results button:focus{outline:0!important;border:2px solid #fff!important;background:#303030!important;color:#fff!important}' + '#yt3status{position:absolute!important;left:14px!important;top:62px!important;z-index:10!important;margin:0!important;padding:6px 9px!important;max-width:1110px!important;background:rgba(3,5,6,.88)!important;border-radius:4px!important;color:#eef2f4!important;font-size:14px!important}' + '#yt3browse{position:absolute!important;left:36px!important;top:112px!important;width:1208px!important;height:580px!important;z-index:6!important;background:#111111!important;border-radius:4px!important;padding:18px!important;box-sizing:border-box!important}' + '#yt3searchrow{height:54px!important;white-space:nowrap!important}' + '#yt3query{display:inline-block!important;width:930px!important;height:44px!important;padding:5px 10px!important;margin:0 8px 0 0!important;box-sizing:border-box!important;font-size:21px!important;background:#f6f7f8!important;color:#111!important;border:2px solid #59636a!important;border-radius:4px!important}' + '#yt3searchbtn{display:inline-block!important;width:210px!important;height:44px!important;margin:0!important;font-size:18px!important}' + '#yt3results{position:absolute!important;left:18px!important;top:82px!important;width:1172px!important;height:478px!important;overflow-y:auto!important;overflow-x:hidden!important}' + '#yt3results button{display:block!important;width:1130px!important;min-height:58px!important;margin:0 0 8px 0!important;padding:10px 14px!important;text-align:left!important;white-space:normal!important;font-size:18px!important;line-height:1.25!important;background:#1c1c1c!important;color:#f4f6f7!important;border:2px solid #444444!important;border-radius:4px!important}' + '#yt3results .ytmeta{display:block!important;margin-top:4px!important;font-size:13px!important;color:#b9c2c8!important}' + '#yt3logpanel{position:absolute!important;right:0!important;top:0!important;width:370px!important;height:720px!important;z-index:14!important;padding:10px!important;box-sizing:border-box!important;background:#000000!important;border-left:1px solid #6c757d!important;overflow:hidden!important}' + '#yt3logtitle{height:34px!important;font:bold 16px Arial!important}' + '#yt3logbody{width:348px!important;height:656px!important;overflow-y:auto!important;overflow-x:hidden!important;white-space:pre-wrap!important;word-wrap:break-word!important;word-break:break-all!important;font:12px/1.35 monospace!important;color:#f1f3f4!important}' + '#yt3probe.chromeoff #yt3head,#yt3probe.chromeoff #yt3status{opacity:0!important;pointer-events:none!important}';
        (documentRef.head || documentRef.documentElement).appendChild(s);
    }
    function addUI() {
        var head = $('yt3head'), test = $('yt3test'), lb = $('yt3logbtn'), browse = $('yt3browse'), p = $('yt3logpanel');
        if (head && head.getElementsByTagName('h1')[0])
            head.getElementsByTagName('h1')[0].innerHTML = 'YouTube Bridge';
        if (!test) {
            test = documentRef.createElement('button');
            test.id = 'yt3test';
            test.appendChild(documentRef.createTextNode('Teste'));
            head.appendChild(test);
        }
        if (!lb) {
            lb = documentRef.createElement('button');
            lb.id = 'yt3logbtn';
            lb.appendChild(documentRef.createTextNode('Log'));
            head.appendChild(lb);
        }
        if (!browse) {
            browse = documentRef.createElement('section');
            browse.id = 'yt3browse';
            browse.innerHTML = '<div id="yt3searchrow"><input id="yt3query" type="text" autocomplete="off" placeholder="Buscar ou colar URL do YouTube"><button id="yt3searchbtn">Buscar</button></div><div id="yt3results"></div>';
            screen.appendChild(browse);
        }
        if (!p) {
            p = documentRef.createElement('aside');
            p.id = 'yt3logpanel';
            p.className = 'h';
            p.innerHTML = '<div id="yt3logtitle">YouTube Bridge \xB7 diagnóstico</div><div id="yt3logbody"></div>';
            screen.appendChild(p);
        }
        test.onclick = function () {
            playId(TEST_ID, 'Teste YouTube');
        };
        lb.onclick = toggleLog;
        $('yt3searchbtn').onclick = searchNow;
        $('yt3query').onkeydown = function (e) {
            if (keyCode(e) == 13) {
                consumeInputEvent(e);
                searchNow();
                return false;
            }
            return true;
        };
        try {
            unusedLegacyFrame.setAttribute('tabindex', '-1');
        } catch (x) {
        }
    }
    function toggleLog() {
        var p = $('yt3logpanel'), lb = $('yt3logbtn');
        logOpen = !logOpen;
        if (p)
            p.className = logOpen ? '' : 'h';
        if (lb)
            lb.innerHTML = logOpen ? 'Fechar log' : 'Log';
        if (logOpen)
            try {
                lb.focus();
            } catch (x) {
            }
        log('LOG ' + (logOpen ? 'aberto' : 'fechado'), 1);
    }
    function showControls(focusId) {
        var z;
        if (!isOpen)
            return;
        if (viewMode == 'play')
            screen.className = 'ytplay';
        else
            screen.className = '';
        clearTimeout(controlsTimer);
        if (viewMode == 'play' && !logOpen)
            controlsTimer = setTimeout(function () {
                if (isOpen && viewMode == 'play' && !logOpen)
                    screen.className = 'ytplay chromeoff';
            }, 5200);
        if (focusId) {
            z = $(focusId);
            if (z)
                try {
                    z.focus();
                } catch (x) {
                }
        }
    }
    function hideBase(on) {
        var ids = [
                'menu',
                'new',
                'tvlist',
                'player',
                'logp'
            ], i, e, kids;
        if (on) {
            if (hidden.length)
                return;
            for (i = 0; i < ids.length; i++) {
                e = $(ids[i]);
                if (e) {
                    hidden.push([
                        e,
                        e.style.display,
                        e.style.visibility
                    ]);
                    e.style.display = 'none';
                    e.style.visibility = 'hidden';
                }
            }
            kids = documentRef.body ? documentRef.body.childNodes : [];
            for (i = 0; i < kids.length; i++) {
                e = kids[i];
                if (e && e.nodeType == 1 && e.tagName == 'I') {
                    hidden.push([
                        e,
                        e.style.display,
                        e.style.visibility
                    ]);
                    e.style.display = 'none';
                    e.style.visibility = 'hidden';
                }
            }
        } else {
            for (i = hidden.length - 1; i >= 0; i--) {
                e = hidden[i][0];
                e.style.display = hidden[i][1];
                e.style.visibility = hidden[i][2];
            }
            hidden = [];
        }
    }
    function releaseNative() {
        if (playbackSession) {
            playbackSession.stop();
            playbackSession = null;
        }
        hideBase(false);
    }
    function clearMedia() {
        clearTimeout(routeTimeout);
        routeTimeout = 0;
        unusedLegacyFrame.onload = null;
        try {
            unusedLegacyFrame.src = 'about:blank';
            unusedLegacyFrame.style.display = 'none';
        } catch (x) {
        }
        if (htmlVideo) {
            try {
                htmlVideo.pause();
                htmlVideo.removeAttribute('src');
                htmlVideo.load();
            } catch (x) {
            }
            if (htmlVideo.parentNode)
                htmlVideo.parentNode.removeChild(htmlVideo);
            htmlVideo = null;
        }
        releaseNative();
        isPlaying = 0;
        playPosition = 0;
        mediaDuration = 0;
    }
    function fetchMetadata(url, cb, timeout) {
        return requestScope.fetch(url, cb, timeout || 7000);
    }
    function normalizeHost(s) {
        s = ('' + (s || '')).replace(/^https?:\/\//i, '').replace(/\/.*$/, '').replace(/[^a-zA-Z0-9.:-]/g, '');
        return s;
    }
    function uniq(a) {
        var o = [], i, v;
        for (i = 0; i < a.length; i++) {
            v = normalizeHost(a[i]);
            if (v && (',' + o.join(',') + ',').indexOf(',' + v + ',') < 0)
                o.push(v);
        }
        return o;
    }
    function YouTubeResolver(scope) {
        this.scope = scope;
        this.hosts = [];
        this.ready = false;
        this.saved = readStorage('remote-tv.youtube3.instance.v55');
    }
    YouTubeResolver.prototype.discover = function (cb) {
        var self = this;
        if (self.ready) {
            cb();
            return;
        }
        self.scope.fetch(INSTANCES_API, function (error, body) {
            var list = [], allowed = [], denied = {}, i, entry, host;
            if (!error)
                try {
                    list = JSON.parse(body);
                } catch (parseError) {
                    error = 'lista inválida';
                }
            for (i = 0; i < list.length; i++) {
                entry = list[i];
                if (!entry || !entry[1])
                    continue;
                host = normalizeHost(entry[0]);
                if (entry[1].api === false)
                    denied[host] = true;
                else if (entry[1].type === 'https' && host.indexOf('.') > 0 && !/\.(onion|i2p|ygg)$/.test(host))
                    allowed.push(host);
            }
            if (error)
                allowed = FALLBACK_INSTANCES.slice(0);
            allowed = uniq([self.saved].concat(allowed));
            self.hosts = [];
            for (i = 0; i < allowed.length; i++)
                if (!denied[allowed[i]])
                    self.hosts.push(allowed[i]);
            self.ready = true;
            log('RESOLVER ' + self.hosts.length + ' APIs candidatas' + (error ? ' \xB7 lista indisponível' : ''), 1);
            cb();
        }, 5000);
    };
    YouTubeResolver.prototype.request = function (path, cb) {
        var self = this, mine = sessionGeneration, index = 0, began = now();
        self.discover(function () {
            function next() {
                var host;
                if (!isOpen || mine !== sessionGeneration)
                    return;
                if (index >= self.hosts.length || index >= 4 || now() - began > 24000) {
                    cb('Nenhum resolvedor compatível disponível');
                    return;
                }
                host = self.hosts[index++];
                self.scope.fetch('https://' + host + path, function (error, body) {
                    var result;
                    if (!isOpen || mine !== sessionGeneration)
                        return;
                    if (error) {
                        log('API ' + host + ' ' + error);
                        next();
                        return;
                    }
                    try {
                        result = JSON.parse(body);
                    } catch (parseError) {
                        next();
                        return;
                    }
                    if (!result || result.error || /\/videos\//.test(path) && !chooseStream(result)) {
                        log('API sem mídia compatível ' + host);
                        next();
                        return;
                    }
                    lastResolver = host;
                    self.saved = host;
                    writeStorage('remote-tv.youtube3.instance.v55', host);
                    cb(null, result);
                }, 5000);
            }
            next();
        });
    };
    var resolverClient = new YouTubeResolver(requestScope);
    function apiRequest(path, cb) {
        resolverClient.request(path, cb);
    }
    function parseVideoId(s) {
        var m;
        s = ('' + (s || '')).replace(/^\s+|\s+$/g, '');
        if (mediaCore && mediaCore.videoId)
            try {
                m = mediaCore.videoId(s);
                if (m)
                    return m;
            } catch (x) {
            }
        if (/^[A-Za-z0-9_-]{11}$/.test(s))
            return s;
        m = s.match(/[?&]v=([A-Za-z0-9_-]{11})/);
        if (m)
            return m[1];
        m = s.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
        if (m)
            return m[1];
        m = s.match(/\/shorts\/([A-Za-z0-9_-]{11})/);
        if (m)
            return m[1];
        m = s.match(/\/embed\/([A-Za-z0-9_-]{11})/);
        return m ? m[1] : '';
    }
    function escapeHtml(s) {
        return ('' + (s || '')).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function formatTime(n) {
        n = +n || 0;
        var h = Math.floor(n / 3600), m = Math.floor(n % 3600 / 60), s = Math.floor(n % 60);
        return (h ? h + ':' : '') + (h && m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }
    function renderResults(a) {
        var r = $('yt3results'), i, b, v, meta;
        r.innerHTML = '';
        lastResults = [];
        for (i = 0; i < a.length && lastResults.length < 20; i++) {
            v = a[i];
            if (!v || v.type && v.type != 'video' || !v.videoId)
                continue;
            lastResults.push(v);
            b = documentRef.createElement('button');
            b.setAttribute('data-i', lastResults.length - 1);
            meta = (v.author || '') + (v.lengthSeconds ? ' \xB7 ' + formatTime(v.lengthSeconds) : '') + (v.viewCountText ? ' \xB7 ' + v.viewCountText : '');
            b.innerHTML = escapeHtml(v.title || v.videoId) + '<span class="ytmeta">' + escapeHtml(meta) + '</span>';
            b.onclick = function () {
                var z = lastResults[+this.getAttribute('data-i')];
                if (z)
                    playId(z.videoId, z.title || z.videoId);
            };
            r.appendChild(b);
        }
        if (!lastResults.length)
            r.innerHTML = '<div style="padding:20px;color:#c8d0d5">Nenhum vídeo encontrado.</div>';
        else
            try {
                r.getElementsByTagName('button')[0].focus();
            } catch (x) {
            }
    }
    function searchNow() {
        requestScope.cancel();
        var q = $('yt3query'), s = q ? q.value : '', id = parseVideoId(s);
        if (!s)
            return;
        if (id) {
            playId(id, s);
            return;
        }
        viewMode = 'browse';
        showControls();
        statusLabel.textContent = 'Buscando\u2026';
        writeStorage('remote-tv.youtube3.query.v55', s);
        sessionGeneration++;
        apiRequest('/api/v1/search?q=' + encodeURIComponent(s) + '&type=video&region=BR&hl=pt-BR', function (e, j) {
            if (e) {
                statusLabel.textContent = 'Busca indisponível agora. Tente novamente ou cole uma URL.';
                log('SEARCH ' + e, 1);
                return;
            }
            renderResults(j || []);
            statusLabel.textContent = 'Resultados \xB7 resolvedor ' + lastResolver;
            log('SEARCH resultados ' + lastResults.length, 1);
        });
    }
    function directMedia(url) {
        return /^https?:\/\/[^\s\/]+\//i.test(String(url || '')) && !/^https?:\/\/(?:localhost|127\.|\[?::1)/i.test(url);
    }
    function qualityHeight(value) {
        var match = String(value || '').match(/(\d{3,4})/);
        return match ? +match[1] : 0;
    }
    function chooseStream(metadata) {
        var formats = metadata && metadata.formatStreams || [], best = null, score = -1, index, format, height, mime, quality;
        for (index = 0; index < formats.length; index++) {
            format = formats[index] || {};
            mime = String(format.type || format.mimeType || format.container || '').toLowerCase();
            height = +format.height || qualityHeight(format.qualityLabel || format.quality) || (String(format.itag) === '18' ? 360 : String(format.itag) === '22' ? 720 : 0);
            if (!directMedia(format.url) || height > 720 || height <= 0 || !/(mp4|avc1)/.test(mime) || /(av01|vp9|vp09|hev1|hvc1)/.test(mime))
                continue;
            quality = height;
            if (quality > score) {
                score = quality;
                best = {
                    url: format.url,
                    mimeType: mime,
                    quality: format.qualityLabel || format.quality || 'MP4',
                    live: 0
                };
            }
        }
        if (best)
            return best;
        if (metadata && metadata.hlsUrl && directMedia(metadata.hlsUrl))
            return {
                url: metadata.hlsUrl,
                mimeType: 'application/x-mpegURL',
                quality: 'HLS até 720p',
                live: 1
            };
        return null;
    }
    function NativePlaybackSession(stream, generation) {
        this.stream = stream;
        this.generation = generation;
        this.player = null;
        this.id = -1;
        this.timer = 0;
        this.finished = false;
        this.confirmed = false;
    }
    NativePlaybackSession.prototype.stop = function () {
        var player = this.player;
        clearTimeout(this.timer);
        this.timer = 0;
        this.player = null;
        this.finished = true;
        if (player) {
            try {
                player.stop();
            } catch (error) {
            }
            try {
                if (this.id >= 0)
                    player.releaseMediaPlayer(this.id);
            } catch (error) {
            }
        }
        if (nativePlayer === player) {
            nativePlayer = null;
        }
        hideBase(0);
    };
    NativePlaybackSession.prototype.start = function (callback) {
        var self = this, K = windowRef.QjyMediaPlayer || windowRef.MediaPlayer, started = now(), last = -1, profile, result;
        function valid() {
            return isOpen && self.generation === sessionGeneration && self.player && playbackSession === self;
        }
        function fail(reason) {
            if (self.finished)
                return;
            log('NATIVE ' + reason, 1);
            self.stop();
            if (isOpen && self.generation === sessionGeneration)
                callback(false);
        }
        if (!K || !mediaCore || !mediaCore.media) {
            callback(false);
            return;
        }
        hideBase(1);
        try {
            self.player = new K();
            self.id = self.player.getNativePlayerInstanceID();
            result = self.player.initMediaPlayer(self.id, 0, 1, 720, 1280, 0, 0, 0, 0, 0, 100, 0, 0, 1);
            if (result === -1)
                throw 'init';
            if (self.player.setNativeUIFlag)
                self.player.setNativeUIFlag(0);
            if (self.player.setVideoDisplayMode)
                self.player.setVideoDisplayMode(1);
            if (self.player.setVideoAlpha)
                self.player.setVideoAlpha(0);
            if (self.player.refreshVideoDisplay)
                self.player.refreshVideoDisplay();
            profile = {
                m: 2,
                a: 4,
                s: self.stream.live ? 2 : 3
            };
            if (self.player.setSingleMedia(mediaCore.media(self.stream.url, profile)) === -1)
                throw 'media';
            if (self.player.playFromStart() === -1)
                throw 'play';
            nativePlayer = self.player;
        } catch (error) {
            fail('comando recusado');
            return;
        }
        function poll() {
            var position = 0, mode = '';
            if (!valid())
                return;
            try {
                position = +self.player.getCurrentPlayTime() || 0;
                mode = self.player.getPlaybackMode ? self.player.getPlaybackMode() : '';
            } catch (error) {
            }
            playPosition = position;
            try {
                mediaDuration = self.player.getMediaDuration ? +self.player.getMediaDuration() || 0 : 0;
            } catch (error) {
            }
            if (self.confirmed) {
                self.timer = setTimeout(poll, 1000);
                return;
            }
            if (last >= 0 && position > last + 0.05 || mediaCore.normal && mediaCore.normal(mode)) {
                self.confirmed = true;
                isPlaying = 1;
                clearTimeout(routeTimeout);
                statusLabel.textContent = 'Reproduzindo YouTube \xB7 ' + self.stream.quality;
                log('NATIVE confirmado ' + (now() - started) + 'ms', 1);
                showControls();
                callback(true);
                if (valid())
                    self.timer = setTimeout(poll, 1000);
                return;
            }
            last = position;
            if (now() - started >= 12000) {
                fail('sem confirmação de reprodução');
                return;
            }
            self.timer = setTimeout(poll, 500);
        }
        self.timer = setTimeout(poll, 500);
    };
    function startNativePlayback(stream, generation, done) {
        if (playbackSession)
            playbackSession.stop();
        playbackSession = new NativePlaybackSession(stream, generation);
        playbackSession.start(done);
    }
    function startHtmlPlayback(stream, generation, done) {
        var settled = false, element = documentRef.createElement('video');
        hideBase(0);
        htmlVideo = element;
        element.id = 'yt3video';
        element.autoplay = true;
        element.controls = false;
        screen.insertBefore(element, screen.firstChild);
        function valid() {
            return isOpen && generation === sessionGeneration && htmlVideo === element;
        }
        function finish(ok, reason) {
            if (settled || !valid())
                return;
            settled = true;
            clearTimeout(routeTimeout);
            routeTimeout = 0;
            if (!ok) {
                try {
                    element.pause();
                    element.removeAttribute('src');
                    element.load();
                } catch (error) {
                }
                if (element.parentNode)
                    element.parentNode.removeChild(element);
                htmlVideo = null;
            }
            log('HTML5 ' + reason + (ok ? ' OK' : ' falhou'), 1);
            done(ok);
        }
        element.onplaying = function () {
            if (!valid())
                return;
            isPlaying = 1;
            statusLabel.textContent = 'Reproduzindo YouTube \xB7 HTML5 \xB7 ' + stream.quality;
            showControls();
            finish(true, 'playing');
        };
        element.ontimeupdate = function () {
            if (valid()) {
                playPosition = +element.currentTime || 0;
                mediaDuration = +element.duration || 0;
            }
        };
        element.onerror = function () {
            finish(false, 'erro de mídia');
        };
        try {
            element.src = stream.url;
            routeTimeout = setTimeout(function () {
                finish(false, 'timeout');
            }, 12000);
            var promise = element.play();
            if (promise && promise.catch)
                promise.catch(function () {
                    finish(false, 'play recusado');
                });
        } catch (error) {
            finish(false, 'exceção');
        }
    }
    function bridgeStream(stream) {
        return {
            url: 'http://127.0.0.1:8765' + (stream.live ? '/hls?maxh=720&u=' : '/fetch?u=') + encodeURIComponent(stream.url),
            mimeType: stream.mimeType,
            quality: stream.quality,
            live: stream.live
        };
    }
    function playResolvedStream(stream, generation, next) {
        var local = bridgeStream(stream);
        log('PLAYBACK bridge TLS \xB7 ' + stream.quality, 1);
        startNativePlayback(local, generation, function (ok) {
            if (!isOpen || generation !== sessionGeneration)
                return;
            if (ok)
                return;
            startHtmlPlayback(local, generation, function (htmlOk) {
                if (!isOpen || generation !== sessionGeneration)
                    return;
                if (!htmlOk)
                    next();
            });
        });
    }
    function resolveWatchPage(id, mine, cb) {
        var u = 'https://www.youtube.com/watch?v=' + encodeURIComponent(id) + '&hl=pt&gl=BR';
        if (!mediaCore || !mediaCore.jsonAfter || !mediaCore.playable) {
            cb('YTCore indisponível');
            return;
        }
        statusLabel.textContent = 'Fallback local: analisando página do YouTube\u2026';
        fetchMetadata(u, function (e, h) {
            var p, z;
            if (!isOpen || mine != sessionGeneration)
                return;
            if (e) {
                cb(e);
                return;
            }
            try {
                p = mediaCore.jsonAfter(h, 'ytInitialPlayerResponse =') || mediaCore.jsonAfter(h, 'ytInitialPlayerResponse=');
                z = mediaCore.playable(p);
            } catch (x) {
                z = null;
            }
            if (z && z.url && directMedia(z.url)) {
                log('WATCH formato direto', 1);
                cb(null, {
                    url: z.url,
                    mimeType: z.mimeType || '',
                    quality: z.qualityLabel || 'watch',
                    live: 0
                });
                return;
            }
            cb('sem URL direta');
        }, 8500);
    }
    function playId(id, title) {
        var mine;
        id = parseVideoId(id) || id;
        if (!/^[A-Za-z0-9_-]{11}$/.test(id)) {
            statusLabel.textContent = 'ID do vídeo inválido.';
            return;
        }
        requestScope.cancel();
        sessionGeneration++;
        mine = sessionGeneration;
        clearMedia();
        viewMode = 'play';
        currentId = id;
        currentTitle = title || id;
        isPlaying = 0;
        var browse = $('yt3browse');
        if (browse)
            browse.style.display = 'none';
        showControls();
        statusLabel.textContent = 'Resolvendo primeiro vídeo\u2026';
        log('PLAY ' + id + ' \xB7 transporte pelo kit local', 1);
        function unavailable(reason) {
            if (!isOpen || mine !== sessionGeneration)
                return;
            statusLabel.textContent = 'Sem fonte compatível disponível. Consulte o Log.';
            log('PLAY não confirmado \xB7 ' + reason, 1);
        }
        function resolveApi() {
            if (!isOpen || mine !== sessionGeneration)
                return;
            apiRequest('/api/v1/videos/' + encodeURIComponent(id) + '?local=true&region=BR&hl=pt-BR', function (error, metadata) {
                var stream;
                if (!isOpen || mine !== sessionGeneration)
                    return;
                stream = !error && chooseStream(metadata);
                if (!stream) {
                    unavailable(error || 'sem MP4/HLS compatível');
                    return;
                }
                currentTitle = metadata.title || currentTitle;
                playResolvedStream(stream, mine, function () {
                    unavailable('decoder não confirmou o vídeo');
                });
            });
        }
        resolveWatchPage(id, mine, function (error, stream) {
            if (!isOpen || mine !== sessionGeneration)
                return;
            if (!error && stream) {
                playResolvedStream(stream, mine, resolveApi);
            } else
                resolveApi();
        });
    }
    function showBrowse() {
        requestScope.cancel();
        sessionGeneration++;
        clearMedia();
        viewMode = 'browse';
        var b = $('yt3browse');
        if (b)
            b.style.display = 'block';
        unusedLegacyFrame.style.display = 'none';
        statusLabel.textContent = 'Busque um vídeo ou cole uma URL. O kit local transporta a mídia; OK em Teste tenta o primeiro vídeo.';
        showControls();
        try {
            ($('yt3query') || backButton).focus();
        } catch (x) {
        }
    }
    function close() {
        if (!isOpen)
            return;
        log('CLOSE', 1);
        isOpen = 0;
        requestScope.cancel();
        sessionGeneration++;
        clearTimeout(controlsTimer);
        clearMedia();
        screen.className = 'h';
        logOpen = 0;
        var p = $('yt3logpanel'), lb = $('yt3logbtn');
        if (p)
            p.className = 'h';
        if (lb)
            lb.innerHTML = 'Log';
        statusLabel.textContent = 'YouTube Bridge.';
        try {
            launchButton.focus();
        } catch (x) {
        }
    }
    function launch() {
        if (isOpen)
            return;
        installStyles();
        addUI();
        isOpen = 1;
        sessionGeneration++;
        lines = [];
        logOpen = 0;
        screen.className = '';
        var q = $('yt3query');
        if (q && !q.value)
            q.value = readStorage('remote-tv.youtube3.query.v55');
        log('OPEN beta 3 \xB7 classes de transporte, resolução e reprodução', 1);
        showBrowse();
    }
    function visible(el) {
        return el && el.offsetWidth > 0 && el.offsetHeight > 0;
    }
    function focusables() {
        var all = screen.getElementsByTagName('*'), a = [], i, e, t;
        for (i = 0; i < all.length; i++) {
            e = all[i];
            t = e.tagName;
            if ((t == 'BUTTON' || t == 'INPUT') && visible(e) && e.id != 'yt3frame')
                a.push(e);
        }
        return a;
    }
    function ensure(el) {
        var r = $('yt3results');
        if (!r || !el || !el.getBoundingClientRect)
            return;
        var a = el.getBoundingClientRect(), b = r.getBoundingClientRect();
        if (a.top < b.top)
            r.scrollTop -= b.top - a.top + 8;
        else if (a.bottom > b.bottom)
            r.scrollTop += a.bottom - b.bottom + 8;
    }
    function nav(k, o) {
        var a = focusables(), r = o && o.getBoundingClientRect ? o.getBoundingClientRect() : null, x, y, b = null, score = 1000000000000, i, z, q, dx, dy, s;
        if (!a.length)
            return;
        if (!r) {
            try {
                a[0].focus();
            } catch (e) {
            }
            return;
        }
        x = (r.left + r.right) / 2;
        y = (r.top + r.bottom) / 2;
        for (i = 0; i < a.length; i++) {
            z = a[i];
            if (z === o)
                continue;
            q = z.getBoundingClientRect();
            dx = (q.left + q.right) / 2 - x;
            dy = (q.top + q.bottom) / 2 - y;
            if (k == 37 && dx >= 0 || k == 39 && dx <= 0 || k == 38 && dy >= 0 || k == 40 && dy <= 0)
                continue;
            s = k == 37 || k == 39 ? Math.abs(dx) * 10 + Math.abs(dy) : Math.abs(dy) * 10 + Math.abs(dx);
            if (s < score) {
                score = s;
                b = z;
            }
        }
        if (b) {
            try {
                b.focus();
            } catch (e) {
            }
            ensure(b);
        }
    }
    function mediaKey(k) {
        var back10 = k == 412 || k == 227 || k == 177, to;
        if (nativePlayer) {
            try {
                if (k == 415) {
                    if (nativePlayer.resume)
                        nativePlayer.resume();
                    isPlaying = 1;
                } else if (k == 19) {
                    if (nativePlayer.pause)
                        nativePlayer.pause();
                    isPlaying = 0;
                } else if (back10 || k == 417 || k == 228 || k == 176) {
                    to = Math.max(0, playPosition + (back10 ? -10 : 10));
                    if (nativePlayer.playByTime)
                        nativePlayer.playByTime(1, String(Math.floor(to)), 1);
                }
            } catch (x) {
                log('NATIVE comando ' + x, 1);
            }
            return;
        }
        if (htmlVideo) {
            try {
                if (k == 415)
                    htmlVideo.play();
                else if (k == 19)
                    htmlVideo.pause();
                else if (back10)
                    htmlVideo.currentTime = Math.max(0, (+htmlVideo.currentTime || 0) - 10);
                else if (k == 417 || k == 228 || k == 176)
                    htmlVideo.currentTime = Math.min(+htmlVideo.duration || 1000000000, (+htmlVideo.currentTime || 0) + 10);
            } catch (x) {
            }
            return;
        }
        log('Comando aguardando mídia compatível');
    }
    function isText(o) {
        return o && o.tagName == 'INPUT';
    }
    function handleKey(e) {
        var k = keyCode(e), o = documentRef.activeElement;
        if (!isOpen)
            return true;
        if (isBack(k)) {
            consumeInputEvent(e);
            if (logOpen) {
                toggleLog();
                return false;
            }
            if (viewMode == 'play') {
                showBrowse();
                return false;
            }
            close();
            return false;
        }
        if (logOpen && (k == 38 || k == 40)) {
            consumeInputEvent(e);
            o = $('yt3logbody');
            if (o)
                o.scrollTop += k == 38 ? -150 : 150;
            return false;
        }
        if (isText(o) && k != 13 && k != 37 && k != 38 && k != 39 && k != 40)
            return true;
        if (k == 13 || k == 41) {
            if (isText(o)) {
                consumeInputEvent(e);
                searchNow();
                return false;
            }
            if (o && o.click) {
                consumeInputEvent(e);
                o.click();
                return false;
            }
        }
        if (k == 37 || k == 38 || k == 39 || k == 40) {
            consumeInputEvent(e);
            showControls();
            nav(k, o);
            return false;
        }
        if (k == 415 || k == 19 || k == 412 || k == 417 || k == 227 || k == 228 || k == 176 || k == 177) {
            consumeInputEvent(e);
            if (viewMode == 'play')
                mediaKey(k);
            return false;
        }
        return viewMode == 'browse' && isText(o) ? true : false;
    }
    function installKeyHandler(n) {
        var prev = documentRef[n];
        documentRef[n] = function (e) {
            var k, t, o = documentRef.activeElement;
            if (isOpen) {
                k = keyCode(e);
                if ((n == 'onkeyup' || n == 'onkeypress') && isText(o) && k != 13 && k != 37 && k != 38 && k != 39 && k != 40)
                    return true;
                if (n == 'onkeyup' || n == 'onkeypress') {
                    consumeInputEvent(e);
                    return false;
                }
                t = now();
                if (k == lastKey && t - lastAt < 170) {
                    consumeInputEvent(e);
                    return false;
                }
                lastKey = k;
                lastAt = t;
                return handleKey(e);
            }
            return prev ? prev.call(documentRef, e) : true;
        };
    }
    installKeyHandler('onkeydown');
    installKeyHandler('onkeypress');
    installKeyHandler('onkeyup');
    installKeyHandler('onirkeypress');
    launchButton.onclick = launch;
    backButton.onclick = function () {
        if (viewMode == 'play')
            showBrowse();
        else
            close();
    };
    installStyles();
    addUI();
    windowRef.YouTube3Probe = {
        open: launch,
        close: close,
        play: function (id, title) {
            if (!isOpen)
                launch();
            playId(id, title);
        },
        search: function (q) {
            if (!isOpen)
                launch();
            var e = $('yt3query');
            if (e)
                e.value = q || '';
            searchNow();
        },
        videoId: function () {
            return currentId;
        },
        resolver: function () {
            return lastResolver;
        },
        state: function () {
            return {
                open: isOpen,
                mode: viewMode,
                playing: isPlaying,
                native: !!nativePlayer,
                resolver: lastResolver,
                results: lastResults.length
            };
        }
    };
}(this, document));
