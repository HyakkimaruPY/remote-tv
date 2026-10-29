/* 6.5.7 standalone module; skip only after complete bundled startup. */
(function(w){
if(w.RemoteTV&&w.RemoteTV.activeCoreBundle==='0.56-beta.6.5.7')return;
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
        var installed656=windowRef[loader.specification.globalName];
        if(installed656 && installed656.version==='0.56-beta.6.5.6')loader.loaded=true;
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
        path: 'apps/youtube-beta/player-beta56-6-5-6.js',
        sha: 'e3fc36b9541f6cbb781a2743eb9375e3e15c3af2a6b90823865703aa7a6c323d',
        key: 'remote-tv.feature.youtube.beta56.656',
        globalName: 'YouTube3Probe'
    });
    var launchEpoch655 = 0, pending655 = false;
    function cancelLaunch655() {
        launchEpoch655++; pending655=false; youtube.scope.cancel(); youtube.loading=false; youtube.callbacks=[];
        var b=documentRef.getElementById('yt3');
        if(b)b.innerHTML='<span class="rtv651kicker">WEB</span><strong>YouTube beta</strong>';
    }
    if (documentRef.addEventListener) {
        function cancelKey655(e){var k=e.keyCode||e.which;if(pending655 && ',4,8,27,158,166,461,462,464,528,1061,10009,'.indexOf(','+k+',')>=0)cancelLaunch655();}
        documentRef.addEventListener('keydown',cancelKey655,true);documentRef.addEventListener('irkeypress',cancelKey655,true);
        documentRef.addEventListener('click',function(e){var n=e.target;while(n&&n!==documentRef.body&&String(n.tagName).toLowerCase()!=='button')n=n.parentNode;if(pending655&&n&&n.id!=='yt3')cancelLaunch655();},true);
    }
    function openYouTube() {
        var generation655 = ++launchEpoch655; pending655 = true;
        var button = documentRef.getElementById('yt3');
        if (button) {
            button.innerHTML = '<span class="rtv651kicker">WEB</span><strong>Abrindo YouTube…</strong>';
        }
        youtube.load(function (error) {
            if (generation655 !== launchEpoch655) return;
            var menu655=documentRef.getElementById('menu');
            if (menu655 && (' '+menu655.className+' ').indexOf(' h ')>=0) { pending655=false; return; }
            pending655 = false;
            if (button) {
                button.innerHTML = '<span class="rtv651kicker">WEB</span><strong>' + (error ? 'YouTube · tentar novamente' : 'YouTube beta') + '</strong>';
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
        button.innerHTML = '<span class="rtv651kicker">WEB</span><strong>YouTube beta</strong>';
        button.onclick = openYouTube;
    }
    var lastMenuOK656=0;
    function youtubeOK656(e){var k=e.keyCode||e.which||0,n=documentRef.activeElement,at=new Date().getTime();
        if(!n||n.id!=='yt3'||(k!==13&&k!==41))return;
        if(e.preventDefault)e.preventDefault();if(e.stopImmediatePropagation)e.stopImmediatePropagation();else if(e.stopPropagation)e.stopPropagation();
        var yt656=windowRef.YouTube3Probe;
        if(yt656&&yt656.quietUntil&&at<yt656.quietUntil())return;
        if(at-lastMenuOK656<400)return;lastMenuOK656=at;openYouTube();
    }
    if(documentRef.addEventListener){documentRef.addEventListener('keydown',youtubeOK656,true);documentRef.addEventListener('irkeypress',youtubeOK656,true);}
    var api = {
        loadYouTube3: openYouTube,
        state: function () {
            return { youtube3: youtube.loaded };
        }
    };
    windowRef.RemoteTVFeatures55 = windowRef.RemoteTVFeatures54 = windowRef.RemoteTVFeatures41 = api;
}(this, document));


if(w.RemoteTV)w.RemoteTV.__features657=true;
}.call(window,window));
