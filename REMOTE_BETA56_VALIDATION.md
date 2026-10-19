# Player 1 — beta 0.56.1: relatório final local

Base: `864bb8604452b00043f7c67025802fe0d92e6731` (main, versão 0.55). Data: 19/10/2026. Kit privado consultado no commit `27aa597594dffcaf31ce4c50641a5b5723985944`. Nenhum workflow do GitHub foi iniciado.

## Resultado

Beta preparada e validada localmente em 1280×720. Arquivos da 0.55 preservados; `manifest.stable55.json` e `version.stable55` identificam a versão anterior. Módulos novos recebem nomes `beta56`; a beta é identificada no menu e nos diagnósticos. Publicação e ativação são commits separados, com `version` como último marcador.

## Correções

| Fluxo | Problema confirmado | Comportamento da beta |
|---|---|---|
| Live nativo | `playFromStart` aceito era anunciado como reprodução e não havia monitor | Confirma por NormalPlay ou relógio avançando; ausência de ambos durante 25 s encerra a rota, libera o decoder e tenta o próximo perfil. Buffer transitório não troca a rota. |
| Live HTML | Inicialização sem prazo final e erro após início sem recuperação | 30 s sem confirmação/avanço encerram a rota; erro persistente tem tolerância de 2,5 s. Pausa e retorno da pausa são respeitados; saída invalida callbacks. |
| VOD progressivo | Buffer antigo podia perpetuar a condição “saudável” sem avanço | Tolera peculiaridades do relógio por até 60 s com buffer; depois recupera com até três tentativas sem progresso real. Pausa, seek e saída suspendem/cancelam recuperação. |
| Posição VOD | Reconexão podia salvar posição transitória em zero | Escrita de progresso suspensa durante recuperação; sucesso exige avanço após o alvo; pausa durante reconexão protege o alvo de retomada. |
| HLS | Manifesto cancelava prazo inicial; erro fatal depois de iniciar era ignorado | Prazo absoluto de 12 s; watchdog de 30 s após início; duas tentativas de recuperação de rede/mídia e fallback progressivo com posição preservada. Destroy invalida eventos/timers. |
| Logos | Cada nova tecla abortava e recolocava o download em fila | Mantém um carregamento ativo, com timeout de 4,5 s e descarte ao sair/trocar a página. Trinta entradas repetidas não reiniciam o mesmo download. |
| Interface | Status de playback ficava no shell oculto; tema cobria a prévia | Status aparece no rodapé do player comum; mensagens distinguem abertura, buffer e sinal. Wrappers sobre a área de vídeo ficam transparentes, mantendo os painéis opacos. |

## Testes executados

| Teste | Execução local | Resultado |
|---|---|---|
| Sintaxe de todos os módulos JS do manifesto beta | Acorn `ecmaVersion: 5` | PASS |
| Live, HLS loader, fila de logos | `node tests/beta56.test.cjs` | 17 grupos PASS; relógio virtual e mocks das APIs nativas |
| VOD e integração de recuperação HLS | `node tests/beta56.vod.cjs` | 8 cenários PASS, com JSDOM e mídia simulada |
| Player real + helper Go + browser 16:9 | `PHILCO_REAL_BRIDGE=1 node local-lab/test-browser.cjs` | 8 verificações PASS; detalhes em `local-lab/results/browser-go.json` |
| Helper Go recuperado v7.2 | `GO111MODULE=off go test -v` | 8 testes PASS: redirecionamento/cookie/gzip, URI/chave AES preservadas, seleção de variante, MIME TS, retry limitado |
| Núcleo C do kit | `make clean test` em `native/playiptv` | 3 executáveis PASS: núcleo, política de transporte e tamanhos de evidência ABI MStar |

O browser executou o manifesto beta, autenticou em Xtream fictício, abriu categoria, decodificou vídeo sintético, alternou tela cheia/retorno, moveu foco entre páginas com 35 ações, saiu durante transporte atrasado e recebeu falha HTTP de rede simulada. Não houve exceção de página. O wrapper da prévia foi verificado como transparente e os screenshots foram inspecionados.

O teste de integração usa o Go real em `/hls` e `/fetch`. A ABI QJY, controle e catálogo são adaptados. Após obter manifesto/segmento, o adapter reproduz um WebM de referência no Chromium. Isso verifica integração e fluxo, não decodificação TS/H.264 pelo MStar. A latência de primeiro quadro registrada no JSON é exclusivamente da fixture local, não uma estimativa para canais reais.

A suíte histórica remote35 foi experimentada contra a UI ativa v49 e parou numa expectativa antiga de cancelar imagens a cada tecla. A mesma falha ocorreu na base estável, sem o patch beta. Ela não foi alterada nem declarada aprovada; a beta usa testes comportamentais específicos e browser com manifesto atualizado. Nenhum teste original foi apagado.

## Limites e validação na TV

Não foi executado o firmware completo nem o WebKit original. O repositório do kit disponibiliza fonte completa do helper v7.2, mas patches posteriores contêm trechos resumidos e dependem de uma base v7.3.3 não encontrada. A integração real é identificada como v7.2; os contratos posteriores são modelados pelo laboratório. O CA bundle e a arquitetura do build Go são do host. Nenhuma biblioteca do firmware foi trocada.

O modo NormalPlay com relógio nativo congelado permanece preservado por compatibilidade: sem observação de frames do decoder, esse caso pode ser uma peculiaridade da API ou um travamento real. Polls síncronos das APIs QJY também só podem ter seu custo real medido na TV. Os limites de 25/30/60 s precisam de confirmação em canal lento e na conexão da TV.

Na TV: fechar/reabrir completamente, conferir `0.56-beta.1` no Log e “Beta 0.56” no menu; testar canal lento, perda de rede, troca rápida, tela cheia/Voltar, filmes e episódios, pausa/retomada e seek durante buffer. Isso é validação física pendente, não um teste já executado.

## Recuperação da versão anterior

A versão 0.55 continua integral nos módulos antigos e no manifesto `manifest.stable55.json`. O bootstrap mantém `active/previous/staging`; falha de ready pode usar a cópia anterior, mas falha de decoder após ready não garante rollback automático. Não limpar favoritos, progresso ou todo o storage.

Para rollback remoto deliberado, publicar uma cópia de `manifest.stable55.json` com um novo identificador, por exemplo `0.56-rollback.55`, nos campos version/release apropriados, conferir hashes e árvore remota, e somente depois publicar esse mesmo identificador em `version`. Nenhum código precisa ser recompilado nem firmware reflasheado. O histórico anterior e o manifesto estável permitem reconstrução independente do cache da TV.

Reprodução do laboratório: `local-lab/README.md`. Publicação não comprova recebimento por CDN/cache ou aplicação na TV.
