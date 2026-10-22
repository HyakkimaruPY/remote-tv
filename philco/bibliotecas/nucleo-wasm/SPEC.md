# Núcleo WebAssembly de diagnóstico

Binário WASM real compilado de `src/core.c` para `dist/core.wasm` (wasm32, C freestanding). Exporta `classify(status,latency)` e `quality(stalls,errors,delay_ms)`. Não tem acesso a rede, armazenamento nem player; a ponte ES5 fornece métricas numéricas. Sem suporte WASM no QtWebKit, o controlador usa funções ES5 equivalentes e mantém o player intacto.

Compilar: `clang --target=wasm32 -O2 -nostdlib -Wl,--no-entry -Wl,--export=classify -Wl,--export=quality -Wl,--strip-all -o dist/core.wasm src/core.c`. Testar com WebAssembly.instantiate e valores conhecidos. Runtime WebAssembly no firmware requer teste físico.
