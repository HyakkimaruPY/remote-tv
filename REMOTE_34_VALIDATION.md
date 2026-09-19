# Remote TV — validação remote.34

Data: 2026-09-19

## Escopo
- Base preservada: remote.33.
- Módulos novos: `system/injections/xtream-ui-v34.js` e `system/injections/xtream-vod-player-v34.js`.
- Interfaces públicas preservadas: `RawM3U` e `XTVod29`.
- Nenhuma alteração em firmware/flash, decoder, YouTube, Player 2, fei-config ou engine de streaming.

## Navegação determinística
- Corrigida a raiz do foco preso em Continuar/Favoritos: `headMove` não possuía caminho de ↓ para essas telas.
- Corrigido o redraw de abas especiais que sempre devolvia foco para Filmes, mesmo quando Séries/Canais era a aba ativa.
- Regra aplicada:
  - primeira categoria + ↑ -> cabeçalho;
  - topo da grade/catálogo + ↑ -> cabeçalho;
  - cabeçalho + ↓ -> categoria/aba ativa;
  - categoria/aba + → -> conteúdo;
  - cards de Continuar/Favoritos usam navegação explícita 5 colunas, sem depender da heurística espacial do WebKit.
- Topo da lista de canais ao vivo também retorna ao cabeçalho.
- Botões do detalhe de filme passam a ter ←/→ explícitos.
- Callbacks atrasados de Séries em Continuar/Favoritos possuem token e são descartados se a tela tiver mudado/fechado.

## Continuar assistindo / progresso
- Dentro de Continuar assistindo:
  - filme abre automaticamente com `resumeAt=pos`;
  - série resolve o `episode_id` salvo e abre esse episódio com `resumeAt=pos`;
  - não há diálogo de confirmação.
- Fora de Continuar, quando o filme/episódio possui progresso >= 5 s, aparece:
  - “Você quer continuar de onde você parou?”
  - “Sim, continuar” -> passa a posição salva;
  - “Não, do início” -> `resumeAt=0`.
- A lógica VOD deixa de considerar a retomada concluída apenas porque chamou seek.
- A posição precisa ser observada perto do ponto salvo; se o seek ainda não foi aceito, novas tentativas são feitas com intervalo.
- `playByTime` nativo retornando -1 é tratado como falha e pode ser tentado novamente.
- Enquanto a retomada ainda não foi confirmada, `writeState` não sobrescreve o progresso anterior com segundos reproduzidos a partir do zero.
- Seek manual do usuário cancela a retomada automática pendente.

## Retorno visual e cache
- Ao iniciar filme/episódio, a tela de detalhe não é destruída.
- A fila de imagens é pausada; a imagem em andamento volta para a fila sem apagar o restante.
- Ao sair do player, a mesma árvore DOM é exibida novamente: fundo, logo e thumbnails carregados continuam nos mesmos nós.
- URLs de arte (background, logo e poster) possuem cache leve em `localStorage` (`xtream.art.urls.v34`), limitado a 30 registros.
- O cache guarda somente strings/URLs, não bitmaps decodificados, evitando pressionar memória da TV.

## Artefatos
- `xtream-ui-v34.js`: 61041 bytes; SHA-256 `109c3ee08520e9246c07af0dd622cc0892fa0976a2dd8ebb3406be91d6f069b8`.
- `xtream-vod-player-v34.js`: 32526 bytes; SHA-256 `ce99a8073e7eda2c278ce8508291b769569e4f8c9dad5747a488f5fe395e9868`.

## Validação executada
- Parsing JavaScript dos dois módulos: PASS.
- Varredura das mudanças de produção para arrow functions, const/let, template literals e optional chaining: PASS (compatibilidade ES5 preservada).
- Harness de foco isolado: PASS para cabeçalho ↓ -> aba selecionada, card superior ↑ -> cabeçalho e movimento entre linhas.
- Harness VOD:
  - resume imediato em 120 s: PASS;
  - duas tentativas de seek ignoradas e terceira aceita: PASS; só então `resumeDone=1`;
  - progresso anterior de 145 s preservado ao sair enquanto resume não foi confirmado: PASS.
- Regressions reproduzíveis adicionados em `tests/remote34.test.cjs` e `tests/remote34.browser.cjs`, incluindo Sim/Não, episódio salvo da série, foco de Continuar e preservação do DOM.
- O clone local falhou por DNS externo indisponível e o ambiente não possui jsdom/acorn/Playwright; portanto as suítes completas não foram executadas nesta sessão.

## Limitações / teste físico
- Não houve acesso físico à Philco nem stream real.
- Observar especialmente repetição/IR do controle, tempo até resume no decoder nativo e a prévia de frame do seek v32.
- Testes simulados não equivalem a validação do WebKit/decoder do aparelho.

## Rollback
- remote.33 permanece preservada em `manifest.remote33.json`, `xtream-ui-v33.js` e `xtream-vod-player-v32.js`.
- `version` só deve mudar para 0.34 depois de relatório, checkpoint, manifesto arquivado e manifesto ativo.
