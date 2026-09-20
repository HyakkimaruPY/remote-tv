# RemoteTV 0.41 — validação

Base remota conferida antes da alteração: `main` em `3d8c313`, marcador `version` 0.40 e manifesto `2026.09.20-remote.40`. Nenhum arquivo histórico foi substituído.

## Diagnóstico do start

O manifesto 0.40 baixava, verificava e injetava `rawm3u.remote5.js` (25.232 bytes) antes do app chamar `RemoteTV.ready('player1')`. Esse módulo era depois substituído por `xtream-ui-v36.js`, portanto seu custo de parse no WebKit não participava da interface realmente usada. O mesmo ciclo de aplicação injetava ainda o probe do YouTube 3 (11.238 bytes) sem o usuário abrir a opção. Como o bootstrap aplica os módulos em sequência na thread do navegador, foco e eventos só eram processados depois desse trabalho. O app remoto não instancia `QjyMediaPlayer` no boot; por isso a correlação visual com o player nativo não identifica uma espera explícita no JavaScript. Se a trava persistir na TV após 0.41, o próximo ponto a medir é a fronteira firmware/WebKit/bootstrap.

O bundle declarado caiu de 212.375 para 179.048 bytes (−33.327 bytes, −15,7%). Nos módulos obrigatórios, caiu de 211.895 para 178.568 bytes. O YouTube 3 permanece disponível, mas é buscado, validado por SHA-256, armazenado separadamente e injetado somente no clique.

## Alterações

- `app.remote41.js`: guarda live esparsa a cada 30 s, consultando somente `getPlaybackMode()`. Um estado não normal precisa se repetir após 3,5 s; há cooldown de 20 s, uma tentativa no mesmo perfil e fallback no segundo terminal confirmado. A guarda saudável não lê `getCurrentPlayTime()`.
- `feature-loader-v41.js`: placeholder leve antes do app e carregamento isolado do YouTube 3. A UI Xtream ativa substitui o placeholder durante a fase `post`.
- Catálogo M3U ativo: validado em `xtream-lazy-core-v31.js` com uma única requisição `category_id`, normalização inicial de 10 itens, expansão por página e aborto de categoria obsoleta.
- `rawm3u.remote5.js`: preservado sem alteração para rollback/auditoria e agora exercitado diretamente, sem stub de `RawM3U`, cobrindo configuração, parse M3U, render, reprodução e fechamento. Saiu do manifesto porque era uma implementação duplicada e inativa após a fase `post`.
- `manifest.browser.cjs`: deriva shell, CSS, JSON e scripts do `manifest.json`, confere bytes/SHA-256, foco/ready, geometria 1280×720, ausência de download opcional no start e isolamento do YouTube 3.

## Evidência executada

- `tests/remote41.test.cjs`: **48/48 PASS**. Inclui integridade dos 21 módulos, inicialização na ordem integral do manifesto, cobertura real do raw legado, lazy/cancelamento do catálogo ativo, isolamento do YouTube 3 e recuperação terminal.
- `tests/youtube3-v40.test.cjs`: **6/6 PASS**.
- Todos os módulos ativos e diferidos analisados como ES5.
- `manifest.json` e `manifest.remote41.json` são idênticos e todos os hashes/tamanhos locais conferem.
- `tests/manifest.browser.cjs`: sintaxe validada, mas execução visual com screenshots **não executada** porque não há Playwright/Chromium disponível no ambiente. O teste encerra com erro explícito e aceita `RTV_CHROMIUM`.

## Limites e validação física

Não foram simulados o desempenho do WebKit da Philco PH32C10DSGWVA, o decoder real, o helper local nem streams reais. Na TV, medir separadamente: tempo até o foco responder no menu; abertura do M3U bruto; troca rápida de categorias; canal saudável por mais de 60 s; e falha terminal real. Confirmar que o YouTube 3 só causa rede/parse ao ser aberto. O marcador `version` deve ser atualizado somente depois de os arquivos e o manifesto desta release estarem confirmados no remoto.
