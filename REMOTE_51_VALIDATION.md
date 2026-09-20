# Remote TV 0.51 — validação

Base remota: `8e95a3fc5db73284dd25c30b00b1efb5083d4451` (0.50).

## Correção da hipótese

Filmes e séries reproduzem com qualidade normal, portanto reduzir o live para 480p não isola a causa observada. A comparação com a 0.31 mostrou que ela usava o mesmo AutoHLS 720p, mas aguardava uma janela estável do relógio antes de revelar vídeo e áudio. A aceitação imediata de `playFromStart()` apareceu posteriormente no caminho exclusivo do live.

## Mudanças

- Restaura `xtream-stream-router-v22.js`: AutoHLS 720p volta a ser o perfil inicial; 1080p e direto permanecem como fallbacks.
- `app.remote51.js`: mantém o transporte aceito, mas segura áudio e superfície por pelo menos 4,2 s de relógio recente e progressivo; limite normal de 6,8 s e compatibilidade eventless em 12 s, sem destruir a rota aceita.
- Mantém a superfície de preview/tela cheia introduzida na 0.50 e os controles headless da 0.49.
- VOD de filmes e episódios permanece nos módulos da 0.49, sem alteração.

## Verificação

- `node --check` nos módulos novos: PASS.
- `node tests/remote51.test.cjs`: PASS.
- Regressões 0.49 e 0.50: PASS.
- Gate de release e integridade de bytes/SHA-256: PASS.

## TV física

Confirmar versão 0.51, log `perfil 720p estável`, imagem no preview e início do live sem áudio adiantado nem sequência visível de recuperação acelerada. A validação física continua necessária para medir congelamentos posteriores do decoder.
