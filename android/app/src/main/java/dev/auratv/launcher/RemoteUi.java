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
import java.util.Iterator;

/** A/B lógico: assets no APK, release ativa assinada em arquivos privados e release anterior. */
final class RemoteUi {
    private static final String RAW="https://raw.githubusercontent.com/HyakkimaruPY/remote-tv/main/android/";
    private static final String[] FILES={"index.html","style.css","app.js"};
    private final Context context;
    private final SharedPreferences preferences;
    final String channel;
    RemoteUi(Context c,String channel){
        this.context=c.getApplicationContext();this.channel="tv".equals(channel)?"tv":"phone";
        this.preferences=c.getSharedPreferences("ui_versions",Context.MODE_PRIVATE);
    }
    private String key(String s){return channel+"_"+s;}
    private int active(){return preferences.getInt(key("active"),1);}
    private File target(int revision){return new File(new File(new File(context.getFilesDir(),"releases"),channel),""+revision);}
    private boolean permitted(String name){for(String x:FILES)if(x.equals(name))return true;return false;}
    private byte[] fileBytes(InputStream s,int max) throws Exception {
        try(InputStream in=s;java.io.ByteArrayOutputStream o=new java.io.ByteArrayOutputStream()){
            byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1){if(n==0)continue;if(o.size()+n>max)throw new Exception("Arquivo muito grande");o.write(b,0,n);}return o.toByteArray();
        }
    }
    private static String sha(byte[] bytes) throws Exception {
        byte[] v=MessageDigest.getInstance("SHA-256").digest(bytes);StringBuilder s=new StringBuilder();
        for(byte b:v)s.append(String.format(java.util.Locale.US,"%02x",b&255));return s.toString();
    }
    private JSONObject signed(JSONObject envelope) throws Exception {
        byte[] content=Base64.decode(envelope.getString("payload"),Base64.DEFAULT);
        byte[] signature=Base64.decode(envelope.getString("signature"),Base64.DEFAULT);
        byte[] pub=fileBytes(context.getAssets().open("update_pub.der"),8192);
        PublicKey k=KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(pub));
        Signature verifier=Signature.getInstance("SHA256withRSA");verifier.initVerify(k);verifier.update(content);
        if(!verifier.verify(signature))throw new SecurityException("Assinatura remota inválida");
        JSONObject p=new JSONObject(new String(content,StandardCharsets.UTF_8));
        if(p.optInt("schema")!=1 || !channel.equals(p.optString("channel")) || p.optInt("min_native")>1)throw new SecurityException("Manifest incompatível");
        JSONObject files=p.getJSONObject("files");
        if(files.length()!=FILES.length)throw new SecurityException("Lista inesperada de arquivos");
        for(String name:FILES){String sum=files.getString(name);if(!sum.matches("[0-9a-f]{64}"))throw new SecurityException("Hash inválido");}
        return p;
    }
    private boolean verifyDir(int revision){
        if(revision<=1)return true;
        try {
            File dir=target(revision);if(!dir.isDirectory())return false;
            byte[] bytes=fileBytes(new FileInputStream(new File(dir,"receipt.json")),128*1024);
            JSONObject p=signed(new JSONObject(new String(bytes,StandardCharsets.UTF_8)));
            if(p.getInt("revision")!=revision)return false;
            JSONObject list=p.getJSONObject("files");
            for(String n:FILES)if(!sha(fileBytes(new FileInputStream(new File(dir,n)),512*1024)).equals(list.getString(n)))return false;
            return true;
        }catch(Exception ignored){return false;}
    }
    synchronized int usable() {
        int a=active();if(a<=1||verifyDir(a))return a;
        int b=preferences.getInt(key("previous"),1);
        preferences.edit().putInt(key("active"),verifyDir(b)?b:1).putInt(key("previous"),1).commit();
        return preferences.getInt(key("active"),1);
    }
    synchronized InputStream open(String name) throws Exception {
        if(!permitted(name))return null;
        int rev=usable();if(rev<=1)return context.getAssets().open("ui/"+channel+"/"+name);
        return new FileInputStream(new File(target(rev),name));
    }
    synchronized JSONObject status() throws Exception {
        return new JSONObject().put("channel",channel).put("active",usable())
            .put("previous",preferences.getInt(key("previous"),1))
            .put("blocked",preferences.getInt(key("blocked"),0));
    }
    private static void write(File file,byte[] contents) throws Exception {
        try(FileOutputStream o=new FileOutputStream(file)){o.write(contents);o.getFD().sync();}
    }
    synchronized JSONObject check() throws Exception {
        int revision=Integer.parseInt(CatalogClient.read(RAW+channel+"/version").trim());
        if(revision<=usable() || revision==preferences.getInt(key("blocked"),0))
            return new JSONObject().put("updated",false).put("revision",usable());
        if(revision<2||revision>999999)throw new SecurityException("Revisão inválida");
        JSONObject envelope=new JSONObject(CatalogClient.read(RAW+channel+"/manifest.json"));
        JSONObject p=signed(envelope);
        if(revision!=p.getInt("revision"))throw new SecurityException("Versão e manifesto divergentes");
        File root=new File(context.getFilesDir(),"releases/"+channel);
        if(!root.isDirectory()&&!root.mkdirs())throw new Exception("Não foi possível criar diretório");
        File staging=new File(root,"staging-"+revision);erase(staging);
        if(!staging.mkdirs())throw new Exception("Falha ao iniciar staging");
        try {
            JSONObject hashes=p.getJSONObject("files");
            for(String name:FILES){
                byte[] bytes=CatalogClient.read(RAW+channel+"/releases/"+revision+"/"+name).getBytes(StandardCharsets.UTF_8);
                if(bytes.length>512*1024||!sha(bytes).equals(hashes.getString(name)))throw new SecurityException("Arquivo inválido: "+name);
                write(new File(staging,name),bytes);
            }
            write(new File(staging,"receipt.json"),envelope.toString().getBytes(StandardCharsets.UTF_8));
            File dst=target(revision);erase(dst);
            if(!staging.renameTo(dst)||!verifyDir(revision))throw new SecurityException("Falha na validação do staging");
            int before=usable();
            if(!preferences.edit().putInt(key("previous"),before).putInt(key("active"),revision).commit())
                throw new Exception("Falha ao persistir revisão");
            return new JSONObject().put("updated",true).put("revision",revision).put("previous",before);
        }finally {erase(staging);}
    }
    synchronized JSONObject rollback() throws Exception {
        int before=usable(),prev=preferences.getInt(key("previous"),1);
        if(before<=1||prev==before||!verifyDir(prev))return new JSONObject().put("updated",false).put("revision",before);
        preferences.edit().putInt(key("active"),prev).putInt(key("previous"),1).putInt(key("blocked"),before).commit();
        return new JSONObject().put("updated",true).put("revision",prev).put("blocked",before);
    }
    private void erase(File f) {
        if(f.isDirectory()){File[] a=f.listFiles();if(a!=null)for(File x:a)erase(x);}if(f.exists())f.delete();
    }
}
