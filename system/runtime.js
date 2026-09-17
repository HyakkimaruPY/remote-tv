(function(w,d){'use strict';
var R=w.RemoteTV;if(!R)return;var p=R.data.policy||{};R.policy=p;
R.flag=function(k,f){var o=p.features||{};return o[k]===undefined?!!f:!!o[k]};
R.bridge={
 fetch:function(url,cb,timeout){return R.fetch(url,cb,timeout||((p.bridge||{}).request_timeout_ms||9000))},
 url:function(url){return R.bridgeURL(url)}
};
R.setStatus=function(s){try{var e=d.getElementById('rtvStatus');if(e)e.textContent=s}catch(x){}};
}(this,document));
