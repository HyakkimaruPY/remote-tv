# Philco Beta 6.5 — Launcher

Data: 24/10/2026  
Base: `0.56-beta.6.4.2` / `cf6fcedc7aefe9c4a46e681119884f2b16476bcf`

## Objetivo

Transformar a entrada do Remote TV em um launcher leve para a Philco PH32C10DSGWVA, modernizar a navegação de categorias e o centro de Bibliotecas e adicionar otimizações visuais reversíveis sem trocar o decoder ou alterar a ABI nativa do player.

O repositório privado de estudo da **Philco** foi usado apenas como referência técnica. Nenhum arquivo da árvore de estudo da LG foi alterado.

## Mudanças

- novo shell 1280×720 em grade 3×2 com acessos a M3U, Busca, Bibliotecas, M3U legado, Atualizar e YouTube;
- correção defensiva de rótulos `MP3` para `M3U`;
- cabeçalho/categorias do player M3U reorganizados com superfícies simples e foco visível;
- centro de Bibliotecas redesenhado com categorias, estado, ação Ativar/Desativar e Testar;
- foco do centro de Bibliotecas passa a usar classes CSS em vez de reescrever `style.cssText` a cada movimento;
- nova biblioteca `render-scheduler`: agrupa trabalho cosmético por `requestAnimationFrame`, com fallback de 16 ms;
- nova biblioteca `visual-compositor`: transições curtas e reversíveis, limitada a propriedades baratas e overlays;
- as duas bibliotecas novas podem ser desativadas sem reiniciar;
- motor principal, Xtream, VOD, HLS, Common Player, GraphOS skin e rotas de reprodução foram preservados.

## Base técnica do firmware

A arquitetura seguiu evidências do estudo Philco: QtWebKit 4.8.2 sobre DirectFB, composição acelerada habilitada, `requestAnimationFrame` disponível, 256 MiB de RAM declarada e pipeline nativo MUF → DirectFB → MStar GFX/GOP. O launcher remoto usa apenas superfícies WebKit compatíveis; nenhuma assinatura de biblioteca MStar ou chamada de kernel foi inventada.

A camada nativa/kernel continua separada porque o manifesto remoto não instala módulos de kernel nem cria uma ABI nova. Qualquer companion nativo futuro deve usar APIs comprovadas e instalação separada, com rollback próprio.

## Validação

Workflow: **Validate Philco Beta 6.5 Launcher**, run `40098616708`.

PASS:
- 38 módulos com bytes/SHA-256 conferidos;
- JavaScript de produção parseado como ES5;
- shell contém M3U e não contém MP3;
- navegação 2D do centro de Bibliotecas;
- scheduler e compositor reversíveis;
- baseline da busca 6.4.2;
- regressões `beta56-6.live`, `beta56-5.live`, `beta56-5.vod` e `beta56-5.artwork`.

## Limite

O CI não substitui a validação física na PH32C10DSGWVA. Após ativação, conferir no aparelho: foco da grade inicial, entrada/saída de Bibliotecas, abertura do M3U, Busca quando habilitada, live, VOD e retorno ao launcher.
