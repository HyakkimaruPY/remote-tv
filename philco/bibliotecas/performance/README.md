# Renderização leve · versão 6.4.2

A renderização da busca fica limitada a 12 cards (2 colunas × 6 itens) e carregamento de no máximo 2 capas a cada 110 ms, para reduzir picos de decodificação na RAM e na thread do WebKit. Ao trocar de página/fechar a busca, a fila de imagens pendentes é descartada. Não altera codecs, buffers nativos nem arquivos do firmware. A API de busca percorre categorias por chamadas HTTP, processa JSON em blocos de 14 mil caracteres por tick e elimina o texto da categoria ao terminar. Não manter catálogo inteiro em memória. **Compactar e descompactar esses dados no JavaScript antigo elevaria o consumo de CPU, e não é adotado sem medições.**

A biblioteca `frame-budget` ativa/desativa o carregamento em lotes. Possui teste leve e não roda sondagens periódicas.
