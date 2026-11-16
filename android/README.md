# Aura Launcher — Android + Android TV (MVP 0.1)

Projeto híbrido offline de IPTV, compartilhando backend Java nativo (SQLite, Media3/ExoPlayer, Xtream/M3U, atualizador de UI assinado) e com **dois bundles HTML/CSS/JS independentes** para smartphone e TV. Desenvolvido como terceira plataforma do repositório `remote-tv`, isolado de `manifest.json`, `version`, `apps/player1` e `Remote TV LG/`.

## Estado de entrega

- **Implementado na fonte:** WebView local com `WebViewAssetLoader`, detecção por `FEATURE_LEANBACK`/`UI_MODE_TYPE_TELEVISION`, layout touch/DPAD, formulário de listas, múltiplos perfis/expiração, SQLite criptografado via Android Keystore, Xtream com categorias sob demanda, lista M3U por URL, Media3 ExoPlayer, continuidade VOD, atualização separada `phone`/`tv` com assinatura RSA/SHA-256 e recuperação da versão anterior.
- **Validado no ambiente de desenvolvimento:** sintaxe JS, XML, SHA-256 dos pacotes, assinatura RSA, presença/consistência dos assets; **não compilado em APK** por ausência do SDK Android/Gradle no ambiente e **não testado em hardware**.
- **Não incluído ainda:** DRM, EPG, gravação, perfis avançados/pin, pesquisa global, renovação de credenciais no mesmo perfil (na v0.1 adicione outra lista), substituição do launcher HOME do sistema, mecanismos proprietários de aparelhos LG/Philco, aceleração específica de decoders, migração automática de IndexedDB legado. São etapas posteriores.

## Compilar

1. Abra a pasta `android/` no Android Studio com **JDK 17**, SDK Android 36, internet para resolver dependências Gradle. O projeto usa AGP 8.11.1 e Gradle 8.13 (JDK 17).
2. O arquivo `gradle/wrapper/gradle-wrapper.properties` está preparado; o **`gradle-wrapper.jar` não foi gerado** neste ambiente. No Android Studio, escolha Gradle local instalado ou execute `gradle wrapper --gradle-version 8.13` para criar o wrapper; então `./gradlew :app:assembleDebug`.
3. Instale `app/build/outputs/apk/debug/app-debug.apk` por ADB ou pelo gerenciador de pacotes. **É um aplicativo (launcher de conteúdo), não substitui a tela HOME do sistema.**
4. Requer Android 6.0/API 23 ou superior e implementação do MediaCodec/Android WebView compatível. TVs sem Android não podem instalar o APK.

## Fluxo de lista

No primeiro acesso, informe nome + URL M3U ou link Xtream `get.php` contendo `username/password`, ou URL do servidor com usuário/senha em campos separados. Para Xtream, a conexão é sempre `player_api.php` e as categorias são solicitadas individualmente; **nenhum catálogo global** é baixado. Para M3U puro, a URL é lida, limitada a 12 MiB, em cache de memória por 10 minutos, com até 12 mil entradas e renderização de até 900 itens por categoria.

A API retorna `exp_date` em segundos Unix. Quando a lista selecionada expira, o aplicativo tenta outra lista não expirada. Se não houver, mostra a tela de login. O avatar abre listas, datas, botão adicionar/remover e versão/rollback. Contas M3U simples não informam expiração e aparecem como "Sem expiração informada". O cache de categorias, capas e dados de provedores continua sujeito à conectividade do provedor.

## Divisão técnica

```text
remote-tv/
  manifest.json                         # Philco intacto
  Remote TV LG/                         # LG intacto
  android/
    app/                                # APK Java: WebView, SQLite, Media3, verificação remota
    phone/ui/                            # UI e endpoint do smartphone
    phone/releases/1/                    # snapshot inicial
    phone/manifest.json + version        # canal phone
    tv/ui/                               # UI e endpoint Android TV
    tv/releases/1/                       # snapshot inicial
    tv/manifest.json + version           # canal tv
    tools/publish_release.py             # prepara pacote e assina
    tests/test_release.py                # valida hashes e assinaturas
```

`WebViewAssetLoader` serve apenas `https://appassets.androidplatform.net/app/{index.html,style.css,app.js}` usando bundle local válido, ou fallback do APK. A UI não recebe acesso a URL/credenciais das contas Xtream; solicita dados ao bridge Java. Perfis no banco SQLite; URLs, usuários e senhas são cifrados usando AES-GCM com chave no Android Keystore. Progresso fica vinculado ao perfil. As versões de UI nunca alteram o banco.

## Atualização remota

O cliente consulta apenas:

- `https://raw.githubusercontent.com/HyakkimaruPY/remote-tv/main/android/phone/version` + `manifest.json`, em smartphone;
- `https://raw.githubusercontent.com/HyakkimaruPY/remote-tv/main/android/tv/version` + `manifest.json`, em Android TV.

O processo exige **revisão diferente e superior**, assinatura SHA256withRSA do payload por chave pública embutida no APK, `channel`, `schema`, `min_native`, SHA-256 individual por arquivo e staging em armazenamento privado. Após verificar todos os arquivos, ativa uma revisão com `SharedPreferences.commit()`. Guarda a versão anterior; ao regredir, bloqueia a revisão rejeitada até surgir outra versão.

**Releases futuras:** após editar `phone/ui/` ou `tv/ui/`, executar localmente (em ambiente confiável):

```sh
python3 tools/publish_release.py --channel phone --revision 2 --key /CAMINHO/PRIVADA.pem
# ou
python3 tools/publish_release.py --channel tv --revision 2 --key /CAMINHO/PRIVADA.pem
python3 -m unittest discover -s tests -v
```

Publique `releases/2/{index.html,style.css,app.js}`, depois `manifest.json` e **por último `version`**. Nunca publique a chave privada no repositório ou dentro do APK. O arquivo privado que acompanha esta entrega foi fornecido **separadamente**. Preserve-o em local seguro; se perdido, atualizar a chave pública exige novo APK. As revisões 1 são *snapshots da base*, e não precisam ser baixadas por clientes novos. Alterações no Java/Media3/SQLite/AndroidManifest exigem recompilar APK; **não são atualizações HTML remotas**.

## Verificações pendentes em dispositivos reais

- Android celular: primeiras credenciais, lista válida/inválida/expirada, rotação, DRM ausente, Android Back, HLS/MP4 e retorno.
- Android TV: controle infravermelho e Bluetooth, foco sem bloqueios, cards na densidade real, decodificação HLS/TS, teclado na tela, memória baixa.
- Atualização real v2: publicar release de teste, desligar rede durante staging, reiniciar, verificar fallback, rollback e atualização v3.

Use listas e serviços que você tem autorização para acessar. Este app não fornece canais ou conteúdo.
