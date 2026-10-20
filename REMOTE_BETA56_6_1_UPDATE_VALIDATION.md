# Philco Remote TV — Beta 6.1: versão efetiva e atualização sem apagar cache

Data: 20/10/2026. Escopo único: Philco PH32C10DSGWVA, WebKit legado. Não alterar `Remote TV LG/`, firmware, players externos ou provedores.

## Incidente confirmado

O usuário relatou que a TV ainda mostrava Beta 5 mesmo depois da ativação remota de Beta 6 e do botão Atualizar. O repositório remoto tinha `version=0.56-beta.6` e `manifest.version=0.56-beta.6` (22 módulos com hashes válidos, GitHub Actions verde), mas o *shell* ainda declarado pelo manifesto era `apps/player1/shell.beta56-5.html`, com **título HTML fixo** `Smart · Beta 0.56.5`.

Logo, a tela podia indicar Beta 5 até quando o runtime era Beta 6. O relato isolado **não prova** que o código Beta 6 tinha sido rejeitado pelo bootstrap. O campo `remoteTV.xtreamUI` do módulo de UI novo também ainda declarava `0.56-beta.5`, criando outra ambiguidade diagnóstica. O botão `force-update.beta56-3.js` apagava `remote-tv.active.v2` e `remote-tv.staging.v2` antes de tentar recarregar, assumindo desnecessariamente o risco de perder a cópia ativa se o download falhasse.

A inspeção do bootstrap histórico `b` (bootstrap 2; **não** atribuir ao firmware atual sem evidência) mostra que a sincronização pode salvar o novo bundle para o próximo boot sem aplicá-lo imediatamente. A arquitetura documentada do bootstrap mais novo compara `version`/release e faz validação de módulos antes de promover. Reutilizar a mesma versão/remoto sem alterar identificador de release poderia reter o cache atual. **Não há telemetria da TV física** que permita afirmar se houve falha no download, cache de CDN ou apenas no texto do título.

## Reparos incluídos

1. **Shell versionado**: `apps/player1/shell.beta56-6-1.html`. Substitui apenas o `h1` estático por `rtvVersionTitle`, com texto inicial neutro. Nenhuma mudança no layout restante.
2. **Identificação dinâmica**: `system/readable/force-update.beta56-6-1.js` lê `RemoteTV.release` que o bootstrap aplicou e calcula `Smart · Beta 0.56.6.1`; não lê a versão publicada como prova de aplicação. Fallback neutro se a informação não existir.
3. **Forçar atualização não destrutivo**: botão chama `RemoteTV.sync(false)` se presente, monitora `remote-tv.active.v2` até a release salva diferir da executada, então recarrega. Nunca limpa active, previous nem staging antes da validação. Erro, falta de API ou timeout deixam a versão anterior preservada e exibem diagnóstico. Limite de espera de 120 s, com atualização de status. Mantém o alias `forceUpdate53`.
4. **UI**: `system/readable/xtream-ui.beta56-6-1.js` preserva o recovery beta6 e corrige somente o identificador do módulo `remoteTV.xtreamUI = '0.56-beta.6.1'`.
5. **Versão única de entrega**: `0.56-beta.6.1`, release `2026.10.20-beta.56.6.1`; `manifest.beta56-6-1.json` é o arquivo de auditoria; 22 módulos mantidos.
6. **Testes**: `tests/beta56-6-1.update.cjs` testa título efetivo, sync/reload após bundle novo, preservação em erro e API ausente, além da distinção Beta 5/Beta 6.1. `tests/beta56-6.live.cjs` passa a carregar o módulo ativo indicado pelo manifesto (mesma engine/reconexão).

## SHA-256 e bytes dos módulos modificados

| ID | Caminho | Bytes | SHA-256 |
|---|---|---:|---|
| shell | `apps/player1/shell.beta56-6-1.html` | 1218 | `82ab5c60c9365d3c8be6dac5580b9924305f0d548b78e169c8be1b2afe273cac` |
| xtream-ui | `system/readable/xtream-ui.beta56-6-1.js` | 126467 | `ec496eaab452070c2ce7dc5373db60a30b981239daa621693025161c20f4ff7e` |
| force-update | `system/readable/force-update.beta56-6-1.js` | 4370 | `48ccce5839505e2082a15ac980a844c64d9a0234f40a6830b245396132ccbfe9` |

## CI e publicação

Workflow `philco-beta6.yml`, execução [39425965686](https://github.com/HyakkimaruPY/remote-tv/actions/runs/39425965686) em `5757f1c49dab4e881e86ceee5ccd5be9eb4e85cd`: **SUCCESS**.
- Verificação de hashes e bytes dos **22** módulos, e equivalência com manifesto arquivado.
- Teste da UI dinâmica e força de atualização; teste da reconexão beta6; teste ES5 com Acorn.
- Regressões de LIVE, VOD e artwork/capas da Beta 5.
- Rodadas intermediárias falharam por inconsistências do simulador VM/cópia ativa; corrigidas antes do resultado verde. Não foram tratadas como aprovação parcial.

Para a ativação: o marcador `version` deve continuar `0.56-beta.6` enquanto os módulos e o manifesto são conferidos; só depois deve ser alterado em commit separado para `0.56-beta.6.1`. Não há alteração de código da LG.

## Aceitação real pendente

Após reabrir completamente Player 1, conferir o título **Beta 0.56.6.1**. Ele reflete a release realmente aplicada. Se continuar **Beta 0.56.5**, ainda não há evidência de que o bootstrap tenha baixado/promovido a revisão. Nesse caso, solicitar foto dos logs do bootstrap `remote-tv.netlog.v1`, incluindo `lastError`, `RemoteTV.mode`, `RemoteTV.release`, e não limpar armazenamento/favoritos. Reprodução prolongada e correção definitiva das falhas de stream seguem pendentes de teste na TV.

O CI verifica código e fluxo simulado; não pode alcançar a TV nem atestar propagação instantânea de CDN/cache.
