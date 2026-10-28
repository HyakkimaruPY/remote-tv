# Philco Remote TV 0.56-beta.6.5.3 — recuperação de VOD

Base: `ce2bf227d9a713dc8029de85a6af775d8aa2edbf` (0.56-beta.6.5.2). Runtime validado: commit `229736ab632e323c17993b75fa1b8981f9a0e8f8`.

## Problema e mudança

O player nativo não tinha watchdog de VOD depois da aceitação inicial. No HTML5, cada retry recalculava o alvo usando `currentTime`, que pode retornar zero após `load()`. O prazo de 10 segundos e os handlers que repetiam `play()` também podiam esgotar a recuperação antes de metadata/seek se estabilizarem. O progresso podia ser gravado entre tentativas, e o retorno de um setter não confirmava que o seek ocorreu.

Novo módulo `system/readable/xtream-vod-player.beta56-6-5-3.js`, mantendo aliases, ordem e fases dos 48 módulos. Filmes e episódios compartilham a implementação. URLs e perfis existentes são preservados.

- HTML5 mantém um alvo durante todas as tentativas; espera metadata e seek observado antes de emitir play uma vez; exige avanço posterior do relógio. Reaplica o alvo se o relógio retornar a zero durante a recuperação. Cada tentativa tem até 30 segundos, com backoff e limite de três falhas.
- Progresso protegido durante reload, backoff e falha terminal, inclusive ao sair. Pausa interrompe a tentativa e Continuar retoma o alvo original. Callbacks de sessão antiga são invalidados.
- VOD nativo detecta 30 segundos sem avanço fora de pausa/seek, libera a instância e reabre com o mesmo perfil/URL. Retoma pelo mecanismo existente de seek confirmado. Três falhas consecutivas encerram tentativas preservando progresso.
- Eventos de fim não avançam automaticamente de episódio durante recuperação. Buffering transitório conserva a rota. HLS mantém a recuperação fatal existente, coberta por regressão.

## Evidência executada

[GitHub Actions — validação aprovada](https://github.com/HyakkimaruPY/remote-tv/actions/runs/40732833189).

- Integridade de todos os 48 módulos: bytes e SHA-256; JavaScript parseado como ES5 com acorn.
- `node tests/beta56-6-5-3.vod.cjs`: 19 cenários aprovados. Relógio falso e mídia/rede simuladas em jsdom: sessões de 5/20/30 minutos, congelamento, reload zerando relógio, seek recusado, CDN demorando mais de 10 segundos, repetição de canplay, progresso após três falhas e saída, pausa/retorno, VOD nativo de série e callback antigo após troca de item.
- `node tests/beta56-6-5-2.refine.cjs`: 11 verificações da base de navegação/Portal aprovadas.
- `node tests/beta56-6.live.cjs`: 6 cenários aprovados.
- `node tests/beta56-5.live.cjs`: 17 verificações aprovadas.
- `node tests/beta56-5.artwork.cjs`: cenários de imagens/cancelamento aprovados.
- `node tests/beta56-5.vod.cjs`: regressão da implementação anterior aprovada; separada dos 19 cenários executados sobre o módulo novo.
- Verificação local de bytes/SHA-256 dos 48 módulos, `node --check` e `git diff --check`: aprovados.

A primeira execução da nova suíte apontou um reset de relógio posterior ao primeiro seek; o módulo foi corrigido e a suíte completa passou no commit acima. Não houve relaxamento de proteção de progresso.

## Limites e publicação

Não foram usados CDN/conta do usuário nem decoder físico. Minutos de sessão são simulados, não um teste de reprodução real de meia hora. Instalação local de dependências foi bloqueada pelo acesso ao registro npm, e não há Chromium instalado no host; por isso os testes funcionais foram executados no GitHub Actions. Não há afirmação de teste físico ou visual nesta atualização.

Publicar módulos + manifesto ativo/arquivado mantendo `version=0.56-beta.6.5.2`; conferir conteúdo remoto e concorrência; ativar `version=0.56-beta.6.5.3` em commit separado. Na TV: fechar e reabrir completamente o Player 1, confirmar a versão no Log e verificar filme/episódio além do ponto em que congelava. O mecanismo é atualização remota do player Philco, sem APK ou firmware novo.
