# RemoteTV 0.42 — navegação, logos e seek

Base remota conferida antes da alteração: `main` em `1d61f76231d2b5f2cf36d3814249045b2ada3db7`, `version` 0.41 e manifesto `2026.09.20-remote.41`.

## Causas observadas

- A captura de qualquer direcional chamava `navImgs27()`, que abortava a imagem ativa, removia seu `src` e a recolocava na fila. Navegação contínua reiniciava a mesma logo repetidamente.
- A virada entre páginas de oito canais chamava `liveHub()`, substituindo todo `#r14body`, embora somente os oito botões e o contador precisassem mudar.
- A seleção fina de seek já mantinha as setas pendentes, mas as teclas físicas rewind/forward fora desse modo chamavam `seek()` imediatamente. Portanto havia um caminho manual que movia filme/episódio sem confirmação.
- A prévia usava um segundo vídeo com `preload=metadata`; em WebKit antigo, posicionar `currentTime` enquanto pausado pode não forçar a decodificação do frame.

## Correções

- `xtream-ui-v42.js` mantém a requisição de logo em andamento quando o foco se move, reduz a espera decorativa de 500 ms para 220 ms, prioriza a logo do canal focado e limita a memória de URLs concluídas a 128 entradas.
- A troca de página live atualiza somente `#ch14` e seu contador. Categoria, preview, controles e o contêiner da lista permanecem os mesmos.
- A fila remove referências de nós descartados e evita duplicar a mesma imagem pendente.
- `xtream-vod-player-v42.js` converte rewind/forward em seleção pendente de ±30 s. Setas usam ±1 s; nenhuma dessas entradas muda o vídeo principal antes de OK. Up/Back cancela e restaura a reprodução no ponto confirmado.
- A prévia usa `preload=auto`, posiciona o vídeo secundário, inicia uma reprodução curta para solicitar decodificação e pausa após o frame. O player principal não recebe `currentTime` durante essa etapa.
- Se o engine recusar o seek confirmado, a posição interna não é falsamente atualizada.

## Evidência

- `tests/remote42.test.cjs`: **50/50 PASS**.
- Casos novos: imagem ativa não perde `src` durante navegação; página live preserva `#ch14`; logo concluída retorna imediatamente; filme e episódio mantêm a posição principal até OK; transporte ±30 s também exige OK; cancelamento preserva a posição; prévia solicita decodificação no vídeo separado.
- `tests/youtube3-v40.test.cjs`: **6/6 PASS**.
- Manifesto completo inicializado na ordem declarada, sem erro; 21/21 hashes e tamanhos conferidos; módulos de produção analisados como ES5.
- `git diff --check`: PASS.

## Limites físicos

O host comprova separação lógica entre o vídeo principal e o vídeo de prévia, mas não reproduz a quantidade de decoders do firmware Philco. Na TV, verificar filme e episódio com HTML5 e com fallback nativo. Se o hardware permitir apenas um pipeline simultâneo, a posição continuará protegida até OK, porém o frame secundário poderá continuar indisponível; resolver isso exigiria uma fonte de thumbnails ou capacidade nativa já exposta, não um seek antecipado do vídeo principal.

Também validar toque curto, tecla mantida e IR nos fluxos: cabeçalho → categoria → canais → controles; página 1 → 2 → 1; detalhe de filme; temporadas/episódios; Continuar; abrir/cancelar/confirmar seek. O arquivo `version` deve permanecer 0.41 até os módulos e o manifesto serem confirmados remotamente.
