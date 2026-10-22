# Philco Beta 6 Recovery — rollback controlado de motores com WebAssembly opt-in

Data: 22/10/2026. Base anterior `0.56-beta.6.2`; nova release `0.56-beta.6.3` (`2026.10.22-beta.56.6.3`).

## Plano e referência
- `manifest.beta56-6.json`: restauração **por hash e caminho** de `system/readable/xtream-ui.beta56-6.js` original (algoritmo 3/10/25 s); demais 5 módulos críticos Xtream/VOD permanecem idênticos.
- `manifest.beta56-6-2.json`: manter `style.beta56-6-2.css` e `graphos-skin-beta56-6-2.js` (tema #000 e transparência do vídeo).
- `REMOTE_UPDATE_ARCHITECTURE.md`: novo `release` com hashes; não apagar `remote-tv.active.v2`, `previous`, `staging`, favoritos, histórico ou credenciais. `version` só depois do CI.
- `apps/player1/shell.beta56-6-3.html`: botão Bibliotecas ao lado do Atualizar.
- `system/readable/diagnostic-libraries.beta56-6-3.js`: gerenciador ES5 carrega um classificador WebAssembly de 104 bytes somente no menu, com fallback ES5; dois diagnósticos opcionais: bridge/rede e HTTPS via bridge.
- Testes são executados sob demanda; desativar cancela requisições correntes. Futuros módulos locais confiáveis podem registrar `RemoteTV.libraryManager.register({id,title,test,enabled})`, sem download arbitrário de scripts.
- Botão Reiniciar motores libera sessão via `RawPlayer.close()` e recarrega a página sem apagar dados salvos. Limpeza de drivers, decoder ou arquivos do firmware **não é possível** pelo runtime web; a promoção de uma nova release evita executar módulos antigos no próximo boot validado.

## Limitações
O WebAssembly **não faz sockets nem TLS diretamente**; a rede é executada por `RequestScope`/bridge do Player e o classificador Wasm qualifica o resultado. HTTPS OK prova apenas acesso via transporte disponível, não validade da cadeia de certificados nem inspeção de handshake. Em WebKit sem Wasm, status ES5 compatível.

## Evidência
`tests/beta56-6-3.recovery.cjs`: verifica 23 hashes, módulos originais, tema, parse ES5, Wasm real, registro, controles e ausência de sondagens no boot. Workflow Philco executa também recovery LIVE, regressões VOD e artwork. Reprodução física, carregamento da playlist e TLS real seguem dependentes de teste na TV.
