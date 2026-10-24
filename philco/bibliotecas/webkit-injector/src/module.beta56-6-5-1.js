/* Philco 6.5.1: ES5 page injection core for the stock QtWebKit document. */
(function(w,d){'use strict';var R=w.RemoteTV||(w.RemoteTV={}),m=R.libraryManager,owned=[];if(!m)return;
function probe(){return {ok:!!(d&&d.createElement&&(d.head||d.getElementsByTagName('head')[0])),reason:'DOM script/style injection'};}
function remove(id){var n=d.getElementById('rtvInject-'+id),i;if(n&&n.parentNode)n.parentNode.removeChild(n);for(i=owned.length-1;i>=0;i--)if(owned[i]===id)owned.splice(i,1);}
function keep(id){var i;for(i=0;i<owned.length;i++)if(owned[i]===id)return;owned.push(id);}
function css(id,source){var h=d.head||d.getElementsByTagName('head')[0],s;remove(id);s=d.createElement('style');s.id='rtvInject-'+id;s.type='text/css';if(s.styleSheet)s.styleSheet.cssText=String(source||'');else s.appendChild(d.createTextNode(String(source||'')));h.appendChild(s);keep(id);return true;}
function script(id,source){var h=d.head||d.getElementsByTagName('head')[0],s;remove(id);s=d.createElement('script');s.id='rtvInject-'+id;s.type='text/javascript';s.text=String(source||'');h.appendChild(s);keep(id);return true;}
function start(){R.webkitInjector651={css:css,script:script,remove:remove,stats:function(){return {owned:owned.length};}};}
function stop(){var copy=owned.slice(0),i;for(i=0;i<copy.length;i++)remove(copy[i]);R.webkitInjector651=null;}
m.register({id:'webkit-injector',title:'Injetor WebKit · JS e CSS',category:'injection',enabled:true,restartRequired:false,visualBytes:131072,probe:probe,start:start,stop:stop,
 test:function(scope,done){var ok=false,n;try{R.webkitInjector651.css('selftest','#rtvInjectorSelftest651{display:none}');n=d.createElement('div');n.id='rtvInjectorSelftest651';d.body.appendChild(n);ok=!!d.getElementById('rtvInject-selftest');d.body.removeChild(n);R.webkitInjector651.remove('selftest');}catch(e){}done(ok,'Injeção local de CSS/JS no documento; sem patch do binário');}});
}(this,document));
