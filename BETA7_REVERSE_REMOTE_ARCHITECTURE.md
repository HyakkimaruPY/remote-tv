# Beta 7 — controle reverso da Philco via LAN (análise de viabilidade)

Data: 2026-10-21. Escopo: **Philco PH32C10DSGWVA, Player 1 principal**. Não alterar RG, LG, Player 2, versões estáveis ou firmware sem uma release nativa verificada.

## Base e limite confirmado

Versão remota ativa examinada: `0.56-beta.6.1`. O bundle web é atualizável pelo `version` + `manifest.json` e não instala novos serviços, APIs nativas, drivers ou rotinas de captura.

No projeto `HyakkimaruPY/philco-estudos`, o fonte `builds/v7.2/src/hlsbridge_v7_2.go` usa `127.0.0.1:8765` e registra somente `/health`, `/hls`, `/fetch`. Este é o fonte estudado; sua equivalência exata com o binário atualmente instalado ainda precisa ser confirmada. O loopback da TV não é acessível como `localhost` no smartphone. Apenas HTML e JS não conseguem iniciar servidor HTTP LAN, injetar eventos físicos nem capturar com segurança o plano de vídeo da TV.

**Decisão:** não ativar `0.56-beta.7` nem declarar espelhamento funcional até validar um companion nativo. Preservar `version`/`manifest.json` da Beta 6.1 e o cache ativo/previous/staging.

## Protótipo independente desenvolvido

Em 21/10/2026 foi criado um pacote de laboratório separado da release ativa, com:

- Web UI mobile de controle: preview horizontal 16:9; texto/teclado; touchpad com cursor relativo e toque/click; quatro direcionais; Voltar, OK e Início.
- Módulo ES5 de TV: botão `Remoto` inserido após `Atualizar`; overlay de QR Code gerado localmente; solicitação de sessão e polling de comandos; fallback explícito quando companion não está instalado.
- Serviço Go nativo complementar separado, com listener de controle local `127.0.0.1:8798`, e LAN `:8797` aberta só durante sessão autorizada. URL QR `http://IP_DA_TV:8797/#session=TOKEN`, token criptográfico de 192 bits, heartbeat de 2 s, TTL de 15 s após último ping do celular e timeout de 9 s sem polling da TV. A tela QR se fecha ao parear; a porta LAN se fecha após expiração.
- `POST /tv/frame` e `GET /api/screen` são interfaces **reservadas para JPEG nativo**; sem capturador, `/api/screen` retorna HTTP 204. Não existe screenshot ou streaming real neste protótipo.

### Evidência do laboratório (não substitui validação física)

- `go test ./...`: passou cenários de autenticação, rejeição de comandos inválidos, fila, pareamento, origem rejeitada e ausência honesta de frame.
- `GOOS=linux GOARCH=mipsle GOMIPS=softfloat CGO_ENABLED=0 go build`: gerou ELF MIPS32 little-endian estático; **não prova execução no firmware**.
- Teste HTTP real em host: `/tv/open` → `/api/ping` → comando seta para baixo → `/tv/poll` → `/api/screen` (204) → `/tv/end`, passou.
- QR Code gerado por biblioteca JS ES5 e decodificado via OpenCV no laboratório.
- Parse ECMAScript 5 de `remote-entry.beta7.js` e `qrcode-es5.js` com Acorn 5: passou.

Os arquivos do protótipo foram entregues como pacote de laboratório na conversa de 21/10/2026; este documento não afirma que esses fontes estejam incluídos na release ativa.

## Aceitação mínima antes de publicar Beta 7

1. Mapear fonte/binário exato do helper instalado e escolher integração nativa que preserve o ciclo de vida/rollback do firmware.
2. Testar o companion na TV física: RAM, compatibilidade MIPS ABI, portas, sessão via QR e IR/teclas sem duplicação.
3. Implementar captura real composta do WebKit **e** plano de vídeo nativo (DirectFB/GOP/MVOP, conforme arquitetura que for validada), com banda/FPS/segurança adequados. Uma captura apenas do DOM não é espelhamento completo.
4. Testar lado a lado com VOD/live longo, descarte de sessão, Wi-Fi desconectado, retorno ao menu e limpeza segura.
5. Criar arquivos de runtime **versionados**, testes de regressão, hashes SHA-256, manifesto arquivado e ativo; ativar `version` por último e só após verificar os módulos. Não alterar a versão ativa para anunciar um recurso ainda não operacional.

Este é um checkpoint de arquitetura do projeto Philco. Não modifica módulos ou configurações em produção.
