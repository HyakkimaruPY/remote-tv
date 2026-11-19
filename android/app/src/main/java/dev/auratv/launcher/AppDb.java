package dev.auratv.launcher;

import android.content.Context;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import org.json.JSONArray;
import org.json.JSONObject;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/** Provider secrets never enter HTML, WebView storage or logs. */
final class AppDb extends SQLiteOpenHelper {
    private final SharedPreferences pref;
    private final SecretKey key;
    AppDb(Context c) throws Exception {
        super(c,"aura_launcher.db",null,2);
        pref=c.getSharedPreferences("aura_app",Context.MODE_PRIVATE);
        KeyStore ks=KeyStore.getInstance("AndroidKeyStore");ks.load(null);
        if(!ks.containsAlias("aura_profile_v1")) {
            KeyGenerator gen=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");
            gen.init(new KeyGenParameterSpec.Builder("aura_profile_v1",KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());
            gen.generateKey();
        }
        key=(SecretKey)ks.getKey("aura_profile_v1",null);
    }
    @Override public void onCreate(SQLiteDatabase d){
        d.execSQL("CREATE TABLE profiles(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, kind TEXT NOT NULL, host TEXT NOT NULL, username TEXT NOT NULL, password TEXT NOT NULL, expires INTEGER NOT NULL DEFAULT 0, checked INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'unknown')");
        d.execSQL("CREATE TABLE progress(profile_id INTEGER NOT NULL, media_key TEXT NOT NULL, title TEXT NOT NULL, position_ms INTEGER NOT NULL, duration_ms INTEGER NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY(profile_id,media_key))");
        d.execSQL("CREATE INDEX progress_latest ON progress(updated_at DESC)");
        createFavorites(d);
    }
    private void createFavorites(SQLiteDatabase d){d.execSQL("CREATE TABLE IF NOT EXISTS favorites(account INTEGER, item TEXT, title TEXT, poster TEXT, type TEXT, media TEXT, ext TEXT, PRIMARY KEY(account,item))");}
    @Override public void onUpgrade(SQLiteDatabase d,int old,int newest){if(old<2)createFavorites(d); /* NEVER drop accounts or progress */}
    private String protect(String raw) throws Exception {
        Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.ENCRYPT_MODE,key);
        byte[] iv=c.getIV(),cipher=c.doFinal(raw.getBytes(StandardCharsets.UTF_8)),combined=new byte[iv.length+cipher.length];
        System.arraycopy(iv,0,combined,0,iv.length);System.arraycopy(cipher,0,combined,iv.length,cipher.length);
        return Base64.encodeToString(combined,Base64.NO_WRAP);
    }
    private String reveal(String encoded) throws Exception {
        byte[] combined=Base64.decode(encoded,Base64.NO_WRAP);if(combined.length<29)throw new SecurityException("Credencial danificada");
        Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.DECRYPT_MODE,key,new GCMParameterSpec(128,combined,0,12));
        return new String(c.doFinal(combined,12,combined.length-12),StandardCharsets.UTF_8);
    }
    synchronized long add(String label,JSONObject p) throws Exception {
        android.content.ContentValues v=new android.content.ContentValues();
        v.put("name",label);v.put("kind",p.getString("kind"));v.put("host",protect(p.getString("host")));
        v.put("username",protect(p.optString("username","")));v.put("password",protect(p.optString("password","")));
        long id=getWritableDatabase().insertOrThrow("profiles",null,v);selected(id);return id;
    }
    synchronized JSONObject get(long id) throws Exception {
        try(Cursor c=getReadableDatabase().rawQuery("SELECT id,name,kind,host,username,password,expires,status FROM profiles WHERE id=?",new String[]{String.valueOf(id)})){
            if(!c.moveToFirst())throw new IllegalArgumentException("Lista não encontrada");
            return new JSONObject().put("id",c.getLong(0)).put("label",c.getString(1)).put("kind",c.getString(2))
                .put("host",reveal(c.getString(3))).put("username",reveal(c.getString(4)))
                .put("password",reveal(c.getString(5))).put("expires",c.getLong(6)).put("status",c.getString(7));
        }
    }
    synchronized JSONArray profiles() throws Exception {
        JSONArray arr=new JSONArray();
        try(Cursor c=getReadableDatabase().rawQuery("SELECT id,name,kind,expires,status FROM profiles ORDER BY id DESC",null)){
            while(c.moveToNext())arr.put(new JSONObject().put("id",c.getLong(0)).put("label",c.getString(1))
                .put("kind",c.getString(2)).put("expires",c.getLong(3)).put("status",c.getString(4)));
        }return arr;
    }
    synchronized long selected(){return pref.getLong("selected",0);}
    synchronized void selected(long id){pref.edit().putLong("selected",id).apply();}
    synchronized void status(long id,long expires,String s){android.content.ContentValues v=new android.content.ContentValues();v.put("expires",expires);v.put("status",s);getWritableDatabase().update("profiles",v,"id=?",new String[]{""+id});}
    synchronized void delete(long id){getWritableDatabase().delete("profiles","id=?",new String[]{""+id});getWritableDatabase().delete("progress","profile_id=?",new String[]{""+id});getWritableDatabase().delete("favorites","account=?",new String[]{""+id});if(selected()==id)selected(0);}
    synchronized void progress(long account,String item,String title,long pos,long duration){
        if(account<=0||pos<1000)return;android.content.ContentValues v=new android.content.ContentValues();
        v.put("profile_id",account);v.put("media_key",item);v.put("title",title);v.put("position_ms",pos);v.put("duration_ms",duration);v.put("updated_at",System.currentTimeMillis());
        getWritableDatabase().insertWithOnConflict("progress",null,v,SQLiteDatabase.CONFLICT_REPLACE);
    }
    synchronized long resume(long account,String item){
        try(Cursor c=getReadableDatabase().rawQuery("SELECT position_ms,duration_ms FROM progress WHERE profile_id=? AND media_key=?",new String[]{""+account,item})){
            if(c.moveToFirst()){long pos=c.getLong(0),dur=c.getLong(1);return dur>0&&pos>dur-20000?0:pos;}
        }return 0;
    }
    synchronized JSONArray recent(long id) throws Exception {
        JSONArray a=new JSONArray();try(Cursor c=getReadableDatabase().rawQuery("SELECT media_key,title,position_ms,duration_ms FROM progress WHERE profile_id=? ORDER BY updated_at DESC LIMIT 30",new String[]{""+id})){
            while(c.moveToNext())a.put(new JSONObject().put("key",c.getString(0)).put("title",c.getString(1)).put("position",c.getLong(2)).put("duration",c.getLong(3)));
        }return a;
    }
    synchronized boolean favorite(long id,JSONObject item) throws Exception {
        String key=item.getString("type")+":"+item.getString("id");
        try(Cursor c=getReadableDatabase().rawQuery("SELECT 1 FROM favorites WHERE account=? AND item=?",new String[]{""+id,key})){
            if(c.moveToFirst()){getWritableDatabase().delete("favorites","account=? AND item=?",new String[]{""+id,key});return false;}
        }
        android.content.ContentValues v=new android.content.ContentValues();v.put("account",id);v.put("item",key);v.put("title",item.optString("title"));v.put("poster",item.optString("poster"));v.put("type",item.optString("type"));v.put("media",item.optString("id"));v.put("ext",item.optString("ext"));
        getWritableDatabase().insertWithOnConflict("favorites",null,v,SQLiteDatabase.CONFLICT_REPLACE);return true;
    }
    synchronized JSONArray favorites(long id) throws Exception {
        JSONArray a=new JSONArray();try(Cursor c=getReadableDatabase().rawQuery("SELECT media,title,poster,type,ext FROM favorites WHERE account=? ORDER BY rowid DESC",new String[]{""+id})){
            while(c.moveToNext())a.put(new JSONObject().put("id",c.getString(0)).put("title",c.getString(1)).put("poster",c.getString(2)).put("type",c.getString(3)).put("ext",c.getString(4)));
        }return a;
    }
}
