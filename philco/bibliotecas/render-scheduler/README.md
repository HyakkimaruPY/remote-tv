# Render Scheduler

Biblioteca reversível da Beta 6.5. Agrupa trabalho cosmético de DOM em um único frame usando `requestAnimationFrame` quando disponível no QtWebKit e `setTimeout(16)` como fallback. Não toca em decoder, stream, TLS, kernel ou superfícies nativas.

Pode ser desativada em **Bibliotecas** sem reiniciar. Ao desligar, chamadas novas executam de forma direta e a fila pendente é descartada.
