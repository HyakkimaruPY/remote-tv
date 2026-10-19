(function (w, d) {
  "use strict";
  var A = (w.Aura = {}),
    requests = [],
    epoch = 0;
  A.$ = function (id) {
    return d.getElementById(id);
  };
  A.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
  };
  A.load = function (k, def) {
    try {
      var x = JSON.parse(localStorage.getItem("aura.lg.data." + k));
      return x === null ? def : x;
    } catch (e) {
      return def;
    }
  };
  A.save = function (k, v) {
    try {
      localStorage.setItem("aura.lg.data." + k, JSON.stringify(v));
      return true;
    } catch (e) {
      A.notice("Sem espaço para salvar dados neste aparelho.");
      return false;
    }
  };
  A.notice = function (s) {
    A.$("notice").textContent = s || "";
  };
  A.url = function (s, base) {
    var a = d.createElement("a");
    if (base && !/^https?:\/\//i.test(s)) {
      if (s.slice(0, 2) === "//")
        s = (/^https:/.test(base) ? "https:" : "http:") + s;
      else {
        s =
          s.charAt(0) === "/"
            ? base.replace(/^(https?:\/\/[^/]+).*$/, "$1") + s
            : base.replace(/[^/]*$/, "") + s;
      }
    }
    a.href = s;
    if (!/^https?:$/.test(a.protocol) || !a.hostname)
      throw new Error("Use um endereço HTTP ou HTTPS completo.");
    return a.href;
  };
  A.cancel = function () {
    epoch++;
    var old = requests;
    requests = [];
    for (var i = 0; i < old.length; i++) old[i].abort();
  };
  A.get = function (url, cb) {
    var x = new XMLHttpRequest(),
      id = epoch,
      done = false,
      timeout;
    function finish(err, s) {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      var i = requests.indexOf(x);
      if (i >= 0) requests.splice(i, 1);
      if (id === epoch) cb(err, s);
    }
    try {
      url = A.url(url);
      x.open("GET", url, true);
      requests.push(x);
      timeout = setTimeout(function () {
        finish("Servidor demorou a responder.");
        x.abort();
      }, 25000);
      x.onreadystatechange = function () {
        if (x.readyState === 4)
          finish(
            x.status >= 200 && x.status < 300
              ? null
              : "Falha de rede HTTP " +
                  x.status +
                  ". Verifique servidor, CORS e conexão.",
            x.responseText
          );
      };
      x.onprogress = function () {
        if (x.responseText.length > 24 * 1024 * 1024) {
          finish("Resposta excede o limite de 24 MB.");
          x.abort();
        }
      };
      x.onerror = function () {
        finish(
          "Conexão recusada. Confira URL, TLS e permissão CORS do servidor."
        );
      };
      x.send(null);
    } catch (e) {
      finish(e.message);
    }
  };
  A.json = function (url, cb) {
    A.get(url, function (err, s) {
      if (err) return cb(err);
      try {
        cb(null, JSON.parse(s.replace(/^\uFEFF/, "")));
      } catch (e) {
        cb(
          "O servidor não retornou JSON válido. Confira o endereço e o acesso."
        );
      }
    });
  };
  A.array = function (x) {
    if (Object.prototype.toString.call(x) === "[object Array]") return x;
    var keys = [
        "data",
        "categories",
        "streams",
        "channels",
        "movies",
        "series",
        "results",
      ],
      i;
    if (x && typeof x === "object") {
      for (i = 0; i < keys.length; i++)
        if (Object.prototype.toString.call(x[keys[i]]) === "[object Array]")
          return x[keys[i]];
      var out = [];
      for (i in x)
        if (Object.prototype.hasOwnProperty.call(x, i)) {
          if (!/^\d+$/.test(i) || !x[i] || typeof x[i] !== "object")
            throw new Error("Formato do catálogo não reconhecido.");
          out.push(x[i]);
        }
      return out;
    }
    throw new Error("Catálogo inválido.");
  };
  A.credentials = function (url) {
    try {
      var a = d.createElement("a");
      a.href = A.url(url);
      var q = a.search.substring(1).split("&"),
        o = {},
        i,
        p;
      for (i = 0; i < q.length; i++) {
        p = q[i].split("=");
        o[decodeURIComponent(p[0])] = decodeURIComponent(
          p.slice(1).join("=").replace(/\+/g, " ")
        );
      }
      if ((o.username || o.user) && (o.password || o.pass))
        return {
          host:
            a.protocol +
            "//" +
            a.host +
            a.pathname.replace(/\/(get|player_api|xmltv)\.php.*$/, ""),
          user: o.username || o.user,
          pass: o.password || o.pass,
        };
    } catch (e) {}
    return null;
  };
  A.api = function (c, action, params) {
    var s =
        c.host.replace(/\/+$/, "") +
        "/player_api.php?username=" +
        encodeURIComponent(c.user) +
        "&password=" +
        encodeURIComponent(c.pass),
      k;
    if (action) s += "&action=" + action;
    for (k in params)
      if (Object.prototype.hasOwnProperty.call(params, k))
        s += "&" + encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
    return s;
  };
  A.authenticate = function (c, cb) {
    try {
      c.host = A.url(c.host).replace(/\/+$/, "");
      if (!c.user || !c.pass) throw 0;
    } catch (e) {
      return cb("Informe servidor, usuário e senha.");
    }
    A.json(A.api(c, "", {}), function (err, r) {
      if (err) return cb(err);
      var u = r && r.user_info,
        now =
          Number(r && r.server_info && r.server_info.timestamp) ||
          Date.now() / 1000;
      if (!u || !(u.auth === true || String(u.auth) === "1"))
        return cb("Acesso recusado. Confira usuário, senha e servidor.");
      if (u.status && String(u.status).toLowerCase() !== "active")
        return cb("A conta não está ativa.");
      if (Number(u.exp_date) > 0 && Number(u.exp_date) <= now)
        return cb("A conta está vencida.");
      cb(null, {
        kind: "api",
        credentials: c,
        formats: u.allowed_output_formats || [],
      });
    });
  };
  A.parse = function (text, base, cb) {
    var lines = text.replace(/^\uFEFF/, "").split(/\r?\n/),
      out = [],
      meta = null,
      i = 0,
      cancelId = epoch;
    if (!/^\s*#EXTM3U/.test(text.replace(/^\uFEFF/, "")))
      return cb("O conteúdo não é uma lista M3U.");
    function chunk() {
      if (cancelId !== epoch) return;
      var end = Math.min(i + 1500, lines.length),
        line,
        m,
        name,
        group,
        url,
        type;
      for (; i < end; i++) {
        line = lines[i].replace(/^\s+|\s+$/g, "");
        if (line.indexOf("#EXTINF:") === 0) {
          meta = {};
          line.replace(/([\w-]+)="([^"]*)"/g, function (_, k, v) {
            meta[k] = v;
            return _;
          });
          meta.name = line.slice(line.indexOf(",") + 1);
        } else if (line && line.charAt(0) !== "#") {
          try {
            url = A.url(line, base);
          } catch (e) {
            meta = null;
            continue;
          }
          name = (meta && meta.name) || "Conteúdo " + (out.length + 1);
          group = (meta && meta["group-title"]) || "Sem categoria";
          type = /\/series\//i.test(url)
            ? "series"
            : /\/movie\/|\.(mp4|mkv|avi)(\?|$)/i.test(url)
              ? "vod"
              : "live";
          out.push({
            id: url,
            n: name,
            p: (meta && meta["tvg-logo"]) || "",
            group: group,
            t: type,
            url: url,
          });
          meta = null;
        }
      }
      if (out.length > 100000) return cb("Lista excede 100 mil entradas.");
      if (i < lines.length) setTimeout(chunk, 0);
      else
        cb(
          out.length
            ? null
            : "A lista está vazia. Adicione seu conteúdo em lista.m3u.",
          out
        );
    }
    chunk();
  };
  A.openSource = function (value, base, cb) {
    value = value.replace(/^\s+|\s+$/g, "");
    var c = A.credentials(value);
    if (c) return A.authenticate(c, cb);
    if (value.indexOf("#EXTM3U") === 0)
      return A.parse(value, base, function (err, items) {
        cb(err, { kind: "m3u", items: items });
      });
    A.get(value, function (err, text) {
      if (err) return cb(err);
      text = text.replace(/^\s+|\s+$/g, "");
      if (/^https?:\/\/\S+$/.test(text)) {
        c = A.credentials(text);
        if (c) return A.authenticate(c, cb);
        return A.get(text, function (e, t) {
          if (e) return cb(e);
          A.parse(t, text, function (er, items) {
            cb(er, { kind: "m3u", items: items });
          });
        });
      }
      A.parse(text, value, function (e, items) {
        cb(e, { kind: "m3u", items: items });
      });
    });
  };
  A.hash = function (s) {
    var h = 2166136261,
      i;
    for (i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return (h >>> 0).toString(16);
  };
  A.focus = function () {
    var e = A.$("screen").querySelector("button,input,textarea,select");
    if (e) e.focus();
  };
  A.spatial = function (e) {
    var k = e.keyCode;
    if (k < 37 || k > 40) return;
    var active = d.activeElement;
    if (active && /INPUT|TEXTAREA|SELECT/.test(active.tagName)) return;
    var list = d.querySelectorAll("button,input,textarea,select"),
      r = active && active.getBoundingClientRect(),
      best = null,
      score = Infinity,
      i,
      b,
      dx,
      dy,
      primary,
      secondary,
      s;
    if (!r) return;
    for (i = 0; i < list.length; i++) {
      if (list[i] === active || list[i].disabled) continue;
      b = list[i].getBoundingClientRect();
      if (!b.width || !b.height || !list[i].offsetHeight) continue;
      dx = (b.left + b.right - r.left - r.right) / 2;
      dy = (b.top + b.bottom - r.top - r.bottom) / 2;
      primary = k === 37 ? -dx : k === 39 ? dx : k === 38 ? -dy : dy;
      secondary = k === 37 || k === 39 ? Math.abs(dy) : Math.abs(dx);
      if (primary < 2) continue;
      s = primary + secondary * 3;
      if (s < score) {
        score = s;
        best = list[i];
      }
    }
    if (best) {
      best.focus();
      try {
        best.scrollIntoView(false);
      } catch (ex) {}
      e.preventDefault();
    }
  };
  A.safeImage = function (s) {
    try {
      return A.url(s);
    } catch (e) {
      return "";
    }
  };
})(this, document);
