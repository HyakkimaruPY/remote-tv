# Remote TV 0.35 — estabilidade e navegação dos dois players

Base: `584286a9c359e492ff406c702348d8f87b09c0cb` (runtime 0.34). Release: `2026.09.19-remote.35`. Escopo: player comum e M3U bruto; preservar aparência, reprodução e dados do usuário.

## Diagnóstico e mudanças

- **Comum:** `moveCh` reconstruía todo o corpo a cada direção; `moveCat` percorria todos os canais, parava o player e reconstruía a tela. Agora há índice de categorias, foco imediato, atualização da categoria após 160 ms e mudança apenas do painel necessário. Dentro da mesma página, mover foco conserva os mesmos nós e imagens. Entrar nos canais aplica imediatamente a última categoria selecionada.
- **Imagens do comum:** carregamento decorativo passa por fila com uma imagem ativa, espera pelo fim da interação, timeout e descarte na saída. Mudar direção pode suspender a imagem pendente; imagens já carregadas permanecem. Isso não garante preempção do decoder/transporte nativo.
- **Controle local:** `/control/cancel` e `/control/start` usavam XHR síncrono. Agora a fila assíncrona mantém a ordem, descarta intenções antigas e só inicia o nativo após resposta válida. Sair invalida o início pendente, libera o player e aguarda o cancelamento sem bloquear JS; falha/timeout não autoriza início fora de ordem. Chamadas nativas do firmware continuam com sua implementação original.
- **Comum, ciclo de vida:** resposta de `/c` de sessão anterior não reabre nem altera foco; atualização mantém canal selecionado e controle focado; fechamento limpa imagens/log. Respostas antigas de polling do log não criam outro ciclo. Clique em texto/imagem do canal resolve o botão correto.
- **Eventos compartilhados:** filtro de keydown/keypress/keyup/IR atende ambos os players. Deduplica o mesmo comando por dois caminhos; direções diferentes via IR não são descartadas indiscriminadamente. IR percorre os listeners de captura, preservando o Log sobre vídeo.
- **Direcionais:** limites tratados explicitamente, paginação do catálogo conserva coluna e permite subir à página anterior. Cabeçalho de live recolhido retorna aos canais visíveis. Expandir/recolher categorias preserva DOM. Categorias vazias/erro devolvem foco utilizável. OK com controles de tela cheia ocultos revela os controles, sem ativar botão invisível.

Somente três módulos de runtime mudaram: `apps/player1/app.remote35.js`, `system/injections/common-player-ui-v35.js`, `system/injections/xtream-ui-v35.js`. Aliases públicos, ordem/fases do manifesto, engines, política, favoritos e progresso foram preservados. O VOD continua no módulo v34. Não foi necessário consultar o repositório de estudo: os gargalos demonstrados estão nos handlers e no DOM deste repo.

## Mapa dos direcionais

| Tela/foco | ↑ / ↓ | ← / → | OK / Voltar |
|---|---|---|---|
| Comum, categorias | Categoria anterior/seguinte, paginada | Esquerda mantém; direita entra nos canais | OK entra; Voltar fecha comum |
| Comum, canais | Canal anterior/seguinte, páginas de 8 | Esquerda categorias; direita Tela cheia | OK preview; repetir no canal reproduzido pede tela cheia; Voltar categorias |
| Comum, botões | Cima retorna à lista; baixo mantém | Entre Voltar/Tela cheia/Log; esquerda do primeiro retorna à lista | OK aciona; Voltar segue estado da tela |
| Comum, tela cheia | Cima mostra controles; baixo oculta | Navega os controles | OK oculto apenas mostra; Voltar sai da tela cheia |
| Bruto, live | Lista de categorias/canais; topo chega ao cabeçalho | Categorias ↔ canais ↔ controles | Categoria carrega sob demanda; canal preview/tela cheia |
| Bruto, cabeçalho | Baixo retorna ao conteúdo visível da tela | Entre botões, sem sair pelas bordas | OK aciona o botão focado |
| Bruto, catálogo | Linhas de 5; página anterior/seguinte mantém coluna | Entre cards; esquerda da primeira coluna retorna às categorias | OK detalhes; Voltar conforme estado |
| Bruto, episódios | Linhas de 3, páginas de 6; topo inicial volta às ações | Entre episódios; esquerda da primeira coluna volta às temporadas | OK reproduz/retoma; Voltar retorna |
| VOD (preservado) | Cima: botões → progresso; cima no seek cancela | Seek em passos de 1 s; teclas de transporte ±30 s | OK confirma seek; Voltar cancela/retorna conforme modo; HUD 4 s |

## Verificações executadas

### Baseline

`NODE_PATH=/tmp/remote-tv-test/node_modules node tests/remote34.test.cjs`: **21 PASS** antes das mudanças. Isso valida os cenários antigos no host, não a TV.

### Release preparada

`NODE_PATH=/tmp/remote-tv-test/node_modules node tests/remote35.test.cjs`: **37 PASS**. Inclui parsing ES5 (Acorn), os cenários de resume/reconexão/imagens existentes e a cadeia base → comum → bruto. Casos novos: páginas, bordas, duplicação de eventos nas duas ordens, troca rápida de categoria, clique em filho, resposta após fechar, vazio/erro, polling antigo, cancel/start ordenados, start obsoleto, falha local e saída assíncrona.

**Medida objetiva:** sete movimentos consecutivos entre os oito canais da página produziram **zero mutações de filhos da lista**, com preservação dos nós de canal e preview. Não se trata de uma medição de milissegundos/FPS na TV.

`RTV_CHROMIUM=/tmp/remote35-chromium NODE_PATH=/tmp/remote-tv-test/node_modules:$CODEX_PRIMARY_RUNTIME_NODE_MODULES node tests/remote35.browser.cjs`: **8 verificações PASS**, em Chromium headless, viewport 1280×720. Navegação do comum conserva os elementos; controles e canais ficam dentro da tela; raiz do comum permanece transparente; episódios continuam 3×2 (246×138); logo/divisória e rolagem da sexta temporada corretos; detalhe de filme renderizado; saída pelo cabeçalho uma vez; nenhum erro de página. Capturas do comum e da série inspecionadas visualmente; filme verificado pelo teste de renderização.

Dependências instaladas temporariamente fora do repo. O download do browser pelo CDN do Playwright falhou (timeout/502); foi usado o executável do pacote npm `@sparticuz/chromium`, extraído sem alterar permissões do ambiente. Os caminhos de `/tmp` são desta sessão; em outro ambiente, descobrir dependências e executável disponíveis.

Manifesto ativo e `manifest.remote35.json`: mesmos 22 módulos, bytes e SHA-256 calculados sobre arquivos finais. `version` é ativado separadamente, após leitura e comparação do commit remoto de preparação. Não foram incluídos rascunhos cancelados de outra 0.32.

## Limites e confirmação no aparelho

Testes usam API/bridge/player nativo simulados. Chromium não é o WebKit da Philco. Não foi medido FPS, uso real de memória ou tempo de resposta do controle físico; não foi validado streaming no provedor real nem decoder/áudio. A alteração elimina bloqueios/reconstruções demonstráveis no código, mas não permite prometer estabilidade absoluta do firmware.

Após sair e reabrir o app, conferir 0.35 no Log. No aparelho, priorizar: segurar/soltar direcionais nos dois players, trocar canais rapidamente, sair durante carregamento, abrir/fechar tela cheia e Log, reproduzir live e retomar filme/série. Se houver falha, guardar log sanitizado e identificar marcador/download/bridge/app/decoder antes de limpar dados. Releases anteriores foram mantidas; rollback deve seguir o gate documentado em `REMOTE_UPDATE_ARCHITECTURE.md`.
