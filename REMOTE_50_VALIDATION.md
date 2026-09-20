# Remote TV 0.50 — validação

Base remota: `30e0895b982119df2407abc1210dd53a0a0f6f87` (0.49).

## Sintoma e evidência

Os dois vídeos de 20/09/2026 mostram a release 0.49 abrindo o live pelo perfil local `AutoHLS 720p`. O canal permanece aberto, mas o vídeo congela por intervalos e acelera para alcançar o áudio. No preview, a UI mantém o canal selecionado, porém a superfície headless do player está com a classe global oculta.

## Mudanças

- `xtream-stream-router-v23.js`: perfil inicial AutoHLS limitado a 480p para reduzir a carga do decoder; 720p funcional e rota direta foram preservados como fallbacks.
- `app.remote50.js`: pré-buffer nativo limitado a 3,2 s, com liberação de áudio/vídeo após avanço do relógio; HTML5 segura o áudio até a primeira evidência de mídia.
- `app.remote50.js` e `headless-preview-v50.css`: superfícies explícitas de preview (326,84; 954×486) e tela cheia (1280×720), sem reexibir o shell antigo.
- `xtream-ui-v50.js`: log dos perfis corrigido para 480p, 720p e direto; controles de tela cheia da 0.49 preservados.

## Verificação local

- `node --check` nos três módulos JavaScript alterados: PASS.
- `node tests/remote50.test.cjs`: PASS.
- Integridade de bytes/SHA-256 de todos os módulos do manifesto: PASS.
- `node tests/release-gate.test.cjs`: PASS.
- Parse ES5 com Acorn: não executado, dependência indisponível; os módulos de produção mantêm sintaxe ES5 por inspeção e `node --check` não substitui essa validação.

## Validação física pendente

Na Philco: confirmar preview com imagem, entrada em tela cheia, ausência de áudio adiantado/FPS de recuperação, troca de canal e os três botões pelo direcional para cima. Se o perfil 480p falhar antes do primeiro quadro, confirmar no log a tentativa do fallback 720p.
