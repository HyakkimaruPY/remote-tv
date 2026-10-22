# estabilidade

Watchdog passivo da thread de interface com detecção de atraso; não mexe em reprodução, busca ou reconexões.

Fonte: `src/module.js`. Especificação: `SPEC.md`. Binário WASM independente não é necessário neste módulo; operações computacionais de diagnóstico podem usar `../nucleo-wasm/dist/core.wasm` via gerenciador, somente quando compatível.

Licenciamento e integração: consultar `../SPEC.md` e `../beta6.4-plan.md`. A desativação nunca deve modificar decoder, configurações do firmware, certificados nem a memória persistente do catálogo.
