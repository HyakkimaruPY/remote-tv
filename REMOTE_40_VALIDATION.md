# Remote TV 0.40 — YouTube 3 maximizado com fallback

Base: `1dd752f82b1a2e848b5e8ec850a0dbee7f687178` (Remote TV 0.39). Release: `2026.09.20-remote.40`.

## Escopo

Somente o módulo isolado **YouTube 3 teste** muda. Player comum, M3U bruto, VOD, Xtream, YouTube 2, bridge, firmware e dados do usuário permanecem inalterados.

## Mudança

- wrapper fixo em 1280×720, sem margem, borda, arredondamento ou fundo opaco sobre a mídia;
- cabeçalho/status recolhem após 4,2 s e reaparecem ao usar o controle;
- `iframe.onload` deixou de ser tratado como prova de reprodução;
- integração por `postMessage` observa estado do player e erros explícitos;
- fallback ordenado: embed padrão → `youtube-nocookie` → parser remoto já disponível por `YTCore` e bridge `/fetch`;
- a terceira rota reproduz a URL direta em `<video>` maximizado;
- botão **Fallback** permite avançar manualmente e reiniciar o ciclo após falha total;
- OK alterna play/pause; teclas de mídia funcionam; esquerda/direita e códigos físicos equivalentes ajustam 10 s;
- `keydown`, `keypress`, `keyup` e IR são filtrados para uma ação física não executar várias vezes;
- timers e callbacks antigos são invalidados ao trocar de rota ou sair;
- painel de Log continua estreito e não altera os outros players.

## Verificação

`NODE_PATH=/tmp/remote-tv-test/node_modules node tests/youtube3-v40.test.cjs`: **6 PASS**.

Casos: ES5; geometria 1280×720; recolhimento da interface; fallback automático; confirmação de playback; erro explícito; rota remota direta; comandos do controle sem duplicação; saída e timers obsoletos.

`NODE_PATH=/tmp/remote-tv-test/node_modules node tests/remote39.test.cjs`: **42 PASS**.

A tentativa de renderização Chromium não foi executada porque o pacote do navegador não está instalado neste ambiente. O teste de geometria foi executado em DOM, não no WebKit proprietário da TV.

Módulo final:

- `apps/youtube3/probe-v40.js`
- bytes UTF-8: `11238`
- SHA-256: `a56715ec90d7f5d09946c31e8c3a785044451e962183d571d73b104420b1158e`

## Limite físico

Os embeds atuais do YouTube podem exigir recursos JavaScript, TLS, DRM ou codecs ausentes no WebKit antigo. A terceira rota reduz a dependência da interface moderna, mas a decodificação final ainda depende dos formatos entregues ao aparelho. A TV precisa confirmar imagem, áudio e comandos físicos.

## Teste na TV

Fechar e reabrir o app, confirmar versão 0.40 e abrir **YouTube 3 teste**. O Log deve iniciar em `ROTA 1 embed`; erro ou ausência de reprodução avança para `ROTA 2 nocookie` e depois `ROTA 3 remoto`. O botão **Fallback** permite forçar essa troca sem esperar o limite.
