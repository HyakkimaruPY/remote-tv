# Philco — módulos desacoplados

Escopo exclusivo: Philco. Não modificar LG.

## Regras
- O player existente permanece íntegro; módulos são opt-in e falham de forma isolada.
- Nunca afirmar que um módulo é WASM sem um binário .wasm validado e execução comprovada no dispositivo.
- Em QtWebKit antigo, detectar suporte real a WebAssembly antes de carregar; sem suporte, informar incompatibilidade e manter o player funcional.
- Módulos com hooks de navegação/player exigem reinício controlado; diagnósticos isolados podem ser ativados imediatamente.
- Guardar último conjunto estável, oferecer modo seguro, rollback e log com dados sensíveis mascarados.
- Carregamento remoto somente de artefatos versionados com hash, origem permitida e rollback; evitar eval e código remoto não verificado.

## Contrato de cada biblioteca
Cada pasta contém module.json, README.md, SPEC.md, src/ (fonte original) e dist/ (binário WASM compilado quando disponível). Não publicar arquivos .wasm fictícios.

## API proposta
init(host), start(), stop(), health(), dispose(). host oferece somente capacidades autorizadas no manifesto; não há acesso irrestrito ao DOM nem ao player.

## Compatibilidade
Verificar WebAssembly, memória, desempenho, WebKit, rede, CORS e certificado TLS no hardware antes de ativar. WASM não corrige sozinho certificados expirados nem substitui codecs ou drivers.

## Firmware e referências
Investigar o firmware e QtWebKit 4.8.2 documentados em HyakkimaruPY/philco-estudos, incluindo decompiled/libraries/web/QtWebKit-4.8.2/EVIDENCE.md e analysis/connectivity/certificates/README.md. Confirmar achados no aparelho, não inferir suporte WASM pelo sucesso de JavaScript.
