/* This code is included in the atomic app bundle; no source download/eval or native mutation. */
if(!w.XT10||!w.XT10.ensureAuth||!w.RawM3U||!w.RawM3U._v14||!w.XTVod29)throw Error('RemoteTV core incomplete');
var m3u657=w.RawM3U;
R.openM3U657=function(){
    w.RawM3U=m3u657;
    if(w.XT10&&w.XT10.log)w.XT10.log('ENTRY657','abrindo UI remota; core '+String(R.xtreamCore||'')+'; sem legacy.html');
    m3u657.open();
};
function enter657(e){
    var node=e.target;
    while(node&&node!==d.body&&node.id!=='rawLaunch'&&node.id!=='rawIn')node=node.parentNode;
    if(!node||node===d.body)return;
    if(e.preventDefault)e.preventDefault();
    if(e.stopImmediatePropagation)e.stopImmediatePropagation();else if(e.stopPropagation)e.stopPropagation();
    R.openM3U657();
}
if(w.addEventListener)w.addEventListener('click',enter657,true);
var launch657=d.getElementById('rawLaunch'),inside657=d.getElementById('rawIn');
if(launch657)launch657.onclick=R.openM3U657;
if(inside657)inside657.onclick=R.openM3U657;
w.XT10.log('BOOT657','núcleo completo instalado na aplicação; abertura remota única; legacy.html desativado');
