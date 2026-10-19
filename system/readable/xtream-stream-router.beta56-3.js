/* RemoteTV beta 3. ES5 source; compatibility aliases are intentional. */
(function (windowRef) {
    'use strict';
    var xtreamApi = windowRef.XT10, remoteTV = windowRef.RemoteTV || (windowRef.RemoteTV = {}), AH = 'http://127.0.0.1:8765/hls?u=';
    if (!xtreamApi)
        return;
    function extensionOf(x) {
        return String(x || '').replace(/^\./, '').toLowerCase();
    }
    function providerBase(o) {
        var c = xtreamApi.state && xtreamApi.state.c, k = o.t == 'c' ? 'live' : o.t == 'm' ? 'movie' : 'series';
        if (!c)
            return '';
        return c.d + '/' + k + '/' + encodeURIComponent(c.u) + '/' + encodeURIComponent(c.p) + '/' + o.id + '.';
    }
    function autoRoute(u, maxh) {
        return AH + encodeURIComponent(u) + (maxh ? '&maxh=' + maxh : '');
    }
    function liveRoutes(o) {
        var b = providerBase(o), h;
        if (!b)
            return [];
        h = b + 'm3u8';
        return [
            autoRoute(h, 720),
            autoRoute(h, 1080),
            h
        ];
    }
    function routes(o) {
        var b = providerBase(o), a = [], e = extensionOf(o.ext) || (o.t == 'c' ? 'ts' : '');
        if (!b)
            return a;
        if (o.t == 'c')
            return liveRoutes(o);
        if (e)
            a.push(b + e);
        return a;
    }
    xtreamApi.liveRoutes = liveRoutes;
    xtreamApi.routes = routes;
    xtreamApi.stream = function (o) {
        var a = o && o.t == 'c' ? liveRoutes(o) : routes(o), u = a[0] || '';
        try {
            xtreamApi.log('STREAM22', (o.t == 'c' ? 'live' : 'vod') + ' id=' + String(o.id) + ' \xB7 ' + (o.t == 'c' ? 'AutoHLS 720p-first' : 'container') + ' \xB7 ' + xtreamApi.mask(u));
        } catch (e) {
        }
        return u;
    };
    remoteTV.streamPolicy = 'autohls-720-stable-first';
    remoteTV.streamRouter = '0.22';
    try {
        xtreamApi.log('BOOT', 'Stream router v0.22 \xB7 live AutoHLS 720p-first, 1080p fallback explícito');
    } catch (e) {
    }
}(this));
