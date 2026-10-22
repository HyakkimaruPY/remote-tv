# Integração Philco Beta 6.4 — estado de produção

Todos os arquivos ativos e a ordem são definidos pelo `manifest.beta56-6-4.json` e por `manifest.json` quando a release é publicada. Não inserir tags de script duplicadas manualmente.

## Ordem de inicialização
1. Core Xtream original, VOD, UI e skin existentes; UI 6.4 adiciona somente `PhilcoSearchAdapter`.
2. `philco-search-catalog.beta56-6-4.js`: transporte isolado e categoria específica.
3. `vendor/qrcode.js`: gerador MIT ES5 (carregado antes de a interface ser aberta).
4. `philco-search.beta56-6-4.js`: interface de busca, QR opcional e captura da tecla vermelha.
5. `manager.beta56-6-4.js`: painel acessível pelo botão Bibliotecas do shell existente; instância WASM compilada em C com fallback ES5.
6. Bibliotecas individuais `diagnostico`, `estabilidade`, `rede-ssl`, `busca-contextual`, cada uma se registra no gerenciador.

A busca vem **desativada**, e alterações de busca só são aplicadas depois do botão **Reiniciar motores**. Diagnósticos isolados ativam/desativam imediatamente. Nenhum módulo busca ou altera playlist no boot.

## Integração com canais
`PhilcoSearchAdapter.currentCategory()` usa a categoria/tipo atual. `search(type,query,callback)` faz consultas sob escopo independente, canceláveis. `open(type,item)` usa `loadLiveCategory`/ `chooseLive` para canais e `item` para detalhes VOD. `back` restaura feed inicial para item aberto pela busca. O botão vermelho só funciona enquanto `viewState.on` e `search` habilitada no boot.

## Precauções
Nunca executar `get_*_streams` sem `category_id`; não apagar `remote-tv.active.v2`, `previous`, favoritos, histórico ou credenciais. Não alterar `Remote TV LG`. Uma falha no carregador opcional deve deixar o player intacto.

## QR
`teclado-remoto/server.cjs` é infraestrutura separada e precisa de Node 18+ numa máquina alcançável pela TV. O helper 127.0.0.1:8765 permite encaminhar consultas HTTP mas **não** aceita requisições do celular diretamente. Consulte `REMOTE_BETA56_6_4_VALIDATION.md` para comandos e limites.
