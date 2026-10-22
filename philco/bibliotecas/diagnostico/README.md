# diagnostico

Coleta eventos e erros de interface somente quando habilitada, sem credenciais; teste mostra contadores e duração.

Fonte: `src/module.js`. Especificação: `SPEC.md`. Binário WASM independente não é necessário neste módulo; operações computacionais de diagnóstico podem usar `../nucleo-wasm/dist/core.wasm` via gerenciador, somente quando compatível.

Licenciamento e integração: consultar `../SPEC.md` e `../beta6.4-plan.md`. A desativação nunca deve modificar decoder, configurações do firmware, certificados nem a memória persistente do catálogo.
