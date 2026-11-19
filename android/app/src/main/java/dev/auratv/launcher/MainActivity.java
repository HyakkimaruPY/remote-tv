package dev.auratv.launcher;

import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.widget.Toast;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MimeTypes;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory;
import androidx.media3.datasource.DefaultHttpDataSource;
import androidx.media3.ui.PlayerView;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.InputStream;
import java.net.URI;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Um núcleo nativo, duas interfaces HTML independentes (phone / tv).
 * Layout TV = hardware de TV (Leanback etc.) OU aparelho na horizontal. Layout phone = vertical em aparelho comum.
 */
public final class MainActivity extends Activity {
    /** Versão do núcleo nativo; pacotes remotos com min_native maior são recusados (ver RemoteUi). */
    static final int NATIVE = 3;
    private static final String LOCAL = "https://appassets.androidplatform.net";
    private static final long RECHECK_MS = 15 * 60 * 1000L;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private final ExecutorService updater = Executors.newSingleThreadExecutor();
    private FrameLayout root;
    private WebView web;
    private PlayerView playerView;
    private ExoPlayer player;
    private AppDb db;
    private CatalogClient catalog;
    private RemoteUi phoneRemote, tvRemote;
    private volatile boolean hardwareTv = false, tvLayout = false;
    private volatile int updatedRevision = 0;
    private boolean isLive = false, resumePending = false, streamFallback = false, layoutPending = false;
    private volatile boolean checking = false;
    private long playProfile = 0, resumeExpected = 0, lastCheck = 0;
    private String playKey = "", playTitle = "", streamUrl = "";
    private Runnable watchdog;
    private final Runnable layoutTask = this::applyLayout;
    private final Runnable tick = new Runnable() {
        @Override public void run() { saveProgress(); if (player != null) main.postDelayed(this, 4500); }
    };

    // ───────────────────────── detecção de aparelho ─────────────────────────
    private boolean detectHardwareTv() {
        PackageManager pm = getPackageManager();
        Configuration cfg = getResources().getConfiguration();
        boolean uiMode = (cfg.uiMode & Configuration.UI_MODE_TYPE_MASK) == Configuration.UI_MODE_TYPE_TELEVISION;
        boolean leanback = pm.hasSystemFeature(PackageManager.FEATURE_LEANBACK) || pm.hasSystemFeature("android.software.leanback_only");
        boolean television = pm.hasSystemFeature("android.hardware.type.television");
        // TV box genérica que não declara Leanback: sem toque e sem telefonia.
        boolean boxLike = !pm.hasSystemFeature(PackageManager.FEATURE_TOUCHSCREEN) && !pm.hasSystemFeature(PackageManager.FEATURE_TELEPHONY);
        return uiMode || leanback || television || boxLike;
    }
    private boolean landscape() {
        Configuration c = getResources().getConfiguration();
        if (c.orientation == Configuration.ORIENTATION_LANDSCAPE) return true;
        if (c.orientation == Configuration.ORIENTATION_PORTRAIT) return false;
        android.util.DisplayMetrics m = getResources().getDisplayMetrics();
        return m.widthPixels > m.heightPixels;
    }
    private boolean wantTvLayout() { return hardwareTv || landscape(); }
    private RemoteUi remote() { return tvLayout ? tvRemote : phoneRemote; }
    private RemoteUi otherRemote() { return tvLayout ? phoneRemote : tvRemote; }

    /** Troca phone↔TV quando a orientação muda. Nunca no meio de uma reprodução; o estado da UI é preservado pelo JS. */
    private void applyLayout() {
        if (web == null) return;
        boolean want = wantTvLayout();
        if (want == tvLayout) { layoutPending = false; return; }
        if (player != null) { layoutPending = true; return; }
        tvLayout = want; layoutPending = false;
        loadUi();
    }

    @Override public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        main.removeCallbacks(layoutTask);
        main.postDelayed(layoutTask, 140);
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.BLACK);
        getWindow().setNavigationBarColor(Color.BLACK);
        hardwareTv = detectHardwareTv();
        tvLayout = wantTvLayout();
        try {
            db = new AppDb(this);
            catalog = new CatalogClient(db);
            phoneRemote = new RemoteUi(this, "phone");
            tvRemote = new RemoteUi(this, "tv");
        } catch (Exception e) {
            TextView fail = new TextView(this);
            fail.setText("Falha ao abrir dados protegidos. Os dados não foram apagados.");
            fail.setTextColor(Color.WHITE);
            setContentView(fail);
            return;
        }
        if (db.selected() == 0) {
            int legacy = getPreferences(MODE_PRIVATE).getInt("selected", 0);
            if (legacy > 0) { try { db.get(legacy); db.selected(legacy); } catch (Exception ignored) { } }
        }
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);
        setContentView(root);
        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        web.setFocusable(true);
        web.setFocusableInTouchMode(true);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setSupportZoom(false);
        s.setTextZoom(100);
        // Capas de IPTV são frequentemente http://; a página é https://, então sem isto elas nunca aparecem.
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView w, WebResourceRequest request) { return !local(request.getUrl().toString()); }
            @Override public WebResourceResponse shouldInterceptRequest(WebView w, WebResourceRequest req) {
                String path = req.getUrl().getPath();
                if (!LOCAL.equals(req.getUrl().getScheme() + "://" + req.getUrl().getHost())) return null;
                if (path == null || !path.startsWith("/app/")) return null;
                String name = path.substring(5);
                if (!name.equals("index.html") && !name.equals("app.js") && !name.equals("style.css")) return reply("text/plain", 404, "Not Found", new java.io.ByteArrayInputStream(new byte[0]));
                try {
                    InputStream in = remote().open(name);
                    String mime = name.endsWith(".js") ? "application/javascript" : name.endsWith(".css") ? "text/css" : "text/html";
                    return reply(mime, 200, "OK", in);
                } catch (Exception e) {
                    return reply("text/plain", 404, "Unavailable", new java.io.ByteArrayInputStream(new byte[0]));
                }
            }
        });
        web.addJavascriptInterface(new Bridge(), "Native");
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));
        playerView = new PlayerView(this);
        // Fundo opaco: nunca revelar a WebView nas faixas sem vídeo.
        playerView.setBackgroundColor(Color.BLACK);
        playerView.setShutterBackgroundColor(Color.BLACK);
        playerView.setUseController(true);
        playerView.setControllerShowTimeoutMs(4000);
        playerView.setVisibility(View.GONE);
        root.addView(playerView, new FrameLayout.LayoutParams(-1, -1));
        loadUi();
        checkUpdates();
    }
    private static WebResourceResponse reply(String mime, int status, String reason, InputStream body) {
        Map<String, String> headers = new HashMap<>();
        headers.put("Cache-Control", "no-store");
        return new WebResourceResponse(mime, "UTF-8", status, reason, headers, body);
    }
    private static boolean local(String s) {
        try { URI u = new URI(s); return "https".equals(u.getScheme()) && "appassets.androidplatform.net".equals(u.getHost()) && u.getPath().startsWith("/app/"); }
        catch (Exception e) { return false; }
    }
    private void loadUi() {
        if (web == null) return;
        if (watchdog != null) main.removeCallbacks(watchdog);
        final RemoteUi active = remote();
        web.loadUrl(LOCAL + "/app/index.html");
        if (active.hasPending()) {
            watchdog = () -> { if (active.hasPending()) { active.startupFailed(); web.loadUrl(LOCAL + "/app/index.html"); } };
            main.postDelayed(watchdog, 8000);
        }
    }

    // ───────────────────────── atualização remota (GitHub) ─────────────────────────
    /** Consulta os dois canais. Só o canal em uso recarrega a tela; o outro fica preparado para quando o layout mudar. */
    private void checkUpdates() {
        if (checking || db == null) return;
        checking = true;
        lastCheck = System.currentTimeMillis();
        final RemoteUi current = remote(), other = otherRemote();
        updater.execute(() -> {
            try {
                boolean staged = false; int revision = 0;
                try { JSONObject r = current.check(); staged = r.optBoolean("staged"); revision = r.optInt("revision"); } catch (Exception ignored) { }
                try { other.check(); } catch (Exception ignored) { }
                if (staged) { final int rev = revision; main.post(() -> applyStaged(current.channel, rev)); }
            } finally { checking = false; }
        });
    }
    private void applyStaged(String channel, int revision) {
        if (web == null || player != null || !channel.equals(remote().channel)) return; // fica pendente para a próxima abertura
        updatedRevision = revision;
        web.evaluateJavascript("window.App&&App.onUpdate&&App.onUpdate({state:'applying',revision:" + revision + "})", null);
        main.postDelayed(() -> { if (player == null) loadUi(); }, 1300);
    }

    // ───────────────────────── respostas JS ─────────────────────────
    private JSONObject fail(Exception e) {
        String message = CatalogClient.friendly(e);
        if (message.contains("http:") || message.contains("https:") || message.contains("password=")) message = "Falha de conexão com o provedor.";
        try { return new JSONObject().put("ok", false).put("error", message); } catch (Exception ignored) { return new JSONObject(); }
    }
    private void send(String token, JSONObject response) {
        String serialized = JSONObject.quote(response.toString());
        main.post(() -> { if (web != null) web.evaluateJavascript("window.App&&App.onNative(" + JSONObject.quote(token) + ",JSON.parse(" + serialized + "))", null); });
    }

    // ───────────────────────── player ─────────────────────────
    private void saveProgress() {
        if (player == null || isLive || resumePending || playProfile <= 0 || playKey.isEmpty()) return;
        long pos = player.getCurrentPosition();
        if (pos >= 5000) db.progress(playProfile, playKey, playTitle, pos, Math.max(0, player.getDuration()));
    }
    private void immersive(boolean on) {
        View decor = getWindow().getDecorView();
        decor.setSystemUiVisibility(on
            ? View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_FULLSCREEN
              | View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            : View.SYSTEM_UI_FLAG_VISIBLE);
    }
    private void closePlayer() {
        if (player == null) return;
        saveProgress();
        main.removeCallbacks(tick);
        playerView.setPlayer(null);
        player.stop();
        player.release();
        player = null;
        playerView.setKeepScreenOn(false);
        playerView.setVisibility(View.GONE);
        immersive(false);
        if (!hardwareTv) setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        web.requestFocus();
        // O aparelho pode voltar à vertical depois de sair do player: reavalia o layout com folga.
        main.removeCallbacks(layoutTask);
        main.postDelayed(layoutTask, layoutPending ? 150 : 450);
    }
    private static String altTs(String src) {
        if (src.toLowerCase(Locale.US).contains(".m3u8")) return src.replaceFirst("(?i)\\.m3u8(?=\\?|$)", ".ts");
        return src;
    }
    private void setMedia(String url, long resume) {
        MediaItem.Builder builder = new MediaItem.Builder().setUri(url);
        String lower = url.toLowerCase(Locale.US);
        if (lower.matches(".*\\.m3u8(?:\\?.*)?$")) builder.setMimeType(MimeTypes.APPLICATION_M3U8);
        if (lower.matches(".*\\.mpd(?:\\?.*)?$")) builder.setMimeType(MimeTypes.APPLICATION_MPD);
        player.setMediaItem(builder.build());
        if (resume > 0) player.seekTo(resume);
        player.prepare();
        player.play();
    }
    private void startPlayer(JSONObject payload) throws Exception {
        long account = payload.getLong("profile");
        String type = payload.optString("type", "live"), id = payload.getString("id");
        String extension = payload.optString("ext", type.equals("live") ? "m3u8" : "mp4");
        String url = catalog.stream(account, type, id, extension);
        String identity = type + ":" + id, title = payload.optString("title", "Reproduzindo");
        boolean live = type.equals("live");
        long resume = live ? 0 : db.resume(account, identity);
        main.post(() -> {
            closePlayer();
            isLive = live; playProfile = account; playKey = identity; playTitle = title; streamUrl = url; streamFallback = false;
            resumePending = resume >= 5000; resumeExpected = resume;
            DefaultHttpDataSource.Factory transport = new DefaultHttpDataSource.Factory()
                .setUserAgent("VLC/3.0.16 LibVLC/3.0.16")
                .setConnectTimeoutMs(15000).setReadTimeoutMs(20000)
                .setAllowCrossProtocolRedirects(true);
            player = new ExoPlayer.Builder(MainActivity.this)
                .setMediaSourceFactory(new DefaultMediaSourceFactory(MainActivity.this).setDataSourceFactory(transport)).build();
            playerView.setPlayer(player);
            playerView.setVisibility(View.VISIBLE);
            playerView.setKeepScreenOn(true);
            immersive(true);
            if (!hardwareTv) setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
            player.addListener(new Player.Listener() {
                @Override public void onPlayerError(PlaybackException error) {
                    if (player == null) return;
                    if (isLive && !streamFallback && !altTs(streamUrl).equals(streamUrl)) {
                        streamFallback = true; setMedia(altTs(streamUrl), 0); return;
                    }
                    Toast.makeText(MainActivity.this, "Reprodução indisponível. Verifique o formato ou o provedor.", Toast.LENGTH_LONG).show();
                }
                @Override public void onIsPlayingChanged(boolean playing) {
                    if (playing && resumePending && Math.abs(player.getCurrentPosition() - resumeExpected) < 3500) { resumePending = false; }
                }
                @Override public void onPositionDiscontinuity(Player.PositionInfo old, Player.PositionInfo next, int reason) {
                    if (reason == Player.DISCONTINUITY_REASON_SEEK && resumePending && next.positionMs > 0 && Math.abs(next.positionMs - resumeExpected) > 3500) { resumePending = false; }
                }
            });
            setMedia(url, resume);
            main.removeCallbacks(tick);
            main.postDelayed(tick, 4500);
            playerView.requestFocus();
        });
    }

    // ───────────────────────── comandos da UI ─────────────────────────
    private JSONObject profiles() throws Exception {
        JSONArray arr = db.profiles();
        long chosen = db.selected(), now = System.currentTimeMillis() / 1000;
        boolean valid = false;
        for (int i = 0; i < arr.length(); i++) {
            JSONObject p = arr.getJSONObject(i);
            if (p.optLong("id") == chosen && (p.optLong("expires") == 0 || p.optLong("expires") > now) && !"expired".equals(p.optString("status"))) valid = true;
        }
        if (!valid) {
            chosen = 0;
            for (int i = 0; i < arr.length(); i++) {
                JSONObject p = arr.getJSONObject(i);
                if ((p.optLong("expires") == 0 || p.optLong("expires") > now) && !"expired".equals(p.optString("status"))) { chosen = p.optLong("id"); break; }
            }
            db.selected(chosen);
        }
        return new JSONObject().put("list", arr).put("selected", chosen).put("recent", chosen > 0 ? db.recent(chosen) : new JSONArray());
    }
    private JSONObject layoutInfo() throws Exception {
        return new JSONObject().put("tv", tvLayout).put("channel", tvLayout ? "tv" : "phone")
            .put("hardwareTv", hardwareTv).put("landscape", landscape()).put("native", NATIVE);
    }
    private JSONObject handle(String op, JSONObject p) throws Exception {
        long id = p.optLong("profile", db.selected());
        if (op.equals("profiles")) return profiles();
        if (op.equals("add")) {
            String label = p.optString("name", "").trim();
            if (label.length() < 1 || label.length() > 65) throw new Exception("Informe um nome de até 65 caracteres.");
            JSONObject cred = CatalogClient.credentials(p.getString("url"), p.optString("username", ""), p.optString("password", ""));
            // Valida o provedor ANTES de gravar qualquer credencial: falha não cria perfil quebrado.
            JSONObject auth = CatalogClient.authenticate(cred);
            long newId = db.add(label, cred);
            db.status(newId, auth.optLong("expires", 0), "active");
            return new JSONObject().put("id", newId).put("kind", cred.optString("kind"));
        }
        if (op.equals("select")) { db.get(id); db.selected(id); return profiles(); }
        if (op.equals("delete")) { db.delete(id); return profiles(); }
        if (op.equals("auth")) return catalog.auth(id);
        if (op.equals("catalog")) return catalog.catalog(id, p.optString("op", "categories"), p.optString("type", "live"), p.optString("category", ""), p.optInt("page", 0), p.optString("item", ""));
        if (op.equals("recent")) return new JSONObject().put("items", db.recent(id));
        if (op.equals("favorites")) return new JSONObject().put("items", db.favorites(id));
        if (op.equals("favorite")) return new JSONObject().put("active", db.favorite(id, p.getJSONObject("item")));
        if (op.equals("play")) { startPlayer(p); return new JSONObject().put("started", true); }
        if (op.equals("update")) {
            JSONObject r = remote().check();
            try { otherRemote().check(); } catch (Exception ignored) { }
            if (r.optBoolean("staged")) updatedRevision = r.optInt("revision");
            return r;
        }
        if (op.equals("rollback")) return remote().rollback();
        if (op.equals("version")) return remote().status().put("layout", layoutInfo());
        throw new Exception("Comando desconhecido");
    }
    private final class Bridge {
        /** Informa o layout escolhido pelo núcleo. "updated" aparece uma única vez após uma atualização remota aplicada. */
        @JavascriptInterface public String device() {
            int u = updatedRevision; updatedRevision = 0;
            try { return layoutInfo().put("updated", u).toString(); } catch (Exception e) { return "{\"tv\":" + tvLayout + ",\"channel\":\"" + (tvLayout ? "tv" : "phone") + "\"}"; }
        }
        @JavascriptInterface public void ready() { main.post(() -> { remote().ready(); if (watchdog != null) main.removeCallbacks(watchdog); }); }
        @JavascriptInterface public void request(String token, String op, String data) {
            if (token == null || token.length() > 80) return;
            if (data == null || data.length() > 6000) { send(token, fail(new Exception("Texto longo demais. Cole apenas o link da lista."))); return; }
            io.execute(() -> {
                JSONObject response;
                try { response = handle(op, new JSONObject(data)); response.put("ok", true); }
                catch (Exception e) { response = fail(e); }
                send(token, response);
            });
        }
        @JavascriptInterface public void reload() { main.post(() -> { closePlayer(); loadUi(); }); }
        @JavascriptInterface public void closeVideo() { main.post(MainActivity.this::closePlayer); }
        @JavascriptInterface public void exit() { main.post(MainActivity.this::finish); }
    }

    @Override public boolean dispatchKeyEvent(KeyEvent e) {
        if (player != null && e.getAction() == KeyEvent.ACTION_DOWN && (e.getKeyCode() == KeyEvent.KEYCODE_BACK || e.getKeyCode() == KeyEvent.KEYCODE_ESCAPE)) {
            closePlayer(); return true;
        }
        return super.dispatchKeyEvent(e);
    }
    /** A UI consome o Voltar (fecha painéis, volta à aba inicial). Só quando ela devolve "não consumi" o app fecha. */
    @Override public void onBackPressed() {
        if (player != null) { closePlayer(); return; }
        if (web == null) { finish(); return; }
        web.evaluateJavascript("(function(){try{return window.App&&App.back()?'1':'0';}catch(e){return '0';}})()", value -> {
            if (value == null || !value.contains("1")) finish();
        });
    }
    @Override protected void onResume() {
        super.onResume();
        if (web != null && player == null && System.currentTimeMillis() - lastCheck > RECHECK_MS) checkUpdates();
    }
    @Override protected void onPause() { saveProgress(); if (player != null) player.pause(); super.onPause(); }
    @Override protected void onStop() { saveProgress(); super.onStop(); }
    @Override protected void onDestroy() {
        closePlayer();
        main.removeCallbacksAndMessages(null);
        if (web != null) { web.removeJavascriptInterface("Native"); web.destroy(); web = null; }
        if (db != null) db.close();
        io.shutdownNow();
        updater.shutdownNow();
        super.onDestroy();
    }
}
