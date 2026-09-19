# Remote TV — guia mandatório de trabalho

Leia este arquivo antes de qualquer tarefa neste repositório. Atualize apenas descobertas verificadas e checkpoints; não replique históricos extensos.

## Fonte de verdade e caminho curto
- Projeto: `HyakkimaruPY/remote-tv`, branch publicada `main`. Leia `version` e `manifest.json` primeiro: só os módulos apontados no manifesto estão ativos. Arquivos com números antigos não significam código inativo.
- Base estável informada pelo usuário e encontrada nesta sessão: `0.30`, commit `40a146d`. Preserve os arquivos e o manifesto dessa versão para comparação/rollback.
- Use `git status`, `git log -5 --oneline`, depois buscas `rg -n` por função/identificador nos módulos ativos. Evite ler todas as versões e reconstruir firmware para uma alteração remota.
- Execute shell/git para leitura, edição, validação e publicação. O conector GitHub é alternativa quando git não estiver disponível. Nunca exponha credenciais em logs ou comandos impressos.
- Antes de editar, identifique dono da função, quem a chama e quem a sobrescreve depois. Diagnostique a causa antes de adicionar outra injeção.

## Arquitetura confirmada
- Firmware Philco PH32C10DSGWVA: WebKit antigo, interface fixa 1280×720, bridge local `http://127.0.0.1:8765`. Use JavaScript ES5 e CSS compatível; não presuma recursos de navegador moderno.
- Bootstrap consulta `version`, valida manifesto e SHA-256/bytes, usa staging, active e previous. Veja `REMOTE_UPDATE_ARCHITECTURE.md` para detalhes. `version` é publicado POR ÚLTIMO.
- `apps/player1/app.remote24.js`: menu base, controle nativo/live, `RawPlayer`, roteamento de teclado e saída ao Playroom (`qjy_exitBrowser`).
- `xtream-lazy-core-v30.js`: `XT10`, autenticação/API, cancelamento por epoch, catálogo de uma categoria, detalhes e normalização lazy. `xtream-auth-guard-v30.js` preserva sessão válida em falha transitória.
- `xtream-ui-v30.js`: `RawM3U`, estados/telas, foco, cabeçalho, paginação, imagens, detalhes de filmes/séries. `graphos-skin-v27.js` sobrescreve CSS com `!important`.
- `tmdb-metadata-v24.js`: metadados/logos e cache; lê configuração externa em fei-config. Não editar esse repositório externo.
- `xtream-vod-player-v29.js`: HTML5/native/HLS.js, progresso, próximo episódio, buffer/reconexão. `autovod-v22.js` resolve rotas; `hlsjs-loader-v20.js` carrega HLS.js.
- `common-player-ui-v17.js` envolve `document.onkeydown`; app base instala também keypress/keyup/IR. `live-log-overlay-v29.js` usa captura. Não instalar um segundo caminho de navegação sem consumir corretamente o evento.
- YouTube 2/3 e Player 2 são escopos separados. Não alterar em tarefas de Xtream.

## Invariantes
- API-first: extrair credenciais; nunca baixar `get.php`. Listagens exigem `category_id`; carregar somente a categoria atual, detalhes sob demanda.
- Proteger segredos; preservar favoritos/progresso e guardas de autenticação. Não alterar decoder, firmware, flash, ABI ou ações nativas destrutivas.
- Callback/timer de tela ou reprodução antiga não pode reabrir tela, roubar foco, tocar o próximo vídeo nem iniciar retry após cancelamento.
- Controle tem prioridade: primeiro mover foco; imagens decorativas aguardam ociosidade, com concorrência limitada, timeout e cancelamento. Não interromper transporte do vídeo por pressionar uma seta.
- Não prometer que abortar uma imagem cancela o trabalho nativo do bridge; isso precisa de medição na TV. JSON.parse/decodificação em curso não podem ser preemptados por JavaScript.
- Log e testes não equivalem a validação física de streaming na TV.

## Pedido em execução — 19/09/2026
- Corrigir botão Voltar do cabeçalho para retornar ao Playroom, movimentos duplicados e repetição excessiva (inclusive temporadas).
- Séries: seis episódios por página, grade 3×2 menor no canto inferior direito; temporadas/sinopse mais abaixo; remover divisória; logo substitui nome quando disponível, texto como fallback.
- Filmes: arte de fundo, informações na região inferior esquerda conforme fotos; preservar os botões da versão atual.
- Otimizar navegação e corrigir falhas demonstráveis de estabilidade sem trocar a engine estável gratuitamente.

## Validação e publicação
1. Criar arquivos versionados novos para os módulos alterados; preservar os antigos.
2. Testar comportamento: um toque/um movimento, tecla mantida, troca rápida de tela, Voltar durante carga, paginação 6/7/13 episódios, erro/timeout de imagem, pausa e saída durante reconexão.
3. Verificar sintaxe de JS, diff, hashes/bytes e layout em 1280×720. Mock de bridge/decoder serve para regressões determinísticas; nunca alegar teste real de TV.
4. Commit de módulos+manifesto+manifesto arquivado e relatório. Publicar; só depois commit de `version`. Se `main` mudou, reavaliar antes de publicar, sem force-push.
5. Registrar aqui versão, commits relevantes, testes e limitações. Resposta final curta com versão publicada e o que precisa ser observado na TV.

## Checkpoint inicial
- Estudo concluído sobre `0.30` / `40a146d`.
- Confirmados: cabeçalho chama `back` interno; grade usa 9; fila de imagens não aborta ativa nem tem timeout; `hideBroken` sobrescreve seu onerror; reconexão VOD não verifica token da sessão; retry de API agendado pode executar após cancelamento; tratamento de JSON inválido referencia `kind`/`snip` ausentes nesse módulo.


## Checkpoint remote.31
- Guia inicial publicado no commit `f1c7dc9`. A publicação desta sessão usa o conector GitHub para escrita: clone por git funcionou, push por HTTPS não tinha credencial. Evite repetir tentativas de push nessa condição.
- Módulos alterados agora terminam em `31`: app, core lazy, auth guard, TMDB, UI, VOD e overlay de log live. O manifesto continua sendo o mapa autoritativo. Interfaces públicas `XT10`, `XTMeta24`, `XTVod29` e `RawM3U` foram preservadas.
- Entrada: filtro em captura no window, debounce de 120 ms, início de repetição em 340 ms, intervalos de 170 ms (260 ms temporadas); eventos keyup/keypress não executam Voltar novamente. Imagens esperam 500 ms de ociosidade; respostas da API aguardam 450 ms antes de parse/callback.
- Cabeçalho Voltar limpa sessão visual e chama `RawPlayer.exit`, que expõe a saída nativa Q já existente. Voltar dos detalhes continua retornando ao catálogo.
- Grade: seis episódios, 246×138 px, três colunas, duas linhas, coordenadas de início (472,391); temporadas em (40,526). Foco de temporadas rola apenas o contêiner, com retângulos relativos; offsetTop sem compensação causava salto para as últimas temporadas.
- Streaming: callbacks usam token/sessão, reconexão preserva URL assinada e pausa, timers são liberados, três falhas consecutivas encerram retry automático. HTML5 startup conclui apenas uma vez.
- Autenticação cancelada limpa a fila/busy do guard, permitindo reabrir; guardas transitórias da 0.30 foram preservadas. JSON inválido não imprime trechos potencialmente sensíveis.
- Verificação: 14 testes determinísticos passaram; teste Chromium integrou app/common/UI, saída nativa mock, geometria 3×2, logo, temporadas e filme sem erros de página. Imagens de teste são sintéticas. Não houve acesso à TV/decoder nem teste de streaming real.
- Reproduzir testes: instalar `jsdom acorn` em diretório temporário e configurar NODE_PATH; executar `node tests/remote31.test.cjs`. Para visual, Playwright instalado e `RTV_CHROMIUM=/caminho/chromium node tests/remote31.browser.cjs`. Dependências nunca são enviadas para a TV.


## Checkpoint remote.32
- Publicação preparada sobre a remote.31 sem alterar firmware/flash, decoder, YouTube, Player 2 ou fei-config. Os módulos novos são `xtream-vod-player-v32.js` e `xtream-ui-v32.js`; interfaces públicas `XTVod29` e `RawM3U` permanecem.
- Player: ↑ abre controles e ↑ novamente entra na barra de progresso; ←/→ move o cursor em passos de 1 s; OK confirma o salto; ↑/Voltar cancela sem alterar a posição principal. A prévia usa vídeo separado e aplica o último alvo mesmo se `loadedmetadata` chegar depois de movimentos rápidos.
- Teclas físicas: Rewind/Fast-forward 412/417, com fallbacks 227/228 e 177/176, fazem ±30 s fora do modo de seleção; Play 415, Pause 19 e Stop 413/169 são tratados. O aviso de próximo episódio não rouba mais o primeiro ↑.
- HUD passa a 4 s. Durante seek, watchdog/autoavanço não devem interpretar a pausa intencional como travamento.
- Catálogo: troca de página de categorias e retorno de listagem fazem repintura parcial em vez de reconstruir `library()`; progresso dos cards usa cache curto para evitar reler/parsing do mesmo JSON por card.
- Validação desta sessão: sintaxe dos dois módulos PASS; harness VOD PASS para fluxo ↑→↑, cursor de 1 s, prévia separada, confirmação/cancelamento e media keys; corrida de metadata tardia PASS; harness UI 7→8 confirmou repintura parcial sem rebuild completo. Hash SHA-256 foi conferido contra os artefatos v31 já publicados antes de gerar os hashes v32.
- Regressions `tests/remote32.test.cjs` e `tests/remote32.browser.cjs` usam o `app.remote31.js` ativo. O teste determinístico ganhou casos específicos de seek e repintura parcial; ambos os arquivos passaram parsing sintático, mas jsdom/Playwright completos não foram executados nesta sessão. Não houve acesso físico à TV/decoder nem validação de stream real; a prévia simultânea em segundo `video` precisa ser observada na Philco.
- Manifesto arquivado: `manifest.remote32.json`. Relatório: `REMOTE_32_VALIDATION.md`. Manifesto ativo publicado no commit `ecc651d0`; `version` foi ativado em `1888e2d`. Após a ativação 0.32, somente testes/documentação foram corrigidos; módulos ativos e manifesto permaneceram inalterados.


## Checkpoint remote.33
- Follow-up mínimo da remote.32 para cobrir o caminho físico `irkeypress`. Módulo novo: `xtream-ui-v33.js`; VOD/seek permanece em `xtream-vod-player-v32.js`. Nenhum layout, decoder, firmware/flash, YouTube, Player 2 ou fei-config foi alterado.
- Causa confirmada: a captura da UI reencaminhava `irkeypress` apenas para setas/OK/Voltar. Teclas de transporte já entendidas pelo VOD poderiam ser ignoradas quando o controle as emitisse somente como IR.
- Correção: captura inclui 19/169/176/177/227/228/412/413/415/417; `irkeypress` é consumido e sintetiza um único `document.onkeydown`. Debounce de mídia: 300 ms. `navImgs27()` continua exclusivo das setas para que Play/Pause/Rewind/Fast-forward não perturbem a fila de imagens.
- Validação: parsing PASS; varredura de construções modernas nas mudanças de produção PASS; harness isolado roteou 417 exatamente uma vez ao `XTVod29.key`. Regressions reproduzíveis em `tests/remote33.test.cjs` e `tests/remote33.browser.cjs`.
- Artefato UI: 53621 bytes; SHA-256 `64909f2a48bb10dbbacaa41e3cfe7505ab041f7cd39f18969a8ada5718e4043d`.
- Commits: módulo `674d181`; regressions `9102491` / `3a2f2d2`; relatório `a653dd5`; manifesto arquivado `e00d709`; manifesto ativo `a12bf58`.
- Limites: jsdom/Playwright completos e TV física não foram executados. Confirmar no aparelho quais códigos o controle emite e a prévia simultânea do seek.
- Publicação: `manifest.remote33.json` preservado; `manifest.json` aponta para remote.33. `version` foi ativado como 0.33 no commit `e62ce6e`, depois do manifesto/checkpoint.


## Checkpoint remote.34
- Escopo: navegação por direcionais, retomada real de progresso e retorno visual de filme/série. Módulos novos: `xtream-ui-v34.js` e `xtream-vod-player-v34.js`; engines, firmware, decoder, YouTube, Player 2 e fei-config não foram alterados.
- Navegação: Continuar/Favoritos não tinham rota de ↓ a partir do cabeçalho; cards especiais dependiam da heurística espacial do WebKit; redraw de Séries/Canais focava sempre Filmes. Agora o grafo é explícito: primeira categoria/topo do conteúdo ↑ -> cabeçalho; cabeçalho ↓ -> categoria/aba ativa; categoria/aba → -> conteúdo. Live, biblioteca e telas especiais seguem a mesma regra.
- Callbacks de carregamento de série em Continuar/Favoritos usam `specialReq34`; resposta atrasada é descartada se a tela mudou/fechou.
- Continuar: filme usa `resumeAt=pos`; série resolve `episode_id` salvo e usa `resumeAt=pos`, sem confirmação. Fora de Continuar, filme/episódio com progresso >=5 s mostra Sim/Não; Sim retoma, Não inicia em 0.
- VOD: resume só conclui quando a posição observada chega ao alvo. Seek recusado é repetido; `playByTime=-1` não conta como sucesso. Enquanto resume está pendente/falhou, progresso antigo não é sobrescrito por reprodução temporária a partir do início. Seek manual assume prioridade.
- Retorno visual: filme/episódio apenas ocultam a UI existente durante playback; ao sair, o mesmo DOM reaparece. Fila de imagens pausa/recomeça sem reconstruir cards. URLs de background/logo/poster têm cache leve `xtream.art.urls.v34`, limitado a 30 registros de strings.
- Verificação executada: parsing/ES5 PASS; harness de foco PASS; VOD resume imediato PASS; duas tentativas ignoradas + terceira aceita PASS; progresso antigo preservado durante resume não confirmado PASS. `tests/remote34.test.cjs` cobre também Sim/Não, `episode_id` salvo e DOM preservado.
- Limite: clone local sem DNS; jsdom/acorn/Playwright ausentes, logo suites completas não foram executadas. TV/decoder físico não testados.
- Artefatos: UI 61041 bytes / SHA-256 `109c3ee08520e9246c07af0dd622cc0892fa0976a2dd8ebb3406be91d6f069b8`; VOD 32526 bytes / SHA-256 `ce99a8073e7eda2c278ce8508291b769569e4f8c9dad5747a488f5fe395e9868`.
- Relatório: `REMOTE_34_VALIDATION.md`. Publicar `manifest.remote34.json` + `manifest.json`; `version` deve ser 0.34 somente no último commit de ativação.
