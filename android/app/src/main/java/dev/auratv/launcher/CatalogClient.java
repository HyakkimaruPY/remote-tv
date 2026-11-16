package dev.auratv.launcher;

import android.net.Uri;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.ArrayList;
import java.util.Map;

final class CatalogClient {
    private static final int MAX_BYTES=12*1024*1024;
    private static final String UA="AuraLauncher/0.1 Android";
    private final AppDb db;
    private long cachedM3uId=-1, cachedAt=0;
    private final ArrayList<JSONObject> m3u=new ArrayList<>();
    CatalogClient(AppDb db){this.db=db;}

    static String read(String address) throws Exception {
        URL url=new URL(address);String p=url.getProtocol();if(!"https".equals(p)&&!"http".equals(p))throw new IllegalArgumentException("Somente HTTP ou HTTPS");
        HttpURLConnection c=(HttpURLConnection)url.openConnection();c.setConnectTimeout(9000);c.setReadTimeout(18000);
        c.setRequestProperty("User-Agent",UA);c.setRequestProperty("Accept","application/json, text/plain, */*");
        c.setInstanceFollowRedirects(true);
        try {
            int code=c.getResponseCode();if(code<200||code>=300)throw new Exception("HTTP "+code);
            int len=c.getContentLength();if(len>MAX_BYTES)throw new Exception("Resposta excede limite");
            try(InputStream s=c.getInputStream();ByteArrayOutputStream o=new ByteArrayOutputStream()) {
                byte[] b=new byte[8192];int n;while((n=s.read(b))>=0){if(n==0)continue;if(o.size()+n>MAX_BYTES)throw new Exception("Resposta grande demais");o.write(b,0,n);}
                return o.toString("UTF-8").replace("\ufeff","");
            }
        } finally { c.disconnect(); }
    }
    static JSONObject credentials(String raw,String user,String pass) throws Exception {
        String v=raw.trim();if(!v.matches("(?i)^https?://.+"))throw new IllegalArgumentException("Informe URL HTTP(S)");
        Uri uri=Uri.parse(v);if(uri.getHost()==null)throw new IllegalArgumentException("Servidor inválido");
        String u=user.trim(),pw=pass;
        if(u.isEmpty())u=uri.getQueryParameter("username");
        if(pw.isEmpty())pw=uri.getQueryParameter("password");
        if(u==null)u="";if(pw==null)pw="";
        String host=uri.getScheme()+"://"+uri.getEncodedAuthority();
        return new JSONObject().put("host",(u.isEmpty()||pw.isEmpty())?v:host).put("username",u).put("password",pw)
            .put("kind",u.isEmpty()||pw.isEmpty()?"m3u":"xtream");
    }
    static String api(JSONObject p,String action,String category,long id) throws Exception {
        Uri.Builder u=Uri.parse(p.getString("host")+"/player_api.php").buildUpon();
        u.appendQueryParameter("username",p.getString("username"));u.appendQueryParameter("password",p.getString("password"));
        if(action!=null&&!action.isEmpty())u.appendQueryParameter("action",action);
        if(category!=null&&!category.isEmpty())u.appendQueryParameter("category_id",category);
        if(id>0){if(action.equals("get_series_info"))u.appendQueryParameter("series_id",""+id);else u.appendQueryParameter("vod_id",""+id);}
        return u.build().toString();
    }
    JSONObject auth(long id) throws Exception {
        JSONObject p=db.get(id);if(p==null)throw new IllegalArgumentException("Lista não encontrada");
        if(!"xtream".equals(p.getString("kind")))return new JSONObject().put("valid",true).put("expires",0);
        JSONObject json=new JSONObject(read(api(p,"",null,0)));
        JSONObject info=json.optJSONObject("user_info");if(info==null)throw new Exception("Resposta Xtream sem user_info");
        String auth=String.valueOf(info.opt("auth"));String status=info.optString("status","");
        String ex=String.valueOf(info.opt("exp_date"));long expiry=0;
        try{expiry=Long.parseLong(ex);}catch(Exception ignored){}
        boolean ok=("1".equals(auth)||"true".equalsIgnoreCase(auth)) && !"Disabled".equalsIgnoreCase(status)&&!"Banned".equalsIgnoreCase(status) && (expiry==0||expiry>System.currentTimeMillis()/1000);
        db.accountStatus(id,expiry,ok?"active":"expired");
        return new JSONObject().put("valid",ok).put("expires",expiry).put("status",status);
    }
    synchronized void ensureM3u(long id,JSONObject p) throws Exception {
        if(cachedM3uId==id && System.currentTimeMillis()-cachedAt<10*60*1000)return;
        String src=read(p.getString("host"));
        if(!src.startsWith("#EXTM3U")&&!src.contains("#EXTINF"))throw new Exception("Esta URL não retornou uma lista M3U válida");
        m3u.clear();String name="",group="Outros",logo="";int count=0;
        for(String row:src.split("\r?\n")) {
            String line=row.trim();
            if(line.startsWith("#EXTINF")) {
                int idx=line.indexOf(',');name=idx<0?"Canal":line.substring(idx+1).trim();
                group=attribute(line,"group-title");logo=attribute(line,"tvg-logo");if(group.isEmpty())group="Outros";
            } else if((line.startsWith("http://")||line.startsWith("https://"))&&count<12000) {
                m3u.add(new JSONObject().put("name",name.isEmpty()?"Canal "+(count+1):name).put("group",group).put("logo",logo).put("url",line).put("id",count+1));
                count++;name="";group="Outros";logo="";
            }
        }
        cachedM3uId=id;cachedAt=System.currentTimeMillis();
    }
    private static String attribute(String ext,String key){
        String x=key+"=\"";int i=ext.indexOf(x);if(i<0)return "";int end=ext.indexOf('"',i+x.length());return end<0?"":ext.substring(i+x.length(),end);
    }
    JSONObject load(long profile,String op,String type,String category,long item) throws Exception {
        JSONObject p=db.get(profile);if(p==null)throw new Exception("Lista não encontrada");
        if("m3u".equals(p.getString("kind"))) {
            ensureM3u(profile,p);JSONArray a=new JSONArray();
            if("categories".equals(op)) {
                LinkedHashMap<String,Boolean> seen=new LinkedHashMap<>();for(JSONObject o:m3u)seen.put(o.getString("group"),true);
                for(String s:seen.keySet())a.put(new JSONObject().put("category_id",s).put("category_name",s));
            }else if("content".equals(op)) {
                int n=0;for(JSONObject o:m3u)if(o.getString("group").equals(category)&&n++<900)a.put(o);
            }
            return new JSONObject().put("items",a).put("kind","m3u");
        }
        String action;
        if("categories".equals(op))action="live".equals(type)?"get_live_categories":"vod".equals(type)?"get_vod_categories":"get_series_categories";
        else if("series".equals(op))action="get_series_info";
        else action="live".equals(type)?"get_live_streams":"vod".equals(type)?"get_vod_streams":"get_series";
        String json=read(api(p,action,"content".equals(op)?category:null,"series".equals(op)?item:0));
        if("series".equals(op))return new JSONObject().put("detail",new JSONObject(json)).put("kind","xtream");
        JSONArray arr=new JSONArray(json);JSONArray trimmed=new JSONArray();
        for(int i=0;i<Math.min(arr.length(),1000);i++)trimmed.put(arr.get(i));
        return new JSONObject().put("items",trimmed).put("kind","xtream").put("truncated",arr.length()>1000);
    }
    String stream(long profile,String type,String id,String ext) throws Exception {
        JSONObject p=db.get(profile);if(p==null)throw new Exception("Lista não encontrada");
        if("m3u".equals(p.getString("kind"))) {
            ensureM3u(profile,p);
            int index=Integer.parseInt(id)-1;if(index<0||index>=m3u.size())throw new Exception("Canal não encontrado");
            return m3u.get(index).getString("url");
        }
        if(!id.matches("[0-9]{1,12}"))throw new Exception("ID inválido");
        if(!ext.matches("[a-zA-Z0-9]{1,8}"))ext="m3u8";
        String path="live".equals(type)?"live":"vod".equals(type)?"movie":"series";
        Uri base=Uri.parse(p.getString("host"));
        return base.buildUpon().appendPath(path).appendPath(p.getString("username"))
            .appendPath(p.getString("password")).appendPath(id+"."+ext).build().toString();
    }
}
