# Aura Remote 1.3 — interface mobile pronta, OTA aguardando chave válida

## Alterações publicadas no código-fonte
- Nova interface mobile Graphene escura: hero da categoria, covers 5:7 em duas colunas, detalhes de filme/série em tela cheia, poster à esquerda do título, abas de temporadas e “Você pode gostar”, seletor de temporada e episódios.
- Fontes HTML/CSS/JS em `android/phone/ui/` e cópia da interface embutida no projeto.
- A pasta de atualização remota de TV `android/tv/` e sua interface NÃO foram alteradas.

## Bloqueio de publicação para o APK já instalado
O ZIP `AuraRemote_AndroidTV_1.2_COMPILAR.zip` **tem chave pública de atualização diferente** da chave pública do antigo APK v0.1 presente em `android/app/src/main/assets/update_pub.der`.
- Public key v0.1: `android/keys/update_pub_v0_1.der` (somente auditoria do release1).
- Public key v1.2: `android/keys/update_pub_v1_2.der` (extraída do ZIP v1.2 instalado).
- A chave privada v1.2 **não está no ZIP nem no GitHub** e não foi gerada neste trabalho. Gerar uma nova chave não funciona para o APK já instalado.
- Por isso `android/phone/version` permanece em `1` e o `manifest.json` legado permanece intacto. NÃO anuncie uma revisão 3 sem assinatura correspondente.

## Ativar atualização automática da interface instalada (sem novo APK)
1. No GitHub do repositório, em **Settings → Secrets and variables → Actions**, crie o segredo `AURA_PHONE_UPDATE_PRIVATE_KEY_PEM` com o conteúdo integral da chave privada RSA **original** que corresponde à chave pública v1.2 acima. Nunca comitar a privada.
2. Abra **Actions → Publish signed Aura Remote mobile UI → Run workflow**, com `revision = 3`.
3. O fluxo confere a chave pública derivada, assina os três arquivos HTML/CSS/JS, confere os hashes e publica `releases/3` + `manifest.json` e **somente depois** o `version=3`.
4. No aplicativo já instalado use **Buscar atualização**, ou reabra o aplicativo. Sem a chave privada correta o fluxo falha, sem colocar o app em risco.

## Player e base Android
A alteração Java que força `PlayerView` e o shutter para preto foi feita na fonte, mas **exige recompilar/instalar um APK**. OTA HTML/CSS/JS não consegue modificar superfícies nativas Media3/SurfaceView.

ATENÇÃO: o diretório `android/app/` no GitHub é uma antiga base nativa v0.1. Ele **ainda precisa ser sincronizado com a fonte nativa do ZIP 1.2 antes de compilar um novo APK**. Não instale um APK compilado diretamente de `main` sem antes esta sincronização. Isso não afeta a atualização de UI remota do APK 1.2.

Limitação dos metadados nativos: o backend atual não fornece backdrop próprio, avaliação ou recomendações globais; a interface usa poster desfocado como fallback e oferece sugestões de títulos carregados na categoria.
