# Beta 0.56.4 — imagens, resposta da interface e VOD

Base: `a08940daca534feb16565f1d596478b5f7fe8639` (0.56-beta.3). Alvo: `0.56-beta.4`, release `2026.10.19-beta.56.4`. Não altera firmware, bootstrap, dados salvos ou engines do live. Releases anteriores preservadas.

## Evidência e causas

O vídeo e a foto fornecidos mostram avanço visual com relógio quase parado, buffer reportado próximo de 3200 s e o diagnóstico antigo `CLOCK QUIRK`. O log também contém imagens `Items/.../Images/Primary` do provedor, uma delas próxima de 886 kB, além do TMDB. Portanto, nem todas as capas passam pelo TMDB. O registro não prova que a rede seja a única causa do áudio tardio ou das pausas: decoder, timestamps e container ainda exigem teste na Philco.

Na base, imagens HTTP passavam desnecessariamente pelo helper; imagens do provedor não tinham limite solicitado de tamanho; detalhes aguardavam arte/metadados opcionais; o backdrop era abandonado após 2,2 s; iniciar VOD não cancelava toda arte pendente. A recuperação também reemitia `play()` com relógio parado e buffer aparentemente cheio, inclusive em eventos waiting repetidos. Esses caminhos foram confirmados no código e cobertos por testes.

## Mudanças

- `xtream-ui.beta56-4.js`: imagem HTTP diretamente no elemento, HTTPS ainda via bridge TLS; TMDB w185 para capa e w780 para backdrop; endpoints conhecidos do provedor com maxWidth 240/960 e quality 70. Preserva tags/fragmentos e não reescreve URLs com assinaturas reconhecidas. O servidor pode ignorar parâmetros: não se promete redução de bytes sem suporte do provedor.
- Controles e sinopse do provedor aparecem antes do backdrop. Apenas um backdrop opcional, prazo de 8 s, sem download de logo adicional. Atualização parcial preserva DOM/foco. VOD/Voltar abortam arte e invalidam callbacks tardios. A fila visível continua com um download ativo, com prioridade para navegação e sem enriquecer todos os cards via TMDB.
- `graphos-skin-beta56-4.js`: preto/grafite preservados; menos sombras e gradientes nos controles repetidos; borda de 2 px reservada antes e depois do foco; esqueletos estáticos. Somente a entrada da arte tem revelação curta de 140 ms em opacidade; reduced-motion a desativa. Sem animar geometria ou acrescentar espera às teclas. Decodificação assíncrona de imagens é apenas uma dica quando suportada.
- `xtream-vod-player.beta56-4.js`: relógio estranho com buffer declarado passa a ser observado sem repetir play. Mantém recuperação terminal limitada, pausa, seek e proteção de progresso. Acrescenta diagnóstico `MEDIA beta4` com avanço do relógio, mute, pausa e contadores de bytes decodificados quando expostos pelo WebKit.
- `autovod.beta56-4.js`: usa diretamente apenas direct_source HTTP fornecido pelo provedor para MP4/M4V/MOV; HTTPS e rotas sintetizadas continuam no helper. Probes XHR continuam no helper por CORS. Não altera URLs assinadas nem parâmetros de streaming.
- `tmdb-metadata.beta56-4.js`: módulo opcional novamente declarado antes da UI; complementa apenas dados ausentes do item selecionado e não bloqueia Assistir. Remove payload extra de logos e consulta inglesa redundante quando já há sinopse/backdrop.

## Referência do gerador HTML

Leitura somente do projeto `fei-config`, commit `78cdac7e2512865d6ec7671bb70ab50b8e14501e`, arquivos `html-generator/v6.6/public/x/7d4.js` e `3c5.css`. O gerador usa listas virtualizadas, imagens lazy/async, trabalho adiado e descarte de conteúdo. Mantida no player a grade limitada já existente (10 filmes/6 episódios), com fila de imagens e DOM preservado durante direcionais; aproveitada a dica async quando suportada. Não foram copiadas dependências modernas como ResizeObserver, IntersectionObserver, async/await, blur ou grandes transições de tela para o WebKit legado. O outro projeto não foi modificado.

Referências dos parâmetros: [TMDB image basics](https://developer.themoviedb.org/docs/image-basics), [Emby Images](https://dev.emby.media/doc/restapi/Images.html), [ImageService MaxWidth/Quality](https://dev.emby.media/reference/RestAPI/ImageService/getItemsByIdImagesByType.html).

## Limitação da configuração TMDB

O caminho configurado `html-generator/v6.6/runtime/shared/tmdb-config.json` retorna HTTP 404 e está ausente da árvore remota consultada. A beta reutiliza a configuração já salva em `tmdb.cfg.v24`, mesmo antiga, e aplica espera de 60 s após configuração indisponível. Sem chave/configuração válida já salva, não consegue consultar novos metadados TMDB; continua exibindo dados e imagens fornecidos pelo provedor. Não foi inventada chave nem alterado o projeto externo. Isso é pendência externa, não uma correção concluída de toda a integração TMDB.

## Verificação executada

- `NODE_PATH=/tmp/philco-lab-deps/node_modules node tests/beta56-4.artwork.cjs`: 10 grupos PASS, incluindo redimensionamento, assinatura, parâmetros antigos, metadados tardios sem perda de foco, backdrop após 3 s, cancelar no play/Voltar, direct_source e configuração 404/cache antigo.
- `... node tests/beta56-4.vod.cjs`: 9 cenários PASS: resume, seek, pausa, recuperação limitada, retorno, HLS/fallback e 20 waiting sem reemitir play.
- `... node tests/beta56-3.live.cjs`: 17 checks PASS; live e transporte desses testes não foram alterados nesta beta. Também faz parse ES5 de todos os JS do manifesto atual.
- `... node tests/beta56-3.youtube.cjs`: 9 grupos PASS, fixtures de transporte/YouTube preservados. Não é teste do YouTube real.
- `node local-lab/test-browser.cjs`: 9 checks integrados PASS, manifesto atual em 1280×720; foco, navegação de páginas, retorno, camadas transparentes e rede com falha breve.
- `node local-lab/test-vod-budget.cjs`: PASS com backdrop atrasado 3 s, capas limitadas, detalhes antes da arte, grade/cards preservados e geometria estável no foco. Dados e tempos exatos em `local-lab/results/vod-budget-beta4.json`; última rodada: detalhes em 837 ms e handlers direcionais entre 0,1 e 1,1 ms no host. Zero novas imagens após iniciar reprodução. Vídeo sintético avançou >2 s e houve decodificação de áudio com mute=false/volume=1.
- Formatação preserva AST e constantes CSS com parse ES5. Todos os 22 módulos têm bytes/SHA-256 conferidos; módulos arquivados da beta3 preservados. `git diff --check` sem erros.
- Inspeção visual das capturas do laboratório: UI preto/grafite e vídeo de referência visível sem camada opaca. Capturas e métricas do host não medem o desempenho do processador da TV.

O AV de laboratório é WebM/Vorbis em Chromium, não H264/AAC no decoder Philco. O helper Python testa o contrato HTTP; nesta rodada não foi reexecutado o helper Go real. Não foi provado que áudio tardio, timestamps ou compatibilidade do arquivo do usuário estejam resolvidos na TV física.

## Publicação e próximo teste físico

Preparação com novos módulos/manifestos e marcador ainda beta3; leitura remota com comparação de blobs; ativação separada mudando apenas `version`. SHAs finais constam dos commits no GitHub. Nenhum Actions utilizado.

Reabrir completamente o app e confirmar `0.56-beta.4` no Log. Validar capas durante navegação rápida, abrir detalhes com arte lenta, iniciar o mesmo filme e observar som/continuidade. Se houver falha, guardar os trechos HEARTBEAT, MEDIA beta4 e CLOCK OBSERVE e a versão; esses sinais ajudam a separar transporte, relógio e decoder. Não limpar favoritos/progresso para diagnosticar.
