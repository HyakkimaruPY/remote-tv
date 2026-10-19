# Beta 0.56.5 — lotes de capas, seletor e logos

Base publicada: `8327ab201e8c1ef314827ad5cef9d1ba83f36fb3`, 0.56-beta.4. Alvo: 0.56-beta.5, release 2026.10.19-beta.56.5. Arquivos novos para UI, tema, metadata TMDB, diagnóstico VOD e shell; os demais módulos e releases anteriores permanecem preservados. Sem Actions ou alteração de firmware.

## Evidência do usuário

Foto 12997.jpg e vídeo 12999.mp4 (5,73 s) foram inspecionados localmente. Mostram beta4, duas aceitações HTML5 em 1881/2182 ms, relógio ainda em zero e buffer declarado próximo de 3200 s. A foto não mede o primeiro quadro/áudio. Resets/cancelamentos junto a saída e requisições de range não provam sozinhos falha de rede. Contadores mostrados como zero na beta4 também podiam representar APIs ausentes no WebKit.

Não foi obtido o arquivo do filme nem medido seu decoder. A melhora de uma série foi relatada pelo usuário; não foi reproduzida fisicamente no laboratório. Não se atribui a demora a uma causa única sem evidência.

## Mudanças implementadas

- **Imagens em lotes:** até três downloads de capas/episódios simultâneos, com revelação conjunta após o lote terminar. Após 1200 ms, capas já prontas aparecem mesmo se uma estiver lenta; cada transporte tem limite de 4500 ms. Falhas não ocultam as capas boas indefinidamente. O lote seguinte respeita a pausa de navegação. Logos de canais ao vivo continuam com um download ativo. Teclas mantidas não reiniciam o lote; sair/trocar de tela/play cancela todas as vagas e invalida callbacks antigos. As requisições são individuais HTTP, agrupadas pelo agendador, não uma nova API de lote.
- **Capas 5:7:** filmes/séries, Favoritos/Continuar e skeletons de catálogo usam 170×238 px, dez itens em duas linhas. Miniaturas de episódios preservam o formato horizontal e o painel de seis episódios 3×2. Barra de progresso permanece. Foram removidos texto e flare sobre as capas, inclusive episódios; nomes continuam em aria-label/title e detalhes.
- **Divisão e espaço:** coluna de categorias de VOD com 270 px (antes 246), capas iniciam em x=292, com 22 px livres após a divisória. Categorias têm 246 px de largura. Altura do bloco de capas ajustada para que o rodapé de paginação caiba nos 720 px. Live não é deslocado.
- **Seletor:** a regra `#r14 .card14/#r14 .ep14` sobrescrevia a cor de foco de menor especificidade. Agora há regra explícita de foco branca #fff, 1 px, cantos de 4 px, com borda reservada também no estado sem foco e imagem contida no interior. Conferido por estilo computado e captura em filmes e episódios.
- **Categorias Unicode:** entidades HTML nomeadas/numéricas, escapes Unicode literais e mojibake UTF-8 reconhecido são corrigidos somente na apresentação, inclusive títulos atualizados parcialmente. Remove controles direcionais e decoração de bordas, preserva acentos, japonês e pares de surrogate/emoji; NFC quando disponível. Nenhum ID de categoria é alterado. Texto continua escapado ao gerar HTML. Não instala fontes novas: a cobertura de glifos depende das fontes do firmware.
- **Logo limpa:** consulta de detalhe TMDB inclui imagens em pt/en/sem idioma no mesmo HTTP, prefere logo PT e usa w500. Cache antigo que não pesquisava logos pode ser atualizado; ausência de logo é registrada para não consultar novamente por item. UI também tenta o endpoint Logo quando a capa usa o formato conhecido Items/id/Images/Primary do provedor, preservando título enquanto carrega. Backdrop e logo usam uma vaga decorativa sequencial; controles não esperam arte. Logo carregada substitui h1 sem reconstruir a tela nem perder foco. Cancelamento, erro, troca de temporada e reuso do source foram testados. Se não houver logo válida, o título permanece legível.
- **Inicialização VOD:** preservado caminho FAST sem probe prévio e cancelamento da arte/metadata antes de reproduzir. A prioridade de rede do vídeo permanece. Diagnóstico diferencia aceitação HTML5, evento playing e primeiro avanço observado do relógio, sem novo play, seek ou probe. Contadores ausentes agora aparecem como n/a. O monitor de relógio tem resolução aproximada de 1 s e não comprova primeiro quadro ou áudio; não se promete redução medida do tempo do filme na TV.

## TMDB e referências

Mantida a limitação registrada na beta4: o caminho externo configurado para tmdb-config estava ausente/404 na leitura daquela rodada. A beta5 não modifica fei-config nem inventa credenciais; reutiliza a configuração salva e mantém espera após falha. Logo do provedor funciona sem essa configuração quando o servidor possui o recurso. Logos exclusivamente TMDB precisam de configuração válida.

Documentação consultada: [TMDB Images](https://developer.themoviedb.org/reference/movie-images), [Append to Response](https://developer.themoviedb.org/docs/append-to-response), [Emby Images](https://dev.emby.media/doc/restapi/Images.html). Imagens de fixture não são amostras do catálogo privado do usuário.

## Verificação executada

Com NODE_PATH=/tmp/philco-lab-deps/node_modules:

- `node tests/beta56-5.artwork.cjs`: 19 grupos PASS — lotes, revelação conjunta, teto de três, erro/timeout, saída, navegação mantida, assinatura/parâmetros, Unicode misto, episódios, logos do provedor e TMDB, cache e troca de temporada.
- `node tests/beta56-5.vod.cjs`: 10 cenários PASS — recuperação limitada, pausa, seek, progresso, HLS/fallback, saída, waiting sem repetir play e diagnóstico de aceitação separado do avanço de relógio.
- `node tests/beta56-5.live.cjs`: 17 checks PASS, usando UI beta5 para fila de logos e parse ES5 dos JS do manifesto atual; engines live preservados.
- `node tests/beta56-3.youtube.cjs`: 9 grupos PASS para transporte/YouTube não alterados. Serviço YouTube real não foi validado.
- `node local-lab/test-browser.cjs`: 9 checks integrados PASS no manifesto beta5, preview/transparência/fullscreen/navegação/retorno/falha breve.
- `node local-lab/test-vod-budget-beta5.cjs`: PASS, detalhes em 829 ms com backdrop atrasado em 3 s, handlers direcionais de 0,1–1,4 ms no host, foco e DOM estáveis em 170×238, nenhuma nova imagem após play, áudio e vídeo WebM/Vorbis decodificados em Chromium.
- `node local-lab/test-artwork-beta5.cjs`: PASS em 1280×720; dez posters 5:7, rodapé visível, divisória livre, três downloads simultâneos, foco branco 1 px/4 px, logos em filmes/séries sem perda de foco, seis episódios dentro da tela. Métricas em `local-lab/results/artwork-beta5.json`; capturas locais de posters, filme e episódios inspecionadas.
- Formatação mantém AST/CSS com parse ES5. Bytes/SHA-256 dos 22 módulos conferidos, assim como integridade das fontes arquivadas beta4. `git diff --check` limpo.

Chromium e helper Python são laboratório, não WebKit/decoder/GPU da Philco. O áudio de fixture não confirma compatibilidade/timestamps do filme do usuário. Sem teste físico não se afirma que todos os caracteres serão desenhados nem que o tempo real de início foi reduzido.

## Publicação e teste físico

Preparar módulos/manifestos com `version` ainda beta4; comparar blobs remotos; ativar em commit separado alterando somente version para 0.56-beta.5. Commits no GitHub registram os SHAs. Preservar favoritos/progresso.

Na TV, reabrir completamente e confirmar beta5; conferir seleção na grade e nos episódios, lotes durante navegação rápida, nomes de categorias, logos no detalhe e o mesmo filme. Guardar STARTUP beta5 e MEDIA beta5 se o início continuar demorado. Publicação remota não prova aplicação na TV/cache CDN.
