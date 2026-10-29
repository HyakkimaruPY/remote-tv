/* 6.5.7 standalone module; skip only after complete bundled startup. */
(function(w){
if(w.RemoteTV&&w.RemoteTV.activeCoreBundle==='0.56-beta.6.5.7')return;
/* RemoteTV beta 3. ES5 source; compatibility aliases are intentional. */
(function (windowRef) {
    'use strict';
    var xtreamApi = windowRef.XT10, remoteTV = windowRef.RemoteTV || (windowRef.RemoteTV = {});
    if (!xtreamApi || xtreamApi._authGuard30)
        return;
    xtreamApi._authGuard30 = 1;
    var oc = xtreamApi.cats, oi = xtreamApi.items, ov = xtreamApi.vod, os = xtreamApi.series, busy = 0, q = [], epoch31 = 0, cancel31 = xtreamApi.cancel;
    function flush(e) {
        var a = q.slice(0), i;
        q = [];
        busy = 0;
        for (i = 0; i < a.length; i++)
            try {
                a[i](e);
            } catch (y) {
                xtreamApi.log('AUTH30', 'callback erro \xB7 ' + y);
            }
    }
    function ensure(cb, why) {
        var ticket31 = epoch31, prior = xtreamApi.state && xtreamApi.state.c ? {
                d: xtreamApi.state.c.d,
                u: xtreamApi.state.c.u,
                p: xtreamApi.state.c.p
            } : null, transient;
        if (xtreamApi.state && xtreamApi.state.c && xtreamApi.state.authed !== false && why != 'open') {
            xtreamApi.log('AUTH30', 'credenciais presentes \xB7 ' + (why || 'op'));
            cb(null);
            return;
        }
        if (why == 'open' && prior)
            xtreamApi.log('AUTH30', 'abertura do player \xB7 revalidando CONFIG/DNS');
        q.push(cb);
        if (busy) {
            xtreamApi.log('AUTH30', 'aguardando autenticação em andamento \xB7 ' + (why || 'op'));
            return;
        }
        busy = 1;
        xtreamApi.log('AUTH30', 'iniciando autenticação \xB7 ' + (why || 'op'));
        xtreamApi.auth(function (e, meta) {
            if (ticket31 != epoch31)
                return;
            if (e) {
                transient = /HTTP 200 vazio|Timeout|HTTP 5\d\d|Falha|JSON inválido/i.test(String(e));
                if (prior && why == 'open' && transient && xtreamApi.state.c && prior.d===xtreamApi.state.c.d && prior.u===xtreamApi.state.c.u && prior.p===xtreamApi.state.c.p) {
                    xtreamApi.state.c = prior;
                    xtreamApi.state.authed = true;
                    xtreamApi.log('AUTH30', 'revalidação transitória falhou \xB7 mantendo sessão anterior \xB7 ' + e);
                    flush(null);
                    return;
                }
                xtreamApi.log('AUTH30', 'falhou \xB7 ' + e);
                flush(e);
                return;
            }
            xtreamApi.log('AUTH30', 'OK \xB7 credenciais restauradas/revalidadas');
            flush(null);
        });
    }
    xtreamApi.cancel = function () {
        epoch31++;
        busy = 0;
        q = [];
        cancel31();
    };
    xtreamApi.ensureAuth = ensure;
    xtreamApi.cats = function (t, cb) {
        ensure(function (e) {
            if (e) {
                cb(e);
                return;
            }
            xtreamApi.log('FLOW17', 'cats DISPATCH \xB7 ' + t);
            oc(t, cb);
        }, 'cats ' + t);
    };
    xtreamApi.items = function (t, c, cb) {
        ensure(function (e) {
            if (e) {
                cb(e);
                return;
            }
            xtreamApi.log('FLOW17', 'items DISPATCH \xB7 ' + t + ' \xB7 category_id=' + (c && c.id));
            oi(t, c, cb);
        }, 'items ' + t);
    };
    xtreamApi.vod = function (o, cb) {
        ensure(function (e) {
            if (e) {
                cb(e);
                return;
            }
            ov(o, cb);
        }, 'vod');
    };
    xtreamApi.series = function (o, cb) {
        ensure(function (e) {
            if (e) {
                cb(e);
                return;
            }
            os(o, cb);
        }, 'series');
    };
    remoteTV.authGuard = '0.56-beta.6.5.6';
    xtreamApi.log('BOOT', 'Auth guard v0.30 \xB7 revalida CONFIG/DNS \xB7 preserva sessão válida em falha transitória');
}(this));

}.call(window,window));
