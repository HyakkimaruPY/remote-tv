# Arquitetura legível — beta 3

O manifesto decide quais fontes executam. A beta 3 mantém JavaScript ES5, adequado ao WebKit da PH32C10DSGWVA. POO usa construtores e `prototype`, sem `class`, transpiler ou dependência de Node na TV. Os aliases públicos antigos continuam disponíveis para evitar quebrar o bootstrap e a comunicação entre módulos.

## Caminhos de entrada

| Responsabilidade | Fonte ativa | Entrada / proprietário |
|---|---|---|
| Transporte compartilhado | `system/runtime-beta56-3.js` | `RemoteTV.RequestScope`: request, fetch, local, cancel |
| Feature sob demanda | `system/feature-loader-beta56-3.js` | `FeatureLoader`: cache validado, download único, instalação única |
| YouTube | `apps/youtube3/player-beta56-3.js` | `YouTubeResolver` e `NativePlaybackSession`; fachada `YouTube3Probe` |
| Live e controle nativo | `apps/player1/app.beta56-3.js` | startNativeRoute, monitorNativePlayback, startHtmlRoute, tryNextPlaybackRoute |
| Lista e logos | `system/readable/common-player-ui.beta56-3.js` | viewState, selectChannel, enqueueImages, loadNextImage |
| VOD e retomada | `system/readable/xtream-vod-player.beta56-3.js` | playbackState, reconnectProgressiveStream, confirmResumePosition |
| Catálogo e rede Xtream | `system/readable/xtream-lazy-core.beta56-3.js` | catalogState, requestJson, normalizeItem |
| Foco e telas | `system/readable/xtream-ui.beta56-3.js` | viewState, handleKey, filterPhysicalInput |
| Tema | `system/injections/graphos-skin-beta56-3.js` | Mesmo preto/grafite da beta 2 |

As demais fontes JS do manifesto estão legíveis em `system/readable/`. O mapa `local-lab/results/readable-map.json` registra a origem das 15 fontes migradas. Runtime e feature loader foram reescritos separadamente. O YouTube permanece lazy e não integra o custo de boot do M3U.

## Reaproveitamento e responsabilidades

`RequestScope` substitui os três corpos duplicados de XHR local no app, no player comum e no VOD. YouTube e FeatureLoader também o utilizam. Cada proprietário recebe sua instância; não há uma fila global misturando catálogo, controle e vídeo. `fetch` envolve uma URL remota no endpoint existente `/fetch`; `local` chama diretamente endpoints locais. Uma requisição finaliza no máximo uma vez, remove handlers, cancela seu timeout e sai da lista de pendentes. `cancel` invalida a geração antes de abortar o transporte. O YouTube usa cancel ao iniciar outra operação ou sair.

A fila cancel/start do live permanece serializada. Não é correto acelerar essas chamadas executando stop/start em paralelo. Os tokens próprios das telas e as regras de pausa/seek/retomada também permanecem. Os objetos viewState/playbackState mantêm chaves compatíveis porque são observáveis por outros módulos; nomes privados e funções foram expandidos para nomes descritivos. Não foram criadas classes vazias para envolver cada helper.

Os dois consumidores de `/c` agora usam `JSON.parse`, conforme o contrato JSON do helper, em vez de executar a resposta com eval. Respostas que dependam de código JavaScript deixam de ser aceitas como catálogo.

## YouTube: resolução, transporte e decoder

1. O botão Teste usa o mesmo ID público `M7lc1UVf-VE`, não um vídeo substituto.
2. Primeiro tenta o parser da página watch já exposto por YTCore. Se não houver formato utilizável, consulta a lista de resolvedores.
3. Instâncias explicitamente marcadas com API desativada são excluídas. Erros JSON e metadados sem formato compatível não contam como resolução bem-sucedida. Há até quatro candidatos e limite de tempo entre tentativas; nenhuma autenticação ou proteção externa é contornada.
4. Aceita MP4 muxado até 720p com codec compatível, inclusive URL de relay/companion, ou HLS do resolvedor. Não interpreta uma trilha adaptativa de vídeo sem áudio como vídeo completo.
5. A URL original e sua assinatura são preservadas. `/fetch` ou `/hls?maxh=720` do kit transportam HTTPS moderno para HTTP loopback. Não há downgrade da CDN para HTTP.
6. NativePlaybackSession possui o decoder e seu timer. Confirma por avanço ou NormalPlay; fallback HTML também passa pelo kit. Aceitar um comando não basta para anunciar reprodução. Falha termina com mensagem explícita, sem abrir um embed moderno incompatível como se estivesse funcionando.
7. Voltar libera decoder, requests e timers; outro Voltar retorna ao menu. O carregador não reinstala handlers em cada abertura.

O embed oficial foi retirado do fallback automático. Isso não torna a TV um cliente moderno de SABR/DASH: obter uma fonte compatível ainda depende de metadados disponíveis para aquele acesso.

## Desempenho e legibilidade

O teste de 22 aberturas verifica uma única obtenção, validação de hash e injeção do módulo YouTube. Antes, o carregador reinjetava o script e encadeava handlers ao abrir uma fonte já em cache. Eliminar esse trabalho é a otimização medida; não há promessa de acelerar toda requisição de rede ou o decoder.

Os fontes ativos aumentaram com indentação e nomes descritivos (aproximadamente 189 kB → 347 kB no manifesto). Isso pode aumentar o primeiro download; o cache validado continua em uso. Não foi escondido um runtime minificado sob uma alegação de fonte legível nem estimada uma melhora geral de FPS.

`tools/format-readable.cjs` é apenas ferramenta de desenvolvimento: compara AST e valores constantes de CSS antes de escrever. Se alterar qualquer fonte, atualizar o SHA do YouTube no feature loader e os bytes/SHA de todos os módulos antes de publicar. A TV não executa a ferramenta nem depende de suas bibliotecas.

## Verificação e limites

Testes de live, VOD, transporte, carregador e YouTube usam os caminhos ativos da beta 3. O laboratório deixou de substituir silenciosamente o app do manifesto por um candidato antigo. Os relatórios distinguem fixture de rede, vídeo sintético e decoder simulado de YouTube real e TV física.

Em 19/10/2026, as quatro instâncias padrão anteriores apareciam com API desativada. No teste externo, foram observados HTTP 401, 502 e HTTP 200 sem JSON; a página oficial respondeu playability OK, mas sem URL MP4 muxada. Portanto o objetivo de confirmar o primeiro vídeo real continua pendente. Uma fixture reproduzir não resolve indisponibilidade externa.

Referências primárias consultadas: [API Invidious](https://docs.invidious.io/api/), [instalação/companion](https://docs.invidious.io/installation/), [Player API oficial](https://developers.google.com/youtube/iframe_api_reference). O kit foi estudado na fonte e no contrato local, sem modificar firmware, decoder ou endpoints nativos.
