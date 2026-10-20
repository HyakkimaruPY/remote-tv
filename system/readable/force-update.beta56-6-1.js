/* Philco Beta 6.1 update UX: show the actually loaded release and keep verified cache. */
(function (windowRef, documentRef) {
    'use strict';
    var remoteTV = windowRef.RemoteTV || (windowRef.RemoteTV = {}), button = documentRef.getElementById('forceUpdate'), busy = 0, waitTimer = 0;
    function versionLabel(release) {
        var r = String(release || ''), match = /beta\.(\d+)\.(\d+)(?:\.(\d+))?/.exec(r);
        if (match)
            return 'Smart · Beta 0.' + match[1] + '.' + match[2] + (match[3] ? '.' + match[3] : '');
        return 'Smart · ' + (r && r != 'local' ? r : 'Remote TV');
    }
    function showEffectiveVersion() {
        var title = documentRef.getElementById('rtvVersionTitle');
        if (title)
            title.textContent = versionLabel(remoteTV.release);
    }
    function overlay(message) {
        var z = documentRef.getElementById('rtvForce53');
        if (!z) {
            z = documentRef.createElement('section');
            z.id = 'rtvForce53';
            z.style.cssText = 'position:fixed;z-index:99999;left:0;top:0;width:1280px;height:720px;background:#080b0d;color:#fff;font:26px Arial;text-align:center;padding:285px 22px 0;box-sizing:border-box';
            documentRef.body.appendChild(z);
        }
        z.textContent = message || 'Verificando atualização…';
        return z;
    }
    function finish(message) {
        busy = 0;
        clearTimeout(waitTimer);
        overlay(message);
        waitTimer = setTimeout(function () {
            var z = documentRef.getElementById('rtvForce53');
            if (!busy && z && z.parentNode)
                z.parentNode.removeChild(z);
            showEffectiveVersion();
        }, 4500);
    }
    function storedRelease() {
        try {
            var saved = JSON.parse(windowRef.localStorage.getItem('remote-tv.active.v2') || 'null');
            return saved && saved.manifest && saved.manifest.release || '';
        } catch (e) {
            return '';
        }
    }
    function force() {
        var elapsed = 0, oldRelease = String(remoteTV.release || ''), firstError = String(remoteTV.lastError || '');
        if (busy)
            return;
        busy = 1;
        clearTimeout(waitTimer);
        overlay('Verificando atualização sem apagar a versão instalada…');
        /* Never delete active, previous or staging: failed downloads must preserve playback. */
        if (typeof remoteTV.sync != 'function') {
            finish('Atualizador indisponível. Feche e reabra o Player para verificar.');
            return;
        }
        try {
            remoteTV.sync(false);
        } catch (e) {
            finish('Falha ao consultar o atualizador. Versão anterior preservada.');
            return;
        }
        function poll() {
            var stored = storedRelease(), lastError = String(remoteTV.lastError || '');
            if (!busy)
                return;
            if (stored && stored != oldRelease) {
                overlay('Nova versão validada (' + versionLabel(stored).replace('Smart · ', '') + '). Abrindo…');
                busy = 0;
                clearTimeout(waitTimer);
                waitTimer = setTimeout(function () {
                    try {
                        windowRef.location.reload(true);
                    } catch (e) {
                        finish('Nova versão salva. Feche e abra o Player.');
                    }
                }, 220);
                return;
            }
            elapsed++;
            if (lastError && lastError != firstError && /^(?:manifest|modules|verify|cache|apply)/.test(lastError)) {
                finish('Falha: ' + lastError.slice(0, 95) + '. Versão anterior preservada.');
                return;
            }
            if (elapsed >= 120) {
                finish('Sem nova versão confirmada. A versão atual foi preservada.');
                return;
            }
            if (elapsed == 7)
                overlay('Consultando GitHub e conferindo arquivos…');
            waitTimer = setTimeout(poll, 1000);
        }
        waitTimer = setTimeout(poll, 1000);
    }
    showEffectiveVersion();
    if (button)
        button.onclick = force;
    remoteTV.forceUpdate53 = force;
    remoteTV.forceUpdate = '0.56-beta.6.1';
    remoteTV.refreshVersionLabel = showEffectiveVersion;
}(this, document));
