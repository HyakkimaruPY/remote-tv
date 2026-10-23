# RemoteTV Philco Beta 6.4 — integração modular

Base: Beta 6.3, lançada em 22/10/2026, manifesto original arquivado em `manifest.beta56-6-3.json`. Candidata versionada em `manifest.beta56-6-4.json`. Escopo exclusivo **Philco**. Nada em `Remote TV LG/` foi alterado.

## O que mudou
- A interface Xtream ganhou uma API estrita `window.PhilcoSearchAdapter` de busca e navegação. O motor nativo/VOD, CSS, tema e bridge existentes mantêm os hashes anteriores.
- `philco-search-catalog.beta56-6-4.js` busca **uma categoria por requisição** usando `get_live_streams|get_vod_streams|get_series&category_id`, sem consulta global, limite de 60 resultados e janela de 60 s; cancelar aborta o `RequestScope` e invalida os callbacks.
- `philco-search.beta56-6-4.js` fornece botão vermelho (código 403, sujeito a validação IR no hardware), teclado virtual, 2 colunas, até 6 linhas visíveis por coluna, paginação via área rolável, foco direcional, volta e QR temporário se houver relay.
- Resultados de canais: a categoria correta é reaberta e o canal selecionado na UI nativa existente; filmes/séries usam `item()` original e, ao sair de detalhes/playback iniciado na busca, voltam ao feed.
- O gerenciamento de bibliotecas da 6.3 foi substituído por `philco/bibliotecas/manager.beta56-6-4.js`, registrando submódulos versionados. Rede/HTTPS continuam manuais, watchdog é passivo e busca exige reiniciar o player para ativação persistente.
- Núcleo WASM genuíno compilado de `nucleo-wasm/src/core.c` para `dist/core.wasm`, com exportações `classify` e `quality`. O gerente embute os **mesmos bytes** para instalação via manifesto JS. O suporte a WASM é detectado em execução; quando ausente, o fallback ES5 fornece a mesma classificação, sem alterar a reprodução.

## Pareamento do smartphone
O navegador antigo **não pode abrir servidor HTTP na LAN**. O QR depende de um serviço externo à TV, cujo código está em `philco/bibliotecas/teclado-remoto/server.cjs` e precisa estar realmente executando. Não existe servidor automático oculto ou endpoint nativo novo.

### Iniciar na rede local
Um host Linux/Windows/Termux na mesma rede precisa executar Node 18+ e aceitar conexões TCP vindas da TV e do smartphone:

```sh
cd philco/bibliotecas/teclado-remoto
PUBLIC_BASE_URL=http://192.168.1.50:8766 HOST=0.0.0.0 PORT=8766 node server.cjs
```

Substituir `192.168.1.50` pelo IP real do host. Para PM2:
```sh
PUBLIC_BASE_URL=http://192.168.1.50:8766 HOST=0.0.0.0 PORT=8766 pm2 start server.cjs --name philco-qr --interpreter node
pm2 save
```
Na busca da Philco, digitar `http://192.168.1.50:8766` no campo Servidor de pareamento usando o teclado da TV, depois selecionar **Gerar QR**. O celular abre o endereço `/phone`, envia o texto e a TV consulta a sessão via bridge `/fetch`. O serviço utiliza IDs aleatórios e tokens independentes de 192 bits, expiração de 5 minutos, tamanho de campo limitado, escopo somente à busca e limitação de requisições. Para usar fora de uma rede confiável, colocar o servidor atrás de TLS/proxy e restringir acesso; URLs temporárias não contêm senhas Xtream.

## O que NÃO foi feito
A atualização atua somente no aplicativo e usa fallback ES5 quando necessário. Não há substituição do player; watchdog mede, não reinicia streams automaticamente.

## Testes e limites
- `tests/beta56-6-4.integration.cjs`: 30 SHA-256 e tamanhos, JavaScript ES5, binário WASM exportado e idêntico ao embutido, módulos desabilitados por padrão, reinício exigido para busca, consulta Xtream limitada por category_id, relay com token incorreto rejeitado.
- `tests/beta56-6.live.cjs` e `tests/beta56-5.live.cjs`: UI candidata com o manifesto Beta 6.4 durante CI.
- `tests/beta56-5.vod.cjs`, `tests/beta56-5.artwork.cjs`: regressões do VOD e capas.
- A confirmação de recepção da atualização, a compatibilidade WASM/IR e a reprodução física de 15–20 minutos continuam exigindo teste na TV, não substituído por CI.

## Referências
- `REMOTE_UPDATE_ARCHITECTURE.md`: manifesto por SHA, staging, fallback, publicação com `version` por último.
- `REMOTE_BETA56_6_3_RECOVERY.md`: 6.3 estável, recuperação dos motores.
- `philco/bibliotecas/SPEC.md`: contrato de módulos.
