# Integração segura — ainda não instalada no player

Inserir na página Philco, em ordem: runtime.js; diagnostico/src/module.js; estabilidade/src/module.js; rede-ssl/src/module.js; busca-contextual/src/module.js; loader.js. Adicionar botão existente ou novo que chame PhilcoModulesUI.open(). NÃO instalar no projeto LG.

Adaptador obrigatório para busca: window.PhilcoSearchAdapter={currentCategory:function(){return 'c'|'m'|'s';},search:function(type,query,callback){ /* consultar catálogo local e devolver lista */ },open:function(type,item){ /* navegação normal do player */ }}. Adaptar à API real antes de habilitar.

A busca via smartphone/QR exige servidor local autenticado e gerador de QR, não incluídos neste protótipo. Não abrir endpoint sem autenticação. Botão vermelho usa keyCode 403; confirmar mapeamento real no controle. Testar foco e tecla de retorno.

O runtime ES5 é um gerenciador JS de módulos, NÃO um núcleo WASM. Para um núcleo WASM real, compilar código fonte e validar WebAssembly.instantiate no WebKit da TV ou usar runtime nativo autorizado. Nenhum binário falso é entregue.

Rollback: remover referências dos scripts e limpar a chave localStorage philco.modules.v1. A base original não deve ser sobrescrita.
