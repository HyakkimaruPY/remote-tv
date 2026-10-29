/* 6.5.7 standalone module; skip only after complete bundled startup. */
(function(w){
if(w.RemoteTV&&w.RemoteTV.activeCoreBundle==='0.56-beta.6.5.7')return;
/* RemoteTV beta 3. ES5 source; compatibility aliases are intentional. */
(function (windowRef) {
    'use strict';
    var remoteTV = windowRef.RemoteTV || (windowRef.RemoteTV = {}), credentialsUrl = 'https://raw.githubusercontent.com/HyakkimaruPY/Lista-M3U.m3u/main/credenciais.temp', bridgePrefix = 'http://127.0.0.1:8765/fetch?u=', logStorageKey = 'rawnetlog.v1';
    var catalogState = {
        c: null,
        cats: {
            c: null,
            m: null,
            s: null
        },
        items: [],
        rawItems: null,
        rawType: '',
        rawCat: null,
        cat: null,
        detail: null,
        pending: null,
        epoch: 0
    };
    var CIDK = 'xtream.catalog.dns.v24';
    function catalogDnsIdentity(c) {
        return String(c && c.d || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    }
    function catalogIdentity(c) {
        var n = catalogDnsIdentity(c), old = '';
        if (!n)
            return;
        try {
            old = String(localStorage.getItem(CIDK) || '');
        } catch (e) {
        }
        if (!old) {
            try {
                localStorage.setItem(CIDK, n);
            } catch (e) {
            }
            log('CATALOG24', 'DNS inicial registrada \xB7 ' + n);
            return;
        }
        if (old == n) {
            log('CATALOG24', 'DNS mantida \xB7 histórico preservado');
            return;
        }
        try {
            localStorage.setItem(CIDK, n);
        } catch (e) {
        }
        log('CATALOG24', 'DNS alterada ' + old + ' -> ' + n + ' \xB7 favoritos/continuar/progresso preservados');
    }
    function formatClock() {
        var x = new Date(), h = x.getHours(), m = x.getMinutes(), s = x.getSeconds();
        return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }
    function mask(u) {
        u = String(u || '');
        u = u.replace(/([?&](?:username|user|password|pass|token|auth|key|secret|sig|signature)=)[^&#]*/ig, '$1***');
        u = u.replace(/\/\/(?:[^\/@:]+):(?:[^\/@]+)@/g, '//***:***@');
        u = u.replace(/\/(live|movie|series)\/[^\/?#]+\/[^\/?#]+\//ig, '/$1/***/***/');
        return u;
    }
    var logBuffer = null, logFlushTimer = 0, logDirty = 0;
    function logLoad() {
        var x = '';
        if (logBuffer)
            return;
        logBuffer = [];
        try {
            x = localStorage.getItem(logStorageKey) || '';
        } catch (e) {
        }
        if (x)
            logBuffer = x.split('\n').slice(-180);
    }
    function logFlush() {
        logFlushTimer = 0;
        if (!logDirty)
            return;
        logDirty = 0;
        logLoad();
        try {
            localStorage.setItem(logStorageKey, logBuffer.join('\n'));
        } catch (e) {
        }
    }
    function log(a, b) {
        logLoad();
        logBuffer.push('[' + formatClock() + '] ' + a + ' \xB7 ' + String(b || ''));
        if (logBuffer.length > 180)
            logBuffer = logBuffer.slice(-180);
        logDirty = 1;
        if (!logFlushTimer)
            logFlushTimer = setTimeout(logFlush, 280);
        try {
            if (windowRef.XT10 && windowRef.XT10.onlog)
                windowRef.XT10.onlog(logBuffer);
        } catch (e) {
        }
    }
    function decodeQueryValue(x) {
        try {
            return decodeURIComponent(String(x || '').replace(/\+/g, '%20'));
        } catch (e) {
            return String(x || '');
        }
    }
    function queryParameter(u, n) {
        var i, m;
        for (i = 0; i < n.length; i++) {
            m = new RegExp('[?&]' + n[i] + '=([^&#]*)', 'i').exec(u);
            if (m && m[1])
                return decodeQueryValue(m[1]);
        }
        return '';
    }
    function parseCredentials(u, t) {
        u = String(u || '').replace(/^\s+|\s+$/g, '');
        t = String(t || '');
        var m = /^https?:\/\/([^\/?#]+)/i.exec(u), h, user, pass, path, ui, dm, um, pm;
        if (m) {
            h = m[1];
            ui = /^([^:@]+):([^@]+)@(.+)$/.exec(h);
            if (ui) {
                user = decodeQueryValue(ui[1]);
                pass = decodeQueryValue(ui[2]);
                h = ui[3];
            }
            user = user || queryParameter(u, [
                'username',
                'user'
            ]);
            pass = pass || queryParameter(u, [
                'password',
                'pass'
            ]);
            if (!user || !pass) {
                path = /\/(?:live|movie|series)\/([^\/?#]+)\/([^\/?#]+)(?:\/|$)/i.exec(u);
                if (path) {
                    user = user || decodeQueryValue(path[1]);
                    pass = pass || decodeQueryValue(path[2]);
                }
            }
        }
        dm = /(?:^|[\r\n])\s*(?:DNS|HOST|SERVER)\s*=\s*["']?([^"'\r\n]+)["']?/i.exec(t);
        um = /(?:^|[\r\n])\s*(?:USERNAME|USER)\s*=\s*["']?([^"'\r\n]+)["']?/i.exec(t);
        pm = /(?:^|[\r\n])\s*(?:PASSWORD|PASS)\s*=\s*["']?([^"'\r\n]+)["']?/i.exec(t);
        if (!h && dm)
            h = String(dm[1] || '').replace(/^https?:\/\//i, '').replace(/\/.*$/, '').replace(/^\s+|\s+$/g, '');
        user = user || um && String(um[1] || '').replace(/^\s+|\s+$/g, '');
        pass = pass || pm && String(pm[1] || '').replace(/^\s+|\s+$/g, '');
        var protocol = /^https:/i.test(u) || !m && dm && /^https:/i.test(dm[1]) ? 'https://' : 'http://';
        var base = /^https?:\/\/[^/?#]+(\/[^?#]*?)\/(?:get|player_api|xmltv)\.php(?:[?#]|$)/i.exec(u);
        return h && user && pass ? {
            d: protocol + h + (base ? base[1] : ''),
            u: user,
            p: pass
        } : null;
    }
    function cancel() {
        catalogState.epoch++;
        if (catalogState.pending)
            try {
                catalogState.pending.abort();
            } catch (e) {
            }
        catalogState.pending = null;
    }
    function bridge(u, cb, label, timeout, direct) {
        var ep = catalogState.epoch, tries = 0;
        label = (label || 'NET') + (direct ? ' direto' : ' bridge');
        function go() {
            if (ep !== catalogState.epoch)
                return;
            var x = new XMLHttpRequest(), closed = 0, t, st = new Date().getTime(), target = tries ? u + (u.indexOf('?') >= 0 ? '&' : '?') + '_rt30=' + new Date().getTime() + '_' + tries : u, src = direct ? target : bridgePrefix + encodeURIComponent(target);
            catalogState.pending = x;
            log(label, (tries ? 'RETRY ' + tries + ' ' : 'GET ') + mask(target));
            function fin(e, v) {
                var status = +(x.status || 0), body = String(v || ''), empty = status == 200 && !body.replace(/^\s+|\s+$/g, '').length;
                if (closed)
                    return;
                closed = 1;
                clearTimeout(t);
                if (catalogState.pending === x)
                    catalogState.pending = null;
                log(label, (e || 'HTTP 200') + ' \xB7 ' + body.length + ' bytes \xB7 ' + (new Date().getTime() - st) + ' ms');
                if (ep !== catalogState.epoch)
                    return;
                if (empty && tries < (direct ? 0 : 2)) {
                    tries++;
                    log(label, 'HTTP 200 \xB7 0 bytes \xB7 retry ' + tries + '/2 em ' + (tries == 1 ? '250' : '650') + ' ms');
                    setTimeout(go, tries == 1 ? 250 : 650);
                    return;
                }
                function deliver31() {
                    if (ep !== catalogState.epoch)
                        return;
                    var delay = (remoteTV.inputUntil31 || 0) - new Date().getTime();
                    if (delay > 0) {
                        setTimeout(deliver31, delay);
                        return;
                    }
                    cb(empty ? 'HTTP 200 vazio' : e, body, {
                        status: status,
                        url: target,
                        empty: empty,
                        tries: tries,
                        route: direct ? 'direct' : 'bridge'
                    });
                }
                setTimeout(deliver31, 0);
            }
            try {
                x.onreadystatechange = function () {
                    if (x.readyState == 4)
                        fin(x.status == 200 ? null : 'HTTP ' + (x.status || 0), x.responseText);
                };
                x.onerror = function () { fin('Falha de rede',''); };
                x.open('GET', src, true);
                x.send(null);
                t = setTimeout(function () {
                    try {
                        x.abort();
                    } catch (e) {
                    }
                    fin('Timeout', '');
                }, timeout || 12000);
            } catch (e) {
                fin('Falha', '');
            }
        }
        go();
    }
    function api(a, x) {
        var c = catalogState.c;
        return c.d + '/player_api.php?username=' + encodeURIComponent(c.u) + '&password=' + encodeURIComponent(c.p) + (a ? '&action=' + encodeURIComponent(a) : '') + (x || '');
    }
    function kind(t) {
        return !String(t || '').replace(/\s/g, '') ? 'vazio' : /^\s*[\[{]/.test(t) ? 'JSON malformado ou truncado' : 'não-JSON';
    }
    function snip(t) {
        return mask(String(t || '')).replace(/[\r\n\t]/g, ' ').slice(0, 140);
    }
    function requestJson(a, x, cb, label, timeout) {
        var u=api(a,x), direct=false, ep=catalogState.epoch;
        label=label || a || 'auth';
        function fallback(error) {
            if(ep!==catalogState.epoch)return;
            if(!direct) { direct=true; log('API656',label+' · bridge indisponível/inválido; tentativa direta no mesmo endpoint'); go(); }
            else cb(error,null,{route:'direct'});
        }
        function go() {
            if(ep!==catalogState.epoch)return;
            bridge(u,function(e,t,m){
                var j,body=String(t||'').replace(/^\uFEFF/,'').replace(/^\s+|\s+$/g,'');
                if(e) {
                    if(m && (m.status===401 || m.status===403)) { cb(e,null,m);return; }
                    fallback(e);return;
                }
                try { j=JSON.parse(body); } catch(z) { j=undefined; }
                if(j===undefined) { log('JSON',label+' · resposta não-JSON, '+body.length+' bytes · '+(m&&m.route||'bridge'));fallback('JSON inválido em '+label);return; }
                // A transport diagnostic in a JSON envelope is not an Xtream account/catalog.
                if(j && !j.user_info && !Object.prototype.hasOwnProperty.call(j,'length') && (j.error || j.message) && /remote|trace|upstream|fetch|proxy/i.test(String(j.error||j.message))) {
                    log('API656',label+' · diagnóstico do transporte recebido em vez da API');fallback('Falha do transporte em '+label);return;
                }
                cb(null,j,m);
            },'API '+label,timeout||12000,direct);
        }
        go();
    }
    function categoriesAction(t) {
        return t == 'c' ? 'get_live_categories' : t == 'm' ? 'get_vod_categories' : 'get_series_categories';
    }
    function itemsAction(t) {
        return t == 'c' ? 'get_live_streams' : t == 'm' ? 'get_vod_streams' : 'get_series';
    }
    function firstDefined(x) {
        return Object.prototype.toString.call(x) == '[object Array]' ? x[0] || '' : x || '';
    }
    function normalizeItem(t, o, c) {
        if (t == 'c')
            return {
                t: t,
                id: o.stream_id,
                n: o.name || 'Canal',
                p: o.stream_icon || '',
                g: c.n,
                ext: o.container_extension || 'ts'
            };
        if (t == 'm')
            return {
                t: t,
                id: o.stream_id,
                n: o.name || 'Filme',
                p: o.stream_icon || '',
                bg: firstDefined(o.backdrop_path),
                g: c.n,
                ext: o.container_extension || '',
                src: o.direct_source || '',
                y: o.year || '',
                r: o.rating || '',
                ds: o.plot || '',
                tmdb: o.tmdb_id || o.tmdb || ''
            };
        return {
            t: t,
            id: o.series_id,
            n: o.name || 'Série',
            p: o.cover || o.stream_icon || '',
            bg: firstDefined(o.backdrop_path),
            g: c.n,
            y: o.releaseDate || o.year || '',
            r: o.rating || '',
            ds: o.plot || '',
            tmdb: o.tmdb_id || o.tmdb || ''
        };
    }
    function auth(cb) {
        cancel();
        var prior656 = catalogState.c;
        bridge(credentialsUrl + '?_rtv_config=' + new Date().getTime(), function (e, t) {
            var m, u, c;
            if (e) {
                cb(e);
                return;
            }
            t=String(t||'').replace(/^\uFEFF/,'').replace(/&amp;/gi,'&');
            m = /(?:^|[\r\n])\s*M3U\s*=\s*["']?([^"'\r\n]+)["']?/i.exec(t);
            u = m ? m[1].replace(/^\s+|\s+$/g, '') : '';
            c = parseCredentials(u, t);
            if (!c) {
                log('AUTH', 'DNS/usuário/senha ausentes; get.php bloqueado');
                cb('Credenciais Xtream não encontradas');
                return;
            }
            catalogState.c = c;
            catalogState.authed = false;
            log('AUTH', 'DNS ' + c.d + ' \xB7 get.php NÃO será requisitado');
            requestJson('', '', function (er, j) {
                var ui = j && j.user_info || {}, sv = j && j.server_info || {}, now = +(sv.timestamp_now || 0), exp = +(ui.exp_date || 0), ok, p;
                if (!now && sv.time_now) {
                    p = Date.parse(String(sv.time_now).replace(/-/g, '/'));
                    if (!isNaN(p))
                        now = Math.floor(p / 1000);
                }
                if (!now)
                    now = Math.floor(new Date().getTime() / 1000);
                if (er) {
                    cb(er);
                    return;
                }
                ok = (String(ui.auth) === '1' || ui.auth === true) && String(ui.status || 'Active').replace(/^\s+|\s+$/g,'').toLowerCase() === 'active' && (!exp || exp > now);
                log('AUTH', 'auth ' + String(ui.auth || 0) + ' \xB7 status ' + String(ui.status || '\u2014') + ' \xB7 exp ' + String(exp || 0) + ' \xB7 servidor ' + String(now));
                catalogState.authed = !!ok;
                if(ok) {
                    if(!prior656 || prior656.d!==c.d || prior656.u!==c.u || prior656.p!==c.p) { catalogState.cats={c:null,m:null,s:null};catalogState.items=[];catalogState.rawItems=null;catalogState.rawCat=null;catalogState.rawType='';catalogState.cat=null; }
                    catalogIdentity(c);
                }
                cb(ok ? null : 'Conta inativa ou expirada', {
                    user: ui,
                    server: sv
                });
            }, 'auth', 10000);
        }, 'CONFIG', 7000);
    }
    function cats(t, cb) {
        cancel();
        catalogState.items = [];
        catalogState.cat = null;
        catalogState.detail = null;
        if (catalogState.cats[t]) {
            cb(null, catalogState.cats[t]);
            return;
        }
        requestJson(categoriesAction(t), '', function (e, j) {
            var a = [], i, o;
            if (e) {
                cb(e);
                return;
            }
            if (Object.prototype.toString.call(j) !== '[object Array]') {
                cb('Categorias em formato inesperado');
                return;
            }
            for (i = 0; i < j.length; i++) {
                o = j[i] || {};
                a.push({
                    id: String(o.category_id == null ? '' : o.category_id),
                    n: o.category_name || o.name || 'Sem nome'
                });
            }
            catalogState.cats[t] = a;
            log('MEM', (t == 'c' ? 'Ao vivo' : t == 'm' ? 'Filmes' : 'Séries') + ' \xB7 ' + a.length + ' categorias leves em memória');
            cb(null, a);
        }, categoriesAction(t));
    }
    function ensureRange(st, n) {
        var i, end;
        if (!catalogState.rawItems || !catalogState.items)
            return catalogState.items || [];
        end = Math.min(catalogState.rawItems.length, (st || 0) + (n || 10));
        for (i = st || 0; i < end; i++)
            if (!catalogState.items[i])
                catalogState.items[i] = normalizeItem(catalogState.rawType, catalogState.rawItems[i] || {}, catalogState.rawCat);
        return catalogState.items;
    }
    function items(t, c, cb) {
        cancel();
        catalogState.items = [];
        catalogState.rawItems = null;
        catalogState.rawType = '';
        catalogState.rawCat = null;
        catalogState.cat = c;
        catalogState.detail = null;
        log('MEM', 'catálogo anterior liberado \xB7 carregando somente category_id=' + c.id);
        requestJson(itemsAction(t), '&category_id=' + encodeURIComponent(c.id), function (e, j) {
            var a = [], i;
            if (e) {
                cb(e);
                return;
            }
            if (Object.prototype.toString.call(j) !== '[object Array]') {
                cb('Catálogo em formato inesperado');
                return;
            }
            if (t == 'm' || t == 's') {
                a = new Array(j.length);
                catalogState.rawItems = j;
                catalogState.rawType = t;
                catalogState.rawCat = c;
                catalogState.items = a;
                ensureRange(0, 10);
                log('MEM', 'category_id=' + c.id + ' \xB7 lazy ' + j.length + ' itens \xB7 10 visíveis normalizados');
                cb(null, a);
                return;
            }
            for (i = 0; i < j.length; i++)
                a.push(normalizeItem(t, j[i] || {}, c));
            catalogState.items = a;
            log('MEM', 'category_id=' + c.id + ' \xB7 ' + a.length + ' itens atuais');
            cb(null, a);
        }, itemsAction(t) + ' category_id=' + c.id, 15000);
    }
    function vod(o, cb) {
        if (o && o._vodLoaded) {
            log('META21', 'vod cache hit id=' + o.id + ' \xB7 container=' + (o.ext || '\u2014'));
            cb(null, o);
            return;
        }
        cancel();
        requestJson('get_vod_info', '&vod_id=' + encodeURIComponent(o.id), function (e, j) {
            var i, m;
            if (!e && j) {
                i = j.info || {};
                m = j.movie_data || {};
                o.ds = i.plot || i.description || o.ds || '';
                o.p = i.movie_image || i.cover_big || o.p;
                o.bg = firstDefined(i.backdrop_path) || firstDefined(m.backdrop_path) || o.bg || '';
                o.y = i.releasedate || i.year || o.y;
                o.r = i.rating || o.r;
                o.ext = m.container_extension || i.container_extension || o.ext || '';
                o.src = m.direct_source || i.direct_source || o.src || '';
                o.tmdb = i.tmdb_id || m.tmdb_id || o.tmdb || '';
                o._vodLoaded = 1;
            }
            log('META21', 'vod id=' + o.id + ' \xB7 container=' + (o.ext || '\u2014') + ' \xB7 direct=' + (o.src ? 'sim' : 'não') + ' \xB7 backdrop=' + (o.bg ? 'sim' : 'não') + ' \xB7 tmdb=' + (o.tmdb ? 'sim' : 'não'));
            cb(e, o);
        }, 'get_vod_info vod_id=' + o.id, 12000);
    }
    function series(o, cb) {
        cancel();
        requestJson('get_series_info', '&series_id=' + encodeURIComponent(o.id), function (e, j) {
            var ep = j && j.episodes || {}, a = [], k, i, x, inf, si = j && j.info || {};
            if (e) {
                cb(e);
                return;
            }
            o.ds = si.plot || si.description || o.ds || '';
            o.p = si.cover || si.movie_image || o.p;
            o.bg = firstDefined(si.backdrop_path) || o.bg || '';
            o.y = si.releaseDate || si.release_date || si.year || o.y;
            o.r = si.rating || o.r;
            o.tmdb = si.tmdb_id || o.tmdb || '';
            if (Object.prototype.toString.call(ep) === '[object Array]')
                ep = { '1': ep };
            for (k in ep)
                if (ep.hasOwnProperty(k))
                    for (i = 0; i < (ep[k] || []).length; i++) {
                        x = ep[k][i] || {};
                        inf = x.info || {};
                        a.push({
                            t: 's',
                            id: x.id,
                            n: x.title || 'Episódio ' + (x.episode_num || i + 1),
                            p: inf.movie_image || o.p,
                            bg: firstDefined(inf.backdrop_path) || o.bg || '',
                            ext: x.container_extension || '',
                            src: x.direct_source || inf.direct_source || '',
                            sn: +(x.season || k || 1),
                            ep: +(x.episode_num || i + 1),
                            ds: inf.plot || ''
                        });
                    }
            o.eps = a;
            catalogState.detail = o;
            log('META21', 'series id=' + o.id + ' \xB7 backdrop=' + (o.bg ? 'sim' : 'não') + ' \xB7 tmdb=' + (o.tmdb ? 'sim' : 'não'));
            log('MEM', 'série atual \xB7 ' + a.length + ' episódios em memória');
            cb(null, o);
        }, 'get_series_info series_id=' + o.id, 15000);
    }
    function stream(o) {
        var c = catalogState.c, k = o.t == 'c' ? 'live' : o.t == 'm' ? 'movie' : 'series';
        if (o && o.t != 'c' && /^https?:\/\//i.test(String(o.src || '')))
            return o.src;
        return c.d + '/' + k + '/' + encodeURIComponent(c.u) + '/' + encodeURIComponent(c.p) + '/' + o.id + '.' + String(o.ext || (o.t == 'c' ? 'ts' : '')).replace(/^\./, '');
    }
    function releaseItems() {
        cancel();
        catalogState.items = [];
        catalogState.rawItems = null;
        catalogState.rawType = '';
        catalogState.rawCat = null;
        catalogState.cat = null;
        catalogState.detail = null;
        log('MEM', 'itens/URLs da categoria liberados');
    }
    function releaseEpisodes(o) {
        if (o && o.eps) {
            o.eps = [];
            delete o.eps;
            log('MEM', 'episódios liberados');
        }
    }
    windowRef.XT10 = {
        ensureRange: ensureRange,
        state: catalogState,
        auth: auth,
        cats: cats,
        items: items,
        vod: vod,
        series: series,
        stream: stream,
        releaseItems: releaseItems,
        releaseEpisodes: releaseEpisodes,
        cancel: cancel,
        log: log,
        mask: mask,
        cred: parseCredentials,
        onlog: null
    };
    remoteTV.catalogPolicy = 'lazy-one-category';
    remoteTV.xtreamCore = '0.56-beta.6.5.6';
    log('BOOT', 'Xtream core v0.31 \xB7 retry de HTTP 200 vazio \xB7 catálogo lazy por página');
}(this));

}.call(this,this));
