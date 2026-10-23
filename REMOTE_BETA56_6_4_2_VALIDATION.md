# RemoteTV Philco 0.56-beta.6.4.2 — busca, navegação, vídeo e LAN

Base 6.4.1. Atualizador remoto preserva módulos existentes, marcadores de versão e opções de rollback. Arquivo candidato `manifest.beta56-6-4-2.json`, 35 módulos com SHA256 e tamanhos.

## Diagnóstico a partir do vídeo 13633.mp4

A gravação contém cerca de 15 segundos de imagem/áudio com overlay de log. Visualmente, aparecem `get_live_categories` com 79 categorias, chamadas `get_live_streams&category_id` (não listagem global), respostas HTTP 200 e o início de um canal. Isso não comprova por si só a origem das interrupções de áudio. Silêncios no áudio captado por celular não distinguem pausas na fonte de problemas de renderização/decodificação. Mudanças desta release reduzem trabalho JS concorrente, mas não prometem curar todas as falhas do decoder.

## Causas técnicas confirmadas no código 6.4.1

- **Busca por letras**: a UI enviava consulta com apenas 2 caracteres e após debounce fixo de 320 ms; causava múltiplas varreduras, cancelamentos, parsing de grandes arrays e DOM refeito a cada callback. O `JSON.parse(body)` da categoria inteira é síncrono na thread do WebKit.
- **Foco da busca**: o overlay não tratava direcional para as teclas virtuais; a navegação genérica/IR continuava em caminhos concorrentes.
- **Painel de bibliotecas**: as setas ↑↓ percorriam listas lineares compostas por cada botão Ativar e Testar; a tecla Baixo avançava horizontalmente antes de chegar ao próximo módulo.
- **QR**: dependia de URL/IP manual de relay. Um script remoto não pode tornar o loopback visível ao smartphone, e não há API nativa comprovada para criar listeners LAN por JavaScript.

## Alterações da Beta 6.4.2

1. **Busca por API em toda a aba**: canal/categoria anterior não é critério limitante; a varredura percorre `get_live_streams`, `get_vod_streams` ou `get_series` com `category_id` obrigatório para todas as categorias da seção atual. Mínimo 3 letras, estimativa EMA do intervalo de digitação e pausa entre 850 e 3000 ms. Sem consultas enquanto digita. Busca cancela e invalida respostas antigas. Processa as strings JSON por objetos em lotes de 14000 caracteres por tick, normalizando **somente** os títulos correspondentes, descartando temporários ao mudar de categoria, limite de 84 resultados e 60 s para varredura. Categorias acima de 10 MB são indicadas como indisponíveis para proteger a RAM.
2. **UI**: teclado TV plenamente navegável por ↑ ↓ ← →/OK, controle do foco isolado; apenas 12 cards no DOM por página (duas colunas, seis itens visíveis por coluna). Capas 1:1 em TV e 5:7 em Filmes/Séries, carregadas em lotes de duas a cada 110 ms no modo leve; roda de forma isolada e não bloqueia eventos do player.
3. **Bibliotecas**: ↑↓ mudam de módulo em um único toque, preservando a coluna quando possível; ←→ alternam Ativar/Testar no mesmo módulo. Foco anterior/novo são os únicos elementos repintados em vez de todas as linhas a cada tecla.
4. **Botão vermelho físico**: nova biblioteca `ir-mapping` permite medir e associar código real de keydown/irkeypress diferente de 403. Testar → 400 ms de espera → pressionar vermelho → salvar código numérico. Não remapeia OK, setas, voltar; se o firmware não reportar a tecla no WebKit, o menu não pode inventar evento. Botão Busca da dock superior permanece.
5. **QR automático**: HTML usa módulo de cliente ES5, que tenta `127.0.0.1:8766` e não pede IP. O servidor nativo opcional (`philco/bibliotecas/localhost/main.go`) detecta IPv4 local do Wi-Fi/Ethernet, cria chave por abertura (192 bits), gera URL na LAN e **consome a chave no primeiro GET**; tentativas seguintes recebem HTTP 410. Cookie de sessão HttpOnly acompanha a página única do smartphone; encerrar ou expirar revoga o uso. Sem companion instalado, TV mostra aviso e busca pelo controle continua funcionando. Disponibilizado código, testes, binário cross-compilado como artefato GitHub Actions **não instalado automaticamente**.
6. **Render leve**: module `frame-budget` controla batching de imagens, sem compressão/descompressão de vídeo ou interferência no codec. Evita picos de conversão de imagens e repetição de árvore DOM.

## Compatibilidade do aplicativo

JavaScript em ES5. O companion opcional requer instalação e validação separadas no dispositivo; o manifesto remoto não instala componentes nativos. A reprodução física e o controle IR continuam pendentes de validação.

## Testes

CI: `tests/beta56-6-4-2.search.cjs` verifica 35 hashes, JS ES5, min 3 letras, busca por todas as categorias via API, teclado e 12 cards, direcional bidimensional das bibliotecas e núcleo de reprodução original. Regressões da 6.4.1, ao vivo e VOD executadas em GitHub Actions. `go test main.go main_test.go` valida QR único (segundo acesso 410), cookie, entrada do smartphone, leitura local, revogação, expiração e porta pública não autorizada a criar sessão; cross-build MIPSLE gera artefato para eventual instalação nativa manual. Testes de hardware físico e o real código IR vermelho continuam pendentes.

## Referências

- `REMOTE_UPDATE_ARCHITECTURE.md`, `REMOTE_BETA56_6_4_1_FIXES.md`, `philco/bibliotecas/SPEC.md`.
