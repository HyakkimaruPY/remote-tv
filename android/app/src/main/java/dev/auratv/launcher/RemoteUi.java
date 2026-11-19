package dev.auratv.launcher;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;
import org.json.JSONObject;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;

/** Signed HTML/CSS/JS updates. Native code, media decoder and account DB are not remotely editable. */
final class RemoteUi {
    private static final String RAW="https://raw.githubusercontent.com/HyakkimaruPY/remote-tv/main/android/";
    private static final String[] FILES={"index.html","style.css","app.js"};
    private final Context context;
    private final SharedPreferences prefs;
    final String channel;
    RemoteUi(Context c,String ch){context=c.getApplicationContext();channel=ch.equals("tv")?"tv":"phone";prefs=c.getSharedPreferences("aura_releases",Context.MODE_PRIVATE);}
    private String k(String name){return channel+"."+name;}
    /** A interface embutida no APK 1.2 equivale à revisão 2: pacotes remotos antigos (<=2) nunca a substituem. */
    static final int BUILTIN=2;
    private int active(){int a=prefs.getInt(k("active"),1);return a>1&&a<=BUILTIN?1:a;}
    private int pending(){int p=prefs.getInt(k("pending"),0);return p>0&&p<=BUILTIN?0:p;}
    private File root(){return new File(context.getFilesDir(),"runtime/"+channel);}
    private File dir(int rev){return new File(root(),String.valueOf(rev));}
    private boolean allowed(String name){for(String s:FILES)if(s.equals(name))return true;return false;}
    private static byte[] all(InputStream src,int limit) throws Exception {
        try(InputStream in=src;java.io.ByteArrayOutputStream out=new java.io.ByteArrayOutputStream()){
            byte[] buf=new byte[8192];int n;while((n=in.read(buf))!=-1){if(n==0)continue;if(out.size()+n>limit)throw new Exception("Arquivo muito grande");out.write(buf,0,n);}
            return out.toByteArray();
        }
    }
    private static String digest(byte[] bytes) throws Exception {
        byte[] v=MessageDigest.getInstance("SHA-256").digest(bytes);StringBuilder sb=new StringBuilder();
        for(byte b:v)sb.append(String.format(java.util.Locale.US,"%02x",b&255));return sb.toString();
    }
    private JSONObject payload(JSONObject envelope) throws Exception {
        
        byte[] p=Base64.decode(envelope.getString("payload"),Base64.DEFAULT),sig=Base64.decode(envelope.getString("signature"),Base64.DEFAULT);
        byte[] publicDer=all(context.getAssets().open("update_pub.der"),4096);
        PublicKey publicKey=KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(publicDer));
        Signature verifier=Signature.getInstance("SHA256withRSA");verifier.initVerify(publicKey);verifier.update(p);
        if(!verifier.verify(sig))throw new SecurityException("Atualização sem assinatura autorizada");
        JSONObject j=new JSONObject(new String(p,StandardCharsets.UTF_8));
        if(j.optInt("schema")!=1||!channel.equals(j.optString("channel"))||j.optInt("min_native")>MainActivity.NATIVE)throw new SecurityException("Canal incompatível");
        JSONObject files=j.getJSONObject("files");if(files.length()!=FILES.length)throw new SecurityException("Pacote inesperado");
        for(String n:FILES)if(!files.getString(n).matches("[0-9a-f]{64}"))throw new SecurityException("Hash inválido");
        return j;
    }
    private boolean verified(int rev){
        if(rev==1)return true;
        if(rev<2)return false;
        try {
            File d=dir(rev);if(!d.isDirectory())return false;
            JSONObject env=new JSONObject(new String(all(new FileInputStream(new File(d,"receipt.json")),4096),StandardCharsets.UTF_8));
            JSONObject j=payload(env);if(j.getInt("revision")!=rev)return false;
            JSONObject hashes=j.getJSONObject("files");
            for(String n:FILES)if(!digest(all(new FileInputStream(new File(d,n)),512*1024)).equals(hashes.getString(n)))return false;
            return true;
        }catch(Exception ignored){return false;}
    }
    synchronized int usable(){
        int current=active();if(verified(current))return current;
        int prev=prefs.getInt(k("previous"),1);int recovered=verified(prev)?prev:1;
        prefs.edit().putInt(k("active"),recovered).putInt(k("pending"),0).putInt(k("previous"),1).commit();return recovered;
    }
    synchronized InputStream open(String name) throws Exception {
        if(!allowed(name))return null;
        int revision=pending();if(!verified(revision))revision=usable();
        return revision==1?context.getAssets().open("ui/"+channel+"/"+name):new FileInputStream(new File(dir(revision),name));
    }
    synchronized boolean hasPending(){return pending()>1&&verified(pending());}
    synchronized void ready(){
        int p=pending();if(p<2)return;
        if(!verified(p)){prefs.edit().remove(k("pending")).commit();return;}
        int previous=usable();prefs.edit().putInt(k("previous"),previous).putInt(k("active"),p).remove(k("pending")).commit();
    }
    synchronized void startupFailed(){
        int p=pending();if(p>1)prefs.edit().putInt(k("blocked"),p).remove(k("pending")).commit();
    }
    synchronized JSONObject status() throws Exception {
        return new JSONObject().put("channel",channel).put("active",usable()).put("previous",prefs.getInt(k("previous"),1))
            .put("pending",pending()).put("blocked",prefs.getInt(k("blocked"),0));
    }
    private static void write(File target,byte[] content) throws Exception {
        try(FileOutputStream o=new FileOutputStream(target)){o.write(content);o.getFD().sync();}
    }
    private static void erase(File f){
        if(f.isDirectory()){File[] kids=f.listFiles();if(kids!=null)for(File kid:kids)erase(kid);}if(f.exists())f.delete();
    }
    private final Object checkLock=new Object();
    /**
     * Rede FORA do monitor da instância: open() é chamado pelo WebView para carregar a tela e não pode esperar download.
     * Só a leitura/gravação do estado entra em synchronized.
     */
    JSONObject check() throws Exception {
        synchronized(checkLock){
            // O parâmetro evita cache de CDN do raw.githubusercontent.com; o marcador é pequeno.
            String raw=new String(CatalogClient.download(RAW+channel+"/version?t="+System.currentTimeMillis(),64),StandardCharsets.UTF_8).trim();
            if(!raw.matches("[0-9]{1,6}"))throw new SecurityException("Marcador remoto inválido");
            final int revision=Integer.parseInt(raw);int current;boolean skip;
            synchronized(this){
                current=usable();
                skip=revision<=Math.max(current,BUILTIN)||revision==prefs.getInt(k("blocked"),0);
                if(!skip&&pending()==revision&&verified(revision))return new JSONObject().put("updated",false).put("revision",current).put("pending",revision);
            }
            if(skip)return new JSONObject().put("updated",false).put("revision",current);
            JSONObject envelope=new JSONObject(new String(CatalogClient.download(RAW+channel+"/manifest.json",64*1024),StandardCharsets.UTF_8));
            JSONObject man=payload(envelope);if(man.getInt("revision")!=revision)throw new SecurityException("Revisão divergente");
            if(!root().isDirectory()&&!root().mkdirs())throw new Exception("Diretório indisponível");
            File stage=new File(root(),"staging-"+revision);erase(stage);
            if(!stage.mkdirs())throw new Exception("Falha no staging");
            try {
                JSONObject hashes=man.getJSONObject("files");
                for(String file:FILES){
                    byte[] bytes=CatalogClient.download(RAW+channel+"/releases/"+revision+"/"+file,512*1024);
                    if(!digest(bytes).equals(hashes.getString(file)))throw new SecurityException("Arquivo divergente: "+file);
                    write(new File(stage,file),bytes);
                }
                write(new File(stage,"receipt.json"),envelope.toString().getBytes(StandardCharsets.UTF_8));
                synchronized(this){
                    File installed=dir(revision);erase(installed);
                    if(!stage.renameTo(installed)||!verified(revision))throw new SecurityException("Staging inconsistente");
                    // A verificação não troca a UI ativa. A promoção só ocorre depois que o app.js chamar Native.ready().
                    if(!prefs.edit().putInt(k("pending"),revision).commit())throw new Exception("Falha de persistência");
                }
                return new JSONObject().put("updated",true).put("staged",true).put("revision",revision).put("previous",current);
            }finally{erase(stage);}
        }
    }
    synchronized JSONObject rollback() throws Exception {
        int current=usable(),before=prefs.getInt(k("previous"),1);
        if(current==1||before==current||!verified(before))return new JSONObject().put("updated",false).put("revision",current);
        prefs.edit().putInt(k("blocked"),current).putInt(k("active"),before).putInt(k("previous"),1).remove(k("pending")).commit();
        return new JSONObject().put("updated",true).put("revision",before);
    }
}
