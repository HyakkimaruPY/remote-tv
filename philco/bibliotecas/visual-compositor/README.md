# Visual Compositor

Biblioteca visual reversível da Beta 6.5. Mantém transições curtas somente em propriedades baratas (`background`, `border`, `opacity`) e promove apenas overlays grandes para uma camada WebKit quando ativa. A intenção é aproveitar a composição acelerada já presente no firmware sem substituir DirectFB/GOP/GFX.

Pode ser desativada em **Bibliotecas** sem reiniciar; a folha de estilo e a classe de runtime são removidas imediatamente.
