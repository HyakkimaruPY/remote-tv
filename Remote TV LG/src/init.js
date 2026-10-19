(function (w, d) {
  "use strict";
  var A = w.Aura;
  function size() {
    var fs = Math.min(w.innerWidth / 64, w.innerHeight / 36);
    d.documentElement.style.fontSize = Math.max(8, fs) + "px";
    d.body.style.fontSize = "1rem";
    if (w.RawPlayer && A.Player.active()) {
      var root = A.$("r14");
      if (root && root.className.indexOf("live") >= 0)
        w.RawPlayer.fullscreen(false);
    }
  }
  w.addEventListener("resize", size, false);
  size();
  d.addEventListener(
    "keydown",
    function (e) {
      if (A.$("sourceShell").style.display === "none") return;
      var k = e.keyCode;
      if (
        k === 461 ||
        k === 27 ||
        (k === 8 && !/INPUT|TEXTAREA/.test(d.activeElement.tagName))
      ) {
        e.preventDefault();
        if (A.$("choices"))
          w.parent.postMessage(
            { type: "aura-exit", token: w.AuraBoot.token },
            "*"
          );
        else A.sourceHome();
        return;
      }
      if (
        (k === 38 || k === 40) &&
        /INPUT|TEXTAREA/.test(d.activeElement.tagName)
      ) {
        var fields = A.$("screen").querySelectorAll("input,textarea,button"),
          i;
        for (i = 0; i < fields.length; i++)
          if (
            fields[i] === d.activeElement &&
            fields[i + (k === 38 ? -1 : 1)]
          ) {
            fields[i + (k === 38 ? -1 : 1)].focus();
            e.preventDefault();
            break;
          }
      } else A.spatial(e);
    },
    false
  );
  d.onkeydown = function (e) {
    if (
      A.$("sourceShell").style.display === "none" &&
      w.RawM3U &&
      w.RawM3U.key(e)
    ) {
      e.preventDefault();
      return false;
    }
  };
  A.sourceHome();
  A.$("vlabel").textContent = "LG " + w.AuraBoot.version + " · RemoteTV beta.5";
  w.parent.postMessage({ type: "aura-ready", token: w.AuraBoot.token }, "*");
})(this, document);
