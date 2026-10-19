(function (w, d) {
  "use strict";
  var A = w.Aura;
  function $(i) {
    return A.$(i);
  }
  function button(text, action, cls) {
    var b = d.createElement("button");
    b.textContent = text;
    b.className = cls || "";
    b.onclick = action;
    return b;
  }
  function screen(html) {
    A.cancel();
    $("screen").innerHTML = html;
    A.notice("");
  }
  function nav() {
    var n = $("nav");
    n.innerHTML = "";
    n.appendChild(button("Launcher", exit));
    $("sourceShell").style.display = "block";
  }
  function exit() {
    A.cancel();
    if (A.Player) A.Player.stop();
    w.parent.postMessage({ type: "aura-exit", token: w.AuraBoot.token }, "*");
  }
  function home() {
    screen(
      '<section class="welcome"><p class="muted">AURA PLAYER</p><h1>O que você quer assistir?</h1><p class="muted">Escolha como conectar sua biblioteca.</p><div class="choices" id="choices"></div></section>',
      "home"
    );
    nav();
    var c = $("choices");
    c.appendChild(
      button("", function () {
        connectRemote();
      })
    );
    c.appendChild(
      button("", function () {
        form("api");
      })
    );
    c.appendChild(
      button("", function () {
        form("m3u");
      })
    );
    var a = c.children;
    a[0].innerHTML =
      "<strong>M3U remoto</strong><span>Sua lista da pasta Remote TV LG.</span>";
    a[1].innerHTML =
      "<strong>Credenciais</strong><span>Servidor, usuário e senha · Xtream / XUI.</span>";
    a[2].innerHTML =
      "<strong>M3U completo</strong><span>Cole uma URL ou o conteúdo de uma lista.</span>";
    A.focus();
  }
  function connectRemote() {
    A.cancel();
    A.notice("Conectando à fonte remota…");
    A.openSource(w.AuraBoot.remote, w.AuraBoot.remote, function (err, s) {
      if (err) return A.notice(err);
      connected(s, "remote");
    });
  }
  function form(kind) {
    screen(
      '<section class="form"><h1>' +
        (kind === "api" ? "Conectar sua conta" : "Abrir M3U") +
        '</h1><div id="fields"></div><label><input id="remember" type="checkbox"> Lembrar acesso neste aparelho</label><p class="muted">O acesso lembrado fica no armazenamento local deste aparelho.</p><button id="connect">Conectar</button> <button id="back">Voltar</button></section>',
      "form"
    );
    var f = $("fields"),
      saved = A.load("access", {});
    if (kind === "api") {
      f.innerHTML =
        '<label>Servidor completo<input id="host" placeholder="https://servidor:porta" type="url"></label><label>Usuário<input id="user" autocomplete="username"></label><label>Senha<input id="pass" type="password" autocomplete="current-password"></label>';
      $("host").value = saved.host || "";
      $("user").value = saved.user || "";
      $("pass").value = saved.pass || "";
    } else {
      f.innerHTML =
        '<label>Link ou conteúdo M3U<textarea id="m3u" spellcheck="false" placeholder="https://… ou #EXTM3U"></textarea></label>';
      $("m3u").value = saved.value || "";
    }
    $("remember").checked = !!saved.kind;
    $("back").onclick = home;
    $("connect").onclick = function () {
      A.cancel();
      var remember = $("remember").checked,
        c,
        v;
      if (kind === "api")
        c = {
          host: $("host").value.replace(/^\s+|\s+$/g, ""),
          user: $("user").value,
          pass: $("pass").value,
        };
      else v = $("m3u").value;
      A.notice("Validando acesso…");
      function done(err, s) {
        if (err) return A.notice(err);
        if (remember)
          A.save(
            "access",
            kind === "api"
              ? { kind: kind, host: c.host, user: c.user, pass: c.pass }
              : { kind: kind, value: v }
          );
        else A.save("access", {});
        connected(s, kind === "api" ? c.host + "|" + c.user : v);
      }
      if (kind === "api") A.authenticate(c, done);
      else A.openSource(v, w.AuraBoot.remote, done);
    };
    A.focus();
  }
  function connected(source, identity) {
    A.currentSource = source;
    A.account = A.hash(
      source.credentials
        ? source.credentials.host + "|" + source.credentials.user
        : identity
    );
    A.betaOpen();
  }
  A.storageKey = function (k) {
    return "aura.lg.beta." + A.account + "." + k;
  };
  A.baseURL = function () {
    return A.currentSource && A.currentSource.credentials
      ? A.currentSource.credentials.host + "/"
      : w.AuraBoot.remote;
  };
  A.sourceHome = home;
})(this, document);
