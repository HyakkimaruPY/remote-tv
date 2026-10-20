(function (w, d) {
  "use strict";
  var BASE =
      "https://raw.githubusercontent.com/HyakkimaruPY/remote-tv/main/Remote%20TV%20LG/",
    P = "aura.lg.",
    busy = false,
    staging = null,
    frame = d.getElementById("runtime"),
    timer = 0,
    attempt = 0,
    current = null,
    failed = {},
    LAUNCHER_VERSION = "1.0.2",
    xhr = null;
  function $(id) {
    return d.getElementById(id);
  }
  function status(s) {
    $("status").textContent = s;
  }
  function read(k) {
    try {
      return JSON.parse(localStorage.getItem(P + k) || "null");
    } catch (e) {
      return null;
    }
  }
  function write(k, v) {
    localStorage.setItem(P + k, JSON.stringify(v));
  }
  function valid(b) {
    try {
      return (
        b &&
        /^\d+\.\d+\.\d+$/.test(b.version) &&
        typeof b.html === "string" &&
        b.html.length < 2000000 &&
        w.AuraBytes(b.html) === b.bytes &&
        w.AuraSHA(b.html) === b.sha256
      );
    } catch (e) {
      return false;
    }
  }
  function versionNum(v) {
    var a = String(v || "0.0.0").split("."), i, n = 0;
    for (i = 0; i < 3; i++) n = n * 10000 + (+a[i] || 0);
    return n;
  }
  function best() {
    var a = read("active"), p = read("previous"), f = w.AuraFallback, b = valid(f) ? f : null;
    if (valid(p) && (!b || versionNum(p.version) > versionNum(b.version))) b = p;
    if (valid(a) && (!b || versionNum(a.version) >= versionNum(b.version))) b = a;
    return b;
  }
  function label() {
    var a = best(), b = valid(staging) && versionNum(staging.version) >= versionNum(a.version) ? staging : null;
    $("version").textContent = "Aura · Player " + a.version +
      " · Base " + LAUNCHER_VERSION + (b && b.sha256 !== a.sha256 ? " · atualização " + b.version + " pronta" : "");
  }
  function get(path, cb) {
    var x = new XMLHttpRequest(),
      done = false;
    xhr = x;
    var timeout = setTimeout(function () {
      finish("Tempo de conexão excedido.");
      x.abort();
    }, 18000);
    function finish(err, body) {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      cb(err, body);
    }
    x.open(
      "GET",
      BASE + path + (path.indexOf("?") < 0 ? "?" : "&") + "t=" + Date.now(),
      true
    );
    x.onreadystatechange = function () {
      if (x.readyState === 4)
        finish(
          x.status === 200 ? null : "Não foi possível consultar a atualização.",
          x.responseText
        );
    };
    x.onerror = function () {
      finish("Sem conexão com o servidor de atualização.");
    };
    x.send(null);
  }
  function update(force) {
    if (busy) return;
    busy = true;
    $("update").disabled = true;
    status("Verificando atualização…");
    get("version", function (err, marker) {
      if (err) return end(err);
      marker = marker.replace(/^\s+|\s+$/g, "");
      if (!/^\d+\.\d+\.\d+$/.test(marker))
        return end("Versão remota inválida. A versão local foi mantida.");
      if (versionNum(marker) < versionNum(best().version))
        return end("A versão local é mais recente; nenhuma regressão aplicada.");
      if (!force && marker === best().version) return end("Player atualizado.");
      if (!force && valid(staging) && marker === staging.version)
        return end("Versão " + marker + " já salva. Selecione Executar.");
      get("manifest.json", function (e, s) {
        var m;
        try {
          m = JSON.parse(s);
          if (
            e ||
            m.schema !== 1 ||
            m.version !== marker ||
            !/^releases\/[0-9.]+\/player\.html$/.test(m.path) ||
            m.bytes > 2000000 ||
            m.bytes < 100
          )
            throw 0;
        } catch (ex) {
          return end("Manifesto inválido. A versão local foi mantida.");
        }
        get(m.path, function (er, html) {
          var b = {
            version: m.version,
            bytes: m.bytes,
            sha256: m.sha256,
            html: html,
          };
          if (er || !valid(b))
            return end(
              "Download incompleto ou inválido. A versão local foi mantida."
            );
          try {
            write("staging", b);
            if (!valid(read("staging"))) throw 0;
            staging = b;
          } catch (ex) {
            return end(
              "Sem espaço para salvar a atualização. A versão local foi mantida."
            );
          }
          label();
          end("Versão " + b.version + " salva. Selecione Executar para abrir.");
        });
      });
    });
  }
  function end(msg) {
    busy = false;
    $("update").disabled = false;
    status(msg);
  }
  function launch(bundle) {
    var local = best();
    bundle = bundle || (valid(staging) && versionNum(staging.version) >= versionNum(local.version) ? staging : local);
    if (!valid(bundle)) {
      status("Versão local inválida.");
      return;
    }
    var token = "aura-" + Date.now() + "-" + ++attempt;
    current = { bundle: bundle, token: token, ready: false };
    $("launch").disabled = true;
    status("Abrindo Player " + bundle.version + "…");
    frame.style.display = "block";
    frame.style.visibility = "hidden";
    clearTimeout(timer);
    timer = setTimeout(function () {
      fallback("O player não iniciou; recuperando a versão anterior.");
    }, 7000);
    try {
      var fd = frame.contentWindow.document;
      fd.open();
      fd.write(
        bundle.html.replace(
          "<!--AURA_BOOT-->",
          "<script>window.AuraBoot=" +
            JSON.stringify({
              token: token,
              version: bundle.version,
              remote: BASE + "lista.m3u",
            }) +
            ";<\/script>"
        )
      );
      fd.close();
    } catch (e) {
      fallback("Falha ao abrir a versão.");
    }
  }
  function fallback(msg) {
    clearTimeout(timer);
    var b = current && current.bundle;
    frame.style.display = "none";
    $("launch").disabled = false;
    if (b) failed[b.sha256] = true;
    staging = null;
    try {
      localStorage.removeItem(P + "staging");
    } catch (e) {}
    var p = read("previous"),
      a = read("active"),
      next =
        valid(a) && !failed[a.sha256]
          ? a
          : valid(p) && !failed[p.sha256]
            ? p
            : w.AuraFallback;
    status(msg);
    if (valid(next) && !failed[next.sha256]) launch(next);
    else {
      current = null;
      status("Não foi possível iniciar. Feche e reabra o Aura.");
    }
  }
  w.addEventListener(
    "message",
    function (e) {
      if (
        e.source !== frame.contentWindow ||
        !current ||
        !e.data ||
        e.data.token !== current.token
      )
        return;
      if (e.data.type === "aura-ready") {
        clearTimeout(timer);
        if (current.ready) return;
        current.ready = true;
        var b = current.bundle,
          a = read("active");
        try {
          if (valid(a) && (a.sha256 !== b.sha256 || a.version !== b.version))
            write("previous", a);
          write("active", b);
          localStorage.removeItem(P + "staging");
        } catch (ex) {
          status("Player aberto; não foi possível gravar o cache.");
        }
        staging = null;
        label();
        frame.style.visibility = "visible";
        $("launcher").style.display = "none";
        $("launch").disabled = false;
        frame.contentWindow.focus();
      } else if (e.data.type === "aura-exit") {
        clearTimeout(timer);
        frame.style.display = "none";
        frame.src = "about:blank";
        $("launcher").style.display = "block";
        $("launch").focus();
        current = null;
        label();
      }
    },
    false
  );
  $("launch").onclick = function () {
    failed = {};
    launch();
  };
  $("update").onclick = function () {
    update(true);
  };
  d.onkeydown = function (e) {
    var k = e.keyCode;
    if (k === 37 || k === 39) {
      (d.activeElement === $("launch") ? $("update") : $("launch")).focus();
      e.preventDefault();
    } else if (k === 461) {
      if (w.webOS && w.webOS.platformBack) w.webOS.platformBack();
      else w.close();
    }
  };
  function size() {
    d.documentElement.style.fontSize =
      Math.max(14, Math.min(w.innerWidth / 58, w.innerHeight / 30)) + "px";
    d.body.style.fontSize = "1rem";
  }
  w.onresize = size;
  size();
  var saved = read("staging");
  if (valid(saved)) staging = saved;
  label();
  $("launch").focus();
  update(false);
  w.AuraLauncher = { valid: valid, best: best, update: update, launch: launch };
})(this, document);
