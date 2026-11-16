/* RemoteTV beta 3. ES5 source; compatibility aliases are intentional. */
(function (windowRef) {
    'use strict';
    var xtreamApi = windowRef.XT10, remoteTV = windowRef.RemoteTV || (windowRef.RemoteTV = {}), AH = 'http://127.0.0.1:8765/hls?u=';
    if (!xtreamApi)
        return;
    var directFirst652=false;
    remoteTV.liveRoute652={setDirect:function(v){directFirst652=!!v;},isDirect:function(){return directFirst652;}};
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
        var b = providerBase(o), formats = xtreamApi.state && xtreamApi.state.allowedFormats || [],
            i, allowHls = !formats.length, allowTs = !formats.length,
            h, result = [], source = o && String(o.src || '');
        if (!b) return result;
        // The firmware's legacy HTML player relied on direct media URLs.
        // Do not route every live channel through the local HLS proxy first.
        if (/^https?:\/\//i.test(source)) result.push(source);
        for (i = 0; i < formats.length; i++) {
            if (/^(m3u8|hls)$/i.test(String(formats[i]))) allowHls = true;
            if (/^(ts|mpegts)$/i.test(String(formats[i]))) allowTs = true;
        }
        h = b + 'm3u8';
        if (directFirst652 && allowHls) result.push(h);
        if (allowTs) result.push(b + 'ts');
        if (!directFirst652 && allowHls) result.push(h);
        // HLS relay remains optional, after direct URLs have failed.
        if (allowHls) {
            result.push(autoRoute(h, 720));
            result.push(autoRoute(h, 1080));
        }
        return result;
    }
    function routes(o) {
        var b = providerBase(o), a = [], e = extensionOf(o.ext) || (o.t == 'c' ? 'ts' : '');
        if (!b)
            return a;
        if (o.t == 'c')
            return liveRoutes(o);
        if (o && /^https?:\/\//i.test(String(o.src || ''))) a.push(o.src);
        if (e) a.push(b + e);
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
    remoteTV.streamPolicy = 'legacy-direct-first-sticky-playback';
    remoteTV.streamRouter = '0.56-beta.6.5.16';
    try {
        xtreamApi.log('BOOT', 'Stream router v6.5.16 · Xtream direto prioritário; HLS bridge apenas fallback');
    } catch (e) {
    }
}(this));
