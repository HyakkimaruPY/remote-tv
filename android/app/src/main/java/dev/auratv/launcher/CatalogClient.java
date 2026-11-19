package dev.auratv.launcher;

import android.net.Uri;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** One-category Xtream API-first adapter. NEVER requests get.php for Xtream. */
final class CatalogClient {
    private static final int MAX=14*1024*1024;
    private final AppDb db;
    private long m3uProfile=-1,m3uAt=0,categoryProfile=-1;
    private String categoryKey="";
    private JSONArray categoryData=new JSONArray();
    private final ArrayList<JSONObject> m3u=new ArrayList<>();
    CatalogClient(AppDb d){db=d;}
    /** Falha HTTP com o código preservado, para decidir se vale tentar outro User-Agent. */
    static final class HttpFailure extends Exception {
        final int status;
        HttpFailure(int code){super("Servidor respondeu HTTP "+code);status=code;}
    }
    /** Painéis Xtream/XUI costumam bloquear User-Agents desconhecidos; tentamos os mesmos que os players de referência usam. */
    private static final String[] AGENTS={
        "IPTVSmartersPro/3.1.5 (iPad; iOS 14.4; Scale/2.00)",
        "VLC/3.0.16 LibVLC/3.0.16",
        "Mozilla/5.0 (Linux; Android 11; AuraRemote) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    };
    /** GET único com redirecionamento manual (inclui http→https, que o HttpURLConnection não segue sozinho). */
    private static byte[] get(String address,String agent,String accept,int limit) throws Exception {
        String current=address;
        for(int hop=0;hop<6;hop++){
            URL url=new URL(current);
            if(!"http".equals(url.getProtocol())&&!"https".equals(url.getProtocol()))throw new Exception("Use HTTP ou HTTPS.");
            HttpURLConnection c=(HttpURLConnection)url.openConnection();
            c.setConnectTimeout(12000);c.setReadTimeout(25000);c.setInstanceFollowRedirects(false);
            c.setRequestProperty("User-Agent",agent);c.setRequestProperty("Accept",accept);
            try {
                int status=c.getResponseCode();
                if(status>=300&&status<400){
                    String location=c.getHeaderField("Location");if(location==null||location.isEmpty())throw new HttpFailure(status);
                    current=new URL(url,location).toString();continue;
                }
                if(status<200||status>299)throw new HttpFailure(status);
                if(c.getContentLength()>limit)throw new Exception("Resposta grande demais");
                try(InputStream in=c.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()) {
                    byte[] b=new byte[8192];int n;
                    while((n=in.read(b))!=-1){if(n==0)continue;if(out.size()+n>limit)throw new Exception("Resposta excede o limite de segurança");out.write(b,0,n);}
                    return out.toByteArray();
                }
            }finally{c.disconnect();}
        }
        throw new Exception("Redirecionamentos demais no servidor.");
    }
    private static String text(byte[] bytes){return new String(bytes,StandardCharsets.UTF_8).replaceFirst("^\\uFEFF","");}
    /** Download sem identidade de player, para o GitHub (UI remota). Devolve bytes exatos, sem reinterpretar. */
    static byte[] download(String address,int limit) throws Exception {
        try{return get(address,"AuraRemote/1.2 (Android)","*/*",limit);}catch(Exception e){throw new Exception(friendly(e),e);}
    }
    static String read(String address) throws Exception {return iptv(address,false);}
    static String readJson(String address) throws Exception {return iptv(address,true);}
    /**
     * Leitura tolerante de provedor IPTV: tenta vários User-Agents quando o painel responde 401/403/406/458/884, vazio
     * (HTTP 200 com 0 bytes é comum em XUI/Xtream sobrecarregado) ou HTML no lugar de JSON.
     */
    private static String iptv(String address,boolean json) throws Exception {
        Exception last=null;
        for(String agent:AGENTS){
            for(int attempt=0;attempt<3;attempt++){
                try{
                    String body=text(get(address,agent,json?"application/json, text/plain, */*":"*/*",MAX)).trim();
                    if(body.isEmpty()){last=new Exception("O servidor respondeu vazio.");try{Thread.sleep(attempt==0?250:650);}catch(InterruptedException e){Thread.currentThread().interrupt();throw e;}continue;}
                    if(json&&!(body.startsWith("{")||body.startsWith("["))){last=new Exception(body.regionMatches(true,0,"<",0,1)?"O servidor devolveu uma página em vez de dados da API (confira endereço e porta).":"O servidor não devolveu JSON da API.");break;}
                    return body;
                }catch(HttpFailure f){
                    last=f;
                    if(f.status==401||f.status==403||f.status==406||f.status==458||f.status==884)break; // outro User-Agent
                    throw new Exception(friendly(f),f);
                }catch(InterruptedException e){throw e;
                }catch(Exception e){
                    String m=friendly(e);
                    if(e instanceof java.net.UnknownHostException||e instanceof java.net.ConnectException||e instanceof java.net.SocketTimeoutException||e instanceof javax.net.ssl.SSLException)throw new Exception(m,e);
                    last=e;break;
                }
            }
        }
        throw new Exception(last==null?"Servidor indisponível.":friendly(last),last);
    }
    /** Mensagens para o usuário: nunca incluem URL, usuário ou senha. */
    static String friendly(Throwable e){
        if(e instanceof HttpFailure){int s=((HttpFailure)e).status;
            if(s==401||s==403)return "O servidor recusou o acesso (HTTP "+s+"). Confira usuário e senha, ou o provedor está bloqueando este aparelho.";
            if(s==404)return "Endereço não encontrado no servidor (HTTP 404). Confira o servidor e a porta.";
            if(s>=500)return "O servidor do provedor está com problema (HTTP "+s+"). Tente novamente em instantes.";
            return "Servidor respondeu HTTP "+s+".";}
        if(e instanceof java.net.UnknownHostException)return "Servidor não encontrado. Confira o endereço e a internet do aparelho.";
        if(e instanceof java.net.SocketTimeoutException)return "O servidor demorou demais para responder.";
        if(e instanceof java.net.ConnectException)return "Não foi possível conectar ao servidor. Confira o endereço e a porta.";
        if(e instanceof javax.net.ssl.SSLException)return "Falha de segurança (SSL) com o servidor. Tente o endereço com http:// se o provedor não usa HTTPS.";
        String m=e.getMessage();return m==null||m.isEmpty()?"Servidor indisponível.":m;
    }
    private static String attr(String line,String key) {
        Matcher m=Pattern.compile(Pattern.quote(key)+"\\s*=\\s*\"([^\"]*)\"",Pattern.CASE_INSENSITIVE).matcher(line);
        return m.find()?m.group(1):"";
    }
    private static String[] configCredentials(String text) {
        String host="",u="",p="";
        Matcher m=Pattern.compile("(?im)^\\s*(DNS|HOST|SERVER|USERNAME|USER|PASSWORD|PASS)\\s*=\\s*['\"]?([^'\"\\r\\n]+)").matcher(text);
        while(m.find()){String k=m.group(1).toUpperCase(Locale.US),v=m.group(2).trim();
            if(k.equals("DNS")||k.equals("HOST")||k.equals("SERVER"))host=v;
            else if(k.equals("USER")||k.equals("USERNAME"))u=v;
            else p=v;
        }return new String[]{host,u,p};
    }
    static JSONObject credentials(String address,String user,String pass) throws Exception {
        String raw=address.trim().replaceAll("^[\"']+|[\"']+$","");String u=user.trim(),p=pass;
        if(!raw.toLowerCase(Locale.US).startsWith("http")){
            if(raw.contains("=")&&raw.matches("(?s).*(?i:dns|host|server|user|pass).*")){
                String[] x=configCredentials(raw);raw=x[0].trim();if(u.isEmpty())u=x[1];if(p.isEmpty())p=x[2];
            }
            // Endereço digitado sem esquema (servidor:porta): painéis IPTV costumam ser HTTP simples.
            if(!raw.isEmpty()&&!raw.toLowerCase(Locale.US).startsWith("http")&&!raw.matches(".*\\s.*"))raw="http://"+raw;
        }
        Uri uri=Uri.parse(raw);
        if(uri.getScheme()==null||(!uri.getScheme().equalsIgnoreCase("http")&&!uri.getScheme().equalsIgnoreCase("https"))||uri.getHost()==null)
            throw new Exception("Informe um endereço HTTP ou HTTPS válido.");
        if(u.isEmpty())u=uri.getQueryParameter("username");if(u==null||u.isEmpty())u=uri.getQueryParameter("user");
        if(p.isEmpty())p=uri.getQueryParameter("password");if(p==null||p.isEmpty())p=uri.getQueryParameter("pass");
        if(u==null)u="";if(p==null)p="";
        String userInfo=uri.getUserInfo();
        if((u.isEmpty()||p.isEmpty())&&userInfo!=null&&userInfo.contains(":")){
            String[] a=userInfo.split(":",2);if(u.isEmpty())u=Uri.decode(a[0]);if(p.isEmpty())p=Uri.decode(a[1]);
        }
        java.util.List<String> segments=uri.getPathSegments();
        if((u.isEmpty()||p.isEmpty())&&segments.size()>=3){int k=segments.indexOf("live");if(k<0)k=segments.indexOf("movie");if(k<0)k=segments.indexOf("series");
            if(k>=0&&segments.size()>k+2){if(u.isEmpty())u=segments.get(k+1);if(p.isEmpty())p=segments.get(k+2);}}
        boolean xtream=!u.isEmpty()&&!p.isEmpty();
        String scheme=uri.getScheme().toLowerCase(Locale.US);
        String authority=uri.getHost()+(uri.getPort()>0?":"+uri.getPort():"");
        String prefix="";
        if(xtream){
            String path=uri.getEncodedPath();
            if(path!=null){String l=path.toLowerCase(Locale.US);
                int at=-1;for(String marker:new String[]{"/get.php","/player_api.php","/xmltv.php","/live/","/movie/","/series/"}){int pos=l.indexOf(marker);if(pos>=0&&(at<0||pos<at))at=pos;}
                if(at>=0)prefix=path.substring(0,at);
                else if(!path.equals("/")&&!path.isEmpty())prefix=path.replaceAll("/+$","");
            }
        }
        String host=xtream?scheme+"://"+authority+prefix:raw;
        return new JSONObject().put("kind",xtream?"xtream":"m3u").put("host",host)
            .put("username",u).put("password",p);
    }
    private static String api(JSONObject p,String action,String category,String id) throws Exception {
        Uri.Builder b=Uri.parse(p.getString("host").replaceAll("/+$","")+"/player_api.php").buildUpon();
        b.appendQueryParameter("username",p.getString("username"));b.appendQueryParameter("password",p.getString("password"));
        if(!action.isEmpty())b.appendQueryParameter("action",action);
        if(category!=null&&!category.isEmpty())b.appendQueryParameter("category_id",category);
        if(id!=null&&!id.isEmpty())b.appendQueryParameter(action.equals("get_series_info")?"series_id":"vod_id",id);
        return b.build().toString();
    }
    static JSONObject authenticate(JSONObject p) throws Exception {
        if(!"xtream".equals(p.getString("kind"))) {parseM3u(read(p.getString("host")));return new JSONObject().put("valid",true).put("expires",0).put("status","M3U");}
        String body=readJson(api(p,"",null,null));JSONObject json;
        try{json=new JSONObject(body);}catch(Exception e){throw new Exception("A API Xtream não retornou JSON válido.");}
        JSONObject info=json.optJSONObject("user_info");
        if(info==null)throw new Exception("O servidor respondeu, mas sem dados de conta (user_info). Confira usuário, senha e se o endereço é de um painel Xtream/XUI.");
        // auth pode vir como 1, "1", true ou "true", conforme o painel.
        String auth=String.valueOf(info.opt("auth")),status=info.optString("status","Active");
        boolean granted="1".equals(auth)||"true".equalsIgnoreCase(auth);
        if(!granted)throw new Exception("Acesso recusado pelo servidor. Confira usuário, senha e endereço.");
        long exp=0,now=System.currentTimeMillis()/1000;
        try{exp=Long.parseLong(String.valueOf(info.opt("exp_date")).trim());}catch(Exception ignored){}
        JSONObject server=json.optJSONObject("server_info");if(server!=null){long t=server.optLong("timestamp_now",server.optLong("time_now",0));if(t>1000000000L&&t<4000000000L)now=t;}
        if(exp>0&&exp<=now)throw new Exception("Lista vencida.");
        if(!status.isEmpty()&&!status.equalsIgnoreCase("active"))throw new Exception("A conta não está ativa (status: "+status+").");
        return new JSONObject().put("valid",true).put("expires",exp).put("status",status);
    }
    JSONObject auth(long id) throws Exception {
        JSONObject p=db.get(id);
        try{
            JSONObject result=authenticate(p);
            db.status(id,result.optLong("expires",0),"active");return result;
        }catch(Exception e){
            // Só marca como vencida quando o PROVEDOR disse isso; falha de rede nunca bloqueia uma lista.
            String m=e.getMessage()==null?"":e.getMessage();
            if(m.startsWith("Lista vencida")||m.startsWith("A conta não está ativa"))db.status(id,p.optLong("expires",0),"expired");
            throw e;
        }
    }
    /** Convert only one M3U, not each category request. */
    private static ArrayList<JSONObject> parseM3u(String text) throws Exception {
        if(!text.startsWith("#EXTM3U")&&!text.contains("#EXTINF"))throw new Exception("O endereço não retornou M3U válido.");
        ArrayList<JSONObject> result=new ArrayList<>();String name="",group="Sem categoria",poster="";int i=0;
        for(String row:text.split("\\r?\\n")){
            String x=row.trim();
            if(x.startsWith("#EXTINF")){int comma=x.lastIndexOf(',');name=comma<0?"Conteúdo":x.substring(comma+1).trim();group=attr(x,"group-title");poster=attr(x,"tvg-logo");if(group.isEmpty())group="Sem categoria";}
            else if((x.startsWith("https://")||x.startsWith("http://"))&&result.size()<15000){
                String type=x.matches("(?i).*[/]series[/].*")?"series":(x.matches("(?i).*[/]movie[/].*")||x.matches("(?i).*\\.(mp4|mkv|avi|mov)([?].*)?"))?"vod":"live";
                result.add(new JSONObject().put("id",""+i++).put("title",name.isEmpty()?"Conteúdo "+(i):name).put("group",group)
                    .put("poster",poster).put("type",type).put("url",x).put("ext",x.toLowerCase(Locale.US).contains(".m3u8")?"m3u8":"mp4"));
                name="";group="Sem categoria";poster="";
            }
        }if(result.isEmpty())throw new Exception("A lista não contém itens válidos.");return result;
    }
    private synchronized void ensureM3u(long id,JSONObject p) throws Exception {
        if(m3uProfile==id&&System.currentTimeMillis()-m3uAt<10*60*1000)return;
        ArrayList<JSONObject> next=parseM3u(read(p.getString("host")));
        m3u.clear();m3u.addAll(next);m3uProfile=id;m3uAt=System.currentTimeMillis();
    }
    private static JSONArray normalized(JSONArray src,String type) throws Exception {
        JSONArray out=new JSONArray();for(int i=0;i<src.length();i++){
            JSONObject x=src.optJSONObject(i);if(x==null)continue;
            String id=x.optString(type.equals("series")?"series_id":type.equals("vod")?"stream_id":"stream_id",x.optString("id",""));
            if(id.isEmpty())continue;
            String title=x.optString("name",x.optString("title","Sem nome"));
            out.put(new JSONObject().put("id",id).put("title",title).put("type",type)
                .put("poster",x.optString("stream_icon",x.optString("cover",x.optString("movie_image",""))))
                .put("ext",x.optString("container_extension",type.equals("live")?"m3u8":"mp4"))
                .put("category",x.optString("category_id","")));
        }return out;
    }
    private static JSONArray asArray(String source) throws Exception {
        if(source.startsWith("["))return new JSONArray(source);
        JSONObject o=new JSONObject(source);JSONArray a=new JSONArray();
        java.util.Iterator<String> keys=o.keys();while(keys.hasNext()){Object x=o.opt(keys.next());if(x instanceof JSONObject)a.put(x);}
        return a;
    }
    synchronized JSONObject catalog(long id,String op,String type,String category,int page,String itemId) throws Exception {
        JSONObject p=db.get(id);boolean raw="m3u".equals(p.getString("kind"));
        if("categories".equals(op)){
            if(raw){ensureM3u(id,p);LinkedHashMap<String,Boolean> names=new LinkedHashMap<>();for(JSONObject it:m3u)if(type.equals(it.optString("type")))names.put(it.optString("group"),true);
                JSONArray a=new JSONArray();for(String n:names.keySet())a.put(new JSONObject().put("id",n).put("name",n));return new JSONObject().put("items",a);}
            String action=type.equals("live")?"get_live_categories":type.equals("vod")?"get_vod_categories":"get_series_categories";
            JSONArray a=asArray(readJson(api(p,action,null,null))),out=new JSONArray();for(int i=0;i<a.length();i++){
                JSONObject x=a.optJSONObject(i);if(x!=null)out.put(new JSONObject().put("id",x.optString("category_id"))
                    .put("name",x.optString("category_name","Outros")));}return new JSONObject().put("items",out);
        }
        if("detail".equals(op)){
            if(raw)return new JSONObject().put("title",itemId).put("episodes",new JSONArray());
            String action=type.equals("series")?"get_series_info":"get_vod_info";
            JSONObject response=new JSONObject(readJson(api(p,action,null,itemId)));
            JSONObject info=response.optJSONObject("info");if(info==null)info=response.optJSONObject("movie_data");if(info==null)info=new JSONObject();
            JSONObject out=new JSONObject().put("title",info.optString("name",info.optString("title","")))
                .put("description",info.optString("plot",info.optString("description","")))
                .put("poster",info.optString("cover_big",info.optString("movie_image","")));
            JSONArray episodes=new JSONArray();
            JSONObject map=response.optJSONObject("episodes");if(map!=null){java.util.Iterator<String> names=map.keys();while(names.hasNext()){
                String season=names.next();JSONArray eps=map.optJSONArray(season);if(eps==null)continue;
                for(int i=0;i<eps.length();i++){JSONObject e=eps.optJSONObject(i);if(e==null)continue;
                    episodes.put(new JSONObject().put("id",e.optString("id")).put("title",e.optString("title","Episódio "+(i+1)))
                        .put("type","series").put("season",season).put("episode",e.optInt("episode_num",i+1))
                        .put("ext",e.optString("container_extension","mp4")));
                }
            }}out.put("episodes",episodes);return out;
        }
        if(!"content".equals(op)||category.isEmpty())throw new Exception("Selecione uma categoria.");
        String key=type+"|"+category;
        if(categoryProfile!=id||!categoryKey.equals(key)){
            JSONArray all;
            if(raw){ensureM3u(id,p);all=new JSONArray();for(JSONObject x:m3u)if(type.equals(x.optString("type"))&&category.equals(x.optString("group")))all.put(x);}
            else{String action=type.equals("live")?"get_live_streams":type.equals("vod")?"get_vod_streams":"get_series";
                all=normalized(asArray(readJson(api(p,action,category,null))),type);
            }
            categoryData=all;categoryKey=key;categoryProfile=id;
        }
        int start=Math.max(0,page)*48;JSONArray slice=new JSONArray();for(int i=start;i<Math.min(start+48,categoryData.length());i++)slice.put(categoryData.get(i));
        return new JSONObject().put("items",slice).put("page",page).put("pages",(categoryData.length()+47)/48).put("count",categoryData.length());
    }
    synchronized String stream(long id,String type,String media,String ext) throws Exception {
        JSONObject p=db.get(id);
        if("m3u".equals(p.getString("kind"))){ensureM3u(id,p);int x=Integer.parseInt(media);if(x<0||x>=m3u.size())throw new Exception("Conteúdo não encontrado");return m3u.get(x).getString("url");}
        if(!media.matches("[0-9]{1,12}"))throw new Exception("ID de mídia inválido");
        if(!ext.matches("[a-zA-Z0-9]{1,8}"))ext=type.equals("live")?"m3u8":"mp4";
        Uri.Builder b=Uri.parse(p.getString("host")).buildUpon();
        b.appendPath(type.equals("live")?"live":type.equals("series")?"series":"movie");
        b.appendPath(p.getString("username"));b.appendPath(p.getString("password"));b.appendPath(media+"."+ext);
        return b.build().toString();
    }
}
