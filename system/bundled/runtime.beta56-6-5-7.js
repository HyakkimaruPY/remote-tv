/* 6.5.7 standalone module; skip only after complete bundled startup. */
(function(w){
if(w.RemoteTV&&w.RemoteTV.activeCoreBundle==='0.56-beta.6.5.7')return;
/* RemoteTV beta 3. ES5 source; compatibility aliases are intentional. */
(function (windowRef) {
    'use strict';
    var remoteTV = windowRef.RemoteTV;
    if (!remoteTV) {
        return;
    }
    remoteTV.policy = (remoteTV.data || {}).policy || {};
    remoteTV.flag = function (name, fallback) {
        var flags = remoteTV.policy.features || {};
        return flags[name] === undefined ? !!fallback : !!flags[name];
    };
    remoteTV.bridge = {
        fetch: function (url, callback, timeout) {
            return remoteTV.fetch(url, callback, timeout || ((remoteTV.policy.bridge || {}).request_timeout_ms || 9000));
        },
        url: function (url) {
            return remoteTV.bridgeURL(url);
        }
    };
    remoteTV.setStatus = function (message) {
        var status = windowRef.document.getElementById('rtvStatus');
        if (status) {
            status.textContent = message;
        }
    };
    function RequestScope() {
        this.generation = 0;
        this.nextId = 0;
        this.pending = {};
    }
    RequestScope.prototype.cancel = function () {
        var pending = this.pending, id;
        this.generation += 1;
        this.pending = {};
        for (id in pending) {
            if (Object.prototype.hasOwnProperty.call(pending, id)) {
                pending[id].abort();
            }
        }
    };
    RequestScope.prototype.request = function (url, callback, timeout) {
        var scope = this, generation = scope.generation, id = ++scope.nextId;
        var request = new XMLHttpRequest(), timer = 0, finished = false;
        function complete(error, body) {
            if (finished) {
                return;
            }
            finished = true;
            clearTimeout(timer);
            request.onreadystatechange = request.onerror = request.ontimeout = null;
            delete scope.pending[id];
            if (generation === scope.generation && callback) {
                callback(error, body || '');
            }
        }
        var handle = {
            abort: function () {
                if (finished) {
                    return;
                }
                finished = true;
                clearTimeout(timer);
                request.onreadystatechange = request.onerror = request.ontimeout = null;
                delete scope.pending[id];
                try {
                    request.abort();
                } catch (error) {
                }
            }
        };
        scope.pending[id] = handle;
        try {
            request.onreadystatechange = function () {
                if (request.readyState === 4) {
                    complete(request.status === 200 ? null : 'HTTP ' + request.status, request.responseText);
                }
            };
            request.onerror = function () {
                complete('Falha de rede', '');
            };
            request.open('GET', url, true);
            timer = setTimeout(function () {
                complete('Timeout', '');
                try {
                    request.abort();
                } catch (error) {
                }
            }, timeout || 9000);
            request.send(null);
        } catch (error) {
            complete('Falha de transporte', '');
        }
        return handle;
    };
    RequestScope.prototype.fetch = function (url, callback, timeout) {
        return this.request(remoteTV.bridgeURL(url), callback, timeout);
    };
    RequestScope.prototype.local = function (path, callback, timeout) {
        return this.request('http://127.0.0.1:8765' + path, callback, timeout);
    };
    remoteTV.RequestScope = RequestScope;
}(this));

if(w.RemoteTV)w.RemoteTV.__runtime657=true;
}.call(window,window));
