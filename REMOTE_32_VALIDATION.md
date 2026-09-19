# Remote TV — validação remote.32

Data: 2026-09-19

## Escopo
- Base preservada: remote.31.
- Módulos novos: `system/injections/xtream-vod-player-v32.js` e `system/injections/xtream-ui-v32.js`.
- Interfaces públicas preservadas: `XTVod29` e `RawM3U`.
- Nenhuma alteração em firmware/flash, decoder, YouTube, Player 2 ou fei-config.

## Navegação e catálogo
- Paginação de categorias de Filmes/Séries deixa de reconstruir todo o painel: somente lista/rodapé de categorias é repintado.
- Retorno da API repinta apenas título/hint/grade do catálogo quando o DOM atual ainda é válido.
- Progresso dos cards usa cache curto do mesmo JSON de localStorage em vez de reler/parsear para cada card.

## Player VOD
- HUD reduzido para 4 segundos.
- Fluxo de seek: ↑ abre controles; ↑ novamente entra na barra; ←/→ move o cursor em passos de 1 segundo; OK confirma; ↑/Voltar cancela sem mover o vídeo principal.
- A prévia usa um elemento de vídeo separado. Durante a seleção, o vídeo principal fica preservado; a troca real de `currentTime` ocorre somente na confirmação.
- Corrigida corrida em que o cursor mudava antes de a prévia receber `loadedmetadata`: o callback atual sempre aplica o último alvo válido.
- Rewind/Fast-forward físicos: códigos 412/417; fallbacks 227/228 e 177/176. Fora do modo de seleção, avançam/voltam 30 s.
- Play 415, Pause 19 e Stop 413/169 também são tratados.
- O cartão de próximo episódio não intercepta mais o primeiro ↑ destinado aos controles.

## Artefatos
- `xtream-vod-player-v32.js`: 31031 bytes; SHA-256 `71dddbb4df95001cb7504172115ea5bf33db914b36cc3b8fe065422c56ae1845`.
- `xtream-ui-v32.js`: 53531 bytes; SHA-256 `c12e12ab030b2ddfa2a66009a9c457f59a2bd0ee531cdb6f7e18fa105688dbad`.
- O cálculo SHA-256 usado nesta sessão foi validado reproduzindo exatamente os hashes e bytes publicados dos dois módulos v31.

## Validação executada nesta sessão
- Sintaxe JavaScript dos dois módulos v32: PASS.
- Harness determinístico do VOD: PASS para cache de progresso, ↑→controles→↑→seek, cursor 1 s sem mover o vídeo principal, prévia separada, OK confirma, ↑ cancela e media keys ±30 s.
- Caso extremo de prévia: movimentos rápidos antes de `loadedmetadata`, seguido de metadata tardia, aplicaram o último alvo (102 s): PASS.
- Harness isolado da UI: passagem de categoria 7→8 chama repintura parcial e não `library()` completo: PASS.
- `tests/remote32.test.cjs` e `tests/remote32.browser.cjs` usam o `app.remote31.js` que permanece ativo no manifesto. A suíte determinística agora inclui casos específicos do seek v32 e da repintura parcial; ambos os arquivos passaram parsing sintático no V8.

## Validação do manifesto ativo
- Todos os módulos não alterados permanecem byte-a-byte representados pelas mesmas entradas de `manifest.remote31.json`.
- `xtream-vod-player-v32.js` e `xtream-ui-v32.js` foram recalculados após publicação e coincidem exatamente com os bytes/SHA-256 do `manifest.json`.
- `manifest.remote32.json` e `manifest.json` são o mesmo snapshot de release `2026.09.19-remote.32`.
- Após a ativação 0.32, os commits adicionais corrigem somente os arquivos de regressão/documentação; nenhum módulo do manifesto ou seu hash foi alterado.

## Limitações
- Os regressions completos com jsdom/Playwright não foram executados nesta sessão porque essas dependências não estavam disponíveis no ambiente do conector. O harness isolado equivalente do VOD foi executado e passou; os arquivos reproduzíveis ficaram corrigidos para execução posterior.
- Não houve acesso físico à TV/decoder nem reprodução real por stream. Em especial, a disponibilidade da prévia em um segundo elemento `video` precisa ser observada na Philco; se o WebKit/decoder impedir dois pipelines simultâneos, o seek e o marcador de tempo continuam funcionais, mas a miniatura pode permanecer oculta.
- Não se presume que uma interrupção em JavaScript cancele trabalho nativo já iniciado pelo bridge.

## Rollback
- remote.31 permanece preservada em `manifest.remote31.json` e nos módulos v31.
- O marcador `version` só deve ser alterado para 0.32 depois de módulos, manifesto arquivado, manifesto ativo, relatório e checkpoint estarem publicados.
