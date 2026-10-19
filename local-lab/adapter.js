(function(w,d){'use strict';
// Test adapter only: real browser video; simulated QJY/MStar ABI, not a TV emulator.
var lab=w.TVLab={players:[],calls:[],scenario:'healthy',firstFrames:[],errors:[],session:0};
function log(name,value){lab.calls.push({name:name,value:value,at:performance.now()})}
function bridgeURL(u){return 'http://127.0.0.1:8765/fetch?u='+encodeURIComponent(u)}
w.RemoteTV={data:{},release:'local-0.55',ready:function(id){lab.ready=id},bridgeURL:bridgeURL,fetch:function(u,cb,timeout){var x=new XMLHttpRequest();x.open('GET',bridgeURL(u),true);x.timeout=timeout||9000;x.onload=function(){cb(x.status==200?null:'HTTP '+x.status,x.responseText)};x.onerror=function(){cb('network','')};x.ontimeout=function(){cb('timeout','')};x.send()}};
w.QjyScript=function(){this.exec=function(name){log('exec',name)}};
w.QjyMediaPlayer=function(){
var self=this,active=false,v=null,mode=0,token=0,id=lab.players.length+1,rect=[326,72,926,500];lab.players.push(this);
function geometry(){if(!v)return;v.style.left=rect[0]+'px';v.style.top=rect[1]+'px';v.style.width=rect[2]+'px';v.style.height=rect[3]+'px'}
this.getNativePlayerInstanceID=function(){return id};
this.initMediaPlayer=function(){log('init',id);return 0};
this.setNativeUIFlag=function(){};this.setMuteFlag=function(on){if(v)v.muted=!!on};
this.setVideoAlpha=function(a){if(v)v.style.opacity=a==100?'0':'1'};
this.setVideoDisplayMode=function(full){if(full)rect=[0,0,1280,720];geometry();log('displayMode',full)};
this.setVideoDisplayArea=function(x,y,width,height){rect=[x,y,width,height];geometry();log('displayArea',rect.slice())};
this.refreshVideoDisplay=function(){geometry()};
this.getVideoDisplayLeft=function(){return rect[0]};this.getVideoDisplayTop=function(){return rect[1]};this.getVideoDisplayWidth=function(){return rect[2]};this.getVideoDisplayHeight=function(){return rect[3]};
this.setSingleMedia=function(s){var m=/mediaUrl:"((?:\\.|[^"\\])*)"/.exec(s);self.url=m?JSON.parse('"'+m[1]+'"'):s;log('setMedia',id);return lab.scenario=='reject'?-1:0};
this.playFromStart=function(){
log('play',id);if(lab.scenario=='reject')return -1;active=true;var k=++token,start=performance.now();
v=d.createElement('video');v.setAttribute('data-native-sim',id);v.style.cssText='position:fixed;z-index:0;object-fit:contain;border:0;border-radius:0;background:#000;pointer-events:none';geometry();v.muted=true;v.loop=true;d.body.insertBefore(v,d.body.firstChild);
function run(){if(!active||k!=token)return;v.src='/media/channel.webm';v.onplaying=function(){mode=2;lab.firstFrames.push(performance.now()-start)};var p=v.play();if(p&&p.catch)p.catch(function(e){lab.errors.push(String(e))})}
// Exercise the bridge contract before visual playback, independently of host codec.
var url=String(self.url||'');if(/^http:\/\/tv\.fixture/.test(url))url=bridgeURL(url);
fetch(url).then(function(r){if(!r.ok)throw Error('HTTP '+r.status);return r.text()}).then(function(s){if(!active||k!=token)return;var segment=s.split('\n').filter(function(l){return l&&l.charAt(0)!='#'})[0];if(segment)return fetch(new URL(segment,location.origin)).then(function(r){if(!r.ok)throw Error('segment');return r.arrayBuffer()})}).then(function(){if(lab.scenario=='slow')setTimeout(run,1200);else if(lab.scenario!='stalled')run()}).catch(function(e){if(active&&k==token){mode=-1;lab.errors.push(String(e))}});
return 0};
this.stop=function(){active=false;token++;mode=0;if(v){v.pause();v.removeAttribute('src');v.load();if(v.parentNode)v.parentNode.removeChild(v);v=null}log('stop',id)};
this.releaseMediaPlayer=function(){self.stop();log('release',id)};
this.getPlaybackMode=function(){return mode};this.getCurrentPlayTime=function(){return v?v.currentTime:0};
this.pause=function(){if(v)v.pause()};this.resume=function(){if(v)v.play()};
};
var channels=[];for(var i=0;i<96;i++)channels.push(['Canal de teste '+(i+1),'Categoria '+(Math.floor(i/12)+1),'http://tv.fixture/live/demo/demo/'+(i+1)+'.m3u8','http://tv.fixture/logo/'+(i+1)+'.svg']);
w.YTCore={channels:channels,compat:function(u){return /^https:/i.test(u)?['http://127.0.0.1:8765/hls?u='+encodeURIComponent(u)]:[u]},media:function(u,p){return '[{mediaUrl:'+JSON.stringify(u)+',mediaType:'+p.m+'}]'},normal:function(v){return String(v)=='2'||/NormalPlay/i.test(v)},videoId:function(){return null},videos:function(){return[]},jsonAfter:function(){return null}};
}(window,document));
