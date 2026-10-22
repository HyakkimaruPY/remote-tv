package main

import (
 "encoding/json"
 "io"
 "net/http"
 "net/http/httptest"
 "net/url"
 "strings"
 "testing"
 "time"
)
func get(t *testing.T,u string)*http.Response{t.Helper();r,e:=http.Get(u);if e!=nil{t.Fatal(e)};return r}
func TestQRBurnAndRemoteInput(t *testing.T){
 s:=newService("192.168.88.40");local:=httptest.NewServer(s.tvHandler());defer local.Close()
 phone:=httptest.NewServer(s.phoneHandler());defer phone.Close()
 r:=get(t,local.URL+"/pair/new");defer r.Body.Close()
 if r.StatusCode!=200{t.Fatalf("create=%d",r.StatusCode)}
 var data struct{SID string `json:"sid"`; TVToken string `json:"tvToken"`; PhoneURL string `json:"phoneUrl"`}
 if e:=json.NewDecoder(r.Body).Decode(&data);e!=nil{t.Fatal(e)}
 u,e:=url.Parse(data.PhoneURL);if e!=nil{t.Fatal(e)}
 if u.Host!="192.168.88.40:8767"{t.Fatalf("wrong LAN discovery: %s",u.Host)}
 scanned:=phone.URL+"/pair/open?key="+url.QueryEscape(u.Query().Get("key"))
 r=get(t,scanned);if r.StatusCode!=200{t.Fatalf("first scan=%d",r.StatusCode)}
 cookie:=r.Cookies();io.Copy(io.Discard,r.Body);r.Body.Close()
 if len(cookie)==0{t.Fatal("cookie absent")}
 r=get(t,scanned);r.Body.Close();if r.StatusCode!=410{t.Fatalf("second scan should burn: %d",r.StatusCode)}
 body:=strings.NewReader("sid="+url.QueryEscape(data.SID)+"&q="+url.QueryEscape("Teste pelo celular"))
 req,_:=http.NewRequest("POST",phone.URL+"/pair/input",body);req.Header.Set("Content-Type","application/x-www-form-urlencoded")
 req.AddCookie(cookie[0]);rr,e:=http.DefaultClient.Do(req);if e!=nil{t.Fatal(e)};rr.Body.Close();if rr.StatusCode!=200{t.Fatalf("send=%d",rr.StatusCode)}
 rr=get(t,local.URL+"/pair/poll?sid="+data.SID+"&token="+data.TVToken)
 var result struct{Q string `json:"q"`;Seq int `json:"seq"`}
 if e:=json.NewDecoder(rr.Body).Decode(&result);e!=nil{t.Fatal(e)};rr.Body.Close()
 if result.Q!="Teste pelo celular"||result.Seq!=1{t.Fatalf("invalid result: %+v",result)}
 rr=get(t,local.URL+"/pair/close?sid="+data.SID+"&token="+data.TVToken);rr.Body.Close();if rr.StatusCode!=200{t.Fatal("revoke failed")}
 rr=get(t,local.URL+"/pair/poll?sid="+data.SID+"&token="+data.TVToken);rr.Body.Close();if rr.StatusCode!=403{t.Fatal("poll after close not revoked")}
 rr=get(t,phone.URL+"/pair/new");rr.Body.Close();if rr.StatusCode==200{t.Fatal("public listener exposed create")}
}
func TestQRExpiration(t *testing.T){
 s:=newService("192.168.7.4");clock:=time.Now();s.now=func()time.Time{return clock}
 local:=httptest.NewServer(s.tvHandler());defer local.Close();r:=get(t,local.URL+"/pair/new")
 var data struct{PhoneURL string `json:"phoneUrl"`}
 _=json.NewDecoder(r.Body).Decode(&data);r.Body.Close()
 u,_:=url.Parse(data.PhoneURL);clock=clock.Add(ttl+time.Second)
 phone:=httptest.NewServer(s.phoneHandler());defer phone.Close()
 r=get(t,phone.URL+"/pair/open?key="+url.QueryEscape(u.Query().Get("key")));r.Body.Close()
 if r.StatusCode!=410{t.Fatalf("expired QR opened: %d",r.StatusCode)}
}
