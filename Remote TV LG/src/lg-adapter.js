(function (w, d) {
  "use strict";
  var A = w.Aura,
    X = w.XT10,
    R = w.RemoteTV || (w.RemoteTV = {}),
    original = {
      cats: X.cats,
      items: X.items,
      vod: X.vod,
      series: X.series,
      stream: X.stream,
    };
  R.version = w.AuraBoot.version;
  R.release = "Aura LG · RemoteTV 0.56-beta.5";
  A.betaOpen = function () {
    X.cancel();
    X.state.cats = { c: null, m: null, s: null };
    X.state.c = null;
    A.$("sourceShell").style.display = "none";
    w.RawM3U.open();
  };
  function isRaw() {
    return A.currentSource && A.currentSource.kind === "m3u";
  }
  function rawItems(t) {
    var type = t === "c" ? "live" : t === "m" ? "vod" : "series";
    return A.currentSource.items.filter(function (o) {
      return o.t === type;
    });
  }
  function convert(o) {
    return {
      t: o.t === "live" ? "c" : o.t === "vod" ? "m" : "s",
      id: o.id,
      n: o.n,
      p: o.p,
      g: o.group,
      ext: "",
      src: o.url,
      _raw: true,
    };
  }
  function find(o) {
    var a = A.currentSource.items,
      i;
    for (i = 0; i < a.length; i++) if (a[i].id === o.id) return a[i];
    return null;
  }
  X.cats = function (t, cb) {
    if (!isRaw()) return original.cats(t, cb);
    X.cancel();
    var seen = {},
      a = [];
    rawItems(t).forEach(function (o) {
      if (!seen[o.group]) {
        seen[o.group] = 1;
        a.push({ id: o.group, n: o.group });
      }
    });
    cb(null, a);
  };
  X.items = function (t, c, cb) {
    if (!isRaw()) return original.items(t, c, cb);
    X.cancel();
    var a = rawItems(t)
      .filter(function (o) {
        return o.group === c.id;
      })
      .map(convert);
    X.state.items = a;
    X.state.rawItems = null;
    cb(null, a);
  };
  X.vod = function (o, cb) {
    if (!isRaw()) return original.vod(o, cb);
    var raw = find(o);
    if (raw) o.src = raw.url;
    cb(null, o);
  };
  X.series = function (o, cb) {
    if (!isRaw()) return original.series(o, cb);
    var raw = find(o);
    o.eps = raw
      ? [
          {
            t: "s",
            id: o.id,
            n: o.n,
            p: o.p,
            ext: "",
            src: raw.url,
            sn: 1,
            ep: 1,
          },
        ]
      : [];
    cb(null, o);
  };
  X.stream = function (o) {
    if (isRaw()) {
      var raw = find(o);
      return raw ? raw.url : o.src || "";
    }
    if (/^https?:\/\//i.test(o.src || "")) return o.src;
    var c = X.state.c,
      ext = o.ext || (o.t === "c" ? "m3u8" : "mp4");
    return (
      c.d +
      "/" +
      (o.t === "c" ? "live" : o.t === "m" ? "movie" : "series") +
      "/" +
      encodeURIComponent(c.u) +
      "/" +
      encodeURIComponent(c.p) +
      "/" +
      encodeURIComponent(o.id) +
      "." +
      encodeURIComponent(ext)
    );
  };
  X.liveRoutes = function (o) {
    if (isRaw()) return [X.stream(o)];
    var c = X.state.c,
      base =
        c.d +
        "/live/" +
        encodeURIComponent(c.u) +
        "/" +
        encodeURIComponent(c.p) +
        "/" +
        encodeURIComponent(o.id);
    return [base + ".m3u8", base + ".ts"];
  };
  X.routes = function (o) {
    return o.t === "c" ? X.liveRoutes(o) : [X.stream(o)];
  };
  var v = A.$("video"),
    on = false,
    live = false,
    full = false,
    item = null,
    opts = {},
    prevFocus = null,
    liveError = null,
    hideTimer = 0,
    waitTimer = 0,
    saveTime = 0,
    resumeAt = null,
    saveAllowed = true,
    pendingSeek = null,
    fit = 0;
  function progress() {
    return A.load("beta.progress." + A.account, {});
  }
  function key(o) {
    return o.t + ":" + o.id;
  }
  function history() {
    return A.load("beta.continue." + A.account, []);
  }
  function record() {
    if (
      !on ||
      live ||
      !saveAllowed ||
      !item ||
      v.currentTime < 5 ||
      !isFinite(v.currentTime)
    )
      return;
    var time = v.currentTime,
      dur = isFinite(v.duration) ? v.duration : 0,
      p = progress(),
      h = history(),
      series = opts.series,
      entry;
    p[key(item)] = { p: time, d: dur, at: Date.now() };
    var keys = Object.keys(p);
    if (keys.length > 200) {
      keys.sort(function (a, b) {
        return p[b].at - p[a].at;
      });
      for (var i = 200; i < keys.length; i++) delete p[keys[i]];
    }
    A.save("beta.progress." + A.account, p);
    entry = series
      ? {
          t: "s",
          id: series.id,
          n: series.n,
          p: series.p,
          pos: time,
          episode_id: item.id,
          episode: item,
        }
      : {
          t: item.t,
          id: item.id,
          n: item.n,
          p: item.p,
          ext: item.ext,
          pos: time,
          src: item.src,
        };
    h = h.filter(function (o) {
      return !(o.t === entry.t && String(o.id) === String(entry.id));
    });
    if (!dur || dur - time > 15) h.unshift(entry);
    A.save("beta.continue." + A.account, h.slice(0, 100));
  }
  function clock(t) {
    t = Math.max(0, Math.floor(t || 0));
    return (
      (t >= 3600 ? Math.floor(t / 3600) + ":" : "") +
      ("0" + (Math.floor(t / 60) % 60)).slice(-2) +
      ":" +
      ("0" + (t % 60)).slice(-2)
    );
  }
  function show() {
    if (live) return;
    A.$("hud").className = "";
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      if (on && !v.paused && pendingSeek === null)
        A.$("hud").className = "hidden";
    }, 4000);
  }
  function stop(notify) {
    if (!on) return;
    record();
    on = false;
    clearTimeout(waitTimer);
    clearTimeout(hideTimer);
    resumeAt = null;
    pendingSeek = null;
    v.pause();
    v.removeAttribute("src");
    v.load();
    A.$("playback").className = "hidden";
    var cb = opts.onExit;
    opts = {};
    liveError = null;
    if (notify !== false && cb) cb();
    else if (!live && prevFocus && d.documentElement.contains(prevFocus))
      prevFocus.focus();
  }
  function setVideo(fullscreen) {
    full = !!fullscreen;
    var box = A.$("playback"),
      pv = d.querySelector(".pv14"),
      r;
    if (!box) return;
    if (live && !full) {
      r = pv ? pv.getBoundingClientRect() : null;
      if (r && r.width > 1 && r.height > 1) {
        box.style.left = r.left + "px";
        box.style.top = r.top + "px";
        box.style.width = r.width + "px";
        box.style.height = r.height + "px";
        box.style.right = "auto";
        box.style.bottom = "auto";
        box.style.zIndex = "100";
      } else {
        /* The live UI can be hidden or in the middle of a re-render here.
           Keep the stream behind the UI until .pv14 exists again; liveHub()
           calls fullscreen(0) after rebuilding the preview. */
        box.style.left = "0";
        box.style.top = "0";
        box.style.width = "100%";
        box.style.height = "100%";
        box.style.right = "auto";
        box.style.bottom = "auto";
        box.style.zIndex = "10";
      }
    } else {
      box.style.left = "0";
      box.style.top = "0";
      box.style.width = "100%";
      box.style.height = "100%";
      box.style.right = "auto";
      box.style.bottom = "auto";
      box.style.zIndex = "700";
    }
    box.style.background = "#000";
    box.style.pointerEvents = live ? "none" : "auto";
  }
  function begin(o, options, isLive, url, error) {
    if (on) stop(false);
    opts = options || {};
    item = o;
    live = isLive;
    on = true;
    prevFocus = d.activeElement;
    liveError = error;
    resumeAt = Number(opts.resumeAt) || null;
    saveAllowed = !resumeAt;
    pendingSeek = null;
    saveTime = 0;
    fit = 0;
    v.style.objectFit = "contain";
    A.$("playback").className = "";
    A.$("playing").textContent = o.n;
    A.$("pstatus").textContent = "Conectando…";
    A.$("clock").textContent = "";
    A.$("hud").className = live ? "hidden" : "";
    setVideo(!live);
    v.src = url || X.stream(o);
    v.load();
    var p = v.play();
    if (p && p["catch"])
      p["catch"](function () {
        if (on && !live) {
          A.$("pstatus").textContent = "Selecione Reproduzir para iniciar.";
          show();
        }
      });
    clearTimeout(waitTimer);
    waitTimer = setTimeout(function () {
      if (on && v.readyState < 2) {
        A.$("pstatus").textContent =
          "Vídeo não iniciou. Confira link, formato e conexão.";
        if (live && liveError) liveError("timeout");
      }
    }, 25000);
    if (!live) {
      show();
      A.$("transport").querySelector("button").focus();
    }
  }
  function toggle() {
    if (v.paused) {
      var p = v.play();
      if (p && p["catch"])
        p["catch"](function () {
          A.$("pstatus").textContent = "A TV recusou a reprodução.";
        });
    } else v.pause();
    show();
  }
  function prepareSeek(delta) {
    if (!isFinite(v.duration)) {
      A.$("pstatus").textContent = "Busca indisponível neste conteúdo.";
      return;
    }
    pendingSeek = Math.max(
      0,
      Math.min(
        v.duration - 0.5,
        (pendingSeek === null ? v.currentTime : pendingSeek) + delta
      )
    );
    A.$("pstatus").textContent =
      "Ir para " + clock(pendingSeek) + " · OK confirma · ↑ ou Voltar cancela";
    show();
  }
  function commitSeek() {
    if (pendingSeek === null) return;
    resumeAt = null;
    saveAllowed = true;
    try {
      v.currentTime = pendingSeek;
    } catch (e) {}
    pendingSeek = null;
    A.$("pstatus").textContent = "";
    show();
  }
  function cancelSeek() {
    pendingSeek = null;
    A.$("pstatus").textContent = "";
    show();
  }
  function next() {
    if (opts.list && opts.index + 1 < opts.list.length) {
      var nextOpts = {
          list: opts.list,
          index: opts.index + 1,
          series: opts.series,
          onExit: opts.onExit,
        },
        n = opts.list[nextOpts.index];
      stop(false);
      begin(n, nextOpts, false);
      return true;
    }
    return false;
  }
  function prev() {
    if (opts.list && opts.index > 0) {
      var prevOpts = {
          list: opts.list,
          index: opts.index - 1,
          series: opts.series,
          onExit: opts.onExit,
        },
        n = opts.list[prevOpts.index];
      stop(false);
      begin(n, prevOpts, false);
      return true;
    }
    return false;
  }
  function jump(delta) {
    if (!isFinite(v.duration) || v.duration <= 0) {
      A.$("pstatus").textContent = "Busca indisponível neste conteúdo.";
      show();
      return;
    }
    var t = Math.max(0, Math.min(v.duration - 0.5, v.currentTime + delta));
    pendingSeek = null;
    try {
      v.currentTime = t;
    } catch (e) {}
    A.$("pstatus").textContent =
      (delta > 0 ? "+" : "\u2212") +
      Math.abs(delta) +
      " s \xB7 " +
      clock(t) +
      " / " +
      clock(v.duration);
    show();
  }
  function cycleFit() {
    fit = (fit + 1) % 3;
    v.style.objectFit = ["contain", "cover", "fill"][fit];
    show();
  }
  function handle(e) {
    var k = e.keyCode || e.which;
    if (!on || live) return false;
    if (
      k === 461 ||
      k === 27 ||
      k === 8 ||
      k === 462 ||
      k === 528 ||
      k === 166 ||
      k === 464 ||
      k === 1061 ||
      k === 10009
    ) {
      if (pendingSeek !== null) cancelSeek();
      else stop();
      return true;
    }
    if (pendingSeek !== null) {
      if (k === 37 || k === 39) prepareSeek(k === 37 ? -1 : 1);
      else if (k === 13 || k === 41) commitSeek();
      else if (k === 38) cancelSeek();
      return true;
    }
    if (k === 33) {
      jump(60);
      return true;
    }
    if (k === 34) {
      jump(-60);
      return true;
    }
    if (k === 176) {
      prev();
      return true;
    }
    if (k === 177) {
      next();
      return true;
    }
    if (k === 457) {
      show();
      var first = A.$("transport").querySelector("button");
      if (first) first.focus();
      return true;
    }
    if (k === 1005) {
      cycleFit();
      return true;
    }
    if (k === 412 || k === 417) {
      prepareSeek(k === 412 ? -10 : 10);
      return true;
    }
    if (k === 19) {
      v.pause();
      show();
      return true;
    }
    if (k === 415) {
      if (v.paused) toggle();
      return true;
    }
    if (k === 413) {
      stop();
      return true;
    }
    if (A.$("hud").className === "hidden") {
      show();
      A.$("transport").querySelector("button").focus();
      return true;
    }
    if (k === 13 || k === 41) {
      d.activeElement.click();
      return true;
    }
    A.spatial(e);
    show();
    return true;
  }
  function resume() {
    if (resumeAt !== null)
      try {
        v.currentTime = resumeAt;
      } catch (e) {
        A.$("pstatus").textContent =
          "Retomada indisponível; use a busca de posição.";
      }
  }
  v.addEventListener("loadedmetadata", resume, false);
  v.addEventListener("canplay", resume, false);
  v.addEventListener(
    "timeupdate",
    function () {
      if (!on) return;
      A.$("clock").textContent =
        clock(v.currentTime) +
        " / " +
        (isFinite(v.duration) ? clock(v.duration) : "Ao vivo");
      if (resumeAt !== null && Math.abs(v.currentTime - resumeAt) < 3) {
        resumeAt = null;
        saveAllowed = true;
      }
      if (Date.now() - saveTime >= 15000) {
        record();
        saveTime = Date.now();
      }
    },
    false
  );
  v.addEventListener(
    "playing",
    function () {
      clearTimeout(waitTimer);
      A.$("pstatus").textContent = "";
      show();
    },
    false
  );
  v.addEventListener(
    "waiting",
    function () {
      if (on) A.$("pstatus").textContent = "Carregando vídeo…";
    },
    false
  );
  v.addEventListener(
    "error",
    function () {
      if (!on) return;
      clearTimeout(waitTimer);
      X.log("LG VIDEO", "media error " + (v.error ? v.error.code : 0));
      if (live && liveError) {
        var cb = liveError;
        liveError = null;
        cb("media-error");
      } else {
        A.$("pstatus").textContent =
          "Não foi possível reproduzir. Confira conexão, codec e formato suportado pela TV.";
        show();
      }
    },
    false
  );
  v.addEventListener(
    "ended",
    function () {
      record();
      if (!next()) stop();
    },
    false
  );
  var ctl = A.$("transport");
  [
    [
      "−10 s",
      function () {
        prepareSeek(-10);
      },
    ],
    ["Reproduzir / Pausar", toggle],
    [
      "+10 s",
      function () {
        prepareSeek(10);
      },
    ],
    ["Confirmar posição", commitSeek],
    ["Próximo episódio", next],
    [
      "Proporção",
      cycleFit,
    ],
    [
      "Voltar",
      function () {
        stop();
      },
    ],
  ].forEach(function (c) {
    var b = d.createElement("button");
    b.textContent = c[0];
    b.onclick = c[1];
    ctl.appendChild(b);
  });
  d.addEventListener(
    "visibilitychange",
    function () {
      if (d.hidden) {
        record();
        if (on) v.pause();
      }
    },
    false
  );
  w.addEventListener("pagehide", record, false);
  w.XTVod29 = {
    play: function (o, opt) {
      begin(o, opt, false);
    },
    stop: stop,
    active: function () {
      return on && !live;
    },
    key: handle,
    progress: function (o) {
      return progress()[key(o)] || null;
    },
    continueList: function (t) {
      return history().filter(function (o) {
        return o.t === t;
      });
    },
  };
  w.RawPlayer = {
    play: function (name, url, a, b, cb) {
      begin({ t: "c", id: url, n: name }, {}, true, url, cb);
      setTimeout(function () {
        if (on && live) setVideo(full);
      }, 0);
    },
    close: function () {
      if (live) stop(false);
    },
    fullscreen: function (value) {
      setVideo(value);
      return true;
    },
    ratio: cycleFit,
    exit: function () {
      stop(false);
      A.sourceHome();
    },
  };
  A.Player = {
    stop: function () {
      stop();
    },
    active: function () {
      return on;
    },
    record: record,
  };
  A.LGNative = {
    key: handle,
    next: next,
    record: record,
    seek: prepareSeek,
    commit: commitSeek,
    cancel: cancelSeek,
  };
})(this, document);
