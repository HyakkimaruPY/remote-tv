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
 "strconv"
 "strings"
 "syscall"
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
const portalRoot = "/Customer/apps/remote-tv-portal"
const portalHelloDir = portalRoot + "/hello"
const portalAppCfg = "/Customer/app.cfg"
const portalBegin = "// REMOTE_TV_PORTAL_HELLO_BEGIN"
const portalEnd = "// REMOTE_TV_PORTAL_HELLO_END"
var portalMu sync.Mutex

func procPIDs(needle string) []int {
 entries, _ := os.ReadDir("/proc")
 out := []int{}
 for _, e := range entries {
  if !e.IsDir() { continue }
  pid, err := strconv.Atoi(e.Name()); if err != nil { continue }
  b, err := os.ReadFile("/proc/"+e.Name()+"/cmdline"); if err != nil { continue }
  cmd := strings.ReplaceAll(string(b), "\x00", " ")
  if strings.Contains(cmd, needle) { out = append(out, pid) }
 }
 return out
}
func executable(path string) bool {
 st, err := os.Stat(path)
 return err == nil && !st.IsDir() && st.Mode()&0111 != 0
}
func portalProbe() map[string]interface{} {
 reasons := []string{}
 if _, err := os.Stat(portalAppCfg); err != nil { reasons = append(reasons, "app.cfg ausente") }
 if !executable("/applications/MWB/MstarLauncher") { reasons = append(reasons, "MstarLauncher ausente") }
 if !executable("/applications/apm/bigbang") { reasons = append(reasons, "bigbang ausente") }
 if len(procPIDs("/applications/apm/appmgr")) == 0 { reasons = append(reasons, "appmgr não está ativo") }
 if len(procPIDs("/applications/apm/bigbang")) == 0 { reasons = append(reasons, "supervisor bigbang não está ativo") }
 if err := os.MkdirAll(portalRoot, 0755); err != nil { reasons = append(reasons, "Customer sem escrita") } else {
  p := portalRoot + "/.probe"
  if err := os.WriteFile(p, []byte("ok"), 0600); err != nil { reasons = append(reasons, "Customer sem escrita") } else { _ = os.Remove(p) }
 }
 return map[string]interface{}{"ok":len(reasons)==0,"portal":true,"helloWorld":len(reasons)==0,"reasons":reasons}
}
func helloHTML() string {
 return "<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=1280,height=720'><title>Hello World</title><style>html,body{margin:0;width:100%;height:100%;background:#050505;color:#f4f4f4;font-family:Arial;overflow:hidden}main{position:absolute;left:0;top:0;width:1280px;height:720px;text-align:center}h1{font-size:64px;font-weight:normal;margin:270px 0 12px}p{font-size:20px;color:#888}</style></head><body><main><h1>Hello World</h1><p>Remote TV · Portal Philco</p></main></body></html>\n"
}
func helloBlock() string {
 return portalBegin+"\n"+
  "[RemoteTVHello]\n"+
  "pretty_name=Hello World\n"+
  "icon_path=/applications/CommUI/rc/rc/img/Demo_img/App/GRIDMENU_IMG_DEFAULT.png\n"+
  "path=/applications/MWB/MstarLauncher\n"+
  "exe_type=app\n"+
  "exe_domain=native\n"+
  "exclusive=0\n"+
  "argv1 = \"-qws -display directfb:layerid=0:boundingrectflip:videoonly -maximize -transparent-background -nomouse -app MSTARLAUNCHER file:///Customer/apps/remote-tv-portal/hello/index.html\"\n"+
  "envv1 = QT_PLUGIN_PATH=/vendor/lib/qt/plugins/ MSTAR_DEVICE_INPUT=APM DFB_LAYER=0 WINDOW_STACK=middle\n"+
  "envv2 = LD_LIBRARY_PATH=/applications/appdata/:/applications/MWB/lib:/config:/vendor/lib:/vendor/lib/utopia:/vendor/lib/directfb-1.4-0/inputdrivers:/vendor/lib/qt/plugins/gfxdrivers/\n"+
  "envv3 = MSTAR_QT_KEYMAP=/applications/MWB/mstarkeymap.csv CERT_CA_BUNDLE_PATH=/applications/MWB/certificates\n"+
  "envv4 = WEB_RESOLUTION_WIDTH=1280 WEB_RESOLUTION_HEIGHT=720\n"+
  "timeout=0\npriority=\nhotkey1=\n"+
  portalEnd+"\n"
}
func stripPortalBlock(s string) string {
 a := strings.Index(s, portalBegin)
 if a < 0 { return s }
 b := strings.Index(s[a:], portalEnd)
 if b < 0 { return s }
 b = a + b + len(portalEnd)
 for b < len(s) && (s[b] == '\r' || s[b] == '\n') { b++ }
 return strings.TrimRight(s[:a], "\r\n") + "\n" + s[b:]
}
func atomicWrite(path string, data []byte, fallback os.FileMode) error {
 mode := fallback
 if st, err := os.Stat(path); err == nil { mode = st.Mode().Perm() }
 tmp := path + ".remote-tv.tmp"
 f, err := os.OpenFile(tmp, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, mode); if err != nil { return err }
 if _, err = f.Write(data); err == nil { err = f.Sync() }
 if e := f.Close(); err == nil { err = e }
 if err != nil { _ = os.Remove(tmp); return err }
 if err = os.Rename(tmp, path); err != nil { _ = os.Remove(tmp); return err }
 return nil
}
func restartAppMgr(old []int) error {
 oldSet := map[int]bool{}; for _, p := range old { oldSet[p] = true }
 for _, pid := range old {
  if p, err := os.FindProcess(pid); err == nil { _ = p.Signal(syscall.SIGTERM) }
 }
 deadline := time.Now().Add(8*time.Second)
 for time.Now().Before(deadline) {
  time.Sleep(150*time.Millisecond)
  for _, pid := range procPIDs("/applications/apm/appmgr") {
   if !oldSet[pid] { return nil }
  }
 }
 return fmt.Errorf("appmgr não foi relançado pelo bigbang")
}
func portalHelloStatus() map[string]interface{} {
 b, _ := os.ReadFile(portalAppCfg)
 cfg := string(b)
 _, pageErr := os.Stat(portalHelloDir+"/index.html")
 installed := strings.Contains(cfg, portalBegin) && strings.Contains(cfg, "[RemoteTVHello]") && pageErr == nil
 return map[string]interface{}{"ok":true,"installed":installed,"appmgr":len(procPIDs("/applications/apm/appmgr"))>0}
}
func applyPortalHello(enable bool) error {
 portalMu.Lock(); defer portalMu.Unlock()
 cap := portalProbe(); if ok, _ := cap["ok"].(bool); !ok { return fmt.Errorf("Portal indisponível") }
 before, err := os.ReadFile(portalAppCfg); if err != nil { return err }
 cfg := stripPortalBlock(string(before))
 if enable {
  if err = os.MkdirAll(portalHelloDir, 0755); err != nil { return err }
  if err = atomicWrite(portalHelloDir+"/index.html", []byte(helloHTML()), 0644); err != nil { return err }
  if _, err = os.Stat(portalRoot+"/app.cfg.before-hello"); os.IsNotExist(err) {
   _ = atomicWrite(portalRoot+"/app.cfg.before-hello", before, 0600)
  }
  cfg = strings.TrimRight(cfg, "\r\n") + "\n\n" + helloBlock()
 }
 if !enable { _ = os.RemoveAll(portalHelloDir) }
 if string(before) == cfg { return nil }
 if err = atomicWrite(portalAppCfg, []byte(cfg), 0644); err != nil { return err }
 old := procPIDs("/applications/apm/appmgr")
 if err = restartAppMgr(old); err != nil {
  _ = atomicWrite(portalAppCfg, before, 0644)
  return err
 }
 return nil
}
func portalAllowed(r *http.Request) bool {
 if r.Header.Get("X-Remote-TV-Portal") != "651" { return false }
 o := strings.ToLower(strings.TrimSpace(r.Header.Get("Origin")))
 ref := strings.ToLower(strings.TrimSpace(r.Header.Get("Referer")))
 if o == "" || o == "null" || strings.HasPrefix(o, "file://") || strings.HasPrefix(o, "http://127.0.0.1") { return true }
 if strings.HasPrefix(ref, "file://") || strings.Contains(ref, "127.0.0.1") { return true }
 return false
}
func portalJSON(w http.ResponseWriter, r *http.Request, status int, x interface{}) {
 noCache(w)
 w.Header().Set("Content-Type","application/json; charset=utf-8")
 w.Header().Set("Access-Control-Allow-Origin","*")
 w.Header().Set("Access-Control-Allow-Headers","X-Remote-TV-Portal, Content-Type")
 w.Header().Set("Access-Control-Allow-Methods","GET, POST, OPTIONS")
 if r.Method == "OPTIONS" { w.WriteHeader(204); return }
 w.WriteHeader(status); _ = json.NewEncoder(w).Encode(x)
}

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
 m.HandleFunc("/health",func(w http.ResponseWriter,r *http.Request){response(w,200,map[string]interface{}{"ok":true,"service":"philco-localhost-6.5.1","portal":true})})
 m.HandleFunc("/portal/capabilities",func(w http.ResponseWriter,r *http.Request){
  if r.Method=="OPTIONS"{portalJSON(w,r,204,map[string]bool{"ok":true});return}
  if r.Method!="GET"||!portalAllowed(r){portalJSON(w,r,403,map[string]string{"error":"forbidden"});return}
  portalJSON(w,r,200,portalProbe())
 })
 m.HandleFunc("/portal/hello/status",func(w http.ResponseWriter,r *http.Request){
  if r.Method=="OPTIONS"{portalJSON(w,r,204,map[string]bool{"ok":true});return}
  if r.Method!="GET"||!portalAllowed(r){portalJSON(w,r,403,map[string]string{"error":"forbidden"});return}
  portalJSON(w,r,200,portalHelloStatus())
 })
 m.HandleFunc("/portal/hello/enable",func(w http.ResponseWriter,r *http.Request){
  if r.Method=="OPTIONS"{portalJSON(w,r,204,map[string]bool{"ok":true});return}
  if r.Method!="POST"||!portalAllowed(r){portalJSON(w,r,403,map[string]string{"error":"forbidden"});return}
  if err:=applyPortalHello(true);err!=nil{portalJSON(w,r,500,map[string]string{"error":err.Error()});return}
  portalJSON(w,r,200,portalHelloStatus())
 })
 m.HandleFunc("/portal/hello/disable",func(w http.ResponseWriter,r *http.Request){
  if r.Method=="OPTIONS"{portalJSON(w,r,204,map[string]bool{"ok":true});return}
  if r.Method!="POST"||!portalAllowed(r){portalJSON(w,r,403,map[string]string{"error":"forbidden"});return}
  if err:=applyPortalHello(false);err!=nil{portalJSON(w,r,500,map[string]string{"error":err.Error()});return}
  portalJSON(w,r,200,portalHelloStatus())
 })
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
