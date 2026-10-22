# Contrato de integração com Xtream UI

Não acessar viewState diretamente: é variável privada em system/readable/xtream-ui.beta56-6.js. Criar uma API explícita e testável no escopo dessa UI: currentCategory(), search(type,q,callback), open(type,item), close().

A busca deve usar catálogos completos carregados por Xtream, não apenas viewState.items da categoria atual. Ao selecionar um canal, restaurar a categoria pai e filha, o foco do canal e o preview original; para filmes e séries, reutilizar a função existente de detalhes. Ao sair dos detalhes, restaurar o feed inicial.

A tecla vermelha pode chegar como 403 ou evento IR proprietário; verificar no hardware e respeitar player fullscreen, input e outros diálogos. O módulo não pode sequestrar teclas com a busca desativada.

Smartphone: requer listener HTTP LAN no serviço auxiliar, token aleatório curto e expirável, limite de requisições, pareamento confirmado na TV e URL codificada no QR. Não expor credenciais Xtream no QR ou endpoint.
