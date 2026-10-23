# Philco Beta 6.4.1 — correção de foco, controle, busca e Assembly

Base congelada: `0.56-beta.6.4`; candidato: `0.56-beta.6.4.1` com integridade SHA-256 em `manifest.beta56-6-4-1.json`. Alteração **somente Philco**, sem modificar `Remote TV LG/`, VOD, bridge, certificado ou decoder.

## Causas e correções

1. **Seletor invisível:** o menu 6.4 dependia do foco implícito do WebKit, com estilos potencialmente sobrescritos pelos temas. O novo `manager.beta56-6-4-1.js` pinta foco e borda da linha explicitamente com CSS `!important`, `aria-selected` e identificação “Selecionado: ...”. A rolagem posiciona a linha selecionada dentro da área visível.
2. **Reiniciar inacessível:** o rodapé estava depois de lista rolável e a navegação não garantiu visibilidade. O novo painel fixa **Reiniciar motores / Voltar** num rodapé independente, com passagem pelas teclas ↑ ↓ ← →, navegação circular e saída por Voltar. Teclas IR e keydown são consumidas na captura enquanto o painel está aberto; o Xtream não move a tela de fundo.
3. **Botão vermelho sem propagação IR:** `xtream-ui.beta56-6-4.js` não incluía o código `403` no filtro IR → evento de teclado. `xtream-ui.beta56-6-4-1.js` inclui a tecla vermelha, preserva o redirecionamento do IR, evita eventos duplicados e registra o último código IR em `RemoteTV.lastIRKeyCode64` para diagnóstico. **403 é o mapeamento implementado**, não uma comprovação física do código enviado pelo controle MStar. Se o código nativo for outro, utilizar o botão de Busca e capturar um log da tecla para adaptar.
4. **Busca de contingência:** `r14search64` é o último botão do cabeçalho do M3U/Xtream, depois de Log. Só fica visível, focável e clicável quando `PhilcoSearch64.enabled()` era verdadeiro no boot aplicado. Desativar a biblioteca e reiniciar oculta o botão. O botão chama a mesma interface contextual sem depender do IR vermelho. O mecanismo de busca categoria-específica continua intocado.
5. **Assembly auxiliar:** pasta `philco/bibliotecas/assembly-navigation/`. Fonte Assembly WebAssembly Text (`src/navigation.wat`), binário WASM de 122 bytes em Base64 versionado (`dist/navigation.wasm.base64`), ES5 fallback e contrato de módulo. Exporta `next_focus`, `accept_key` e `needs_restart` para seleção circular, rejeição de repetição de tecla e classificação da alteração que precisa de reinício. Pode ser desativado no painel (uso imediato do fallback ES5). Sem importações nativas ou acesso ao firmware.

## Reprodução original
Arquivos e hashes de `xtream-lazy-core`, `xtream-vod-player`, `common-player-ui`, `autovod`, `hlsjs-loader`, `graphos-skin` e `style` são os mesmos da Beta 6.4. A UI Xtream recebeu apenas o botão/roteamento de IR/guardas de modal.

## Compatibilidade do aplicativo

O gerenciador detecta suporte a WebAssembly e utiliza fallback ES5 quando necessário. A atualização remota atua somente no aplicativo.

## Verificações

- `tests/beta56-6-4-1.focus.cjs`: 31 tamanhos+hashes, parse ES5 de todos scripts, WASM de Assembly válido, exportações, correspondência do binário embutido, foco explícito, acesso ao rodapé e tecla Voltar, de-bounce, fallback, botão Busca habilitado/oculto, último botão na dock, encaminhamento IR vermelho 403, bloqueio do player no modal.
- `tests/beta56-6-4.integration.cjs`: histórico da 6.4, rede do celular e busca categorizada.
- `tests/beta56-6.live.cjs`, `tests/beta56-5.live.cjs`, `tests/beta56-5.vod.cjs` e `tests/beta56-5.artwork.cjs`: regressão da interface candidata sem atualizar o firmware.

**Validação pendente no dispositivo:** testar botão vermelho real/IR, leitura do destaque e duração de reprodução VOD/ao vivo na Philco. GitHub Actions valida software e mocks, não controla a TV física. Não apagar cache, favoritos ou histórico para testar.

## Procedimento remoto
Manifesto arquivado da 6.4.1 e `manifest.json` devem ter conteúdo idêntico. Publicar `version=0.56-beta.6.4.1` **por último**, somente depois do CI do manifesto preparado. A televisão deve exibir Beta 6.4.1 depois de Atualizar/reabrir. O rollback preserva `manifest.beta56-6-4.json` e não toca nas credenciais.
