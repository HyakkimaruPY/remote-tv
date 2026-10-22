# Philco — módulo Assembly WASM de controle de módulos

Fonte: `src/navigation.wat` (WebAssembly Text Format, Assembly de pilha tipada). Binário: `dist/navigation.wasm.base64` (base64 dos 122 bytes WASM validados). Reconstruir o binário com `base64 -d dist/navigation.wasm.base64 > dist/navigation.wasm` ou compilar `wat2wasm src/navigation.wat -o dist/navigation.wasm`.

Exportações: `next_focus(index,delta,count)` (índice circular ou -1 para lista vazia), `accept_key(now,last,interval)` (antirrepique unsigned de 32 bits) e `needs_restart(requested,running,requires)` (bit de alteração para módulo que requer reinício). Sem imports nem privilégios. Não intercepta teclas por si só; o JavaScript ES5 integra o controle e o watchdog existente sem alterar o decoder. Em QtWebKit antigo sem WebAssembly, usa funções ES5 equivalentes.

Não é um módulo nativo MIPS carregado no kernel/firmware. Assembly MIPS exigiria cross-compilação, permissões, ABI de firmware e instalação nativa, que não são fornecidas pelo manifest remoto e não devem ser presumidas.

Teste de aceitação: `WebAssembly.validate`; next_focus(0,-1,5)=4; next_focus(4,1,5)=0; accept_key(1000,900,80)=1; needs_restart(1,0,1)=1. O mesmo resultado deve aparecer no fallback ES5.
