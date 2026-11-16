/* Philco Xtream API-first 6.5.11: do not monkey-patch native XMLHttpRequest. */
(function (w) {
    'use strict';
    var tv = w.RemoteTV || (w.RemoteTV = {});
    tv._apiOnly659 = true;
    tv.apiFirst = '0.56-beta.6.5.11';
    tv.xtreamUrlPolicy = function(url) {
        return !/\/get\.php(?:[?#]|$)/i.test(String(url || ''));
    };
    // All Xtream requests are issued by XT10 through player_api.php.
    // The M3U get.php URL in configuration is only parsed as a string.
}(this));
