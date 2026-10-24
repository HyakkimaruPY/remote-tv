# Remote TV 0.56-beta.6.5.1 — WebKit, Injeção, Render e Portal

Data: 24/10/2026  
Hardware alvo: Philco PH32C10DSGWVA / MStar 6308  
Base remota: 0.56-beta.6.5  
Escopo: Philco. A árvore LG não faz parte desta alteração.

## Objetivo

A 6.5.1 divide o centro de Bibliotecas em quatro domínios:

1. **Sistema** — diagnóstico, rede, busca, IR, estabilidade, companion e otimizações de runtime.
2. **Injeção** — extensões que acrescentam capacidades ao documento QtWebKit sem substituir o navegador.
3. **Renderização** — scheduler, compositor, texturas e superfícies opcionais com orçamento visual.
4. **Portal** — módulos que atravessam a fronteira do launcher e registram extensões no ecossistema nativo da TV.

Bibliotecas incompatíveis não são exibidas. Cada módulo deve provar a capacidade mínima antes de ser registrado.

## Evidência do QtWebKit stock

O estudo do firmware identifica Qt 4.8.2 / QtWebKit 2.2 / AppleWebKit 537.4 e confirma no binário real:

- QWebFrame::addToJavaScriptWindowObject;
- QWebFrame::evaluateJavaScript e QWebElement::evaluateJavaScript;
- QWebSettings::setUserStyleSheetUrl;
- QWebPage::setPluginFactory / QWebPluginFactory;
- QWebFrame::render por região;
- QWebPage::setHardwareLayerSize.

O MstarLauncher contém ainda mstarExt / MStarExtFactoryConcrete; loadPage, unloadPage, launchApp, forceGC, setGeometry, whoami e Cmd; toggles de accelerated compositing, tiled backing store e spatial navigation; MemoryManager e integração WebAppMgr.

O MWB-config.xml confirma requestAnimationFrame, accelerated compositing para transform/animation/canvas, WebGL habilitado, local/offline storage, application cache e spatial navigation. Também confirma limites: CSS Grid/variables ausentes, WebAudio desligado, Fullscreen API desligada e accelerated filters desligados.

A 6.5.1 não finge atualizar o engine. Ela cria uma camada moderna compatível em cima das primitivas comprovadas.

## Injeção

Módulos candidatos:

- modern-ui: helper ES5 para classes, RAF e transforms;
- webkit-injector: injeção local e reversível de JS/CSS no documento;
- offline-store: armazenamento WebKit limitado, com teto próprio de 512 KiB;
- vendor-bridge: só aparece se um objeto nativo com métodos compatíveis com mstarExt for realmente detectado.

Nenhum comando proprietário é executado apenas para descobrir a ponte.

## Renderização

Orçamento máximo declarado para superfícies/FX adicionais: **10 MiB**.

Esse valor é um orçamento controlado pelo Remote TV, não uma alegação de medir todo o heap do QtWebKit. O engine stock não expõe ao JavaScript uma medição confiável do RSS total.

Módulos: scheduler por RAF/fallback; compositor restrito a transform/opacity; gradientes/textura sem PNG adicional; blur opt-in; Canvas2D opt-in com superfície limitada; WebGL opt-in somente quando um contexto real puder ser criado.

Cada módulo reserva orçamento antes de iniciar e libera a reserva ao parar.

## Launcher

Os seis cards não carregam mais uma frase secundária permanente. A descrição aparece somente no painel direito quando o card recebe foco. Isso elimina colisão entre título e texto explicativo e reduz conteúdo simultâneo na Home.

## Portal: Hello World

O primeiro experimento do Portal registra um app chamado **Hello World** na infraestrutura nativa da Philco.

A evidência stock mostra que /Customer é gravável; /applications é SquashFS somente leitura; o AppMgr é iniciado por bigbang com /Customer/app.cfg; CommUI usa APM_RequestToReadApp, APM_RequestToRegisterAppEx e APM_RequestToRun; e apps Web stock reutilizam /applications/MWB/MstarLauncher apontando para páginas locais.

Por isso o POC não modifica CommUI nem /applications.

### Fluxo

1. probe confirma app.cfg, MstarLauncher, bigbang, appmgr e escrita em /Customer;
2. cria /Customer/apps/remote-tv-portal/hello/index.html;
3. cria uma seção delimitada [RemoteTVHello] em /Customer/app.cfg;
4. preserva backup antes da primeira instalação;
5. termina somente o processo appmgr;
6. espera o bigbang criar um novo PID do AppMgr;
7. só então confirma ativação;
8. ao desativar, remove a seção, reinicia o AppMgr e apaga a página somente depois do sucesso;
9. se o restart falhar, o app.cfg anterior é restaurado.

O app reutiliza o MstarLauncher stock e abre file:///Customer/apps/remote-tv-portal/hello/index.html.

## Bridge

O cliente 6.5.1 tenta Portal primeiro em 127.0.0.1:8765, bridge nativo do firmware modificado, e depois em 127.0.0.1:8766, companion modular de fallback.

A API é a mesma:

- GET /portal/capabilities
- GET /portal/hello/status
- POST /portal/hello/enable
- POST /portal/hello/disable

Requisições privilegiadas exigem X-Remote-TV-Portal: 651 e origem local/file/loopback.

O módulo Hello World nem aparece na aba Portal se o probe não confirmar suporte.

## Estado de validação

remote-tv:

- manifesto candidato: 47 módulos;
- SHA-256/bytes verificados;
- ES5 verificado;
- quatro abas e foco testados em DOM;
- módulo localhost ocultado quando /health falha;
- Portal async com rollback testado;
- companion Go testado;
- cross-compile Linux MIPSLE soft-float testado;
- live/VOD/artwork sem regressão.

philco-estudos:

- patch do bridge 8765 está isolado em feature/philco-portal-bridge;
- o Actions desse repositório está encerrando jobs novos antes do primeiro step nesta sessão;
- por isso o patch 8765 não deve ser tratado como firmware validado até um build do bridge realmente executar ou o hardware ser testado.

## Gate físico

1. abrir Remote TV;
2. entrar em Bibliotecas → Portal;
3. confirmar que Hello World · Apps nativos aparece somente com bridge compatível;
4. ativar;
5. sair para a Home/Apps Philco;
6. confirmar item Hello World;
7. abrir e confirmar a página local;
8. voltar ao Remote TV;
9. desativar;
10. confirmar remoção na lista de Apps;
11. reboot e validar que nenhum estado parcial ficou preso.

Não promover o bridge 8765 como firmware estável antes desse ciclo.
