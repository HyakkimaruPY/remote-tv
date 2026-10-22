// Philco LAN keyboard helper. Independent binary; NOT installed by the HTML manifest.
// Compile with GOOS=linux GOARCH=mipsle GOMIPS=softfloat CGO_ENABLED=0 go build.
// Local TV control: 127.0.0.1:8766; smartphone listener: 0.0.0.0:8767.
package main

import (
 "crypto/rand"
 "crypto/subtle"
 "encoding/hex"
 "encoding/json"
 "fmt"
 "io"
 "log"
 "net"
 "net/http"
 "net/url"
 "os"
 "strings"
 "sync"
 "time"
)

const ttl = 5 * time.Minute
type session struct {
 tv string
 scan string
 cookie string
 expiry time.Time
 used bool
 q string
 seq uint64
 last time.Time
}
type service struct {mu sync.Mutex; sessions map[string]*session; lanIP string; now func()time.Time}
func newService(ip string)*service{return &service{sessions:make(map[string]*session),lanIP:ip,now:time.Now}}
func token()string { b:=make([]byte,24);if _,err:=rand.Read(b);err!=nil{panic(err)};return hex.EncodeToString(b)}
func equal(a,b string)bool {if len(a)!=len(b){return false};return subtle.ConstantTimeCompare([]byte(a),[]byte(b))==1}
func (s *service) cleanLocked(){for k,v:=range s.sessions{if s.now().After(v.expiry){delete(s.sessions,k)}}}
func noCache(w http.ResponseWriter) {
 w.Header().Set("Cache-Control","no-store, max-age=0")
 w.Header().Set("Pragma","no-cache")
 w.Header().Set("X-Content-Type-Options","nosniff")
 w.Header().Set("Referrer-Policy","no-referrer")
}
func response(w http.ResponseWriter,status int,x interface{}) {
 noCache(w);w.Header().Set("Content-Type","application/json; charset=utf-8")
 w.Header().Set("Access-Control-Allow-Origin","*");w.WriteHeader(status)
 _=json.NewEncoder(w).Encode(x)
}
func (s *service) tvHandler()http.Handler{
 m:=http.NewServeMux()
 m.HandleFunc("/health",func(w http.ResponseWriter,r *http.Request){response(w,200,map[string]interface{}{"ok":true,"service":"philco-localhost-6.4.2"})})
 m.HandleFunc("/pair/new",func(w http.ResponseWriter,r *http.Request){
  if r.Method!="GET"{response(w,405,map[string]string{"error":"method"});return}
  if s.lanIP==""{response(w,503,map[string]string{"error":"no LAN IPv4 available"});return}
  s.mu.Lock();defer s.mu.Unlock();s.cleanLocked()
  if len(s.sessions)>=32{response(w,503,map[string]string{"error":"full"});return}
  id:=token();v:=&session{tv:token(),scan:token(),expiry:s.now().Add(ttl)}
  s.sessions[id]=v
  response(w,200,map[string]interface{}{"sid":id,"tvToken":v.tv,
    "phoneUrl":"http://"+net.JoinHostPort(s.lanIP,"8767")+"/pair/open?key="+url.QueryEscape(v.scan),
    "expiresIn":int(ttl.Seconds())})
 })
 m.HandleFunc("/pair/poll",func(w http.ResponseWriter,r *http.Request){
  s.mu.Lock();defer s.mu.Unlock();s.cleanLocked()
  id:=r.URL.Query().Get("sid");v:=s.sessions[id]
  if v==nil||!equal(v.tv,r.URL.Query().Get("token")){response(w,403,map[string]string{"error":"invalid"});return}
  response(w,200,map[string]interface{}{"seq":v.seq,"q":v.q,"consumed":v.used,"expiresIn":int(time.Until(v.expiry).Seconds())})
 })
 m.HandleFunc("/pair/close",func(w http.ResponseWriter,r *http.Request){
  s.mu.Lock();defer s.mu.Unlock()
  id:=r.URL.Query().Get("sid");v:=s.sessions[id]
  if v==nil||!equal(v.tv,r.URL.Query().Get("token")){response(w,403,map[string]string{"error":"invalid"});return}
  delete(s.sessions,id);response(w,200,map[string]bool{"ok":true})
 })
 return m
}
func (s *service) phoneHandler()http.Handler {
 m:=http.NewServeMux()
 m.HandleFunc("/pair/open",func(w http.ResponseWriter,r *http.Request){
  if r.Method!="GET"{http.Error(w,"method",405);return}
  s.mu.Lock();var id string;var v *session;now:=s.now()
  for k,x:=range s.sessions{if !x.used&&now.Before(x.expiry)&&equal(x.scan,r.URL.Query().Get("key")){id=k;v=x;break}}
  if v==nil{s.mu.Unlock();noCache(w);http.Error(w,"QR expirado ou utilizado",410);return}
  v.used=true;v.scan="";v.cookie=token() // burn scanned key before handing the webpage to phone.
  cookie:=v.cookie;s.mu.Unlock()
  http.SetCookie(w,&http.Cookie{Name:"philco_phone",Value:cookie,Path:"/pair",HttpOnly:true,SameSite:http.SameSiteStrictMode,MaxAge:300})
  noCache(w);w.Header().Set("Content-Type","text/html; charset=utf-8")
  w.Header().Set("Content-Security-Policy","default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'")
  w.Header().Set("X-Frame-Options","DENY")
  fmt.Fprintf(w,"<!doctype html><html lang='pt-BR'><head><meta name='viewport' content='width=device-width,initial-scale=1'><meta charset='utf-8'><title>Philco · Busca</title><style>body{background:#080808;color:#fff;font:18px Arial;margin:24px}input{background:#222;color:#fff;border:1px solid #777;width:90%%;font:25px Arial;padding:14px}</style></head><body><h2>Teclado Philco</h2><p>Este QR já foi utilizado. Digite na TV por esta sessão.</p><input id='q' maxlength='120' autofocus placeholder='Buscar título'><p id='status'>Conectado</p><script>var id='%s',timer=0;document.getElementById('q').oninput=function(){clearTimeout(timer);timer=setTimeout(function(){var x=new XMLHttpRequest();x.open('POST','/pair/input',true);x.setRequestHeader('Content-Type','application/x-www-form-urlencoded');x.onreadystatechange=function(){if(x.readyState===4&&x.status!==200)document.getElementById('status').textContent='Sessão expirada';};x.send('sid='+encodeURIComponent(id)+'&q='+encodeURIComponent(document.getElementById('q').value));},250);};</script></body></html>",id)
 })
 m.HandleFunc("/pair/input",func(w http.ResponseWriter,r *http.Request){
  if r.Method!="POST"{http.Error(w,"method",405);return}
  if r.ContentLength>4096{http.Error(w,"large",413);return}
  r.Body=http.MaxBytesReader(w,r.Body,4096)
  if err:=r.ParseForm();err!=nil{http.Error(w,"form",400);return}
  sid:=r.FormValue("sid");c,err:=r.Cookie("philco_phone")
  s.mu.Lock();defer s.mu.Unlock();s.cleanLocked()
  v:=s.sessions[sid];if err!=nil||v==nil||!v.used||!equal(v.cookie,c.Value){http.Error(w,"session",403);return}
  now:=s.now();if now.Sub(v.last)<120*time.Millisecond{http.Error(w,"slow down",429);return}
  text:=[]rune(r.FormValue("q"));if len(text)>120{text=text[:120]}
  v.q=string(text);v.seq++;v.last=now
  response(w,200,map[string]interface{}{"ok":true,"seq":v.seq})
 })
 return m
}
func pickLAN()string {
 preferred:=[]string{"ra0","wlan0","eth0","en0"}
 iface,_:=net.Interfaces()
 for _,hint:=range append(preferred,""){
  for _,it:=range iface {
   if hint!=""&&it.Name!=hint{continue}
   if it.Flags&net.FlagUp==0||it.Flags&net.FlagLoopback!=0{continue}
   addrs,_:=it.Addrs()
   for _,a:=range addrs {
    ip,_,err:=net.ParseCIDR(a.String());if err!=nil{continue}
    v:=ip.To4();if v!=nil&&v.IsPrivate(){return v.String()}
   }
  }
 }
 return ""
}
func main(){
 ip:=pickLAN();if v:=strings.TrimSpace(os.Getenv("PHILCO_LAN_IP"));v!=""&&net.ParseIP(v)!=nil {ip=v}
 if ip==""{log.Println("LAN interface unavailable; QR service not started");return}
 s:=newService(ip);tv:=&http.Server{Addr:"127.0.0.1:8766",Handler:s.tvHandler(),ReadHeaderTimeout:3*time.Second,IdleTimeout:15*time.Second,MaxHeaderBytes:8<<10}
 lan:=&http.Server{Addr:":8767",Handler:s.phoneHandler(),ReadHeaderTimeout:3*time.Second,IdleTimeout:20*time.Second,MaxHeaderBytes:8<<10}
 go func(){log.Fatal(tv.ListenAndServe())}()
 log.Printf("Philco pairing: loopback :8766, smartphone LAN %s:8767",ip)
 if err:=lan.ListenAndServe();err!=nil&&err!=http.ErrServerClosed {log.Fatal(err)}
 _=io.Discard
}
