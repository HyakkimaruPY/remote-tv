# Philco Beta 6.4 — plano de integração e critérios de publicação

Base verificada: manifest.json aponta para 0.56-beta.6.3 e 2026.10.22-beta.56.6.3; há um gerenciador de diagnósticos real em system/readable/diagnostic-libraries.beta56-6-3.js com classificador WASM de 104 bytes. A nova arquitetura NÃO deve substituir o WASM real por JS sob a alegação de ser um núcleo WASM.

1. Preservar todos os módulos críticos de reprodução e o rollback da 6.3.
2. Migrar controles de biblioteca para o gerenciador modular, incluindo estado e aviso de reinício; nunca iniciar testes de rede em boot.
3. Integrar busca com os dados de Xtream UI via API pública adicionada à implementação real, evitando scraping de DOM e interceptações globais agressivas.
4. Adicionar QR com serviço pareado e autenticado; se a TV não oferecer endpoint LAN, exibir recurso indisponível sem criar QR falso.
5. Testar no WebKit MStar, incluindo ausência de WebAssembly, controle vermelho, retorno e canais longos; validar reprodução ao vivo e VOD antes de mudar manifest.json.
6. Gerar manifest.beta56-6-4.json com SHA-256 e bytes calculados sobre artefatos exatos; executar CI, revisão e só então promover manifest.json.

Referências: REMOTE_BETA56_6_3_RECOVERY.md; REMOTE_UPDATE_ARCHITECTURE.md; manifest.beta56-6-3.json; system/readable/xtream-ui.beta56-6.js; system/readable/diagnostic-libraries.beta56-6-3.js

Estado: candidata em desenvolvimento, NÃO implantada. A atualização automática deve continuar na 6.3 até validação completa.
