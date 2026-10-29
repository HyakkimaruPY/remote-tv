/* 6.5.7 standalone module; skip only after complete bundled startup. */
(function(w){
if(w.RemoteTV&&w.RemoteTV.activeCoreBundle==='0.56-beta.6.5.7')return;
/* RemoteTV beta 3. ES5 source; compatibility aliases are intentional. */
(function (windowRef, documentRef) {
    'use strict';
    var remoteTV = windowRef.RemoteTV || (windowRef.RemoteTV = {}), bridgePrefix = 'http://127.0.0.1:8765/fetch?u=', libraryUrl = 'https://cdn.jsdelivr.net/npm/hls.js@0.14.17/dist/hls.min.js', state = 0, pendingCallbacks = [];
    function supportsMediaSource() {
        try {
            return !!(windowRef.MediaSource || windowRef.WebKitMediaSource);
        } catch (e) {
            return false;
        }
    }
    function flush(e) {
        var a = pendingCallbacks.slice(0), i;
        pendingCallbacks = [];
        for (i = 0; i < a.length; i++)
            try {
                a[i](e, windowRef.Hls);
            } catch (z) {
            }
    }
    function ensureLibrary(cb) {
        var x, t;
        if (windowRef.Hls && windowRef.Hls.isSupported && windowRef.Hls.isSupported()) {
            cb(null, windowRef.Hls);
            return;
        }
        if (!supportsMediaSource()) {
            cb('MSE indisponível');
            return;
        }
        pendingCallbacks.push(cb);
        if (state == 1)
            return;
        if (state == 2) {
            flush(windowRef.Hls ? null : 'HLS.js indisponível');
            return;
        }
        state = 1;
        try {
            x = new XMLHttpRequest();
            x.onreadystatechange = function () {
                if (x.readyState == 4) {
                    clearTimeout(t);
                    if (x.status == 200 || !x.status && x.responseText) {
                        try {
                            (0, eval)(x.responseText);
                            state = 2;
                            flush(windowRef.Hls && windowRef.Hls.isSupported && windowRef.Hls.isSupported() ? null : 'HLS.js sem suporte');
                        } catch (e) {
                            state = 2;
                            flush('eval ' + e);
                        }
                    } else {
                        state = 2;
                        flush('HTTP ' + x.status);
                    }
                }
            };
            x.open('GET', bridgePrefix + encodeURIComponent(libraryUrl), true);
            x.send(null);
            t = setTimeout(function () {
                try {
                    x.abort();
                } catch (e) {
                }
                state = 2;
                flush('timeout');
            }, 7000);
        } catch (e) {
            state = 2;
            flush('falha');
        }
    }
    function playStream(video, url, start, cb, onfatal) {
        var cancelled = 0, h = null, t = 0, guard = 0, done = 0, started = 0, last = -1, advance = new Date().getTime(), deadline = advance + 12000;
        function valid() {
            return !cancelled;
        }
        function q(er) {
            if (!valid() || done)
                return;
            done = 1;
            clearTimeout(t);
            video.onplaying = null;
            cb(er, h);
            if (!er && valid()) {
                started = 1;
                guard = setTimeout(watch, 500);
            }
        }
        function watch() {
            var p = 0, now = new Date().getTime();
            if (!valid())
                return;
            try {
                p = +video.currentTime || 0;
                if (last >= 0 && p > last + 0.05)
                    advance = now;
                last = p;
                if (!started && (!video.paused && video.readyState >= 2 || p > 0)) {
                    q(null);
                    return;
                }
                if (started && (video.paused || video.seeking || video.ended)) {
                    advance = now;
                }
                if (started && now - advance >= 30000) {
                    advance = now;
                    if (onfatal)
                        onfatal({
                            type: 'networkError',
                            details: 'clock stalled'
                        }, h);
                }
            } catch (e) {
            }
            if (!started && now >= deadline) {
                q('timeout sem playback');
                return;
            }
            if (valid()) {
                if (started)
                    guard = setTimeout(watch, 500);
                else
                    t = setTimeout(watch, 350);
            }
        }
        ensureLibrary(function (e, H) {
            if (!valid())
                return;
            if (e) {
                q(e);
                return;
            }
            try {
                h = new H({
                    enableWorker: false,
                    maxBufferLength: 30,
                    maxMaxBufferLength: 60,
                    fragLoadingMaxRetry: 3,
                    levelLoadingMaxRetry: 3
                });
                video.onplaying = function () {
                    q(null);
                };
                h.on(H.Events.MEDIA_ATTACHED, function () {
                    if (valid())
                        h.loadSource(url);
                });
                h.on(H.Events.MANIFEST_PARSED, function () {
                    if (!valid())
                        return;
                    try {
                        if (start > 0)
                            video.currentTime = start;
                        var p = video.play();
                        if (p && p.catch)
                            p.catch(function () {
                            });
                    } catch (e) {
                    }
                });
                h.on(H.Events.ERROR, function (ev, data) {
                    if (!valid() || !data || !data.fatal)
                        return;
                    if (!done)
                        q('fatal ' + (data.type || ''));
                    else if (started && onfatal)
                        onfatal(data, h);
                });
                h.attachMedia(video);
                t = setTimeout(watch, 350);
            } catch (e) {
                q('exception');
            }
        });
        return {
            destroy: function () {
                cancelled = 1;
                clearTimeout(t);
                clearTimeout(guard);
                video.onplaying = null;
                if (h)
                    try {
                        h.destroy();
                    } catch (e) {
                    }
            }
        };
    }
    windowRef.XTHls20 = {
        ensure: ensureLibrary,
        play: playStream,
        supported: supportsMediaSource
    };
    remoteTV.hlsjs = '0.56-beta';
}(this, document));

}.call(this,this));
