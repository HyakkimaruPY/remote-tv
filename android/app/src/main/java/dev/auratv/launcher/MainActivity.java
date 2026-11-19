package dev.auratv.launcher;

import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import androidx.webkit.WebViewAssetLoader;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MimeTypes;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.ui.PlayerView;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.InputStream;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class MainActivity extends Activity {
    private static final String ORIGIN="https://appassets.androidplatform.net";
    private final Handler main=new Handler(Looper.getMainLooper());
    private final ExecutorService io=Executors.newSingleThreadExecutor();
    private AppDb db;
    private CatalogClient client;
    private RemoteUi releases;
    private WebView web;
    private FrameLayout root;
    private PlayerView playerView;
    private ExoPlayer player;
    private long profileId=0,playProfile=0;
    private String playKey="",playTitle="";
    private boolean live=false;
    private final Runnable saveTick=new Runnable(){@Override public void run(){saveProgress();if(player!=null)main.postDelayed(this,5000);}};

    @Override public void onCreate(Bundle b) {
        super.onCreate(b);getWindow().setStatusBarColor(Color.BLACK);getWindow().setNavigationBarColor(Color.BLACK);
        boolean tv=getPackageManager().hasSystemFeature(PackageManager.FEATURE_LEANBACK)
            || ((getResources().getConfiguration().uiMode & Configuration.UI_MODE_TYPE_MASK)==Configuration.UI_MODE_TYPE_TELEVISION);
        db=new AppDb(this);client=new CatalogClient(db);releases=new RemoteUi(this,tv?"tv":"phone");
        root=new FrameLayout(this);root.setBackgroundColor(Color.BLACK);setContentView(root);
        web=new WebView(this);web.setBackgroundColor(Color.BLACK);
        WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);settings.setMediaPlaybackRequiresUserGesture(false);
        final WebViewAssetLoader loader=new WebViewAssetLoader.Builder().setDomain("appassets.androidplatform.net")
            .addPathHandler("/app/", path->{
                try { if(path.contains("/")||path.contains(".."))return null;
                    InputStream s=releases.open(path);
                    if(s==null)return null;
                    String mime=path.endsWith(".css")?"text/css":path.endsWith(".js")?"text/javascript":"text/html";
                    return new WebResourceResponse(mime,"UTF-8",s);
                }catch(Exception e){return null;}
            }).build();
        web.setWebViewClient(new WebViewClient(){
            @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest req){return loader.shouldInterceptRequest(req.getUrl());}
            @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest req){return !ORIGIN.equals(req.getUrl().getScheme()+"://"+req.getUrl().getHost());}
        });
        web.addJavascriptInterface(new Bridge(),"Native");
        root.addView(web,new FrameLayout.LayoutParams(-1,-1));
        playerView=new PlayerView(this);playerView.setBackgroundColor(Color.BLACK);playerView.setShutterBackgroundColor(Color.BLACK);playerView.setVisibility(View.GONE);playerView.setUseController(true);
        playerView.setControllerShowTimeoutMs(4500);
        root.addView(playerView,new FrameLayout.LayoutParams(-1,-1));
        web.loadUrl(ORIGIN+"/app/index.html");
    }
    private void callback(String token,JSONObject result) {
        main.post(()->{if(web!=null)web.evaluateJavascript("window.Aura&&Aura.onResult("+JSONObject.quote(token)+","+result.toString()+")",null);});
    }
    private JSONObject error(Exception e){
        String m=e.getMessage()==null?"Operação falhou":e.getMessage();
        // Não retornar URLs nem credenciais presentes em exceções de rede.
        if(m.contains("http://")||m.contains("https://")||m.contains("password="))m="Falha ao contatar o provedor";
        JSONObject o=new JSONObject();try{o.put("ok",false).put("error",m);}catch(Exception ignored){}return o;
    }
    private void saveProgress(){
        if(player!=null&&!live&&playProfile>0&&playKey.length()>0)
            db.progress(playProfile,playKey,playTitle,Math.max(0,player.getCurrentPosition()),Math.max(0,player.getDuration()));
    }
    private void play(JSONObject payload) throws Exception {
        final long id=payload.getLong("profile");String type=payload.optString("type","live");
        String media=payload.getString("id"),ext=payload.optString("ext","m3u8");
        String url=client.stream(id,type,media,ext);
        // Persistir a posição do player anterior antes de alterar a identidade atual.
        final boolean nextIsLive="live".equals(type);
        final String nextKey=type+":"+media;
        final String nextTitle=payload.optString("title","Reproduzindo");
        long resume=nextIsLive?0:db.resume(id,nextKey);
        main.post(()->{
            closePlayer();
            playProfile=id;MainActivity.this.live=nextIsLive;playKey=nextKey;playTitle=nextTitle;
            player=new ExoPlayer.Builder(MainActivity.this).build();
            playerView.setPlayer(player);playerView.setVisibility(View.VISIBLE);
            MediaItem.Builder item=new MediaItem.Builder().setUri(url);
            String lower=url.toLowerCase(Locale.US);
            if(lower.contains(".m3u8"))item.setMimeType(MimeTypes.APPLICATION_M3U8);
            if(lower.contains(".mpd"))item.setMimeType(MimeTypes.APPLICATION_MPD);
            player.setMediaItem(item.build());if(resume>0)player.seekTo(resume);
            player.prepare();player.play();main.removeCallbacks(saveTick);main.postDelayed(saveTick,5000);
            playerView.requestFocus();
        });
    }
    private void closePlayer() {
        saveProgress();main.removeCallbacks(saveTick);
        if(player!=null){playerView.setPlayer(null);player.release();player=null;}
        playerView.setVisibility(View.GONE);
        if(web!=null)web.requestFocus();
    }
    private JSONObject profiles() throws Exception {
        JSONArray list=db.profiles();int selected=getPreferences(0).getInt("selected",0);
        long now=System.currentTimeMillis()/1000;String expired="";
        JSONObject current=null;for(int i=0;i<list.length();i++)if(list.getJSONObject(i).optLong("id")==selected)current=list.getJSONObject(i);
        if(current!=null && (current.optLong("expires")>0&&current.optLong("expires")<=now || "expired".equals(current.optString("status")))) {
            expired=current.optString("name");selected=0;
        }
        if(selected==0){for(int i=0;i<list.length();i++){JSONObject p=list.getJSONObject(i);
            if((p.optLong("expires")==0||p.optLong("expires")>now)&&!"expired".equals(p.optString("status"))){selected=p.getInt("id");break;}
        }}
        getPreferences(0).edit().putInt("selected",selected).apply();
        return new JSONObject().put("ok",true).put("list",list).put("selected",selected).put("expiredName",expired)
            .put("recent",selected>0?db.recent(selected):new JSONArray());
    }
    private final class Bridge {
        @JavascriptInterface public String device(){
            try{return new JSONObject().put("tv","tv".equals(releases.channel)).put("channel",releases.channel)
                .put("nativeVersion",1).put("widthDp",getResources().getConfiguration().screenWidthDp)
                .put("heightDp",getResources().getConfiguration().screenHeightDp).toString();}
            catch(Exception e){return "{}";}
        }
        @JavascriptInterface public String profiles(){try{return profiles().toString();}catch(Exception e){return error(e).toString();}}
        @JavascriptInterface public String updateState(){try{return releases.status().toString();}catch(Exception e){return error(e).toString();}}
        @JavascriptInterface public String addProfile(String input) {
            try{
                JSONObject p=new JSONObject(input);String name=p.optString("name","").trim();
                if(name.length()<1||name.length()>65)throw new Exception("Dê um nome de até 65 caracteres à lista");
                JSONObject parsed=CatalogClient.credentials(p.getString("url"),p.optString("username",""),p.optString("password",""));
                long id=db.save(name,parsed.getString("kind"),parsed.getString("host"),parsed.getString("username"),parsed.getString("password"));
                getPreferences(0).edit().putInt("selected",(int)id).apply();return new JSONObject().put("ok",true).put("id",id).toString();
            }catch(Exception e){return error(e).toString();}
        }
        @JavascriptInterface public String select(long id){
            try{JSONObject p=db.get(id);if(p==null)throw new Exception("Lista inexistente");
                if(p.optLong("expires")>0&&p.optLong("expires")<=System.currentTimeMillis()/1000)throw new Exception("Esta lista expirou. Atualize os dados.");
                getPreferences(0).edit().putInt("selected",(int)id).apply();return new JSONObject().put("ok",true).toString();
            }catch(Exception e){return error(e).toString();}
        }
        @JavascriptInterface public String delete(long id){try{db.delete(id);if(getPreferences(0).getInt("selected",0)==id)getPreferences(0).edit().putInt("selected",0).apply();return profiles().toString();}catch(Exception e){return error(e).toString();}}
        @JavascriptInterface public void closeVideo(){main.post(MainActivity.this::closePlayer);}
        @JavascriptInterface public void request(String token,String operation,String args){
            io.execute(()->{JSONObject response;
                try{
                    JSONObject p=new JSONObject(args);long id=p.optLong("profile",getPreferences(0).getInt("selected",0));
                    if("auth".equals(operation))response=client.auth(id);
                    else if("catalog".equals(operation))response=client.load(id,p.optString("op","categories"),p.optString("type","live"),p.optString("category",""),p.optLong("item",0));
                    else if("play".equals(operation)){play(p);response=new JSONObject().put("started",true);}
                    else if("check".equals(operation))response=releases.check();
                    else if("rollback".equals(operation))response=releases.rollback();
                    else throw new Exception("Operação não suportada");
                    response.put("ok",true);
                }catch(Exception e){response=error(e);}callback(token,response);
            });
        }
        @JavascriptInterface public void reload(){main.post(()->{closePlayer();web.loadUrl(ORIGIN+"/app/index.html");});}
    }
    @Override public void onBackPressed(){
        if(player!=null){closePlayer();return;}
        web.evaluateJavascript("window.Aura&&Aura.back()",null);
    }
    @Override protected void onPause(){saveProgress();super.onPause();}
    @Override protected void onStop(){if(player!=null)closePlayer();super.onStop();}
    @Override protected void onDestroy(){closePlayer();web.removeJavascriptInterface("Native");web.destroy();db.close();io.shutdownNow();super.onDestroy();}
}
