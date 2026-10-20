# Aura · Remote TV LG · player online 1.0.2

Porte para LG webOS da interface **Remote TV 0.56-beta.5**, conforme o manifesto da revisão `d39ea99d9dcc6dfcde9e6358a7dd8daa7f2b241a`. A aplicação Android anexada foi analisada como referência para autenticação e carregamento por categoria; seu código Java e o APK não rodam em webOS.


## Versão 1.0.2 — novo launcher IPK e player remoto

A **versão do player online é 1.0.2** e o novo pacote instalável LG webOS usa a **base 1.0.2** (appinfo.json). É um **IPK para TV LG**, não um APK Android. O pacote fica em `dist/com.srhell.aura.lg_1.0.2_all.ipk` após a validação da build. O histórico 1.0.0 e o player 1.0.1 são preservados.

No launcher 1.0.2, a tela inicial mostra **Player <versão em cache> · Base 1.0.2**; o valor do player é atualizado automaticamente conforme releases remotas válidas. A inicialização verifica `version`, `manifest.json`, tamanho e SHA-256, baixa o payload apenas se necessário e armazena em staging. Ao selecionar **Executar**, prioriza a atualização íntegra em cache; depois de `aura-ready`, ela substitui a cópia ativa, preservando a anterior para recuperação. O botão **Atualizar** continua consultando o servidor manualmente, inclusive com o mesmo número de versão. Se o download falhar, abre o melhor player local verificado, incluindo o embutido 1.0.2.

Se o repositório publicar no futuro **1.0.3** com manifesto e `version` consistentes, o IPK **1.0.2** detectará, baixará e executará o novo player sem reinstalação. Atualizam-se online o HTML/CSS/JavaScript e a apresentação do próprio player. O código nativo do launcher embutido no IPK, incluindo o texto estático antes da atualização, só muda com outro IPK; o rótulo de versão do player e o conteúdo executado são dinâmicos. **Não** se tenta baixar e instalar IPKs silenciosamente pelo webOS.

Correção das capas: carregamento de até quatro imagens independentes, sem aguardar a conclusão da imagem anterior; logos de canais não bloqueiam o restante da fila; novas imagens aparecem assim que terminam e não esperam o lote. Mantido o limite de concorrência, cancelamento por navegação, prioridade da imagem em foco e o ajuste de dimensões (TMDB, imagens de provedor compatível) que havia sido omitido na adaptação LG. Não são modificadas as APIs de reprodução.

A publicação da 1.0.2 é transacional: o workflow `.github/workflows/lg-remote-102.yml` compila e testa, empacota IPK, publica payload/manifesto/backup e só então avança o marcador remoto `Remote TV LG/version`. Veja `RELEASE-1.0.2.md` para teste e limitações.

## Atualização online 1.0.1 — histórico (sem reinstalar)

A versão **1.0.1 é o player remoto**, entregue pelo manifesto e pelo marcador desta pasta. O launcher/IPK original **1.0.0 permanece inalterado**. Não é preciso enviar nem instalar outro pacote para receber estas correções.

No app original já instalado: abra o Aura, aguarde a indicação de **1.0.1 disponível/salva** e selecione **Executar**. A verificação/download é automática; não é necessário pressionar Atualizar. O player confirma a inicialização e fica salvo no cache. Se o usuário executar antes do término do download, a sessão já aberta continua com a cópia local e a nova versão fica disponível na próxima execução.

Foram extraídas do arquivo `Aura-LG-1.1.1.ipk` enviado pelo usuário as alterações de runtime: checkbox maior e acionável por OK, botões superiores/filmes/séries acionados explicitamente, aliases de teclas do controle, ajuste de prévia após tela cheia, atalhos de canais e VOD e preservação do esquema HTTPS. A estrelinha de favoritos permanece como no pacote recebido: a alteração de tamanho foi indicada como pendente pelo autor.

`FRIEND-FIX-ORIGIN.json` registra o hash do IPK e do HTML recebido. O novo HTML é idêntico ao HTML recebido após normalizar **1.1.1 → 1.0.1** e os rótulos locais **beta.6 → beta.5**. Esses rótulos não eram uma atualização verificada do upstream. Os quatro fontes originais beta.5 permanecem íntegros; as diferenças no código derivado são aplicadas por patches explícitos em `src/patches/`, sem editar os arquivos históricos.

**Compatibilidade do atualizador:** o launcher original 1.0.0 aceita esta atualização automaticamente, como verificado em teste. O launcher modificado dentro do IPK 1.1.1 tem um filtro numérico local e ignora automaticamente um marcador remoto 1.0.1 por considerá-lo menor. Publicar somente o HTML não executa código antes dessa comparação. Essa limitação específica foi reproduzida; não há promessa de atualização automática desse pacote 1.1.1 para 1.0.1. O presente lançamento atende ao launcher original instalado, sem novo IPK.

## Instalação inicial (somente quem ainda não possui o app)

O pacote atualizado fica em `dist/com.srhell.aura.lg_1.0.2_all.ipk` (a versão original 1.0.0 permanece arquivada), com ID `com.srhell.aura.lg` e nome visível **Aura**. Configure a TV no CLI oficial da LG e instale:

```sh
ares-install --device minha-lg dist/com.srhell.aura.lg_1.0.2_all.ipk
ares-launch --device minha-lg com.srhell.aura.lg
```

A instalação usa o modo de desenvolvimento e os requisitos de acesso da própria LG. O IPK não equivale a uma publicação aprovada no LG Content Store.

O launcher mostra a versão instalada e tem **Executar** e **Atualizar**. Ele verifica o GitHub automaticamente ao abrir. Executar usa a versão completa já disponível no aparelho. Atualizar força uma nova consulta e verificação, inclusive quando o número da versão não mudou. Uma atualização concluída é aberta pelo botão Executar; uma sessão em reprodução não é interrompida por atualização.

## Três fontes

1. **M3U remoto:** lê `Remote TV LG/lista.m3u` neste repositório. Substitua o arquivo por sua lista completa ou por uma linha com a URL completa da lista. URLs `get.php` com usuário/senha são interpretadas localmente e seguem para `player_api.php`, sem baixar a lista. O repositório é público: mantenha acessos privados no formulário local, em vez de publicar senhas.
2. **Credenciais:** servidor completo, usuário e senha. Usa a API de assinante Xtream Codes, também oferecida por painéis XUI compatíveis. Não usa API administrativa. O acesso só prossegue com conta autorizada, ativa e não vencida.
3. **M3U completo:** aceita uma URL HTTP/HTTPS ou o texto completo iniciado por `#EXTM3U`. URLs com credenciais Xtream usam a API; listas genéricas são analisadas em blocos para não bloquear a navegação continuamente.

A opção Lembrar acesso é desmarcada por padrão. Quando marcada, os campos ficam no armazenamento local do app; essa versão web não dispõe do Android Keystore do projeto original. Favoritos e progresso são separados por servidor/usuário. A senha não é usada como identidade da biblioteca.

## Interface portada da beta.5

Os quatro módulos originais da beta estão preservados, sem edição, em `src/upstream/`; bytes e SHA-256 estão em `UPSTREAM.json`. `build.py` aplica as adaptações e os patches recuperados do IPK e gera um HTML autocontido. O catálogo e a interface não foram substituídos por uma imitação da versão estável.

- Ao vivo, Filmes, Séries, Favoritos, Continuar e Log seguem a organização da beta.
- Categorias laterais, catálogo de uma categoria por vez e detalhes sob demanda.
- Listas de API sempre incluem `category_id`; não há download global disfarçado de paginação.
- Seis episódios por página; temporadas, botões e retorno de foco da beta.
- Lotes de imagens, cancelamento de arte ao sair e logos de conteúdo da beta.5.
- Tema Graphene monocromático da beta.5, com o nome Aura e versão LG.
- A escala deriva de `innerWidth` e `innerHeight`; painéis principais usam percentuais. Não há superfície de aplicação fixada em 1280×720. O sistema webOS ainda define a resolução lógica de composição, conforme as regras da LG.
- O adaptador de vídeo LG usa um único elemento HTML5 `video`. Mantém pausa, proporção, prévia de canal/tela cheia, progresso, continuar, próximo episódio e busca transacional: a posição só muda ao confirmar; voltar/cancelar preserva a posição anterior.
- A API Xtream oferece temporadas e metadados de séries. Uma M3U genérica não oferece necessariamente essa estrutura: uma entrada classificada como série é apresentada como um episódio independente. Não se inventam temporadas a partir de nomes de arquivo.

A ponte Go, o transcodificador e os endpoints `127.0.0.1:8765` da Philco não existem na LG. Por isso, transporte de rede e reprodução são adaptadores locais próprios. O porte não promete transcodificação, alteração de codecs ou instalação de novos decoders por HTML.

## Cache e atualização recuperável

O IPK contém uma primeira versão funcional completa, independente de download do código na primeira abertura. O launcher utiliza três slots de `localStorage`: `aura.lg.active`, `aura.lg.previous`, `aura.lg.staging`.

1. A cópia local é validada por versão, bytes UTF-8 e SHA-256.
2. O launcher consulta `version`; se não mudou, não baixa o HTML novamente.
3. Ao mudar, baixa `manifest.json`, exige correspondência de versão e baixa somente o payload declarado em `releases/<versão>/player.html`.
4. Conteúdo parcial, tamanho divergente, hash incorreto ou erro de gravação mantém a versão anterior.
5. O candidato fica em staging, é relido e validado e só é promovido quando o iframe executa e confirma `aura-ready` com o token da abertura.
6. O watchdog de 7 segundos recupera a versão ativa/anterior ou a versão embutida se o candidato não inicializar.
7. Sem rede, a interface já salva continua abrindo. Isso não torna transmissões ou catálogos remotos disponíveis sem conexão.

Não se usa cookie, Service Worker, import de módulo ES ou WebCrypto como requisito de inicialização. SHA-256 funciona em JavaScript ES5. Uma falha funcional posterior ao sinal de inicialização ainda pode exigir uma release corretiva: o sinal não comprova que todos os provedores ou codecs funcionam.

## Compatibilidade e limites verificados

Alvo de implementação: **LG webOS TV 1.x (2014) e versões posteriores**. Modelos **NetCast não instalam este IPK**, mesmo quando o ano do aparelho coincide com um modelo webOS. Não existe validação física de todas as gerações nesta entrega.

Código de produção é parseado como ES5. Não há React, CSS Grid, dependência de fetch/Promise para rede, nem bibliotecas externas necessárias para montar a interface. O webOS decide os codecs/protocolos nativos disponíveis por modelo; HLS e mídia direta usam esse suporte, sem fingir que o decoder da Philco foi portado.

**CORS:** a LG segue CORS. O provedor precisa permitir acesso ao app (origem `file`/`null`, conforme a geração) ou oferecer uma solução autorizada no servidor. O app não desativa a segurança do webOS nem inclui proxy público. Imagens e vídeo também dependem das políticas do servidor, certificados TLS e codecs. Uma URL que funciona em Android nativo não garante que o mesmo servidor aceite XMLHttpRequest no webOS.

HTTPS do GitHub e de provedores também depende do suporte TLS e certificados do firmware antigo. Uma falha de atualização preserva a versão embutida/cache. Distribuição na loja permanece sujeita às políticas e à revisão da LG, inclusive para conteúdo atualizado remotamente.

## Estrutura e manutenção

```text
app/                  launcher IPK, SHA-256 e fallback embutido
src/upstream/         quatro módulos originais da beta.5
src/core.js           rede, autenticação e leitura M3U
src/sources.js        seleção das três fontes
src/lg-adapter.js     adaptação do catálogo e vídeo nativo LG
src/lg.css            adaptação responsiva da interface beta
src/init.js           teclado, escala e confirmação de boot
src/patches/          correções de runtime extraídas do IPK recebido
releases/1.0.0/       HTML remoto imutável por versão (junto de 1.0.1/ e 1.0.2/)
manifest.json         tamanho e hash do HTML remoto
version               marcador de ativação, publicar por último
lista.m3u             fonte remota configurável pelo proprietário
build.py              build determinístico
UPSTREAM.json         proveniência e hashes dos módulos da beta
VALIDACAO.md          evidência executada e limites
```

Build: Python 3 e Node.js 22 ou mais recente, CLI oficial `@webos-tools/cli` 3.2.6. O empacotamento não requer toolchain Android.

```sh
npm install
python3 build.py
npm test
npm run package
```

O teste de navegador requer Chromium/Playwright e um vídeo de teste local de 40 segundos, sem conteúdo de terceiros. Os comandos e resultados desta entrega estão em `VALIDACAO.md`.

`python3 build.py` gera apenas a release online, manifesto e marcador; não modifica `app/` nem `dist/`. A opção explícita `--update-embedded` só deve ser usada quando houver um pedido separado para atualizar o fallback de um novo pacote.

Para uma atualização remota: alterar `VERSION` no build, gerar e testar; publicar primeiro o novo `releases/<versão>/player.html`, o manifesto, os fontes e o relatório; verificar os blobs remotos; publicar `Remote TV LG/version` por último. Não alterar o `version` ou manifesto da raiz do repositório: eles pertencem à Philco. Releases anteriores devem permanecer disponíveis. Atualizações do próprio launcher exigem novo IPK.

## Referências oficiais LG consultadas

- https://webostv.developer.lge.com/develop/specifications/web-api-and-web-engine
- https://webostv.developer.lge.com/develop/specifications/app-resolution
- https://webostv.developer.lge.com/develop/references/appinfo-json
- https://webostv.developer.lge.com/develop/getting-started/web-app-types
- https://webostv.developer.lge.com/develop/specifications/streaming-protocol-drm
- https://webostv.developer.lge.com/faq/how-to-solve-the-problem-if-cors-occurs
- https://webostv.developer.lge.com/develop/tools/cli-installation
