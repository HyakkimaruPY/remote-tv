/* Philco Beta 6.5.15: fast version gate, nonblocking update and native-dialog-free promotion. */
(function (windowRef, documentRef) {
    'use strict';
    var remoteTV = windowRef.RemoteTV || (windowRef.RemoteTV = {}),
        button = documentRef.getElementById('forceUpdate'),
        statusBar = documentRef.getElementById('rtv651status'),
        busy = false, timer = 0, updateEpoch = 0,
        versionUrl = 'https://raw.githubusercontent.com/HyakkimaruPY/remote-tv/main/version';
    function versionLabel(release) {
        var r = String(release || ''), match = /beta\.(\d+)\.(\d+)(?:\.(\d+))?/.exec(r);
        if (match) return 'Smart · Beta 0.' + match[1] + '.' + match[2] + (match[3] ? '.' + match[3] : '');
        return 'Smart · ' + (r && r !== 'local' ? r : 'Remote TV');
    }
    function showEffectiveVersion() {
        var title = documentRef.getElementById('rtvVersionTitle');
        if (title) title.textContent = versionLabel(remoteTV.release);
    }
    function matchesRelease(version, release) {
        var match = /^0\.56-beta\.(\d+(?:\.\d+)*)$/.exec(String(version || '')),
            suffix = match ? '-beta.56.' + match[1] : '',
            value = String(release || '');
        return !!(suffix && value.length >= suffix.length &&
            value.slice(value.length - suffix.length) === suffix);
    }
    function message(value) {
        var z = documentRef.getElementById('rtvForce53');
        if (!z) {
            z = documentRef.createElement('section');
            z.id = 'rtvForce53';
            z.style.cssText = 'position:fixed;left:70px;right:70px;bottom:18px;z-index:950;' +
                'box-sizing:border-box;border:1px solid #393e42;border-radius:8px;' +
                'background:#0a0b0c;color:#eee;padding:12px 18px;font:17px Arial;' +
                'pointer-events:none;text-align:center';
            documentRef.body.appendChild(z);
        }
        z.textContent = value;
        return z;
    }
    function finish(value, persistent) {
        busy = false;
        clearTimeout(timer);
        updateEpoch++;
        message(value);
        if (statusBar) statusBar.textContent = persistent ? value : 'M3U · Philco · ' + versionLabel(remoteTV.release);
        timer = setTimeout(function () {
            var z = documentRef.getElementById('rtvForce53');
            if (!busy && z && z.parentNode) z.parentNode.removeChild(z);
            showEffectiveVersion();
        }, persistent ? 6000 : 2200);
    }
    function force() {
        if (busy) return;
        var epoch = ++updateEpoch, current = String(remoteTV.release || ''),
            oldError = String(remoteTV.lastError || ''), began = new Date().getTime(),
            lastPending = String(remoteTV.pendingRelease || ''), version = '', synced = false;
        busy = true;
        clearTimeout(timer);
        message('Consultando versão publicada…');
        if (typeof remoteTV.fetch !== 'function') {
            finish('Atualizador sem transporte. Versão atual preservada.', false);
            return;
        }
        remoteTV.fetch(versionUrl + '?_=' + new Date().getTime(), function (error, body) {
            if (!busy || epoch !== updateEpoch) return;
            version = String(body || '').replace(/^\uFEFF/, '').replace(/^\s+|\s+$/g, '');
            if (error) {
                finish('Falha ao consultar GitHub (' + String(error).slice(0,35) + '). Versão preservada.', false);
                return;
            }
            if (!/^0\.56-beta\.\d+(?:\.\d+)*$/.test(version)) {
                finish('Resposta de versão inválida. Versão preservada.', false);
                return;
            }
            if (matchesRelease(version, current)) {
                finish('O player já está atualizado.', false);
                return;
            }
            if (matchesRelease(version, remoteTV.pendingRelease)) {
                finish('Atualização validada e salva. Reabra o player para aplicar.', true);
                return;
            }
            if (typeof remoteTV.sync !== 'function') {
                finish('Sincronização indisponível. Versão atual preservada.', false);
                return;
            }
            message('Nova versão encontrada · validando módulos em segundo plano…');
            function watch() {
                if (!busy || epoch !== updateEpoch) return;
                var pending = String(remoteTV.pendingRelease || ''),
                    currentError = String(remoteTV.lastError || '');
                if (matchesRelease(version, pending) && (!lastPending || pending !== lastPending)) {
                    finish('Atualização validada e salva. Reabra o player para aplicar.', true);
                    return;
                }
                if (currentError && currentError !== oldError &&
                    /^(?:manifest|modules|verify|cache|apply|native|xhr)/i.test(currentError)) {
                    finish('Falha: ' + currentError.slice(0,85) + ' · versão anterior preservada.', false);
                    return;
                }
                if (new Date().getTime() - began >= 120000) {
                    finish('Atualização não confirmada. Versão anterior preservada.', false);
                    return;
                }
                timer = setTimeout(watch, 600);
            }
            // One synchronization for a changed version. Let WebKit paint before SHA work.
            timer = setTimeout(function () {
                if (!busy || epoch !== updateEpoch) return;
                try {
                    synced = true;
                    remoteTV.sync(false);
                } catch (e) {
                    finish('Falha ao iniciar sincronização. Versão anterior preservada.', false);
                    return;
                }
                if (synced) timer = setTimeout(watch, 600);
            }, 80);
        }, 4500);
    }
    showEffectiveVersion();
    if (button) button.onclick = force;
    remoteTV.forceUpdate53 = force;
    remoteTV.forceUpdate = '0.56-beta.6.5.15';
    remoteTV.refreshVersionLabel = showEffectiveVersion;
}(this, document));
