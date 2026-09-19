# Remote TV 0.38 — estabilidade do TV ao vivo

Base publicada: `aba321d095b70ce97558022d8bffad43617f744a` (Remote TV 0.37). Release: `2026.09.19-remote.38`.

## Sintoma

TV ao vivo apresentando travadas recorrentes em intervalos curtos, aproximadamente a cada 2–5 segundos.

## Causa provável no runtime

Após o player nativo estabilizar, o app mantinha um monitor permanente a cada 1300 ms. Cada ciclo chamava `getPlaybackMode()` e `getCurrentPlayTime()`. Em hardware antigo, consultas nativas frequentes podem disputar o caminho do decoder. Além disso, quando o relógio realmente parava, o monitor apenas registrava `P clock stall`; não havia recuperação automática.

## Mudança

Somente o módulo principal do player muda: `apps/player1/app.remote38.js`.

- monitor pós-start deixa de consultar o player nativo a cada 1,3 s;
- reprodução saudável usa uma amostra de relógio esparsa a cada 6 s;
- `getPlaybackMode()` só é consultado quando duas leituras sugerem congelamento real;
- uma primeira leitura repetida entra em suspeita e recebe confirmação 1,8 s depois;
- se o relógio voltar a avançar, não há restart;
- congelamento confirmado reinicia o mesmo canal/perfil;
- segunda reincidência próxima avança para outro perfil de decoder em vez de reiniciar indefinidamente o mesmo;
- cooldown evita tempestade de restarts;
- após ~30 s estáveis, a contagem de recuperação é zerada;
- troca manual de canal zera o estado de recuperação.

O VOD 0.37, retomada, catálogo, navegação, UI, Xtream e bridge permanecem inalterados.

## Verificação

Branch: `remote38-live-stability`.
GitHub Actions run: `35465596659`.
Resultado: **43 PASS**.

Testes novos:
- monitor saudável faz somente leitura esparsa do relógio e não consulta `getPlaybackMode()`;
- pausa curta que volta a avançar não reinicia decoder;
- relógio congelado confirmado reinicia o canal;
- congelamento repetido troca o perfil de decoder;
- registros de recuperação são enviados ao mesmo caminho `/debug/mark` usado no aparelho.

Módulo final:
- `apps/player1/app.remote38.js`
- bytes UTF-8: `15943`
- SHA-256: `da93439bbc505a09283e55c1fde68aa9fd7271679b5896ec92cc587b41dc440c`

## Teste físico

Depois de receber 0.38, manter um canal ao vivo aberto por alguns minutos. Em condições normais, as travadas periódicas devem reduzir ou desaparecer. Se houver um congelamento real, o log deve mostrar `P clock suspect` e, persistindo, `P live recover 1`. Uma oscilação curta deve aparecer, no máximo, como suspeita seguida de `P clock resume`, sem restart.
