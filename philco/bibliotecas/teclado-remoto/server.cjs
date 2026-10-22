/* Philco remote keyboard relay — Node 18+, no dependencies; run behind HTTPS or on trusted LAN. */
'use strict';
const http=require('http'),crypto=require('crypto'),url=require('url'),querystring=require('querystring');
const PORT=Number(process.env.PORT||8766),HOST=process.env.HOST||'0.0.0.0';
const PUBLIC_BASE_URL=String(process.env.PUBLIC_BASE_URL||'').replace(/\/$/,'');
const TTL=300000,MAX_SESSIONS=150, sessions=new Map(),clientHits=new Map();
function random(){return crypto.randomBytes(24).toString('hex');}
function json(res,status,data){const s=JSON.stringify(data);res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Pragma':'no-cache','Access-Control-Allow-Origin':'*','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'"});res.end(s);}
function valid(a,b){const x=Buffer.from(String(a||'')),y=Buffer.from(String(b||''));return x.length===y.length&&crypto.timingSafeEqual(x,y);}
function prune(){let now=Date.now();for(let [id,s] of sessions){if(s.exp<now)sessions.delete(id);}for(let [id,s] of clientHits){if(s.until<now)clientHits.delete(id);}}
function limit(ip){const now=Date.now(),s=clientHits.get(ip)||{n:0,until:now+60000};if(now>s.until){s.n=0;s.until=now+60000;}s.n++;clientHits.set(ip,s);return s.n<=180;}
function page(sid,token){const safe=JSON.stringify({sid,token});
return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Philco · Teclado remoto</title><style>body{background:#080808;color:#eee;font:18px Arial;margin:24px}input{background:#1b1b1b;border:1px solid #888;color:#fff;font-size:24px;padding:15px;width:90%}p{color:#bbb}</style></head><body><h2>Philco · Teclado remoto</h2><p>Digite o título para buscar na TV. Esta sessão expira em 5 minutos.</p><input id="q" maxlength="120" autofocus placeholder="Buscar filme, série ou canal"><p id="status">Conectado ao teclado remoto</p><script>var session='+safe+';var timer=0;var last="";function send(){var t=document.getElementById("q").value;if(t===last)return;last=t;fetch("/session/send",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"sid="+encodeURIComponent(session.sid)+"&token="+encodeURIComponent(session.token)+"&q="+encodeURIComponent(t)}).then(function(r){if(!r.ok)throw Error("expirou");return r.json();}).then(function(){document.getElementById("status").textContent="Enviado para a TV";}).catch(function(){document.getElementById("status").textContent="Sessão expirada ou indisponível";});}document.getElementById("q").addEventListener("input",function(){clearTimeout(timer);timer=setTimeout(send,180);});</script></body></html>';
}
function server(req,res){prune();const parsed=url.parse(req.url,true),path=parsed.pathname,ip=req.socket.remoteAddress||'';if(!limit(ip)){json(res,429,{error:'rate_limited'});return;}
if(req.method==='GET'&&path==='/health'){json(res,200,{ok:true,service:'philco-phone-6.4'});return;}
if(req.method==='GET'&&path==='/session/create'){
 if(!/^https?:\/\//.test(PUBLIC_BASE_URL)){json(res,503,{error:'PUBLIC_BASE_URL not configured'});return;}
 if(sessions.size>=MAX_SESSIONS){json(res,503,{error:'capacity'});return;}
 const sid=random(),tv=random(),phone=random();sessions.set(sid,{tv,phone,seq:0,q:'',exp:Date.now()+TTL,last:0});
 json(res,200,{sid,tvToken:tv,phoneUrl:PUBLIC_BASE_URL+'/phone?sid='+encodeURIComponent(sid)+'&token='+encodeURIComponent(phone),expiresIn:300});return;
}
if(req.method==='GET'&&path==='/session/poll'){
 let s=sessions.get(String(parsed.query.sid||''));if(!s||!valid(parsed.query.token,s.tv)){json(res,403,{error:'invalid_session'});return;}
 json(res,200,{seq:s.seq,q:s.q,expiresIn:Math.max(0,Math.floor((s.exp-Date.now())/1000))});return;
}
if(req.method==='GET'&&path==='/phone'){
 const sid=String(parsed.query.sid||''),token=String(parsed.query.token||''),s=sessions.get(sid);
 if(!s||!valid(token,s.phone)){res.writeHead(403,{'Cache-Control':'no-store'});res.end('Sessão expirada');return;}
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'"});res.end(page(sid,token));return;
}
if(req.method==='POST'&&path==='/session/send'){
 let body='';req.on('data',b=>{body+=b;if(body.length>4096)req.destroy();});req.on('end',()=>{let p=querystring.parse(body),s=sessions.get(String(p.sid||''));if(!s||!valid(p.token,s.phone)){json(res,403,{error:'invalid_session'});return;}
 const q=String(p.q||'').slice(0,120),now=Date.now();if(now-s.last<100){json(res,429,{error:'rate_limited'});return;}
 s.last=now;s.q=q;s.seq++;json(res,200,{ok:true,seq:s.seq});});return;
}
json(res,404,{error:'not_found'});
}
if(require.main===module){http.createServer(server).listen(PORT,HOST,()=>console.log('Philco phone relay listening',HOST,PORT));}
module.exports={server,prune};
