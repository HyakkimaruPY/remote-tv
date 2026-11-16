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
    var CIDK = 'xtream.catalog.dns.v24', RESETK = [
            'xtream.favorites.v14',
            'xtream.progress.v14',
            'xtream.continue.v14'
        ];
    function catalogDnsIdentity(c) {
        return String(c && c.d || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    }
    function catalogIdentity(c) {
        var n = catalogDnsIdentity(c), old = '', i;
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
        for (i = 0; i < RESETK.length; i++)
            try {
                localStorage.removeItem(RESETK[i]);
            } catch (e) {
            }
        try {
            localStorage.setItem(CIDK, n);
        } catch (e) {
        }
        log('CATALOG24', 'DNS alterada ' + old + ' -> ' + n + ' \xB7 favoritos/continuar/progresso limpos');
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
        var m = /^(https?):\/\/([^\/?#]+)/i.exec(u), scheme = 'http', h, user, pass, path, ui, dm, um, pm, base = '';
        if (m) {
            scheme = m[1].toLowerCase();
            h = m[2];
            var scriptPath = /^(?:https?):\/\/[^\/?#]+(\/[^?#]*?)\/(?:get|player_api|xmltv)\.php(?:[?#]|$)/i.exec(u);
            var mediaPath = /^(?:https?):\/\/[^\/?#]+(\/[^?#]*?)\/(?:live|movie|series)\/[^\/?#]+\/[^\/?#]+(?:\/|$)/i.exec(u);
            base = scriptPath ? scriptPath[1] : (mediaPath ? mediaPath[1] : '');
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
        if (!h && dm) {
            var dms = String(dm[1] || '').replace(/^\s+|\s+$/g, '');
            var dnsParts = /^(https?):\/\/([^\/?#]+)(\/[^?#]*)?/i.exec(dms);
            var bareParts = /^([^\/?#]+)(\/[^?#]*)?/.exec(dms);
            if (dnsParts) {
                scheme = dnsParts[1].toLowerCase();
                h = dnsParts[2];
                base = dnsParts[3] || '';
            } else if (bareParts) {
                h = bareParts[1];
                base = bareParts[2] || '';
            }
        }
        user = user || um && String(um[1] || '').replace(/^\s+|\s+$/g, '');
        pass = pass || pm && String(pm[1] || '').replace(/^\s+|\s+$/g, '');
        return h && user && pass ? {
            d: scheme + '://' + h + String(base || '').replace(/\/+$/, ''),
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
        if (/\/get\.php(?:[?#]|$)/i.test(String(u || ''))) {
            log('GUARD', 'bloqueado download de get.php');
            cb('Download M3U proibido', '', {status:0,route:'blocked'});
            return;
        }
        var epoch = catalogState.epoch, retryEmpty = 0;
        label = label || 'NET';
        function go() {
            if (epoch !== catalogState.epoch) return;
            var target = retryEmpty ? u + (u.indexOf('?') >= 0 ? '&' : '?') +
                '_rt30=' + new Date().getTime() + '_' + retryEmpty : u,
                src = direct ? target : bridgePrefix + encodeURIComponent(target);
            var xhr, done = 0, timer = 0, started = new Date().getTime();
            try { xhr = new XMLHttpRequest(); }
            catch (e) {
                log(label, 'navegador não criou XMLHttpRequest');
                cb('XHR indisponível no navegador', '', {status:0,route:direct?'direct':'bridge'});
                return;
            }
            catalogState.pending = xhr;
            log(label, (direct ? 'API direta GET ' : 'API bridge GET ') + mask(target));
            function finish(error, value) {
                if (done) return;
                done = 1;
                clearTimeout(timer);
                if (catalogState.pending === xhr) catalogState.pending = null;
                if (epoch !== catalogState.epoch) return;
                var status = +(xhr.status || 0), body = String(value || ''),
                    empty = status === 200 && !body.replace(/^\s+|\s+$/g, '');
                log(label, (direct ? 'direto' : 'bridge') + ' · ' + (error || 'HTTP 200') +
                    ' · ' + body.length + ' bytes · ' + (new Date().getTime() - started) + ' ms');
                if (empty && !direct && retryEmpty++ < 2) {
                    log(label, 'resposta vazia · retry API bridge ' + retryEmpty + '/2');
                    setTimeout(go, retryEmpty === 1 ? 250 : 650);
                    return;
                }
                function deliver() {
                    if (epoch !== catalogState.epoch) return;
                    var pause = (remoteTV.inputUntil31 || 0) - new Date().getTime();
                    if (pause > 0) { setTimeout(deliver, pause); return; }
                    cb(empty ? 'HTTP 200 vazio' : error, body, {
                        status: status, route: direct ? 'direct' : 'bridge', empty: !!empty
                    });
                }
                setTimeout(deliver, 0);
            }
            try {
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        var success = xhr.status === 200 ||
                            (direct && !xhr.status && !!String(xhr.responseText || '').replace(/^\s+|\s+$/g, ''));
                        finish(success ? null : 'HTTP ' + (xhr.status || 0), xhr.responseText);
                    }
                };
                xhr.onerror = function() { finish('Falha de rede', ''); };
                xhr.open('GET', src, true);
                xhr.send(null);
                timer = setTimeout(function() {
                    try { xhr.abort(); } catch(e) {}
                    finish('Timeout', '');
                }, timeout || 12000);
            } catch(e) { finish('Falha de transporte', ''); }
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
        var endpoint = api(a, x), epoch = catalogState.epoch, direct = false, done = false,
            httpRetry = 0, jsonRetry = 0;
        label = label || a || 'auth';
        function end(error, json, meta) {
            if (done || epoch !== catalogState.epoch) return;
            done = true; cb(error, json, meta);
        }
        function fallback(reason) {
            if (direct || done || epoch !== catalogState.epoch) return false;
            direct = true;
            log('API659', label + ' · bridge falhou (' + reason + '); retentando SOMENTE player_api.php diretamente');
            go(); return true;
        }
        function go() {
            if (epoch !== catalogState.epoch || done) return;
            var url = endpoint + (jsonRetry ? '&_rt10=' + new Date().getTime() : '');
            bridge(url, function(error, text, meta) {
                var status = meta && meta.status || 0,
                    body = String(text || '').replace(/^\uFEFF/, '').replace(/^\s+|\s+$/g, ''), json;
                if (error) {
                    if (status >= 400 && status < 500 && status !== 408) {
                        if (!direct && status === 403 && fallback('HTTP 403 pela ponte local; confirmar acesso direto')) return;
                        end('API Xtream HTTP ' + status +
                            (status === 401 || status === 403 ? ' · acesso recusado pelo servidor' : ''), null, meta);
                        return;
                    }
                    if (!direct && (status === 502 || status === 503 || status === 504 || /Timeout/i.test(error)) &&
                        httpRetry++ < 1) {
                        log('API6512', label + ' · retry bridge 1/1 após ' + error);
                        setTimeout(go, 650);
                        return;
                    }
                    if (!direct && (!status || status === 408 || status >= 500 || /Timeout|Falha|vazio/i.test(error)) &&
                        fallback(error)) return;
                    end((direct ? 'Bridge e conexão direta falharam · ' : '') + error, null, meta);
                    return;
                }
                try { json = JSON.parse(body); } catch(e) { json = undefined; }
                if (json === undefined) {
                    if (!direct && jsonRetry++ < 1) {
                        log('API6512', label + ' · JSON inválido na ponte · retry com cache-buster');
                        setTimeout(go, 250);
                        return;
                    }
                    if (!direct && fallback('resposta não-JSON do transporte')) return;
                    end('JSON inválido em ' + label + ' · ' + kind(body) + ' · ' + body.length + ' bytes', null, meta);
                    return;
                }
                if (json && !json.user_info && !Object.prototype.hasOwnProperty.call(json, 'length') &&
                    (json.error || json.message) && /remote|trace|upstream|fetch|proxy|gateway/i.test(String(json.error || json.message))) {
                    if (fallback('diagnóstico do proxy')) return;
                    end('API não retornou dados Xtream', null, meta); return;
                }
                end(null, json, meta);
            }, 'API ' + label, timeout || 12000, direct);
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
                src: o.direct_source || '',
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
    function extractConfiguration(t) {
        t = String(t || '').replace(/^\uFEFF/, '').replace(/&amp;/gi, '&');
        var m = /(?:^|[\r\n])\s*M3U\s*=\s*(?:"([^"\r\n]+)"|'([^'\r\n]+)'|([^\r\n]+))/i.exec(t),
            u = (m && (m[1] || m[2] || m[3]) || '').replace(/^\s+|\s+$/g, '');
        if (!u && /^\s*https?:\/\//i.test(t)) u = t.replace(/^\s+|\s+$/g, '');
        return {url: u, credentials: parseCredentials(u, t)};
    }
    function auth(cb) {
        var previous = catalogState.authed && catalogState.c ? {d:catalogState.c.d,u:catalogState.c.u,p:catalogState.c.p} : null;
        cancel();
        catalogState.authed = false;
        catalogState.allowedFormats = [];
        bridge(credentialsUrl + '?_rtv_config=' + new Date().getTime(), function (e, t) {
            var m, u, c;
            if (e) {
                cb(e);
                return;
            }
            try {
                var config = extractConfiguration(t);
                c = config.credentials;
                if (!c) {
                    log('CONFIG', 'falha ao extrair DNS/usuário/senha · ' + String(t.length) + ' bytes; não será baixado get.php');
                    cb('Link M3U inválido: DNS, usuário ou senha ausente');
                    return;
                }
                catalogState.c = c;
                catalogState.sourceOutput = queryParameter(config.url, ['output']);
                log('CONFIG', 'extração OK · DNS ' + c.d +
                    ' · usuário presente · senha presente · saída ' + (catalogState.sourceOutput || 'automática'));
                log('AUTH', 'iniciando GET player_api.php no servidor ' + c.d);
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
                ok = String(ui.auth) === '1' && String(ui.status || 'Active').toLowerCase() === 'active' && (!exp || exp > now);
                log('AUTH', 'auth ' + String(ui.auth || 0) + ' \xB7 status ' + String(ui.status || '\u2014') + ' \xB7 exp ' + String(exp || 0) + ' \xB7 servidor ' + String(now));
                if (ok) {
                    if (!previous || previous.d !== c.d || previous.u !== c.u || previous.p !== c.p) {
                        catalogState.cats = {c:null,m:null,s:null};
                        catalogState.items = [];
                        catalogState.rawItems = null;
                        catalogState.rawType = '';
                        catalogState.rawCat = null;
                        catalogState.cat = null;
                        catalogState.detail = null;
                        log('MEM', 'conta Xtream alterada · cache de catálogo invalidado');
                    }
                    catalogIdentity(c);
                }
                catalogState.authed = !!ok;
                catalogState.allowedFormats = Object.prototype.toString.call(ui.allowed_output_formats) === '[object Array]' ? ui.allowed_output_formats : [];
                cb(ok ? null : 'Conta inativa ou expirada', {
                    user: ui,
                    server: sv
                });
                }, 'auth', 10000);
            } catch (error) {
                log('AUTH', 'falha de preparação ' + (error && error.name || 'Error') +
                    ' · ' + String(error && error.message || 'erro desconhecido').slice(0, 100).replace(/https?:\/\/\S+/g,'[URL]'));
                cb('Falha ao preparar autenticação Xtream');
            }
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
    remoteTV.xtreamCore = '0.56-beta.6.5.12';
    log('BOOT', 'Xtream core v0.31 \xB7 retry de HTTP 200 vazio \xB7 catálogo lazy por página');
}(this));
