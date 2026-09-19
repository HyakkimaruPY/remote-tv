# Remote TV — validação remote.33

Data: 2026-09-19

## Escopo
- Base: remote.32.
- Único módulo de runtime novo: `system/injections/xtream-ui-v33.js`.
- `xtream-vod-player-v32.js`, player base, decoder, firmware/flash, YouTube, Player 2 e fei-config permanecem inalterados.
- Interfaces públicas `RawM3U` e `XTVod29` permanecem.

## Correção
- O filtro de captura da UI passa a reconhecer também Play/Pause/Stop/Rewind/Fast-forward: 19, 169, 176, 177, 227, 228, 412, 413, 415 e 417.
- Em `keydown`, o evento continua pelo caminho normal do documento.
- Em `irkeypress`, o evento é consumido e reenviado uma única vez para `document.onkeydown`, chegando ao `RawM3U.key` / `XTVod29.key`.
- Repetição de tecla de mídia usa intervalo de 300 ms; setas mantêm os limites da remote.31/32.
- Cancelamento da fila de imagens permanece exclusivo das setas: uma tecla de transporte não aborta imagens nem interfere no transporte do vídeo por efeito colateral.

## Artefato
- `xtream-ui-v33.js`: 53621 bytes; SHA-256 `64909f2a48bb10dbbacaa41e3cfe7505ab041f7cd39f18969a8ada5718e4043d`.

## Validação executada
- Parsing JavaScript: PASS.
- Varredura de sintaxe incompatível com ES5 nas mudanças de produção (arrow, const, let, template literal, optional chaining): PASS.
- Harness isolado de `irkeypress`: código 417 foi roteado exatamente uma vez ao handler VOD: PASS.
- Regressions reproduzíveis: `tests/remote33.test.cjs` e `tests/remote33.browser.cjs`; o primeiro inclui caso específico para 417 e 412 via `irkeypress`.
- Layout, seek selecionável, cache de progresso e repintura parcial continuam herdados da remote.32; nenhum desses módulos foi modificado nesta revisão.

## Limitações
- jsdom/Playwright completos não foram executados no ambiente do conector.
- Não houve acesso físico à Philco; ainda é necessário observar quais códigos o controle real emite e se a prévia de frame em segundo elemento `video` é suportada pelo WebKit/decoder.
- Testes simulados não equivalem à validação de streaming no aparelho.

## Publicação
- Preservar `manifest.remote32.json` e todos os módulos v32.
- Publicar `manifest.remote33.json` e `manifest.json` apontando apenas `xtream-ui` para v33.
- Alterar `version` para 0.33 somente após manifesto, relatório e checkpoint estarem publicados.
