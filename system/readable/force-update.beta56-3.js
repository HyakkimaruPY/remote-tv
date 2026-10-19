/* RemoteTV beta 3. ES5 source; compatibility aliases are intentional. */
(function (windowRef, documentRef) {
    'use strict';
    var remoteTV = windowRef.RemoteTV || (windowRef.RemoteTV = {}), b = documentRef.getElementById('forceUpdate'), busy = 0;
    function overlay(msg) {
        var z = documentRef.getElementById('rtvForce53');
        if (!z) {
            z = documentRef.createElement('section');
            z.id = 'rtvForce53';
            z.style.cssText = 'position:fixed;z-index:99999;left:0;top:0;width:1280px;height:720px;background:#080b0d;color:#fff;font:26px Arial;text-align:center;padding-top:285px;box-sizing:border-box';
            documentRef.body.appendChild(z);
        }
        z.textContent = msg || 'Atualizando\u2026';
    }
    function force() {
        var stamp = new Date().getTime();
        if (busy)
            return;
        busy = 1;
        overlay('Forçando atualização do Remote TV\u2026');
        try {
            localStorage.removeItem('remote-tv.staging.v2');
            localStorage.removeItem('remote-tv.active.v2');
            localStorage.setItem('remote-tv.force-update.v1', String(stamp));
        } catch (e) {
        }
        setTimeout(function () {
            try {
                windowRef.location.reload(true);
                return;
            } catch (e) {
            }
            try {
                windowRef.history.go(0);
                return;
            } catch (y) {
            }
            overlay('Cache remoto limpo. Feche e abra o Player 1 para concluir a atualização.');
        }, 180);
    }
    if (b)
        b.onclick = force;
    remoteTV.forceUpdate53 = force;
    remoteTV.forceUpdate = '0.53';
}(this, document));
