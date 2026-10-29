# Rollback solicitado — 6.5.5

Base: f8f39e718cd3a2c3c442c7526bbba17b3d56e638 (6.5.7).
Destino: manifesto integral da release 6504ba798835f70ba6113ddbd870f8c3f89692d8 (0.56-beta.6.5.5).

Pedido: retornar à versão terminada em 5, anterior às builds 6.5.6 e 6.5.7 que o usuário relatou terem quebrado o player.

Alteração: restaurar somente manifest.json e, após conferência remota, version. Módulos anteriores permanecem intactos. Sem alteração de firmware, API externa, credenciais ou armazenamento de favoritos/progresso.

Verificação executada: conteúdo de todos os 48 módulos lido do SHA base por conector GitHub; bytes UTF-8 e SHA-256 calculados localmente com Python hashlib e comparados com o manifesto original 6.5.5: PASS 48/48. Módulo YouTube lazy player-beta56-6-5-5.js conferido separadamente: SHA-256 5bbf9e2d369b741949651ced4fb4a574a0446e8052043809cc6e1696fac2d1dd, conforme feature-loader. Nenhum módulo 6.5.5 foi modificado entre o destino e a base.

Gate: REMOTE_UPDATE_ARCHITECTURE.md documenta comparação por igualdade de version com a cópia ativa, portanto mudança para marcador anterior dispara staging. Force-update preserva active/previous e recarrega após observar release diferente; sem limpeza de storage. O bootstrap instalado na TV não está neste checkout: sua aplicação física permanece pendente.

Publicação: manifesto restaurado em c230f20925a6366b1d64e8a4188f8fd3390c9303; version deve ser ativado por último com 0.56-beta.6.5.5 após reler manifesto e árvore remotos. Histórico Git preservado, sem force-push.

Limite: verificação de integridade e inspeção do contrato de atualização; não houve novo teste funcional de reprodução nem teste físico na TV. Após ativação: selecionar Atualizar, fechar/reabrir totalmente Player 1 e conferir release 2026.10.29-beta.56.6.5.5 no Log.
