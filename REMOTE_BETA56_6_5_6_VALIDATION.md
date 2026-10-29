# Remote TV Philco 0.56-beta.6.5.6 — playlist remota e abertura do YouTube

Base: `6504ba798835f70ba6113ddbd870f8c3f89692d8`, release 6.5.5. Mantém UI/renderização 6.5.5, player VOD 6.5.4, histórico/favoritos e rotas de vídeo.

## Playlist remota

A comparação dos manifestos 6.5.4/6.5.5 mostra o mesmo núcleo `xtream-lazy-core.beta56-3.js` e guard. Não há evidência de troca desse código entre as duas versões. O núcleo antigo usa apenas o bridge, força HTTP ao extrair credenciais e trata um HTTP 200 com texto de diagnóstico como JSON inválido, repetindo a mesma rota. Sem log bruto da TV, não é possível provar qual resposta específica o usuário recebeu.

Novo núcleo e guard 6.5.6:

- Configuração `credenciais.temp` é revalidada com nonce, normaliza BOM e entidades de `&`, sem baixar `get.php`.
- HTTP 200 significa transporte concluído, não autenticação aprovada. Diagnósticos de transporte, HTML/não-JSON e JSON com erro `remote/trace/upstream/fetch/proxy` não são aceitos como API. Um fallback direto usa o mesmo endpoint, esquema e credenciais, com prazo/cancelamento e número limitado de tentativas. Não há mudança automática HTTPS→HTTP.
- HTTP 401/403 e conta expirada/inativa continuam bloqueados, sem tentar contornar a rejeição por outra rota.
- HTTPS, porta e subdiretório do servidor são preservados. JSON de conta com BOM é aceito sem repetir a requisição válida.
- Categorias em cache só são invalidadas quando as novas credenciais validam. Favoritos, progresso e Continuar são preservados. Uma revalidação transitória só reutiliza a sessão anterior se as credenciais forem idênticas; credenciais ainda não autenticadas não liberam categorias.
- Cancelamento impede resposta tardia de autenticação de reabrir a UI. Logs registram etapas e quantidade de bytes, sem publicar payload da conta ou credenciais.

## YouTube

Na 6.5.5 o módulo lazy de aproximadamente 496 KB precisava baixar/validar antes de abrir a tela. O handler base não encaminha OK recebido somente por `irkeypress` no launcher. Além disso, um OK duplicado após abertura imediata pode atingir Voltar e fechar a tela.

Na 6.5.6 o adaptador de aproximadamente 10 KB é parte obrigatória do manifesto. A tela abre imediatamente por OK/IR; o userscript upstream de 475.886 bytes carrega depois, com SHA-256, cache verificado e timeout de 30 s. O mesmo comando físico duplicado não fecha a tela. Download/integridade/sandbox/erros de página continuam visíveis no Diagnóstico, com saída funcional. O módulo adaptador também tem hash no feature loader para recuperação.

O upstream continua sendo NicholasBly/youtube-webos 0.8.4. Não foram alterados WebKit, TLS, kernel ou decoder. A origem do iframe permanece isolada do storage IPTV. Reprodução real na Philco e compatibilidade de APIs/CORS do YouTube permanecem não confirmadas.

## Evidência

- `tests/beta56-6-5-6.network.cjs`: 12 cenários com XHR/relógio/conta simulados. Inclui HTTP 200 com diagnóstico plain text/HTML/JSON, BOM, 403, expiração, saída, parser HTTPS, nova configuração sem apagar dados, limite de tentativas e fluxo completo UI+core+guard carregando categoria/canal após falha do bridge.
- `tests/beta56-6-5-6.youtube.cjs`: 4 cenários de IR, OK duplicado, abertura antes de download, saída durante download, integridade, timeout visível e cache.
- `tests/beta56-6-5-6.browser.cjs`: Chromium headless 1280×720, regressão de renderização/filme/seis episódios e abertura por IR+keydown duplicado; userscript real compilado contra página sintética, isolamento de storage e avanço de relógio de mídia simulado.
- Regressões existentes de retomada 6.5.4 com UI 6.5.5, recuperação VOD, renderização e live são mantidas no workflow 6.5.6.
- Integridade bytes/SHA-256 e parse ES5 dos 49 módulos e do userscript separado.

Não houve teste real da conta/CDN: a consulta ao servidor foi bloqueada pela revisão automática por transmitir credenciais por HTTP a um host externo ainda não verificado. Não foi tentado contornar esse bloqueio. Os testes usam credenciais fictícias em `fixture.invalid`, sem acesso a contas externas.

## Publicação

Preparar código, manifesto ativo/arquivado e relatório mantendo o marcador 6.5.5; conferir blobs remotos e CI; ativar `version=0.56-beta.6.5.6` em commit separado. Na TV: Atualizar, fechar/reabrir completamente o Player 1, conferir 6.5.6 no Log, abrir M3U e YouTube beta. Nenhuma limpeza dos dados do usuário é necessária.

## Conferência remota

Runtime preparado em `2ac820e53f520753544658a74f902f06d92a9ed2`, com proteção adicional de eventos de saída em `09966436e95fcbd54bbc1770fdc56bd25312a6d7`. Foram conferidos no remoto os blobs Git dos 49 módulos e do userscript separado, correspondendo aos arquivos locais validados.

[Validação 6.5.6 aprovada, incluindo browser, rede e OK/IR](https://github.com/HyakkimaruPY/remote-tv/actions/runs/40914726640). [Gate geral Philco aprovado](https://github.com/HyakkimaruPY/remote-tv/actions/runs/40914726651). A ativação do marcador 6.5.6 é feita em commit separado posterior a estas verificações; não significa confirmação física na TV.
