package dev.auratv.launcher;

import android.content.ContentValues;
import android.content.Context;
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
import java.security.SecureRandom;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

final class AppDb extends SQLiteOpenHelper {
    private final Vault vault = new Vault();
    AppDb(Context context) { super(context, "aura_launcher.db", null, 1); }

    @Override public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE profiles(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, kind TEXT NOT NULL, host TEXT NOT NULL, username TEXT NOT NULL, password TEXT NOT NULL, expires INTEGER NOT NULL DEFAULT 0, checked INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'unknown')");
        db.execSQL("CREATE TABLE progress(profile_id INTEGER NOT NULL, media_key TEXT NOT NULL, title TEXT NOT NULL, position_ms INTEGER NOT NULL, duration_ms INTEGER NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY(profile_id,media_key))");
        db.execSQL("CREATE INDEX progress_latest ON progress(updated_at DESC)");
    }
    @Override public void onUpgrade(SQLiteDatabase db, int oldV, int newV) { /* adotar migrations incrementais */ }

    synchronized long save(String name, String kind, String host, String username, String password) throws Exception {
        ContentValues v = new ContentValues();
        v.put("name", name.trim()); v.put("kind", kind);
        v.put("host", vault.encrypt(host)); v.put("username", vault.encrypt(username)); v.put("password", vault.encrypt(password));
        return getWritableDatabase().insertOrThrow("profiles", null, v);
    }
    synchronized JSONObject get(long id) throws Exception {
        try (Cursor c=getReadableDatabase().query("profiles",null,"id=?",new String[]{String.valueOf(id)},null,null,null)) {
            if (!c.moveToFirst()) return null;
            return new JSONObject().put("id",id).put("name",c.getString(c.getColumnIndexOrThrow("name")))
                .put("kind",c.getString(c.getColumnIndexOrThrow("kind")))
                .put("host",vault.decrypt(c.getString(c.getColumnIndexOrThrow("host"))))
                .put("username",vault.decrypt(c.getString(c.getColumnIndexOrThrow("username"))))
                .put("password",vault.decrypt(c.getString(c.getColumnIndexOrThrow("password"))))
                .put("expires",c.getLong(c.getColumnIndexOrThrow("expires")));
        }
    }
    synchronized JSONArray profiles() throws Exception {
        JSONArray a=new JSONArray();
        try (Cursor c=getReadableDatabase().rawQuery("SELECT id,name,kind,expires,checked,status FROM profiles ORDER BY id",null)) {
            while(c.moveToNext()) a.put(new JSONObject().put("id",c.getLong(0)).put("name",c.getString(1))
                .put("kind",c.getString(2)).put("expires",c.getLong(3))
                .put("checked",c.getLong(4)).put("status",c.getString(5)));
        }
        return a;
    }
    synchronized void accountStatus(long id, long expiry, String status) {
        ContentValues v=new ContentValues();v.put("expires",expiry);v.put("checked",System.currentTimeMillis());v.put("status",status);
        getWritableDatabase().update("profiles",v,"id=?",new String[]{String.valueOf(id)});
    }
    synchronized void delete(long id) {
        getWritableDatabase().delete("profiles","id=?",new String[]{String.valueOf(id)});
        getWritableDatabase().delete("progress","profile_id=?",new String[]{String.valueOf(id)});
    }
    synchronized void progress(long profileId,String key,String title,long pos,long duration) {
        if (profileId<=0 || key.isEmpty() || pos<5000) return;
        ContentValues v=new ContentValues();v.put("profile_id",profileId);v.put("media_key",key);v.put("title",title);
        v.put("position_ms",Math.max(0,pos));v.put("duration_ms",Math.max(0,duration));v.put("updated_at",System.currentTimeMillis());
        getWritableDatabase().insertWithOnConflict("progress",null,v,SQLiteDatabase.CONFLICT_REPLACE);
    }
    synchronized long resume(long profileId,String key) {
        try(Cursor c=getReadableDatabase().rawQuery("SELECT position_ms,duration_ms FROM progress WHERE profile_id=? AND media_key=?",new String[]{""+profileId,key})) {
            if(!c.moveToFirst())return 0;long pos=c.getLong(0),dur=c.getLong(1);
            return dur>0&&pos>dur-12000?0:pos;
        }
    }
    synchronized JSONArray recent(long profileId) throws Exception {
        JSONArray a=new JSONArray();
        try(Cursor c=getReadableDatabase().rawQuery("SELECT media_key,title,position_ms,duration_ms FROM progress WHERE profile_id=? AND position_ms>=5000 ORDER BY updated_at DESC LIMIT 30",new String[]{""+profileId})) {
            while(c.moveToNext())a.put(new JSONObject().put("key",c.getString(0)).put("title",c.getString(1)).put("position",c.getLong(2)).put("duration",c.getLong(3)));
        } return a;
    }
    static class Vault {
        private SecretKey secret() throws Exception {
            KeyStore k=KeyStore.getInstance("AndroidKeyStore");k.load(null);
            if(k.containsAlias("aura_profile_v1"))return (SecretKey)k.getKey("aura_profile_v1",null);
            KeyGenerator g=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");
            g.init(new KeyGenParameterSpec.Builder("aura_profile_v1",KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());
            return g.generateKey();
        }
        synchronized String encrypt(String s) throws Exception {
            Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.ENCRYPT_MODE,secret());
            byte[] iv=c.getIV(),enc=c.doFinal(s.getBytes(StandardCharsets.UTF_8));
            byte[] out=new byte[iv.length+enc.length];System.arraycopy(iv,0,out,0,iv.length);System.arraycopy(enc,0,out,iv.length,enc.length);
            return Base64.encodeToString(out,Base64.NO_WRAP);
        }
        synchronized String decrypt(String s) throws Exception {
            byte[] all=Base64.decode(s,Base64.DEFAULT);if(all.length<29)throw new IllegalArgumentException("Credencial corrompida");
            Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.DECRYPT_MODE,secret(),new GCMParameterSpec(128,all,0,12));
            return new String(c.doFinal(all,12,all.length-12),StandardCharsets.UTF_8);
        }
    }
}
