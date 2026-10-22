# Especificação mínima de módulo Philco v1

Cada módulo declara id, version, category, entry, runtime, capabilities, restartRequired, defaultEnabled, minHostVersion, integrity e failurePolicy. Categoria: diagnostic, stability, network, feature, render, optimization.

Estrutura:
```
philco/bibliotecas/<id>/
  module.json
  README.md
  SPEC.md
  src/       # fonte C/C++/Rust/etc.
  dist/      # .wasm real, se compilado
  tests/     # testes de compatibilidade e falha
```

Estados: disabled -> checking -> enabled -> degraded/failed -> disabled. Falhas devem ser registradas sem interromper reprodução. Reinício apenas para hooks que alterem ciclo de vida, player, navegação ou renderização. Ativação de configuração persistente deve ser atômica e reversível.

Segurança: interface de capacidades mínima, limite de memória/tempo, sem armazenamento de senhas nos logs, autenticação para controle remoto, checksum de artefatos e isolamento por módulo.

Aceitação: ligar/desligar, reiniciar quando necessário, recuperar falha, restaurar configuração anterior e verificar que a reprodução original segue intacta.
