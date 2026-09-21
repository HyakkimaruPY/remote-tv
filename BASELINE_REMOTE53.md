# Baseline Remote TV 0.53 — Live estável

Esta release fica registrada como **base de referência para reprodução ao vivo**.

## Identidade congelada

- Release: `2026.09.21-remote.53`
- Versão: `0.53`
- Commit de ativação: `0d6dc398c92cd7cf09c78692284f514238e0a3ab`
- Manifesto arquivado: `manifest.remote53.json`
- Referência preservada: `baseline/remote53-live-stable`

A referência acima deve ser usada como ponto de comparação quando uma atualização futura introduzir regressão em TV ao vivo.

## Estado validado em TV física

### TV ao vivo — baseline aprovada

Na 0.53, a reprodução ao vivo foi relatada como estável em uso real.

Comportamentos que esta baseline resolveu e que devem ser preservados:

- ausência do FPS acelerado;
- ausência dos pequenos travamentos recorrentes observados antes;
- ausência do comportamento de pular trechos da reprodução;
- continuidade estável do stream;
- reprodução sem a regressão de sincronização observada nas releases posteriores à 0.49;
- comportamento geral do live considerado estável para servir de referência futura.

A composição live da 0.53 preserva deliberadamente a lógica da 0.49:

- `apps/player1/app.remote49.js`
- `system/injections/xtream-stream-router-v22.js`
- `system/injections/xtream-ui-v49.js`

Portanto, se uma release futura apresentar regressão no streaming ao vivo, a investigação deve comparar primeiro o caminho live dessa release com esta baseline antes de alterar outras áreas do player.

## VOD — bom estado, inspeção ainda necessária

O VOD da 0.53 pode ser tratado como **aparentemente estável / candidato a baseline**, mas ainda não como referência definitiva.

Estado atual:

- reprodução observada sem problema conhecido novo;
- fluxo de próximo episódio corrigido na 0.53;
- reconexão mais conservadora aplicada;
- progresso e demais contratos preservados.

Ainda falta uma inspeção dedicada de VOD cobrindo pelo menos:

- filme longo;
- episódio completo até `ended`;
- janela dos 120 segundos finais;
- avanço manual para próximo episódio;
- avanço automático;
- retomada de progresso;
- seek;
- pausa/retorno;
- cenário com buffering/reconexão.

Até essa inspeção, usar a 0.53 como referência definitiva para **live** e referência provisória para **VOD**.

## Regra para atualizações futuras

Mudanças futuras não devem substituir esta baseline retroativamente.

Se uma nova release causar regressão de live:

1. comparar com o commit `0d6dc398c92cd7cf09c78692284f514238e0a3ab`;
2. conferir primeiro os três módulos live listados acima;
3. portar somente a menor correção necessária;
4. não reescrever a lógica live estável sem evidência concreta;
5. validar novamente em TV física antes de promover uma nova baseline.

Esta documentação é apenas de referência. Ela não altera `version`, `manifest.json` nem o runtime ativo.
