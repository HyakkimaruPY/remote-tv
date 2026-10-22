# Módulo localhost (6.4.2)

Classe: conexão LAN e funcionalidade opcional; sem reinício de player; não gera servidor dentro do JavaScript e não depende de IP manual. Interface `PhilcoLocalhost642.begin(callback)`, `watch(pair,onText,onClose)`, `close(pair)`, `health(callback)`. Requer sidecar TV-local nativo (não entregue pelo updater remoto). A geração é automática na abertura da busca. Se indisponível, não impedir a navegação nem a pesquisa. QR gira em cada abertura e queima no primeiro acesso HTTP, e `close` revoga a sessão.
