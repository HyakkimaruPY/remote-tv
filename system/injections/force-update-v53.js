(function(w,d){'use strict';
var R=w.RemoteTV||(w.RemoteTV={}),b=d.getElementById('forceUpdate'),busy=0;
function overlay(msg){var z=d.getElementById('rtvForce53');if(!z){z=d.createElement('section');z.id='rtvForce53';z.style.cssText='position:fixed;z-index:99999;left:0;top:0;width:1280px;height:720px;background:#080b0d;color:#fff;font:26px Arial;text-align:center;padding-top:285px;box-sizing:border-box';d.body.appendChild(z)}z.textContent=msg||'Atualizando…'}
function force(){var stamp=(new Date()).getTime();if(busy)return;busy=1;overlay('Forçando atualização do Remote TV…');try{localStorage.removeItem('remote-tv.staging.v2');localStorage.removeItem('remote-tv.active.v2');localStorage.setItem('remote-tv.force-update.v1',String(stamp))}catch(e){}setTimeout(function(){try{w.location.reload(true);return}catch(e){}try{w.history.go(0);return}catch(y){}overlay('Cache remoto limpo. Feche e abra o Player 1 para concluir a atualização.')},180)}
if(b)b.onclick=force;R.forceUpdate53=force;R.forceUpdate='0.53';
}(this,document));
