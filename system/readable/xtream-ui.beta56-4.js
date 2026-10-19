/* RemoteTV beta 3. ES5 source; compatibility aliases are intentional. */
(function (windowRef, documentRef) {
    'use strict';
    var __r27 = documentRef.getElementById('r14'), __s27 = documentRef.getElementById('r27css');
    if (__r27 && __r27.parentNode)
        __r27.parentNode.removeChild(__r27);
    if (__s27 && __s27.parentNode)
        __s27.parentNode.removeChild(__s27);
    var xtreamApi = windowRef.XT10, vodPlayer = windowRef.XTVod29 || windowRef.XTVod27 || windowRef.XTVod25 || windowRef.XTVod24 || windowRef.XTVod23 || windowRef.XTVod22 || windowRef.XTVod21 || windowRef.XTVod20 || windowRef.XTVod14, M = windowRef.XTMeta24 || windowRef.XTMeta19, remoteTV = windowRef.RemoteTV || (windowRef.RemoteTV = {}), BR = 'http://127.0.0.1:8765/fetch?u=', FK = 'xtream.favorites.v14';
    var __old = documentRef.getElementById('r14'), __css = documentRef.getElementById('r14css');
    if (__old && __old.parentNode)
        __old.parentNode.removeChild(__old);
    if (__css && __css.parentNode)
        __css.parentNode.removeChild(__css);
    var viewState = {
        on: 0,
        t: 'c',
        cats: [],
        cat: null,
        items: [],
        detail: null,
        view: '',
        lastView: '',
        cp: 0,
        page: 0,
        preview: null,
        previewIndex: -1,
        liveTry: 0,
        liveToken: 0,
        full: 0,
        lm: 0,
        epsPage: 0,
        collapsed: 0,
        catTimer: 0,
        loading: 0,
        contType: 'm',
        favType: 'm',
        req: 0,
        libReq: 0,
        painting: 0,
        fcat: 0,
        enterAfter: 0,
        season: 0,
        detailReq: 0,
        prompt: 0,
        promptFocus: null,
        promptYes: null,
        promptNo: null,
        specialReq34: 0,
        liveFocus35: 0,
        previewAt44: 0,
        fullExitAt44: 0,
        fullCtl49: 0,
        fullCtlTimer49: 0
    };
    if (!xtreamApi)
        return;
    function element(i) {
        return documentRef.getElementById(i);
    }
    function escapeHtml(x) {
        return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                '\'': '&#39;'
            }[c];
        });
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
    function contentTypeName(t) {
        return t == 'c' ? 'Ao vivo' : t == 'm' ? 'Filmes' : 'Séries';
    }
    function asset(url, role) {
        url = String(url || '');
        var backdrop = role === 'backdrop', width = backdrop ? 780 : 185;
        if (!/[?&](?:sig|signature|x-amz-signature|hdnea|hdnts)=/i.test(url)) {
            if (/^https?:\/\/image\.tmdb\.org\/t\/p\//i.test(url) && !/\.svg(?:[?#]|$)/i.test(url)) {
                url = url.replace(/(\/t\/p\/)(?:original|w[0-9]+|h[0-9]+)(\/)/i, '$1w' + width + '$2');
            } else if (/\/items\/[^/?]+\/images\/(?:primary|backdrop)(?:[/?]|$)/i.test(url)) {
                var hashAt = url.indexOf('#'), fragment = hashAt < 0 ? '' : url.slice(hashAt);
                if (hashAt >= 0)
                    url = url.slice(0, hashAt);
                url = url.replace(/([?&])(?:maxWidth|maxHeight|quality)=[^&#]*/ig, '$1').replace(/\?&+/, '?').replace(/&&+/g, '&').replace(/[?&]$/, '');
                url += (url.indexOf('?') < 0 ? '?' : '&') + 'maxWidth=' + (backdrop ? 960 : 240) + '&quality=70' + fragment;
            }
        }
        return /^https:/i.test(url) ? BR + encodeURIComponent(url) : url;
    }
    function loadj(k, def) {
        try {
            var x = JSON.parse(localStorage.getItem(k) || '');
            return x || def;
        } catch (e) {
            return def;
        }
    }
    function savej(k, v) {
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
    function favs() {
        var f = loadj(FK, {
            c: [],
            m: [],
            s: []
        });
        if (!f.c)
            f.c = [];
        if (!f.m)
            f.m = [];
        if (!f.s)
            f.s = [];
        return f;
    }
    function isFav(t, o) {
        var a = favs()[t] || [], i;
        for (i = 0; i < a.length; i++)
            if (String(a[i].id) == String(o.id))
                return true;
        return false;
    }
    function toggleFav(t, o) {
        var f = favs(), a = f[t] || [], n = [], i, had = 0;
        for (i = 0; i < a.length; i++) {
            if (String(a[i].id) == String(o.id))
                had = 1;
            else
                n.push(a[i]);
        }
        if (!had)
            n.unshift(lite(o));
        f[t] = n;
        savej(FK, f);
        try {
            xtreamApi.log('FAV16', (had ? 'removido ' : 'adicionado ') + t + ' id=' + String(o.id));
        } catch (e) {
        }
        return !had;
    }
    function hideBase() {
        var a = [
                'menu',
                'new',
                'tvlist',
                'player'
            ], i, z;
        for (i = 0; i < a.length; i++) {
            z = element(a[i]);
            if (z)
                z.className = 'h';
        }
    }
    function showBase() {
        var a = [
                'new',
                'tvlist',
                'player'
            ], i, z;
        for (i = 0; i < a.length; i++) {
            z = element(a[i]);
            if (z)
                z.className = 'h';
        }
        z = element('menu');
        if (z)
            z.className = '';
        z = element('rawLaunch') || element('tv');
        if (z)
            z.focus();
    }
    function clearImgs(b) {
        var im, i;
        if (!b)
            return;
        im = b.getElementsByTagName ? b.getElementsByTagName('img') : [];
        for (i = 0; i < im.length; i++)
            try {
                im[i].removeAttribute('src');
            } catch (e) {
            }
    }
    function css() {
        if (element('r14css'))
            return;
        var s = documentRef.createElement('style');
        s.id = 'r14css';
        s.textContent = '#r14{position:fixed;z-index:260;left:0;top:0;width:1280px;height:720px;background:transparent;color:#eef2f4;font:20px Arial;overflow:hidden}' + '#r14.h{display:none}' + '#r14h{height:84px;padding:15px 22px;background:-webkit-linear-gradient(top,#171c20,#0b0f12);border-bottom:1px solid #6f777d;box-shadow:inset 0 1px 0 rgba(255,255,255,.10);box-sizing:border-box;white-space:nowrap}' + '#r14h b{display:inline-block;font-size:28px;margin-right:16px;vertical-align:middle}' + '.gb14,#r14h button{display:inline-block;background:-webkit-linear-gradient(top,#262d32,#111518);color:#eef2f4;border:1px solid #91989d;border-radius:11px;padding:10px 14px;margin:0 3px;font:17px Arial;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),inset 0 -10px 22px rgba(0,0,0,.20)}' + '#r14h button:focus,.gb14:focus,.cat14:focus,.card14:focus,.ep14:focus,.ch14:focus,#l14:focus,.tab14:focus{outline:0;border:2px solid #fff;box-shadow:0 0 0 2px rgba(255,255,255,.16),inset 0 1px 0 rgba(255,255,255,.16)}' + '#r14body{position:absolute;left:0;top:84px;width:1280px;height:636px;background:#090c0e;padding:18px 22px;box-sizing:border-box;overflow:hidden}' + '#r14.live #r14body{padding:0;background:transparent}' + '.title14{font-size:25px;margin:0 0 8px}' + '.hint14{font-size:14px;color:#abb4ba;margin:0 0 11px}' + '.foot14{font-size:13px;color:#9fa8ae;margin-top:5px}' + '.glass14{background:-webkit-linear-gradient(top,rgba(39,46,51,.88),rgba(13,17,20,.96));border:1px solid #a0a7ac;box-shadow:inset 0 1px 0 rgba(255,255,255,.14),inset 0 -14px 28px rgba(0,0,0,.22),0 8px 20px rgba(0,0,0,.28);border-radius:13px}' + '.catcol14{position:absolute;left:0;top:0;width:246px;height:636px;padding:13px 9px;background:rgba(8,11,13,.98);border-right:1px solid #4e565c;box-sizing:border-box}' + '.catlist14{height:518px;overflow:hidden}' + '.cat14,.tab14{display:block;width:228px;height:57px;margin:0 0 6px;padding:0 13px;text-align:left;color:#fff;font:16px Arial;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' + '.cat14.sel,.tab14.sel{background:-webkit-linear-gradient(top,#343c42,#1a2024)}' + '.content14{position:absolute;left:246px;right:0;top:0;height:636px;padding:14px 18px;background:#090c0e;box-sizing:border-box}' + '.cards14{height:560px;overflow:hidden}' + '.card14{position:relative;display:inline-block;vertical-align:top;width:176px;height:264px;margin:0 17px 15px 0;padding:0;color:#fff;overflow:hidden;text-align:left}' + '.card14 img{display:block;width:174px;height:262px;object-fit:cover;border-radius:12px;background:#151a1d}' + '.card14 .fade14{position:absolute;left:0;right:0;bottom:0;height:78px;background:-webkit-linear-gradient(top,rgba(0,0,0,0),rgba(0,0,0,.94));border-radius:0 0 12px 12px}' + '.card14 .name14{position:absolute;left:10px;right:9px;bottom:15px;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' + '.prog14{position:absolute;left:9px;right:9px;bottom:7px;height:4px;background:rgba(255,255,255,.24);border-radius:4px;overflow:hidden}' + '.prog14 i{display:block;height:4px;background:#fff}' + '.epgrid14{height:520px;overflow:hidden}' + '.ep14{position:relative;display:inline-block;vertical-align:top;width:300px;height:200px;margin:0 18px 18px 0;padding:0;color:#fff;overflow:hidden;text-align:left}' + '.ep14 img{display:block;width:298px;height:198px;object-fit:cover;border-radius:12px;background:#151a1d}' + '.epflare14{position:absolute;left:0;right:0;bottom:0;height:72px;background:-webkit-linear-gradient(top,rgba(0,0,0,0),rgba(0,0,0,.92));border-radius:0 0 12px 12px}' + '.eplabel14{position:absolute;left:11px;right:10px;bottom:17px;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' + '.livecat14{position:absolute;left:0;top:0;width:246px;height:636px;padding:12px 9px;background:#090c0e;border-right:1px solid #4e565c;box-sizing:border-box}' + '.livech14{position:absolute;left:246px;top:0;width:326px;height:636px;padding:12px 10px;background:#090c0e;border-right:1px solid #4e565c;box-sizing:border-box}' + '.collapsed14 .livecat14{display:none}' + '.collapsed14 .livech14{left:0}' + '.chlist14{height:518px;overflow:hidden}' + '.ch14{display:block;width:304px;height:58px;margin:0 0 6px;padding:6px 8px;color:#fff;text-align:left;font:16px Arial;overflow:hidden;white-space:nowrap}' + '.ch14 img{display:inline-block;width:40px;height:40px;object-fit:contain;background:#06080a;border-radius:7px;vertical-align:middle;margin-right:9px}' + '.ch14 span{display:inline-block;vertical-align:middle;width:226px;overflow:hidden;text-overflow:ellipsis}' + '.ch14.sel{background:-webkit-linear-gradient(top,#343c42,#1a2024)}' + '.pv14{position:absolute;left:572px;right:0;top:0;height:486px;background:transparent}' + '.collapsed14 .pv14{left:326px}' + '.pvl14{position:absolute;left:594px;right:22px;top:15px;padding:8px 45px 8px 12px;background:rgba(5,7,8,.70);border:1px solid rgba(190,195,198,.50);border-radius:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' + '.collapsed14 .pvl14{left:348px}' + '.lfav14{position:absolute;right:31px;top:18px;width:39px;height:34px;padding:0;text-align:center;font-size:19px}' + '.poster14{position:absolute;left:50%;top:46%;width:230px;height:150px;margin-left:-115px;margin-top:-75px;text-align:center;color:#dce2e5}' + '.poster14 img{max-width:190px;max-height:110px;object-fit:contain}' + '.mono14{width:92px;height:92px;border-radius:46px;line-height:92px;margin:0 auto 9px;text-align:center;font-size:32px}' + '.pc14{position:absolute;left:572px;right:0;top:486px;height:150px;padding:27px 25px;background:-webkit-linear-gradient(top,rgba(28,34,39,.97),rgba(8,11,13,.98));border-top:1px solid #6f777d;box-sizing:border-box}' + '.collapsed14 .pc14{left:326px}' + '.pc14 .gb14{min-width:165px;margin-right:10px}' + '.detail14{height:600px}' + '.posterD14{float:right;width:300px;height:450px;object-fit:cover;border-radius:14px;margin:0 10px 0 28px}' + '.syn14{font-size:17px;line-height:1.42;max-height:220px;overflow:hidden}' + '.actions14{margin:18px 0}' + '.err14{padding:70px 35px;font-size:23px}' + '#l14{display:block;width:100%;height:455px;box-sizing:border-box;overflow:hidden;white-space:pre-wrap;background:#040607;border:1px solid #697177;border-radius:10px;padding:12px;font:14px monospace;color:#d7dde1}' + '#l14.active{border:2px solid #fff}' + '.contEmpty14{padding:45px;color:#abb4ba}';
        documentRef.head.appendChild(s);
    }
    function installCatalogStyles() {
        if (element('r19css'))
            return;
        var s = documentRef.createElement('style');
        s.id = 'r19css';
        s.textContent = '#r14h{background:#101418;border-bottom:1px solid #697178;box-shadow:inset 0 -1px 0 rgba(255,255,255,.03);padding-left:26px}' + '#r14h b{font-weight:normal;letter-spacing:.2px}' + '.gb14,#r14h button{background:#171c20;border:1px solid #778087;border-radius:9px;box-shadow:inset 0 1px 0 rgba(255,255,255,.06);padding:9px 14px}' + '.glass14{background:#14191d;border:1px solid #737b81;box-shadow:inset 0 1px 0 rgba(255,255,255,.07);border-radius:10px}' + '.catcol14,.livecat14,.livech14{background:#0d1114;border-color:#343b40}' + '.content14{background:#0b0f12}' + '.cat14,.tab14{height:56px;margin-bottom:5px}' + '.cat14.sel,.tab14.sel,.ch14.sel{background:#20272c}' + '.cards14{height:548px}' + '.card14{width:170px;height:255px;margin:0 14px 16px 0;border-radius:11px}' + '.card14 img{width:168px;height:253px;border-radius:10px}' + '.ep14{width:258px;height:158px;margin:0 14px 12px 0;border-radius:10px}' + '.ep14 img{width:256px;height:156px;border-radius:9px}' + '.epflare14{height:62px;border-radius:0 0 9px 9px}' + '.skel19{position:relative;display:inline-block;width:170px;height:255px;margin:0 14px 16px 0;border:1px solid #555e65;border-radius:10px;background:#151a1e;overflow:hidden}' + '.skel19:after{content:"";position:absolute;left:-120px;top:0;width:110px;height:100%;background:-webkit-linear-gradient(left,rgba(255,255,255,0),rgba(255,255,255,.09),rgba(255,255,255,0));-webkit-animation:sh19 1.25s linear infinite}' + '@-webkit-keyframes sh19{from{left:-120px}' + 'to{left:190px}' + '}' + '.movie19{position:absolute;left:0;top:0;right:0;bottom:0;background:#090c0e center/cover no-repeat}' + '.movie19:after{content:"";position:absolute;left:0;top:0;right:0;bottom:0;background:-webkit-linear-gradient(left,rgba(5,7,9,.96) 0%,rgba(5,7,9,.80) 44%,rgba(5,7,9,.24) 78%,rgba(5,7,9,.52) 100%)}' + '.movieInfo19{position:absolute;z-index:2;left:48px;bottom:54px;width:650px}' + '.movieLogo19{max-width:390px;max-height:92px;margin-bottom:16px}' + '.movieInfo19 h1{font-size:40px;font-weight:normal;margin:0 0 12px}' + '.movieInfo19 .syn14{max-height:150px;margin:8px 0 18px}' + '.movieInfo19 .actions14{margin:0}' + '.tmdb19{font-size:12px;color:#8f989f;margin-top:12px}' + '.series19{position:absolute;left:0;top:0;right:0;bottom:0;background:#0b0f12}' + '.seriesLeft19{position:absolute;left:24px;top:20px;width:330px;bottom:20px;padding:20px;border-right:1px solid #343b40;box-sizing:border-box}' + '.seriesLeft19 h1{font-size:29px;font-weight:normal;margin:16px 0 10px}' + '.seriesSyn19{font-size:15px;line-height:1.42;color:#c2c8cc;height:88px;overflow:hidden;margin-bottom:16px}' + '.seasons19{height:250px;overflow:hidden;border-top:1px solid #343b40;padding-top:10px}' + '.season19{display:block;width:260px;height:42px;margin:0 0 6px;text-align:left}' + '.seriesRight19{position:absolute;left:380px;right:18px;top:20px;bottom:20px}' + '.seriesRule19{height:1px;background:#343b40;margin:8px 0 14px}' + '.epgrid14{height:510px}' + '.episodeTitle19{font-size:20px;color:#dfe4e7}' + '.skeletonRow19{height:548px;overflow:hidden}' + '.livePending19{padding:20px;color:#9ba4aa}' + '.chSk19{height:54px;margin:0 0 7px;background:#151a1e;border:1px solid #434b51;border-radius:9px;position:relative;overflow:hidden}' + '.chSk19:after{content:"";position:absolute;left:-90px;top:0;width:80px;height:100%;background:-webkit-linear-gradient(left,rgba(255,255,255,0),rgba(255,255,255,.07),rgba(255,255,255,0));-webkit-animation:sh19 1.2s linear infinite}' + '.catSk19{height:50px;margin:0 0 7px;background:#151a1e;border:1px solid #434b51;border-radius:9px}' + '.card14:focus,.ep14:focus,.cat14:focus,.ch14:focus,.gb14:focus,.season19:focus,.skel19:focus{border:2px solid #fff;box-shadow:0 0 0 2px rgba(255,255,255,.10)}';
        documentRef.head.appendChild(s);
    }
    function cut19(s, n) {
        s = String(s || '');
        return s.length > n ? s.slice(0, n - 1) + '\u2026' : s;
    }
    function skeleton19(n) {
        var i, h = '<div class="skeletonRow19">';
        for (i = 0; i < n; i++)
            h += '<button class="skel19"' + (i ? '' : ' id="skfirst19"') + '></button>';
        return h + '</div>';
    }
    function enrichVisible19(a, st, count) {
        var i = st, end = Math.min(a.length, st + count);
        function nx() {
            var o, ix;
            if (i >= end || !M)
                return;
            ix = i;
            o = a[i++];
            if (o && o.p) {
                nx();
                return;
            }
            M.enrich(o, viewState.t, function () {
                var g = element('libgrid14'), b, im;
                if (viewState.on && viewState.view == 'library' && g && o && o.p) {
                    b = g.querySelector('button.card14[data-ii="' + ix + '"]');
                    if (b) {
                        im = b.getElementsByTagName('img')[0];
                        if (im)
                            im.src = asset(o.p);
                    }
                }
                nx();
            });
        }
        nx();
    }
    function installPreparationStyles() {
        if (element('r27css'))
            return;
        var s = documentRef.createElement('style');
        s.id = 'r27css';
        s.textContent = '#r14.detail27 #r14h,#r14.prepare27 #r14h{display:none}' + '#r14.detail27 #r14body,#r14.prepare27 #r14body{top:0;height:720px;padding:0;background:#0D151C}' + '.prep25{position:absolute;left:0;top:0;right:0;bottom:0;background:#0D151C}' + '.prep25 .p27bar{position:absolute;left:48px;bottom:72px;width:540px}' + '.prep25 .p27line{height:22px;margin:0 0 13px;border-radius:6px;background:#182532}' + '.prep25 .p27line.s{width:64%}' + '.card14,.ep14{box-shadow:none!important}' + '.card14:focus,.ep14:focus{box-shadow:none!important;border:2px solid #A2D0EC!important}' + '.card14 img,.ep14 img{will-change:auto}';
        documentRef.head.appendChild(s);
    }
    function installDetailStyles() {
        if (element('d29css'))
            return;
        var s = documentRef.createElement('style');
        s.id = 'd29css';
        s.textContent = '.detailBg29{position:absolute;z-index:0;left:0;top:0;width:100%;height:100%;object-fit:cover}.movie19:after{z-index:1}.movieInfo19{z-index:2}.series19:after{content:"";position:absolute;z-index:1;left:0;top:0;right:0;bottom:0;background:-webkit-linear-gradient(left,rgba(13,21,28,.97),rgba(13,21,28,.84) 45%,rgba(13,21,28,.25) 82%,rgba(13,21,28,.55))}.seriesLeft19,.seriesRight19{z-index:2}.detailLogoHost29{display:block;min-height:1px}';
        documentRef.head.appendChild(s);
    }
    function installLayoutStyles() {
        var st = documentRef.createElement('style');
        st.id = 'layout31';
        st.textContent = '#r14 .seriesLeft19{left:40px;top:238px;bottom:26px;width:398px;padding:0;border:0!important;background:transparent!important}' + '#r14 .seriesLeft19 h1{font-size:32px;line-height:1.1;height:82px;overflow:hidden;margin:0 0 10px}' + '#r14 .seriesLeft19 .detailLogoHost29{height:92px;margin-bottom:8px}' + '#r14 .seriesLeft19 .movieLogo19{max-width:350px;max-height:88px;margin:0}' + '#r14 .seriesSyn19{height:70px;line-height:1.4;font-size:17px;margin:8px 0 12px}' + '#r14 .seriesLeft19 .actions14{margin:0 0 12px}' + '#r14 .seasons19{height:106px;border:0;padding-top:0;overflow:hidden}' + '#r14 .season19{height:45px;margin-bottom:8px;width:290px;box-sizing:border-box}' + '#r14 .seriesRight19{left:472px;right:24px;top:auto;bottom:26px;height:333px}' + '#r14 .episodeTitle19{height:30px;font-size:19px}' + '#r14 .epgrid14{height:296px;font-size:0}' + '#r14 .ep14{width:246px;height:138px;margin:0 12px 10px 0;box-sizing:border-box;border-width:2px!important}' + '#r14 .ep14 img{width:242px;height:134px}' + '#r14 .eplabel14{font-size:14px;left:8px;right:8px;bottom:13px}' + '#r14 .seriesRule19{display:none}' + '#r14 .seriesLeft19 .tmdb19{display:none}' + '#r14 .movieInfo19{left:48px;bottom:60px;width:470px}' + '#r14 .movieInfo19 .syn14{font-size:18px;max-height:126px}' + '#r14 .movieInfo19 h1{font-size:36px}' + '#r14 .skel19:after,#r14 .chSk19:after{-webkit-animation:none}';
        documentRef.head.appendChild(st);
    }
    function root() {
        var r = element('r14');
        if (r)
            return r;
        r = documentRef.createElement('section');
        r.id = 'r14';
        r.className = 'h';
        r.innerHTML = '<div id="r14h"><b>M3U bruto <span style="font-size:14px;color:#9fa8ae">beta \xB7 Graphene</span></b><button id="r14back">Voltar</button><button id="hc14" data-t="c">Ao vivo</button><button id="hm14" data-t="m">Filmes</button><button id="hs14" data-t="s">Séries</button><button id="hf14">Favoritos</button><button id="hct14">Continuar</button><button id="r14log">Log</button></div><div id="r14body"></div>';
        documentRef.body.appendChild(r);
        css();
        installCatalogStyles();
        installPreparationStyles();
        installDetailStyles();
        installLayoutStyles();
        installResumeDialogStyles();
        element('r14back').onclick = exitToMenu;
        element('r14log').onclick = logs;
        element('hf14').onclick = favorites;
        element('hct14').onclick = continueView;
        r.onclick = function (e) {
            var t = e.target && e.target.getAttribute && e.target.getAttribute('data-t');
            if (t)
                type(t);
        };
        return r;
    }
    function fullscreenControlsRoot() {
        var r = element('lfc49'), s;
        if (r)
            return r;
        s = documentRef.createElement('style');
        s.id = 'lfc49css';
        s.textContent = '#lfc49{position:fixed;z-index:760;left:0;right:0;bottom:28px;text-align:center;pointer-events:auto}#lfc49.h{display:none}#lfc49>div{display:inline-block;padding:13px 16px;background:rgba(8,12,15,.94);border:1px solid #79838a;border-radius:12px}#lfc49 button{height:44px;min-width:190px;margin:0 7px;padding:8px 16px;background:#171c20;color:#fff;border:1px solid #879198;border-radius:9px;font:17px Arial}#lfc49 button:focus{border:2px solid #fff;box-shadow:0 0 0 2px rgba(255,255,255,.16);outline:0}';
        documentRef.head.appendChild(s);
        r = documentRef.createElement('div');
        r.id = 'lfc49';
        r.className = 'h';
        r.innerHTML = '<div><button id="lfc49back">Voltar</button><button id="lfc49exit">Sair da tela cheia</button><button id="lfc49log">Log</button></div>';
        documentRef.body.appendChild(r);
        element('lfc49back').onclick = exitFullLive;
        element('lfc49exit').onclick = exitFullLive;
        element('lfc49log').onclick = function () {
            hideFullscreenControls();
            if (windowRef.RTVLiveLog29 && windowRef.RTVLiveLog29.toggle)
                windowRef.RTVLiveLog29.toggle();
            else if (windowRef.RTVLiveLog24 && windowRef.RTVLiveLog24.toggle)
                windowRef.RTVLiveLog24.toggle();
            else
                logs();
        };
        return r;
    }
    function hideFullscreenControls() {
        var r = element('lfc49');
        clearTimeout(viewState.fullCtlTimer49);
        viewState.fullCtl49 = 0;
        if (r)
            r.className = 'h';
    }
    function showFullscreenControls(id) {
        var r = fullscreenControlsRoot(), z;
        clearTimeout(viewState.fullCtlTimer49);
        viewState.fullCtl49 = 1;
        r.className = '';
        z = element(id || 'lfc49exit');
        if (z)
            z.focus();
        viewState.fullCtlTimer49 = setTimeout(hideFullscreenControls, 5000);
    }
    function show(mode) {
        hideBase();
        root().className = mode || '';
    }
    function base(h, mode) {
        root();
        var b = element('r14body');
        cancelImages();
        clearImgs(b);
        show(mode);
        b.innerHTML = h;
    }
    function wait(x) {
        base('<div class="err14">' + escapeHtml(x) + '</div>', '');
    }
    function hideBroken() {
        var a = element('r14body').getElementsByTagName('img'), i;
        for (i = 0; i < a.length; i++)
            if (!a[i].getAttribute('data-src') && !a[i].onerror)
                a[i].onerror = function () {
                    this.style.visibility = 'hidden';
                };
    }
    function mono(n) {
        n = String(n || '?').replace(/^\s+|\s+$/g, '');
        return escapeHtml((n.charAt(0) || '?').toUpperCase());
    }
    function closeLiveDiagnostics() {
        var L = windowRef.RTVLiveLog43 || windowRef.RTVLiveLog29 || windowRef.RTVLiveLog24;
        if (L && L.close) {
            L.close();
            return;
        }
        if (L && L.isOpen && L.isOpen() && L.toggle)
            L.toggle();
    }
    function stopLive() {
        clearTimeout(viewState.catTimer);
        hideFullscreenControls();
        viewState.liveToken++;
        viewState.liveTry = 0;
        viewState.full = 0;
        viewState.previewAt44 = 0;
        viewState.fullExitAt44 = 0;
        if (viewState.preview && windowRef.RawPlayer)
            try {
                windowRef.RawPlayer.close();
            } catch (e) {
            }
        viewState.preview = null;
        viewState.previewIndex = -1;
    }
    function open() {
        if (viewState.on)
            return;
        viewState.on = 1;
        viewState.items = [];
        viewState.detail = null;
        viewState.preview = null;
        wait('Autenticando Xtream Codes\u2026');
        try {
            xtreamApi.log('SESSÃO', 'RemoteTV UI v0.17 \xB7 Graphene + auto-auth + auto-load');
        } catch (e) {
        }
        var oq = ++viewState.req;
        var go = function (e) {
            if (!viewState.on || oq != viewState.req)
                return;
            if (e) {
                wait(e);
                return;
            }
            type('c');
        };
        if (xtreamApi.ensureAuth)
            xtreamApi.ensureAuth(go, 'open');
        else
            xtreamApi.auth(go);
    }
    function renderLoadingShell(t) {
        var i, h;
        if (t == 'c') {
            h = '<div class="livecat14"><div class="title14">Categorias</div><div class="catlist14">';
            for (i = 0; i < 8; i++)
                h += '<div class="catSk19"></div>';
            h += '</div><div class="foot14">Carregando categorias\u2026</div></div><div class="livech14"><div class="title14">Canais</div><div class="chlist14">';
            for (i = 0; i < 8; i++)
                h += '<div class="chSk19"></div>';
            h += '</div><div class="foot14">Aguardando categoria\u2026</div></div><div class="pv14"><div class="poster14"><div class="mono14 glass14">TV</div><div>Preparando Ao vivo\u2026</div></div></div><div class="pvl14">Preparando canais\u2026</div><div class="pc14"><div class="foot14">Aguardando API Xtream.</div></div>';
            return {
                h: h,
                m: 'live'
            };
        }
        h = '<div class="catcol14"><div class="title14">' + escapeHtml(contentTypeName(t)) + '</div><div class="catlist14">';
        for (i = 0; i < 8; i++)
            h += '<div class="catSk19"></div>';
        h += '</div></div><div class="content14">' + skeleton19(10) + '</div>';
        return {
            h: h,
            m: ''
        };
    }
    function type(t) {
        viewState.specialReq34++;
        showBusyOverlay(0);
        if (t != 'c')
            closeLiveDiagnostics();
        var sh, rq = ++viewState.req;
        viewState.libReq++;
        viewState.detailReq++;
        cancelArtwork();
        if (M && M.cancel)
            M.cancel();
        stopLive();
        if (vodPlayer && vodPlayer.active && vodPlayer.active())
            vodPlayer.stop();
        xtreamApi.releaseItems();
        viewState.t = t;
        viewState.items = [];
        viewState.cat = null;
        viewState.detail = null;
        viewState.cp = 0;
        viewState.page = 0;
        viewState.collapsed = 0;
        viewState.fcat = 0;
        viewState.season = 0;
        sh = renderLoadingShell(t);
        base(sh.h, sh.m);
        try {
            xtreamApi.log('UI30', 'cats BEGIN \xB7 ' + t);
        } catch (y) {
        }
        xtreamApi.cats(t, function (e, a) {
            if (!viewState.on || rq != viewState.req)
                return;
            try {
                xtreamApi.log('UI30', 'cats CALLBACK \xB7 ' + t + ' \xB7 ' + (e ? e : (a || []).length + ' categorias'));
            } catch (y) {
            }
            if (e) {
                wait(e);
                return;
            }
            viewState.cats = a || [];
            if (t == 'c') {
                if (viewState.cats.length) {
                    viewState.fcat = 0;
                    loadLiveCategory(viewState.cats[0], 1, ++viewState.req);
                } else
                    liveHub();
            } else
                library();
        });
    }
    function catButtons(cls) {
        var st = viewState.cp * 8, i, h = '';
        for (i = st; i < viewState.cats.length && i < st + 8; i++)
            h += '<button class="' + cls + ' glass14' + (viewState.cat && String(viewState.cat.id) == String(viewState.cats[i].id) ? ' sel' : '') + '" data-ci="' + i + '">' + escapeHtml(viewState.cats[i].n) + '</button>';
        return h;
    }
    var LOGO42 = {}, LOGOQ42 = [];
    function rememberChannelLogo(u) {
        var old;
        if (!u || LOGO42[u])
            return;
        LOGO42[u] = 1;
        LOGOQ42.push(u);
        if (LOGOQ42.length > 128) {
            old = LOGOQ42.shift();
            delete LOGO42[old];
        }
    }
    function renderChannelLogo(u) {
        u = asset(u || '');
        if (!u)
            return '<img>';
        return LOGO42[u] ? '<img src="' + escapeHtml(u) + '" data-logo42="1">' : '<img data-src="' + escapeHtml(u) + '" data-logo42="1">';
    }
    function renderLiveChannelButtons() {
        var st = viewState.page * 8, i, o, h = '';
        if (viewState.loading && !viewState.items.length) {
            for (i = 0; i < 8; i++)
                h += '<div class="chSk19"></div>';
            return h;
        }
        for (i = st; i < viewState.items.length && i < st + 8; i++) {
            o = viewState.items[i];
            h += '<button class="ch14 glass14' + (viewState.preview && String(viewState.preview.id) == String(o.id) ? ' sel' : '') + '" data-ii="' + i + '">' + renderChannelLogo(o.p) + '<span>' + escapeHtml(o.n) + '</span></button>';
        }
        return h;
    }
    function bindLiveChannelButtons(ch) {
        var buttons, i;
        if (!ch)
            return;
        ch.onclick = function (e) {
            var z = e.target;
            while (z && z != ch && !(z.getAttribute && z.getAttribute('data-ii') != null))
                z = z.parentNode;
            if (z && z.getAttribute && z.getAttribute('data-ii') != null)
                chooseLive(+z.getAttribute('data-ii'));
        };
        buttons = ch.querySelectorAll('.ch14');
        for (i = 0; i < buttons.length; i++)
            buttons[i].onfocus = function () {
                viewState.liveFocus35 = +this.getAttribute('data-ii');
                prioritizeImage(this);
            };
    }
    function refreshLiveChannels(focusIndex) {
        var ch = element('ch14'), foot, buttons, i;
        if (!ch)
            return false;
        ch.innerHTML = renderLiveChannelButtons();
        foot = ch.parentNode && ch.parentNode.querySelector('.foot14');
        if (foot)
            foot.textContent = viewState.loading ? 'Carregando\u2026' : (viewState.items.length ? viewState.page * 8 + 1 : 0) + '\u2013' + Math.min(viewState.items.length, viewState.page * 8 + 8) + ' / ' + viewState.items.length;
        bindLiveChannelButtons(ch);
        hideBroken();
        enqueueVisibleImages(ch);
        buttons = ch.querySelectorAll('.ch14');
        for (i = 0; i < buttons.length; i++)
            if (+buttons[i].getAttribute('data-ii') == focusIndex) {
                buttons[i].focus();
                return true;
            }
        if (buttons.length)
            buttons[0].focus();
        return true;
    }
    function liveHub() {
        var st = viewState.page * 8, i, o, h = '<div class="livecat14"><div class="title14">Categorias</div><div id="lc14" class="catlist14">' + catButtons('cat14') + '</div><div class="foot14">' + (viewState.cats.length ? viewState.cp * 8 + 1 : 0) + '\u2013' + Math.min(viewState.cats.length, viewState.cp * 8 + 8) + ' / ' + viewState.cats.length + '</div></div><div class="livech14"><div class="title14">' + escapeHtml(viewState.cat ? viewState.cat.n : 'Canais') + '</div><div id="ch14" class="chlist14">' + renderLiveChannelButtons() + '</div><div class="foot14">' + (viewState.loading ? 'Carregando\u2026' : (viewState.items.length ? st + 1 : 0) + '\u2013' + Math.min(viewState.items.length, st + 8) + ' / ' + viewState.items.length) + '</div></div><div class="pv14">' + (!viewState.preview || !viewState.preview._playing ? '<div class="poster14">' + (viewState.preview && viewState.preview.p ? renderChannelLogo(viewState.preview.p) : '<div class="mono14 glass14">' + mono(viewState.preview ? viewState.preview.n : viewState.items[0] ? viewState.items[0].n : '?') + '</div>') + '<div>' + escapeHtml(viewState.preview ? viewState.preview.n : viewState.items[0] ? viewState.items[0].n : 'Selecione um canal') + '</div></div>' : '') + '</div><div class="pvl14">' + escapeHtml(viewState.preview ? viewState.preview.n : viewState.items[0] ? viewState.items[0].n : 'Selecione um canal') + '</div><button id="lfav14" class="lfav14 gb14">' + (viewState.preview && isFav('c', viewState.preview) ? '\u2605' : '\u2606') + '</button><div class="pc14"><button id="lb14" class="gb14">Voltar</button><button id="lf14" class="gb14">Tela cheia</button><button id="ll14" class="gb14">Log</button><div class="foot14">' + (viewState.collapsed ? '\u2190 volta às categorias \xB7 OK = preview; OK novamente = tela cheia' : '\u2192 entra nos canais \xB7 mover categoria atualiza a lista') + '</div></div>';
        base(h, 'live ' + (viewState.collapsed ? 'collapsed14' : ''));
        element('lb14').onclick = function () {
            if (viewState.collapsed)
                expandCats();
            else
                back();
        };
        element('lf14').onclick = fullLive;
        element('ll14').onclick = function () {
            if (windowRef.RTVLiveLog29 && windowRef.RTVLiveLog29.toggle)
                windowRef.RTVLiveLog29.toggle();
            else if (windowRef.RTVLiveLog24 && windowRef.RTVLiveLog24.toggle)
                windowRef.RTVLiveLog24.toggle();
            else
                logs();
        };
        element('lfav14').onclick = function () {
            if (viewState.preview) {
                this.textContent = toggleFav('c', viewState.preview) ? '\u2605' : '\u2606';
            }
        };
        var lc = element('lc14'), ch = element('ch14');
        if (lc)
            lc.onclick = function (e) {
                var z = e.target && e.target.getAttribute && e.target.getAttribute('data-ci');
                if (z != null)
                    selectLiveCat(+z, 1);
            };
        bindLiveChannelButtons(ch);
        bindLiveCatFocus();
        hideBroken();
        loadVisibleImages(element('r14body'));
        viewState.view = 'live';
        if (!viewState.painting) {
            if (viewState.collapsed)
                focusChannel();
            else
                focusLiveCat();
        }
    }
    function focusChannelSafe() {
        if (viewState.collapsed)
            focusChannel();
        else
            focusLiveCat();
    }
    function bindLiveCatFocus() {
        var l = element('lc14') ? element('lc14').querySelectorAll('.cat14') : [], i;
        for (i = 0; i < l.length; i++)
            l[i].onfocus = function () {
                viewState.fcat = +this.getAttribute('data-ci');
            };
    }
    function selectLiveCat(ix, enter) {
        if (ix < 0 || ix >= viewState.cats.length)
            return;
        viewState.fcat = ix;
        viewState.cp = Math.floor(ix / 8);
        viewState.enterAfter = enter ? 1 : 0;
        loadLiveCategory(viewState.cats[ix], 1, ++viewState.req);
    }
    function loadLiveCategory(c, keepCats, rq) {
        rq = rq || ++viewState.req;
        clearTimeout(viewState.catTimer);
        xtreamApi.cancel();
        stopLive();
        viewState.cat = c;
        viewState.items = [];
        viewState.detail = null;
        viewState.page = 0;
        viewState.loading = 1;
        try {
            xtreamApi.log('UI30', 'loadLive BEGIN \xB7 category_id=' + c.id + ' \xB7 req=' + rq + ' \xB7 ' + c.n);
        } catch (y) {
        }
        viewState.painting = 1;
        liveHub();
        viewState.painting = 0;
        xtreamApi.items('c', c, function (e, a) {
            if (!viewState.on || rq != viewState.req || !viewState.cat || String(viewState.cat.id) != String(c.id)) {
                try {
                    xtreamApi.log('UI30', 'STALE live descartado \xB7 category_id=' + c.id + ' \xB7 req=' + rq);
                } catch (y) {
                }
                return;
            }
            viewState.loading = 0;
            try {
                xtreamApi.log('UI30', 'loadLive CALLBACK \xB7 category_id=' + c.id + ' \xB7 ' + (e ? e : (a || []).length + ' canais'));
            } catch (y) {
            }
            if (e) {
                viewState.items = [];
                viewState.painting = 1;
                liveHub();
                viewState.painting = 0;
                return;
            }
            var head31 = documentRef.activeElement && documentRef.activeElement.parentNode == element('r14h') ? documentRef.activeElement.id : '';
            viewState.items = a || [];
            viewState.preview = viewState.items.length ? viewState.items[0] : null;
            viewState.previewIndex = 0;
            viewState.liveFocus35 = 0;
            if (viewState.preview)
                viewState.preview._playing = 0;
            viewState.painting = 1;
            liveHub();
            viewState.painting = 0;
            if (head31 && element(head31))
                element(head31).focus();
            else if (viewState.enterAfter) {
                viewState.enterAfter = 0;
                collapseCats();
            } else
                focusLiveCat();
        });
    }
    function focusLiveCat() {
        var l = element('lc14') ? element('lc14').querySelectorAll('.cat14') : [], i;
        for (i = 0; i < l.length; i++)
            if (+l[i].getAttribute('data-ci') == viewState.fcat) {
                l[i].focus();
                return;
            }
        if (l.length)
            l[0].focus();
    }
    function focusChannel() {
        var l = element('ch14') ? element('ch14').querySelectorAll('.ch14') : [], n = viewState.liveFocus35 - viewState.page * 8;
        if (n < 0 || n >= l.length)
            n = 0;
        if (l.length)
            l[n].focus();
        else if (element('lb14'))
            element('lb14').focus();
    }
    function collapseCats() {
        viewState.collapsed = 1;
        root().className = 'live collapsed14';
        updateLiveHint();
        focusChannel();
    }
    function expandCats() {
        viewState.collapsed = 0;
        root().className = 'live';
        updateLiveHint();
        focusLiveCat();
    }
    function updateLiveHint() {
        var z = element('r14body').querySelector('.pc14 .foot14');
        if (z)
            z.textContent = viewState.collapsed ? '\u2190 volta às categorias \xB7 OK = preview; OK novamente = tela cheia' : '\u2192 entra nos canais \xB7 OK carrega a categoria';
    }
    function liveRoutes(o) {
        return xtreamApi.routes ? xtreamApi.routes(o) : [xtreamApi.stream(o)];
    }
    function startLive(o, idx) {
        var a = xtreamApi.liveRoutes ? xtreamApi.liveRoutes(o) : [xtreamApi.stream(o)], u, tok = ++viewState.liveToken, ps, focusAt31 = navAt31;
        if (idx == null)
            idx = 0;
        if (idx >= a.length) {
            xtreamApi.log('LIVE46', 'todas as rotas live falharam explicitamente');
            ps = element('ps');
            if (ps)
                ps.textContent = 'Falha. Abra Log.';
            return;
        }
        u = a[idx];
        if (!u) {
            xtreamApi.log('LIVE46', 'sem rota reproduzível');
            return;
        }
        viewState.liveTry = idx;
        xtreamApi.log('LIVE46', 'AutoHLS perfil ' + (idx == 0 ? '720p' : idx == 1 ? '1080p' : 'direto') + ' \xB7 ' + xtreamApi.mask(u));
        if (windowRef.RawPlayer)
            windowRef.RawPlayer.play(o.n, u, false, false, function (reason) {
                if (tok != viewState.liveToken || !viewState.on || viewState.view != 'live')
                    return;
                xtreamApi.log('LIVE46', 'falha final do player \xB7 perfil ' + idx + ' \xB7 ' + String(reason || 'desconhecida'));
                if (idx + 1 < a.length) {
                    try {
                        windowRef.RawPlayer.close();
                    } catch (e) {
                    }
                    startLive(o, idx + 1);
                    return;
                }
                ps = element('ps');
                if (ps)
                    ps.textContent = 'Falha. Abra Log.';
            }, true);
        if (viewState.full && windowRef.RawPlayer && windowRef.RawPlayer.fullscreen)
            try {
                windowRef.RawPlayer.fullscreen(1);
            } catch (e) {
            }
        setTimeout(function () {
            if (tok == viewState.liveToken && viewState.on && viewState.view == 'live' && navAt31 == focusAt31) {
                if (viewState.collapsed)
                    focusChannel();
                else
                    focusLiveCat();
            }
        }, 160);
    }
    function chooseLive(i) {
        var o = viewState.items[i], tm = new Date().getTime();
        if (!o)
            return;
        if (viewState.preview && String(viewState.preview.id) == String(o.id) && viewState.preview._playing) {
            if (tm - viewState.previewAt44 < 550) {
                try {
                    xtreamApi.log('LIVE44', 'OK duplicado ignorado \xB7 preview preservado');
                } catch (e) {
                }
                return;
            }
            fullLive();
            return;
        }
        if (viewState.preview)
            viewState.preview._playing = 0;
        viewState.preview = o;
        viewState.previewIndex = i;
        viewState.preview._playing = 1;
        viewState.previewAt44 = tm;
        viewState.fullExitAt44 = 0;
        startLive(o, 0);
        liveHub();
    }
    function fullLive() {
        var ok = 0;
        if (!viewState.preview || !viewState.preview._playing) {
            if (viewState.items[viewState.previewIndex])
                chooseLive(viewState.previewIndex);
            return;
        }
        if (windowRef.RawPlayer && windowRef.RawPlayer.fullscreen)
            try {
                ok = windowRef.RawPlayer.fullscreen(1) ? 1 : 0;
            } catch (e) {
                ok = 0;
            }
        if (ok) {
            hideFullscreenControls();
            viewState.full = 1;
            root().className = 'h';
            xtreamApi.log('LIVE49', 'tela cheia headless \xB7 controles no direcional cima \xB7 id=' + String(viewState.preview.id));
        }
    }
    function exitFullLive() {
        hideFullscreenControls();
        if (windowRef.RawPlayer && windowRef.RawPlayer.fullscreen)
            try {
                windowRef.RawPlayer.fullscreen(0);
            } catch (e) {
            }
        viewState.full = 0;
        viewState.fullExitAt44 = new Date().getTime();
        liveHub();
    }
    function library() {
        var h = '<div class="catcol14"><div class="title14">' + escapeHtml(contentTypeName(viewState.t)) + '</div><div id="libcats14" class="catlist14">' + catButtons('cat14') + '</div><div id="libcatfoot14" class="foot14">' + (viewState.cats.length ? viewState.cp * 8 + 1 : 0) + '\u2013' + Math.min(viewState.cats.length, viewState.cp * 8 + 8) + ' / ' + viewState.cats.length + '</div></div><div class="content14"><div class="title14">' + escapeHtml(viewState.cat ? viewState.cat.n : contentTypeName(viewState.t)) + '</div><div class="hint14">' + (viewState.cat ? 'Conteúdo da categoria atual' : 'OK ou \u2192 carrega apenas a categoria selecionada') + '</div><div id="libgrid14">' + (!viewState.cat ? '<div class="contEmpty14">Nenhum catálogo pesado foi carregado.</div>' : '') + '</div></div>';
        base(h, '');
        var c = element('libcats14');
        if (c)
            c.onclick = function (e) {
                var z = e.target && e.target.getAttribute && e.target.getAttribute('data-ci');
                if (z != null)
                    loadLibrary(+z);
            };
        bindLibraryFocus();
        if (viewState.cat && viewState.items.length)
            drawLibraryGrid();
        focusLibCat();
        viewState.view = 'library';
    }
    function bindLibraryFocus() {
        var l = element('libcats14') ? element('libcats14').querySelectorAll('.cat14') : [], i;
        for (i = 0; i < l.length; i++)
            l[i].onfocus = function () {
                viewState.fcat = +this.getAttribute('data-ci');
            };
    }
    function focusLibCat() {
        var l = element('libcats14') ? element('libcats14').querySelectorAll('.cat14') : [], i;
        for (i = 0; i < l.length; i++)
            if (+l[i].getAttribute('data-ci') == viewState.fcat) {
                l[i].focus();
                return;
            }
        if (l.length)
            l[0].focus();
    }
    function refreshLibraryCategories() {
        var c = element('libcats14'), f = element('libcatfoot14'), l, i;
        if (!c)
            return false;
        c.innerHTML = catButtons('cat14');
        if (f)
            f.textContent = (viewState.cats.length ? viewState.cp * 8 + 1 : 0) + '\u2013' + Math.min(viewState.cats.length, viewState.cp * 8 + 8) + ' / ' + viewState.cats.length;
        c.onclick = function (e) {
            var z = e.target && e.target.getAttribute && e.target.getAttribute('data-ci');
            if (z != null)
                loadLibrary(+z);
        };
        bindLibraryFocus();
        l = c.querySelectorAll('.cat14');
        for (i = 0; i < l.length; i++)
            if (+l[i].getAttribute('data-ci') == viewState.fcat) {
                l[i].focus();
                break;
            }
        return true;
    }
    function refreshLibraryContent(focusRight, head31) {
        var body = element('r14body'), box = body && body.querySelector('.content14'), title = box && box.querySelector('.title14'), hint = box && box.querySelector('.hint14'), first;
        if (!box || !element('libgrid14'))
            return false;
        if (title)
            title.textContent = viewState.cat ? viewState.cat.n : contentTypeName(viewState.t);
        if (hint)
            hint.textContent = viewState.cat ? 'Conteúdo da categoria atual' : 'OK ou \u2192 carrega apenas a categoria selecionada';
        drawLibraryGrid();
        if (head31 && element(head31))
            element(head31).focus();
        else if (focusRight) {
            first = element('libgrid14').querySelector('button.card14');
            if (first)
                first.focus();
            else
                focusLibCat();
        }
        return true;
    }
    function loadLibrary(ix, focusRight) {
        var cat = viewState.cats[ix], g, rq;
        if (!cat)
            return;
        clearTimeout(viewState.catTimer);
        rq = ++viewState.libReq;
        viewState.fcat = ix;
        viewState.cat = cat;
        viewState.cp = Math.floor(ix / 8);
        viewState.items = [];
        viewState.detail = null;
        viewState.page = 0;
        refreshLibraryCategories();
        g = element('libgrid14');
        if (g) {
            g.innerHTML = skeleton19(10) + '<div class="foot14">Carregando ' + escapeHtml(cat.n) + '\u2026</div>';
            if (focusRight && element('skfirst19'))
                element('skfirst19').focus();
        }
        try {
            xtreamApi.log('UI32', 'FOCUS catálogo imediato \xB7 ' + viewState.t + ' \xB7 category_id=' + cat.id);
        } catch (y) {
        }
        viewState.catTimer = setTimeout(function () {
            var rr;
            if (!viewState.on || rq != viewState.libReq || !viewState.cat || String(viewState.cat.id) != String(cat.id))
                return;
            xtreamApi.cancel();
            xtreamApi.releaseItems();
            try {
                xtreamApi.log('UI32', 'REQUEST catálogo \xB7 ' + viewState.t + ' \xB7 category_id=' + cat.id + ' \xB7 req=' + rq);
            } catch (y) {
            }
            xtreamApi.items(viewState.t, cat, function (e, a) {
                if (!viewState.on || rq != viewState.libReq || !viewState.cat || String(viewState.cat.id) != String(cat.id)) {
                    try {
                        xtreamApi.log('UI32', 'STALE biblioteca descartado \xB7 category_id=' + cat.id + ' \xB7 req=' + rq);
                    } catch (y) {
                    }
                    return;
                }
                try {
                    xtreamApi.log('UI32', 'CALLBACK catálogo \xB7 ' + viewState.t + ' \xB7 category_id=' + cat.id + ' \xB7 ' + (e ? e : (a || []).length + ' itens'));
                } catch (y) {
                }
                if (e) {
                    rr = element('libgrid14');
                    if (rr)
                        rr.innerHTML = '<div class="err14">' + escapeHtml(e) + '</div>';
                    if (!root().contains(documentRef.activeElement) || documentRef.activeElement === documentRef.body)
                        focusLibCat();
                    return;
                }
                var head31 = documentRef.activeElement && documentRef.activeElement.parentNode == element('r14h') ? documentRef.activeElement.id : '';
                viewState.items = a || [];
                if (!refreshLibraryContent(focusRight, head31)) {
                    library();
                    if (head31 && element(head31))
                        element(head31).focus();
                    else if (focusRight && element('libgrid14') && element('libgrid14').querySelector('button.card14'))
                        element('libgrid14').querySelector('button.card14').focus();
                }
            });
        }, 140);
    }
    function pct(o) {
        var p = vodPlayer && vodPlayer.progress ? vodPlayer.progress(o) : null;
        return p && p.d ? Math.max(0, Math.min(100, Math.round(p.p / p.d * 100))) : 0;
    }
    var IQ27 = [], IT27 = 0, IA27 = null, IW31 = 0, navAt31 = 0;
    function abortImage(requeue) {
        var im = IA27;
        clearTimeout(IW31);
        IW31 = 0;
        IA27 = null;
        if (im) {
            im.onload = im.onerror = null;
            im.removeAttribute('src');
            if (requeue)
                IQ27.unshift(im);
        }
    }
    function cancelImages() {
        clearTimeout(IT27);
        IT27 = 0;
        abortImage(false);
        IQ27 = [];
    }
    function pauseImages() {
        clearTimeout(IT27);
        IT27 = 0;
        abortImage(true);
    }
    function resumeImages() {
        if (!viewState.on || IA27 || !IQ27.length)
            return;
        clearTimeout(IT27);
        navAt31 = 0;
        IT27 = setTimeout(loadNextImage, 60);
    }
    function loadNextImage() {
        var im, src, delay = 220 - (new Date().getTime() - navAt31);
        if (delay > 0) {
            IT27 = setTimeout(loadNextImage, delay);
            return;
        }
        if (!viewState.on || IA27 || !IQ27.length)
            return;
        im = IQ27.shift();
        if (!im || !im.parentNode) {
            IT27 = setTimeout(loadNextImage, 40);
            return;
        }
        src = im.getAttribute('data-src') || '';
        if (!src) {
            IT27 = setTimeout(loadNextImage, 40);
            return;
        }
        IA27 = im;
        function done(ok) {
            if (IA27 !== im)
                return;
            clearTimeout(IW31);
            IA27 = null;
            im.onload = im.onerror = null;
            im.removeAttribute('data-src');
            if (ok && im.getAttribute('data-logo42'))
                rememberChannelLogo(src);
            if (!ok) {
                im.removeAttribute('src');
                im.style.visibility = 'hidden';
            }
            IT27 = setTimeout(loadNextImage, 70);
        }
        im.onload = function () {
            done(true);
        };
        im.onerror = function () {
            done(false);
        };
        IW31 = setTimeout(function () {
            done(false);
        }, 4500);
        if ('decoding' in im)
            im.decoding = 'async';
        im.src = src;
    }
    function enqueueVisibleImages(box) {
        var a = box ? box.querySelectorAll('img[data-src]') : [], keep = [], i, j, seen;
        for (i = 0; i < IQ27.length; i++)
            if (IQ27[i] && IQ27[i].parentNode)
                keep.push(IQ27[i]);
        IQ27 = keep;
        for (i = 0; i < a.length; i++) {
            seen = 0;
            for (j = 0; j < IQ27.length; j++)
                if (IQ27[j] === a[i]) {
                    seen = 1;
                    break;
                }
            if (!seen)
                IQ27.push(a[i]);
        }
        if (!IA27) {
            clearTimeout(IT27);
            IT27 = setTimeout(loadNextImage, 120);
        }
    }
    function loadVisibleImages(box) {
        cancelImages();
        enqueueVisibleImages(box);
    }
    function prioritizeImage(button) {
        var im = button && button.querySelector ? button.querySelector('img[data-src]') : null, i;
        if (!im)
            return;
        for (i = 0; i < IQ27.length; i++)
            if (IQ27[i] === im) {
                IQ27.splice(i, 1);
                break;
            }
        IQ27.unshift(im);
        if (!IA27) {
            clearTimeout(IT27);
            IT27 = setTimeout(loadNextImage, 50);
        }
    }
    function handleImageNavigation() {
        navAt31 = new Date().getTime();
        if (!IA27) {
            clearTimeout(IT27);
            IT27 = setTimeout(loadNextImage, 220);
        }
    }
    function card(o, i) {
        var pc = pct(o), src = escapeHtml(asset(o.p || ''));
        return '<button class="card14 glass14" data-ii="' + i + '"><img data-src="' + src + '"><span class="fade14"></span><span class="name14">' + escapeHtml(o.n) + '</span>' + (pc ? '<span class="prog14"><i style="width:' + pc + '%"></i></span>' : '') + '</button>';
    }
    function drawLibraryGrid(noEnrich) {
        var g = element('libgrid14'), a = viewState.items, st = viewState.page * 10, i, h = '<div class="cards14">';
        if (!g)
            return;
        if (xtreamApi.ensureRange)
            xtreamApi.ensureRange(st, 10);
        for (i = st; i < a.length && i < st + 10; i++)
            h += card(a[i], i);
        h += '</div><div class="foot14">' + (a.length ? st + 1 : 0) + '\u2013' + Math.min(a.length, st + 10) + ' / ' + a.length + '</div>';
        g.innerHTML = h;
        loadVisibleImages(g);
        g.onclick = function (e) {
            var z = e.target;
            while (z && z != g && !(z.getAttribute && z.getAttribute('data-ii') != null))
                z = z.parentNode;
            if (z && z.getAttribute && z.getAttribute('data-ii') != null)
                item(a[+z.getAttribute('data-ii')]);
        };
        hideBroken();
    }
    function prepareDetail(label) {
        viewState.view = 'prepare';
        base('<div class="prep25"><div class="p27bar"><div class="p27line"></div><div class="p27line s"></div><div class="hint14">' + escapeHtml(label || 'Preparando conteúdo\u2026') + '</div><button id="prepareBack31" class="gb14">\u2190 Voltar</button></div></div>', 'prepare27');
        element('prepareBack31').onclick = back;
        element('prepareBack31').focus();
    }
    function mergeDetailMetadata(a, b) {
        var k;
        if (!a)
            return b || {};
        if (!b)
            return a;
        for (k in b)
            if (b.hasOwnProperty(k))
                a[k] = b[k];
        return a;
    }
    var art31 = [], artTimer31 = 0, artGeneration = 0;
    function cancelArtwork() {
        artGeneration++;
        clearTimeout(artTimer31);
        var i;
        for (i = 0; i < art31.length; i++) {
            art31[i].onload = art31[i].onerror = null;
            art31[i].removeAttribute('src');
        }
        art31 = [];
    }
    function preloadArtwork(item, callback) {
        var source = item.tmdbBg || item.bg || '', image, finished = false, generation = artGeneration;
        if (!source || item._bgNode29 || art31.length) {
            if (callback)
                callback();
            return;
        }
        image = new Image();
        art31.push(image);
        function finish(ok) {
            if (finished || generation !== artGeneration)
                return;
            finished = true;
            clearTimeout(artTimer31);
            image.onload = image.onerror = null;
            art31 = [];
            if (ok)
                item._bgNode29 = image;
            else
                image.removeAttribute('src');
            if (callback)
                callback();
        }
        image.onload = function () {
            finish(true);
        };
        image.onerror = function () {
            finish(false);
        };
        artTimer31 = setTimeout(function () {
            finish(false);
        }, 8000);
        if ('decoding' in image)
            image.decoding = 'async';
        image.src = asset(source, 'backdrop');
    }
    function patchDetailArtwork(request, item, type) {
        if (!viewState.on || request !== viewState.detailReq || viewState.detail !== item || vodPlayer && vodPlayer.active && vodPlayer.active())
            return;
        var host = element('r14body').querySelector(type === 'm' ? '.movie19' : '.series19'), image = item._bgNode29;
        if (host && image && !image.parentNode) {
            image.className = 'detailBg29';
            host.insertBefore(image, host.firstChild);
        }
    }
    function finishDetailPreparation(request, item, type) {
        if (!viewState.on || request !== viewState.detailReq)
            return;
        viewState.detail = item;
        if (type === 'm')
            detailMovie(item, 1);
        else {
            viewState.season = 0;
            episodes(item, 0, 1);
        }
        preloadArtwork(item, function () {
            patchDetailArtwork(request, item, type);
        });
    }
    var ARTK34 = 'xtream.art.urls.v34';
    function artworkKey(o, t) {
        return String(t || o && o.t || '') + ':' + String(o && o.id != null ? o.id : '');
    }
    function restoreArtwork(o, t) {
        var c = loadj(ARTK34, {
                m: {},
                o: []
            }), r, k;
        if (!o)
            return o;
        k = artworkKey(o, t);
        r = c.m && c.m[k];
        if (r) {
            if (!o.tmdbBg && !o.bg && r.bg)
                o.tmdbBg = r.bg;
            if (!o.tmdbLogo && !o.logo && r.logo)
                o.tmdbLogo = r.logo;
            if (!o.p && r.p)
                o.p = r.p;
        }
        return o;
    }
    function rememberArtwork(o, t) {
        var c = loadj(ARTK34, {
                m: {},
                o: []
            }), k, i, n = [];
        if (!o)
            return;
        k = artworkKey(o, t);
        if (!k || k == ':')
            return;
        if (!c.m)
            c.m = {};
        if (!c.o)
            c.o = [];
        c.m[k] = {
            bg: o.tmdbBg || o.bg || '',
            logo: o.tmdbLogo || o.logo || '',
            p: o.p || '',
            ts: new Date().getTime()
        };
        for (i = 0; i < c.o.length; i++)
            if (c.o[i] != k && c.m[c.o[i]])
                n.push(c.o[i]);
        n.push(k);
        while (n.length > 30) {
            i = n.shift();
            delete c.m[i];
        }
        c.o = n;
        savej(ARTK34, c);
    }
    function item(item) {
        var request = ++viewState.detailReq, type = item.t, object = restoreArtwork(item, type);
        viewState.detail = object;
        prepareDetail(type === 'm' ? 'Preparando filme\u2026' : 'Preparando série\u2026');
        function valid() {
            return viewState.on && request === viewState.detailReq && !(vodPlayer && vodPlayer.active && vodPlayer.active());
        }
        function metadataReady(error, details) {
            if (!valid())
                return;
            if (error) {
                wait(error);
                return;
            }
            object = mergeDetailMetadata(object, details || item);
            restoreArtwork(object, type);
            rememberArtwork(object, type);
            finishDetailPreparation(request, object, type);
            if (M && (!object.ds || !(object.tmdbBg || object.bg)))
                M.enrich(object, type, function () {
                    if (!valid() || viewState.detail !== object)
                        return;
                    var body = element('r14body'), synopsis = body.querySelector('.syn14, .seriesSyn19');
                    if (synopsis && object.ds)
                        synopsis.textContent = object.ds;
                    var heading = body.querySelector('.movieInfo19 h1, .seriesLeft19 h1'), facts = body.querySelector('.movieInfo19 .hint14, .seriesLeft19 .hint14');
                    if (heading && object.tmdbTitle)
                        heading.textContent = object.tmdbTitle;
                    if (facts)
                        facts.textContent = (object.y || '\u2014') + ' \xB7 \u2605 ' + (object.tmdbRating || object.r || '\u2014');
                    rememberArtwork(object, type);
                    preloadArtwork(object, function () {
                        patchDetailArtwork(request, object, type);
                    });
                });
        }
        if (type === 'm')
            xtreamApi.vod(item, metadataReady);
        else
            xtreamApi.series(item, metadataReady);
    }
    function installResumeDialogStyles() {
        if (element('r34css'))
            return;
        var s = documentRef.createElement('style');
        s.id = 'r34css';
        s.textContent = '#resume34{position:fixed;z-index:900;left:0;top:0;width:1280px;height:720px;background:rgba(0,0,0,.68)}' + '#resume34box{position:absolute;left:360px;top:236px;width:560px;min-height:210px;padding:28px 30px;background:#11181d;border:1px solid #909aa1;border-radius:14px;box-sizing:border-box;box-shadow:0 18px 50px rgba(0,0,0,.6)}' + '#resume34box h2{margin:0 0 12px;font:25px Arial;color:#fff}' + '#resume34box p{margin:0 0 24px;color:#cbd2d7;font:16px Arial}' + '#resume34box button{display:inline-block;min-width:210px;height:46px;margin-right:12px;background:#1a2228;color:#fff;border:1px solid #8f9aa1;border-radius:9px;font:16px Arial}' + '#resume34box button:focus{outline:0;border:2px solid #fff;box-shadow:0 0 0 2px rgba(255,255,255,.15)}' + '#busy34{position:fixed;z-index:880;left:0;top:0;width:1280px;height:720px;background:rgba(0,0,0,.38);pointer-events:none}' + '#busy34 span{position:absolute;left:430px;top:326px;width:420px;padding:16px;text-align:center;background:rgba(15,22,27,.96);border:1px solid #7f898f;border-radius:10px;color:#fff;font:17px Arial}';
        documentRef.head.appendChild(s);
    }
    function formatResumeTime(n) {
        n = Math.max(0, parseInt(n, 10) || 0);
        var h = Math.floor(n / 3600), m = Math.floor(n % 3600 / 60), s = n % 60;
        return (h ? h + ':' : '') + (h && m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }
    function showBusyOverlay(on, msg) {
        var z = element('busy34');
        if (z && z.parentNode)
            z.parentNode.removeChild(z);
        if (!on)
            return;
        z = documentRef.createElement('div');
        z.id = 'busy34';
        z.innerHTML = '<span>' + escapeHtml(msg || 'Carregando\u2026') + '</span>';
        root().appendChild(z);
    }
    function closeResumeDialog(choice) {
        var z = element('resume34'), y = viewState.promptYes, n = viewState.promptNo, f = viewState.promptFocus;
        viewState.prompt = 0;
        viewState.promptYes = viewState.promptNo = viewState.promptFocus = null;
        if (z && z.parentNode)
            z.parentNode.removeChild(z);
        if (choice === 1) {
            if (y)
                y();
            return;
        }
        if (choice === 0) {
            if (n)
                n();
            return;
        }
        if (f && f.parentNode)
            f.focus();
    }
    function promptResume(name, pos, yes, no) {
        var z;
        if (!(pos >= 5)) {
            if (no)
                no();
            return;
        }
        closeResumeDialog();
        viewState.prompt = 1;
        viewState.promptFocus = documentRef.activeElement;
        viewState.promptYes = yes;
        viewState.promptNo = no;
        z = documentRef.createElement('div');
        z.id = 'resume34';
        z.innerHTML = '<div id="resume34box"><h2>Continuar assistindo?</h2><p>Você quer continuar de onde você parou? \xB7 ' + escapeHtml(formatResumeTime(pos)) + '</p><button id="resume34yes">Sim, continuar</button><button id="resume34no">Não, do início</button></div>';
        root().appendChild(z);
        element('resume34yes').onclick = function () {
            closeResumeDialog(1);
        };
        element('resume34no').onclick = function () {
            closeResumeDialog(0);
        };
        element('resume34yes').focus();
    }
    function restoreDetailAfterPlayback(mode, focusNode) {
        if (!viewState.on)
            return;
        show(mode || '');
        showBusyOverlay(0);
        resumeImages();
        if (focusNode && focusNode.parentNode)
            focusNode.focus();
        else if (viewState.view == 'detail' && element('play14'))
            element('play14').focus();
        else if (viewState.view == 'episodes' && element('eg14') && element('eg14').querySelector('.ep14'))
            element('eg14').querySelector('.ep14').focus();
        else if (viewState.view == 'continue' || viewState.view == 'favorites')
            focusSpecialTab();
    }
    function detailMovie(o, doneMeta) {
        var art = o._bgNode29;
        if (art && art.parentNode)
            art.parentNode.removeChild(art);
        art = o._logoNode29;
        if (art && art.parentNode)
            art.parentNode.removeChild(art);
        rememberArtwork(o, 'm');
        var p = vodPlayer && vodPlayer.progress ? vodPlayer.progress(o) : null, pc = p && p.d ? Math.round(p.p / p.d * 100) : 0, hasp = p && p.p >= 5, lg = o.tmdbLogo || o.logo || '', rt = o.tmdbRating || o.r || '', ttl = o._logoNode29 && lg ? '<span id="d29logo" class="detailLogoHost29"></span>' : '<h1>' + escapeHtml(o.tmdbTitle || o.n) + '</h1>', src = o.tmdbUsed ? '<div class="tmdb19">TMDB' + (rt ? ' \xB7 \u2605 ' + escapeHtml(String(Math.round(rt * 10) / 10)) : '') + '</div>' : '';
        viewState.detail = o;
        viewState.view = 'detail';
        base('<div class="movie19"><div class="movieInfo19">' + ttl + '<div class="hint14">' + escapeHtml(o.y || '\u2014') + ' \xB7 \u2605 ' + escapeHtml(rt || '\u2014') + '</div><p class="syn14">' + escapeHtml(o.ds || 'Sinopse não fornecida.') + '</p><div class="actions14"><button id="db14" class="gb14">\u2190 Voltar</button><button id="play14" class="gb14">' + (hasp ? '\u25B6 Continuar' + (pc ? ' \xB7 ' + pc + '%' : ' \xB7 ' + Math.floor(p.p) + 's') : '\u25B6 Assistir') + '</button><button id="fav14" class="gb14">' + (isFav('m', o) ? '\u2605 Favorito' : '\u2606 Favorito') + '</button></div>' + src + '</div></div>', 'detail27');
        var box = element('r14body').querySelector('.movie19'), lh = element('d29logo');
        if (o._bgNode29 && box) {
            o._bgNode29.className = 'detailBg29';
            box.insertBefore(o._bgNode29, box.firstChild);
        }
        if (o._logoNode29 && lh) {
            o._logoNode29.className = 'movieLogo19';
            lh.appendChild(o._logoNode29);
        }
        element('db14').onclick = back;
        element('play14').onclick = function () {
            if (hasp)
                promptResume(o.n, p.p, function () {
                    playMovie(o, p.p);
                }, function () {
                    playMovie(o, 0);
                });
            else
                playMovie(o, 0);
        };
        element('fav14').onclick = function () {
            this.textContent = toggleFav('m', o) ? '\u2605 Favorito' : '\u2606 Favorito';
        };
        hideBroken();
        element('db14').focus();
    }
    function playMovie(o, resume, returnFn) {
        closeLiveDiagnostics();
        var focusNode = documentRef.activeElement, mode = viewState.view == 'detail' ? 'detail27' : '';
        pauseImages();
        cancelArtwork();
        if (M && M.cancel)
            M.cancel();
        try {
            xtreamApi.log('UI34', 'PLAY movie request \xB7 id=' + o.id + ' \xB7 container=' + (o.ext || '\u2014') + ' \xB7 resume=' + (resume || 0));
        } catch (e) {
        }
        if (!vodPlayer) {
            try {
                xtreamApi.log('UI34', 'PLAY movie abortado \xB7 player VOD ausente');
            } catch (e) {
            }
            resumeImages();
            return;
        }
        root().className = 'h';
        vodPlayer.play(o, {
            resumeAt: resume || 0,
            onExit: function () {
                if (returnFn)
                    returnFn(focusNode);
                else
                    restoreDetailAfterPlayback(mode, focusNode);
            },
            onLog: function () {
                show();
                logs();
            }
        });
    }
    function epCard(x, i) {
        var pc = pct(x), src = x.p ? escapeHtml(asset(x.p)) : '';
        return '<button class="ep14 glass14" data-ii="' + i + '">' + (src ? '<img data-src="' + src + '">' : '<div class="mono14" style="margin:25px auto">E' + escapeHtml(x.ep || i + 1) + '</div>') + '<span class="epflare14"></span><span class="eplabel14">T' + (x.sn || 1) + ' E' + (x.ep || i + 1) + ' \xB7 ' + escapeHtml(x.n) + '</span>' + (pc ? '<span class="prog14"><i style="width:' + pc + '%"></i></span>' : '') + '</button>';
    }
    function renderSeasons(o) {
        var a = o.eps || [], seen = {}, s = [], i;
        for (i = 0; i < a.length; i++)
            if (!seen[a[i].sn || 1]) {
                seen[a[i].sn || 1] = 1;
                s.push(a[i].sn || 1);
            }
        s.sort(function (a, b) {
            return a - b;
        });
        return s;
    }
    function episodes(o, p, doneMeta) {
        var all = o.eps || [], ss = renderSeasons(o), sn = viewState.season || ss[0] || 1, a = [], i, st = (p || 0) * 6, h, rt = o.tmdbRating || o.r || '', lg = o.tmdbLogo || o.logo || '';
        rememberArtwork(o, 's');
        viewState.season = sn;
        for (i = 0; i < all.length; i++)
            if ((all[i].sn || 1) == sn)
                a.push(all[i]);
        h = '<div class="series19"><div class="seriesLeft19">' + (o._logoNode29 && lg ? '<span id="s29logo" class="detailLogoHost29"></span>' : '<h1>' + escapeHtml(o.tmdbTitle || o.n) + '</h1>') + '<div class="hint14">' + (rt ? '\u2605 ' + escapeHtml(String(Math.round(rt * 10) / 10)) : '') + '</div><div class="seriesSyn19">' + escapeHtml(cut19(o.ds || 'Sinopse não fornecida.', 200)) + '</div><div class="actions14"><button id="eb14" class="gb14">\u2190 Voltar</button><button id="sfav14" class="gb14">' + (isFav('s', o) ? '\u2605' : '\u2606') + '</button></div><div class="hint14">Temporadas</div><div id="seasons19" class="seasons19">';
        for (i = 0; i < ss.length; i++)
            h += '<button class="season19 gb14' + (ss[i] == sn ? ' sel' : '') + '" data-sn="' + ss[i] + '">Temporada ' + ss[i] + '</button>';
        h += '</div>' + (o.tmdbUsed ? '<div class="tmdb19">TMDB' + (rt ? ' \xB7 \u2605 ' + escapeHtml(String(Math.round(rt * 10) / 10)) : '') + '</div>' : '') + '</div><div class="seriesRight19"><div class="episodeTitle19">Episódios \xB7 Temporada ' + sn + '</div><div id="eg14" class="epgrid14">';
        for (i = st; i < a.length && i < st + 6; i++)
            h += epCard(a[i], i);
        h += '</div><div class="foot14">' + (a.length ? st + 1 : 0) + '\u2013' + Math.min(a.length, st + 6) + ' / ' + a.length + '</div></div></div>';
        base(h, 'detail27');
        var box = element('r14body').querySelector('.series19'), lh = element('s29logo');
        if (o._bgNode29 && box) {
            var bg = o._bgNode29.cloneNode(false);
            bg.className = 'detailBg29';
            box.insertBefore(bg, box.firstChild);
        }
        if (o._logoNode29 && lh) {
            var lo = o._logoNode29.cloneNode(false);
            lo.className = 'movieLogo19';
            lo.style.maxWidth = '350px';
            lo.style.marginTop = '0px';
            lh.appendChild(lo);
        }
        element('eb14').onclick = back;
        element('sfav14').onclick = function () {
            this.textContent = toggleFav('s', o) ? '\u2605' : '\u2606';
        };
        element('seasons19').onclick = function (e) {
            var z = e.target && e.target.getAttribute && e.target.getAttribute('data-sn');
            if (z) {
                viewState.season = +z;
                viewState.page = 0;
                episodes(o, 0, 1);
            }
        };
        element('eg14').onclick = function (e) {
            var z = e.target;
            while (z && z != element('eg14') && !(z.getAttribute && z.getAttribute('data-ii') != null))
                z = z.parentNode;
            if (z && z.getAttribute && z.getAttribute('data-ii') != null) {
                var ix = +z.getAttribute('data-ii'), pr = vodPlayer && vodPlayer.progress ? vodPlayer.progress(a[ix]) : null;
                if (pr && pr.p >= 5)
                    promptResume(a[ix].n, pr.p, function () {
                        playEpisode(a[ix], a, ix, o, pr.p);
                    }, function () {
                        playEpisode(a[ix], a, ix, o, 0);
                    });
                else
                    playEpisode(a[ix], a, ix, o, 0);
            }
        };
        hideBroken();
        loadVisibleImages(element('eg14'));
        var sf = element('seasons19').querySelectorAll('.season19'), j;
        for (j = 0; j < sf.length; j++)
            sf[j].onfocus = function () {
                var box = this.parentNode, r = this.getBoundingClientRect(), br = box.getBoundingClientRect();
                if (r.top < br.top)
                    box.scrollTop += r.top - br.top;
                else if (r.bottom > br.bottom)
                    box.scrollTop += r.bottom - br.bottom;
            };
        for (j = 0; j < sf.length; j++)
            if (+sf[j].getAttribute('data-sn') == sn) {
                sf[j].focus();
                break;
            }
        viewState.view = 'episodes';
        viewState.epsPage = p || 0;
        viewState.page = p || 0;
    }
    function playEpisode(ep, list, index, series, resume, returnFn) {
        closeLiveDiagnostics();
        var focusNode = documentRef.activeElement, mode = viewState.view == 'episodes' ? 'detail27' : '';
        pauseImages();
        cancelArtwork();
        if (M && M.cancel)
            M.cancel();
        try {
            xtreamApi.log('UI34', 'PLAY episode request \xB7 series_id=' + series.id + ' \xB7 episode_id=' + ep.id + ' \xB7 container=' + (ep.ext || '\u2014') + ' \xB7 resume=' + (resume || 0));
        } catch (e) {
        }
        if (!vodPlayer) {
            try {
                xtreamApi.log('UI34', 'PLAY episode abortado \xB7 player VOD ausente');
            } catch (e) {
            }
            resumeImages();
            return;
        }
        root().className = 'h';
        vodPlayer.play(ep, {
            list: list,
            index: index,
            series: series,
            resumeAt: resume || 0,
            onExit: function () {
                if (returnFn)
                    returnFn(focusNode);
                else
                    restoreDetailAfterPlayback(mode, focusNode);
            },
            onLog: function () {
                show();
                logs();
            }
        });
    }
    function favoriteItems(t) {
        return favs()[t] || [];
    }
    function favorites() {
        viewState.specialReq34++;
        showBusyOverlay(0);
        closeLiveDiagnostics();
        stopLive();
        if (vodPlayer && vodPlayer.active && vodPlayer.active())
            vodPlayer.stop();
        viewState.view = 'favorites';
        viewState.favType = viewState.favType || 'm';
        drawSpecial('Favoritos', viewState.favType, favoriteItems(viewState.favType), 0);
    }
    function continueView() {
        viewState.specialReq34++;
        showBusyOverlay(0);
        closeLiveDiagnostics();
        stopLive();
        if (vodPlayer && vodPlayer.active && vodPlayer.active())
            vodPlayer.stop();
        viewState.view = 'continue';
        viewState.contType = viewState.contType || 'm';
        drawContinue();
    }
    function drawSpecial(title, t, a, iscont) {
        var i, h = '<div class="catcol14"><div class="title14">' + escapeHtml(title) + '</div><button class="tab14 glass14' + (t == 'm' ? ' sel' : '') + '" data-sp="m">Filmes</button><button class="tab14 glass14' + (t == 's' ? ' sel' : '') + '" data-sp="s">Séries</button>' + (title == 'Favoritos' ? '<button class="tab14 glass14' + (t == 'c' ? ' sel' : '') + '" data-sp="c">Canais</button>' : '') + '</div><div class="content14"><div class="title14">' + escapeHtml(t == 'm' ? 'Filmes' : t == 's' ? 'Séries' : 'Canais') + '</div><div id="spg14" class="cards14">';
        for (i = 0; i < a.length && i < 8; i++) {
            var o = a[i], pc = iscont && o.dur ? Math.round(o.pos / o.dur * 100) : 0;
            h += '<button class="card14 glass14" data-si="' + i + '">' + (o.p ? '<img data-src="' + escapeHtml(asset(o.p)) + '">' : '<div class="mono14" style="margin:70px auto">' + mono(o.n) + '</div>') + '<span class="fade14"></span><span class="name14">' + escapeHtml(o.n) + '</span>' + (pc ? '<span class="prog14"><i style="width:' + pc + '%"></i></span>' : '') + '</button>';
        }
        h += '</div>' + (a.length ? '' : '<div class="contEmpty14">Nada salvo aqui ainda.</div>') + '</div>';
        base(h, '');
        var tabs = element('r14body').querySelectorAll('.tab14'), j, chosen = null;
        for (j = 0; j < tabs.length; j++) {
            tabs[j].onclick = specialTab;
            if (tabs[j].getAttribute('data-sp') == t)
                chosen = tabs[j];
        }
        element('spg14').onclick = function (e) {
            var z = e.target;
            while (z && z != element('spg14') && !(z.getAttribute && z.getAttribute('data-si') != null))
                z = z.parentNode;
            if (z && z.getAttribute && z.getAttribute('data-si') != null)
                specialOpen(t, a[+z.getAttribute('data-si')], !!iscont);
        };
        hideBroken();
        loadVisibleImages(element('spg14'));
        if (chosen)
            chosen.focus();
        else if (tabs.length)
            tabs[0].focus();
    }
    function specialTab() {
        var t = this.getAttribute('data-sp');
        if (viewState.view == 'continue') {
            viewState.contType = t;
            drawContinue();
        } else {
            viewState.favType = t;
            drawSpecial('Favoritos', t, favoriteItems(t), 0);
        }
    }
    function drawContinue() {
        var a = vodPlayer && vodPlayer.continueList ? vodPlayer.continueList(viewState.contType) : [];
        drawSpecial('Continuar assistindo', viewState.contType, a, 1);
        viewState.view = 'continue';
    }
    function specialOpen(t, o, iscont) {
        var focusNode = documentRef.activeElement, pr, rq = ++viewState.specialReq34, view = viewState.view;
        if (!o)
            return;
        if (t == 'c') {
            viewState.t = 'c';
            viewState.cats = [];
            viewState.items = [o];
            viewState.preview = o;
            viewState.previewIndex = 0;
            viewState.collapsed = 1;
            viewState.preview._playing = 1;
            startLive(o, 0);
            liveHub();
            return;
        }
        if (t == 'm') {
            var m = {
                t: 'm',
                id: o.id,
                n: o.n,
                p: o.p,
                ext: o.ext,
                y: o.y,
                r: o.r,
                ds: o.ds
            };
            if (iscont) {
                playMovie(m, o.pos || 0, function () {
                    restoreDetailAfterPlayback('', focusNode);
                });
                return;
            }
            pr = vodPlayer && vodPlayer.progress ? vodPlayer.progress(m) : null;
            if (pr && pr.p >= 5)
                promptResume(m.n, pr.p, function () {
                    playMovie(m, pr.p, function () {
                        restoreDetailAfterPlayback('', focusNode);
                    });
                }, function () {
                    playMovie(m, 0, function () {
                        restoreDetailAfterPlayback('', focusNode);
                    });
                });
            else
                playMovie(m, 0, function () {
                    restoreDetailAfterPlayback('', focusNode);
                });
            return;
        }
        var ser = {
            t: 's',
            id: o.id,
            n: o.n,
            p: o.p,
            y: o.y,
            r: o.r,
            ds: o.ds
        };
        showBusyOverlay(1, 'Carregando episódio\u2026');
        xtreamApi.series(ser, function (e, x) {
            var a, ix = 0, i, ep, epr;
            showBusyOverlay(0);
            if (!viewState.on || rq != viewState.specialReq34 || viewState.view != view || !focusNode || !focusNode.parentNode)
                return;
            if (e) {
                wait(e);
                return;
            }
            a = x.eps || [];
            if (iscont && o.episode_id != null)
                for (i = 0; i < a.length; i++)
                    if (String(a[i].id) == String(o.episode_id)) {
                        ix = i;
                        break;
                    }
            ep = a[ix] || o.episode;
            if (!ep)
                return;
            if (iscont) {
                playEpisode(ep, a, ix, x, o.pos || 0, function () {
                    restoreDetailAfterPlayback('', focusNode);
                });
                return;
            }
            epr = vodPlayer && vodPlayer.progress ? vodPlayer.progress(ep) : null;
            if (epr && epr.p >= 5)
                promptResume(ep.n, epr.p, function () {
                    playEpisode(ep, a, ix, x, epr.p, function () {
                        restoreDetailAfterPlayback('', focusNode);
                    });
                }, function () {
                    playEpisode(ep, a, ix, x, 0, function () {
                        restoreDetailAfterPlayback('', focusNode);
                    });
                });
            else
                playEpisode(ep, a, ix, x, 0, function () {
                    restoreDetailAfterPlayback('', focusNode);
                });
        });
    }
    function logs() {
        var lb;
        viewState.lastView = viewState.view;
        show();
        viewState.view = 'log';
        viewState.lm = 0;
        base('<h2 class="title14">Log de rede</h2><div class="hint14">Release ' + escapeHtml(remoteTV && remoteTV.release || '\u2014') + ' \xB7 versão ' + escapeHtml(remoteTV && (remoteTV.version || remoteTV.remoteVersion) || '\u2014') + '</div><pre id="l14" tabindex="0">' + escapeHtml(function () {
            try {
                return localStorage.getItem('rawnetlog.v1') || '';
            } catch (e) {
                return '';
            }
        }() || 'Nenhum evento registrado.') + '</pre><button id="cl14" class="gb14">Limpar log</button><div class="foot14">\u2191 seleciona \xB7 OK entra/sai \xB7 \u2191\u2193 rolam \xB7 \u2190/\u2192 saem</div>', '');
        element('cl14').onclick = function () {
            try {
                localStorage.setItem('rawnetlog.v1', '');
            } catch (e) {
            }
            xtreamApi.log('LOG', 'log limpo');
            logs();
        };
        element('cl14').focus();
        lb = element('l14');
        if (lb)
            lb.scrollTop = lb.scrollHeight;
        xtreamApi.onlog = function (v) {
            var b = element('l14');
            if (b) {
                b.textContent = v.join('\n');
                if (!viewState.lm)
                    b.scrollTop = b.scrollHeight;
            }
        };
    }
    function restoreLog() {
        xtreamApi.onlog = null;
        if (viewState.lastView == 'live') {
            liveHub();
            return;
        }
        if (viewState.lastView == 'library') {
            library();
            return;
        }
        if (viewState.lastView == 'detail' && viewState.detail) {
            detailMovie(viewState.detail);
            return;
        }
        if (viewState.lastView == 'episodes' && viewState.detail) {
            episodes(viewState.detail, viewState.epsPage);
            return;
        }
        if (viewState.lastView == 'favorites') {
            favorites();
            return;
        }
        if (viewState.lastView == 'continue') {
            continueView();
            return;
        }
        type(viewState.t);
    }
    function exitToMenu() {
        close();
        if (windowRef.RawPlayer && windowRef.RawPlayer.exit)
            windowRef.RawPlayer.exit();
    }
    function close() {
        viewState.specialReq34++;
        showBusyOverlay(0);
        if (viewState.prompt)
            closeResumeDialog();
        closeLiveDiagnostics();
        viewState.on = 0;
        viewState.req++;
        viewState.libReq++;
        viewState.detailReq++;
        cancelArtwork();
        cancelImages();
        if (M && M.cancel)
            M.cancel();
        stopLive();
        if (vodPlayer && vodPlayer.active && vodPlayer.active())
            vodPlayer.stop();
        xtreamApi.cancel();
        xtreamApi.releaseItems();
        xtreamApi.onlog = null;
        viewState.on = 0;
        viewState.items = [];
        if (viewState.detail)
            xtreamApi.releaseEpisodes(viewState.detail);
        viewState.detail = null;
        clearImgs(element('r14body'));
        element('r14body').innerHTML = '';
        root().className = 'h';
        showBase();
    }
    function back() {
        viewState.specialReq34++;
        showBusyOverlay(0);
        if (!viewState.on)
            return false;
        viewState.detailReq++;
        cancelArtwork();
        if (M && M.cancel)
            M.cancel();
        if (viewState.full) {
            exitFullLive();
            return true;
        }
        if (vodPlayer && vodPlayer.active && vodPlayer.active()) {
            vodPlayer.stop();
            return true;
        }
        if (viewState.view == 'log') {
            if (viewState.lm) {
                viewState.lm = 0;
                element('l14').className = '';
                element('cl14').focus();
                return true;
            }
            restoreLog();
            return true;
        }
        if (viewState.view == 'live') {
            if (viewState.collapsed) {
                expandCats();
                return true;
            }
            close();
            return true;
        }
        if (viewState.view == 'detail' || viewState.view == 'episodes' || viewState.view == 'prepare') {
            xtreamApi.cancel();
            if (viewState.detail && viewState.detail.t == 's')
                xtreamApi.releaseEpisodes(viewState.detail);
            viewState.detail = null;
            library();
            return true;
        }
        if (viewState.view == 'library') {
            if (viewState.cat) {
                viewState.libReq++;
                clearTimeout(viewState.catTimer);
                xtreamApi.releaseItems();
                viewState.items = [];
                viewState.cat = null;
                library();
                return true;
            }
            close();
            return true;
        }
        if (viewState.view == 'favorites' || viewState.view == 'continue') {
            close();
            return true;
        }
        close();
        return true;
    }
    function moveCat(k, live) {
        var list = element(live ? 'lc14' : 'libcats14'), l = list ? list.querySelectorAll('.cat14') : [], o = documentRef.activeElement, ix = viewState.fcat, n, np, j, nl;
        if (o)
            for (j = 0; j < l.length; j++)
                if (l[j] == o) {
                    ix = +l[j].getAttribute('data-ci');
                    break;
                }
        n = ix + (k == 38 ? -1 : 1);
        if (n < 0 || n >= viewState.cats.length)
            return true;
        viewState.fcat = n;
        np = Math.floor(n / 8);
        if (np != viewState.cp) {
            viewState.cp = np;
            if (live)
                liveHub();
            else if (!refreshLibraryCategories())
                library();
            nl = element(live ? 'lc14' : 'libcats14').querySelectorAll('.cat14');
            for (j = 0; j < nl.length; j++)
                if (+nl[j].getAttribute('data-ci') == n) {
                    nl[j].focus();
                    break;
                }
        } else {
            for (j = 0; j < l.length; j++)
                if (+l[j].getAttribute('data-ci') == n) {
                    l[j].focus();
                    break;
                }
        }
        return true;
    }
    function moveGrid(g, o, k, a, pageSize, draw, cols) {
        var l = g.querySelectorAll(k && /ep14/.test(o.className || '') ? '.ep14' : '.card14'), i, ix;
        for (i = 0; i < l.length; i++)
            if (l[i] == o) {
                ix = i;
                break;
            }
        if (ix == null)
            return false;
        if (k == 37 && ix % cols > 0) {
            l[ix - 1].focus();
            return true;
        }
        if (k == 39 && ix % cols < cols - 1 && ix + 1 < l.length) {
            l[ix + 1].focus();
            return true;
        }
        if (k == 38 && ix >= cols) {
            l[ix - cols].focus();
            return true;
        }
        if (k == 40 && ix + cols < l.length) {
            l[ix + cols].focus();
            return true;
        }
        if (k == 40 && (viewState.page + 1) * pageSize < a.length) {
            viewState.page++;
            draw();
            g = element('eg14') || element('libgrid14');
            if (g) {
                l = g.querySelectorAll('.ep14,.card14');
                if (l.length)
                    l[Math.min(ix % cols, l.length - 1)].focus();
            }
            return true;
        }
        if (k == 38 && viewState.page > 0) {
            viewState.page--;
            draw();
            g = element('eg14') || element('libgrid14');
            l = g.querySelectorAll('.ep14,.card14');
            if (l.length)
                l[Math.min(l.length - 1, Math.floor((l.length - 1) / cols) * cols + ix % cols)].focus();
            return true;
        }
        return false;
    }
    function focusSpecialTab() {
        var b = element('r14body'), l = b ? b.querySelectorAll('.tab14') : [], want = viewState.view == 'continue' ? viewState.contType : viewState.favType, i;
        for (i = 0; i < l.length; i++)
            if (l[i].getAttribute('data-sp') == want) {
                l[i].focus();
                return true;
            }
        if (l.length) {
            l[0].focus();
            return true;
        }
        return false;
    }
    function focusCurrentHeader() {
        var id = viewState.view == 'continue' ? 'hct14' : viewState.view == 'favorites' ? 'hf14' : viewState.view == 'log' ? 'r14log' : viewState.t == 'c' ? 'hc14' : viewState.t == 'm' ? 'hm14' : 'hs14', z = element(id) || element('r14back');
        if (z) {
            z.focus();
            return true;
        }
        return false;
    }
    function moveSpecialCard(o, k) {
        var g = element('spg14'), l = g ? g.querySelectorAll('.card14') : [], i, n, cols = 5;
        if (!l.length)
            return true;
        for (i = 0; i < l.length; i++)
            if (l[i] == o)
                break;
        if (i >= l.length)
            return true;
        if (k == 37) {
            if (i % cols == 0)
                focusSpecialTab();
            else
                l[i - 1].focus();
            return true;
        }
        if (k == 39) {
            if (i % cols < cols - 1 && i + 1 < l.length)
                l[i + 1].focus();
            return true;
        }
        if (k == 38) {
            if (i < cols)
                focusCurrentHeader();
            else
                l[i - cols].focus();
            return true;
        }
        if (k == 40) {
            n = i + cols;
            if (n < l.length)
                l[n].focus();
            return true;
        }
        return false;
    }
    function focusHeader() {
        focusCurrentHeader();
    }
    function focusContentFromHeader() {
        var z;
        if (viewState.view == 'live') {
            if (viewState.collapsed)
                focusChannel();
            else
                focusLiveCat();
            return true;
        }
        if (viewState.view == 'library') {
            focusLibCat();
            return true;
        }
        if (viewState.view == 'continue' || viewState.view == 'favorites')
            return focusSpecialTab();
        if (viewState.view == 'episodes') {
            z = element('eb14') || element('seasons19') && element('seasons19').querySelector('.season19') || element('eg14') && element('eg14').querySelector('.ep14');
            if (z) {
                z.focus();
                return true;
            }
        }
        if (viewState.view == 'detail') {
            z = element('db14') || element('play14') || element('fav14');
            if (z) {
                z.focus();
                return true;
            }
        }
        if (viewState.view == 'prepare' && element('prepareBack31')) {
            element('prepareBack31').focus();
            return true;
        }
        if (viewState.view == 'log' && element('cl14')) {
            element('cl14').focus();
            return true;
        }
        z = element('r14body') && element('r14body').querySelector('button,[tabindex="0"]');
        if (z) {
            z.focus();
            return true;
        }
        return false;
    }
    function headMove(o, k) {
        var l = element('r14h').querySelectorAll('button'), i;
        for (i = 0; i < l.length; i++)
            if (l[i] == o)
                break;
        if (i >= l.length)
            return false;
        if (k == 37 && i > 0) {
            l[i - 1].focus();
            return true;
        }
        if (k == 39 && i < l.length - 1) {
            l[i + 1].focus();
            return true;
        }
        if (k == 40)
            return focusContentFromHeader();
        return false;
    }
    function handleKey(e) {
        if (vodPlayer && vodPlayer.active && vodPlayer.active())
            return vodPlayer.key(e);
        if (!viewState.on)
            return false;
        var k = keyCode(e), o = documentRef.activeElement, b, l, i, ix, tm44 = new Date().getTime();
        if ((k == 8 || k == 27 || k == 461 || k == 462 || k == 528) && viewState.fullExitAt44 && tm44 - viewState.fullExitAt44 < 550) {
            preventDefault(e);
            return true;
        }
        if (viewState.prompt) {
            if (k == 37 || k == 39) {
                preventDefault(e);
                if (o && o.id == 'resume34yes')
                    element('resume34no').focus();
                else
                    element('resume34yes').focus();
                return true;
            }
            if (k == 13 || k == 41) {
                preventDefault(e);
                if (o && o.click)
                    o.click();
                return true;
            }
            if (k == 8 || k == 27 || k == 461 || k == 462 || k == 528) {
                preventDefault(e);
                closeResumeDialog();
                return true;
            }
            if (k == 38 || k == 40) {
                preventDefault(e);
                return true;
            }
        }
        if (',4,158,166,464,1061,10009,'.indexOf(',' + k + ',') >= 0)
            k = 27;
        if ((k == 8 || k == 27 || k == 461 || k == 462 || k == 528) && o && o.parentNode == element('r14h')) {
            preventDefault(e);
            exitToMenu();
            return true;
        }
        if (viewState.full && (k == 8 || k == 27 || k == 461 || k == 462 || k == 528)) {
            preventDefault(e);
            exitFullLive();
            return true;
        }
        if (viewState.full && (k == 37 || k == 38 || k == 39 || k == 40 || k == 13 || k == 41)) {
            preventDefault(e);
            if (!viewState.fullCtl49) {
                if (k == 38)
                    showFullscreenControls('lfc49exit');
                return true;
            }
            l = element('lfc49').querySelectorAll('button');
            for (i = 0; i < l.length; i++)
                if (l[i] == o)
                    break;
            if (k == 37 && i > 0)
                l[i - 1].focus();
            else if (k == 39 && i < l.length - 1)
                l[i + 1].focus();
            else if (k == 40)
                hideFullscreenControls();
            else if (k == 13 || k == 41) {
                if (o && o.click)
                    o.click();
            } else
                showFullscreenControls(o && o.id);
            return true;
        }
        if (k == 8 || k == 27 || k == 461 || k == 462 || k == 528) {
            preventDefault(e);
            back();
            return true;
        }
        if (viewState.view == 'log') {
            b = element('l14');
            if (o && o.id == 'cl14' && k == 38) {
                preventDefault(e);
                b.focus();
                return true;
            }
            if (o === b) {
                if (k == 13 || k == 41) {
                    preventDefault(e);
                    if (!viewState.lm) {
                        viewState.lm = 1;
                        b.className = 'active';
                    } else {
                        viewState.lm = 0;
                        b.className = '';
                        element('cl14').focus();
                    }
                    return true;
                }
                if (viewState.lm && (k == 38 || k == 40)) {
                    preventDefault(e);
                    b.scrollTop += k == 38 ? -96 : 96;
                    return true;
                }
                if (k == 37 || k == 39) {
                    preventDefault(e);
                    viewState.lm = 0;
                    b.className = '';
                    element('cl14').focus();
                    return true;
                }
            }
        }
        if (o && o.parentNode == element('r14h') && (k == 37 || k == 39 || k == 40)) {
            if (headMove(o, k)) {
                preventDefault(e);
                return true;
            }
        }
        if (viewState.view == 'live') {
            if (o && /cat14/.test(o.className || '')) {
                handleImageNavigation();
                if (k == 38 && viewState.fcat == 0) {
                    preventDefault(e);
                    focusHeader();
                    return true;
                }
                if (k == 38 || k == 40) {
                    preventDefault(e);
                    moveCat(k, 1);
                    return true;
                }
                if (k == 13 || k == 41) {
                    preventDefault(e);
                    selectLiveCat(viewState.fcat, 0);
                    return true;
                }
                if (k == 39) {
                    preventDefault(e);
                    if (viewState.cat && viewState.cats[viewState.fcat] && String(viewState.cat.id) == String(viewState.cats[viewState.fcat].id)) {
                        collapseCats();
                    } else
                        selectLiveCat(viewState.fcat, 1);
                    return true;
                }
                if (k == 37) {
                    preventDefault(e);
                    return true;
                }
            }
            if (o && /ch14/.test(o.className || '')) {
                l = element('ch14').querySelectorAll('.ch14');
                for (i = 0; i < l.length; i++)
                    if (l[i] == o) {
                        ix = i;
                        break;
                    }
                if (k == 38) {
                    preventDefault(e);
                    if (ix > 0)
                        l[ix - 1].focus();
                    else if (viewState.page > 0) {
                        viewState.page--;
                        refreshLiveChannels(viewState.page * 8 + 7);
                    } else
                        focusCurrentHeader();
                    return true;
                }
                if (k == 40) {
                    preventDefault(e);
                    if (ix < l.length - 1)
                        l[ix + 1].focus();
                    else if ((viewState.page + 1) * 8 < viewState.items.length) {
                        viewState.page++;
                        refreshLiveChannels(viewState.page * 8);
                    }
                    return true;
                }
                if (k == 37) {
                    preventDefault(e);
                    expandCats();
                    return true;
                }
                if (k == 39) {
                    preventDefault(e);
                    element('lf14').focus();
                    return true;
                }
                if (k == 13 || k == 41) {
                    preventDefault(e);
                    chooseLive(+o.getAttribute('data-ii'));
                    return true;
                }
            }
            if (o && o.id == 'lfav14' && k == 40) {
                preventDefault(e);
                element('lf14').focus();
                return true;
            }
            if (o && (o.id == 'lb14' || o.id == 'lf14' || o.id == 'll14' || o.id == 'lfav14')) {
                if (k == 37) {
                    preventDefault(e);
                    if (o.id == 'll14')
                        element('lf14').focus();
                    else if (o.id == 'lf14')
                        element('lb14').focus();
                    else
                        focusChannel();
                    return true;
                }
                if (k == 39) {
                    preventDefault(e);
                    if (o.id == 'lb14')
                        element('lf14').focus();
                    else if (o.id == 'lf14')
                        element('ll14').focus();
                    return true;
                }
                if (k == 38) {
                    preventDefault(e);
                    if (o.id == 'lb14' || o.id == 'lf14' || o.id == 'll14')
                        element('lfav14').focus();
                    else
                        focusChannel();
                    return true;
                }
                if (k == 13 || k == 41) {
                    preventDefault(e);
                    o.click();
                    return true;
                }
            }
        }
        if (viewState.view == 'library') {
            if (o && /cat14/.test(o.className || '')) {
                if (k == 38 && viewState.fcat == 0) {
                    preventDefault(e);
                    focusHeader();
                    return true;
                }
                if (k == 38 || k == 40) {
                    preventDefault(e);
                    moveCat(k, 0);
                    return true;
                }
                if (k == 39 || k == 13 || k == 41) {
                    preventDefault(e);
                    var idx = +o.getAttribute('data-ci');
                    if (!viewState.cat || String(viewState.cat.id) != String(viewState.cats[idx].id) || !viewState.items.length)
                        loadLibrary(idx, 1);
                    else if (element('libgrid14').querySelector('button.card14'))
                        element('libgrid14').querySelector('button.card14').focus();
                    return true;
                }
            }
            if (o && /card14/.test(o.className || '')) {
                handleImageNavigation();
                l = element('libgrid14').querySelectorAll('.card14');
                for (i = 0; i < l.length; i++)
                    if (l[i] == o) {
                        ix = i;
                        break;
                    }
                if (k == 38 && ix < 5 && viewState.page == 0) {
                    preventDefault(e);
                    focusCurrentHeader();
                    return true;
                }
                if (k == 37 && ix % 5 == 0) {
                    preventDefault(e);
                    focusLibCat();
                    return true;
                }
                if (moveGrid(element('libgrid14'), o, k, viewState.items, 10, drawLibraryGrid, 5)) {
                    preventDefault(e);
                    return true;
                }
            }
        }
        if (viewState.view == 'episodes' && o && /ep14/.test(o.className || '')) {
            handleImageNavigation();
            l = element('eg14').querySelectorAll('.ep14');
            for (i = 0; i < l.length; i++)
                if (l[i] == o) {
                    ix = i;
                    break;
                }
            if (k == 37 && ix % 3 == 0) {
                preventDefault(e);
                var ss = element('seasons19').querySelectorAll('.season19'), sj;
                for (sj = 0; sj < ss.length; sj++)
                    if (+ss[sj].getAttribute('data-sn') == viewState.season) {
                        ss[sj].focus();
                        break;
                    }
                return true;
            }
            if (moveGrid(element('eg14'), o, k, function () {
                    var z = [], q = viewState.detail.eps || [], j;
                    for (j = 0; j < q.length; j++)
                        if ((q[j].sn || 1) == viewState.season)
                            z.push(q[j]);
                    return z;
                }(), 6, function () {
                    episodes(viewState.detail, viewState.page, 1);
                }, 3)) {
                preventDefault(e);
                return true;
            }
        }
        if ((viewState.view == 'favorites' || viewState.view == 'continue') && o && /tab14/.test(o.className || '')) {
            if (k == 38 || k == 40) {
                preventDefault(e);
                var tabs = element('r14body').querySelectorAll('.tab14');
                for (i = 0; i < tabs.length; i++)
                    if (tabs[i] == o)
                        break;
                if (k == 38) {
                    if (i > 0)
                        tabs[i - 1].focus();
                    else
                        focusCurrentHeader();
                }
                if (k == 40 && i < tabs.length - 1)
                    tabs[i + 1].focus();
                return true;
            }
            if (k == 39 && element('spg14') && element('spg14').querySelector('button')) {
                preventDefault(e);
                element('spg14').querySelector('button').focus();
                return true;
            }
            if (k == 37) {
                preventDefault(e);
                return true;
            }
        }
        if (viewState.view == 'library' && o && /skel19/.test(o.className || '')) {
            if (k == 37 || k == 38) {
                preventDefault(e);
                clearTimeout(viewState.catTimer);
                viewState.libReq++;
                xtreamApi.cancel();
                if (k == 38)
                    focusCurrentHeader();
                else
                    focusLibCat();
                return true;
            }
            preventDefault(e);
            return true;
        }
        if (viewState.view == 'episodes' && (o && o.id == 'eb14' || o && o.id == 'sfav14')) {
            if (k == 38) {
                preventDefault(e);
                focusCurrentHeader();
                return true;
            }
            if (k == 40) {
                preventDefault(e);
                var fs = element('seasons19') && element('seasons19').querySelector('.season19');
                if (fs)
                    fs.focus();
                return true;
            }
            if (k == 37 && o.id == 'sfav14') {
                preventDefault(e);
                element('eb14').focus();
                return true;
            }
            if (k == 39 && o.id == 'eb14') {
                preventDefault(e);
                element('sfav14').focus();
                return true;
            }
        }
        if (viewState.view == 'episodes' && o && /season19/.test(o.className || '')) {
            var sl = element('seasons19').querySelectorAll('.season19'), si;
            for (si = 0; si < sl.length; si++)
                if (sl[si] == o)
                    break;
            if (k == 38 && si == 0) {
                preventDefault(e);
                element('eb14').focus();
                return true;
            }
            if (k == 38 && si > 0) {
                preventDefault(e);
                sl[si - 1].focus();
                return true;
            }
            if (k == 40 && si < sl.length - 1) {
                preventDefault(e);
                sl[si + 1].focus();
                return true;
            }
            if (k == 13 || k == 41) {
                preventDefault(e);
                viewState.season = +o.getAttribute('data-sn');
                viewState.page = 0;
                episodes(viewState.detail, 0, 1);
                return true;
            }
            if (k == 39) {
                preventDefault(e);
                var epb = element('eg14') && element('eg14').querySelector('.ep14');
                if (epb)
                    epb.focus();
                return true;
            }
        }
        if ((viewState.view == 'favorites' || viewState.view == 'continue') && o && /card14/.test(o.className || '')) {
            if (k == 37 || k == 38 || k == 39 || k == 40) {
                preventDefault(e);
                moveSpecialCard(o, k);
                return true;
            }
        }
        if (viewState.view == 'detail' && o && (o.id == 'db14' || o.id == 'play14' || o.id == 'fav14')) {
            l = [
                element('db14'),
                element('play14'),
                element('fav14')
            ];
            for (i = 0; i < l.length; i++)
                if (l[i] == o)
                    break;
            if (k == 37) {
                preventDefault(e);
                if (i > 0)
                    l[i - 1].focus();
                return true;
            }
            if (k == 39) {
                preventDefault(e);
                if (i < l.length - 1)
                    l[i + 1].focus();
                return true;
            }
            if (k == 38) {
                preventDefault(e);
                focusCurrentHeader();
                return true;
            }
            if (k == 40) {
                preventDefault(e);
                return true;
            }
        }
        if (k >= 37 && k <= 40) {
            preventDefault(e);
            if (viewState.view == 'episodes' && o && /ep14/.test(o.className || '') && k == 38 && viewState.page == 0)
                element('eb14').focus();
            else if (!o || o === documentRef.body || !root().contains(o))
                focusCurrentHeader();
            return true;
        }
        return false;
    }
    var lastKey31 = 0, lastAt31 = 0, firstAt31 = 0, held31 = 0, guardUntil31 = 0, lastSource35 = '';
    function consumeInputEvent(e) {
        preventDefault(e);
        if (e.stopImmediatePropagation)
            e.stopImmediatePropagation();
        else if (e.stopPropagation)
            e.stopPropagation();
        e.cancelBubble = true;
    }
    function filterPhysicalInput(e) {
        if (e._rtv35)
            return;
        var k = keyCode(e), now = new Date().getTime(), common = windowRef.CommonPlayer14, cp = common && common.state && common.state.on, active = viewState.on || cp || vodPlayer && vodPlayer.active && vodPlayer.active(), nav = k >= 37 && k <= 40, ok = k == 13 || k == 41, bk = ',4,8,27,158,166,461,462,464,528,1061,10009,'.indexOf(',' + k + ',') >= 0, media = ',19,169,176,177,227,228,412,413,415,417,'.indexOf(',' + k + ',') >= 0, o = documentRef.activeElement, gap, ev, source = e.type == 'irkeypress' ? 'ir' : 'key';
        if (!active && now > guardUntil31)
            return;
        if (!nav && !ok && !bk && !media)
            return;
        if (k == 41)
            k = 13;
        if (bk)
            k = 27;
        if (e.type == 'keyup') {
            if (k == lastKey31)
                held31 = 0;
            consumeInputEvent(e);
            return;
        }
        if (e.type == 'keypress') {
            consumeInputEvent(e);
            return;
        }
        gap = nav ? o && /season19/.test(o.className || '') ? 260 : 170 : media ? 300 : 400;
        if (now - lastAt31 > 650)
            held31 = 0;
        if (k == lastKey31 && (now - lastAt31 < 100 || source != lastSource35 && now - lastAt31 < 180 || held31 && (now - firstAt31 < 340 || now - lastAt31 < gap) || !nav && now - lastAt31 < gap)) {
            consumeInputEvent(e);
            return;
        }
        if (k != lastKey31 || !held31)
            firstAt31 = now;
        held31 = 1;
        lastKey31 = k;
        lastAt31 = now;
        lastSource35 = source;
        guardUntil31 = now + 450;
        remoteTV.inputUntil31 = now + 450;
        if (active && nav) {
            if (viewState.on)
                handleImageNavigation();
            if (cp && common.input)
                common.input();
        }
        if (e.type == 'irkeypress') {
            consumeInputEvent(e);
            try {
                ev = documentRef.createEvent('Event');
                ev.initEvent('keydown', true, true);
                ev.keyCode = k;
                ev.which = k;
                ev._rtv35 = 1;
                (documentRef.activeElement || documentRef).dispatchEvent(ev);
            } catch (err) {
                if (documentRef.onkeydown)
                    documentRef.onkeydown({
                        keyCode: k,
                        which: k,
                        preventDefault: function () {
                        }
                    });
            }
        }
    }
    if (windowRef.addEventListener) {
        windowRef.addEventListener('keydown', filterPhysicalInput, true);
        windowRef.addEventListener('keyup', filterPhysicalInput, true);
        windowRef.addEventListener('keypress', filterPhysicalInput, true);
        windowRef.addEventListener('irkeypress', filterPhysicalInput, true);
    }
    windowRef.RawM3U = {
        open: open,
        back: back,
        key: handleKey,
        _v14: 1
    };
    var a = element('rawLaunch'), b = element('rawIn');
    if (a)
        a.onclick = open;
    if (b)
        b.onclick = open;
    remoteTV.xtreamUI = '0.56-beta.4';
    try {
        xtreamApi.log('BOOT', 'Xtream UI beta4 \xB7 fallback por erro real + controles headless no direcional cima');
    } catch (e) {
    }
}(this, document));
