# RemoteTV 0.43 — estabilidade live e ciclo do log

Base ativa conferida antes da alteração: `d9936dc652dcda8b055f872e14c6bcafc467f173`, `version=0.42`, release `2026.09.20-remote.42`.

## Sintomas-alvo

- TV ao vivo/M3U bruto podia reproduzir alguns segundos, interromper, retomar e depois parar definitivamente.
- O log aberto no live podia continuar visível ao entrar em VOD, mantendo também sua camada escura sobre o vídeo.

## Evidência da regressão

A comparação dirigida com a base 0.31/0.32 mostrou uma diferença importante no player nativo: `app.remote31.js` apenas observava modo e relógio após o início. O `app.remote41.js`, ainda ativo na 0.42, passou a tratar dois estados consecutivos considerados não normais como falha terminal e reiniciar o player. Um estado transitório de buffering podia, portanto, disparar recuperação de transporte sem comprovação de término.

Na UI 0.42, o fallback externo de rota era ainda uma leitura única do texto de status após 12,5 s. Isso podia perder uma falha tardia ou reagir a estado textual sem vínculo com o término real da sessão.

O overlay de log tinha apenas `toggle()`: não havia fechamento idempotente que abortasse a leitura XHR pendente e invalidasse uma resposta tardia.

## Correções

### `apps/player1/app.remote43.js`

- Remove a recuperação pós-start baseada somente em modo.
- Mantém observação de modo e relógio, próxima do comportamento passivo da 0.31.
- Buffering transitório não reinicia a sessão.
- A falha final pós-start exige evidência combinada: relógio já observado, relógio sem avançar por pelo menos 12 s e modo não normal pelo mesmo intervalo.
- Esgotamento das rotas internas também emite falha final.
- `RawPlayer.play(..., failCb)` expõe uma notificação final de uso único; `close()` invalida esse callback antes de encerrar.

### `system/injections/xtream-ui-v43.js`

- Remove o polling único de 12,5 s para decidir fallback.
- O próximo perfil/rota live só é iniciado quando o player notifica uma falha final.
- O callback valida `liveToken`, sessão e view antes de agir; sair ou trocar de canal invalida recuperação antiga.
- Entrar em Filmes, Séries, Continuar, Favoritos ou iniciar filme/episódio fecha explicitamente o overlay live.

### `system/injections/live-log-overlay-v43.js`

- Adiciona `close()` idempotente.
- Cancela timer e XHR de leitura ainda pendentes.
- Usa geração/token para descartar callback antigo após fechamento.
- Mantém aliases `RTVLiveLog29` e `RTVLiveLog24` para compatibilidade.

## Evidência executada nesta preparação

- Parse dos três módulos de produção com o engine JavaScript do host: PASS.
- Trechos introduzidos conferidos sem `let`, `const` ou arrow function; a base da 0.42 já havia sido validada para ES5.
- Validação focada diretamente sobre os arquivos relidos do GitHub: 9/9 checks PASS:
  - recuperação agressiva antiga ausente;
  - gate modo + relógio presente;
  - sinal final de uso único presente;
  - UI recebe callback final;
  - polling de 12,5 s removido;
  - fechamento do log nos fluxos não-live;
  - abort de XHR;
  - geração contra resposta tardia;
  - API pública de `close()`.
- Integridade do manifesto proposto: 21/21 módulos conferidos em bytes e SHA-256 diretamente do remoto.
- `tests/remote43.test.cjs` foi publicado como regressão focada, mas não foi executado pelo Node neste ambiente porque o container não consegue resolver o host do GitHub para obter a árvore do repositório. Não há PASS de jsdom/Playwright reivindicado para a 0.43.

Hashes dos módulos alterados:

- `apps/player1/app.remote43.js`: 16040 bytes — `78d9ff13bfe25681875b3eb40ab1b12918de29acfdeefabddd91f6cf56bfdd73`
- `system/injections/xtream-ui-v43.js`: 64885 bytes — `ae4b9ea76502c983207985643a07ee4a0f48b447773b7ce3154a6702d5128d02`
- `system/injections/live-log-overlay-v43.js`: 3690 bytes — `1bad886cfcaeb68287feb3ef876e6f9f965728aa62b83f3cdf0830778f8563bf`

## Validação física pendente

A TV/decoder continua sendo a evidência decisiva para transporte real. Após ativação, verificar:

1. Canal Vivo por pelo menos 1–2 minutos: buffering curto não deve recriar a sessão.
2. Uma pausa transitória deve poder retomar na mesma rota.
3. Uma falha realmente persistente deve, após confirmação por modo + relógio, avançar ao fallback.
4. Abrir Log no live, entrar em Filmes e reproduzir um VOD: overlay e camada preta não devem permanecer.
5. Repetir live → episódio.
6. Sair/trocar de canal enquanto uma falha está em confirmação: callback antigo não deve iniciar outra rota.

O arquivo `version` deve permanecer em 0.42 até manifesto ativo, relatório e integridade remota serem reconferidos.
