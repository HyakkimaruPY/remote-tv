Remote TV — Philco beta 6.5.1 companion fallback

Conteúdo:
- philco-localhost-mipsle-beta651: ELF MIPS32 little-endian estático
- philco-localhost-mipsle-beta651.sha256: checksum do ELF
- install-beta651.sh: instala de forma reversível em /Customer/remote-tv
- start-beta651.sh: inicia com retry leve enquanto a rede sobe
- uninstall-beta651.sh: remove o companion e apenas o bloco marcado do /Customer/setup.sh

Uso na TV (shell local autorizado):
  chmod +x install-beta651.sh start-beta651.sh uninstall-beta651.sh
  sh ./install-beta651.sh

Remoção:
  sh ./uninstall-beta651.sh

O instalador:
- não substitui /Customer/setup.sh inteiro;
- cria backup inicial em /Customer/remote-tv/setup.sh.before-beta651;
- evita bloco duplicado ao reinstalar;
- verifica SHA-256 se sha256sum existir;
- instala o serviço loopback 127.0.0.1:8766 e a interface de pareamento LAN :8767.

Supervisor atualizado em 24/10/2026:
- mantém PID do supervisor no lock e apenas uma instância ativa;
- ao receber TERM/INT/HUP, encerra e aguarda o processo filho antes de liberar o lock;
- a espera de retry também pode ser interrompida;
- a desinstalação remove o executável antes de encerrar os processos, impedindo novo disparo.
Esses scripts pertencem ao pacote auxiliar; atualizar o HTML não os instala na TV.

O Portal privilegiado permanece somente no listener loopback.
A API web prefere o bridge 8765 do firmware quando ele tiver suporte Portal e usa 8766 apenas como fallback.

Teste físico mínimo:
1. Abrir Remote TV > Bibliotecas > Portal.
2. Confirmar que Hello World · Apps nativos aparece.
3. Ativar e retornar à lista de Apps Philco.
4. Abrir Hello World.
5. Voltar ao Remote TV, desativar e confirmar remoção.
