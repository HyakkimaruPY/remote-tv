# Assembly para navegação da Philco (Beta 6.4.1)

Módulo independente e reversível: atua exclusivamente no cálculo de foco, repetição de teclas e classificação de reinício dentro do gerenciador de bibliotecas. O código Assembly está em `src/navigation.wat`, o binário WASM compilado (122 bytes) é publicado como `dist/navigation.wasm.base64` e embutido como bytes equivalentes em `manager.beta56-6-4-1.js`. Decodificar com `base64 -d navigation.wasm.base64 > navigation.wasm` para obter o arquivo .wasm, ou recompilar com `wat2wasm src/navigation.wat -o dist/navigation.wasm`.

A biblioteca é **ativável/desativável** sem reiniciar. Com WebAssembly indisponível no QtWebKit, o ES5 executa a mesma semântica. Não escreve no firmware, não injeta binários MIPS, não reinicia a TV e não exige privilégio elevado.

Referência de compatibilidade: `HyakkimaruPY/philco-estudos/decompiled/libraries/web/QtWebKit-4.8.2/` e documentação da API WebAssembly (MVP, chamadas de exportação via JavaScript quando disponível).
