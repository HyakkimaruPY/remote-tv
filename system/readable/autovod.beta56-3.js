/* RemoteTV beta 3. ES5 source; compatibility aliases are intentional. */
(function (windowRef) {
    'use strict';
    var xtreamApi = windowRef.XT10, remoteTV = windowRef.RemoteTV || (windowRef.RemoteTV = {}), FB = 'http://127.0.0.1:8765/fetch?u=', RES = {};
    if (!xtreamApi)
        return;
    function extensionOf(o, u) {
        var e = String(o && o.ext || '').replace(/^\./, '').toLowerCase(), m;
        if (e)
            return e;
        m = /\.([a-z0-9]{2,6})(?:[?#]|$)/i.exec(String(u || ''));
        return m ? String(m[1]).toLowerCase() : '';
    }
    function remoteStreamUrl(o) {
        var c = xtreamApi.state && xtreamApi.state.c, k, e, u;
        if (!o || !c)
            return '';
        u = String(o.src || '');
        if (/^https?:\/\//i.test(u))
            return u;
        k = o.t == 'm' ? 'movie' : o.t == 's' ? 'series' : '';
        e = extensionOf(o, '');
        if (!k || !e)
            return '';
        return c.d + '/' + k + '/' + encodeURIComponent(c.u) + '/' + encodeURIComponent(c.p) + '/' + o.id + '.' + e;
    }
    function localURL(u, o) {
        var c = xtreamApi.state && xtreamApi.state.c, e = extensionOf(o, u), ref = c ? c.d + '/player_api.php' : '';
        if (!u)
            return '';
        return FB + encodeURIComponent(u) + (ref ? '&ref=' + encodeURIComponent(ref) : '') + (e ? '&name=' + encodeURIComponent('video.' + e) : '');
    }
    function buildLocalStream(o) {
        var u = remoteStreamUrl(o);
        return localURL(u, o);
    }
    function streamKind(o) {
        var u = remoteStreamUrl(o), e = extensionOf(o, u);
        if (e == 'm3u8')
            return 'hls';
        if (/^(?:mp4|m4v|mov)$/.test(e))
            return 'mp4';
        if (/^(?:mkv|webm)$/.test(e))
            return 'matroska';
        if (/^(?:avi|divx)$/.test(e))
            return 'avi';
        if (/^(?:ts|mpeg|mpg)$/.test(e))
            return 'ts';
        return e || 'unknown';
    }
    function profiles(o) {
        var k = streamKind(o), a = [];
        if (k == 'mp4')
            a = [
                {
                    m: 2,
                    a: 4,
                    s: 3,
                    l: 'MP4 progressive'
                },
                {
                    m: 2,
                    a: 4,
                    s: 2,
                    l: 'VOD generic'
                },
                {
                    m: 1,
                    a: 4,
                    s: 2,
                    l: 'stream generic'
                }
            ];
        else if (k == 'matroska' || k == 'avi')
            a = [
                {
                    m: 2,
                    a: 4,
                    s: 2,
                    l: 'VOD generic'
                },
                {
                    m: 1,
                    a: 4,
                    s: 2,
                    l: 'stream generic'
                },
                {
                    m: 2,
                    a: 4,
                    s: 3,
                    l: 'MP4-compatible'
                }
            ];
        else
            a = [
                {
                    m: 2,
                    a: 4,
                    s: 2,
                    l: 'VOD generic'
                },
                {
                    m: 1,
                    a: 4,
                    s: 2,
                    l: 'stream generic'
                },
                {
                    m: 2,
                    a: 4,
                    s: 3,
                    l: 'progressive alt'
                }
            ];
        return a;
    }
    function probeURL(ru, o, cb) {
        var u = localURL(ru, o), x, d = 0, t, st = new Date().getTime();
        if (!u) {
            cb && cb('sem URL');
            return;
        }
        function q(e, m) {
            if (d)
                return;
            d = 1;
            clearTimeout(t);
            try {
                x.abort();
            } catch (z) {
            }
            if (m)
                xtreamApi.log('AUTOVOD22', 'probe \xB7 ' + xtreamApi.mask(ru) + ' \xB7 ' + (e || 'HTTP ' + m.status) + ' \xB7 type=' + (m.type || '\u2014') + ' \xB7 cr=' + (m.cr || '\u2014') + ' \xB7 ranges=' + (m.ranges || '\u2014') + ' \xB7 ' + (new Date().getTime() - st) + ' ms');
            if (cb)
                cb(e, m);
        }
        try {
            x = new XMLHttpRequest();
            x.onreadystatechange = function () {
                var m;
                if (x.readyState == 2) {
                    m = {
                        status: +(x.status || 0),
                        type: x.getResponseHeader('Content-Type') || '',
                        len: x.getResponseHeader('Content-Length') || '',
                        ranges: x.getResponseHeader('Accept-Ranges') || '',
                        cr: x.getResponseHeader('Content-Range') || ''
                    };
                    q(m.status == 200 || m.status == 206 ? null : 'HTTP ' + m.status, m);
                } else if (x.readyState == 4 && !d) {
                    q('HTTP ' + (x.status || 0), null);
                }
            };
            x.open('GET', u, true);
            try {
                x.setRequestHeader('Range', 'bytes=0-1');
            } catch (z) {
            }
            ;
            x.send(null);
            t = setTimeout(function () {
                q('Timeout', null);
            }, 3200);
        } catch (e) {
            q('Falha', null);
        }
    }
    function probe(o, cb) {
        probeURL(remoteStreamUrl(o), o, cb);
    }
    function candidateExtensions(o) {
        var c = xtreamApi.state && xtreamApi.state.c, k = o.t == 'm' ? 'movie' : 'series', b, e = extensionOf(o, remoteStreamUrl(o)), xs = [], seen = {}, i, u;
        if (o.src && /^https?:\/\//i.test(String(o.src)))
            xs.push(String(o.src));
        if (!c)
            return xs;
        b = c.d + '/' + k + '/' + encodeURIComponent(c.u) + '/' + encodeURIComponent(c.p) + '/' + o.id + '.';
        var ex = [
            e,
            'mp4',
            'mkv',
            'ts',
            'm4v',
            'avi',
            'mov',
            'webm',
            'm3u8'
        ];
        for (i = 0; i < ex.length; i++) {
            if (!ex[i] || seen[ex[i]])
                continue;
            seen[ex[i]] = 1;
            u = b + ex[i];
            if (xs.indexOf(u) < 0)
                xs.push(u);
        }
        return xs;
    }
    function fast(o) {
        var xs = candidateExtensions(o), u = xs[0] || '', e = extensionOf(o, u), z;
        if (!u)
            return null;
        z = { ext: e };
        xtreamApi.log('AUTOVOD23', 'fast start \xB7 ext=' + (e || '\u2014') + ' \xB7 probe em fallback \xB7 ' + xtreamApi.mask(u));
        return {
            remote: u,
            local: localURL(u, { ext: e }),
            ext: e,
            kind: streamKind(z),
            profiles: profiles(z),
            fast: 1
        };
    }
    function resolve(o, cb) {
        var key = (o.t || 'v') + ':' + String(o.id), a = RES[key], xs, i = 0;
        if (a) {
            o.src = a.remote;
            o.ext = a.ext;
            cb(null, a);
            return;
        }
        xs = candidateExtensions(o);
        function nx() {
            var u, e;
            if (i >= xs.length) {
                xtreamApi.log('AUTOVOD22', 'resolve FAIL \xB7 id=' + o.id + ' \xB7 ' + xs.length + ' candidatos');
                cb('nenhuma rota válida');
                return;
            }
            u = xs[i++];
            e = extensionOf(o, u);
            xtreamApi.log('AUTOVOD22', 'resolve ' + i + '/' + xs.length + ' \xB7 ' + xtreamApi.mask(u));
            probeURL(u, o, function (er, m) {
                if (!er) {
                    a = {
                        remote: u,
                        local: localURL(u, { ext: e }),
                        ext: e,
                        kind: function () {
                            var z = { ext: e };
                            return streamKind(z);
                        }(),
                        meta: m
                    };
                    RES[key] = a;
                    o.src = u;
                    o.ext = e;
                    xtreamApi.log('AUTOVOD22', 'resolve OK \xB7 ext=' + (e || '\u2014') + ' \xB7 HTTP ' + m.status + ' \xB7 ' + (m.type || 'tipo ?'));
                    cb(null, a);
                    return;
                }
                nx();
            });
        }
        nx();
    }
    function info(o) {
        var ru = remoteStreamUrl(o), lu = buildLocalStream(o);
        return {
            remote: ru,
            local: lu,
            ext: extensionOf(o, ru),
            kind: streamKind(o),
            profiles: profiles(o)
        };
    }
    windowRef.XTAutoVod22 = {
        remote: remoteStreamUrl,
        local: buildLocalStream,
        kind: streamKind,
        profiles: profiles,
        probe: probe,
        resolve: resolve,
        info: info,
        fast: fast
    };
    windowRef.XTAutoVod21 = windowRef.XTAutoVod22;
    remoteTV.autoVod = '0.23';
    xtreamApi.log('BOOT', 'AutoVOD v0.23 \xB7 início otimista imediato \xB7 Range 0-1 somente em fallback');
}(this));
