# Philco 0.56-beta.6.5.2 — Portal, foco e diagnóstico do live

Base: `46c8021eda11b5e8f8d3d237b67f522325c4c57f`, 24/10/2026.
Alvo: PH32C10DSGWVA. Sem alterações na árvore LG, firmware ou configuração externa.

## Relato físico e interpretação

O usuário observou Portal vazio, ícones adjacentes menores nos Apps, melhor resposta
da interface e interrupções recorrentes no live. São observações físicas válidas;
a causa da mudança nos ícones ainda não está demonstrada. O CSS do documento WebKit
não constitui, sozinho, prova de alteração da CommUI de outro processo.

O Portal 6.5.1 só registrava seu único módulo depois de capacidades e status
responderem com sucesso. Qualquer falha ocultava o módulo sem explicação. Logo,
Portal vazio não distingue bridge ausente, endpoint 404, AppMgr ausente ou timeout.

## Portal: módulos e limites

| Módulo | Quando aparece | Ação real |
| --- | --- | --- |
| Portal e Apps — verificar ponte | Sempre que o gerenciador carregar | Testa 8765/8766, mostra a falha de cada ponte e permite nova tentativa |
| Ponte nativa WebKit — inspecionar | Sempre | Inspeciona métodos de objetos conhecidos; informa ausência, sem executar comandos proprietários |
| Celular e QR — ponte local | `/health` do companion confirmado | Mantém o teclado e o pareamento existentes, agora na aba correspondente à integração externa |
| Hello World — Apps nativos | API Portal + AppMgr confirmados | Registro e remoção reais existentes; não simula um ícone nativo dentro do HTML |

`Verificar` é uma ação de diagnóstico, sem um interruptor fictício de ativação.
O texto acima das linhas explica o resultado mesmo quando Hello World é incompatível.
Uma nova verificação pode descobrir suporte sem reabrir o player.

A descoberta pode alternar entre as duas pontes; uma mutação POST nunca é repetida
na segunda ponte após falha/timeout. Após resposta interrompida, a UI consulta o
estado. Fechar ou trocar a aba durante uma mutação não abandona sua reconciliação
e não permite ao callback recuperar o foco. Probes cancelados invalidam callbacks.

## Consolidação e navegação

- Os testes de rede e HTTPS foram concentrados em `Rede e HTTPS`, com uma passagem
  pela ponte e uma chamada HTTPS por teste. Não é inspeção de certificado TLS.
- Compatibilidade de UI passou para Injeção; o companion passou para Portal.
  Scheduler/compositor/efeitos continuam separados porque desempenham funções
  distintas. Não há duas cópias ativas do mesmo módulo no manifesto.
- Preferências de módulos temporariamente ocultos permanecem no storage ao salvar.
- Esquerda em qualquer categoria live/Filmes/Séries alcança o cabeçalho, sem subir
  dezenas de categorias. A partir dele, Favoritos é acessível por esquerda/direita;
  baixo retorna ao elemento de origem, se ele ainda pertencer à mesma tela/tipo.
- Bordas do cabeçalho consomem a direção e não caem no navegador espacial genérico.
- O CSS principal e o orçamento extra de 10 MiB da 6.5.1 foram preservados.

## Live: mudança limitada e experimento reversível

A confirmação inicial de reprodução repetia mode/rectangle/refresh da superfície
nativa. Agora a mesma instância/modo configura a geometria uma vez; confirmar
reprodução só revela alpha. Uma troca explícita preview/tela cheia ainda aplica
uma nova geometria. O cache é liberado junto do player.

Isso remove uma transação redundante, mas não prova solução para todas as pausas.
O módulo `Live — buffer e relógio` lê contadores passivos já coletados pelo monitor:
motor, esperas, duração de esperas concluídas, espera atual e relógio exposto.
Não adiciona polling nativo nem pedidos de rede por amostra; não registra URLs.

`Live — comparar HLS direto` é um experimento desligado por padrão. Ativado, apenas
a próxima abertura de canal tenta HLS do provedor antes do AutoHLS 720/1080. Todos
os fallbacks permanecem. Não transcodifica, altera limites nativos nem reinicia a
sessão atual. Desativar restaura a prioridade anterior na próxima abertura.

## Arquitetura: evidência consultada e alcance

Fontes do corpus `HyakkimaruPY/philco-estudos`, branch `feature/philco-portal-bridge`:

- `hardware/soc/README.md`: ELF32 MIPS little-endian no corpus; não identifica
  sozinho a revisão comercial exata do silício.
- `hardware/memory/README.md`: mapa declarado com 256 MiB, reserva DirectFB de
  52.428.800 bytes e regiões de vídeo/JPD sobrepostas. Reserva não equivale a uso
  medido; não ampliar buffers gráficos por tentativa.
- `docs/ui/02-mwb-qtwebkit.md`: Qt 4.8.2 / AppleWebKit 537.4, composição acelerada,
  vídeo acelerado desativado no WebKit, integração com perfis locais/QWS.
- `decompiled/applications/MstarLauncher/EVIDENCE.md`: janelas MIPS e símbolos reais
  de toggles de storage/plugins/imagens e integração com o launcher; métodos
  encontrados no binário não garantem sua exposição ao documento atual.
- `docs/ui/06-application-registration.md`: formato AppMgr em `/Customer/app.cfg`;
  um registro não prova que toda lista visual da CommUI o enumere imediatamente.
- `reverse-engineering/media/PLAYER_STARTUP_AND_DISPLAY_TRANSITIONS.md`: eventos
  insufficient/sufficient, thresholds regulares reconstruídos em 128/640 KiB,
  gate inicial `min(option_0x10, U64Size[2].low)` e reaplicação de crop por
  `MPLAYER_START_DISPLAY`. Esses caminhos exigem teste físico, não ajuste especulativo
  de RAM nem reinícios periódicos do decoder.

Os caminhos acima ficam sob `estudo-philco/`. Assembly/WASM do gerenciador calcula
foco e transições; sua ativação não comprova acesso direto a registradores MStar.

## Verificações e publicação

- `tests/beta56-6-5-2.refine.cjs`: 11 cenários PASS no host, incluindo 48 módulos
  com bytes/SHA-256 e parse ES5; bridge indisponível, descoberta posterior, POST
  único, cancelamento, estado após fechar/trocar aba, foco, rotas, geometria e
  contagem de duas esperas nativas sem reiniciar playback.
- Regressões executadas contra app/UI da candidata: live (6 + 17 checks), VOD/HLS
  (10 cenários) e artwork (19 checks), PASS. Mocks/DOM não medem streaming real.
- Browser local não executado: o download do Chromium retornou arquivo inválido.
  O workflow 6.5.2 executa layout/foco a 1280×720 em Chromium e guarda captura como
  evidência de host; o resultado remoto deve ser conferido antes da ativação.
- CI de preparação confirmada em `e22f1731e11f494bbd05c3f3b9e530d8f86c692d`:
  workflow 6.5.2 e gate geral Beta 6 PASS. A captura 1280×720 foi inspecionada:
  duas verificações visíveis, causas por porta, foco único e rodapé sem corte.
  O rótulo dos módulos de inspeção indica diagnóstico sob demanda, sem sugerir
  que um bridge nativo ausente tenha passado no teste.
- 6.5.1 preservada em arquivos/manifesto arquivados. Preparar o manifesto 6.5.2,
  verificar o commit remoto/CI e publicar `version` por último, em commit separado.

## Gate físico seguinte

1. Reabrir e confirmar `0.56-beta.6.5.2` no Log.
2. Em Portal, ler as causas 8765/8766 e verificar a ponte novamente. Sem API nativa,
   os diagnósticos aparecem, mas Hello World continua indisponível.
3. Categoria distante do topo → esquerda → Favoritos → baixo: retornar à origem.
4. Comparar o mesmo canal por pelo menos um minuto em AutoHLS e, após nova abertura,
   HLS direto; observar o diagnóstico do live, sem atribuir ganho antes do teste.
5. Com API compatível, executar o ciclo Hello World de registro, abertura, remoção
   e reboot. Ícones menores, isoladamente, não confirmam esse ciclo.
