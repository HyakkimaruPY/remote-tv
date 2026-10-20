# Philco Remote TV — 0.56-beta.6: recuperação de canal ao vivo

Data: 20/10/2026. Alvo exclusivo: Philco PH32C10DSGWVA (WebKit legado). **Não modificar** a pasta `Remote TV LG/`, a versão RG, firmware, player nativo, Player 2, VOD ou configuração externa.

## Base e evidência

Base pública anterior: `0.56-beta.5` (`2026.10.19-beta.56.5`); fonte ativa do Player 1 declarada pelo `manifest.json`. Referência comparativa de live estável: `baseline/remote53-live-stable`, que permanece imutável.

Foto e vídeo enviados pelo usuário mostram interrupção após reprodução prolongada, com:
- múltiplos `NETERR` / `DNSERR` para host de inserção de anúncios da playlist HLS; a tentativa DoH `dns.google/resolve` devolveu conexão de rede inacessível;
- `HLSERR` posterior, seguido de `H media error · awaiting recovery`;
- `H route failure error-before-frame` e `P final rotas internas esgotadas`;
- `TS 200`, transferência parcial de bytes e `context canceled` no loopback do bridge.

**Interpretação:** a rede e/ou a origem da playlist/segmentos entrou em falha. O cancelamento da leitura no bridge também pode ser consequência da troca de rota; não permite atribuir sozinho a causa. O código UI Beta 5 tentava a próxima URL apenas até a última rota, quando encerrava a reprodução sem programar uma nova tentativa da mesma fonte. O caso de `idx >= routes.length` não era chamado pelo callback terminal anterior e, portanto, não reabria a fonte.

A Beta 6 corrige esse mecanismo de recuperação **no orquestrador remoto**, sem alegar resolver a indisponibilidade do DNS do ISP/bridge ou bugs de decoder nativo, que exigem evidência independente.

## Correção cirúrgica

- Novo `system/readable/xtream-ui.beta56-6.js` baseado byte a byte na UI Beta 5, exceto tratamento do retry live.
- Ao esgotar todas as rotas de um canal, o callback terminal alcança a rotina de recuperação do mesmo canal, respeitando a lista de fontes existente. Três novas tentativas totais, com espera escalonada de **3, 10 e 25 segundos**; depois disso, o aplicativo informa a falha e permite ao usuário selecionar o canal novamente.
- A janela de tentativas reinicia apenas quando há mais de cinco minutos entre as falhas finais, ou quando o usuário escolhe um novo canal; não há loop agressivo sem limite.
- Token de geração, identidade do canal, view `live`, sessão ativa e flag `_playing` impedem que timer/callback atrasado reabra a mídia após Voltar, mudança de canal ou saída do app.
- `stopLive()`, `chooseLive()` e abertura de canal favorito cancelam timers pendentes e reinicializam o contador.
- Preservados motores Native/HTML, perfis 720p/1080p/direto, HLS, URLs assinadas, UI, favoritos, progresso, capas, controles, VOD, características de 0.53 e política do bridge. Nenhum bypass de anúncio, DNS/DRM ou nova API nativa foi instalado.
- Logs `LIVE56` registram decisões e tentativas sem adicionar URL bruta ou segredos.

## Publicação e integridade

- Módulo: `system/readable/xtream-ui.beta56-6.js`
- Tamanho: **126465 bytes** (UTF-8).
- SHA-256: `a0b90f8ed92881a34400f7e456f2dafe0fcc5a9d38adf6b5ef05a45bb4b10e5a`
- Manifesto arquivado: `manifest.beta56-6.json`.
- Manifesto ativo: release `2026.10.20-beta.56.6`, versão `0.56-beta.6`, mesmo número de módulos (**22**).
- `version` é publicado por último, em commit separado, depois da validação remota.

## Testes executados

GitHub Actions: [Validate Philco Beta 6 — execução #1](https://github.com/HyakkimaruPY/remote-tv/actions/runs/39420891065), conclusão **success**:
- Integridade de todos os 22 arquivos manifestados por bytes e SHA-256.
- `node tests/beta56-6.live.cjs`: **6 cenários PASS**: chegada ao callback terminal, mesmas fontes, backoff, teto, troca de canal, saída, callback atrasado e reinício manual.
- `node tests/beta56-5.live.cjs`: **17 PASS**, inclusive parse ES5 do manifesto atual.
- `node tests/beta56-5.vod.cjs`: 10 cenários de VOD, sem regressões.
- `node tests/beta56-5.artwork.cjs`: cenários de capas e logos, sem regressões.
- `node --check` no módulo novo.
- O workflow utiliza Node, jsdom e mocks: **não** reproduz o kernel/decoder/Go bridge do aparelho. Não foi executada sessão de várias horas na TV física.

## Aceite na TV

1. Reabrir completamente o Player da Philco e conferir no Log que está em `0.56-beta.6`.
2. Reproduzir o mesmo canal por tempo prolongado e observar áudio, vídeo e continuidade.
3. Se ocorrer a queda, registrar `NETERR`, `DNSERR`, `HLSERR`, `H route failure`, `LIVE56`, tempo entre tentativas e se a mídia retomou. Ao testar, não apagar dados/favoritos.
4. Com rede/host ainda indisponível após três reconexões, a UI mantém a possibilidade de reiniciar manualmente pela seleção do canal.
5. Se DNS externo ficar permanentemente sem rota ou o helper Go exigir mudança, a atualização remota não corrigirá a infraestrutura por si só; validar rede/bridge antes de mexer em firmware.

As versões anteriores permanecem preservadas. Não há confirmação de instalação ou sucesso no decoder real até teste físico.
