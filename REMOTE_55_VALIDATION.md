# Remote 0.55 — YouTube Bridge validation

Base de runtime: Remote 0.54, ativada em `8c3cc8c6ebe64fc2d68589b5240d844a406756ad`.

## Objetivo

Transformar o antigo **YouTube 3 teste** em uma camada utilizável no sistema atual da Philco sem colocar o WebKit legado como responsável por decodificar a página moderna do YouTube.

A 0.55 mantém o JavaScript como orquestrador: busca e resolução passam pelo bridge local já existente; quando é obtida uma URL direta de mídia, a reprodução é entregue primeiro ao player nativo da TV.

## Mudança

- Novo `apps/youtube3/probe-v55.js`: interface **YouTube Bridge**, busca, entrada de URL/ID, resultados, navegação por direcionais e Log.
- Descoberta/failover de instâncias públicas para busca e metadados. A última instância funcional fica salva localmente.
- A mídia aceita pelo resolvedor é URL direta de CDN `googlevideo.com`; o vídeo não é retransmitido pelo bridge de metadados.
- Preferência por MP4 até 720p para reduzir incompatibilidade com o decoder antigo.
- Cadeia de playback: player nativo HTTPS → compatibilidade CDN HTTP se o HTTPS nativo não provar reprodução → HTML5 direto → parser local da página `watch` já compatível com `YTCore` → embed oficial como último fallback.
- O fallback HTTP não é usado para metadados e só entra depois de falha da rota direta HTTPS. Ele é intencionalmente uma compatibilidade para TLS legado e não oferece criptografia de transporte.
- Nenhum endpoint nativo novo foi criado; `native_actions` continua fora do escopo.

## Arquivos da release

- `apps/youtube3/probe-v55.js`
  - Git blob: `cf4983f972bd7fa9e1ac793e9fcbcf383628a3d6`
  - SHA-256 do conteúdo validado: `44e627d74a3c86484f6c56a19b707bb509b4e109c2582b8638a1540bb288e798`
- `system/feature-loader-v55.js`
  - Git blob: `834e37fd0fe4a9430299342ff43069a9ee35d647`
  - SHA-256: `dfcd47f3a1e7f05527d77e3fb4bb6aa3a85176ba07ac57e30323d7d11fb7a510`
- `tests/youtube3-v55.test.cjs`
  - Git blob: `a9fb3a1a94b53a201afe241a06e506db07b6125f`
- `manifest.remote55.json` e `manifest.json` estão iguais na preparação; o único módulo de boot alterado em relação à 0.54 é `feature-loader`.

## Verificação executada

- `node --check` passou para probe, loader e teste.
- Varredura de compatibilidade não encontrou `let`, `const` nem arrow functions no código de produção novo.
- Os blobs remotos do probe e do loader foram comparados com o conteúdo validado antes da preparação do manifesto.
- O teste estático cobre os endpoints de busca/vídeo, mídia direta `googlevideo`, player nativo, fallback HTTPS→HTTP, parser `watch` e embed final.
- Durante a preparação, `version` foi mantido em `0.54`; o manifesto 0.55 não foi considerado ativado antes da conferência.

## Limites da validação

- O parser ES5 com Acorn não foi executado porque a dependência não está disponível neste ambiente.
- A suíte completa não foi executada a partir de um checkout do repositório porque este container não possui acesso DNS ao GitHub.
- Reprodução e decoder continuam pendentes de validação física na TV.
- Disponibilidade de instâncias públicas do resolvedor é externa ao projeto; há failover, mas não há garantia de uptime.

## Aceitação na TV

1. Confirmar Remote `0.55` no Log depois de reabrir completamente o player.
2. Abrir **YouTube Bridge** e usar **Teste**, uma busca ou uma URL de vídeo.
3. Validar direcionais, Voltar, Log e teclas de transporte.
4. Em reprodução bem-sucedida, procurar no Log por `API OK`, `RESOLVER direto` e `NATIVE confirmado`. Em TV com TLS incompatível, pode aparecer `CDN fallback HTTPS→HTTP`.
5. Se todas as rotas diretas falharem, registrar as últimas linhas `YT55` antes do fallback de embed.

GitHub atualizado não prova propagação de cache nem funcionamento no decoder físico; essa última etapa depende do teste na Philco.
