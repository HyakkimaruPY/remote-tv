/* Philco API-first 6.5.9: XT10 owns authentication; raw get.php is forbidden. */
(function(w) {
    'use strict';
    var Original = w.XMLHttpRequest, remoteTV = w.RemoteTV || (w.RemoteTV = {});
    if (!Original || remoteTV._apiOnly659) return;
    remoteTV._apiOnly659 = true;
    function forbiddenUrl(url) {
        var u = String(url || '');
        if (/\/fetch\?u=/i.test(u)) {
            try { u = decodeURIComponent(u.replace(/^.*?[?&]u=/i, '').split('&')[0]); }
            catch(e) {}
        }
        return /\/get\.php(?:[?#]|$)/i.test(u);
    }
    w.XMLHttpRequest = function() {
        var xhr = new Original(), op = xhr.open, send = xhr.send, blocked = false;
        xhr.open = function(method, url) {
            blocked = forbiddenUrl(url);
            if (blocked) return;
            return op.apply(xhr, arguments);
        };
        xhr.send = function() {
            if (blocked) throw Error('Xtream API-only: get.php proibido');
            return send.apply(xhr, arguments);
        };
        return xhr;
    };
    remoteTV.apiFirst = '0.56-beta.6.5.9';
}(this));
