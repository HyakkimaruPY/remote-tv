# Remote TV 0.39 — rota estável no live do M3U bruto

Base: `e8aca532c5196236db7522e3dcf42000fcb9be1f` (Remote TV 0.38). Release: `2026.09.19-remote.39`.

## Evidência do aparelho

No M3U bruto, a rota live abria e o bridge continuava recebendo respostas HTTP 200 e dados, mas o decoder alternava entre alguns segundos de imagem, congelamento e parada. A tela do player permanecia visível com `Falha. Abra Log.` mesmo em modo de tela cheia. Os vídeos também mostraram novas sessões/cancelamentos no período da falha.

## Mudança

Somente `apps/player1/app.remote39.js` muda.

- o estágio inicial continua confirmando modo e avanço do relógio antes de liberar áudio/vídeo;
- depois de confirmado, a sessão live fica passiva: sem polling permanente de `getPlaybackMode()` ou `getCurrentPlayTime()`;
- nenhum timer pós-start cancela, reinicia ou troca o perfil do decoder;
- troca de canal, saída, fallback inicial explícito e controles continuam preservados;
- o watchdog HTML5 do VOD 0.37 permanece ativo e não foi alterado;
- UI, M3U comum, catálogo, navegação, favoritos e progresso permanecem inalterados.

A tela intermediária observada não recebeu um remendo visual: ela fica exposta quando a superfície nativa deixa de entregar vídeo. Preservar a sessão do decoder é a correção da causa tratada nesta release.

## Verificação local

`NODE_PATH=/tmp/remote-tv-test/node_modules node tests/remote39.test.cjs`

Resultado: **42 PASS**.

O teste novo estabiliza uma sessão live, avança dois minutos simulados e confirma que não houve nova leitura nativa, novo player, novo `setSingleMedia` ou restart. Os demais casos cobrem ES5, VOD 0.37, retomada, catálogo, direcionais, IR, controles assíncronos, tela cheia e logs.

Módulo final:

- `apps/player1/app.remote39.js`
- bytes UTF-8: `14707`
- SHA-256: `dd1db9fceaeaf75470c6c764badf8167aa4e0082a4b395def06e68096ac74a66`

Limite: o host não reproduz o decoder proprietário da Philco. A permanência real da rota e a superfície de vídeo em tela cheia precisam ser confirmadas no aparelho.

## Teste físico

Fechar e reabrir o app, confirmar versão 0.39 no Log e manter um canal do M3U bruto aberto. Após `P ready`, deve aparecer uma única marca `P live monitor off · rota preservada`; não devem surgir `P clock suspect`, `P live recover` ou novas tentativas sem troca manual de canal.
