# Remote TV Philco 0.56-beta.6.5.5 — prévia visual e YouTube beta

Base remota: `ed26ea62d3ac00d6b442e81cda1f5d37618e6c60` (6.5.4). Preserva o player VOD 6.5.4, a retomada confirmada, as rotas live e todos os módulos nativos anteriores. Não instala firmware, drivers, glibc ou WebKit.

## Mudanças

- Configurações → Renderização no cabeçalho M3U: backdrop opcional do conteúdo focado em categorias de filmes/séries, Favoritos filmes/séries e Continuar filmes/séries. Começa desativado; opacidade inicial de 35%, persistida entre 0–100%, ajustável com −/OK/+ ou direcionais em passos de 5%. Controles de opacidade aparecem só quando ativo.
- Uma superfície atrás da grade, com recorte central calculado, sem depender de `object-fit` para o backdrop. Preserva as capas. Foco tem prioridade; espera 260 ms, mantém apenas uma imagem e invalida/aborta o trabalho anterior. O efeito não é aplicado a live, canais favoritos ou à camada do vídeo.
- Detalhes de filme/série aguardam metadata, backdrop e logo; série prepara as seis capas iniciais. Nós de capas preparados são reutilizados. Falhas têm prazo: até 6,5 s para metadata e orçamento de 6,5 s para arte, com até 2 s por imagem. Não há reinjeção tardia de arte após abrir o fallback. Voltar invalida as respostas antigas.
- Backdrop preenche a tela 1280×720 com dimensões e posição explícitas; a altura de detalhes não herda os 648 px da tela com cabeçalho. Preview visual com cantos arredondados e foco estável, mantendo preto absoluto e vídeo transparente.
- Bibliotecas: limites superior/inferior da navegação vertical; não retorna do rodapé ao topo nem do topo ao rodapé. Navegação horizontal preservada.
- O botão YouTube passa a abrir YouTube beta, um fork de código incorporado de `NicholasBly/youtube-webos` 0.8.4, commit `78a374a32774b92a2094e1cda8db4da0d83540d4`. Fonte GPL, configuração de compilação, polyfills e licenças acompanham o bundle. Carregamento lazy com hash; saída cancela transporte/abertura. O resolver antigo não é usado por este botão.

## Testes executados localmente

Node 24, jsdom/acorn; browser Chromium 153 em headless. Dados, rede, relógios e mídia são fixtures.

- `tests/beta56-6-5-5.render.cjs`: **13 cenários** sobre a UI 6.5.5. Opacidade/limites/storage/foco; seis contextos; debounce e resultados antigos; preparação de filme e seis capas de série; timeout sem reinjeção; saída durante carregamento.
- `tests/beta56-6-5-5.lifecycle.cjs`: **2 cenários**. Limites verticais/retorno de Bibliotecas e cancelamento do download/abertura tardia do YouTube.
- `tests/beta56-6-5-4.resume.cjs`, com `RTV_RESUME_UI` apontando para **6.5.5**: **14 cenários** de retomada de filme/episódio, registros existentes, posição e seek observado.
- `tests/beta56-6-5-3.vod.cjs`, com player **6.5.4**: **19 cenários** de reconexão, pausa, progresso protegido, nativo e sessões com relógio simulado.
- `tests/beta56-6.live.cjs` e `tests/beta56-5.live.cjs`, com UI **6.5.5**: **6 + 17** cenários/verificações. Integridade e parse ES5 de todos os 48 módulos, além do módulo lazy de YouTube.
- `tests/beta56-6-5-5.browser.cjs`: visual e geometria 1280×720; cabeçalho acessível, configurações, backdrop de filme e seis episódios sem ultrapassar a tela. O bundle real compilado do fork inicia contra markup sintético de YouTube; confirmação de interface, isolamento do storage IPTV, avanço observado de mídia simulada e destruição ao fechar.

A suíte de imagens 6.5.5 substitui os testes antigos que exigiam exibir detalhes antes de metadata/arte: essa expectativa foi alterada pelo pedido atual. Os testes antigos continuam preservados e suas versões anteriores continuam disponíveis. Nenhuma afirmação de que a suíte antiga de imagens foi aprovada contra a nova política de preparação.

## Limites do YouTube

O upstream é webOS 3+, enquanto a Philco usa QtWebKit antigo. O port compila para ES5 e executa o fork em iframe sandbox com origem opaca, sem permitir acesso aos dados do Remote TV. O storage do fork é temporário nesta prévia. Integrações LG/Cast/power foram excluídas. A página inicial usa o bridge atual; scripts e APIs posteriores continuam dependendo do TLS, CORS, APIs web e codecs atuais. Não foi usado nenhum novo endpoint de firmware.

O teste de browser usa uma página sintética; **YouTube real e reprodução no decoder da Philco não foram confirmados**. Documento buscado, userscript iniciado, interface pronta e vídeo avançando têm estados separados no Diagnóstico. Sandbox ausente, falha de transporte, erro de script/mídia e timeout aparecem explicitamente. Nenhum dos testes substitui a validação física.

## Publicação e teste na TV

Preparar módulos/manifestos mantendo `version=0.56-beta.6.5.4`; conferir blobs e concorrência; ativar `version=0.56-beta.6.5.5` em commit separado. O workflow novo valida o candidato; os workflows 6.5.3/6.5.4 verificam seus manifestos arquivados sem exigir que a versão ativa permaneça antiga.

Na TV: Atualizar, fechar/reabrir completamente o Player 1, confirmar 6.5.5 no Log. Ativar Configurações → Renderização e percorrer os seis contextos; conferir opacidade após reabrir. Testar filme/episódio e retomada. Abrir YouTube beta; se não iniciar ou reproduzir, usar Diagnóstico para registrar a última etapa. Não limpar favoritos, progresso ou dados do aplicativo.
