# Beta 0.56.2 — preto absoluto e grafite

Base: `d5921cabf83df8966f6826ae1069985ad7dd6ff3` (0.56-beta.1), 19/10/2026.

Atualização visual: painéis em preto `#000000`, superfícies em grafite `#181818`, seleção `#272727` e foco branco. Gradientes discretos em cinza substituem o reflexo azulado; contornos ficam neutros. Cantos dos controles, cards, painéis e modais reduzidos para 3–4 px. Cabeçalho e títulos com hierarquia mais compacta; listas com margens regulares; ações de prévia alinhadas em uma linha, altura de 44 px e recuo de 22 px. Campos, retomada, HUD do VOD e logs usam a mesma paleta. Cores de vídeos, capas e logos do provedor não são alteradas.

Módulos novos: `graphos-skin-beta56-2.js` e `shell.beta56-2.html`. Os outros 19 módulos permanecem idênticos à beta 1; recuperação, reprodução, posições, controle e geometria nativa não foram modificados. A área de vídeo conserva a transparência. Manifestos da beta 1 e da estável 0.55 e seus módulos continuam disponíveis.

Verificações locais:

- Tema interpretado por Acorn em ES5: PASS.
- `node local-lab/test-browser.cjs`: nove verificações PASS em Chromium 1280×720, incluindo boot, painel preto computado, raios de 4 px, controles de 44 px, vídeo sintético, tela cheia, retorno, 35 ações de navegação entre páginas, cancelamento com transporte atrasado, autenticação Xtream fictícia e breve perda de rede.
- Screenshot da prévia inspecionado: cabeçalho, lista e ações alinhados; preto/grafite, sem fundo opaco sobre o vídeo.
- Todos os 21 módulos conferidos em bytes e SHA-256. Comparação com o manifesto da beta 1 confirma alteração de apenas shell e tema.
- `git diff --check`: PASS.

Resultados de browser: `local-lab/results/browser-beta2.json`. O laboratório agora lê `manifest.json`, para validar a release em preparação, e registra a base git real. Esta rodada visual usou o bridge de contrato Python e ABI QJY simulada; o helper Go não foi reexecutado, pois não mudou. Os testes anteriores de reprodução permanecem documentados no relatório da beta 1.

Publicação: código/manifesto primeiro, leitura remota dos blobs e, em commit separado, marcador `version=0.56-beta.2` por último. Nenhum GitHub Actions foi iniciado. A versão anterior segue em `manifest.beta56.json`; a estável em `manifest.stable55.json`. O procedimento de recuperação da beta 1 continua válido.

Na TV, fechar e reabrir completamente e conferir `0.56-beta.2` no Log e “Beta 0.56.2” no menu. Renderização no WebKit e aplicação pelo cache/CDN ainda dependem do teste físico do usuário.
