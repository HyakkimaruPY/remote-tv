# Beta 0.56.3 — fontes, chamadas e YouTube

Base: `c36bb7451601f4caad6ea30b1b77bd2e0f3794fa` (beta 2). Data: 19/10/2026. Nenhum GitHub Actions utilizado.

## Entregue

- 15 módulos anteriores migrados para fontes com indentação e nomes privados descritivos; runtime, feature loader e YouTube reorganizados. CSS dividido em regras legíveis com valores constantes preservados.
- RequestScope compartilhado pelo app, player comum, VOD, carregador e YouTube; timeout/cancelamento/entrega única centralizados.
- POO ES5 em RequestScope, FeatureLoader, YouTubeResolver e NativePlaybackSession; interfaces e estado público compatíveis.
- Catálogo `/c` analisado como JSON em vez de eval.
- YouTube aceita relay MP4/HLS, ignora APIs desativadas e usa o transporte TLS do kit. Libera sessão ao sair e exige confirmação de reprodução. Não reinjeta código/handlers a cada abertura.
- Layout do YouTube corrigido: título não ocupa 1010 px nem empurra Teste/Log para baixo do status. Removida alteração global de tamanho/margem de html/body que afetava outras telas.

## Verificações executadas

| Comando / evidência | Resultado | Natureza |
|---|---|---|
| Migração com análise de bindings e comparação estrutural | 15 módulos conferidos | Renomes privados; duas trocas eval→JSON explícitas; compartilhamento HTTP aplicado depois |
| `tools/format-readable.cjs` | PASS | AST e valor constante do CSS preservados na formatação final |
| `tests/beta56-3.live.cjs` | 17 grupos PASS | Live, HLS loader, cancelamento, logos; relógio virtual |
| `tests/beta56-3.vod.cjs` | 8 cenários PASS | Recuperação, pausa, seek, progresso, HLS, saída; JSDOM |
| `tests/beta56-3.youtube.cjs` | 9 grupos PASS | Classes, ES5, relay, seleção de API, timeout, hash, cancelamento e 22 aberturas com 1 injeção/1 validação |
| `local-lab/test-browser.cjs` | 9 verificações PASS | Manifesto beta 3 real, 1280×720, live e navegação, Python bridge/ABI simulados |
| `local-lab/test-youtube.cjs` | 5 verificações PASS | Carregador real → metadados fixture → HLS local → vídeo sintético decodificado no host → retorno/saída/reabertura |

As suítes novas apontam aos arquivos reorganizados, não apenas aos antigos. A validação de browser removeu um override legado que substituía o app do manifesto. Evidências finais estão em `local-lab/results/browser-beta3.json` e `youtube-beta3.json`. Erros HTTP esperados no cenário de perda de rede não são exceções da página. Screenshots da prévia e do YouTube foram inspecionados.

## YouTube real: pendência objetiva

Não foi confirmado o primeiro vídeo real do YouTube. O teste com o ID público retornou página oficial playability OK, zero formatos muxados e formatos adaptativos sem URL direta; resolvedores anteriores devolveram 401/502 ou página não JSON, e a lista pública marcou APIs antigas como desativadas. Os testes locais de reprodução usam mídia e metadados sintéticos: não devem ser apresentados como reprodução real de YouTube.

As correções de código removem causas concretas de falha, mas o objetivo depende ainda de uma fonte MP4/HLS compatível disponível para o acesso da TV, ou de evolução do backend de resolução. Não se substituiu o vídeo solicitado por uma amostra para declarar sucesso. Decoder e WebKit físicos permanecem sem validação nesta sessão.

## Custo e preservação

Não há medição de aceleração universal. A redução verificável é a ausência de reinstalação e validação repetidas da feature. Fontes legíveis são maiores (aprox. 189 → 347 kB no manifesto), com possível custo adicional no primeiro download. Cache, favoritos, progresso, tema e geometria de vídeo foram preservados.

A beta 2 está integral em `manifest.beta56-2.json`; beta 1 e estável 0.55 também continuam disponíveis. Publicação prepara fontes/manifestos, compara blobs remotos e só então ativa `version=0.56-beta.3` em commit separado. Reabrir completamente e conferir versão no Log; isso ainda não confirma aplicação por CDN ou decoder na TV.

Mapa de arquitetura e manutenção: `ARCHITECTURE_BETA3.md`. A entrega estrutural está validada localmente; a parte “primeiro YouTube real reproduzido” está explicitamente pendente.
