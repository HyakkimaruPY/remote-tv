# Remote TV 0.37 — recuperação de stream prolongado e retomada pré-play

Base publicada: `e290bde7708449641bb80ef057f1587a4b747db7` (Remote TV 0.36). Release: `2026.09.19-remote.37`.

## Evidência observada no aparelho

Em reprodução prolongada de episódio/filme pelo AutoVOD progressivo, o bridge registrou resposta HTTP 206 com `unexpected EOF`. Ao mesmo tempo, o heartbeat manteve `ready=4`, `net=2`, `stalls=0` e `reconnects=0`, mas a posição deixou de avançar. O valor de `ahead` continuou muito alto. Nesse estado o watchdog antigo não reconectava porque exigia relógio parado **e** buffer abaixo de 0,9 s.

Também foi relatado que uma retomada com progresso salvo iniciava a reprodução em 0 antes de aplicar o seek, permitindo que uma falha desse fluxo deixasse o episódio rodando desde o começo.

## Mudanças

Somente o módulo VOD muda no runtime: `system/injections/xtream-vod-player-v37.js`.

- watchdog considera a **posição real congelada** como sinal suficiente de falha em HTML5 progressivo; não depende mais de buffer baixo;
- após aproximadamente 6 s sem avanço real, estando em reprodução e fora de pause/seek, inicia reconexão a partir da posição corrente;
- se `seeking` ficar preso no WebKit, há escape adicional após 12 s;
- `waiting/stalled` só é considerado recuperado quando o relógio volta a avançar; `readyState` alto ou buffer grande sozinhos não mascaram mais o travamento;
- a reconexão não é declarada bem-sucedida apenas por `readyState`; precisa de `onplaying` ou avanço de relógio;
- retomada com progresso >= 5 s usa gate pré-play: o vídeo fica oculto e `play()` só é liberado depois do seek salvo ser aplicado/confirmado;
- se a retomada não puder ser confirmada, o início em zero é bloqueado e o progresso salvo é preservado, em vez de cair automaticamente para reprodução do começo;
- progresso não é sobrescrito enquanto a retomada estiver pendente.

A alteração se aplica ao pipeline AutoVOD HTML5 progressivo usado por filmes e episódios/séries, que é o caminho demonstrado pelos logs. HLS.js mantém seu mecanismo próprio de retry; o player nativo de live não foi alterado porque alguns streams ao vivo não expõem relógio crescente confiável e usar o mesmo critério poderia causar reconexões falsas.

## Verificação

Branch: `remote37-stream-recovery`.
GitHub Actions run: `35463815815`.
Resultado: **41 PASS**.

Regressões novas:
- relógio progressivo congelado força reconexão mesmo com buffer reportado muito grande;
- retomada não executa `play()` antes do metadata/seek;
- retomada confirmada inicia diretamente do ponto salvo;
- falha de retomada não inicia do zero e mantém o progresso.

A suíte também preserva os testes anteriores de ES5, Continue, paginação, seek manual, reconexão limitada, navegação, IR, player comum, catálogo bruto e callbacks obsoletos.

Módulo final:
- path: `system/injections/xtream-vod-player-v37.js`
- bytes UTF-8: `34187`
- SHA-256: `1f0e4374cdeb236066a55331d4968f308f2cf9ae909cf2fa550260d16a27d120`

## Confirmação física sugerida

Após receber 0.37, testar um episódio com progresso salvo para confirmar que não há reprodução visível em 0 antes do salto. Em reprodução longa, se ocorrer novamente um EOF parcial, o Log do AutoVOD deve passar de HEARTBEAT congelado para `RECONNECT 1` automaticamente e continuar a partir da posição corrente.
