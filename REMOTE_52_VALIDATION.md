# Remote TV 0.52 — validação

Base remota: `d4275689cba724c1b32506438d30d7250e3b3453` (0.51).

## Hipótese testada

O parâmetro `maxh` fazia o bridge impor uma transformação de altura ao fluxo ao vivo. A 0.52 remove essa limitação para permitir que a origem entregue sua própria qualidade e características, mantendo o caminho direto como fallback.

## Mudanças

- `xtream-stream-router-v24.js`: rota inicial `AutoHLS` sem `maxh`; não há perfil 480p, 720p ou 1080p forçado.
- `xtream-ui-v52.js`: log identifica `origem adaptável sem maxh` e `direto fallback`.
- Mantidos `app.remote51.js`, sua janela estável de A/V, a superfície de preview e os controles de tela cheia.
- Filmes, séries, progresso e recuperação longa permanecem inalterados.

## Verificação

- Sintaxe Node dos módulos alterados: PASS.
- `node tests/remote52.test.cjs`: PASS.
- Regressões 0.49–0.51: PASS.
- Gate de release e integridade de bytes/SHA-256: PASS.

## TV física

Confirmar versão 0.52 e log `origem adaptável sem maxh`. Comparar início, congelamentos, velocidade aparente e preview com a 0.51.
