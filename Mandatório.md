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
