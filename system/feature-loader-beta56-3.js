/* RemoteTV beta 3. ES5 source; compatibility aliases are intentional. */
(function (windowRef, documentRef) {
    'use strict';
    var remoteTV = windowRef.RemoteTV;
    var baseUrl = 'https://raw.githubusercontent.com/HyakkimaruPY/remote-tv/main/';
    function FeatureLoader(specification) {
        this.specification = specification;
        this.scope = new remoteTV.RequestScope();
        this.loading = false;
        this.loaded = false;
        this.callbacks = [];
    }
    FeatureLoader.prototype.valid = function (source) {
        return !!(source && remoteTV.sha256 && remoteTV.sha256(source) === this.specification.sha);
    };
    FeatureLoader.prototype.readCache = function () {
        try {
            return localStorage.getItem(this.specification.key) || '';
        } catch (error) {
            return '';
        }
    };
    FeatureLoader.prototype.deliver = function (error) {
        var callbacks = this.callbacks, index;
        this.callbacks = [];
        this.loading = false;
        for (index = 0; index < callbacks.length; index += 1) {
            callbacks[index](error);
        }
    };
    FeatureLoader.prototype.install = function (source) {
        var script = documentRef.createElement('script');
        script.type = 'text/javascript';
        script.setAttribute('data-remote-feature', this.specification.id);
        script.text = source;
        (documentRef.head || documentRef.documentElement).appendChild(script);
        if (!windowRef[this.specification.globalName]) {
            throw new Error('feature não iniciou');
        }
        this.loaded = true;
        try {
            localStorage.setItem(this.specification.key, source);
        } catch (error) {
        }
    };
    FeatureLoader.prototype.load = function (callback) {
        var loader = this, cached;
        if (loader.loaded) {
            callback(null);
            return;
        }
        loader.callbacks.push(callback);
        if (loader.loading) {
            return;
        }
        loader.loading = true;
        cached = loader.readCache();
        if (loader.valid(cached)) {
            try {
                loader.install(cached);
                loader.deliver(null);
                return;
            } catch (error) {
                try {
                    localStorage.removeItem(loader.specification.key);
                } catch (storageError) {
                }
            }
        }
        loader.scope.fetch(baseUrl + loader.specification.path, function (error, source) {
            if (error) {
                loader.deliver(error);
                return;
            }
            if (!loader.valid(source)) {
                loader.deliver('integridade');
                return;
            }
            try {
                loader.install(source);
            } catch (installError) {
                loader.deliver('execução');
                return;
            }
            loader.deliver(null);
        }, 9000);
    };
    var youtube = new FeatureLoader({
        id: 'youtube3',
        path: 'apps/youtube3/player-beta56-3.js',
        sha: '8fdd8fb9f4c9aca4bc22c8ca55cb9ab0e97c106dcc39e8be2e4826020de07b3f',
        key: 'remote-tv.feature.youtube3.beta56.3',
        globalName: 'YouTube3Probe'
    });
    function openYouTube() {
        var button = documentRef.getElementById('yt3');
        if (button) {
            button.textContent = 'Abrindo YouTube\u2026';
        }
        youtube.load(function (error) {
            if (button) {
                button.textContent = error ? 'YouTube \xB7 tentar novamente' : 'YouTube';
            }
            if (!error) {
                windowRef.YouTube3Probe.open();
            }
        });
    }
    windowRef.RawM3U = {
        open: function () {
        },
        back: function () {
            return false;
        },
        key: function () {
            return false;
        }
    };
    var button = documentRef.getElementById('yt3');
    if (button) {
        button.textContent = 'YouTube';
        button.onclick = openYouTube;
    }
    var api = {
        loadYouTube3: openYouTube,
        state: function () {
            return { youtube3: youtube.loaded };
        }
    };
    windowRef.RemoteTVFeatures55 = windowRef.RemoteTVFeatures54 = windowRef.RemoteTVFeatures41 = api;
}(this, document));
