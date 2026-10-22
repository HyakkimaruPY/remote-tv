# Philco Remote TV — Beta 6.2: base preto absoluto

Data: 22/10/2026. Base: `0.56-beta.6.1`. Público-alvo exclusivo: Philco PH32C10DSGWVA, WebKit legado. Não alterar RG/LG, firmware, Player 2 nem Beta 7 (laboratório).

- Estilos remotos versionados: `apps/player1/style.beta56-6-2.css` e `system/injections/graphos-skin-beta56-6-2.js`.
- Fundo `#000000` nos menus, cabeçalhos, catálogos, grades, painéis, placeholders, log e sobreposição de atualização. Controles com foco visível em grafite/cinza.
- Transparência de `html,body`, `#r14.live #r14body`, `#c14body`, vídeo e `#xv14` preservada: fundo opaco poderia cobrir o decoder nativo.
- Preservada a Beta 6: reconexão live 3/10/25 segundos, favoritos, catálogo, progresso, VOD, armazenamento e lógica de atualização não destrutiva.
- `manifest.json` e `manifest.beta56-6-2.json`: os mesmos 22 IDs de módulos; só `style` e `graphos-skin` alterados. Versão `0.56-beta.6.2`; release `2026.10.22-beta.56.6.2`.
- CI `.github/workflows/philco-beta6.yml`: verifica todos os módulos por bytes/SHA-256 e executa testes de tema, parse ES5, atualização, live, VOD e capas.

Ativação segura: criar módulos/manifesto e validar CI antes de mover `version` para `0.56-beta.6.2` em commit separado. No aparelho, reabrir Player 1 e conferir título da versão efetiva `Smart · Beta 0.56.6.2`, telas pretas, contraste e reprodução de vídeo live e VOD. Teste físico permanece pendente; CI não exercita o decoder real.
